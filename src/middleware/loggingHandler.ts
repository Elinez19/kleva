import { Request, Response, NextFunction } from 'express';
import logging from '../config/logging';

export function loggingHandler(req: Request, res: Response, next: NextFunction) {
	logging.log(`Incoming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress || 'unknown'}]`);

	res.on('finish', () => {
		logging.log(
			`Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress || 'unknown'}] - STATUS: [${res.statusCode}]`
		);
	});

	next();
}
