import http from 'http';
import './config/logging';
import { SERVER } from './config/config';
import { connectDb } from './database/db';
import { connectRedis, disconnectRedis } from './config/redis';
import { application } from './app';
export let httpServer: ReturnType<typeof http.createServer>;

export const Main = async () => {
	logging.info('-------------------------------------------');
	logging.info('Connect Database');
	logging.info('-------------------------------------------');
	await connectDb();

	logging.info('-------------------------------------------');
	logging.info('Connect Redis');
	logging.info('-------------------------------------------');
	try {
		await connectRedis();
	} catch (error) {
		logging.warn('Redis connection failed, continuing without Redis');
		logging.warn('Session management and rate limiting will use fallback methods');
	}

	logging.info('-------------------------------------------');
	logging.info('Start Application');
	logging.info('-------------------------------------------');
	httpServer = http.createServer(application);
	httpServer.listen(SERVER.SERVER_PORT, () => {
		logging.log('----------------------------------------');
		logging.log(`Server started on ${SERVER.SERVER_HOSTNAME}:${SERVER.SERVER_PORT}`);
		logging.log('----------------------------------------');
	});
};

export const Shutdown = async (callback: any) => {
	logging.info('-------------------------------------------');
	logging.info('Shutting down gracefully...');
	logging.info('-------------------------------------------');

	// Close Redis connection
	await disconnectRedis();

	// Close HTTP server
	httpServer && httpServer.close(callback);
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
	logging.info('SIGTERM signal received');
	Shutdown(() => {
		logging.info('Server closed');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	logging.info('SIGINT signal received');
	Shutdown(() => {
		logging.info('Server closed');
		process.exit(0);
	});
});

Main();
