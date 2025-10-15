import { inngest, Events } from '../config/inngest';
import User from '../models/user.model';

// ============================================================================
// HANDYMAN-SPECIFIC WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Job matching workflow - finds and notifies nearby handymen
 */
export const jobMatchingFlow = inngest.createFunction(
	{
		id: 'job-matching-flow',
		name: 'Job Matching Flow',
		retries: 2
	},
	{ event: 'customer/job.posted' },
	async ({ event, step }: { event: Events['customer/job.posted'] }) => {
		const { customerId, jobId, jobTitle, category, location, urgency, budget } = event.data;

		// Step 1: Find nearby handymen with matching skills
		const matchingHandymen = await step.run('find-matching-handymen', async () => {
			// This would query your handyman database for:
			// - Location proximity
			// - Skill matching
			// - Availability
			// - Rating requirements

			// For now, we'll simulate finding handymen
			const handymen = await User.find({
				role: 'handyman',
				'profile.skills': { $in: [category] },
				isActive: true,
				'profile.isAvailable': true
			}).limit(10);

			return handymen.map((handyman) => ({
				id: handyman._id.toString(),
				name: `${handyman.profile?.firstName} ${handyman.profile?.lastName}`,
				email: handyman.email,
				rating: handyman.profile?.rating || 0,
				hourlyRate: handyman.profile?.hourlyRate || 0,
				location: handyman.profile?.location || ''
			}));
		});

		// Step 2: Send job notifications to each handyman
		const notificationsSent = [];
		for (const handyman of matchingHandymen) {
			const notificationResult = await step.run(`notify-handyman-${handyman.id}`, async () => {
				await inngest.send({
					name: 'handyman/job.matched',
					data: {
						handymanId: handyman.id,
						jobId,
						customerId,
						jobTitle,
						location,
						urgency,
						estimatedDuration: 120 // Default 2 hours
					}
				});
				return { success: true, handymanId: handyman.id };
			});
			notificationsSent.push(notificationResult);
		}

		// Step 3: Schedule follow-up if no responses (2 hours later)
		await step.sleep('2h');

		const responseCheck = await step.run('check-job-responses', async () => {
			// This would check if any handymen have responded to the job
			// For now, we'll simulate checking responses
			const responses = 0; // Would query job responses

			if (responses === 0) {
				// Send follow-up notifications to remaining handymen
				console.log('No responses received, sending follow-up notifications');
				return { followUpSent: true };
			}

			return { followUpSent: false, responses };
		});

		return {
			success: true,
			jobId,
			handymenNotified: notificationsSent.length,
			followUpRequired: responseCheck.followUpSent
		};
	}
);

/**
 * Job completion workflow - handles post-job processes
 */
export const jobCompletionFlow = inngest.createFunction(
	{
		id: 'job-completion-flow',
		name: 'Job Completion Flow',
		retries: 2
	},
	{ event: 'handyman/job.completed' },
	async ({ event, step }: { event: Events['handyman/job.completed'] }) => {
		const { handymanId, jobId, customerId, rating, review } = event.data;

		// Step 1: Update handyman rating and stats
		const handymanUpdate = await step.run('update-handyman-stats', async () => {
			const handyman = await User.findById(handymanId);
			if (!handyman) throw new Error('Handyman not found');

			// Update rating (simple average for now)
			const currentRating = handyman.profile?.rating || 0;
			const totalJobs = handyman.profile?.totalJobs || 0;
			const newRating = rating ? (currentRating * totalJobs + rating) / (totalJobs + 1) : currentRating;

			await User.findByIdAndUpdate(handymanId, {
				$set: {
					'profile.rating': newRating,
					'profile.totalJobs': totalJobs + 1,
					'profile.lastJobCompleted': new Date()
				}
			});

			return {
				success: true,
				newRating,
				totalJobs: totalJobs + 1
			};
		});

		// Step 2: Wait 24 hours, then request customer review
		await step.sleep('24h');

		const reviewRequest = await step.run('request-customer-review', async () => {
			const customer = await User.findById(customerId);
			if (!customer) throw new Error('Customer not found');

			// Send review request email/notification
			console.log(`Requesting review from customer ${customer.email} for job ${jobId}`);

			return {
				success: true,
				customerEmail: customer.email
			};
		});

		// Step 3: If no review after 3 days, send reminder
		await step.sleep('3d');

		const reviewReminder = await step.run('send-review-reminder', async () => {
			// Check if review was submitted
			const hasReview = false; // Would check review database

			if (!hasReview) {
				console.log(`Sending review reminder to customer ${reviewRequest.customerEmail}`);
				return { reminderSent: true };
			}

			return { reminderSent: false };
		});

		// Step 4: Update handyman availability
		await step.run('update-handyman-availability', async () => {
			await User.findByIdAndUpdate(handymanId, {
				$set: { 'profile.isAvailable': true }
			});

			await inngest.send({
				name: 'handyman/availability.changed',
				data: {
					handymanId,
					isAvailable: true,
					reason: 'Job completed'
				}
			});

			return { success: true };
		});

		return {
			success: true,
			jobId,
			handymanId,
			customerId,
			handymanRating: handymanUpdate.newRating,
			reviewRequested: reviewRequest.success,
			reviewReminderSent: reviewReminder.reminderSent
		};
	}
);

/**
 * Handyman availability management
 */
export const handymanAvailabilityFlow = inngest.createFunction(
	{
		id: 'handyman-availability-flow',
		name: 'Handyman Availability Flow',
		retries: 1
	},
	{ event: 'handyman/availability.changed' },
	async ({ event, step }: { event: Events['handyman/availability.changed'] }) => {
		const { handymanId, isAvailable, reason } = event.data;

		// Update handyman availability in database
		const availabilityUpdate = await step.run('update-availability', async () => {
			await User.findByIdAndUpdate(handymanId, {
				$set: {
					'profile.isAvailable': isAvailable,
					'profile.availabilityReason': reason,
					'profile.lastAvailabilityChange': new Date()
				}
			});

			return { success: true };
		});

		// If becoming available, check for pending jobs
		if (isAvailable) {
			await step.run('check-pending-jobs', async () => {
				// This would find jobs that were waiting for this handyman
				console.log(`Handyman ${handymanId} is now available, checking for pending jobs`);
				return { success: true };
			});
		}

		return {
			success: true,
			handymanId,
			isAvailable,
			reason
		};
	}
);

/**
 * Handyman performance monitoring
 */
export const handymanPerformanceFlow = inngest.createFunction(
	{
		id: 'handyman-performance-flow',
		name: 'Handyman Performance Flow',
		retries: 1
	},
	{ cron: '0 0 * * 1' }, // Weekly on Monday at midnight
	async ({ step }) => {
		const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

		// Find handymen with low performance
		const lowPerformers = await step.run('find-low-performers', async () => {
			return await User.find({
				role: 'handyman',
				isActive: true,
				$or: [{ 'profile.rating': { $lt: 3.0 } }, { 'profile.totalJobs': { $lt: 2 } }, { 'profile.lastJobCompleted': { $lt: oneWeekAgo } }]
			}).select('_id email profile.firstName profile.rating profile.totalJobs');
		});

		// Send performance improvement suggestions
		for (const handyman of lowPerformers) {
			await step.run(`send-performance-tips-${handyman._id}`, async () => {
				console.log(`Sending performance tips to handyman ${handyman.email}`);
				// This would send personalized performance improvement tips
				return { success: true, handymanId: handyman._id };
			});
		}

		// Find top performers for recognition
		const topPerformers = await step.run('find-top-performers', async () => {
			return await User.find({
				role: 'handyman',
				isActive: true,
				'profile.rating': { $gte: 4.5 },
				'profile.totalJobs': { $gte: 5 }
			}).select('_id email profile.firstName profile.rating profile.totalJobs');
		});

		// Send recognition emails
		for (const handyman of topPerformers) {
			await step.run(`send-recognition-${handyman._id}`, async () => {
				console.log(`Sending recognition email to top performer ${handyman.email}`);
				return { success: true, handymanId: handyman._id };
			});
		}

		return {
			success: true,
			lowPerformersFound: lowPerformers.length,
			topPerformersFound: topPerformers.length,
			performanceTipsSent: lowPerformers.length,
			recognitionEmailsSent: topPerformers.length
		};
	}
);

export default inngest;
