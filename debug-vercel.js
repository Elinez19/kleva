// Simple test to see what's failing in Vercel
// This will help us debug the issue

console.log('=== VERCEL DEBUG TEST ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);

// Check if environment variables are available
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

// Test basic imports
try {
    console.log('Testing Express import...');
    const express = require('express');
    console.log('✅ Express imported successfully');
} catch (error) {
    console.error('❌ Express import failed:', error.message);
}

try {
    console.log('Testing Mongoose import...');
    const mongoose = require('mongoose');
    console.log('✅ Mongoose imported successfully');
} catch (error) {
    console.error('❌ Mongoose import failed:', error.message);
}

console.log('=== END DEBUG TEST ===');
