import { serve } from 'inngest/express';

// Import all workflow functions
import { sendVerificationEmailJob, sendWelcomeEmailJob, sendPasswordResetJob, send2FAEnabledJob, sendAccountLockedJob } from './emailFunctions';

import { userOnboardingFlow, cleanupExpiredTokens, accountRecoveryFlow, securityMonitoringFlow } from './authWorkflows';

import { jobMatchingFlow, jobCompletionFlow, handymanAvailabilityFlow, handymanPerformanceFlow } from './handymanWorkflows';

import { dailyAnalyticsFlow, weeklyMaintenanceFlow, monthlyAnalyticsFlow, systemHealthFlow } from './maintenanceWorkflows';

import { paymentInitializedFlow, paymentVerifiedFlow, paymentFailedFlow, paymentCompletionFlow, dailyPaymentAnalyticsFlow } from './paymentWorkflows';

import { inngest } from '../config/inngest';

// Export all functions for Inngest
export const inngestFunctions = [
	// Email functions
	sendVerificationEmailJob,
	sendWelcomeEmailJob,
	sendPasswordResetJob,
	send2FAEnabledJob,
	sendAccountLockedJob,

	// Auth workflows
	userOnboardingFlow,
	cleanupExpiredTokens,
	accountRecoveryFlow,
	securityMonitoringFlow,

	// Handyman workflows
	jobMatchingFlow,
	jobCompletionFlow,
	handymanAvailabilityFlow,
	handymanPerformanceFlow,

	// Maintenance workflows
	dailyAnalyticsFlow,
	weeklyMaintenanceFlow,
	monthlyAnalyticsFlow,
	systemHealthFlow,

	// Payment workflows
	paymentInitializedFlow,
	paymentVerifiedFlow,
	paymentFailedFlow,
	paymentCompletionFlow,
	dailyPaymentAnalyticsFlow
];

// Create Inngest server for Express
export const inngestServer = serve({
	client: inngest,
	functions: inngestFunctions
});

export default inngestServer;
