// Payment-related interfaces for the Handyman Management App

export interface IPayment {
	_id?: string;
	paymentId: string; // Paystack payment reference
	userId: string; // Customer who made the payment
	handymanId?: string; // Handyman receiving payment
	jobId?: string; // Associated job
	amount: number; // Amount in kobo (Paystack uses kobo)
	currency: string; // Currency code (NGN, USD, etc.)
	status: PaymentStatus;
	paymentMethod: PaymentMethod;
	description: string;
	metadata?: Record<string, any>;

	// Paystack specific fields
	paystackReference?: string;
	paystackAccessCode?: string;
	paystackAuthorizationUrl?: string;

	// Timestamps
	createdAt: Date;
	updatedAt: Date;
	paidAt?: Date;
	expiresAt?: Date;
}

export interface IPaymentRequest {
	amount: number; // Amount in kobo
	currency?: string;
	email: string;
	userId: string;
	handymanId?: string;
	jobId?: string;
	description: string;
	metadata?: Record<string, any>;
	callbackUrl?: string;
}

export interface IPaymentResponse {
	success: boolean;
	message: string;
	payment?: {
		id: string;
		reference: string;
		accessCode: string;
		authorizationUrl: string;
		amount: number;
		currency: string;
		status: PaymentStatus;
	};
}

export interface IPaymentVerification {
	success: boolean;
	message: string;
	payment?: {
		id: string;
		reference: string;
		amount: number;
		currency: string;
		status: PaymentStatus;
		paidAt: Date;
		gatewayResponse: string;
	};
}

export interface IPaymentWebhook {
	event: string;
	data: {
		id: number;
		domain: string;
		status: string;
		reference: string;
		amount: number;
		message: string;
		gateway_response: string;
		paid_at: string;
		created_at: string;
		channel: string;
		currency: string;
		ip_address: string;
		metadata: Record<string, any>;
		log: {
			time_spent: number;
			attempts: number;
			authentication: string;
			errors: number;
			success: boolean;
			mobile: boolean;
			input: any[];
			channel: string;
			history: any[];
		};
		fees: number;
		fees_split: any;
		authorization: {
			authorization_code: string;
			bin: string;
			last4: string;
			exp_month: string;
			exp_year: string;
			channel: string;
			card_type: string;
			bank: string;
			country_code: string;
			brand: string;
			signature: string;
			reusable: boolean;
			account_name: string;
		};
		customer: {
			id: number;
			first_name: string;
			last_name: string;
			email: string;
			customer_code: string;
			phone: string;
			metadata: Record<string, any>;
			risk_action: string;
			international_format_phone: string;
		};
		plan: any;
		split: any;
		order_id: any;
		paidAt: string;
		createdAt: string;
		requested_amount: number;
		pos_transaction_data: any;
		source: any;
		fees_breakdown: any;
	};
}

// Enums
export enum PaymentStatus {
	PENDING = 'pending',
	SUCCESS = 'success',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
	EXPIRED = 'expired',
	REFUNDED = 'refunded'
}

export enum PaymentMethod {
	CARD = 'card',
	BANK_TRANSFER = 'bank_transfer',
	USSD = 'ussd',
	QR = 'qr',
	BANK = 'bank',
	MOBILE_MONEY = 'mobile_money'
}

// Job-related interfaces
export interface IJob {
	_id?: string;
	jobId: string;
	customerId: string;
	handymanId?: string;
	title: string;
	description: string;
	category: string;
	location: {
		address: string;
		city: string;
		state: string;
		coordinates?: {
			lat: number;
			lng: number;
		};
	};
	budget: {
		min: number;
		max: number;
		currency: string;
	};
	urgency: JobUrgency;
	status: JobStatus;
	scheduledDate?: Date;
	estimatedDuration: number; // in hours
	images?: string[];
	requirements?: string[];

	// Payment related
	paymentId?: string;
	paymentStatus?: PaymentStatus;

	// Timestamps
	createdAt: Date;
	updatedAt: Date;
	completedAt?: Date;
}

export enum JobStatus {
	PENDING = 'pending',
	ACCEPTED = 'accepted',
	IN_PROGRESS = 'in_progress',
	COMPLETED = 'completed',
	CANCELLED = 'cancelled',
	DISPUTED = 'disputed'
}

export enum JobUrgency {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	URGENT = 'urgent'
}

// Subscription interfaces
export interface ISubscription {
	_id?: string;
	userId: string;
	planId: string;
	planName: string;
	amount: number;
	currency: string;
	status: SubscriptionStatus;
	paymentId: string;
	startDate: Date;
	endDate: Date;
	renewalDate?: Date;
	autoRenew: boolean;

	createdAt: Date;
	updatedAt: Date;
}

export enum SubscriptionStatus {
	ACTIVE = 'active',
	EXPIRED = 'expired',
	CANCELLED = 'cancelled',
	SUSPENDED = 'suspended'
}

export interface ISubscriptionPlan {
	_id?: string;
	planId: string;
	name: string;
	description: string;
	amount: number;
	currency: string;
	duration: number; // in days
	features: string[];
	isActive: boolean;

	createdAt: Date;
	updatedAt: Date;
}
