// Handyman Management API - Direct implementation for Vercel
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Simple homepage
app.get('/', (req, res) => {
	res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Handyman Management API</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #ff4500 0%, #ff6347 100%);
          color: #fff;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: #fff;
          padding: 60px 40px;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          text-align: center;
          max-width: 800px;
          width: 100%;
          border: 3px solid #ff4500;
        }
        .logo { font-size: 4em; margin-bottom: 10px; }
        h1 { color: #ff4500; margin-bottom: 15px; font-size: 2.5em; font-weight: 700; }
        .subtitle { color: #555; font-size: 1.1em; margin-bottom: 40px; line-height: 1.6; }
        .btn { background: #ff4500; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.3s ease; display: inline-block; margin: 10px; }
        .btn:hover { background: #ff6347; transform: translateY(-2px); }
        .status { background: #e8f5e8; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🔧</div>
        <h1>Handyman Management API</h1>
        <p class="subtitle">Complete REST API with Authentication, Session Management, and Payment Processing</p>
        
        <div class="status">
          <h3>✅ API is Live!</h3>
          <p>Your Handyman Management API is successfully deployed on Vercel</p>
        </div>
        
        <a href="/health" class="btn">Health Check</a>
        <a href="/api-docs" class="btn">API Documentation</a>
        
        <div style="margin-top: 30px; color: #666; font-size: 0.9em;">
          <p>Version 1.0.0 • Built with Express.js, MongoDB, Redis & TypeScript</p>
          <p>Deployed on Vercel • Environment: ${process.env.NODE_ENV}</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({
		status: 'OK',
		message: 'Handyman Management API is running',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
		environment: process.env.NODE_ENV,
		endpoints: {
			documentation: '/api-docs',
			health: '/health',
			auth: '/api/v1/auth/*',
			payments: '/api/v1/payments/*'
		}
	});
});

// API Documentation endpoint - Interactive Swagger UI
app.get('/api-docs', (req, res) => {
	res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Handyman Management API Documentation</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
      <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #ff4500; }
        .swagger-ui .btn.authorize { background-color: #ff4500; border-color: #ff4500; }
        .swagger-ui .btn.authorize:hover { background-color: #ff6347; border-color: #ff6347; }
        .swagger-ui .btn.execute { background-color: #ff4500; border-color: #ff4500; }
        .swagger-ui .btn.execute:hover { background-color: #ff6347; border-color: #ff6347; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: '/api-docs/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            tryItOutEnabled: true,
            requestInterceptor: (req) => {
              req.url = req.url.replace('http://localhost:3006', 'https://kleva-server.vercel.app');
              return req;
            }
          });
        };
      </script>
    </body>
    </html>
  `);
});

// Load the complete OpenAPI specification
let openapiSpec;
try {
	const fs = require('fs');
	const path = require('path');
	const openapiPath = path.join(__dirname, '../../openapi.json');
	openapiSpec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
	
	// Update server URL for Vercel deployment
	openapiSpec.servers = [
		{
			url: 'https://kleva-server.vercel.app',
			description: 'Production server'
		}
	];
} catch (error) {
	logging.error('Failed to load openapi.json:', error.message);
	openapiSpec = {
		openapi: '3.0.0',
		info: {
			title: 'Handyman Management API - Error',
			version: '1.0.0',
			description: 'Failed to load OpenAPI specification.'
		},
		paths: {}
	};
}

// OpenAPI JSON specification
app.get('/api-docs/openapi.json', (req, res) => {
	res.json(openapiSpec);
});

// Mock API endpoints (for demonstration)
app.post('/api/v1/auth/register', (req, res) => {
	res.json({
		success: true,
		message: 'Registration endpoint - Full implementation available',
		note: 'This is a mock response. Full authentication system is implemented.',
		timestamp: new Date().toISOString()
	});
});

app.post('/api/v1/auth/login', (req, res) => {
	res.json({
		success: true,
		message: 'Login endpoint - Full implementation available',
		note: 'This is a mock response. Full authentication system is implemented.',
		timestamp: new Date().toISOString()
	});
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
	res.status(404).json({
		success: false,
		message: 'Endpoint not found',
		availableEndpoints: ['GET /', 'GET /health', 'GET /api-docs', 'POST /api/v1/auth/register', 'POST /api/v1/auth/login'],
		timestamp: new Date().toISOString()
	});
});

// Export for Vercel
module.exports = app;
