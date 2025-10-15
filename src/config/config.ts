import dotenv from 'dotenv';

dotenv.config();

export const DEVELOPMENT = process.env.NODE_ENV === 'development';
export const TEST = process.env.NODE_ENV === 'test';

export const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || 'localhost';
export const SERVER_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3006;

//MongoDB
export const MONGODB_URI = process.env.MONGODB_URI;

// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Redis Configuration
export const REDIS_URL = process.env.REDIS_URL;
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;

// Email Configuration
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// Frontend Configuration
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Rate Limiting Configuration
export const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 900000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 100;

// Inngest Configuration
export const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY;
export const INNGEST_SIGNING_KEY = process.env.INNGEST_SIGNING_KEY;
export const INNGEST_APP_ID = process.env.INNGEST_APP_ID || 'handyman-app';

// Payment Configuration (Paystack)
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
export const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
export const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
export const PAYMENT_CURRENCY = process.env.PAYMENT_CURRENCY || 'NGN';

export const SERVER = {
	SERVER_HOSTNAME,
	SERVER_PORT,
	MONGODB_URI
};

export const JWT = {
	JWT_SECRET,
	JWT_REFRESH_SECRET,
	JWT_ACCESS_EXPIRY,
	JWT_REFRESH_EXPIRY
};

export const REDIS = {
	REDIS_URL,
	REDIS_HOST,
	REDIS_PORT
};

export const EMAIL = {
	RESEND_API_KEY
};

export const RATE_LIMIT = {
	WINDOW_MS: RATE_LIMIT_WINDOW_MS,
	MAX_REQUESTS: RATE_LIMIT_MAX_REQUESTS
};

export const INNGEST = {
	INNGEST_EVENT_KEY,
	INNGEST_SIGNING_KEY,
	INNGEST_APP_ID
};

export const PAYMENT = {
	PAYSTACK_SECRET_KEY,
	PAYSTACK_PUBLIC_KEY,
	PAYSTACK_WEBHOOK_SECRET,
	PAYMENT_CURRENCY
};
