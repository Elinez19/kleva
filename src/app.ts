import express from 'express';
import cookieParser from 'cookie-parser';
import { loggingHandler } from './middleware/loggingHandler';
import { corsHandler } from './middleware/corsHandler';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimitHandler';
import routes from './routes/v1';
import docsRoutes from './routes/docs';
import inngestRoutes from './routes/inngest';
import './config/logging';
import path from 'path';

const application = express();

// Only log in development or if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
	logging.info('-------------------------------------------');
	logging.info('Starting the Handyman Management API');
	logging.info('-------------------------------------------');
}

application.use(express.json());
application.use(express.urlencoded({ extended: true }));
application.use(cookieParser());

// Serve static files from public directory
application.use(express.static(path.join(__dirname, '../public')));

// Only log in development or if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
	logging.info('-------------------------------------------');
	logging.info('Logging & Configuration');
	logging.info('-------------------------------------------');
}
application.use(loggingHandler);
application.use(corsHandler);

// Only log in development or if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
	logging.info('-------------------------------------------');
	logging.info('Rate Limiting');
	logging.info('-------------------------------------------');
}
application.use(apiLimiter);

// Only log in development or if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
	logging.info('-------------------------------------------');
	logging.info('API Routes');
	logging.info('-------------------------------------------');
}
// Documentation and utility routes
application.use('/', docsRoutes);

// Inngest webhook routes
application.use('/api', inngestRoutes);

// v1 api routes
application.use('/', routes);

// Only log in development or if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
	logging.info('-------------------------------------------');
	logging.info('Errors Handling');
	logging.info('-------------------------------------------');
}
application.use(errorHandler);

export { application };
export default application;
