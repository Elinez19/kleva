import { SERVER } from '../config/config';
import mongoose from 'mongoose';
import '../config/logging';

export const connectDb = async (): Promise<void> => {
	try {
		const options = {
			serverSelectionTimeoutMS: 10000,
			heartbeatFrequencyMS: 2000,
			connectTimeoutMS: 10000,
			socketTimeoutMS: 45000,
			maxPoolSize: 10,
			retryWrites: true,
			w: 'majority' as const
		};

		// Debug logging
		logging.log('-------------------------------------------');
		logging.log('Attempting MongoDB connection...');
		// Safely log URI without credentials
		const uri = SERVER.MONGODB_URI as string;
		const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
		logging.log(`URI: ${maskedUri}`);

		if (!uri) {
			throw new Error('MONGODB_URI environment variable is not set');
		}

		const conn = await mongoose.connect(uri, options);

		logging.log('-------------------------------------------');
		logging.log(`MongoDB Connected: ${conn.connection.host}`);
		logging.log('-------------------------------------------');

		// Connection event handlers
		mongoose.connection.on('error', (err: Error) => {
			logging.error('MongoDB connection error:', err);
		});

		mongoose.connection.on('disconnected', () => {
			logging.error('MongoDB disconnected');
		});
	} catch (error) {
		logging.error('-------------------------------------------');
		logging.error('Connection error details:');
		if (error instanceof Error) {
			if (error.name === 'MongooseServerSelectionError') {
				logging.error('Server Selection Error - Unable to connect to any servers');
				// Safe type check for the error reason
				const mongoError = error as any;
				logging.error('Servers checked:', mongoError.reason?.servers?.size || 'unknown');
			} else if (error.message.includes('ESERVFAIL')) {
				logging.error('DNS Resolution Error - Check your internet connection and MongoDB Atlas cluster status');
				logging.error('This could be due to:');
				logging.error('1. Network connectivity issues');
				logging.error('2. MongoDB Atlas cluster being paused or unavailable');
				logging.error('3. Incorrect connection string');
			}
			logging.error(error.message);
			logging.error(error.stack);
		} else {
			logging.error('An unknown error occurred:', error);
		}
		logging.error('-------------------------------------------');
		// Don't exit the process - allow server to continue for Swagger UI
		// process.exit(1);
	}
};
