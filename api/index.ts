import { Request, Response } from 'express';
import { application } from '../src/app';
import { connectDb } from '../src/database/db';

let isDbConnected = false;

// Initialize database connection
const initializeDb = async () => {
	if (!isDbConnected) {
		await connectDb();
		isDbConnected = true;
	}
};

// Vercel serverless function handler
export default async (req: Request, res: Response) => {
	try {
		// Ensure database is connected
		await initializeDb();

		// Set CORS headers
		res.setHeader('Access-Control-Allow-Credentials', 'true');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
		res.setHeader(
			'Access-Control-Allow-Headers',
			'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
		);

		// Handle preflight requests
		if (req.method === 'OPTIONS') {
			res.status(200).end();
			return;
		}

		// Use the Express app to handle the request
		return application(req, res);
	} catch (error) {
		console.error('Error in Vercel handler:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};
