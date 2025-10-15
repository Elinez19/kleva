import mongoose, { Schema, model } from 'mongoose';
import { ISession } from '../interfaces/ISession';

const sessionSchema = new Schema<ISession>(
	{
		userId: {
			type: String,
			required: true,
			index: true
		},
		sessionId: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		accessToken: {
			type: String,
			required: true
		},
		refreshToken: {
			type: String,
			required: true
		},
		deviceInfo: {
			type: String,
			required: true
		},
		ipAddress: {
			type: String,
			required: true
		},
		lastActivity: {
			type: Date,
			default: Date.now
		},
		expiresAt: {
			type: Date,
			required: true,
			index: true
		}
	},
	{
		timestamps: true
	}
);

// Compound indexes
sessionSchema.index({ userId: 1, expiresAt: 1 });
sessionSchema.index({ sessionId: 1, userId: 1 });

// TTL index - automatically delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<ISession>('Session', sessionSchema);
