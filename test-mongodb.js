// Test MongoDB connection locally
// Run: node test-mongodb.js

const mongoose = require('mongoose');

// Replace with your actual MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority';

async function testConnection() {
	try {
		console.log('Testing MongoDB connection...');
		console.log('URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

		const options = {
			serverSelectionTimeoutMS: 10000,
			connectTimeoutMS: 10000,
			socketTimeoutMS: 45000
		};

		await mongoose.connect(MONGODB_URI, options);
		console.log('✅ MongoDB connection successful!');
		console.log('Host:', mongoose.connection.host);
		console.log('Database:', mongoose.connection.name);

		await mongoose.disconnect();
		console.log('✅ Disconnected successfully');
	} catch (error) {
		console.error('❌ MongoDB connection failed:');
		console.error('Error:', error.message);

		if (error.name === 'MongooseServerSelectionError') {
			console.error('Server Selection Error - Check your cluster URL and network access');
		} else if (error.message.includes('ESERVFAIL')) {
			console.error('DNS Resolution Error - Check your internet connection');
		} else if (error.message.includes('bad auth')) {
			console.error('Authentication Error - Check username and password');
		}
	}
}

testConnection();
