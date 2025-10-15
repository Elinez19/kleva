// Set default environment variables for Vercel
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import the Express app
const { application } = require('../dist/app');

// Export the Express app for Vercel
module.exports = application;