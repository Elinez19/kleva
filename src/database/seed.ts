import mongoose from 'mongoose';
import UserModel from '../models/user.model';
import { connectDb } from '../database/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Seed data
const seedData = async () => {
	try {
		console.log('🌱 Starting database seeding...');

		// Connect to database
		await connectDb();

		// Clear existing data (optional - remove in production)
		console.log('🧹 Clearing existing data...');
		await UserModel.deleteMany({});

		// Create admin user
		const adminPassword = await bcrypt.hash('Admin123!', 10);
		const admin = await UserModel.create({
			email: 'admin@handyman.com',
			password: adminPassword,
			role: 'admin',
			profile: {
				firstName: 'Admin',
				lastName: 'User',
				phone: '+1234567890',
				department: 'Management'
			},
			isEmailVerified: true,
			approvalStatus: 'approved',
			isActive: true,
			loginAttempts: 0
		});

		console.log('✅ Admin user created:', admin.email);

		// Create sample customer
		const customerPassword = await bcrypt.hash('Customer123!', 10);
		const customer = await UserModel.create({
			email: 'customer@handyman.com',
			password: customerPassword,
			role: 'customer',
			profile: {
				firstName: 'John',
				lastName: 'Doe',
				phone: '+1234567891',
				address: '123 Main St, City, State',
				preferredContactMethod: 'email'
			},
			isEmailVerified: true,
			approvalStatus: 'approved',
			isActive: true,
			loginAttempts: 0
		});

		console.log('✅ Customer user created:', customer.email);

		// Create sample handyman (pending approval)
		const handymanPassword = await bcrypt.hash('Handyman123!', 10);
		const handyman = await UserModel.create({
			email: 'handyman@handyman.com',
			password: handymanPassword,
			role: 'handyman',
			profile: {
				firstName: 'Jane',
				lastName: 'Smith',
				phone: '+1234567892',
				address: '456 Oak Ave, City, State',
				skills: ['plumbing', 'electrical', 'carpentry'],
				experience: 5,
				hourlyRate: 25,
				availability: 'Monday-Friday 8AM-6PM',
				bio: 'Experienced handyman with 5 years of service',
				certifications: ['Licensed Plumber', 'Electrical Safety Certified']
			},
			isEmailVerified: true,
			approvalStatus: 'pending',
			isActive: true,
			loginAttempts: 0
		});

		console.log('✅ Handyman user created (pending approval):', handyman.email);

		// Create another handyman (approved)
		const handyman2Password = await bcrypt.hash('Handyman456!', 10);
		const handyman2 = await UserModel.create({
			email: 'approved@handyman.com',
			password: handyman2Password,
			role: 'handyman',
			profile: {
				firstName: 'Mike',
				lastName: 'Johnson',
				phone: '+1234567893',
				address: '789 Pine St, City, State',
				skills: ['painting', 'flooring', 'drywall'],
				experience: 3,
				hourlyRate: 20,
				availability: 'Weekends and evenings',
				bio: 'Skilled craftsman specializing in interior work',
				certifications: ['Painting Certification']
			},
			isEmailVerified: true,
			approvalStatus: 'approved',
			approvedBy: admin._id,
			approvedAt: new Date(),
			isActive: true,
			loginAttempts: 0
		});

		console.log('✅ Approved handyman user created:', handyman2.email);

		// Create rejected handyman
		const handyman3Password = await bcrypt.hash('Handyman789!', 10);
		const handyman3 = await UserModel.create({
			email: 'rejected@handyman.com',
			password: handyman3Password,
			role: 'handyman',
			profile: {
				firstName: 'Bob',
				lastName: 'Wilson',
				phone: '+1234567894',
				address: '321 Elm St, City, State',
				skills: ['general maintenance'],
				experience: 1,
				hourlyRate: 15,
				availability: 'Part-time only',
				bio: 'New to the field'
			},
			isEmailVerified: true,
			approvalStatus: 'rejected',
			rejectionReason: 'Insufficient experience and incomplete profile',
			approvedBy: admin._id,
			approvedAt: new Date(),
			isActive: true,
			loginAttempts: 0
		});

		console.log('✅ Rejected handyman user created:', handyman3.email);

		// Create additional test users for comprehensive testing

		// Customer with 2FA enabled
		const customer2FAPassword = await bcrypt.hash('Customer2FA123!', 10);
		const customer2FA = await UserModel.create({
			email: 'customer2fa@handyman.com',
			password: customer2FAPassword,
			role: 'customer',
			profile: {
				firstName: 'Alice',
				lastName: 'Johnson',
				phone: '+1234567895',
				address: '789 Test Ave, City, State',
				preferredContactMethod: 'phone'
			},
			isEmailVerified: true,
			approvalStatus: 'approved',
			is2FAEnabled: true,
			twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Test secret for 2FA
			twoFactorBackupCodes: ['12345678', '87654321', '11223344', '44332211', '55667788', '88776655', '99001122', '22110099'],
			isActive: true,
			loginAttempts: 0
		});

		console.log('✅ Customer with 2FA created:', customer2FA.email);

		// Locked account (for testing account lockout)
		const lockedPassword = await bcrypt.hash('Locked123!', 10);
		const lockedUser = await UserModel.create({
			email: 'locked@handyman.com',
			password: lockedPassword,
			role: 'customer',
			profile: {
				firstName: 'Locked',
				lastName: 'User',
				phone: '+1234567896',
				address: '999 Lock St, City, State',
				preferredContactMethod: 'email'
			},
			isEmailVerified: true,
			approvalStatus: 'approved',
			isActive: true,
			loginAttempts: 5,
			accountLockedUntil: new Date(Date.now() + 15 * 60 * 1000) // Locked for 15 minutes
		});

		console.log('✅ Locked user created:', lockedUser.email);

		// Unverified email user
		const unverifiedPassword = await bcrypt.hash('Unverified123!', 10);
		const testVerificationToken = crypto.randomBytes(32).toString('hex');
		const unverifiedUser = await UserModel.create({
			email: 'unverified@handyman.com',
			password: unverifiedPassword,
			role: 'customer',
			profile: {
				firstName: 'Unverified',
				lastName: 'User',
				phone: '+1234567897',
				address: '888 Unverified St, City, State',
				preferredContactMethod: 'email'
			},
			isEmailVerified: false,
			emailVerificationToken: testVerificationToken,
			emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
			approvalStatus: 'approved',
			isActive: true,
			loginAttempts: 0
		});

		console.log('🔗 Test verification token:', testVerificationToken);
		console.log('🔗 Test verification URL:', `https://kleva-server.vercel.app/api/v1/auth/verify-email/${testVerificationToken}`);

		console.log('✅ Unverified user created:', unverifiedUser.email);

		// Display summary
		const totalUsers = await UserModel.countDocuments();
		const usersByRole = await UserModel.aggregate([
			{
				$group: {
					_id: '$role',
					count: { $sum: 1 }
				}
			}
		]);

		const handymanApprovals = await UserModel.aggregate([
			{
				$match: { role: 'handyman' }
			},
			{
				$group: {
					_id: '$approvalStatus',
					count: { $sum: 1 }
				}
			}
		]);

		console.log('\n📊 Seeding Summary:');
		console.log(`Total Users: ${totalUsers}`);
		console.log('Users by Role:');
		usersByRole.forEach((role: { _id: string; count: number }) => {
			console.log(`  ${role._id}: ${role.count}`);
		});
		console.log('Handyman Approvals:');
		handymanApprovals.forEach((approval: { _id: string; count: number }) => {
			console.log(`  ${approval._id}: ${approval.count}`);
		});

		console.log('\n🎉 Database seeding completed successfully!');
		console.log('\n📋 Test Accounts:');
		console.log('Admin: admin@handyman.com / Admin123!');
		console.log('Customer: customer@handyman.com / Customer123!');
		console.log('Handyman (Pending): handyman@handyman.com / Handyman123!');
		console.log('Handyman (Approved): approved@handyman.com / Handyman456!');
		console.log('Handyman (Rejected): rejected@handyman.com / Handyman789!');

		process.exit(0);
	} catch (error) {
		console.error('❌ Seeding failed:', error);
		process.exit(1);
	}
};

// Run seeding
seedData();
