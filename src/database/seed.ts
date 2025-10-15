import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SERVER } from '../config/config';
import User from '../models/user.model';
import RefreshToken from '../models/refreshToken.model';
import Session from '../models/session.model';

dotenv.config();

/**
 * Seed data for handyman management app
 * All users are pre-verified and have known passwords for easy testing
 */

const userData = [
	// 1. ADMIN USER
	{
		email: 'admin@handyman.com',
		password: 'Admin123!',
		role: 'admin',
		isEmailVerified: true,
		isActive: true,
		profile: {
			firstName: 'Admin',
			lastName: 'User',
			phone: '+1234567890',
			department: 'Operations'
		}
	},
	// 2. HANDYMAN #1 - Plumber
	{
		email: 'mike.plumber@handyman.com',
		password: 'Handyman123',
		role: 'handyman',
		isEmailVerified: true,
		isActive: true,
		profile: {
			firstName: 'Mike',
			lastName: 'Smith',
			phone: '+1234567891',
			address: '456 Oak Avenue, Boston, MA',
			skills: ['plumbing', 'pipe repair', 'drain cleaning'],
			experience: 12,
			hourlyRate: 85,
			availability: 'Mon-Fri 8am-6pm',
			bio: 'Experienced plumber with 12 years in residential and commercial plumbing. Licensed and insured.',
			certifications: ['Master Plumber License', 'Backflow Prevention Certified']
		}
	},
	// 3. HANDYMAN #2 - Electrician
	{
		email: 'john.electric@handyman.com',
		password: 'Handyman123',
		role: 'handyman',
		isEmailVerified: true,
		isActive: true,
		profile: {
			firstName: 'John',
			lastName: 'Davis',
			phone: '+1234567892',
			address: '789 Pine Street, Seattle, WA',
			skills: ['electrical', 'wiring', 'lighting installation', 'panel upgrades'],
			experience: 15,
			hourlyRate: 95,
			availability: 'Mon-Sat 7am-7pm',
			bio: 'Master electrician specializing in residential electrical work and smart home installations.',
			certifications: ['Master Electrician License', 'Smart Home Certified']
		}
	},
	// 4. HANDYMAN #3 - General Handyman
	{
		email: 'bob.handyman@handyman.com',
		password: 'Handyman123',
		role: 'handyman',
		isEmailVerified: true,
		isActive: true,
		profile: {
			firstName: 'Bob',
			lastName: 'Johnson',
			phone: '+1234567893',
			address: '321 Maple Drive, Austin, TX',
			skills: ['carpentry', 'drywall repair', 'painting', 'furniture assembly', 'general repairs'],
			experience: 8,
			hourlyRate: 65,
			availability: 'Flexible - call anytime',
			bio: 'Jack of all trades with 8 years experience in home repairs and improvements.',
			certifications: ['General Contractor License']
		}
	},
	// 5. CUSTOMER #1
	{
		email: 'sarah.customer@gmail.com',
		password: 'Customer123',
		role: 'customer',
		isEmailVerified: true,
		isActive: true,
		profile: {
			firstName: 'Sarah',
			lastName: 'Williams',
			phone: '+1234567894',
			address: '123 Main Street, New York, NY',
			preferredContactMethod: 'email'
		}
	},
	// 6. CUSTOMER #2
	{
		email: 'david.home@gmail.com',
		password: 'Customer123',
		role: 'customer',
		isEmailVerified: true,
		isActive: true,
		profile: {
			firstName: 'David',
			lastName: 'Brown',
			phone: '+1234567895',
			address: '555 Park Avenue, Chicago, IL',
			preferredContactMethod: 'phone'
		}
	},
	// 7. TEST ADMIN (for development)
	{
		email: 'test@admin.com',
		password: 'Test123!',
		role: 'admin',
		isEmailVerified: true,
		isActive: true,
		profile: {
			firstName: 'Test',
			lastName: 'Admin',
			phone: '+1234567896',
			department: 'Testing'
		}
	}
];

// Seed function
const seedDatabase = async (clearExisting: boolean = false) => {
	try {
		// Connect to MongoDB
		console.log('🔌 Connecting to MongoDB...');
		const uri = SERVER.MONGODB_URI as string;

		if (!uri) {
			throw new Error('MONGODB_URI environment variable is not set');
		}

		await mongoose.connect(uri, {
			serverSelectionTimeoutMS: 10000,
			heartbeatFrequencyMS: 2000
		});

		console.log('✅ Connected to MongoDB successfully\n');

		// Clear existing data if requested
		if (clearExisting) {
			console.log('🗑️  Clearing existing data...');
			const userDelete = await User.deleteMany({});
			const tokenDelete = await RefreshToken.deleteMany({});
			const sessionDelete = await Session.deleteMany({});
			console.log(`   Deleted ${userDelete.deletedCount} users`);
			console.log(`   Deleted ${tokenDelete.deletedCount} refresh tokens`);
			console.log(`   Deleted ${sessionDelete.deletedCount} sessions\n`);
		}

		// Insert seed data
		console.log('🌱 Seeding database with test users...');
		const insertedUsers = await User.insertMany(userData);
		console.log(`✅ Successfully inserted ${insertedUsers.length} users\n`);

		// Display summary
		console.log('📊 User Summary:');
		const adminCount = await User.countDocuments({ role: 'admin' });
		const handymanCount = await User.countDocuments({ role: 'handyman' });
		const customerCount = await User.countDocuments({ role: 'customer' });

		console.log(`   Admins     : ${adminCount}`);
		console.log(`   Handymen   : ${handymanCount}`);
		console.log(`   Customers  : ${customerCount}`);
		console.log(`   TOTAL      : ${insertedUsers.length}`);

		console.log('\n✨ Database seeding completed successfully!\n');
		console.log('📝 Test Credentials:\n');

		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('👤 ADMIN ACCOUNTS');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('Email: admin@handyman.com');
		console.log('Pass:  Admin123!');
		console.log('');
		console.log('Email: test@admin.com');
		console.log('Pass:  Test123!');
		console.log('');

		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('🔧 HANDYMAN ACCOUNTS');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('Email: mike.plumber@handyman.com   (Plumber)');
		console.log('Email: john.electric@handyman.com  (Electrician)');
		console.log('Email: bob.handyman@handyman.com   (General)');
		console.log('Pass:  Handyman123 (all handymen)');
		console.log('');

		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('👥 CUSTOMER ACCOUNTS');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('Email: sarah.customer@gmail.com');
		console.log('Email: david.home@gmail.com');
		console.log('Pass:  Customer123 (both customers)');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

		console.log('✅ All accounts are EMAIL VERIFIED and ready to use!');
		console.log('✅ No 2FA enabled (for easier testing)\n');

		console.log('🚀 Quick Start:');
		console.log('   1. Start server: npm run dev');
		console.log('   2. Login with any account above');
		console.log('   3. Or create new users via Postman\n');

		console.log('🔄 To reset database:');
		console.log('   npm run seed:clear\n');
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		process.exit(1);
	} finally {
		// Close connection
		await mongoose.connection.close();
		console.log('🔌 Database connection closed');
		process.exit(0);
	}
};

// Parse command line arguments
const args = process.argv.slice(2);
const clearExisting = args.includes('--clear') || args.includes('-c');

// Run the seed function
console.log('🚀 Starting Handyman App Database Seed...\n');
if (clearExisting) {
	console.log('⚠️  WARNING: This will CLEAR all existing data and re-seed!\n');
}

seedDatabase(clearExisting);
