import { Inngest } from 'inngest';

// Initialize Inngest client
export const inngest = new Inngest({
	id: process.env.INNGEST_APP_ID || 'handyman-app',
	eventKey: process.env.INNGEST_EVENT_KEY,
	signingKey: process.env.INNGEST_SIGNING_KEY
});

// Event types for type safety
export type Events = {
	// Authentication Events
	'auth/user.registered': {
		data: {
			userId: string;
			email: string;
			firstName: string;
			lastName: string;
			role: 'handyman' | 'customer' | 'admin';
		};
	};
	'auth/email.verification.requested': {
		data: {
			userId: string;
			email: string;
			token: string;
			firstName: string;
		};
	};
	'auth/password.reset.requested': {
		data: {
			userId: string;
			email: string;
			token: string;
			firstName: string;
		};
	};
	'auth/2fa.enabled': {
		data: {
			userId: string;
			email: string;
			firstName: string;
		};
	};
	'auth/account.locked': {
		data: {
			userId: string;
			email: string;
			firstName: string;
			reason: string;
		};
	};

	// User Onboarding Events
	'user/onboarding.started': {
		data: {
			userId: string;
			email: string;
			firstName: string;
			role: 'handyman' | 'customer' | 'admin';
		};
	};
	'user/profile.incomplete': {
		data: {
			userId: string;
			email: string;
			firstName: string;
			missingFields: string[];
		};
	};

	// Handyman-Specific Events
	'handyman/job.matched': {
		data: {
			handymanId: string;
			jobId: string;
			customerId: string;
			jobTitle: string;
			location: string;
			urgency: 'low' | 'medium' | 'high';
			estimatedDuration: number;
		};
	};
	'handyman/job.completed': {
		data: {
			handymanId: string;
			jobId: string;
			customerId: string;
			rating?: number;
			review?: string;
		};
	};
	'handyman/availability.changed': {
		data: {
			handymanId: string;
			isAvailable: boolean;
			reason?: string;
		};
	};

	// Customer Events
	'customer/job.posted': {
		data: {
			customerId: string;
			jobId: string;
			jobTitle: string;
			category: string;
			location: string;
			urgency: 'low' | 'medium' | 'high';
			budget: number;
		};
	};
	'customer/job.completed': {
		data: {
			customerId: string;
			jobId: string;
			handymanId: string;
			handymanName: string;
			rating?: number;
		};
	};

	// Payment Events
	'payment/initialized': {
		data: {
			paymentId: string;
			userId: string;
			jobId: string;
			amount: number;
			reference: string;
		};
	};
	'payment/verified': {
		data: {
			paymentId: string;
			userId: string;
			jobId: string;
			amount: number;
			status: string;
			reference: string;
		};
	};
	'payment/failed': {
		data: {
			paymentId: string;
			userId: string;
			jobId: string;
			amount: number;
			reference: string;
			reason: string;
		};
	};
	'payment/completed': {
		data: {
			paymentId: string;
			userId: string;
			handymanId: string;
			jobId: string;
			amount: number;
			platformFee: number;
			handymanPayout: number;
		};
	};

	// System Events
	'system/cleanup.expired.tokens': {
		data: {
			tokenType: 'verification' | 'password-reset' | 'refresh';
		};
	};
	'system/analytics.daily': {
		data: {
			date: string;
		};
	};
	'system/maintenance.weekly': {
		data: {
			week: string;
		};
	};
};

export default inngest;
