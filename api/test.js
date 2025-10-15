// Simple test API for Vercel
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ 
    message: 'Handyman API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;
