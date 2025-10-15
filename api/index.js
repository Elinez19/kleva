// Set default environment variables for Vercel
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Disable some features that don't work well in serverless
process.env.DISABLE_REDIS = 'true'; // Disable Redis in serverless
process.env.DISABLE_INNGEST = 'true'; // Disable Inngest if not configured

try {
  // Import the Express app
  const { application } = require('../dist/app');
  
  // Export the Express app for Vercel
  module.exports = application;
} catch (error) {
  console.error('Error loading Express app:', error);
  
  // Create a simple fallback Express app
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  app.get('/', (req, res) => {
    res.json({ 
      error: 'App failed to load', 
      message: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });
  
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ERROR',
      message: 'App failed to load',
      error: error.message
    });
  });
  
  module.exports = app;
}