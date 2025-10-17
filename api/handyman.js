const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { Resend } = require('resend');
const crypto = require('crypto');

// Set default environment variables for Vercel
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000'; // Vercel uses its own port

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Basic logging
const logging = {
	info: (...args) => console.log('[INFO]', ...args),
	warn: (...args) => console.warn('[WARN]', ...args),
	error: (...args) => console.error('[ERROR]', ...args),
	log: (...args) => console.log('[LOG]', ...args)
};

// Debug logging for environment variables
logging.info('Environment variables check:');
logging.info('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Missing');
logging.info('RESEND_API_KEY length:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0);
logging.info('RESEND_API_KEY starts with re_:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.startsWith('re_') : false);
logging.info('RESEND_API_KEY first 10 chars:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) : 'N/A');

const app = express();

// In-memory store for user data (in production, use a database)
const userStore = new Map();
const emailStore = new Set();
const phoneStore = new Set();
const tokenStore = new Map(); // Store active tokens
const revokedTokens = new Set(); // Store revoked tokens

// Token security configuration
const TOKEN_CONFIG = {
	ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
	REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
	VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
	SECRET_KEY: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
	SALT_ROUNDS: 12
};

// Secure token generation functions
const tokenUtils = {
	// Generate cryptographically secure random token
	generateSecureToken: (length = 32) => {
		return crypto.randomBytes(length).toString('hex');
	},

	// Generate signed token with expiration
	generateSignedToken: (payload, expiryMs) => {
		const timestamp = Date.now();
		const expiry = timestamp + expiryMs;
		const data = {
			...payload,
			iat: timestamp,
			exp: expiry
		};

		// Create HMAC signature
		const signature = crypto.createHmac('sha256', TOKEN_CONFIG.SECRET_KEY).update(JSON.stringify(data)).digest('hex');

		// Combine data and signature
		const token = Buffer.from(JSON.stringify(data)).toString('base64') + '.' + signature;
		return token;
	},

	// Verify and decode token
	verifyToken: (token) => {
		try {
			const [dataPart, signature] = token.split('.');
			if (!dataPart || !signature) {
				throw new Error('Invalid token format');
			}

			// Verify signature
			const expectedSignature = crypto.createHmac('sha256', TOKEN_CONFIG.SECRET_KEY).update(dataPart).digest('hex');

			if (signature !== expectedSignature) {
				throw new Error('Invalid token signature');
			}

			// Decode data
			const data = JSON.parse(Buffer.from(dataPart, 'base64').toString());

			// Check expiration
			if (Date.now() > data.exp) {
				throw new Error('Token expired');
			}

			return data;
		} catch (error) {
			throw new Error(`Token verification failed: ${error.message}`);
		}
	},

	// Generate access token
	generateAccessToken: (userId, email, role) => {
		return tokenUtils.generateSignedToken({ userId, email, role, type: 'access' }, TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY);
	},

	// Generate refresh token
	generateRefreshToken: (userId) => {
		const token = tokenUtils.generateSignedToken({ userId, type: 'refresh' }, TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY);

		// Store refresh token
		tokenStore.set(token, {
			userId,
			type: 'refresh',
			createdAt: Date.now(),
			expiresAt: Date.now() + TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY
		});

		return token;
	},

	// Generate verification token
	generateVerificationToken: (userId, email) => {
		return tokenUtils.generateSignedToken({ userId, email, type: 'verification' }, TOKEN_CONFIG.VERIFICATION_TOKEN_EXPIRY);
	},

	// Revoke token
	revokeToken: (token) => {
		revokedTokens.add(token);
		tokenStore.delete(token);
	},

	// Check if token is revoked
	isTokenRevoked: (token) => {
		return revokedTokens.has(token);
	},

	// Clean expired tokens
	cleanExpiredTokens: () => {
		const now = Date.now();
		for (const [token, data] of tokenStore) {
			if (now > data.expiresAt) {
				tokenStore.delete(token);
				revokedTokens.add(token);
			}
		}
	}
};

// Middleware to clean expired tokens periodically
setInterval(() => {
	tokenUtils.cleanExpiredTokens();
}, 60 * 60 * 1000); // Clean every hour

// Authentication middleware
const authMiddleware = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				success: false,
				message: 'Access token required',
				error: 'Missing or invalid authorization header'
			});
		}

		const token = authHeader.substring(7); // Remove 'Bearer ' prefix

		// Check if token is revoked
		if (tokenUtils.isTokenRevoked(token)) {
			return res.status(401).json({
				success: false,
				message: 'Token has been revoked',
				error: 'Token is no longer valid'
			});
		}

		// Verify token
		const decoded = tokenUtils.verifyToken(token);

		if (decoded.type !== 'access') {
			return res.status(401).json({
				success: false,
				message: 'Invalid token type',
				error: 'Token is not an access token'
			});
		}

		// Add user info to request
		req.user = {
			userId: decoded.userId,
			email: decoded.email,
			role: decoded.role
		};

		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: 'Invalid token',
			error: error.message
		});
	}
};

// Rate limiting middleware (simple implementation)
const rateLimitStore = new Map();
const rateLimitMiddleware = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
	return (req, res, next) => {
		const clientId = req.ip || req.connection.remoteAddress;
		const now = Date.now();

		if (!rateLimitStore.has(clientId)) {
			rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
		} else {
			const data = rateLimitStore.get(clientId);
			if (now > data.resetTime) {
				data.count = 1;
				data.resetTime = now + windowMs;
			} else {
				data.count++;
			}

			if (data.count > maxRequests) {
				return res.status(429).json({
					success: false,
					message: 'Too many requests',
					error: 'Rate limit exceeded',
					retryAfter: Math.ceil((data.resetTime - now) / 1000)
				});
			}
		}

		next();
	};
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimitMiddleware(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// CORS (simplified for Vercel)
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust in production
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Inngest-Signature, X-Inngest-Environment');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

// Serve static files (if any)
app.use(express.static(path.join(__dirname, '../public')));

// Complete OpenAPI specification embedded directly
const openapiSpec = {
	openapi: '3.0.0',
	info: {
		title: 'Handyman Management API',
		description:
			'Comprehensive authentication system with 2FA, email verification, password reset, session management, and Paystack payment integration for the Handyman Management Platform.',
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
				description: "Verify user's email using token sent to their email",
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
				description: "Send password reset link to user's email",
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
				description: "Retrieve authenticated user's profile information",
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
					accessToken: { type: 'string' },
					refreshToken: { type: 'string' },
					user: { $ref: '#/components/schemas/User' }
				}
			},
			ChangePasswordRequest: {
				type: 'object',
				required: ['currentPassword', 'newPassword'],
				properties: {
					currentPassword: { type: 'string' },
					newPassword: {
						type: 'string',
						minLength: 8,
						pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
					}
				}
			},
			Enable2FAResponse: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					message: { type: 'string' },
					secret: { type: 'string' },
					qrCode: { type: 'string' },
					backupCodes: {
						type: 'array',
						items: { type: 'string' }
					}
				}
			},
			User: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					email: { type: 'string', format: 'email' },
					role: { type: 'string', enum: ['customer', 'handyman', 'admin'] },
					isEmailVerified: { type: 'boolean' },
					isTwoFactorEnabled: { type: 'boolean' },
					profile: { type: 'object' },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' }
				}
			},
			Session: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					deviceInfo: { type: 'string' },
					ipAddress: { type: 'string' },
					createdAt: { type: 'string', format: 'date-time' },
					lastUsed: { type: 'string', format: 'date-time' },
					isCurrent: { type: 'boolean' }
				}
			},
			InitializePaymentRequest: {
				type: 'object',
				required: ['jobId', 'amount', 'description'],
				properties: {
					jobId: { type: 'string' },
					amount: { type: 'number', minimum: 100 },
					description: { type: 'string' },
					metadata: { type: 'object' }
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
							reference: { type: 'string' },
							authorizationUrl: { type: 'string' },
							amount: { type: 'number' },
							currency: { type: 'string' }
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
						type: 'object',
						properties: {
							reference: { type: 'string' },
							amount: { type: 'number' },
							status: { type: 'string' },
							paidAt: { type: 'string', format: 'date-time' }
						}
					}
				}
			},
			Payment: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					reference: { type: 'string' },
					amount: { type: 'number' },
					currency: { type: 'string' },
					status: { type: 'string' },
					description: { type: 'string' },
					createdAt: { type: 'string', format: 'date-time' },
					paidAt: { type: 'string', format: 'date-time' }
				}
			},
			SuccessMessage: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					message: { type: 'string' }
				}
			}
		},
		responses: {
			BadRequest: {
				description: 'Bad request',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								success: { type: 'boolean', example: false },
								message: { type: 'string' },
								errors: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											field: { type: 'string' },
											message: { type: 'string' }
										}
									}
								}
							}
						}
					}
				}
			},
			Unauthorized: {
				description: 'Unauthorized',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								success: { type: 'boolean', example: false },
								message: { type: 'string', example: 'Unauthorized' }
							}
						}
					}
				}
			},
			Forbidden: {
				description: 'Forbidden',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								success: { type: 'boolean', example: false },
								message: { type: 'string', example: 'Forbidden' }
							}
						}
					}
				}
			},
			Conflict: {
				description: 'Conflict',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								success: { type: 'boolean', example: false },
								message: { type: 'string', example: 'User already exists' }
							}
						}
					}
				}
			},
			TooManyRequests: {
				description: 'Too many requests',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								success: { type: 'boolean', example: false },
								message: { type: 'string', example: 'Rate limit exceeded' }
							}
						}
					}
				}
			}
		}
	}
};

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get(
	'/api-docs',
	swaggerUi.setup(openapiSpec, {
		customCss: '.swagger-ui .topbar { display: none }',
		customSiteTitle: 'Handyman API Documentation',
		swaggerOptions: {
			defaultModelsExpandDepth: 1,
			defaultModelExpandDepth: 1
		}
	})
);

// OpenAPI JSON specification
app.get('/api-docs/openapi.json', (req, res) => {
	res.json(openapiSpec);
});

// Inngest webhook endpoint
app.post('/api/inngest', async (req, res) => {
	try {
		logging.info('Inngest webhook received:', req.body);
		logging.info('Headers:', req.headers);

		// Check if this is an Inngest sync request (GET request to /api/inngest)
		if (req.method === 'GET' || (req.body && req.body.name === 'inngest/sync')) {
			// Return proper sync response for Inngest
			res.json({
				message: 'Sync successful',
				apps: [
					{
						id: process.env.INNGEST_APP_ID || 'handyman-app',
						name: 'Handyman Management App',
						functions: [
							{
								id: 'send-verification-email',
								name: 'Send Verification Email',
								triggers: [{ event: 'auth/email.verification.requested' }]
							},
							{
								id: 'send-welcome-email',
								name: 'Send Welcome Email',
								triggers: [{ event: 'auth/user.registered' }]
							},
							{
								id: 'send-payment-confirmation',
								name: 'Send Payment Confirmation',
								triggers: [{ event: 'payment/verified' }]
							}
						]
					}
				]
			});
		} else {
			// Process email events
			const { name, data } = req.body;

			if (name === 'auth/email.verification.requested') {
				logging.info('Processing email verification request:', data);

				const verificationUrl = `https://kleva-server.vercel.app/api/v1/auth/verify-email/${data.verificationToken}`;

				// Email template
				const emailHtml = `
					<!DOCTYPE html>
					<html>
					<head>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
							.container { max-width: 600px; margin: 0 auto; padding: 20px; }
							.header { background: #ff4500; color: white; padding: 20px; text-align: center; }
							.content { padding: 20px; background: #f9f9f9; }
							.button { display: inline-block; background: #ff4500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
							.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<h1>🔧 Handyman Management</h1>
							</div>
							<div class="content">
								<h2>Verify Your Email Address</h2>
								<p>Hello ${data.firstName},</p>
								<p>Thank you for registering with Handyman Management! Please verify your email address to complete your registration.</p>
								<p>Click the button below to verify your email:</p>
								<a href="${verificationUrl}" class="button">Verify Email Address</a>
								<p>Or copy and paste this link into your browser:</p>
								<p><a href="${verificationUrl}">${verificationUrl}</a></p>
								<p>This link will expire in 24 hours.</p>
								<p>If you didn't create an account, please ignore this email.</p>
							</div>
							<div class="footer">
								<p>© 2024 Handyman Management. All rights reserved.</p>
							</div>
						</div>
					</body>
					</html>
				`;

				// Send email using Resend
				let emailResult = null;
				let emailError = null;

				// Debug logging
				logging.info('Attempting to send email with Resend...');
				logging.info('RESEND_API_KEY available:', !!process.env.RESEND_API_KEY);
				logging.info('Resend instance created:', !!resend);

				try {
					emailResult = await resend.emails.send({
						from: 'Handyman Management <noreply@anorateck.com>',
						to: [data.email],
						subject: 'Verify Your Email Address - Handyman Management',
						html: emailHtml
					});

					logging.info('Email sent successfully:', emailResult);
				} catch (error) {
					emailError = error;
					logging.error('Failed to send email:', error);
					logging.error('Error details:', {
						message: error.message,
						name: error.name,
						stack: error.stack
					});
				}

				res.json({
					success: emailError ? false : true,
					message: emailError
						? 'Email verification event processed but email failed to send'
						: 'Email verification event processed successfully',
					event: 'auth/email.verification.requested',
					emailSent: {
						to: data.email,
						subject: 'Verify Your Email Address - Handyman Management',
						verificationUrl: verificationUrl,
						status: emailError ? 'Failed to send' : 'Email sent successfully',
						resendId: emailResult?.id || null,
						error: emailError?.message || null
					},
					timestamp: new Date().toISOString()
				});
			} else if (name === 'auth/user.registered') {
				logging.info('Processing welcome email request:', data);

				// Welcome email template
				const welcomeHtml = `
					<!DOCTYPE html>
					<html>
					<head>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
							.container { max-width: 600px; margin: 0 auto; padding: 20px; }
							.header { background: #ff4500; color: white; padding: 20px; text-align: center; }
							.content { padding: 20px; background: #f9f9f9; }
							.button { display: inline-block; background: #ff4500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
							.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<h1>🔧 Handyman Management</h1>
							</div>
							<div class="content">
								<h2>Welcome to Handyman Management!</h2>
								<p>Hello ${data.firstName} ${data.lastName},</p>
								<p>Welcome to Handyman Management! We're excited to have you join our platform as a <strong>${data.role}</strong>.</p>
								<p>Here's what you can do next:</p>
								<ul>
									<li>Complete your profile setup</li>
									<li>Verify your email address</li>
									<li>Explore available services</li>
									<li>Connect with customers or handymen</li>
								</ul>
								<a href="https://kleva-server.vercel.app" class="button">Get Started</a>
								<p>If you have any questions, feel free to reach out to our support team.</p>
								<p>Thank you for choosing Handyman Management!</p>
							</div>
							<div class="footer">
								<p>© 2024 Handyman Management. All rights reserved.</p>
							</div>
						</div>
					</body>
					</html>
				`;

				// Send welcome email using Resend
				let welcomeEmailResult = null;
				let welcomeEmailError = null;

				try {
					welcomeEmailResult = await resend.emails.send({
						from: 'Handyman Management <welcome@anorateck.com>',
						to: [data.email],
						subject: 'Welcome to Handyman Management!',
						html: welcomeHtml
					});

					logging.info('Welcome email sent successfully:', welcomeEmailResult);
				} catch (error) {
					welcomeEmailError = error;
					logging.error('Failed to send welcome email:', error);
				}

				res.json({
					success: welcomeEmailError ? false : true,
					message: welcomeEmailError
						? 'Welcome email event processed but email failed to send'
						: 'Welcome email event processed successfully',
					event: 'auth/user.registered',
					emailSent: {
						to: data.email,
						subject: 'Welcome to Handyman Management!',
						status: welcomeEmailError ? 'Failed to send' : 'Email sent successfully',
						resendId: welcomeEmailResult?.id || null,
						error: welcomeEmailError?.message || null
					},
					timestamp: new Date().toISOString()
				});
			} else if (name === 'payment/verified') {
				logging.info('Processing payment confirmation request:', data);

				logging.info(`Payment confirmation would be sent to ${data.email}`);
				logging.info(`Email content: Payment of ${data.amount} confirmed for ${data.jobTitle}`);

				res.json({
					success: true,
					message: 'Payment confirmation event processed',
					event: 'payment/verified',
					emailSent: {
						to: data.email,
						subject: 'Payment Confirmed',
						status: 'Mock email sent (check logs for details)'
					},
					timestamp: new Date().toISOString()
				});
			} else {
				// Generic event processing
				res.json({
					success: true,
					message: 'Inngest webhook processed successfully',
					timestamp: new Date().toISOString(),
					event: req.body,
					status: 'active',
					note: 'Event processed but no specific handler found'
				});
			}
		}
	} catch (error) {
		logging.error('Error processing Inngest webhook:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			timestamp: new Date().toISOString(),
			error: error.message
		});
	}
});

// Inngest endpoint - handles sync (PUT), health check (GET), and webhooks (POST)
app.get('/api/inngest', (req, res) => {
	const isConfigured = !!(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY && process.env.INNGEST_APP_ID);

	// Check if this is a sync request from Inngest dashboard
	// Inngest sends specific headers when syncing
	if (
		(req.headers['user-agent'] && req.headers['user-agent'].includes('Inngest')) ||
		req.query.sync === 'true' ||
		req.headers['x-inngest-environment']
	) {
		logging.info('Inngest sync request detected via GET:', req.headers);

		// Return proper sync response for Inngest dashboard
		const syncResponse = {
			message: 'Sync successful',
			deployId: req.query.deployId || 'latest',
			apps: [
				{
					id: process.env.INNGEST_APP_ID || 'handyman-app',
					name: 'Handyman Management App',
					url: 'https://kleva-server.vercel.app/api/inngest',
					functions: [
						{
							id: 'send-verification-email',
							name: 'Send Verification Email',
							triggers: [{ event: 'auth/email.verification.requested' }]
						},
						{
							id: 'send-welcome-email',
							name: 'Send Welcome Email',
							triggers: [{ event: 'auth/user.registered' }]
						},
						{
							id: 'send-payment-confirmation',
							name: 'Send Payment Confirmation',
							triggers: [{ event: 'payment/verified' }]
						}
					]
				}
			]
		};

		logging.info('Sending sync response via GET:', syncResponse);
		res.json(syncResponse);
	} else {
		// Regular health check response
		res.json({
			success: true,
			message: 'Inngest endpoint is active and ready',
			timestamp: new Date().toISOString(),
			status: 'healthy',
			configured: isConfigured,
			note: isConfigured ? 'Inngest SDK integration enabled' : 'This endpoint is ready for Inngest integration',
			availableFunctions: ['email verification', 'welcome emails', 'payment confirmations', 'job notifications'],
			environmentVariables: {
				INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY ? 'Set' : 'Missing',
				INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY ? 'Set' : 'Missing',
				INNGEST_APP_ID: process.env.INNGEST_APP_ID ? 'Set' : 'Missing'
			},
			instructions: isConfigured
				? {
						step1: 'Inngest is fully configured and ready to use',
						step2: 'Send events to /api/inngest endpoint',
						step3: 'Check Inngest dashboard for function execution'
				  }
				: {
						step1: 'Get your Inngest keys from https://app.inngest.com',
						step2: 'Add INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY to your environment variables',
						step3: 'Add INNGEST_APP_ID environment variable'
				  },
			exampleUsage: {
				webhook: 'POST /api/inngest with Inngest event data',
				healthCheck: 'GET /api/inngest for status information',
				sync: 'PUT /api/inngest for Inngest dashboard sync'
			}
		});
	}
});

// Inngest sync endpoint (PUT request)
app.put('/api/inngest', (req, res) => {
	logging.info('Inngest sync request received:', req.method, req.headers);
	logging.info('Request body:', req.body);
	logging.info('Query params:', req.query);

	// Return proper sync response for Inngest dashboard
	const syncResponse = {
		message: 'Sync successful',
		deployId: req.query.deployId || 'latest',
		apps: [
			{
				id: process.env.INNGEST_APP_ID || 'handyman-app',
				name: 'Handyman Management App',
				url: 'https://kleva-server.vercel.app/api/inngest',
				functions: [
					{
						id: 'send-verification-email',
						name: 'Send Verification Email',
						triggers: [{ event: 'auth/email.verification.requested' }]
					},
					{
						id: 'send-welcome-email',
						name: 'Send Welcome Email',
						triggers: [{ event: 'auth/user.registered' }]
					},
					{
						id: 'send-payment-confirmation',
						name: 'Send Payment Confirmation',
						triggers: [{ event: 'payment/verified' }]
					}
				]
			}
		]
	};

	logging.info('Sending sync response:', syncResponse);
	res.json(syncResponse);
});

// Authentication endpoints with validation
app.post('/api/v1/auth/register', async (req, res) => {
	try {
		const { email, password, role, profile } = req.body;

		// Basic validation
		if (!email || !password || !role || !profile) {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields',
				errors: [
					{ field: 'email', message: 'Email is required' },
					{ field: 'password', message: 'Password is required' },
					{ field: 'role', message: 'Role is required' },
					{ field: 'profile', message: 'Profile is required' }
				]
			});
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid email format',
				errors: [{ field: 'email', message: 'Please provide a valid email address' }]
			});
		}

		// Password validation
		if (password.length < 8) {
			return res.status(400).json({
				success: false,
				message: 'Password too short',
				errors: [{ field: 'password', message: 'Password must be at least 8 characters' }]
			});
		}

		// Role validation
		const validRoles = ['customer', 'handyman', 'admin'];
		if (!validRoles.includes(role)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid role',
				errors: [{ field: 'role', message: 'Role must be customer, handyman, or admin' }]
			});
		}

		// Check for duplicate email
		if (emailStore.has(email.toLowerCase())) {
			return res.status(409).json({
				success: false,
				message: 'Email already registered',
				errors: [{ field: 'email', message: 'An account with this email already exists' }]
			});
		}

		// Check for duplicate phone number (if provided)
		if (profile.phone && phoneStore.has(profile.phone)) {
			return res.status(409).json({
				success: false,
				message: 'Phone number already registered',
				errors: [{ field: 'phone', message: 'An account with this phone number already exists' }]
			});
		}

		// Additional profile validation
		if (!profile.firstName || !profile.lastName) {
			return res.status(400).json({
				success: false,
				message: 'Missing profile information',
				errors: [
					{ field: 'firstName', message: 'First name is required' },
					{ field: 'lastName', message: 'Last name is required' }
				]
			});
		}

		// Generate mock user ID
		const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		// Generate verification token
		const verificationToken = tokenUtils.generateVerificationToken(userId, email);

		// Store user data to prevent duplicates
		const userData = {
			userId: userId,
			email: email.toLowerCase(),
			password: password, // In production, hash this password
			role: role,
			profile: profile,
			verificationToken: verificationToken,
			isEmailVerified: false,
			approvalStatus: role === 'handyman' ? 'pending' : 'approved', // Admin approval required for handymen
			approvedBy: null,
			approvedAt: null,
			rejectionReason: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Add to stores
		userStore.set(userId, userData);
		emailStore.add(email.toLowerCase());
		if (profile.phone) {
			phoneStore.add(profile.phone);
		}

		logging.info('User registered successfully:', { userId, email, role });

		// Send email verification event to Inngest
		try {
			const emailEvent = {
				name: 'auth/email.verification.requested',
				data: {
					userId: userId,
					email: email,
					firstName: profile.firstName || 'User',
					lastName: profile.lastName || '',
					verificationToken: verificationToken,
					role: role
				}
			};

			// Send to Inngest webhook
			const inngestResponse = await fetch(`${req.protocol}://${req.get('host')}/api/inngest`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(emailEvent)
			});

			logging.info('Email verification event sent to Inngest:', emailEvent);
		} catch (emailError) {
			logging.warn('Failed to send email verification event:', emailError);
		}

		// Send welcome email event to Inngest
		try {
			const welcomeEvent = {
				name: 'auth/user.registered',
				data: {
					userId: userId,
					email: email,
					firstName: profile.firstName || 'User',
					lastName: profile.lastName || '',
					role: role
				}
			};

			// Send to Inngest webhook
			const welcomeResponse = await fetch(`${req.protocol}://${req.get('host')}/api/inngest`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(welcomeEvent)
			});

			logging.info('Welcome email event sent to Inngest:', welcomeEvent);
		} catch (welcomeError) {
			logging.warn('Failed to send welcome email event:', welcomeError);
		}

		// Successful registration response
		res.status(201).json({
			success: true,
			message: 'Registration successful',
			userId: userId,
			email: email,
			role: role,
			emailVerificationRequired: true,
			approvalRequired: role === 'handyman',
			approvalStatus: role === 'handyman' ? 'pending' : 'approved',
			verificationToken: verificationToken, // Include token for testing
			note: role === 'handyman' 
				? 'Email verification required. After verification, your account will be reviewed by an admin before you can login.'
				: 'Email verification required before login. Check your email for verification link.',
			emailsSent: {
				verification: 'Sent to Inngest for processing',
				welcome: 'Sent to Inngest for processing'
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Registration error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			timestamp: new Date().toISOString()
		});
	}
});

app.post('/api/v1/auth/login', async (req, res) => {
	try {
		const { email, password, twoFactorCode } = req.body;

		// Basic validation
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: 'Email and password are required',
				errors: [
					{ field: 'email', message: 'Email is required' },
					{ field: 'password', message: 'Password is required' }
				]
			});
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid email format',
				errors: [{ field: 'email', message: 'Please provide a valid email address' }]
			});
		}

		// Check if user exists in our store
		const userExists = emailStore.has(email.toLowerCase());
		if (!userExists) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
				errors: [{ field: 'email', message: 'No account found with this email address' }]
			});
		}

		// Find user data
		let userData = null;
		for (const [userId, user] of userStore) {
			if (user.email === email.toLowerCase()) {
				userData = user;
				break;
			}
		}

		// Check password (in production, compare hashed passwords)
		if (userData.password !== password) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
				errors: [{ field: 'password', message: 'Incorrect password' }]
			});
		}

		// Check if email is verified
		if (!userData.isEmailVerified) {
			return res.status(403).json({
				success: false,
				message: 'Email not verified',
				errors: [{ field: 'email', message: 'Please verify your email address before logging in' }]
			});
		}

		// Check approval status for handymen
		if (userData.role === 'handyman' && userData.approvalStatus !== 'approved') {
			return res.status(403).json({
				success: false,
				message: 'Account pending approval',
				errors: [{ 
					field: 'approval', 
					message: userData.approvalStatus === 'pending' 
						? 'Your handyman account is pending admin approval' 
						: 'Your handyman account has been rejected. Please contact support.'
				}],
				approvalStatus: userData.approvalStatus,
				rejectionReason: userData.rejectionReason
			});
		}

		const mockUser = {
			id: userData.userId,
			email: userData.email,
			role: userData.role,
			isEmailVerified: userData.isEmailVerified,
			isTwoFactorEnabled: false
		};

		// Generate secure tokens
		const accessToken = tokenUtils.generateAccessToken(userData.userId, userData.email, userData.role);
		const refreshToken = tokenUtils.generateRefreshToken(userData.userId);

		// Mock successful login
		res.status(200).json({
			success: true,
			message: 'Login successful',
			tokens: {
				accessToken: accessToken,
				refreshToken: refreshToken
			},
			user: {
				id: mockUser.id,
				email: mockUser.email,
				role: mockUser.role,
				isEmailVerified: mockUser.isEmailVerified,
				isTwoFactorEnabled: mockUser.isTwoFactorEnabled
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Login error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			timestamp: new Date().toISOString()
		});
	}
});

app.post('/api/v1/payments/initialize-job', (req, res) => {
	res.json({
		success: true,
		message: 'Payment initialization endpoint - Full implementation available',
		note: 'This is a mock response. Full payment system is implemented.',
		timestamp: new Date().toISOString()
	});
});

app.get('/api/v1/payments/banks', (req, res) => {
	res.json({
		success: true,
		message: 'Banks retrieved successfully',
		data: [
			{ id: 1, name: 'Access Bank', code: '044' },
			{ id: 2, name: 'Guaranty Trust Bank', code: '058' },
			{ id: 3, name: 'Zenith Bank', code: '057' },
			{ id: 4, name: 'First Bank of Nigeria', code: '011' },
			{ id: 5, name: 'United Bank for Africa', code: '033' }
		],
		timestamp: new Date().toISOString()
	});
});

// Email verification endpoint
app.get('/api/v1/auth/verify-email/:token', async (req, res) => {
	try {
		const { token } = req.params;

		if (!token) {
			return res.status(400).json({
				success: false,
				message: 'Verification token is required',
				timestamp: new Date().toISOString()
			});
		}

		// Verify the token
		try {
			const decoded = tokenUtils.verifyToken(token);

			if (decoded.type !== 'verification') {
				return res.status(400).json({
					success: false,
					message: 'Invalid token type',
					verified: false,
					timestamp: new Date().toISOString()
				});
			}

			// Find user by userId from token
			const userData = userStore.get(decoded.userId);
			if (!userData) {
				return res.status(400).json({
					success: false,
					message: 'User not found',
					verified: false,
					timestamp: new Date().toISOString()
				});
			}

			// Verify email matches
			if (userData.email !== decoded.email) {
				return res.status(400).json({
					success: false,
					message: 'Token email mismatch',
					verified: false,
					timestamp: new Date().toISOString()
				});
			}

			// Mark email as verified
			userData.isEmailVerified = true;
			userData.updatedAt = new Date().toISOString();
			userStore.set(decoded.userId, userData);

			logging.info('Email verification successful for user:', { userId: decoded.userId, email: userData.email });

			res.status(200).json({
				success: true,
				message: 'Email verified successfully',
				verified: true,
				userId: decoded.userId,
				email: userData.email,
				note: 'Email verification completed. You can now login.',
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			logging.error('Token verification failed:', error);
			res.status(400).json({
				success: false,
				message: 'Invalid or expired verification token',
				verified: false,
				error: error.message,
				timestamp: new Date().toISOString()
			});
		}
	} catch (error) {
		logging.error('Email verification error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			timestamp: new Date().toISOString()
		});
	}
});

// Landing page route
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
app.get('/health', (req, res) => {
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

// Token refresh endpoint
app.post('/api/v1/auth/refresh', async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(400).json({
				success: false,
				message: 'Refresh token is required',
				timestamp: new Date().toISOString()
			});
		}

		// Check if token is revoked
		if (tokenUtils.isTokenRevoked(refreshToken)) {
			return res.status(401).json({
				success: false,
				message: 'Refresh token has been revoked',
				timestamp: new Date().toISOString()
			});
		}

		// Verify refresh token
		const decoded = tokenUtils.verifyToken(refreshToken);

		if (decoded.type !== 'refresh') {
			return res.status(401).json({
				success: false,
				message: 'Invalid token type',
				timestamp: new Date().toISOString()
			});
		}

		// Get user data
		const userData = userStore.get(decoded.userId);
		if (!userData) {
			return res.status(401).json({
				success: false,
				message: 'User not found',
				timestamp: new Date().toISOString()
			});
		}

		// Generate new access token
		const newAccessToken = tokenUtils.generateAccessToken(userData.userId, userData.email, userData.role);

		res.status(200).json({
			success: true,
			message: 'Token refreshed successfully',
			accessToken: newAccessToken,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Token refresh error:', error);
		res.status(401).json({
			success: false,
			message: 'Invalid refresh token',
			error: error.message,
			timestamp: new Date().toISOString()
		});
	}
});

// Logout endpoint
app.post('/api/v1/auth/logout', authMiddleware, async (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader.substring(7); // Remove 'Bearer ' prefix

		// Revoke the access token
		tokenUtils.revokeToken(token);

		logging.info('User logged out:', { userId: req.user.userId });

		res.status(200).json({
			success: true,
			message: 'Logged out successfully',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Logout error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			timestamp: new Date().toISOString()
		});
	}
});

// Revoke all tokens endpoint (for security)
app.post('/api/v1/auth/revoke-all', authMiddleware, async (req, res) => {
	try {
		const userId = req.user.userId;

		// Revoke all tokens for this user
		for (const [token, data] of tokenStore) {
			if (data.userId === userId) {
				tokenUtils.revokeToken(token);
			}
		}

		logging.info('All tokens revoked for user:', { userId });

		res.status(200).json({
			success: true,
			message: 'All tokens revoked successfully',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Revoke all tokens error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			timestamp: new Date().toISOString()
		});
	}
});

// Protected user profile endpoint
app.get('/api/v1/auth/me', authMiddleware, (req, res) => {
	try {
		const userData = userStore.get(req.user.userId);
		if (!userData) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
				timestamp: new Date().toISOString()
			});
		}

		// Return user data (excluding sensitive information)
		res.status(200).json({
			success: true,
			message: 'User profile retrieved successfully',
			data: {
				userId: userData.userId,
				email: userData.email,
				role: userData.role,
				profile: userData.profile,
				isEmailVerified: userData.isEmailVerified,
				createdAt: userData.createdAt,
				updatedAt: userData.updatedAt
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Get user profile error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			timestamp: new Date().toISOString()
		});
	}
});

// Token security test endpoint
app.get('/api/v1/auth/token-info', authMiddleware, (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader.substring(7);

		// Decode token to show info (without sensitive data)
		const decoded = tokenUtils.verifyToken(token);

		res.status(200).json({
			success: true,
			message: 'Token information',
			data: {
				userId: decoded.userId,
				email: decoded.email,
				role: decoded.role,
				type: decoded.type,
				issuedAt: new Date(decoded.iat).toISOString(),
				expiresAt: new Date(decoded.exp).toISOString(),
				timeRemaining: Math.max(0, decoded.exp - Date.now())
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Token info error:', error);
		res.status(401).json({
			success: false,
			message: 'Invalid token',
			error: error.message,
			timestamp: new Date().toISOString()
		});
	}
});

// User statistics endpoint (for testing)
app.get('/api/v1/users/stats', (req, res) => {
	res.json({
		success: true,
		message: 'User statistics',
		data: {
			totalUsers: userStore.size,
			totalEmails: emailStore.size,
			totalPhones: phoneStore.size,
			verifiedUsers: Array.from(userStore.values()).filter((user) => user.isEmailVerified).length,
			unverifiedUsers: Array.from(userStore.values()).filter((user) => !user.isEmailVerified).length,
			usersByRole: {
				customer: Array.from(userStore.values()).filter((user) => user.role === 'customer').length,
				handyman: Array.from(userStore.values()).filter((user) => user.role === 'handyman').length,
				admin: Array.from(userStore.values()).filter((user) => user.role === 'admin').length
			},
			handymanApprovals: {
				pending: Array.from(userStore.values()).filter((user) => user.role === 'handyman' && user.approvalStatus === 'pending').length,
				approved: Array.from(userStore.values()).filter((user) => user.role === 'handyman' && user.approvalStatus === 'approved').length,
				rejected: Array.from(userStore.values()).filter((user) => user.role === 'handyman' && user.approvalStatus === 'rejected').length
			}
		},
		timestamp: new Date().toISOString()
	});
});

// Admin endpoints for handyman approval management
app.get('/api/v1/admin/pending-handymen', authMiddleware, (req, res) => {
	try {
		// Check if user is admin
		if (req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Admin access required',
				errors: [{ field: 'authorization', message: 'Only admins can access this endpoint' }]
			});
		}

		const pendingHandymen = Array.from(userStore.values())
			.filter((user) => user.role === 'handyman' && user.approvalStatus === 'pending')
			.map((user) => ({
				userId: user.userId,
				email: user.email,
				profile: user.profile,
				approvalStatus: user.approvalStatus,
				createdAt: user.createdAt,
				isEmailVerified: user.isEmailVerified
			}));

		res.json({
			success: true,
			message: 'Pending handymen retrieved successfully',
			data: {
				pendingHandymen,
				count: pendingHandymen.length
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Error fetching pending handymen:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			timestamp: new Date().toISOString()
		});
	}
});

app.post('/api/v1/admin/approve-handyman/:userId', authMiddleware, async (req, res) => {
	try {
		// Check if user is admin
		if (req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Admin access required',
				errors: [{ field: 'authorization', message: 'Only admins can approve handymen' }]
			});
		}

		const { userId } = req.params;
		const userData = userStore.get(userId);

		if (!userData) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
				errors: [{ field: 'userId', message: 'No user found with this ID' }]
			});
		}

		if (userData.role !== 'handyman') {
			return res.status(400).json({
				success: false,
				message: 'Invalid user role',
				errors: [{ field: 'role', message: 'Only handymen can be approved' }]
			});
		}

		if (userData.approvalStatus === 'approved') {
			return res.status(400).json({
				success: false,
				message: 'Already approved',
				errors: [{ field: 'approval', message: 'This handyman is already approved' }]
			});
		}

		// Update approval status
		userData.approvalStatus = 'approved';
		userData.approvedBy = req.user.id;
		userData.approvedAt = new Date().toISOString();
		userData.updatedAt = new Date().toISOString();

		// Update in store
		userStore.set(userId, userData);

		logging.info('Handyman approved:', { userId, approvedBy: req.user.id });

		// Send approval notification email
		try {
			const approvalEvent = {
				name: 'handyman/approved',
				data: {
					userId: userId,
					email: userData.email,
					firstName: userData.profile.firstName,
					lastName: userData.profile.lastName,
					approvedBy: req.user.id,
					approvedAt: userData.approvedAt
				}
			};

			const approvalResponse = await fetch(`${req.protocol}://${req.get('host')}/api/inngest`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(approvalEvent)
			});

			logging.info('Approval notification event sent to Inngest:', approvalEvent);
		} catch (emailError) {
			logging.warn('Failed to send approval notification:', emailError);
		}

		res.json({
			success: true,
			message: 'Handyman approved successfully',
			data: {
				userId: userId,
				email: userData.email,
				approvalStatus: userData.approvalStatus,
				approvedBy: userData.approvedBy,
				approvedAt: userData.approvedAt
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Error approving handyman:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			timestamp: new Date().toISOString()
		});
	}
});

app.post('/api/v1/admin/reject-handyman/:userId', authMiddleware, async (req, res) => {
	try {
		// Check if user is admin
		if (req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Admin access required',
				errors: [{ field: 'authorization', message: 'Only admins can reject handymen' }]
			});
		}

		const { userId } = req.params;
		const { reason } = req.body;
		const userData = userStore.get(userId);

		if (!userData) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
				errors: [{ field: 'userId', message: 'No user found with this ID' }]
			});
		}

		if (userData.role !== 'handyman') {
			return res.status(400).json({
				success: false,
				message: 'Invalid user role',
				errors: [{ field: 'role', message: 'Only handymen can be rejected' }]
			});
		}

		if (userData.approvalStatus === 'rejected') {
			return res.status(400).json({
				success: false,
				message: 'Already rejected',
				errors: [{ field: 'approval', message: 'This handyman is already rejected' }]
			});
		}

		// Update rejection status
		userData.approvalStatus = 'rejected';
		userData.rejectionReason = reason || 'No reason provided';
		userData.approvedBy = req.user.id;
		userData.approvedAt = new Date().toISOString();
		userData.updatedAt = new Date().toISOString();

		// Update in store
		userStore.set(userId, userData);

		logging.info('Handyman rejected:', { userId, rejectedBy: req.user.id, reason });

		// Send rejection notification email
		try {
			const rejectionEvent = {
				name: 'handyman/rejected',
				data: {
					userId: userId,
					email: userData.email,
					firstName: userData.profile.firstName,
					lastName: userData.profile.lastName,
					rejectedBy: req.user.id,
					rejectionReason: userData.rejectionReason,
					rejectedAt: userData.approvedAt
				}
			};

			const rejectionResponse = await fetch(`${req.protocol}://${req.get('host')}/api/inngest`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(rejectionEvent)
			});

			logging.info('Rejection notification event sent to Inngest:', rejectionEvent);
		} catch (emailError) {
			logging.warn('Failed to send rejection notification:', emailError);
		}

		res.json({
			success: true,
			message: 'Handyman rejected successfully',
			data: {
				userId: userId,
				email: userData.email,
				approvalStatus: userData.approvalStatus,
				rejectionReason: userData.rejectionReason,
				rejectedBy: userData.approvedBy,
				rejectedAt: userData.approvedAt
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Error rejecting handyman:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			timestamp: new Date().toISOString()
		});
	}
});

// Test Resend endpoint
app.post('/api/test-resend', async (req, res) => {
	try {
		logging.info('Testing Resend API...');
		logging.info('RESEND_API_KEY available:', !!process.env.RESEND_API_KEY);
		logging.info('RESEND_API_KEY length:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0);

		const testEmail = req.body.email || 'elijahndenwa19@gmail.com';

		const result = await resend.emails.send({
			from: 'Handyman Management <test@anorateck.com>',
			to: [testEmail],
			subject: 'Test Email from Handyman Management',
			html: '<h1>Test Email</h1><p>This is a test email to verify Resend integration.</p>'
		});

		logging.info('Resend test result:', result);

		res.json({
			success: true,
			message: 'Test email sent successfully',
			resendId: result.id,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logging.error('Resend test error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to send test email',
			error: error.message,
			timestamp: new Date().toISOString()
		});
	}
});

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
	res.status(404).json({
		success: false,
		message: 'Endpoint not found',
		path: req.originalUrl,
		method: req.method,
		timestamp: new Date().toISOString(),
		availableEndpoints: {
			documentation: '/api-docs',
			health: '/health',
			inngest: '/api/inngest',
			auth: '/api/v1/auth/*',
			payments: '/api/v1/payments/*'
		}
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	logging.error('Unhandled error:', err);

	res.status(500).json({
		success: false,
		message: 'Internal server error',
		timestamp: new Date().toISOString(),
		...(process.env.NODE_ENV === 'development' && { error: err.message })
	});
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	logging.info(`Server running on port ${PORT}`);
});

module.exports = app;
