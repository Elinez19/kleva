import express from 'express';
import * as paymentControllers from '../../controllers/paymentControllers';
import { authenticate } from '../../middleware/authHandler';
import { validateBody, validateQuery } from '../../middleware/validationHandler';
import { userLimiter } from '../../middleware/rateLimitHandler';
import {
	initializePaymentSchema,
	subscriptionPaymentSchema,
	transferRecipientSchema,
	payoutSchema,
	paymentHistoryQuerySchema,
	paymentStatsQuerySchema
} from '../../validation/payment.validation';

const router = express.Router();

// Public routes (no authentication required)
router.get('/banks', paymentControllers.getBanks);
router.get('/verify/:reference', paymentControllers.verifyPayment);
router.post('/webhook', paymentControllers.processWebhook);

// Protected routes (authentication required)
router.use(authenticate);

// Payment initialization routes
router.post('/initialize-job', userLimiter, validateBody(initializePaymentSchema), paymentControllers.initializeJobPayment);
router.post('/initialize-subscription', userLimiter, validateBody(subscriptionPaymentSchema), paymentControllers.initializeSubscriptionPayment);

// Payment history and stats
router.get('/history', userLimiter, validateQuery(paymentHistoryQuerySchema), paymentControllers.getPaymentHistory);
router.get('/stats', userLimiter, validateQuery(paymentStatsQuerySchema), paymentControllers.getPaymentStats);

// Transfer recipient management
router.post('/transfer-recipient', userLimiter, validateBody(transferRecipientSchema), paymentControllers.createTransferRecipient);

// Admin routes
router.post('/payout-handyman', userLimiter, validateBody(payoutSchema), paymentControllers.payoutHandyman);

export default router;
