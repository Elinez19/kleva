import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis';
import { RATE_LIMIT } from '../config/config';

// Auth endpoints rate limiter - strict for login/register
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // 5 requests per window
	message: {
		success: false,
		message: 'Too many authentication attempts, please try again later'
	},
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		// Skip rate limiting in test environment
		return process.env.NODE_ENV === 'test';
	},
	store: getRedisClient()
		? new RedisStore({
				// @ts-expect-error - Known typing issue with rate-limit-redis
				client: getRedisClient(),
				prefix: 'rl:auth:'
		  })
		: undefined
});

// General API rate limiter
export const apiLimiter = rateLimit({
	windowMs: RATE_LIMIT.WINDOW_MS,
	max: RATE_LIMIT.MAX_REQUESTS,
	message: {
		success: false,
		message: 'Too many requests, please try again later'
	},
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		return process.env.NODE_ENV === 'test';
	},
	store: getRedisClient()
		? new RedisStore({
				// @ts-expect-error - Known typing issue with rate-limit-redis
				client: getRedisClient(),
				prefix: 'rl:api:'
		  })
		: undefined
});

// Per-user rate limiter for authenticated requests
export const userLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 1000, // 1000 requests per hour per user
	message: {
		success: false,
		message: 'Rate limit exceeded for your account'
	},
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		return process.env.NODE_ENV === 'test';
	},
	keyGenerator: (req) => {
		// Use user ID from authenticated request
		// If not authenticated, skip custom key (use default IPv6-safe IP key)
		if (req.user?.userId) {
			return `user:${req.user.userId}`;
		}
		// Return undefined to use default IP-based key which handles IPv6 correctly
		return undefined as any;
	},
	store: getRedisClient()
		? new RedisStore({
				// @ts-expect-error - Known typing issue with rate-limit-redis
				client: getRedisClient(),
				prefix: 'rl:user:'
		  })
		: undefined
});

// Password reset rate limiter - more lenient
export const passwordResetLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 3, // 3 password reset requests per hour
	message: {
		success: false,
		message: 'Too many password reset attempts, please try again later'
	},
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		return process.env.NODE_ENV === 'test';
	},
	store: getRedisClient()
		? new RedisStore({
				// @ts-expect-error - Known typing issue with rate-limit-redis
				client: getRedisClient(),
				prefix: 'rl:reset:'
		  })
		: undefined
});

// 2FA verification rate limiter
export const twoFactorLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // 10 attempts per window
	message: {
		success: false,
		message: 'Too many 2FA verification attempts'
	},
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		return process.env.NODE_ENV === 'test';
	},
	store: getRedisClient()
		? new RedisStore({
				// @ts-expect-error - Known typing issue with rate-limit-redis
				client: getRedisClient(),
				prefix: 'rl:2fa:'
		  })
		: undefined
});
