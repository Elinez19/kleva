import mongoose, { Schema, Document } from 'mongoose';
import { IJob, JobStatus, JobUrgency } from '../interfaces/IPayment';

export interface IJobDocument extends IJob, Document {
	_id: any;
}

const JobSchema = new Schema<IJobDocument>(
	{
		jobId: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		customerId: {
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
		title: {
			type: String,
			required: true,
			maxlength: 200
		},
		description: {
			type: String,
			required: true,
			maxlength: 2000
		},
		category: {
			type: String,
			required: true,
			index: true
		},
		location: {
			address: {
				type: String,
				required: true
			},
			city: {
				type: String,
				required: true,
				index: true
			},
			state: {
				type: String,
				required: true,
				index: true
			},
			coordinates: {
				lat: {
					type: Number,
					min: -90,
					max: 90
				},
				lng: {
					type: Number,
					min: -180,
					max: 180
				}
			}
		},
		budget: {
			min: {
				type: Number,
				required: true,
				min: 0
			},
			max: {
				type: Number,
				required: true,
				min: 0
			},
			currency: {
				type: String,
				required: true,
				default: 'NGN',
				enum: ['NGN', 'USD', 'EUR', 'GBP']
			}
		},
		urgency: {
			type: String,
			required: true,
			enum: Object.values(JobUrgency),
			default: JobUrgency.MEDIUM,
			index: true
		},
		status: {
			type: String,
			required: true,
			enum: Object.values(JobStatus),
			default: JobStatus.PENDING,
			index: true
		},
		scheduledDate: {
			type: Date,
			index: true
		},
		estimatedDuration: {
			type: Number,
			required: true,
			min: 0.5,
			max: 24
		},
		images: [
			{
				type: String,
				validate: {
					validator: function (v: string) {
						return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
					},
					message: 'Invalid image URL format'
				}
			}
		],
		requirements: [
			{
				type: String,
				maxlength: 200
			}
		],

		// Payment related
		paymentId: {
			type: String,
			ref: 'Payment',
			index: true
		},
		paymentStatus: {
			type: String,
			enum: Object.values(require('../interfaces/IPayment').PaymentStatus),
			index: true
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
		completedAt: {
			type: Date
		}
	},
	{
		timestamps: true,
		collection: 'jobs'
	}
);

// Indexes for better query performance
JobSchema.index({ customerId: 1, status: 1 });
JobSchema.index({ handymanId: 1, status: 1 });
JobSchema.index({ category: 1, status: 1 });
JobSchema.index({ 'location.city': 1, status: 1 });
JobSchema.index({ urgency: 1, status: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ scheduledDate: 1 });

// Geospatial index for location-based queries
JobSchema.index({ 'location.coordinates': '2dsphere' });

// Update the updatedAt field before saving
JobSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

// Static methods
JobSchema.statics.findByCustomer = function (customerId: string, limit: number = 10) {
	return this.find({ customerId }).sort({ createdAt: -1 }).limit(limit);
};

JobSchema.statics.findByHandyman = function (handymanId: string, limit: number = 10) {
	return this.find({ handymanId }).sort({ createdAt: -1 }).limit(limit);
};

JobSchema.statics.findNearby = function (coordinates: [number, number], maxDistance: number = 10000) {
	return this.find({
		'location.coordinates': {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates: coordinates
				},
				$maxDistance: maxDistance
			}
		},
		status: JobStatus.PENDING
	});
};

JobSchema.statics.findByCategory = function (category: string, limit: number = 20) {
	return this.find({
		category,
		status: JobStatus.PENDING
	})
		.sort({ createdAt: -1 })
		.limit(limit);
};

// Instance methods
JobSchema.methods.assignHandyman = function (handymanId: string) {
	this.handymanId = handymanId;
	this.status = JobStatus.ACCEPTED;
	return this.save();
};

JobSchema.methods.startJob = function () {
	this.status = JobStatus.IN_PROGRESS;
	return this.save();
};

JobSchema.methods.completeJob = function () {
	this.status = JobStatus.COMPLETED;
	this.completedAt = new Date();
	return this.save();
};

JobSchema.methods.cancelJob = function () {
	this.status = JobStatus.CANCELLED;
	return this.save();
};

JobSchema.methods.updatePaymentStatus = function (paymentId: string, status: string) {
	this.paymentId = paymentId;
	this.paymentStatus = status;
	return this.save();
};

export default mongoose.model<IJobDocument>('Job', JobSchema);
