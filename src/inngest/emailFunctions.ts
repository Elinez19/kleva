import { inngest, Events } from '../config/inngest';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, send2FAEnabledEmail, sendAccountLockedEmail } from '../utils/emailUtils';

// ============================================================================
// EMAIL WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Send email verification after user registration
 */
export const sendVerificationEmailJob = inngest.createFunction(
	{
		id: 'send-verification-email',
		name: 'Send Email Verification',
		retries: 3
	},
	{ event: 'auth/email.verification.requested' },
	async ({ event }: { event: Events['auth/email.verification.requested'] }) => {
		const { email, token, firstName } = event.data;

		console.log('📧 Inngest: Processing email verification request', { email, hasToken: !!token, firstName });

		try {
			await sendVerificationEmail(email, token);

			console.log('✅ Inngest: Verification email sent successfully to', email);

			return {
				success: true,
				email,
				message: 'Verification email sent successfully'
			};
		} catch (error) {
			console.error('❌ Inngest: Failed to send verification email:', error);
			console.error('Inngest email details:', { email, hasToken: !!token, firstName });
			throw new Error(`Failed to send verification email to ${email}: ${error.message}`);
		}
	}
);

/**
 * Send welcome email after successful registration
 */
export const sendWelcomeEmailJob = inngest.createFunction(
	{
		id: 'send-welcome-email',
		name: 'Send Welcome Email',
		retries: 2
	},
	{ event: 'auth/user.registered' },
	async ({ event }: { event: Events['auth/user.registered'] }) => {
		const { email, firstName, role } = event.data;

		try {
			await sendWelcomeEmail(email, firstName);

			return {
				success: true,
				email,
				message: 'Welcome email sent successfully'
			};
		} catch (error) {
			console.error('Failed to send welcome email:', error);
			throw new Error(`Failed to send welcome email to ${email}: ${error.message}`);
		}
	}
);

/**
 * Send password reset email
 */
export const sendPasswordResetJob = inngest.createFunction(
	{
		id: 'send-password-reset',
		name: 'Send Password Reset Email',
		retries: 3
	},
	{ event: 'auth/password.reset.requested' },
	async ({ event }: { event: Events['auth/password.reset.requested'] }) => {
		const { email, token, firstName } = event.data;

		try {
			await sendPasswordResetEmail(email, token);

			return {
				success: true,
				email,
				message: 'Password reset email sent successfully'
			};
		} catch (error) {
			console.error('Failed to send password reset email:', error);
			throw new Error(`Failed to send password reset email to ${email}: ${error.message}`);
		}
	}
);

/**
 * Send 2FA enabled confirmation email
 */
export const send2FAEnabledJob = inngest.createFunction(
	{
		id: 'send-2fa-enabled',
		name: 'Send 2FA Enabled Email',
		retries: 2
	},
	{ event: 'auth/2fa.enabled' },
	async ({ event }: { event: Events['auth/2fa.enabled'] }) => {
		const { email, firstName } = event.data;

		try {
			await send2FAEnabledEmail(email, firstName);

			return {
				success: true,
				email,
				message: '2FA enabled email sent successfully'
			};
		} catch (error) {
			console.error('Failed to send 2FA enabled email:', error);
			throw new Error(`Failed to send 2FA enabled email to ${email}: ${error.message}`);
		}
	}
);

/**
 * Send account locked notification email
 */
export const sendAccountLockedJob = inngest.createFunction(
	{
		id: 'send-account-locked',
		name: 'Send Account Locked Email',
		retries: 2
	},
	{ event: 'auth/account.locked' },
	async ({ event }: { event: Events['auth/account.locked'] }) => {
		const { email, firstName, reason } = event.data;

		try {
			await sendAccountLockedEmail(email, firstName, reason);

			return {
				success: true,
				email,
				message: 'Account locked email sent successfully'
			};
		} catch (error) {
			console.error('Failed to send account locked email:', error);
			throw new Error(`Failed to send account locked email to ${email}: ${error.message}`);
		}
	}
);

export default inngest;
