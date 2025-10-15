import { Request, Response } from 'express';
import PaymentService from '../services/paymentServices';
import PaymentUtils from '../utils/paymentUtils';
import { validateBody } from '../middleware/validationHandler';
import { authenticate } from '../middleware/authHandler';
import { z } from 'zod';

// Validation schemas
const initializePaymentSchema = z.object({
	jobId: z.string().min(1, 'Job ID is required'),
	amount: z.number().min(100, 'Minimum amount is ₦1.00'),
	description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
	metadata: z.record(z.string(), z.any()).optional()
});

const verifyPaymentSchema = z.object({
	reference: z.string().min(1, 'Payment reference is required')
});

const subscriptionPaymentSchema = z.object({
	planId: z.string().min(1, 'Plan ID is required'),
	amount: z.number().min(100, 'Minimum amount is ₦1.00'),
	description: z.string().min(1, 'Description is required')
});

// Payment Controllers
export const initializeJobPayment = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
		}

		const { jobId, amount, description, metadata } = req.body;

		const result = await PaymentService.initializeJobPayment(userId, jobId, amount, description, metadata);

		if (result.success) {
			res.status(200).json({
				success: true,
				message: 'Payment initialized successfully',
				data: result.payment
			});
		} else {
			res.status(400).json({
				success: false,
				message: result.message
			});
		}
	} catch (error: any) {
		console.error('Initialize payment error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Payment initialization failed'
		});
	}
};

export const verifyPayment = async (req: Request, res: Response) => {
	try {
		const { reference } = req.params;

		const result = await PaymentService.verifyPayment(reference);

		if (result.success) {
			res.status(200).json({
				success: true,
				message: 'Payment verified successfully',
				data: result.payment
			});
		} else {
			res.status(400).json({
				success: false,
				message: result.message
			});
		}
	} catch (error: any) {
		console.error('Verify payment error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Payment verification failed'
		});
	}
};

export const getPaymentHistory = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
		}

		const limit = parseInt(req.query.limit as string) || 10;

		const payments = await PaymentService.getPaymentHistory(userId, limit);

		res.status(200).json({
			success: true,
			message: 'Payment history retrieved successfully',
			data: payments
		});
	} catch (error: any) {
		console.error('Get payment history error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to fetch payment history'
		});
	}
};

export const getPaymentDetails = async (req: Request, res: Response) => {
	try {
		const { reference } = req.params;

		const payment = await PaymentService.getPaymentByReference(reference);

		res.status(200).json({
			success: true,
			message: 'Payment details retrieved successfully',
			data: payment
		});
	} catch (error: any) {
		console.error('Get payment details error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to fetch payment details'
		});
	}
};

export const initializeSubscriptionPayment = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
		}

		const { planId, amount, description } = req.body;

		const result = await PaymentService.initializeSubscriptionPayment(userId, planId, amount, description);

		if (result.success) {
			res.status(200).json({
				success: true,
				message: 'Subscription payment initialized successfully',
				data: result.payment
			});
		} else {
			res.status(400).json({
				success: false,
				message: result.message
			});
		}
	} catch (error: any) {
		console.error('Initialize subscription payment error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Subscription payment initialization failed'
		});
	}
};

export const getPaymentStats = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId; // Optional - if provided, get user-specific stats

		const stats = await PaymentService.getPaymentStats(userId);

		res.status(200).json({
			success: true,
			message: 'Payment statistics retrieved successfully',
			data: stats
		});
	} catch (error: any) {
		console.error('Get payment stats error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to fetch payment statistics'
		});
	}
};

export const getBanks = async (req: Request, res: Response) => {
	try {
		const result = await PaymentUtils.getBanks();

		if (result.success) {
			res.status(200).json({
				success: true,
				message: 'Banks retrieved successfully',
				data: result.data
			});
		} else {
			res.status(400).json({
				success: false,
				message: result.message
			});
		}
	} catch (error: any) {
		console.error('Get banks error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to fetch banks'
		});
	}
};

export const createTransferRecipient = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
		}

		const { type, name, accountNumber, bankCode, email } = req.body;

		const result = await PaymentUtils.createTransferRecipient(type, name, accountNumber, bankCode, email);

		if (result.success) {
			res.status(200).json({
				success: true,
				message: 'Transfer recipient created successfully',
				data: result.data
			});
		} else {
			res.status(400).json({
				success: false,
				message: result.message
			});
		}
	} catch (error: any) {
		console.error('Create transfer recipient error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to create transfer recipient'
		});
	}
};

export const payoutHandyman = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
		}

		// Check if user is admin
		if (req.user?.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Admin access required'
			});
		}

		const { jobId, handymanId } = req.body;

		const result = await PaymentService.payoutHandyman(jobId, handymanId);

		if (result.success) {
			res.status(200).json({
				success: true,
				message: 'Payout initiated successfully',
				data: result.data
			});
		} else {
			res.status(400).json({
				success: false,
				message: result.message
			});
		}
	} catch (error: any) {
		console.error('Payout handyman error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Payout initiation failed'
		});
	}
};

export const processWebhook = async (req: Request, res: Response) => {
	try {
		const signature = req.headers['x-paystack-signature'] as string;
		const payload = JSON.stringify(req.body);

		// Validate webhook signature
		const isValidSignature = PaymentUtils.validateWebhookSignature(payload, signature);

		if (!isValidSignature) {
			return res.status(400).json({
				success: false,
				message: 'Invalid webhook signature'
			});
		}

		// Process webhook
		await PaymentService.processWebhook(req.body);

		res.status(200).json({
			success: true,
			message: 'Webhook processed successfully'
		});
	} catch (error: any) {
		console.error('Webhook processing error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Webhook processing failed'
		});
	}
};

// Export validation schemas
export { initializePaymentSchema, verifyPaymentSchema, subscriptionPaymentSchema };
