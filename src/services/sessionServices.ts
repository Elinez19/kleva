import { createSession, getSession, revokeSession, revokeAllUserSessions, getUserSessions, updateSessionActivity } from '../utils/sessionUtils';
import { ISessionData } from '../interfaces/ISession';
import { SessionInfo } from '../interfaces/IAuth';

export const createUserSession = async (
	userId: string,
	accessToken: string,
	refreshToken: string,
	deviceInfo: string,
	ipAddress: string
): Promise<string> => {
	return await createSession(userId, accessToken, refreshToken, deviceInfo, ipAddress);
};

export const getUserSessionById = async (sessionId: string): Promise<ISessionData | null> => {
	return await getSession(sessionId);
};

export const updateSession = async (sessionId: string): Promise<void> => {
	await updateSessionActivity(sessionId);
};

export const revokeUserSession = async (sessionId: string): Promise<void> => {
	await revokeSession(sessionId);
};

export const revokeAllSessions = async (userId: string): Promise<void> => {
	await revokeAllUserSessions(userId);
};

export const getAllUserSessions = async (userId: string): Promise<SessionInfo[]> => {
	const sessions = await getUserSessions(userId);

	return sessions.map((session) => ({
		sessionId: session.sessionId,
		deviceInfo: session.deviceInfo,
		ipAddress: session.ipAddress,
		lastActivity: session.lastActivity,
		createdAt: session.lastActivity // Using lastActivity as approximation
	}));
};
