import mongoose, { Schema, model } from 'mongoose';
import { IRefreshToken } from '../interfaces/ISession';

const refreshTokenSchema = new Schema<IRefreshToken>(
	{
		userId: {
			type: String,
			required: true,
			index: true
		},
		token: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		expiresAt: {
			type: Date,
			required: true,
			index: true
		},
		deviceInfo: {
			type: String,
			required: true
		},
		ipAddress: {
			type: String,
			required: true
		},
		isRevoked: {
			type: Boolean,
			default: false
		}
	},
	{
		timestamps: true
	}
);

// Compound indexes
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ token: 1, isRevoked: 1 });

// TTL index - automatically delete expired tokens after 7 days
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days in seconds

export default model<IRefreshToken>('RefreshToken', refreshTokenSchema);
