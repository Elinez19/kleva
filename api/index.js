"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../src/app");
const db_1 = require("../src/database/db");
let isDbConnected = false;
// Initialize database connection
const initializeDb = async () => {
    if (!isDbConnected) {
        await (0, db_1.connectDb)();
        isDbConnected = true;
    }
};
// Vercel serverless function handler
exports.default = async (req, res) => {
    try {
        // Ensure database is connected
        await initializeDb();
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        // Use the Express app to handle the request
        return (0, app_1.application)(req, res);
    }
    catch (error) {
        console.error('Error in Vercel handler:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=index.js.map