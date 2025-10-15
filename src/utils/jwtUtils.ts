import jwt from 'jsonwebtoken';
import { JWT } from '../config/config';
import { TokenPayload } from '../interfaces/IAuth';
import { UserRole } from '../interfaces/IUser';

export const generateAccessToken = (userId: string, email: string, role: UserRole, sessionId?: string): string => {
	const payload: TokenPayload = {
		userId,
		email,
		role,
		sessionId
	};

	return jwt.sign(payload, JWT.JWT_SECRET, {
		expiresIn: JWT.JWT_ACCESS_EXPIRY
	});
};

export const generateRefreshToken = (userId: string, email: string, role: UserRole): string => {
	const payload: TokenPayload = {
		userId,
		email,
		role
	};

	return jwt.sign(payload, JWT.JWT_REFRESH_SECRET, {
		expiresIn: JWT.JWT_REFRESH_EXPIRY
	});
};

export const verifyAccessToken = (token: string): TokenPayload => {
	try {
		const decoded = jwt.verify(token, JWT.JWT_SECRET) as TokenPayload;
		return decoded;
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			throw new Error('Access token has expired');
		}
		if (error instanceof jwt.JsonWebTokenError) {
			throw new Error('Invalid access token');
		}
		throw new Error('Token verification failed');
	}
};

export const verifyRefreshToken = (token: string): TokenPayload => {
	try {
		const decoded = jwt.verify(token, JWT.JWT_REFRESH_SECRET) as TokenPayload;
		return decoded;
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			throw new Error('Refresh token has expired');
		}
		if (error instanceof jwt.JsonWebTokenError) {
			throw new Error('Invalid refresh token');
		}
		throw new Error('Token verification failed');
	}
};

export const decodeToken = (token: string): TokenPayload | null => {
	try {
		const decoded = jwt.decode(token) as TokenPayload;
		return decoded;
	} catch (error) {
		return null;
	}
};
