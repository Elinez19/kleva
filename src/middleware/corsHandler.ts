import { Request, Response, NextFunction } from 'express';
import { HTTPSTATUS } from '../constants/http.constants';

export function corsHandler(req: Request, res: Response, next: NextFunction): any {
	const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
	const origin = req.header('origin');

	if (allowedOrigins.includes(origin || '')) {
		res.header('Access-Control-Allow-Origin', origin);
	}

	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	res.header('Access-Control-Allow-Credentials', 'true');

	if (req.method === 'OPTIONS') {
		res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
		return res.status(HTTPSTATUS.OK).json({});
	}

	next();
}
