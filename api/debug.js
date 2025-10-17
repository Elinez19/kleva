// Minimal Vercel entry point for debugging
const express = require('express');

const app = express();

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Minimal test endpoint',
        timestamp: new Date().toISOString(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
            JWT_SECRET_EXISTS: !!process.env.JWT_SECRET
        }
    });
});

app.get('/test-mongo', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        
        if (!process.env.MONGODB_URI) {
            return res.status(500).json({ error: 'MONGODB_URI not set' });
        }

        console.log('Testing MongoDB connection...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        res.json({
            success: true,
            message: 'MongoDB connected successfully',
            host: mongoose.connection.host,
            database: mongoose.connection.name
        });
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('MongoDB test failed:', error);
        res.status(500).json({
            error: 'MongoDB connection failed',
            message: error.message,
            name: error.name
        });
    }
});

module.exports = app;
