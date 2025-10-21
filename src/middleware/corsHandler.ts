import { Request, Response, NextFunction } from 'express';
import { HTTPSTATUS } from '../constants/http.constants';
import { FRONTEND_URL } from '../config/config';

export function corsHandler(req: Request, res: Response, next: NextFunction): any {
	// Use FRONTEND_URL from environment, fallback to localhost for development
	const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:5173', 'http://localhost:3000'];

	const origin = req.header('origin');

	// Only set CORS headers for allowed origins
	if (allowedOrigins.includes(origin || '')) {
		res.header('Access-Control-Allow-Origin', origin);
		res.header('Access-Control-Allow-Credentials', 'true');
	} else {
		// For non-allowed origins, don't set any CORS headers
		// This prevents unauthorized cross-origin requests
		if (req.method === 'OPTIONS') {
			return res.status(HTTPSTATUS.FORBIDDEN).json({
				success: false,
				message: 'CORS policy violation'
			});
		}
	}

	// Only set these headers for allowed origins
	if (allowedOrigins.includes(origin || '')) {
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
		res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
		res.header('Access-Control-Expose-Headers', 'Authorization'); // Only expose necessary headers
	}

	if (req.method === 'OPTIONS') {
		res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET, OPTIONS');
		return res.status(HTTPSTATUS.OK).json({});
	}

	next();
}
