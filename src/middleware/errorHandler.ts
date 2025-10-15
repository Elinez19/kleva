import { Request, Response, NextFunction } from 'express';
import { HTTPSTATUS } from '../constants/http.constants';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
	let statusCode = res.statusCode !== HTTPSTATUS.OK ? res.statusCode : HTTPSTATUS.INTERNAL_SERVER_ERROR;
	let message = err.message || 'Internal Server Error';

	// JWT errors
	if (err.name === 'JsonWebTokenError') {
		statusCode = HTTPSTATUS.UNAUTHORIZED;
		message = 'Invalid token';
	} else if (err.name === 'TokenExpiredError') {
		statusCode = HTTPSTATUS.UNAUTHORIZED;
		message = 'Token has expired';
	}

	// Validation errors (Zod)
	if (err.name === 'ZodError') {
		statusCode = HTTPSTATUS.BAD_REQUEST;
		message = err.errors.map((e: any) => e.message).join(', ');
	}

	// MongoDB duplicate key error
	if (err.code === 11000) {
		statusCode = HTTPSTATUS.CONFLICT;
		const field = Object.keys(err.keyPattern)[0];
		message = `${field} already exists`;
	}

	// MongoDB validation error
	if (err.name === 'ValidationError') {
		statusCode = HTTPSTATUS.BAD_REQUEST;
		message = Object.values(err.errors)
			.map((e: any) => e.message)
			.join(', ');
	}

	// Rate limit errors
	if (err.name === 'TooManyRequestsError') {
		statusCode = HTTPSTATUS.TOO_MANY_REQUESTS;
		message = 'Too many requests, please try again later';
	}

	res.status(statusCode).json({
		success: false,
		error: {
			message: statusCode === HTTPSTATUS.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
			...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
		}
	});
}
