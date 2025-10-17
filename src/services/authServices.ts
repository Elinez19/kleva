import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import UserModel from '../models/user.model';
import RefreshTokenModel from '../models/refreshToken.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwtUtils';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, send2FAEnabledEmail } from '../utils/emailUtils';
import { generate2FASecret, generateQRCode, verify2FAToken, generateBackupCodes, hashBackupCode, verifyBackupCode } from '../utils/twoFactorUtils';
import { createUserSession, revokeAllSessions } from './sessionServices';
import { RegisterInput, LoginInput } from '../validation/user.validation';
import { LoginResponse, RegisterResponse, Enable2FAResponse, RefreshTokenResponse } from '../interfaces/IAuth';
import { inngest } from '../config/inngest';
import { INNGEST } from '../config/config';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Helper function to safely send Inngest events
const safeInngestSend = async (eventName: string, data: any): Promise<void> => {
	try {
		// Check if Inngest is properly configured
		if (!INNGEST.INNGEST_EVENT_KEY || !INNGEST.INNGEST_SIGNING_KEY) {
			console.log(`Inngest not configured, skipping event: ${eventName}`);
			return;
		}

		await inngest.send({
			name: eventName,
			data
		});
	} catch (error) {
		console.warn(`Failed to send Inngest event ${eventName}:`, error);
		// Don't throw error, just log it
	}
};

// Register user
export const registerUser = async (data: RegisterInput, ipAddress: string): Promise<RegisterResponse> => {
	try {
		// Check if user already exists by email
		const existingUser = await UserModel.findOne({ email: data.email });
		if (existingUser) {
			throw new Error('Email already registered');
		}

		// Check if phone number already exists (if provided)
		if (data.profile?.phone) {
			const existingPhone = await UserModel.findOne({ 'profile.phone': data.profile.phone });
			if (existingPhone) {
				throw new Error('Phone number already registered');
			}
		}

		// Generate email verification token
		const verificationToken = crypto.randomBytes(32).toString('hex');
		const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		// Create user
		const user = await UserModel.create({
			email: data.email,
			password: data.password,
			role: data.role,
			profile: data.profile,
			emailVerificationToken: verificationToken,
			emailVerificationExpires: verificationExpires,
			isEmailVerified: false,
			isActive: true
		});

		// Send verification email via Inngest (with fallback)
		await safeInngestSend('auth/email.verification.requested', {
			userId: user._id.toString(),
			email: user.email,
			token: verificationToken,
			firstName: user.profile?.firstName || 'User'
		});

		// Fallback: Send email directly if Inngest is not configured
		if (!INNGEST.INNGEST_EVENT_KEY || !INNGEST.INNGEST_SIGNING_KEY) {
			await sendVerificationEmail(user.email, verificationToken);
		}

		// Start user onboarding flow
		await safeInngestSend('user/onboarding.started', {
			userId: user._id.toString(),
			email: user.email,
			firstName: user.profile?.firstName || 'User',
			lastName: user.profile?.lastName || '',
			role: user.role
		});

		return {
			success: true,
			message: 'Registration successful. Please check your email to verify your account.',
			userId: user._id.toString()
		};
	} catch (error: any) {
		throw new Error(error.message || 'Registration failed');
	}
};

// Verify email
export const verifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
	try {
		const user = await UserModel.findOne({
			emailVerificationToken: token,
			emailVerificationExpires: { $gt: new Date() }
		});

		if (!user) {
			throw new Error('Invalid or expired verification token');
		}

		user.isEmailVerified = true;
		user.emailVerificationToken = undefined;
		user.emailVerificationExpires = undefined;
		await user.save();

		// Send welcome email via Inngest (with fallback)
		await safeInngestSend('auth/user.registered', {
			userId: user._id.toString(),
			email: user.email,
			firstName: user.profile?.firstName || 'User',
			lastName: user.profile?.lastName || '',
			role: user.role
		});

		// Fallback: Send welcome email directly if Inngest is not configured
		if (!INNGEST.INNGEST_EVENT_KEY || !INNGEST.INNGEST_SIGNING_KEY) {
			await sendWelcomeEmail(user.email, user.profile?.firstName || 'User');
		}

		return {
			success: true,
			message: 'Email verified successfully'
		};
	} catch (error: any) {
		throw new Error(error.message || 'Email verification failed');
	}
};

// Login
export const login = async (data: LoginInput, deviceInfo: string, ipAddress: string): Promise<LoginResponse> => {
	try {
		// Find user with password field
		const user = await UserModel.findOne({ email: data.email }).select('+password +twoFactorSecret');

		if (!user) {
			throw new Error('Invalid credentials');
		}

		// Check if account is locked
		if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
			const remainingTime = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
			throw new Error(`Account locked. Try again in ${remainingTime} minutes`);
		}

		// Check if account is active
		if (!user.isActive) {
			throw new Error('Account is inactive. Please contact support.');
		}

		// Verify password
		const isPasswordValid = await user.comparePassword(data.password);
		if (!isPasswordValid) {
			// Increment login attempts
			user.loginAttempts += 1;

			if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
				user.accountLockedUntil = new Date(Date.now() + LOCK_TIME);
				user.loginAttempts = 0;
				await user.save();

				// Send account locked notification via Inngest (with fallback)
				await safeInngestSend('auth/account.locked', {
					userId: user._id.toString(),
					email: user.email,
					firstName: user.profile?.firstName || 'User',
					reason: 'Too many failed login attempts'
				});

				throw new Error('Too many failed login attempts. Account locked for 15 minutes.');
			}

			await user.save();
			throw new Error('Invalid credentials');
		}

		// Check if email is verified
		if (!user.isEmailVerified) {
			throw new Error('Please verify your email before logging in');
		}

		// Check approval status for handymen
		if (user.role === 'handyman' && user.approvalStatus !== 'approved') {
			if (user.approvalStatus === 'pending') {
				throw new Error('Your handyman account is pending admin approval');
			} else if (user.approvalStatus === 'rejected') {
				throw new Error(`Your handyman account has been rejected. Reason: ${user.rejectionReason || 'No reason provided'}`);
			}
		}

		// Reset login attempts on successful password verification
		user.loginAttempts = 0;
		user.accountLockedUntil = undefined;
		await user.save();

		// Check if 2FA is enabled
		if (user.is2FAEnabled) {
			if (!data.twoFactorCode) {
				// Generate temporary token for 2FA verification
				const tempToken = generateAccessToken(user._id.toString(), user.email, user.role);
				return {
					success: true,
					message: '2FA required',
					requires2FA: true,
					tempToken
				};
			}

			// Verify 2FA code
			const is2FAValid = verify2FAToken(user.twoFactorSecret!, data.twoFactorCode);
			if (!is2FAValid) {
				// Check backup codes
				const backupCodes = await UserModel.findById(user._id).select('+twoFactorBackupCodes');
				if (backupCodes?.twoFactorBackupCodes) {
					const isBackupValid = await verifyBackupCode(data.twoFactorCode, backupCodes.twoFactorBackupCodes);
					if (isBackupValid) {
						// Remove used backup code
						backupCodes.twoFactorBackupCodes = backupCodes.twoFactorBackupCodes.filter(
							async (code) => !(await bcrypt.compare(data.twoFactorCode, code))
						);
						await backupCodes.save();
					} else {
						throw new Error('Invalid 2FA code');
					}
				} else {
					throw new Error('Invalid 2FA code');
				}
			}
		}

		// Generate tokens
		const accessToken = generateAccessToken(user._id.toString(), user.email, user.role);
		const refreshToken = generateRefreshToken(user._id.toString(), user.email, user.role);

		// Create session
		const sessionId = await createUserSession(user._id.toString(), accessToken, refreshToken, deviceInfo, ipAddress);

		// Update access token with session ID
		const accessTokenWithSession = generateAccessToken(user._id.toString(), user.email, user.role, sessionId);

		// Store refresh token in database
		const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
		await RefreshTokenModel.create({
			userId: user._id.toString(),
			token: hashedRefreshToken,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			deviceInfo,
			ipAddress
		});

		return {
			success: true,
			message: 'Login successful',
			user: {
				id: user._id.toString(),
				email: user.email,
				role: user.role,
				isEmailVerified: user.isEmailVerified,
				is2FAEnabled: user.is2FAEnabled
			},
			tokens: {
				accessToken: accessTokenWithSession,
				refreshToken
			}
		};
	} catch (error: any) {
		throw new Error(error.message || 'Login failed');
	}
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {
	try {
		// Verify refresh token
		const payload = verifyRefreshToken(refreshToken);

		// Check if refresh token exists in database and is not revoked
		const hashedToken = await bcrypt.hash(refreshToken, 10);
		const tokenDoc = await RefreshTokenModel.findOne({
			userId: payload.userId,
			isRevoked: false,
			expiresAt: { $gt: new Date() }
		});

		if (!tokenDoc) {
			throw new Error('Invalid or expired refresh token');
		}

		// Generate new access token
		const newAccessToken = generateAccessToken(payload.userId, payload.email, payload.role);

		return {
			success: true,
			accessToken: newAccessToken
		};
	} catch (error: any) {
		throw new Error(error.message || 'Token refresh failed');
	}
};

// Logout
export const logout = async (sessionId: string, refreshToken?: string): Promise<void> => {
	try {
		// Revoke session
		const { revokeUserSession } = await import('./sessionServices');
		await revokeUserSession(sessionId);

		// Revoke refresh token if provided
		if (refreshToken) {
			await RefreshTokenModel.updateMany({ token: refreshToken }, { isRevoked: true });
		}
	} catch (error: any) {
		throw new Error(error.message || 'Logout failed');
	}
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
	try {
		const user = await UserModel.findOne({ email });

		// Don't reveal if email exists or not for security
		if (!user) {
			return {
				success: true,
				message: 'If the email exists, a password reset link has been sent'
			};
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString('hex');
		const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		user.passwordResetToken = resetToken;
		user.passwordResetExpires = resetExpires;
		await user.save();

		// Send reset email via Inngest (with fallback)
		await safeInngestSend('auth/password.reset.requested', {
			userId: user._id.toString(),
			email: user.email,
			token: resetToken,
			firstName: user.profile?.firstName || 'User'
		});

		// Fallback: Send reset email directly if Inngest is not configured
		if (!INNGEST.INNGEST_EVENT_KEY || !INNGEST.INNGEST_SIGNING_KEY) {
			await sendPasswordResetEmail(user.email, resetToken);
		}

		return {
			success: true,
			message: 'If the email exists, a password reset link has been sent'
		};
	} catch (error: any) {
		throw new Error(error.message || 'Password reset request failed');
	}
};

// Reset password
export const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
	try {
		const user = await UserModel.findOne({
			passwordResetToken: token,
			passwordResetExpires: { $gt: new Date() }
		});

		if (!user) {
			throw new Error('Invalid or expired reset token');
		}

		user.password = newPassword;
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save();

		// Revoke all existing sessions for security
		await revokeAllSessions(user._id.toString());

		return {
			success: true,
			message: 'Password reset successful'
		};
	} catch (error: any) {
		throw new Error(error.message || 'Password reset failed');
	}
};

// Enable 2FA
export const enable2FA = async (userId: string, password: string): Promise<Enable2FAResponse> => {
	try {
		const user = await UserModel.findById(userId).select('+password');

		if (!user) {
			throw new Error('User not found');
		}

		// Verify password
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			throw new Error('Invalid password');
		}

		// Generate 2FA secret
		const { secret, otpauth_url } = generate2FASecret(user.email);

		// Generate QR code
		const qrCodeUrl = await generateQRCode(otpauth_url);

		// Generate backup codes
		const backupCodes = generateBackupCodes(10);
		const hashedBackupCodes = await Promise.all(backupCodes.map((code) => hashBackupCode(code)));

		// Store secret and backup codes (not enabled yet)
		user.twoFactorSecret = secret;
		user.twoFactorBackupCodes = hashedBackupCodes;
		await user.save();

		return {
			success: true,
			secret,
			qrCodeUrl,
			backupCodes,
			message: 'Please scan the QR code with your authenticator app and verify with a code'
		};
	} catch (error: any) {
		throw new Error(error.message || '2FA setup failed');
	}
};

// Verify and enable 2FA
export const verify2FA = async (userId: string, token: string): Promise<{ success: boolean; message: string }> => {
	try {
		const user = await UserModel.findById(userId).select('+twoFactorSecret');

		if (!user || !user.twoFactorSecret) {
			throw new Error('2FA setup not initiated');
		}

		// Verify token
		const isValid = verify2FAToken(user.twoFactorSecret, token);
		if (!isValid) {
			throw new Error('Invalid verification code');
		}

		// Enable 2FA
		user.is2FAEnabled = true;
		await user.save();

		// Send 2FA enabled confirmation via Inngest (with fallback)
		await safeInngestSend('auth/2fa.enabled', {
			userId: user._id.toString(),
			email: user.email,
			firstName: user.profile?.firstName || 'User'
		});

		// Fallback: Send 2FA enabled email directly if Inngest is not configured
		if (!INNGEST.INNGEST_EVENT_KEY || !INNGEST.INNGEST_SIGNING_KEY) {
			await send2FAEnabledEmail(user.email, user.profile?.firstName || 'User');
		}

		return {
			success: true,
			message: '2FA enabled successfully'
		};
	} catch (error: any) {
		throw new Error(error.message || '2FA verification failed');
	}
};

// Disable 2FA
export const disable2FA = async (userId: string, password: string, twoFactorCode?: string): Promise<{ success: boolean; message: string }> => {
	try {
		const user = await UserModel.findById(userId).select('+password +twoFactorSecret');

		if (!user) {
			throw new Error('User not found');
		}

		// Verify password
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			throw new Error('Invalid password');
		}

		// Verify 2FA code if provided
		if (user.is2FAEnabled && twoFactorCode) {
			const is2FAValid = verify2FAToken(user.twoFactorSecret!, twoFactorCode);
			if (!is2FAValid) {
				throw new Error('Invalid 2FA code');
			}
		}

		// Disable 2FA
		user.is2FAEnabled = false;
		user.twoFactorSecret = undefined;
		user.twoFactorBackupCodes = undefined;
		await user.save();

		return {
			success: true,
			message: '2FA disabled successfully'
		};
	} catch (error: any) {
		throw new Error(error.message || '2FA disable failed');
	}
};

// Change password
export const changePassword = async (
	userId: string,
	currentPassword: string,
	newPassword: string
): Promise<{ success: boolean; message: string }> => {
	try {
		const user = await UserModel.findById(userId).select('+password');

		if (!user) {
			throw new Error('User not found');
		}

		// Verify current password
		const isPasswordValid = await user.comparePassword(currentPassword);
		if (!isPasswordValid) {
			throw new Error('Current password is incorrect');
		}

		// Update password
		user.password = newPassword;
		await user.save();

		// Revoke all sessions for security
		await revokeAllSessions(userId);

		return {
			success: true,
			message: 'Password changed successfully. Please login again.'
		};
	} catch (error: any) {
		throw new Error(error.message || 'Password change failed');
	}
};
