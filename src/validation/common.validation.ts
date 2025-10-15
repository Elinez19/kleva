import { z } from 'zod';

// Client schema (for shipper/consignee)
export const clientSchema = z.object({
	clientType: z.enum(['individual', 'corporate'], {
		message: 'Client type must be either individual or corporate'
	}),
	companyName: z.string().optional(),
	contactName: z.string().min(1, 'Contact name is required'),
	email: z.string().email('Must be a valid email address'),
	phone: z
		.string()
		.regex(/^[0-9+\-() ]{10,20}$/, 'Please provide a valid phone number')
		.min(10, 'Phone number is required'),
	address: z.string().min(1, 'Address is required')
});

// Cargo details schema
export const cargoDetailsSchema = z.object({
	description: z.string().min(1, 'Cargo description is required'),
	weight: z.number().positive('Weight must be a positive number'),
	quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
	dimensions: z
		.object({
			length: z.number().positive('Length must be positive').optional(),
			width: z.number().positive('Width must be positive').optional(),
			height: z.number().positive('Height must be positive').optional()
		})
		.optional(),
	declaredValue: z.number().positive('Declared value must be positive')
});

// MongoDB ObjectId validation
export const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Date string or Date object - accepts both date and datetime formats
export const dateSchema = z
	.union([
		z.string().datetime(), // Full ISO datetime: "2025-10-20T10:00:00.000Z"
		z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'), // Date only: "2025-10-20"
		z.date() // Date object
	])
	.optional()
	.transform((val) => {
		// Convert date string to proper Date object
		if (typeof val === 'string') {
			// If it's just a date (YYYY-MM-DD), convert to start of day
			if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
				return new Date(val + 'T00:00:00.000Z');
			}
			// If it's already a datetime string, parse it
			return new Date(val);
		}
		return val;
	});

export default {
	clientSchema,
	cargoDetailsSchema,
	mongoIdSchema,
	dateSchema
};
