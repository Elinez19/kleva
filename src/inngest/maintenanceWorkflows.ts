import { inngest, Events } from '../config/inngest';
import User from '../models/user.model';
import RefreshToken from '../models/refreshToken.model';
import Session from '../models/session.model';

// ============================================================================
// SYSTEM MAINTENANCE WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Daily analytics and reporting
 */
export const dailyAnalyticsFlow = inngest.createFunction(
	{
		id: 'daily-analytics-flow',
		name: 'Daily Analytics Flow',
		retries: 1
	},
	{ cron: '0 1 * * *' }, // Daily at 1 AM
	async ({ step }) => {
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const today = new Date();

		// Aggregate daily metrics
		const metrics = await step.run('aggregate-daily-metrics', async () => {
			const [newUsers, activeUsers, completedJobs, totalRevenue, handymanStats, customerStats] = await Promise.all([
				// New users
				User.countDocuments({
					createdAt: { $gte: yesterday, $lt: today }
				}),

				// Active users (logged in yesterday)
				User.countDocuments({
					lastLogin: { $gte: yesterday, $lt: today },
					isActive: true
				}),

				// Completed jobs (would query job collection)
				0, // Placeholder - would query actual job collection

				// Revenue (would query payment collection)
				0, // Placeholder - would query actual payment collection

				// Handyman stats
				User.aggregate([
					{ $match: { role: 'handyman', isActive: true } },
					{
						$group: {
							_id: null,
							total: { $sum: 1 },
							avgRating: { $avg: '$profile.rating' },
							available: { $sum: { $cond: ['$profile.isAvailable', 1, 0] } }
						}
					}
				]),

				// Customer stats
				User.aggregate([
					{ $match: { role: 'customer', isActive: true } },
					{
						$group: {
							_id: null,
							total: { $sum: 1 },
							verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
						}
					}
				])
			]);

			return {
				date: yesterday.toISOString().split('T')[0],
				newUsers,
				activeUsers,
				completedJobs,
				totalRevenue,
				handymen: handymanStats[0] || { total: 0, avgRating: 0, available: 0 },
				customers: customerStats[0] || { total: 0, verified: 0 }
			};
		});

		// Generate daily report
		const report = await step.run('generate-daily-report', async () => {
			const reportData = {
				summary: {
					date: metrics.date,
					newUsers: metrics.newUsers,
					activeUsers: metrics.activeUsers,
					completedJobs: metrics.completedJobs,
					revenue: metrics.totalRevenue
				},
				userStats: {
					handymen: {
						total: metrics.handymen.total,
						available: metrics.handymen.available,
						avgRating: metrics.handymen.avgRating
					},
					customers: {
						total: metrics.customers.total,
						verified: metrics.customers.verified,
						verificationRate: metrics.customers.total > 0 ? (metrics.customers.verified / metrics.customers.total) * 100 : 0
					}
				}
			};

			console.log('Daily Report Generated:', JSON.stringify(reportData, null, 2));
			return reportData;
		});

		// Send report to admins
		await step.run('send-admin-report', async () => {
			const admins = await User.find({
				role: 'admin',
				isActive: true
			}).select('email profile.firstName');

			for (const admin of admins) {
				console.log(`Sending daily report to admin ${admin.email}`);
				// This would send the report via email
			}

			return { success: true, adminsNotified: admins.length };
		});

		return {
			success: true,
			date: metrics.date,
			metrics,
			reportGenerated: true
		};
	}
);

/**
 * Weekly system maintenance
 */
export const weeklyMaintenanceFlow = inngest.createFunction(
	{
		id: 'weekly-maintenance-flow',
		name: 'Weekly Maintenance Flow',
		retries: 1
	},
	{ cron: '0 3 * * 0' }, // Weekly on Sunday at 3 AM
	async ({ step }) => {
		const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

		// Clean up expired sessions
		const sessionCleanup = await step.run('cleanup-expired-sessions', async () => {
			const result = await Session.deleteMany({
				expiresAt: { $lt: new Date() }
			});
			return { deleted: result.deletedCount };
		});

		// Clean up old refresh tokens
		const tokenCleanup = await step.run('cleanup-old-refresh-tokens', async () => {
			const result = await RefreshToken.deleteMany({
				expiresAt: { $lt: oneWeekAgo }
			});
			return { deleted: result.deletedCount };
		});

		// Archive inactive users (soft delete)
		const userArchive = await step.run('archive-inactive-users', async () => {
			const result = await User.updateMany(
				{
					lastLogin: { $lt: sixMonthsAgo },
					isActive: true,
					role: { $in: ['customer', 'handyman'] }
				},
				{
					$set: {
						isActive: false,
						archivedAt: new Date(),
						archiveReason: 'Inactive for 6+ months'
					}
				}
			);
			return { archived: result.modifiedCount };
		});

		// Clean up old logs (if you have a logs collection)
		const logCleanup = await step.run('cleanup-old-logs', async () => {
			// This would clean up old application logs
			console.log('Cleaning up old application logs...');
			return { deleted: 0 }; // Placeholder
		});

		// Database optimization
		const dbOptimization = await step.run('database-optimization', async () => {
			// This would run database maintenance tasks
			console.log('Running database optimization...');
			return { success: true };
		});

		// Generate weekly summary
		const weeklySummary = await step.run('generate-weekly-summary', async () => {
			const summary = {
				week: new Date().toISOString().split('T')[0],
				cleanup: {
					expiredSessions: sessionCleanup.deleted,
					oldTokens: tokenCleanup.deleted,
					archivedUsers: userArchive.archived,
					oldLogs: logCleanup.deleted
				},
				optimization: {
					databaseOptimized: dbOptimization.success
				}
			};

			console.log('Weekly Maintenance Summary:', JSON.stringify(summary, null, 2));
			return summary;
		});

		return {
			success: true,
			maintenanceCompleted: true,
			summary: weeklySummary
		};
	}
);

/**
 * Monthly analytics and insights
 */
export const monthlyAnalyticsFlow = inngest.createFunction(
	{
		id: 'monthly-analytics-flow',
		name: 'Monthly Analytics Flow',
		retries: 1
	},
	{ cron: '0 2 1 * *' }, // First day of every month at 2 AM
	async ({ step }) => {
		const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

		// Calculate monthly growth metrics
		const growthMetrics = await step.run('calculate-growth-metrics', async () => {
			const [currentMonthUsers, previousMonthUsers, currentMonthJobs, previousMonthJobs] = await Promise.all([
				User.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
				User.countDocuments({
					createdAt: { $gte: twoMonthsAgo, $lt: oneMonthAgo }
				}),
				0, // Placeholder for jobs
				0 // Placeholder for jobs
			]);

			const userGrowthRate = previousMonthUsers > 0 ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100 : 0;

			const jobGrowthRate = previousMonthJobs > 0 ? ((currentMonthJobs - previousMonthJobs) / previousMonthJobs) * 100 : 0;

			return {
				userGrowth: {
					current: currentMonthUsers,
					previous: previousMonthUsers,
					growthRate: userGrowthRate
				},
				jobGrowth: {
					current: currentMonthJobs,
					previous: previousMonthJobs,
					growthRate: jobGrowthRate
				}
			};
		});

		// Analyze user engagement
		const engagementAnalysis = await step.run('analyze-user-engagement', async () => {
			const [totalUsers, activeUsers, verifiedUsers, handymenWithJobs, customersWithJobs] = await Promise.all([
				User.countDocuments({ isActive: true }),
				User.countDocuments({
					lastLogin: { $gte: oneMonthAgo },
					isActive: true
				}),
				User.countDocuments({
					isEmailVerified: true,
					isActive: true
				}),
				User.countDocuments({
					role: 'handyman',
					'profile.totalJobs': { $gt: 0 },
					isActive: true
				}),
				User.countDocuments({
					role: 'customer',
					// Would check for jobs posted
					isActive: true
				})
			]);

			return {
				totalUsers,
				activeUsers,
				activeUserRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
				verifiedUsers,
				verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
				engagedHandymen: handymenWithJobs,
				engagedCustomers: customersWithJobs
			};
		});

		// Generate monthly insights
		const insights = await step.run('generate-monthly-insights', async () => {
			const insights = {
				month: new Date().toISOString().substring(0, 7), // YYYY-MM
				growth: growthMetrics,
				engagement: engagementAnalysis,
				recommendations: []
			};

			// Generate recommendations based on data
			if (growthMetrics.userGrowth.growthRate < 10) {
				insights.recommendations.push('Consider marketing campaigns to boost user growth');
			}

			if (engagementAnalysis.activeUserRate < 50) {
				insights.recommendations.push('Focus on user engagement and retention strategies');
			}

			if (engagementAnalysis.verificationRate < 80) {
				insights.recommendations.push('Improve email verification process');
			}

			console.log('Monthly Insights:', JSON.stringify(insights, null, 2));
			return insights;
		});

		// Send insights to admins
		await step.run('send-monthly-insights', async () => {
			const admins = await User.find({
				role: 'admin',
				isActive: true
			}).select('email profile.firstName');

			for (const admin of admins) {
				console.log(`Sending monthly insights to admin ${admin.email}`);
				// This would send the insights report via email
			}

			return { success: true, adminsNotified: admins.length };
		});

		return {
			success: true,
			insightsGenerated: true,
			insights
		};
	}
);

/**
 * System health monitoring
 */
export const systemHealthFlow = inngest.createFunction(
	{
		id: 'system-health-flow',
		name: 'System Health Flow',
		retries: 1
	},
	{ cron: '*/15 * * * *' }, // Every 15 minutes
	async ({ step }) => {
		// Check database connectivity
		const dbHealth = await step.run('check-database-health', async () => {
			try {
				const userCount = await User.countDocuments();
				return {
					status: 'healthy',
					userCount,
					responseTime: Date.now()
				};
			} catch (error) {
				return {
					status: 'unhealthy',
					error: error.message,
					responseTime: Date.now()
				};
			}
		});

		// Check Redis connectivity (if enabled)
		const redisHealth = await step.run('check-redis-health', async () => {
			try {
				// This would check Redis connection
				return { status: 'healthy', responseTime: Date.now() };
			} catch (error) {
				return {
					status: 'unhealthy',
					error: error.message,
					responseTime: Date.now()
				};
			}
		});

		// Check external services
		const externalHealth = await step.run('check-external-services', async () => {
			const services = {
				email: 'healthy', // Would check Resend API
				payments: 'healthy', // Would check Stripe API
				notifications: 'healthy' // Would check push notification service
			};

			return services;
		});

		// Generate health report
		const healthReport = await step.run('generate-health-report', async () => {
			const report = {
				timestamp: new Date().toISOString(),
				overall: 'healthy',
				services: {
					database: dbHealth,
					redis: redisHealth,
					external: externalHealth
				}
			};

			// Determine overall health
			const allHealthy = [dbHealth.status, redisHealth.status, ...Object.values(externalHealth)].every((status) => status === 'healthy');

			report.overall = allHealthy ? 'healthy' : 'degraded';

			console.log('System Health Report:', JSON.stringify(report, null, 2));
			return report;
		});

		// Alert if system is unhealthy
		if (healthReport.overall !== 'healthy') {
			await step.run('send-health-alert', async () => {
				const admins = await User.find({
					role: 'admin',
					isActive: true
				}).select('email profile.firstName');

				for (const admin of admins) {
					console.log(`Sending health alert to admin ${admin.email}`);
					// This would send critical health alerts
				}

				return { alertsSent: admins.length };
			});
		}

		return {
			success: true,
			healthReport
		};
	}
);

export default inngest;
