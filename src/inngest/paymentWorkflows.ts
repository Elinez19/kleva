import { inngest, Events } from '../config/inngest';
import Payment from '../models/payment.model';
import Job from '../models/job.model';
import User from '../models/user.model';
import PaymentUtils from '../utils/paymentUtils';
import { sendPaymentConfirmationEmail, sendPaymentFailedEmail, sendHandymanPayoutEmail } from '../utils/emailUtils';

// ============================================================================
// PAYMENT WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Payment initialization workflow
 */
export const paymentInitializedFlow = inngest.createFunction(
	{
		id: 'payment-initialized-flow',
		name: 'Payment Initialized Flow',
		retries: 2
	},
	{ event: 'payment/initialized' },
	async ({ event, step }: { event: Events['payment/initialized'] }) => {
		const { paymentId, userId, jobId, amount, reference } = event.data;

		// Step 1: Log payment initialization
		await step.run('log-payment-init', async () => {
			console.log(`Payment initialized: ${reference} for job ${jobId}`);
			return { success: true };
		});

		// Step 2: Update job status to pending payment
		await step.run('update-job-status', async () => {
			await Job.findOneAndUpdate(
				{ jobId },
				{
					status: 'pending_payment',
					paymentStatus: 'pending'
				}
			);
			return { success: true };
		});

		// Step 3: Schedule payment expiry check (30 minutes)
		await step.sleep('30m');

		const expiryCheck = await step.run('check-payment-expiry', async () => {
			const payment = await Payment.findById(paymentId);
			if (payment && payment.status === 'pending') {
				// Payment expired, update status
				await Payment.findByIdAndUpdate(paymentId, {
					status: 'expired',
					updatedAt: new Date()
				});

				await Job.findOneAndUpdate(
					{ jobId },
					{
						status: 'cancelled',
						paymentStatus: 'expired'
					}
				);

				return { expired: true };
			}
			return { expired: false };
		});

		return {
			success: true,
			paymentId,
			jobId,
			expired: expiryCheck.expired
		};
	}
);

/**
 * Payment verification workflow
 */
export const paymentVerifiedFlow = inngest.createFunction(
	{
		id: 'payment-verified-flow',
		name: 'Payment Verified Flow',
		retries: 3
	},
	{ event: 'payment/verified' },
	async ({ event, step }: { event: Events['payment/verified'] }) => {
		const { paymentId, userId, jobId, amount, status, reference } = event.data;

		// Step 1: Update payment and job status
		const statusUpdate = await step.run('update-payment-status', async () => {
			await Payment.findByIdAndUpdate(paymentId, {
				status: status,
				paidAt: new Date(),
				updatedAt: new Date()
			});

			await Job.findOneAndUpdate(
				{ jobId },
				{
					status: status === 'success' ? 'accepted' : 'pending',
					paymentStatus: status
				}
			);

			return { success: true };
		});

		// Step 2: Send confirmation email if successful
		if (status === 'success') {
			await step.run('send-payment-confirmation', async () => {
				const user = await User.findById(userId);
				const job = await Job.findOne({ jobId });

				if (user && job) {
					await sendPaymentConfirmationEmail(
						user.email,
						user.profile?.firstName || 'User',
						PaymentUtils.formatAmount(amount),
						job.title,
						reference
					);
				}
				return { success: true };
			});

			// Step 3: Trigger job matching for successful payment
			await step.run('trigger-job-matching', async () => {
				const job = await Job.findOne({ jobId });
				if (job) {
					await inngest.send({
						name: 'customer/job.posted',
						data: {
							customerId: userId,
							jobId: jobId,
							jobTitle: job.title,
							category: job.category,
							location: job.location.address,
							urgency: job.urgency,
							budget: PaymentUtils.fromKobo(amount)
						}
					});
				}
				return { success: true };
			});
		}

		return {
			success: true,
			paymentId,
			jobId,
			status,
			confirmationSent: status === 'success'
		};
	}
);

/**
 * Payment failed workflow
 */
export const paymentFailedFlow = inngest.createFunction(
	{
		id: 'payment-failed-flow',
		name: 'Payment Failed Flow',
		retries: 2
	},
	{ event: 'payment/failed' },
	async ({ event, step }: { event: Events['payment/failed'] }) => {
		const { paymentId, userId, jobId, amount, reference, reason } = event.data;

		// Step 1: Update payment status
		await step.run('update-failed-payment', async () => {
			await Payment.findByIdAndUpdate(paymentId, {
				status: 'failed',
				updatedAt: new Date()
			});

			await Job.findOneAndUpdate(
				{ jobId },
				{
					status: 'cancelled',
					paymentStatus: 'failed'
				}
			);
			return { success: true };
		});

		// Step 2: Send failure notification email
		await step.run('send-failure-notification', async () => {
			const user = await User.findById(userId);
			const job = await Job.findOne({ jobId });

			if (user && job) {
				await sendPaymentFailedEmail(
					user.email,
					user.profile?.firstName || 'User',
					PaymentUtils.formatAmount(amount),
					job.title,
					reference,
					reason
				);
			}
			return { success: true };
		});

		// Step 3: Schedule retry reminder (24 hours later)
		await step.sleep('24h');

		await step.run('send-retry-reminder', async () => {
			const payment = await Payment.findById(paymentId);
			if (payment && payment.status === 'failed') {
				const user = await User.findById(userId);
				if (user) {
					console.log(`Sending payment retry reminder to ${user.email}`);
					// This would send a retry reminder email
				}
			}
			return { success: true };
		});

		return {
			success: true,
			paymentId,
			jobId,
			failureNotificationSent: true,
			retryReminderScheduled: true
		};
	}
);

/**
 * Payment completion workflow (when job is completed and handyman needs payout)
 */
export const paymentCompletionFlow = inngest.createFunction(
	{
		id: 'payment-completion-flow',
		name: 'Payment Completion Flow',
		retries: 3
	},
	{ event: 'payment/completed' },
	async ({ event, step }: { event: Events['payment/completed'] }) => {
		const { paymentId, userId, handymanId, jobId, amount, platformFee, handymanPayout } = event.data;

		// Step 1: Create transfer to handyman
		const transferResult = await step.run('create-handyman-transfer', async () => {
			// This would create a transfer to the handyman's account
			// For now, we'll simulate the transfer
			console.log(`Creating transfer of ${PaymentUtils.formatAmount(handymanPayout)} to handyman ${handymanId}`);

			// In a real implementation, you would:
			// 1. Get handyman's transfer recipient code
			// 2. Create transfer using PaymentUtils.createTransfer()
			// 3. Handle transfer success/failure

			return { success: true, transferId: 'transfer_123' };
		});

		// Step 2: Update payment with transfer info
		await step.run('update-payment-transfer', async () => {
			await Payment.findByIdAndUpdate(paymentId, {
				$set: {
					'metadata.transferId': transferResult.transferId,
					'metadata.platformFee': platformFee,
					'metadata.handymanPayout': handymanPayout,
					'metadata.transferStatus': 'pending'
				}
			});
			return { success: true };
		});

		// Step 3: Send payout notification to handyman
		await step.run('notify-handyman-payout', async () => {
			const handyman = await User.findById(handymanId);
			const job = await Job.findOne({ jobId });

			if (handyman && job) {
				await sendHandymanPayoutEmail(
					handyman.email,
					handyman.profile?.firstName || 'Handyman',
					PaymentUtils.formatAmount(handymanPayout),
					job.title,
					transferResult.transferId
				);
			}
			return { success: true };
		});

		// Step 4: Update job status to completed
		await step.run('complete-job', async () => {
			await Job.findOneAndUpdate(
				{ jobId },
				{
					status: 'completed',
					completedAt: new Date()
				}
			);
			return { success: true };
		});

		return {
			success: true,
			paymentId,
			jobId,
			handymanId,
			transferCreated: transferResult.success,
			payoutNotified: true,
			jobCompleted: true
		};
	}
);

/**
 * Daily payment analytics workflow
 */
export const dailyPaymentAnalyticsFlow = inngest.createFunction(
	{
		id: 'daily-payment-analytics-flow',
		name: 'Daily Payment Analytics Flow',
		retries: 1
	},
	{ cron: '0 2 * * *' }, // Daily at 2 AM
	async ({ step }) => {
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const today = new Date();

		// Step 1: Calculate daily payment metrics
		const paymentMetrics = await step.run('calculate-payment-metrics', async () => {
			const [totalPayments, successfulPayments, failedPayments, totalRevenue, platformFees, handymanPayouts] = await Promise.all([
				Payment.countDocuments({
					createdAt: { $gte: yesterday, $lt: today }
				}),
				Payment.countDocuments({
					createdAt: { $gte: yesterday, $lt: today },
					status: 'success'
				}),
				Payment.countDocuments({
					createdAt: { $gte: yesterday, $lt: today },
					status: 'failed'
				}),
				Payment.aggregate([
					{
						$match: {
							createdAt: { $gte: yesterday, $lt: today },
							status: 'success'
						}
					},
					{
						$group: {
							_id: null,
							total: { $sum: '$amount' }
						}
					}
				]),
				Payment.aggregate([
					{
						$match: {
							createdAt: { $gte: yesterday, $lt: today },
							status: 'success'
						}
					},
					{
						$group: {
							_id: null,
							total: { $sum: '$metadata.platformFee' }
						}
					}
				]),
				Payment.aggregate([
					{
						$match: {
							createdAt: { $gte: yesterday, $lt: today },
							status: 'success'
						}
					},
					{
						$group: {
							_id: null,
							total: { $sum: '$metadata.handymanPayout' }
						}
					}
				])
			]);

			return {
				date: yesterday.toISOString().split('T')[0],
				totalPayments,
				successfulPayments,
				failedPayments,
				successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
				totalRevenue: totalRevenue[0]?.total || 0,
				platformFees: platformFees[0]?.total || 0,
				handymanPayouts: handymanPayouts[0]?.total || 0
			};
		});

		// Step 2: Generate payment report
		await step.run('generate-payment-report', async () => {
			const report = {
				summary: {
					date: paymentMetrics.date,
					totalTransactions: paymentMetrics.totalPayments,
					successfulTransactions: paymentMetrics.successfulPayments,
					successRate: paymentMetrics.successRate,
					totalRevenue: PaymentUtils.formatAmount(paymentMetrics.totalRevenue),
					platformRevenue: PaymentUtils.formatAmount(paymentMetrics.platformFees),
					handymanPayouts: PaymentUtils.formatAmount(paymentMetrics.handymanPayouts)
				},
				insights: []
			};

			// Generate insights
			if (paymentMetrics.successRate < 80) {
				report.insights.push('Payment success rate is below 80% - investigate payment failures');
			}

			if (paymentMetrics.totalPayments === 0) {
				report.insights.push('No payments processed today - check system health');
			}

			console.log('Daily Payment Report:', JSON.stringify(report, null, 2));
			return report;
		});

		return {
			success: true,
			date: paymentMetrics.date,
			metrics: paymentMetrics
		};
	}
);

export default inngest;
