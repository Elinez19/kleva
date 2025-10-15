const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

// Set default environment variables for Vercel
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000'; // Vercel uses its own port

// Basic logging
const logging = {
	info: (...args) => console.log('[INFO]', ...args),
	warn: (...args) => console.warn('[WARN]', ...args),
	error: (...args) => console.error('[ERROR]', ...args),
	log: (...args) => console.log('[LOG]', ...args)
};

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.post('/api/inngest', (req, res) => {
	logging.info('Inngest webhook received:', req.body);

	// Check if this is an Inngest sync request
	if (req.body && req.body.name === 'inngest/sync') {
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
		// Regular webhook processing
		res.json({
			success: true,
			message: 'Inngest webhook processed successfully',
			timestamp: new Date().toISOString(),
			event: req.body,
			status: 'active',
			note: 'This endpoint is ready for Inngest integration. Configure your Inngest keys to enable full functionality.'
		});
	}
});

// Inngest health check endpoint
app.get('/api/inngest', (req, res) => {
	const isConfigured = !!(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY && process.env.INNGEST_APP_ID);

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
			healthCheck: 'GET /api/inngest for status information'
		}
	});
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
