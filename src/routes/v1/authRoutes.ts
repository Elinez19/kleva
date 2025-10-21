import express from 'express';
import * as authControllers from '../../controllers/authControllers';
import { authenticate, requireRole } from '../../middleware/authHandler';
import { validateBody } from '../../middleware/validationHandler';
import { authLimiter, passwordResetLimiter, twoFactorLimiter } from '../../middleware/rateLimitHandler';
import {
	registerSchema,
	loginSchema,
	verifyEmailSchema,
	passwordResetRequestSchema,
	passwordResetConfirmSchema,
	changePasswordSchema,
	enable2FASchema,
	verify2FASchema,
	disable2FASchema,
	refreshTokenSchema,
	updateProfileSchema
} from '../../validation/user.validation';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, validateBody(registerSchema), authControllers.register);

router.post('/login', authLimiter, validateBody(loginSchema), authControllers.login);

router.get('/verify-email/:token', authControllers.verifyEmail);

router.post('/forgot-password', passwordResetLimiter, validateBody(passwordResetRequestSchema), authControllers.requestPasswordReset);

router.put('/reset-password/:token', passwordResetLimiter, validateBody(passwordResetConfirmSchema), authControllers.resetPassword);

router.post('/refresh', validateBody(refreshTokenSchema), authControllers.refreshToken);

// Protected routes
router.post('/logout', authenticate, authControllers.logout);

router.get('/me', authenticate, authControllers.getProfile);

router.patch('/me', authenticate, validateBody(updateProfileSchema), authControllers.updateProfile);

router.post('/change-password', authenticate, validateBody(changePasswordSchema), authControllers.changePassword);

// 2FA routes
router.post('/2fa/enable', authenticate, validateBody(enable2FASchema), authControllers.enable2FA);

router.post('/2fa/verify', authenticate, twoFactorLimiter, validateBody(verify2FASchema), authControllers.verify2FA);

router.post('/2fa/disable', authenticate, validateBody(disable2FASchema), authControllers.disable2FA);

// Session management routes
router.get('/sessions', authenticate, authControllers.getSessions);

router.delete('/sessions/:sessionId', authenticate, authControllers.revokeSession);

router.delete('/sessions', authenticate, authControllers.revokeAllSessions);

// Additional utility endpoints
router.get('/token-info', authenticate, authControllers.getTokenInfo);

router.get('/users/stats', authenticate, requireRole('admin'), authControllers.getUserStats);

// Test Resend endpoint
router.post('/test-resend', authControllers.testResend);

// Test email endpoint (for debugging)
router.post('/test-email', authControllers.testEmail);

// Admin routes for handyman approval management
router.get('/admin/pending-handymen', authenticate, requireRole('admin'), authControllers.getPendingHandymen);

router.post('/admin/approve-handyman/:userId', authenticate, requireRole('admin'), authControllers.approveHandyman);

router.post('/admin/reject-handyman/:userId', authenticate, requireRole('admin'), authControllers.rejectHandyman);

export default router;
