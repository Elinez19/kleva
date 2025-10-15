import mongoose, { Schema, Document } from 'mongoose';
import { IPayment, PaymentStatus, PaymentMethod } from '../interfaces/IPayment';

export interface IPaymentDocument extends IPayment, Document {
	_id: any;
}

const PaymentSchema = new Schema<IPaymentDocument>(
	{
		paymentId: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		userId: {
			type: String,
			required: true,
			ref: 'User',
			index: true
		},
		handymanId: {
			type: String,
			ref: 'User',
			index: true
		},
		jobId: {
			type: String,
			index: true
		},
		amount: {
			type: Number,
			required: true,
			min: 0
		},
		currency: {
			type: String,
			required: true,
			default: 'NGN',
			enum: ['NGN', 'USD', 'EUR', 'GBP']
		},
		status: {
			type: String,
			required: true,
			enum: Object.values(PaymentStatus),
			default: PaymentStatus.PENDING,
			index: true
		},
		paymentMethod: {
			type: String,
			required: true,
			enum: Object.values(PaymentMethod),
			default: PaymentMethod.CARD
		},
		description: {
			type: String,
			required: true,
			maxlength: 500
		},
		metadata: {
			type: Schema.Types.Mixed,
			default: {}
		},

		// Paystack specific fields
		paystackReference: {
			type: String,
			index: true
		},
		paystackAccessCode: {
			type: String
		},
		paystackAuthorizationUrl: {
			type: String
		},

		// Timestamps
		createdAt: {
			type: Date,
			default: Date.now
		},
		updatedAt: {
			type: Date,
			default: Date.now
		},
		paidAt: {
			type: Date
		},
		expiresAt: {
			type: Date,
			index: { expireAfterSeconds: 0 } // TTL index
		}
	},
	{
		timestamps: true,
		collection: 'payments'
	}
);

// Indexes for better query performance
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ handymanId: 1, status: 1 });
PaymentSchema.index({ jobId: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ paystackReference: 1 });

// Update the updatedAt field before saving
PaymentSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

// Static methods
PaymentSchema.statics.findByReference = function (reference: string) {
	return this.findOne({ paystackReference: reference });
};

PaymentSchema.statics.findByUserId = function (userId: string, limit: number = 10) {
	return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

PaymentSchema.statics.findByHandymanId = function (handymanId: string, limit: number = 10) {
	return this.find({ handymanId }).sort({ createdAt: -1 }).limit(limit);
};

// Instance methods
PaymentSchema.methods.updateStatus = function (status: PaymentStatus, paidAt?: Date) {
	this.status = status;
	if (paidAt) {
		this.paidAt = paidAt;
	}
	return this.save();
};

PaymentSchema.methods.isExpired = function () {
	return this.expiresAt && this.expiresAt < new Date();
};

PaymentSchema.methods.canRefund = function () {
	return this.status === PaymentStatus.SUCCESS && this.paidAt && Date.now() - this.paidAt.getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days
};

export default mongoose.model<IPaymentDocument>('Payment', PaymentSchema);
