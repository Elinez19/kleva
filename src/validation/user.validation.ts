import { z } from 'zod';
import { mongoIdSchema } from './common.validation';

/**
 * User Validation Schemas using Zod
 */

// Base profile schema
const baseProfileSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	phone: z
		.string()
		.regex(/^[0-9+\-() ]{10,20}$/, 'Please provide a valid phone number')
		.optional(),
	address: z.string().optional()
});

// Handyman profile schema
const handymanProfileSchema = baseProfileSchema.extend({
	skills: z.array(z.string()).optional(),
	experience: z.number().optional(),
	hourlyRate: z.number().optional(),
	availability: z.string().optional(),
	bio: z.string().optional(),
	certifications: z.array(z.string()).optional()
});

// Customer profile schema
const customerProfileSchema = baseProfileSchema.extend({
	preferredContactMethod: z.enum(['email', 'phone', 'sms']).optional()
});

// Admin profile schema
const adminProfileSchema = baseProfileSchema.extend({
	department: z.string().optional()
});

// Registration Schemas
export const registerHandymanSchema = z.object({
	email: z.string().email('Must be a valid email address').toLowerCase(),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
	role: z.literal('handyman'),
	profile: handymanProfileSchema
});

export const registerCustomerSchema = z.object({
	email: z.string().email('Must be a valid email address').toLowerCase(),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
	role: z.literal('customer'),
	profile: customerProfileSchema
});

export const registerAdminSchema = z.object({
	email: z.string().email('Must be a valid email address').toLowerCase(),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
	role: z.literal('admin'),
	profile: adminProfileSchema
});

// Generic register schema
export const registerSchema = z.discriminatedUnion('role', [registerHandymanSchema, registerCustomerSchema, registerAdminSchema]);

// Login Schema
export const loginSchema = z.object({
	email: z.string().email('Must be a valid email address').toLowerCase(),
	password: z.string().min(1, 'Password is required'),
	twoFactorCode: z.string().length(6, '2FA code must be 6 digits').optional()
});

// Email Verification Schema
export const verifyEmailSchema = z.object({
	token: z.string().min(1, 'Verification token is required')
});

// Password Reset Request Schema
export const passwordResetRequestSchema = z.object({
	email: z.string().email('Must be a valid email address').toLowerCase()
});

// Password Reset Confirm Schema
export const passwordResetConfirmSchema = z.object({
	token: z.string().min(1, 'Reset token is required'),
	newPassword: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
});

// Change Password Schema
export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z
			.string()
			.min(8, 'New password must be at least 8 characters')
			.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
		confirmPassword: z.string().min(1, 'Confirm password is required')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});

// 2FA Schemas
export const enable2FASchema = z.object({
	password: z.string().min(1, 'Password is required for verification')
});

export const verify2FASchema = z.object({
	token: z.string().length(6, '2FA code must be 6 digits')
});

export const disable2FASchema = z.object({
	password: z.string().min(1, 'Password is required'),
	twoFactorCode: z.string().length(6, '2FA code must be 6 digits').optional()
});

// Refresh Token Schema
export const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, 'Refresh token is required')
});

// Update Profile Schema
export const updateProfileSchema = z.object({
	profile: z.union([handymanProfileSchema.partial(), customerProfileSchema.partial(), adminProfileSchema.partial()])
});

// Get User by ID Schema
export const getUserByIdSchema = z.object({
	id: mongoIdSchema
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type Enable2FAInput = z.infer<typeof enable2FASchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type Disable2FAInput = z.infer<typeof disable2FASchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;

export default {
	registerSchema,
	loginSchema,
	verifyEmailSchema,
	passwordResetRequestSchema,
	passwordResetConfirmSchema,
	changePasswordSchema,
	enable2FASchema,
	verify2FASchema,
	disable2FASchema,
	refreshTokenSchema,
	updateProfileSchema,
	getUserByIdSchema
};
