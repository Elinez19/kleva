import Payment from '../models/payment.model';
import Job from '../models/job.model';
import User from '../models/user.model';
import PaymentUtils from '../utils/paymentUtils';
import { inngest } from '../config/inngest';
import { INNGEST } from '../config/config';
import { IPaymentRequest, IPaymentResponse, IPaymentVerification, PaymentStatus, PaymentMethod } from '../interfaces/IPayment';

// Helper function to safely send Inngest events
const safeInngestSend = async (eventName: string, data: any): Promise<void> => {
	try {
		// Check if Inngest is properly configured
		if (!INNGEST.INNGEST_EVENT_KEY || !INNGEST.INNGEST_SIGNING_KEY) {
			console.log(`Inngest not configured, skipping event: ${eventName}`);
			return;
		}

		await inngest.send({
			name: eventName,
			data
		});
	} catch (error) {
		console.warn(`Failed to send Inngest event ${eventName}:`, error);
		// Don't throw error, just log it
	}
};

export class PaymentService {
	/**
	 * Initialize payment for a job
	 */
	static async initializeJobPayment(
		userId: string,
		jobId: string,
		amount: number,
		description: string,
		metadata?: Record<string, any>
	): Promise<IPaymentResponse> {
		try {
			// Get user details
			const user = await User.findById(userId);
			if (!user) {
				throw new Error('User not found');
			}

			// Get job details
			const job = await Job.findOne({ jobId });
			if (!job) {
				throw new Error('Job not found');
			}

			// Convert amount to kobo
			const amountInKobo = PaymentUtils.toKobo(amount);

			// Create payment request
			const paymentRequest: IPaymentRequest = {
				amount: amountInKobo,
				currency: 'NGN',
				email: user.email,
				userId: userId,
				jobId: jobId,
				description: description,
				metadata: {
					jobTitle: job.title,
					customerName: `${user.profile?.firstName} ${user.profile?.lastName}`,
					...metadata
				},
				callbackUrl: `${process.env.FRONTEND_URL}/payment/callback`
			};

			// Initialize payment with Paystack
			const paymentResponse = await PaymentUtils.initializePayment(paymentRequest);

			if (paymentResponse.success && paymentResponse.payment) {
				// Save payment to database
				const payment = await Payment.create({
					paymentId: paymentResponse.payment.id,
					userId: userId,
					jobId: jobId,
					amount: amountInKobo,
					currency: 'NGN',
					status: PaymentStatus.PENDING,
					paymentMethod: PaymentMethod.CARD,
					description: description,
					metadata: paymentRequest.metadata,
					paystackReference: paymentResponse.payment.reference,
					paystackAccessCode: paymentResponse.payment.accessCode,
					paystackAuthorizationUrl: paymentResponse.payment.authorizationUrl,
					expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
				});

				// Update job with payment info
				await Job.findOneAndUpdate(
					{ jobId },
					{
						paymentId: payment._id.toString(),
						paymentStatus: PaymentStatus.PENDING
					}
				);

				// Send payment initialization event to Inngest
				await safeInngestSend('payment/initialized', {
					paymentId: payment._id.toString(),
					userId: userId,
					jobId: jobId,
					amount: amountInKobo,
					reference: paymentResponse.payment.reference
				});

				return paymentResponse;
			} else {
				throw new Error(paymentResponse.message || 'Payment initialization failed');
			}
		} catch (error: any) {
			console.error('Payment initialization error:', error);
			return {
				success: false,
				message: error.message || 'Payment initialization failed'
			};
		}
	}

	/**
	 * Verify payment and update status
	 */
	static async verifyPayment(reference: string): Promise<IPaymentVerification> {
		try {
			// Verify payment with Paystack
			const verificationResult = await PaymentUtils.verifyPayment(reference);

			if (verificationResult.success && verificationResult.payment) {
				// Update payment in database
				const payment = await Payment.findOneAndUpdate(
					{ paystackReference: reference },
					{
						status: verificationResult.payment.status,
						paidAt: verificationResult.payment.paidAt,
						updatedAt: new Date()
					},
					{ new: true }
				);

				if (payment) {
					// Update job payment status
					if (payment.jobId) {
						await Job.findOneAndUpdate(
							{ jobId: payment.jobId },
							{
								paymentStatus: verificationResult.payment.status,
								status: verificationResult.payment.status === PaymentStatus.SUCCESS ? 'accepted' : 'pending'
							}
						);
					}

					// Send payment verification event to Inngest
					await safeInngestSend('payment/verified', {
						paymentId: payment._id.toString(),
						userId: payment.userId,
						jobId: payment.jobId,
						amount: payment.amount,
						status: verificationResult.payment.status,
						reference: reference
					});

					// If payment successful, trigger job matching
					if (verificationResult.payment.status === PaymentStatus.SUCCESS && payment.jobId) {
						await safeInngestSend('customer/job.posted', {
							customerId: payment.userId,
							jobId: payment.jobId,
							jobTitle: payment.description,
							category: 'general', // Would get from job
							location: 'Lagos, Nigeria', // Would get from job
							urgency: 'medium',
							budget: PaymentUtils.fromKobo(payment.amount)
						});
					}
				}

				return verificationResult;
			} else {
				throw new Error(verificationResult.message || 'Payment verification failed');
			}
		} catch (error: any) {
			console.error('Payment verification error:', error);
			return {
				success: false,
				message: error.message || 'Payment verification failed'
			};
		}
	}

	/**
	 * Get payment history for user
	 */
	static async getPaymentHistory(userId: string, limit: number = 10): Promise<any[]> {
		try {
			const payments = await Payment.find({ userId }).sort({ createdAt: -1 }).limit(limit).populate('jobId', 'title description status').lean();

			return payments.map((payment) => ({
				id: payment._id,
				paymentId: payment.paymentId,
				amount: PaymentUtils.formatAmount(payment.amount),
				status: payment.status,
				description: payment.description,
				createdAt: payment.createdAt,
				paidAt: payment.paidAt,
				job: payment.jobId
			}));
		} catch (error: any) {
			console.error('Get payment history error:', error);
			throw new Error(error.message || 'Failed to fetch payment history');
		}
	}

	/**
	 * Get payment details by reference
	 */
	static async getPaymentByReference(reference: string): Promise<any> {
		try {
			const payment = await Payment.findOne({ paystackReference: reference })
				.populate('userId', 'email profile.firstName profile.lastName')
				.populate('jobId', 'title description status')
				.lean();

			if (!payment) {
				throw new Error('Payment not found');
			}

			return {
				id: payment._id,
				paymentId: payment.paymentId,
				amount: PaymentUtils.formatAmount(payment.amount),
				status: payment.status,
				description: payment.description,
				createdAt: payment.createdAt,
				paidAt: payment.paidAt,
				reference: payment.paystackReference,
				user: payment.userId,
				job: payment.jobId
			};
		} catch (error: any) {
			console.error('Get payment by reference error:', error);
			throw new Error(error.message || 'Failed to fetch payment details');
		}
	}

	/**
	 * Process webhook from Paystack
	 */
	static async processWebhook(webhookData: any): Promise<void> {
		try {
			const { event, data } = webhookData;

			if (event === 'charge.success') {
				// Payment was successful
				await this.verifyPayment(data.reference);
			} else if (event === 'charge.failed') {
				// Payment failed
				const payment = await Payment.findOneAndUpdate(
					{ paystackReference: data.reference },
					{
						status: PaymentStatus.FAILED,
						updatedAt: new Date()
					}
				);

				if (payment) {
					await safeInngestSend('payment/failed', {
						paymentId: payment._id.toString(),
						userId: payment.userId,
						jobId: payment.jobId,
						amount: payment.amount,
						reference: data.reference,
						reason: data.gateway_response
					});
				}
			}
		} catch (error: any) {
			console.error('Webhook processing error:', error);
			throw new Error(error.message || 'Webhook processing failed');
		}
	}

	/**
	 * Create subscription payment
	 */
	static async initializeSubscriptionPayment(userId: string, planId: string, amount: number, description: string): Promise<IPaymentResponse> {
		try {
			const user = await User.findById(userId);
			if (!user) {
				throw new Error('User not found');
			}

			const amountInKobo = PaymentUtils.toKobo(amount);

			const paymentRequest: IPaymentRequest = {
				amount: amountInKobo,
				currency: 'NGN',
				email: user.email,
				userId: userId,
				description: description,
				metadata: {
					planId: planId,
					type: 'subscription',
					customerName: `${user.profile?.firstName} ${user.profile?.lastName}`
				}
			};

			const paymentResponse = await PaymentUtils.initializePayment(paymentRequest);

			if (paymentResponse.success && paymentResponse.payment) {
				await Payment.create({
					paymentId: paymentResponse.payment.id,
					userId: userId,
					amount: amountInKobo,
					currency: 'NGN',
					status: PaymentStatus.PENDING,
					paymentMethod: PaymentMethod.CARD,
					description: description,
					metadata: paymentRequest.metadata,
					paystackReference: paymentResponse.payment.reference,
					paystackAccessCode: paymentResponse.payment.accessCode,
					paystackAuthorizationUrl: paymentResponse.payment.authorizationUrl,
					expiresAt: new Date(Date.now() + 30 * 60 * 1000)
				});
			}

			return paymentResponse;
		} catch (error: any) {
			console.error('Subscription payment initialization error:', error);
			return {
				success: false,
				message: error.message || 'Subscription payment initialization failed'
			};
		}
	}

	/**
	 * Payout to handyman - temporarily simplified
	 */
	static async payoutHandyman(jobId: string, handymanId: string): Promise<{ success: boolean; message: string; data?: any }> {
		try {
			// Simplified implementation for now
			console.log(`Payout request for job ${jobId} to handyman ${handymanId}`);

			return {
				success: true,
				message: 'Payout initiated successfully (simplified)',
				data: {
					jobId,
					handymanId,
					status: 'pending'
				}
			};
		} catch (error: any) {
			console.error('Payout handyman error:', error);
			return {
				success: false,
				message: error.message || 'Payout initiation failed'
			};
		}
	}

	/**
	 * Get payment statistics
	 */
	static async getPaymentStats(userId?: string): Promise<any> {
		try {
			const matchQuery = userId ? { userId } : {};

			const stats = await Payment.aggregate([
				{ $match: matchQuery },
				{
					$group: {
						_id: '$status',
						count: { $sum: 1 },
						totalAmount: { $sum: '$amount' }
					}
				}
			]);

			const totalStats = await Payment.aggregate([
				{ $match: matchQuery },
				{
					$group: {
						_id: null,
						totalPayments: { $sum: 1 },
						totalAmount: { $sum: '$amount' },
						successfulAmount: {
							$sum: {
								$cond: [{ $eq: ['$status', PaymentStatus.SUCCESS] }, '$amount', 0]
							}
						}
					}
				}
			]);

			return {
				byStatus: stats,
				total: totalStats[0] || {
					totalPayments: 0,
					totalAmount: 0,
					successfulAmount: 0
				}
			};
		} catch (error: any) {
			console.error('Get payment stats error:', error);
			throw new Error(error.message || 'Failed to fetch payment statistics');
		}
	}
}

export default PaymentService;
