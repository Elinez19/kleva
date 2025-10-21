import { randomUUID } from 'crypto';
import { getRedisClient } from '../config/redis';
import SessionModel from '../models/session.model';
import { ISessionData } from '../interfaces/ISession';

const SESSION_PREFIX = 'session:';
const USER_SESSIONS_PREFIX = 'user_sessions:';
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

export const generateSessionId = async (): Promise<string> => {
	return randomUUID();
};

// Create session key for Redis
const getSessionKey = (sessionId: string): string => {
	return `${SESSION_PREFIX}${sessionId}`;
};

const getUserSessionsKey = (userId: string): string => {
	return `${USER_SESSIONS_PREFIX}${userId}`;
};

// Create a new session in both Redis and MongoDB
export const createSession = async (
	userId: string,
	accessToken: string,
	refreshToken: string,
	deviceInfo: string,
	ipAddress: string
): Promise<string> => {
	const sessionId = await generateSessionId();
	const sessionData: ISessionData = {
		userId,
		sessionId,
		accessToken,
		refreshToken,
		deviceInfo,
		ipAddress,
		lastActivity: new Date()
	};

	const expiresAt = new Date(Date.now() + SESSION_EXPIRY * 1000);

	try {
		// Store in Redis
		const redisClient = getRedisClient();
		if (redisClient) {
			const sessionKey = getSessionKey(sessionId);
			await redisClient.setex(sessionKey, SESSION_EXPIRY, JSON.stringify(sessionData));

			// Add session to user's session set
			const userSessionsKey = getUserSessionsKey(userId);
			await redisClient.sadd(userSessionsKey, sessionId);
			await redisClient.expire(userSessionsKey, SESSION_EXPIRY);
		}

		// Store in MongoDB as backup
		await SessionModel.create({
			...sessionData,
			expiresAt
		});

		return sessionId;
	} catch (error) {
		console.error('Error creating session:', error);
		throw new Error('Failed to create session');
	}
};

// Get session from Redis (with MongoDB fallback)
export const getSession = async (sessionId: string): Promise<ISessionData | null> => {
	try {
		const redisClient = getRedisClient();
		if (redisClient) {
			const sessionKey = getSessionKey(sessionId);
			const sessionJson = await redisClient.get(sessionKey);

			if (sessionJson) {
				return JSON.parse(sessionJson) as ISessionData;
			}
		}

		// Fallback to MongoDB
		const session = await SessionModel.findOne({ sessionId, expiresAt: { $gt: new Date() } });
		if (session) {
			const sessionData: ISessionData = {
				userId: session.userId,
				sessionId: session.sessionId,
				accessToken: session.accessToken,
				refreshToken: session.refreshToken,
				deviceInfo: session.deviceInfo,
				ipAddress: session.ipAddress,
				lastActivity: session.lastActivity
			};

			// Restore to Redis
			if (redisClient) {
				const sessionKey = getSessionKey(sessionId);
				const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
				if (ttl > 0) {
					await redisClient.setex(sessionKey, ttl, JSON.stringify(sessionData));
				}
			}

			return sessionData;
		}

		return null;
	} catch (error) {
		console.error('Error getting session:', error);
		return null;
	}
};

// Update session activity
export const updateSessionActivity = async (sessionId: string): Promise<void> => {
	try {
		const session = await getSession(sessionId);
		if (!session) return;

		session.lastActivity = new Date();

		const redisClient = getRedisClient();
		if (redisClient) {
			const sessionKey = getSessionKey(sessionId);
			const ttl = await redisClient.ttl(sessionKey);
			if (ttl > 0) {
				await redisClient.setex(sessionKey, ttl, JSON.stringify(session));
			}
		}

		// Update MongoDB
		await SessionModel.updateOne({ sessionId }, { lastActivity: new Date() });
	} catch (error) {
		console.error('Error updating session activity:', error);
	}
};

// Revoke a specific session
export const revokeSession = async (sessionId: string): Promise<void> => {
	try {
		const session = await getSession(sessionId);

		const redisClient = getRedisClient();
		if (redisClient) {
			const sessionKey = getSessionKey(sessionId);
			await redisClient.del(sessionKey);

			// Remove from user's session set
			if (session) {
				const userSessionsKey = getUserSessionsKey(session.userId);
				await redisClient.srem(userSessionsKey, sessionId);
			}
		}

		// Delete from MongoDB
		await SessionModel.deleteOne({ sessionId });
	} catch (error) {
		console.error('Error revoking session:', error);
		throw new Error('Failed to revoke session');
	}
};

// Revoke all sessions for a user
export const revokeAllUserSessions = async (userId: string): Promise<void> => {
	try {
		const redisClient = getRedisClient();
		if (redisClient) {
			// Get all session IDs for the user
			const userSessionsKey = getUserSessionsKey(userId);
			const sessionIds = await redisClient.smembers(userSessionsKey);

			// Delete each session
			const pipeline = redisClient.pipeline();
			for (const sessionId of sessionIds) {
				const sessionKey = getSessionKey(sessionId);
				pipeline.del(sessionKey);
			}
			pipeline.del(userSessionsKey);
			await pipeline.exec();
		}

		// Delete all sessions from MongoDB
		await SessionModel.deleteMany({ userId });
	} catch (error) {
		console.error('Error revoking all user sessions:', error);
		throw new Error('Failed to revoke all sessions');
	}
};

// Get all active sessions for a user
export const getUserSessions = async (userId: string): Promise<ISessionData[]> => {
	try {
		const sessions = await SessionModel.find({
			userId,
			expiresAt: { $gt: new Date() }
		}).sort({ lastActivity: -1 });

		return sessions.map((session) => ({
			userId: session.userId,
			sessionId: session.sessionId,
			accessToken: session.accessToken,
			refreshToken: session.refreshToken,
			deviceInfo: session.deviceInfo,
			ipAddress: session.ipAddress,
			lastActivity: session.lastActivity
		}));
	} catch (error) {
		console.error('Error getting user sessions:', error);
		return [];
	}
};
