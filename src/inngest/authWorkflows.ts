import { inngest, Events } from '../config/inngest';
import User from '../models/user.model';
import RefreshToken from '../models/refreshToken.model';
import Session from '../models/session.model';

// ============================================================================
// AUTHENTICATION WORKFLOW FUNCTIONS
// ============================================================================

/**
 * User onboarding flow - sends welcome series
 */
export const userOnboardingFlow = inngest.createFunction(
	{
		id: 'user-onboarding-flow',
		name: 'User Onboarding Flow',
		retries: 2
	},
	{ event: 'user/onboarding.started' },
	async ({ event, step }: { event: Events['user/onboarding.started'] }) => {
		const { userId, email, firstName, role } = event.data;

		// Step 1: Send welcome email immediately
		await step.run('send-welcome-email', async () => {
			await inngest.send({
				name: 'auth/user.registered',
				data: { userId, email, firstName, lastName: '', role }
			});
			return { success: true };
		});

		// Step 2: Check profile completion after 24 hours
		await step.sleep('24h');

		const profileStatus = await step.run('check-profile-completion', async () => {
			const user = await User.findById(userId);
			if (!user) return { isComplete: false, missingFields: [] };

			const missingFields = [];
			if (!user.profile?.firstName) missingFields.push('firstName');
			if (!user.profile?.lastName) missingFields.push('lastName');
			if (!user.profile?.phone) missingFields.push('phone');

			// Role-specific required fields
			if (role === 'handyman') {
				if (!user.profile?.skills) missingFields.push('skills');
				if (!user.profile?.location) missingFields.push('location');
				if (!user.profile?.hourlyRate) missingFields.push('hourlyRate');
			}

			return {
				isComplete: missingFields.length === 0,
				missingFields
			};
		});

		// Step 3: Send profile completion reminder if incomplete
		if (!profileStatus.isComplete) {
			await step.run('send-profile-reminder', async () => {
				await inngest.send({
					name: 'user/profile.incomplete',
					data: { userId, email, firstName, missingFields: profileStatus.missingFields }
				});
				return { success: true };
			});
		}

		// Step 4: Send role-specific tips after 3 days
		await step.sleep('3d');

		await step.run('send-role-tips', async () => {
			// This would trigger role-specific onboarding tips
			console.log(`Sending ${role}-specific tips to ${email}`);
			return { success: true };
		});

		return {
			success: true,
			userId,
			onboardingCompleted: true
		};
	}
);

/**
 * Clean up expired tokens (verification, password reset, refresh)
 */
export const cleanupExpiredTokens = inngest.createFunction(
	{
		id: 'cleanup-expired-tokens',
		name: 'Cleanup Expired Tokens',
		retries: 1
	},
	{ cron: '0 2 * * *' }, // Daily at 2 AM
	async ({ step }) => {
		const now = new Date();

		// Clean up expired email verification tokens
		const verificationCleanup = await step.run('cleanup-verification-tokens', async () => {
			const result = await User.updateMany(
				{
					emailVerificationExpires: { $lt: now },
					isEmailVerified: false
				},
				{
					$unset: {
						emailVerificationToken: 1,
						emailVerificationExpires: 1
					}
				}
			);
			return { deleted: result.modifiedCount };
		});

		// Clean up expired password reset tokens
		const passwordResetCleanup = await step.run('cleanup-password-reset-tokens', async () => {
			const result = await User.updateMany(
				{ passwordResetExpires: { $lt: now } },
				{
					$unset: {
						passwordResetToken: 1,
						passwordResetExpires: 1
					}
				}
			);
			return { deleted: result.modifiedCount };
		});

		// Clean up expired refresh tokens
		const refreshTokenCleanup = await step.run('cleanup-refresh-tokens', async () => {
			const result = await RefreshToken.deleteMany({
				expiresAt: { $lt: now }
			});
			return { deleted: result.deletedCount };
		});

		// Clean up expired sessions
		const sessionCleanup = await step.run('cleanup-expired-sessions', async () => {
			const result = await Session.deleteMany({
				expiresAt: { $lt: now }
			});
			return { deleted: result.deletedCount };
		});

		return {
			success: true,
			cleanup: {
				verificationTokens: verificationCleanup.deleted,
				passwordResetTokens: passwordResetCleanup.deleted,
				refreshTokens: refreshTokenCleanup.deleted,
				sessions: sessionCleanup.deleted
			}
		};
	}
);

/**
 * Account recovery flow for inactive users
 */
export const accountRecoveryFlow = inngest.createFunction(
	{
		id: 'account-recovery-flow',
		name: 'Account Recovery Flow',
		retries: 1
	},
	{ cron: '0 9 * * 1' }, // Every Monday at 9 AM
	async ({ step }) => {
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		// Find inactive users
		const inactiveUsers = await step.run('find-inactive-users', async () => {
			return await User.find({
				lastLogin: { $lt: thirtyDaysAgo },
				isActive: true,
				role: { $in: ['customer', 'handyman'] } // Don't include admins
			}).select('_id email profile.firstName role');
		});

		// Send re-engagement emails
		for (const user of inactiveUsers) {
			await step.run(`re-engage-user-${user._id}`, async () => {
				// This would trigger a re-engagement email workflow
				console.log(`Sending re-engagement email to ${user.email}`);
				return { success: true, userId: user._id };
			});
		}

		return {
			success: true,
			inactiveUsersFound: inactiveUsers.length,
			reEngagementEmailsSent: inactiveUsers.length
		};
	}
);

/**
 * Security monitoring - detect suspicious login patterns
 */
export const securityMonitoringFlow = inngest.createFunction(
	{
		id: 'security-monitoring-flow',
		name: 'Security Monitoring Flow',
		retries: 1
	},
	{ cron: '0 */6 * * *' }, // Every 6 hours
	async ({ step }) => {
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

		// Find users with multiple failed login attempts
		const suspiciousUsers = await step.run('find-suspicious-activity', async () => {
			return await User.find({
				loginAttempts: { $gte: 5 },
				lastLoginAttempt: { $gte: oneHourAgo },
				isActive: true
			}).select('_id email profile.firstName loginAttempts lastLoginAttempt');
		});

		// Lock accounts with excessive failed attempts
		for (const user of suspiciousUsers) {
			if (user.loginAttempts >= 10) {
				await step.run(`lock-account-${user._id}`, async () => {
					await User.findByIdAndUpdate(user._id, {
						accountLockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
						loginAttempts: 0
					});

					// Send account locked notification
					await inngest.send({
						name: 'auth/account.locked',
						data: {
							userId: user._id.toString(),
							email: user.email,
							firstName: user.profile?.firstName || 'User',
							reason: 'Excessive failed login attempts'
						}
					});

					return { success: true, userId: user._id };
				});
			}
		}

		return {
			success: true,
			suspiciousUsersFound: suspiciousUsers.length,
			accountsLocked: suspiciousUsers.filter((u) => u.loginAttempts >= 10).length
		};
	}
);

export default inngest;
