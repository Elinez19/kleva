import { UserRole } from './IUser';

export interface TokenPayload {
	userId: string;
	email: string;
	role: UserRole;
	sessionId?: string;
	iat?: number; // Issued at
	exp?: number; // Expiration time
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface RegisterResponse {
	success: boolean;
	message: string;
	userId?: string;
}

export interface LoginResponse {
	success: boolean;
	message: string;
	user?: {
		id: string;
		email: string;
		role: UserRole;
		isEmailVerified: boolean;
		is2FAEnabled: boolean;
	};
	tokens?: AuthTokens;
	requires2FA?: boolean;
	tempToken?: string; // Temporary token for 2FA verification
}

export interface RefreshTokenResponse {
	success: boolean;
	accessToken?: string;
	message?: string;
}

export interface Enable2FAResponse {
	success: boolean;
	secret?: string;
	qrCodeUrl?: string;
	backupCodes?: string[];
	message?: string;
}

export interface SessionInfo {
	sessionId: string;
	deviceInfo: string;
	ipAddress: string;
	lastActivity: Date;
	createdAt: Date;
}
