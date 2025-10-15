import { z } from 'zod';

// Initialize job payment schema
export const initializePaymentSchema = z.object({
	jobId: z.string().min(1, 'Job ID is required'),
	amount: z.number().min(100, 'Minimum amount is ₦100 (100 kobo)'),
	description: z.string().min(1, 'Description is required').max(500, 'Description too long')
});

// Initialize subscription payment schema
export const subscriptionPaymentSchema = z.object({
	planId: z.string().min(1, 'Plan ID is required'),
	amount: z.number().min(100, 'Minimum amount is ₦100 (100 kobo)'),
	description: z.string().min(1, 'Description is required').max(500, 'Description too long')
});

// Verify payment schema
export const verifyPaymentSchema = z.object({
	reference: z.string().min(1, 'Payment reference is required')
});

// Transfer recipient schema
export const transferRecipientSchema = z.object({
	name: z.string().min(1, 'Recipient name is required'),
	accountNumber: z.string().min(10, 'Account number must be at least 10 digits').max(10, 'Account number must be exactly 10 digits'),
	bankCode: z.string().min(3, 'Bank code is required'),
	currency: z.string().default('NGN')
});

// Payout schema
export const payoutSchema = z.object({
	jobId: z.string().min(1, 'Job ID is required'),
	handymanId: z.string().min(1, 'Handyman ID is required')
});

// Query schemas
export const paymentHistoryQuerySchema = z.object({
	limit: z
		.string()
		.transform((val) => parseInt(val))
		.pipe(z.number().min(1).max(100))
		.default(() => 10),
	page: z
		.string()
		.transform((val) => parseInt(val))
		.pipe(z.number().min(1))
		.default(() => 1),
	status: z.enum(['pending', 'successful', 'failed', 'reversed', 'cancelled']).optional()
});

export const paymentStatsQuerySchema = z.object({
	period: z.enum(['day', 'week', 'month', 'year']).default('month'),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional()
});
