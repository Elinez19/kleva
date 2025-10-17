import mongoose, { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserMethods } from '../interfaces/IUser';

type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true
		},
		password: {
			type: String,
			required: true,
			select: false
		},
		role: {
			type: String,
			enum: ['handyman', 'customer', 'admin'],
			required: true,
			default: 'customer'
		},
		profile: {
			type: Schema.Types.Mixed,
			required: true
		},
		// Email verification
		isEmailVerified: {
			type: Boolean,
			default: false
		},
		emailVerificationToken: {
			type: String,
			select: false
		},
		emailVerificationExpires: {
			type: Date,
			select: false
		},
		// 2FA
		is2FAEnabled: {
			type: Boolean,
			default: false
		},
		twoFactorSecret: {
			type: String,
			select: false
		},
		twoFactorBackupCodes: {
			type: [String],
			select: false
		},
		// Password reset
		passwordResetToken: {
			type: String,
			select: false
		},
		passwordResetExpires: {
			type: Date,
			select: false
		},
		// Account status
		isActive: {
			type: Boolean,
			default: true
		},
		accountLockedUntil: {
			type: Date
		},
		loginAttempts: {
			type: Number,
			default: 0
		},
		// Admin approval for handymen
		approvalStatus: {
			type: String,
			enum: ['pending', 'approved', 'rejected'],
			default: function () {
				return this.role === 'handyman' ? 'pending' : 'approved';
			}
		},
		approvedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null
		},
		approvedAt: {
			type: Date,
			default: null
		},
		rejectionReason: {
			type: String,
			default: null
		}
	},
	{
		timestamps: true
	}
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ 'profile.phone': 1 }); // Index for phone number duplicate checking
userSchema.index({ approvalStatus: 1 }); // Index for approval status queries
userSchema.index({ role: 1, approvalStatus: 1 }); // Compound index for handyman approval queries

// Hash password before saving
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error: any) {
		next(error);
	}
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	try {
		return await bcrypt.compare(candidatePassword, this.password);
	} catch (error) {
		return false;
	}
};

export default model<IUser, UserModel>('User', userSchema);
