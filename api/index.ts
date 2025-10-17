import { Request, Response } from 'express';
import { connectDb } from '../src/database/db';

// Initialize database connection once per cold start
let isDbConnected = false;
let dbConnectionAttempted = false;

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
			isDbConnected = false;
		}
	}
	return isDbConnected;
};

// Create Express app lazily to avoid initialization issues
let app: any = null;
const getApp = async () => {
	if (!app) {
		// Initialize database first
		await initializeDb();

		// Import app after DB connection
		const { application } = await import('../src/app');
		app = application;
	}
	return app;
};

// Vercel serverless function handler
export default async (req: Request, res: Response) => {
	try {
		console.log(`Handling ${req.method} ${req.url}`);

		// Get the Express app
		const expressApp = await getApp();

		// Handle the request
		return expressApp(req, res);
	} catch (error) {
		console.error('Error in Vercel handler:', error);
		res.status(500).json({
			error: 'Internal server error',
			message: error instanceof Error ? error.message : 'Unknown error',
			dbConnected: isDbConnected
		});
	}
};
