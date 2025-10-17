import { Request, Response } from 'express';
import * as authServices from '../services/authServices';
import * as sessionServices from '../services/sessionServices';
import UserModel from '../models/user.model';
import { HTTPSTATUS } from '../constants/http.constants';

// Get device info from request
const getDeviceInfo = (req: Request): string => {
	return req.headers['user-agent'] || 'Unknown Device';
};

// Get IP address from request
const getIpAddress = (req: Request): string => {
	return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || req.socket.remoteAddress || 'Unknown';
};

// Register
export const register = async (req: Request, res: Response): Promise<void> => {
	try {
		const ipAddress = getIpAddress(req);
		const result = await authServices.registerUser(req.body, ipAddress);

		res.status(HTTPSTATUS.CREATED).json(result);
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Verify Email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
	try {
		const { token } = req.params;
		const result = await authServices.verifyEmail(token);

		res.status(HTTPSTATUS.OK).json(result);
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
	try {
		const deviceInfo = getDeviceInfo(req);
		const ipAddress = getIpAddress(req);

		const result = await authServices.login(req.body, deviceInfo, ipAddress);

		res.status(HTTPSTATUS.OK).json(result);
	} catch (error: any) {
		res.status(HTTPSTATUS.UNAUTHORIZED).json({
			success: false,
			message: error.message
		});
	}
};

// Refresh Token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
	try {
		const { refreshToken } = req.body;
		const result = await authServices.refreshAccessToken(refreshToken);

		res.status(HTTPSTATUS.OK).json(result);
	} catch (error: any) {
		res.status(HTTPSTATUS.UNAUTHORIZED).json({
			success: false,
			message: error.message
		});
	}
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
	try {
		const sessionId = req.user?.sessionId;
		const { refreshToken } = req.body;

		if (sessionId) {
			await authServices.logout(sessionId, refreshToken);
		}

		res.status(HTTPSTATUS.OK).json({
			success: true,
			message: 'Logged out successfully'
		});
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Request Password Reset
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
	try {
		const { email } = req.body;
		const result = await authServices.requestPasswordReset(email);

		res.status(HTTPSTATUS.OK).json(result);
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Reset Password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
	try {
		const { token } = req.params;
		const { newPassword } = req.body;

		const result = await authServices.resetPassword(token, newPassword);

		res.status(HTTPSTATUS.OK).json(result);
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Get Profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Unauthorized'
			});
			return;
		}

		const user = await UserModel.findById(userId).select('-password -twoFactorSecret -twoFactorBackupCodes');

		if (!user) {
			res.status(HTTPSTATUS.NOT_FOUND).json({
				success: false,
				message: 'User not found'
			});
			return;
		}

		res.status(HTTPSTATUS.OK).json({
			success: true,
			data: user
		});
	} catch (error: any) {
		res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: error.message
		});
	}
};

// Update Profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Unauthorized'
			});
			return;
		}

		const { profile } = req.body;

		const user = await UserModel.findByIdAndUpdate(userId, { profile }, { new: true, runValidators: true }).select(
			'-password -twoFactorSecret -twoFactorBackupCodes'
		);

		if (!user) {
			res.status(HTTPSTATUS.NOT_FOUND).json({
				success: false,
				message: 'User not found'
			});
			return;
		}

		res.status(HTTPSTATUS.OK).json({
			success: true,
			message: 'Profile updated successfully',
			data: user
		});
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Change Password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Unauthorized'
			});
			return;
		}

		const { currentPassword, newPassword } = req.body;
		const result = await authServices.changePassword(userId, currentPassword, newPassword);

		res.status(HTTPSTATUS.OK).json(result);
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Enable 2FA
export const enable2FA = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Unauthorized'
			});
			return;
		}

		const { password } = req.body;
		const result = await authServices.enable2FA(userId, password);

		res.status(HTTPSTATUS.OK).json(result);
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Verify 2FA
export const verify2FA = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Unauthorized'
			});
			return;
		}

		const { token } = req.body;
		const result = await authServices.verify2FA(userId, token);

		res.status(HTTPSTATUS.OK).json(result);
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Disable 2FA
export const disable2FA = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Unauthorized'
			});
			return;
		}

		const { password, twoFactorCode } = req.body;
		const result = await authServices.disable2FA(userId, password, twoFactorCode);

		res.status(HTTPSTATUS.OK).json(result);
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Get Sessions
export const getSessions = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Unauthorized'
			});
			return;
		}

		const sessions = await sessionServices.getAllUserSessions(userId);

		res.status(HTTPSTATUS.OK).json({
			success: true,
			data: sessions
		});
	} catch (error: any) {
		res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: error.message
		});
	}
};

// Revoke Session
export const revokeSession = async (req: Request, res: Response): Promise<void> => {
	try {
		const { sessionId } = req.params;
		const userId = req.user?.userId;

		if (!userId) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Unauthorized'
			});
			return;
		}

		// Verify session belongs to user
		const session = await sessionServices.getUserSessionById(sessionId);
		if (!session || session.userId !== userId) {
			res.status(HTTPSTATUS.FORBIDDEN).json({
				success: false,
				message: 'Not authorized to revoke this session'
			});
			return;
		}

		await sessionServices.revokeUserSession(sessionId);

		res.status(HTTPSTATUS.OK).json({
			success: true,
			message: 'Session revoked successfully'
		});
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Revoke All Sessions
export const revokeAllSessions = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Unauthorized'
			});
			return;
		}

		await sessionServices.revokeAllSessions(userId);

		res.status(HTTPSTATUS.OK).json({
			success: true,
			message: 'All sessions revoked successfully'
		});
	} catch (error: any) {
		res.status(HTTPSTATUS.BAD_REQUEST).json({
			success: false,
			message: error.message
		});
	}
};

// Get token information
export const getTokenInfo = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Unauthorized'
			});
			return;
		}

		// Decode token to show info (without sensitive data)
		const authHeader = req.headers.authorization;
		const token = authHeader?.substring(7); // Remove 'Bearer ' prefix

		if (!token) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'No token provided'
			});
			return;
		}

		const { decodeToken } = await import('../utils/jwtUtils');
		const decoded = decodeToken(token);

		if (!decoded) {
			res.status(HTTPSTATUS.UNAUTHORIZED).json({
				success: false,
				message: 'Invalid token'
			});
			return;
		}

		res.status(HTTPSTATUS.OK).json({
			success: true,
			message: 'Token information',
			data: {
				userId: decoded.userId,
				email: decoded.email,
				role: decoded.role,
				sessionId: decoded.sessionId,
				issuedAt: new Date(decoded.iat * 1000).toISOString(),
				expiresAt: new Date(decoded.exp * 1000).toISOString(),
				timeRemaining: Math.max(0, (decoded.exp * 1000) - Date.now())
			},
			timestamp: new Date().toISOString()
		});
	} catch (error: any) {
		res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: error.message
		});
	}
};

// Get user statistics (for testing/admin purposes)
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
	try {
		const totalUsers = await UserModel.countDocuments();
		const verifiedUsers = await UserModel.countDocuments({ isEmailVerified: true });
		const unverifiedUsers = await UserModel.countDocuments({ isEmailVerified: false });
		
		const usersByRole = await UserModel.aggregate([
			{
				$group: {
					_id: '$role',
					count: { $sum: 1 }
				}
			}
		]);

		const roleStats = usersByRole.reduce((acc, item) => {
			acc[item._id] = item.count;
			return acc;
		}, {} as Record<string, number>);

		res.status(HTTPSTATUS.OK).json({
			success: true,
			message: 'User statistics',
			data: {
				totalUsers,
				verifiedUsers,
				unverifiedUsers,
				usersByRole: {
					customer: roleStats.customer || 0,
					handyman: roleStats.handyman || 0,
					admin: roleStats.admin || 0
				}
			},
			timestamp: new Date().toISOString()
		});
	} catch (error: any) {
		res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: error.message
		});
	}
};

// Test Resend email endpoint
export const testResend = async (req: Request, res: Response): Promise<void> => {
	try {
		const testEmail = req.body.email || 'elijahndenwa19@gmail.com';

		// Create a simple test email function
		const { Resend } = await import('resend');
		const { EMAIL } = await import('../config/config');
		
		const resend = new Resend(EMAIL.RESEND_API_KEY);

		const result = await resend.emails.send({
			from: 'Handyman Management <test@anorateck.com>',
			to: [testEmail],
			subject: 'Test Email from Handyman Management',
			html: '<h1>Test Email</h1><p>This is a test email to verify Resend integration.</p>'
		});

		res.status(HTTPSTATUS.OK).json({
			success: true,
			message: 'Test email sent successfully',
			resendId: (result as any).id || (result as any).data?.id || 'unknown',
			timestamp: new Date().toISOString()
		});
	} catch (error: any) {
		res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: 'Failed to send test email',
			error: error.message,
			timestamp: new Date().toISOString()
		});
	}
};
