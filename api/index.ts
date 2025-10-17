import { Request, Response } from 'express';
import { application } from '../src/app';
import { connectDb } from '../src/database/db';

let isDbConnected = false;
let dbConnectionAttempted = false;

// Initialize database connection with better error handling
const initializeDb = async () => {
	if (!dbConnectionAttempted) {
		dbConnectionAttempted = true;
		try {
			console.log('Attempting MongoDB connection...');
			await connectDb();
			isDbConnected = true;
			console.log('MongoDB connection successful');
		} catch (error) {
			console.error('MongoDB connection failed:', error);
			// Don't throw - allow app to continue without DB
			isDbConnected = false;
		}
	}
	return isDbConnected;
};

// Vercel serverless function handler
export default async (req: Request, res: Response) => {
	try {
		console.log(`Handling ${req.method} ${req.url}`);

		// Try to connect to database (non-blocking)
		await initializeDb();

		// Use the Express app to handle the request
		return application(req, res);
	} catch (error) {
		console.error('Error in Vercel handler:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error instanceof Error ? error.message : 'Unknown error',
			dbConnected: isDbConnected
		});
	}
};
