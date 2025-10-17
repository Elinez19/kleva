import { Document } from 'mongoose';
import mongoose from 'mongoose';

export type UserRole = 'handyman' | 'customer' | 'admin';

export interface IHandymanProfile {
	firstName: string;
	lastName: string;
	phone?: string;
	address?: string;
	skills?: string[];
	experience?: number; // years
	hourlyRate?: number;
	availability?: string;
	bio?: string;
	certifications?: string[];
}

export interface ICustomerProfile {
	firstName: string;
	lastName: string;
	phone?: string;
	address?: string;
	preferredContactMethod?: 'email' | 'phone' | 'sms';
}

export interface IAdminProfile {
	firstName: string;
	lastName: string;
	phone?: string;
	department?: string;
}

export interface IUser extends Document {
	email: string;
	password: string;
	role: UserRole;
	profile: IHandymanProfile | ICustomerProfile | IAdminProfile;

	// Email verification
	isEmailVerified: boolean;
	emailVerificationToken?: string;
	emailVerificationExpires?: Date;

	// 2FA
	is2FAEnabled: boolean;
	twoFactorSecret?: string;
	twoFactorBackupCodes?: string[];

	// Password reset
	passwordResetToken?: string;
	passwordResetExpires?: Date;

	// Account status
	isActive: boolean;
	accountLockedUntil?: Date;
	loginAttempts: number;

	// Admin approval for handymen
	approvalStatus: 'pending' | 'approved' | 'rejected';
	approvedBy?: mongoose.Types.ObjectId;
	approvedAt?: Date;
	rejectionReason?: string;

	// Timestamps
	createdAt: Date;
	updatedAt: Date;

	// Methods
	comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserMethods {
	comparePassword(candidatePassword: string): Promise<boolean>;
}
