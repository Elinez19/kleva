import express from 'express';
import authRoutes from './authRoutes';
import paymentRoutes from './paymentRoutes';

const router = express.Router();

const defaultRoutes = [
	// Auth Routes
	{
		path: '/api/v1/auth',
		route: authRoutes
	},
	// Payment Routes
	{
		path: '/api/v1/payments',
		route: paymentRoutes
	}
];

defaultRoutes.forEach((route) => {
	router.use(route.path, route.route);
});

export default router;
