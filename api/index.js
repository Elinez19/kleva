// Set default environment variables for Vercel
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

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
  
  app.get('/', (req, res) => {
    res.json({ 
      error: 'App failed to load', 
      message: error.message,
      stack: error.stack 
    });
  });
  
  module.exports = app;
}