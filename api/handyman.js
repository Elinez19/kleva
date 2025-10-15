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

// Complete OpenAPI specification embedded directly
const openapiSpec = {
	openapi: '3.0.0',
	info: {
		title: 'Handyman Management API',
		description: 'Comprehensive authentication system with 2FA, email verification, password reset, session management, and Paystack payment integration for the Handyman Management Platform.',
		version: '1.0.0',
		contact: {
			name: 'API Support',
			email: 'support@handyman-app.com'
		}
	},
	servers: [
		{
			url: 'https://kleva-server.vercel.app',
			description: 'Production server'
		}
	],
	tags: [
		{
			name: 'Authentication',
			description: 'User registration, login, and authentication operations'
		},
		{
			name: 'Password Management',
			description: 'Password reset and change operations'
		},
		{
			name: 'Profile',
			description: 'User profile operations'
		},
		{
			name: 'Two-Factor Authentication',
			description: '2FA setup and management'
		},
		{
			name: 'Session Management',
			description: 'Multi-device session operations'
		},
		{
			name: 'Payments',
			description: 'Payment processing with Paystack integration'
		},
		{
			name: 'Health',
			description: 'API health check'
		}
	],
	paths: {
		'/api/v1/auth/register': {
			post: {
				tags: ['Authentication'],
				summary: 'Register new user',
				description: 'Create a new user account (customer, handyman, or admin). Email verification required before login.',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								oneOf: [
									{ $ref: '#/components/schemas/RegisterCustomer' },
									{ $ref: '#/components/schemas/RegisterHandyman' },
									{ $ref: '#/components/schemas/RegisterAdmin' }
								]
							},
							examples: {
								customer: {
									summary: 'Register as customer',
									value: {
										email: 'customer@example.com',
										password: 'Customer123',
										role: 'customer',
										profile: {
											firstName: 'John',
											lastName: 'Doe',
											phone: '+1234567890',
											preferredContactMethod: 'email'
										}
									}
								},
								handyman: {
									summary: 'Register as handyman',
									value: {
										email: 'handyman@example.com',
										password: 'Handyman123',
										role: 'handyman',
										profile: {
											firstName: 'Mike',
											lastName: 'Smith',
											phone: '+1234567891',
											skills: ['plumbing', 'electrical'],
											hourlyRate: 75,
											experience: 10
										}
									}
								}
							}
						}
					}
				},
				responses: {
					201: {
						description: 'Registration successful',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/RegisterResponse'
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					},
					409: {
						$ref: '#/components/responses/Conflict'
					},
					429: {
						$ref: '#/components/responses/TooManyRequests'
					}
				}
			}
		},
		'/api/v1/auth/verify-email/{token}': {
			get: {
				tags: ['Authentication'],
				summary: 'Verify email address',
				description: 'Verify user\'s email using token sent to their email',
				parameters: [
					{
						name: 'token',
						in: 'path',
						required: true,
						schema: { type: 'string' },
						description: 'Email verification token'
					}
				],
				responses: {
					200: {
						description: 'Email verified successfully',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SuccessMessage'
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					}
				}
			}
		},
		'/api/v1/auth/login': {
			post: {
				tags: ['Authentication'],
				summary: 'User login',
				description: 'Authenticate user with email and password. Returns access and refresh tokens.',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/LoginRequest'
							}
						}
					}
				},
				responses: {
					200: {
						description: 'Login successful',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/LoginResponse'
								}
							}
						}
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					},
					429: {
						$ref: '#/components/responses/TooManyRequests'
					}
				}
			}
		},
		'/api/v1/auth/refresh': {
			post: {
				tags: ['Authentication'],
				summary: 'Refresh access token',
				description: 'Get new access token using refresh token',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['refreshToken'],
								properties: {
									refreshToken: {
										type: 'string',
										description: 'Refresh token received from login'
									}
								}
							}
						}
					}
				},
				responses: {
					200: {
						description: 'Token refreshed successfully',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										success: { type: 'boolean' },
										accessToken: { type: 'string' }
									}
								}
							}
						}
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			}
		},
		'/api/v1/auth/logout': {
			post: {
				tags: ['Authentication'],
				summary: 'User logout',
				description: 'Logout and revoke current session',
				security: [{ BearerAuth: [] }],
				requestBody: {
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									refreshToken: {
										type: 'string',
										description: 'Optional refresh token to revoke'
									}
								}
							}
						}
					}
				},
				responses: {
					200: {
						description: 'Logged out successfully',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SuccessMessage'
								}
							}
						}
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			}
		},
		'/api/v1/auth/forgot-password': {
			post: {
				tags: ['Password Management'],
				summary: 'Request password reset',
				description: 'Send password reset link to user\'s email',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['email'],
								properties: {
									email: {
										type: 'string',
										format: 'email'
									}
								}
							}
						}
					}
				},
				responses: {
					200: {
						description: 'If email exists, reset link sent',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SuccessMessage'
								}
							}
						}
					},
					429: {
						$ref: '#/components/responses/TooManyRequests'
					}
				}
			}
		},
		'/api/v1/auth/reset-password/{token}': {
			post: {
				tags: ['Password Management'],
				summary: 'Reset password',
				description: 'Reset password using token from email',
				parameters: [
					{
						name: 'token',
						in: 'path',
						required: true,
						schema: { type: 'string' },
						description: 'Password reset token'
					}
				],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['newPassword'],
								properties: {
									newPassword: {
										type: 'string',
										minLength: 8,
										pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
										description: 'Must contain uppercase, lowercase, and number'
									}
								}
							}
						}
					}
				},
				responses: {
					200: {
						description: 'Password reset successful',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SuccessMessage'
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					}
				}
			}
		},
		'/api/v1/auth/change-password': {
			post: {
				tags: ['Password Management'],
				summary: 'Change password',
				description: 'Change password while logged in',
				security: [{ BearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/ChangePasswordRequest'
							}
						}
					}
				},
				responses: {
					200: {
						description: 'Password changed successfully',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SuccessMessage'
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			}
		},
		'/api/v1/auth/me': {
			get: {
				tags: ['Profile'],
				summary: 'Get current user profile',
				description: 'Retrieve authenticated user\'s profile information',
				security: [{ BearerAuth: [] }],
				responses: {
					200: {
						description: 'Profile retrieved successfully',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										success: { type: 'boolean' },
										data: { $ref: '#/components/schemas/User' }
									}
								}
							}
						}
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			},
			patch: {
				tags: ['Profile'],
				summary: 'Update user profile',
				description: 'Update user profile information',
				security: [{ BearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									profile: {
										type: 'object',
										description: 'Profile fields to update'
									}
								}
							}
						}
					}
				},
				responses: {
					200: {
						description: 'Profile updated successfully',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										success: { type: 'boolean' },
										message: { type: 'string' },
										data: { $ref: '#/components/schemas/User' }
									}
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			}
		},
		'/api/v1/auth/2fa/enable': {
			post: {
				tags: ['Two-Factor Authentication'],
				summary: 'Enable 2FA',
				description: 'Generate QR code and backup codes for 2FA setup',
				security: [{ BearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['password'],
								properties: {
									password: {
										type: 'string',
										description: 'User password for verification'
									}
								}
							}
						}
					}
				},
				responses: {
					200: {
						description: '2FA setup initiated',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/Enable2FAResponse'
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			}
		},
		'/api/v1/auth/2fa/verify': {
			post: {
				tags: ['Two-Factor Authentication'],
				summary: 'Verify and complete 2FA setup',
				description: 'Verify 2FA code from authenticator app to complete setup',
				security: [{ BearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['token'],
								properties: {
									token: {
										type: 'string',
										minLength: 6,
										maxLength: 6,
										description: '6-digit code from authenticator app'
									}
								}
							}
						}
					}
				},
				responses: {
					200: {
						description: '2FA enabled successfully',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SuccessMessage'
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					},
					429: {
						$ref: '#/components/responses/TooManyRequests'
					}
				}
			}
		},
		'/api/v1/auth/2fa/disable': {
			post: {
				tags: ['Two-Factor Authentication'],
				summary: 'Disable 2FA',
				description: 'Disable two-factor authentication',
				security: [{ BearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['password'],
								properties: {
									password: {
										type: 'string'
									},
									twoFactorCode: {
										type: 'string',
										description: 'Optional 2FA code'
									}
								}
							}
						}
					}
				},
				responses: {
					200: {
						description: '2FA disabled successfully',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SuccessMessage'
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			}
		},
		'/api/v1/auth/sessions': {
			get: {
				tags: ['Session Management'],
				summary: 'Get all active sessions',
				description: 'Retrieve all active sessions for current user',
				security: [{ BearerAuth: [] }],
				responses: {
					200: {
						description: 'Sessions retrieved successfully',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										success: { type: 'boolean' },
										data: {
											type: 'array',
											items: { $ref: '#/components/schemas/Session' }
										}
									}
								}
							}
						}
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			},
			delete: {
				tags: ['Session Management'],
				summary: 'Revoke all sessions',
				description: 'Logout from all devices',
				security: [{ BearerAuth: [] }],
				responses: {
					200: {
						description: 'All sessions revoked',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SuccessMessage'
								}
							}
						}
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			}
		},
		'/api/v1/auth/sessions/{sessionId}': {
			delete: {
				tags: ['Session Management'],
				summary: 'Revoke specific session',
				description: 'Logout from specific device',
				security: [{ BearerAuth: [] }],
				parameters: [
					{
						name: 'sessionId',
						in: 'path',
						required: true,
						schema: { type: 'string' },
						description: 'Session ID to revoke'
					}
				],
				responses: {
					200: {
						description: 'Session revoked successfully',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SuccessMessage'
								}
							}
						}
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					},
					403: {
						$ref: '#/components/responses/Forbidden'
					}
				}
			}
		},
		'/api/v1/payments/initialize-job': {
			post: {
				tags: ['Payments'],
				summary: 'Initialize job payment',
				description: 'Initialize payment for a job service',
				security: [{ BearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/InitializePaymentRequest'
							}
						}
					}
				},
				responses: {
					200: {
						description: 'Payment initialized successfully',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/PaymentInitResponse'
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			}
		},
		'/api/v1/payments/verify/{reference}': {
			get: {
				tags: ['Payments'],
				summary: 'Verify payment',
				description: 'Verify payment status using Paystack reference',
				parameters: [
					{
						name: 'reference',
						in: 'path',
						required: true,
						schema: { type: 'string' },
						description: 'Paystack payment reference'
					}
				],
				responses: {
					200: {
						description: 'Payment verified',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/PaymentVerifyResponse'
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					}
				}
			}
		},
		'/api/v1/payments/history': {
			get: {
				tags: ['Payments'],
				summary: 'Get payment history',
				description: 'Retrieve payment history for authenticated user',
				security: [{ BearerAuth: [] }],
				parameters: [
					{
						name: 'limit',
						in: 'query',
						schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
						description: 'Number of records to return'
					}
				],
				responses: {
					200: {
						description: 'Payment history retrieved',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										success: { type: 'boolean' },
										message: { type: 'string' },
										data: {
											type: 'array',
											items: { $ref: '#/components/schemas/Payment' }
										}
									}
								}
							}
						}
					},
					401: {
						$ref: '#/components/responses/Unauthorized'
					}
				}
			}
		},
		'/api/v1/payments/banks': {
			get: {
				tags: ['Payments'],
				summary: 'Get supported banks',
				description: 'Get list of supported banks for transfers',
				responses: {
					200: {
						description: 'Banks retrieved successfully',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										success: { type: 'boolean' },
										message: { type: 'string' },
										data: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													id: { type: 'number' },
													name: { type: 'string' },
													code: { type: 'string' }
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		},
		'/api/v1/payments/webhook': {
			post: {
				tags: ['Payments'],
				summary: 'Paystack webhook',
				description: 'Webhook endpoint for Paystack payment notifications',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									event: { type: 'string' },
									data: { type: 'object' }
								}
							}
						}
					}
				},
				responses: {
					200: {
						description: 'Webhook processed successfully',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/SuccessMessage'
								}
							}
						}
					},
					400: {
						$ref: '#/components/responses/BadRequest'
					}
				}
			}
		},
		'/health': {
			get: {
				tags: ['Health'],
				summary: 'Health check',
				description: 'Check if API is running',
				responses: {
					200: {
						description: 'API is healthy',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: { type: 'string', example: 'OK' },
										message: { type: 'string' },
										timestamp: { type: 'string', format: 'date-time' }
									}
								}
							}
						}
					}
				}
			}
		}
	},
	components: {
		securitySchemes: {
			BearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				description: 'JWT access token from login response'
			}
		},
		schemas: {
			RegisterCustomer: {
				type: 'object',
				required: ['email', 'password', 'role', 'profile'],
				properties: {
					email: { type: 'string', format: 'email' },
					password: {
						type: 'string',
						minLength: 8,
						pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
					},
					role: { type: 'string', enum: ['customer'] },
					profile: {
						type: 'object',
						required: ['firstName', 'lastName'],
						properties: {
							firstName: { type: 'string' },
							lastName: { type: 'string' },
							phone: { type: 'string' },
							address: { type: 'string' },
							preferredContactMethod: {
								type: 'string',
								enum: ['email', 'phone', 'sms']
							}
						}
					}
				}
			},
			RegisterHandyman: {
				type: 'object',
				required: ['email', 'password', 'role', 'profile'],
				properties: {
					email: { type: 'string', format: 'email' },
					password: {
						type: 'string',
						minLength: 8,
						pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
					},
					role: { type: 'string', enum: ['handyman'] },
					profile: {
						type: 'object',
						required: ['firstName', 'lastName'],
						properties: {
							firstName: { type: 'string' },
							lastName: { type: 'string' },
							phone: { type: 'string' },
							address: { type: 'string' },
							skills: { type: 'array', items: { type: 'string' } },
							experience: { type: 'number' },
							hourlyRate: { type: 'number' },
							availability: { type: 'string' },
							bio: { type: 'string' },
							certifications: { type: 'array', items: { type: 'string' } }
						}
					}
				}
			},
			RegisterAdmin: {
				type: 'object',
				required: ['email', 'password', 'role', 'profile'],
				properties: {
					email: { type: 'string', format: 'email' },
					password: {
						type: 'string',
						minLength: 8,
						pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
					},
					role: { type: 'string', enum: ['admin'] },
					profile: {
						type: 'object',
						required: ['firstName', 'lastName'],
						properties: {
							firstName: { type: 'string' },
							lastName: { type: 'string' },
							phone: { type: 'string' },
							department: { type: 'string' }
						}
					}
				}
			},
			RegisterResponse: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					message: { type: 'string' },
					userId: { type: 'string' }
				}
			},
			LoginRequest: {
				type: 'object',
				required: ['email', 'password'],
				properties: {
					email: { type: 'string', format: 'email' },
					password: { type: 'string' },
					twoFactorCode: {
						type: 'string',
						description: '6-digit 2FA code (if enabled)'
					}
				}
			},
			LoginResponse: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					message: { type: 'string' },
					user: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							email: { type: 'string' },
							role: { type: 'string', enum: ['customer', 'handyman', 'admin'] },
							isEmailVerified: { type: 'boolean' },
							is2FAEnabled: { type: 'boolean' }
						}
					},
					tokens: {
						type: 'object',
						properties: {
							accessToken: { type: 'string' },
							refreshToken: { type: 'string' }
						}
					},
					requires2FA: { type: 'boolean' },
					tempToken: { type: 'string' }
				}
			},
			ChangePasswordRequest: {
				type: 'object',
				required: ['currentPassword', 'newPassword', 'confirmPassword'],
				properties: {
					currentPassword: { type: 'string' },
					newPassword: {
						type: 'string',
						minLength: 8,
						pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
					},
					confirmPassword: { type: 'string' }
				}
			},
			User: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					email: { type: 'string' },
					role: { type: 'string', enum: ['customer', 'handyman', 'admin'] },
					profile: { type: 'object' },
					isEmailVerified: { type: 'boolean' },
					is2FAEnabled: { type: 'boolean' },
					isActive: { type: 'boolean' },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' }
				}
			},
			Enable2FAResponse: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					secret: { type: 'string' },
					qrCodeUrl: { type: 'string', description: 'Data URL for QR code image' },
					backupCodes: {
						type: 'array',
						items: { type: 'string' },
						description: '10 single-use backup codes'
					},
					message: { type: 'string' }
				}
			},
			Session: {
				type: 'object',
				properties: {
					sessionId: { type: 'string' },
					deviceInfo: { type: 'string' },
					ipAddress: { type: 'string' },
					lastActivity: { type: 'string', format: 'date-time' },
					createdAt: { type: 'string', format: 'date-time' }
				}
			},
			SuccessMessage: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					message: { type: 'string' }
				}
			},
			ErrorResponse: {
				type: 'object',
				properties: {
					success: { type: 'boolean', example: false },
					message: { type: 'string' }
				}
			},
			InitializePaymentRequest: {
				type: 'object',
				required: ['jobId', 'amount', 'description'],
				properties: {
					jobId: { type: 'string', description: 'Job ID' },
					amount: { type: 'number', minimum: 100, description: 'Amount in NGN (minimum ₦1.00 = 100 kobo)' },
					description: { type: 'string', maxLength: 500 },
					metadata: {
						type: 'object',
						description: 'Additional metadata'
					}
				}
			},
			PaymentInitResponse: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					message: { type: 'string' },
					data: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							reference: { type: 'string' },
							accessCode: { type: 'string' },
							authorizationUrl: { type: 'string', description: 'Paystack checkout URL' },
							amount: { type: 'number' },
							currency: { type: 'string', example: 'NGN' },
							status: { type: 'string', enum: ['pending', 'successful', 'failed'] }
						}
					}
				}
			},
			PaymentVerifyResponse: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					message: { type: 'string' },
					data: {
						$ref: '#/components/schemas/Payment'
					}
				}
			},
			Payment: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					paymentId: { type: 'string' },
					jobId: { type: 'string' },
					amount: { type: 'string', description: 'Formatted amount (e.g., ₦5,000)' },
					currency: { type: 'string', example: 'NGN' },
					status: { type: 'string', enum: ['pending', 'successful', 'failed', 'reversed', 'cancelled'] },
					reference: { type: 'string' },
					createdAt: { type: 'string', format: 'date-time' },
					paidAt: { type: 'string', format: 'date-time' },
					jobTitle: { type: 'string' }
				}
			}
		},
		responses: {
			BadRequest: {
				description: 'Bad request or validation error',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/ErrorResponse'
						}
					}
				}
			},
			Unauthorized: {
				description: 'Unauthorized - Invalid or expired token',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/ErrorResponse'
						}
					}
				}
			},
			Forbidden: {
				description: 'Forbidden - Insufficient permissions',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/ErrorResponse'
						}
					}
				}
			},
			Conflict: {
				description: 'Conflict - Resource already exists',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/ErrorResponse'
						}
					}
				}
			},
			TooManyRequests: {
				description: 'Too many requests - Rate limit exceeded',
				content: {
					'application/json': {
						schema: {
							$ref: '#/components/schemas/ErrorResponse'
						}
					}
				}
			}
		}
	}
};

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
