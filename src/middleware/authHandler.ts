import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwtUtils';
import { getSession, updateSessionActivity } from '../utils/sessionUtils';
import { UserRole } from '../interfaces/IUser';
import { TokenPayload } from '../interfaces/IAuth';

// Extend Express Request to include user
declare global {
	namespace Express {
		interface Request {
			user?: TokenPayload;
		}
	}
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		// Get token from header
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			res.status(401).json({
				success: false,
				message: 'No token provided'
			});
			return;
		}

		const token = authHeader.substring(7);

		// Verify token
		const payload = verifyAccessToken(token);

		// Check if session exists and is valid
		if (payload.sessionId) {
			const session = await getSession(payload.sessionId);
			if (!session) {
				res.status(401).json({
					success: false,
					message: 'Session has expired or is invalid'
				});
				return;
			}

			// Update session activity
			await updateSessionActivity(payload.sessionId);
		}

		// Attach user to request
		req.user = payload;
		next();
	} catch (error: any) {
		if (error.message === 'Access token has expired') {
			res.status(401).json({
				success: false,
				message: 'Token has expired',
				code: 'TOKEN_EXPIRED'
			});
			return;
		}

		res.status(401).json({
			success: false,
			message: 'Invalid or expired token'
		});
	}
};

export const requireRole = (...roles: UserRole[]) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
			return;
		}

		if (!roles.includes(req.user.role)) {
			res.status(403).json({
				success: false,
				message: 'Insufficient permissions'
			});
			return;
		}

		next();
	};
};

export const require2FA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		if (!req.user) {
			res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
			return;
		}

		// This middleware should be used after authenticate
		// Additional 2FA verification logic can be added here if needed
		next();
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error verifying 2FA status'
		});
	}
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			// No token provided, continue without user
			next();
			return;
		}

		const token = authHeader.substring(7);
		const payload = verifyAccessToken(token);

		if (payload.sessionId) {
			const session = await getSession(payload.sessionId);
			if (session) {
				req.user = payload;
				await updateSessionActivity(payload.sessionId);
			}
		} else {
			req.user = payload;
		}

		next();
	} catch (error) {
		// If token is invalid, continue without user
		next();
	}
};
