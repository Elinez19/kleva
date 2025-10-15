import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Read the Swagger JSON file
let swaggerDocument: any;
try {
	const swaggerFilePath = path.join(__dirname, '../../openapi.json');
	swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, 'utf8'));
} catch (error) {
	// Fallback for Vercel deployment
	const swaggerFilePath = path.join(process.cwd(), 'openapi.json');
	swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, 'utf8'));
}

// Self-contained Swagger UI route (no external dependencies)
router.get('/api-docs', (req: Request, res: Response) => {
	res.send(`
		<!DOCTYPE html>
		<html>
		<head>
			<title>Handyman Management API Documentation</title>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css" />
			<style>
				.swagger-ui .topbar { display: none; }
				.swagger-ui .info { margin: 20px 0; }
				body { margin: 0; background: #fafafa; }
			</style>
		</head>
		<body>
			<div id="swagger-ui"></div>
			<script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
			<script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js"></script>
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
						validatorUrl: null,
						defaultModelsExpandDepth: 1,
						defaultModelExpandDepth: 1
					});
				};
			</script>
		</body>
		</html>
	`);
});

// Serve the openapi.json file
router.get('/api-docs/openapi.json', (req: Request, res: Response) => {
	res.json(swaggerDocument);
});

// Landing page route
router.get('/', (req: Request, res: Response) => {
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
				.logo {
					font-size: 4em;
					margin-bottom: 10px;
					filter: drop-shadow(2px 2px 4px rgba(255, 69, 0, 0.3));
				}
				h1 {
					color: #ff4500;
					margin-bottom: 15px;
					font-size: 2.5em;
					font-weight: 700;
				}
				.subtitle {
					color: #555;
					font-size: 1.1em;
					margin-bottom: 40px;
					line-height: 1.6;
				}
				.features {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
					gap: 20px;
					margin-bottom: 40px;
				}
				.feature {
					background: linear-gradient(135deg, #ff4500 0%, #ff6347 100%);
					padding: 20px;
					border-radius: 10px;
					color: #fff;
					transition: transform 0.3s ease;
				}
				.feature:hover {
					transform: translateY(-5px);
					box-shadow: 0 10px 20px rgba(255, 69, 0, 0.3);
				}
				.feature-icon {
					font-size: 2em;
					margin-bottom: 10px;
					filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2));
				}
				.feature-title {
					font-weight: 600;
					margin-bottom: 5px;
					color: #fff;
				}
				.feature-desc {
					color: rgba(255, 255, 255, 0.9);
					font-size: 0.9em;
				}
				.links {
					display: flex;
					gap: 15px;
					justify-content: center;
					flex-wrap: wrap;
					margin-bottom: 30px;
				}
				.btn {
					background: #ff4500;
					color: #fff;
					padding: 15px 30px;
					text-decoration: none;
					border-radius: 8px;
					font-weight: 600;
					transition: all 0.3s ease;
					display: inline-block;
					border: 2px solid #ff4500;
				}
				.btn:hover {
					background: #ff6347;
					transform: translateY(-2px);
					box-shadow: 0 5px 20px rgba(255, 69, 0, 0.4);
				}
				.btn-secondary {
					background: #fff;
					color: #ff4500;
					border: 2px solid #ff4500;
				}
				.btn-secondary:hover {
					background: #ff4500;
					color: #fff;
				}
				.stats {
					display: flex;
					justify-content: center;
					gap: 40px;
					margin-top: 40px;
					padding-top: 30px;
					border-top: 2px solid #ff4500;
				}
				.stat {
					text-align: center;
				}
				.stat-value {
					font-size: 2em;
					font-weight: 700;
					color: #ff4500;
				}
				.stat-label {
					color: #666;
					font-size: 0.9em;
				}
				.footer {
					margin-top: 30px;
					padding-top: 20px;
					border-top: 2px solid #ff4500;
					color: #999;
					font-size: 0.9em;
				}
				.footer a {
					color: #ff4500;
					text-decoration: none;
					transition: color 0.3s ease;
				}
				.footer a:hover {
					color: #ff6347;
					text-decoration: underline;
				}
				@media (max-width: 768px) {
					.container { padding: 40px 30px; }
					h1 { font-size: 2em; }
					.logo { font-size: 3em; }
					.features { grid-template-columns: 1fr; }
					.stats { flex-direction: column; gap: 20px; }
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="logo">🔧</div>
				<h1>Handyman Management API</h1>
				<p class="subtitle">
					Complete REST API with Authentication, Session Management, and Payment Processing<br>
					Built for connecting customers with professional handymen
				</p>

				<div class="features">
					<div class="feature">
						<div class="feature-icon">🔐</div>
						<div class="feature-title">Secure Auth</div>
						<div class="feature-desc">2FA, Email Verification, Session Management</div>
					</div>
					<div class="feature">
						<div class="feature-icon">💳</div>
						<div class="feature-title">Payments</div>
						<div class="feature-desc">Paystack Integration for Nigerian Payments</div>
					</div>
					<div class="feature">
						<div class="feature-icon">👥</div>
						<div class="feature-title">Multi-Role</div>
						<div class="feature-desc">Customers, Handymen, Admins</div>
					</div>
					<div class="feature">
						<div class="feature-icon">📊</div>
						<div class="feature-title">Full Docs</div>
						<div class="feature-desc">OpenAPI 3.0 & Postman Collections</div>
					</div>
				</div>

				<div class="links">
					<a href="/api-docs" class="btn">📚 API Documentation</a>
					<a href="/api-docs/openapi.json" class="btn btn-secondary">📄 OpenAPI Spec</a>
					<a href="/health" class="btn btn-secondary">⚕️ Health Check</a>
				</div>

				<div class="stats">
					<div class="stat">
						<div class="stat-value">38</div>
						<div class="stat-label">API Endpoints</div>
					</div>
					<div class="stat">
						<div class="stat-value">7</div>
						<div class="stat-label">Categories</div>
					</div>
					<div class="stat">
						<div class="stat-value">3</div>
						<div class="stat-label">User Roles</div>
					</div>
				</div>

				<div class="footer">
					<p>Version 1.0.0 • Built with Express.js, MongoDB, Redis & TypeScript</p>
					<p style="margin-top: 10px;">
						<a href="https://github.com">GitHub</a> • 
						<a href="/api-docs">Documentation</a> • 
						<a href="mailto:support@handyman-app.com">Support</a>
					</p>
				</div>
			</div>
		</body>
		</html>
	`);
});

// Health check route
router.get('/health', (req: Request, res: Response) => {
	res.json({
		status: 'OK',
		message: 'Handyman Management API is running',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
		endpoints: {
			documentation: '/api-docs',
			openapi: '/api-docs/openapi.json',
			postman: '/handyman-app.postman_collection.json'
		}
	});
});

// Serve Postman collection
router.get('/handyman-app.postman_collection.json', (req: Request, res: Response) => {
	const collectionPath = path.join(__dirname, '../../Handyman-App.postman_collection.json');
	res.download(collectionPath, 'Handyman-App.postman_collection.json');
});

export default router;
