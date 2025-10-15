import { Document } from 'mongoose';

export interface ISessionData {
	userId: string;
	sessionId: string;
	accessToken: string;
	refreshToken: string;
	deviceInfo: string;
	ipAddress: string;
	lastActivity: Date;
}

export interface ISession extends Document {
	userId: string;
	sessionId: string;
	accessToken: string;
	refreshToken: string;
	deviceInfo: string;
	ipAddress: string;
	lastActivity: Date;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface IRefreshToken extends Document {
	userId: string;
	token: string; // hashed
	expiresAt: Date;
	deviceInfo: string;
	ipAddress: string;
	isRevoked: boolean;
	createdAt: Date;
	updatedAt: Date;
}
