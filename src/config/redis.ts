import Redis from 'ioredis';
import { REDIS } from './config';
import '../config/logging';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis> => {
	try {
		logging.log('-------------------------------------------');
		logging.log('Attempting Redis connection...');

		const redisOptions = {
			maxRetriesPerRequest: 3,
			connectTimeout: 10000,
			lazyConnect: true,
			enableOfflineQueue: false,
			retryStrategy(times: number) {
				// Stop retrying after 3 attempts
				if (times > 3) {
					logging.warn(`Redis retry attempt ${times} - stopping retries`);
					return null;
				}
				const delay = Math.min(times * 1000, 3000);
				return delay;
			}
		};

		if (REDIS.REDIS_URL) {
			redisClient = new Redis(REDIS.REDIS_URL, redisOptions);
		} else {
			redisClient = new Redis({
				host: REDIS.REDIS_HOST,
				port: REDIS.REDIS_PORT,
				...redisOptions
			});
		}

		// Set up event listeners before connecting
		let isConnected = false;

		redisClient.once('connect', () => {
			isConnected = true;
			logging.log('-------------------------------------------');
			logging.log('Redis Connected Successfully');
			logging.log('-------------------------------------------');
		});

		redisClient.on('error', (err: Error) => {
			// Only log errors if we haven't already failed the connection
			if (isConnected) {
				logging.error('Redis error:', err.message);
			}
		});

		// Manually connect with timeout
		await redisClient.connect();

		// Test connection
		await redisClient.ping();

		return redisClient;
	} catch (error) {
		// Clean up failed connection
		if (redisClient) {
			redisClient.disconnect(false); // Don't retry
			redisClient = null;
		}

		logging.error('-------------------------------------------');
		logging.error('Redis connection failed');
		if (error instanceof Error) {
			logging.error(error.message);
		}
		logging.error('-------------------------------------------');
		throw error;
	}
};

export const getRedisClient = (): Redis | null => {
	return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
	if (redisClient) {
		await redisClient.quit();
		redisClient = null;
		logging.log('Redis disconnected');
	}
};

export default redisClient;
