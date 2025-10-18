import { Resend } from 'resend';
import { EMAIL, FRONTEND_URL } from '../config/config';

const resend = new Resend(EMAIL.RESEND_API_KEY);

// Use Resend's default domain if custom domain is not verified
const FROM_EMAIL = EMAIL.RESEND_API_KEY ? 'Handyman Management <onboarding@resend.dev>' : 'Handyman Management <noreply@anorateck.com>';

// Email validation function
const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const testDomains = ['test.com', 'example.com', 'localhost', 'test'];
	const domain = email.split('@')[1]?.toLowerCase();

	return emailRegex.test(email) && !testDomains.some((testDomain) => domain?.includes(testDomain));
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
	// Validate email address before sending
	if (!isValidEmail(email)) {
		console.error('❌ Invalid email address:', email);
		throw new Error(`Invalid email address: ${email}. Please use a valid email address.`);
	}

	const verificationUrl = `https://kleva-server.vercel.app/api/v1/auth/verify-email/${token}`;

	const htmlContent = `
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

	try {
		console.log('📧 Sending verification email to:', email);
		console.log('📧 Using FROM_EMAIL:', FROM_EMAIL);
		console.log('📧 Verification URL:', verificationUrl);

		if (!EMAIL.RESEND_API_KEY) {
			console.warn('⚠️ RESEND_API_KEY not configured, email will not be sent');
			console.log('📧 Would send verification email with token:', token);
			return; // Don't throw error in development
		}

		const result = await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: 'Verify Your Email Address',
			html: htmlContent
		});

		console.log('✅ Verification email sent successfully:', result);
		console.log('📧 Email ID:', result.data?.id);
		console.log('📧 Delivery status: Sent via Resend');
	} catch (error) {
		console.error('❌ Error sending verification email:', error);
		console.error('📧 Email details:', {
			to: email,
			from: FROM_EMAIL,
			hasApiKey: !!EMAIL.RESEND_API_KEY,
			errorMessage: error.message,
			errorCode: error.code
		});
		throw new Error(`Failed to send verification email: ${error.message}`);
	}
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
	// Validate email address before sending
	if (!isValidEmail(email)) {
		console.error('❌ Invalid email address:', email);
		throw new Error(`Invalid email address: ${email}. Please use a valid email address.`);
	}

	const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #000; color: #fff; padding: 20px; text-align: center; }
				.content { padding: 20px; background: #f9f9f9; }
				.button { display: inline-block; padding: 12px 30px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
				.footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
				.warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Password Reset Request</h1>
				</div>
				<div class="content">
					<p>We received a request to reset your password.</p>
					<p>Click the button below to reset your password:</p>
					<a href="${resetUrl}" class="button">Reset Password</a>
					<p>Or copy and paste this link in your browser:</p>
					<p>${resetUrl}</p>
					<div class="warning">
						<strong>Security Notice:</strong> This link will expire in 1 hour.
					</div>
					<p>If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
				</div>
				<div class="footer">
					<p>© ${new Date().getFullYear()} Handyman App. All rights reserved.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: 'Password Reset Request',
			html: htmlContent
		});
	} catch (error) {
		console.error('Error sending password reset email:', error);
		throw new Error('Failed to send password reset email');
	}
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
	// Validate email address before sending
	if (!isValidEmail(email)) {
		console.error('❌ Invalid email address:', email);
		throw new Error(`Invalid email address: ${email}. Please use a valid email address.`);
	}

	const htmlContent = `
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
					<p>Hello ${name},</p>
					<p>Welcome to Handyman Management! We're excited to have you join our platform.</p>
					<p>Here's what you can do next:</p>
					<ul>
						<li>Complete your profile setup</li>
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

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: 'Welcome to Handyman App!',
			html: htmlContent
		});
	} catch (error) {
		console.error('Error sending welcome email:', error);
		// Don't throw error for welcome email
	}
};

export const send2FAEnabledEmail = async (email: string, name: string): Promise<void> => {
	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #000; color: #fff; padding: 20px; text-align: center; }
				.content { padding: 20px; background: #f9f9f9; }
				.footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
				.success { background: #d4edda; padding: 10px; border-left: 4px solid #28a745; margin: 10px 0; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Two-Factor Authentication Enabled</h1>
				</div>
				<div class="content">
					<p>Hi ${name},</p>
					<div class="success">
						<strong>Security Update:</strong> Two-factor authentication has been successfully enabled on your account.
					</div>
					<p>Your account is now more secure with an additional layer of protection.</p>
					<p>You will need to enter a verification code from your authenticator app each time you log in.</p>
					<p>If you didn't enable this feature, please contact our support team immediately.</p>
				</div>
				<div class="footer">
					<p>© ${new Date().getFullYear()} Handyman App. All rights reserved.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: 'Two-Factor Authentication Enabled',
			html: htmlContent
		});
	} catch (error) {
		console.error('Error sending 2FA enabled email:', error);
		// Don't throw error for notification email
	}
};

export const sendPaymentConfirmationEmail = async (
	email: string,
	firstName: string,
	amount: string,
	jobTitle: string,
	reference: string
): Promise<void> => {
	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #000; color: #fff; padding: 20px; text-align: center; }
				.content { padding: 20px; background: #f9f9f9; }
				.highlight { background: #e8f5e8; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }
				.footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Payment Successful!</h1>
				</div>
				<div class="content">
					<p>Hello ${firstName},</p>
					<div class="highlight">
						<h3>Your payment of ${amount} has been processed successfully!</h3>
						<p><strong>Job:</strong> ${jobTitle}</p>
						<p><strong>Reference:</strong> ${reference}</p>
					</div>
					<p>Your job has been posted and handymen will be notified. You'll receive notifications when handymen apply for your job.</p>
					<p>Thank you for using Handyman App!</p>
				</div>
				<div class="footer">
					<p>If you have any questions, please contact our support team.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: 'Payment Successful - Handyman App',
			html: htmlContent
		});
	} catch (error) {
		console.error('Failed to send payment confirmation email:', error);
		throw error;
	}
};

export const sendAccountLockedEmail = async (email: string, name: string, reason: string): Promise<void> => {
	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #dc3545; color: #fff; padding: 20px; text-align: center; }
				.content { padding: 20px; background: #f9f9f9; }
				.warning { background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0; }
				.footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>🔒 Account Security Alert</h1>
				</div>
				<div class="content">
					<p>Hello ${name},</p>
					<div class="warning">
						<strong>Security Notice:</strong> Your account has been temporarily locked for security reasons.
					</div>
					<p><strong>Reason:</strong> ${reason}</p>
					<p>Your account will be automatically unlocked in 15 minutes. If you believe this is an error or if you continue to experience issues, please contact our support team.</p>
					<p>To help protect your account:</p>
					<ul>
						<li>Use a strong, unique password</li>
						<li>Enable two-factor authentication</li>
						<li>Never share your login credentials</li>
					</ul>
				</div>
				<div class="footer">
					<p>© 2024 Handyman Management. All rights reserved.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: 'Account Security Alert - Handyman Management',
			html: htmlContent
		});
	} catch (error) {
		console.error('Error sending account locked email:', error);
		// Don't throw error for notification email
	}
};

export const sendPaymentFailedEmail = async (
	email: string,
	firstName: string,
	amount: string,
	jobTitle: string,
	reference: string,
	reason: string
): Promise<void> => {
	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #dc3545; color: #fff; padding: 20px; text-align: center; }
				.content { padding: 20px; background: #f9f9f9; }
				.highlight { background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0; }
				.button { display: inline-block; padding: 12px 30px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
				.footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Payment Failed</h1>
				</div>
				<div class="content">
					<p>Hello ${firstName},</p>
					<div class="highlight">
						<h3>Your payment of ${amount} could not be processed</h3>
						<p><strong>Job:</strong> ${jobTitle}</p>
						<p><strong>Reference:</strong> ${reference}</p>
						<p><strong>Reason:</strong> ${reason}</p>
					</div>
					<p>Don't worry! You can try again with a different payment method.</p>
					<a href="${FRONTEND_URL}/payment/retry?ref=${reference}" class="button">Try Again</a>
					<p>If you continue to experience issues, please contact our support team.</p>
				</div>
				<div class="footer">
					<p>If you have any questions, please contact our support team.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: 'Payment Failed - Handyman App',
			html: htmlContent
		});
	} catch (error) {
		console.error('Failed to send payment failed email:', error);
		throw error;
	}
};

export const sendHandymanPayoutEmail = async (
	email: string,
	firstName: string,
	amount: string,
	jobTitle: string,
	transferId: string
): Promise<void> => {
	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #000; color: #fff; padding: 20px; text-align: center; }
				.content { padding: 20px; background: #f9f9f9; }
				.highlight { background: #e8f5e8; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }
				.footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Payment Processed!</h1>
				</div>
				<div class="content">
					<p>Hello ${firstName},</p>
					<div class="highlight">
						<h3>Your payment of ${amount} has been processed!</h3>
						<p><strong>Job:</strong> ${jobTitle}</p>
						<p><strong>Transfer ID:</strong> ${transferId}</p>
					</div>
					<p>The payment has been sent to your registered account and should reflect within 1-2 business days.</p>
					<p>Thank you for completing the job successfully!</p>
				</div>
				<div class="footer">
					<p>If you have any questions, please contact our support team.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	try {
		await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: 'Payment Processed - Handyman App',
			html: htmlContent
		});
	} catch (error) {
		console.error('Failed to send handyman payout email:', error);
		throw error;
	}
};

// Test email function for debugging email delivery issues
export const sendTestEmail = async (email: string): Promise<{ success: boolean; message: string; testToken?: string; verificationUrl?: string }> => {
	try {
		// Validate email address before sending
		if (!isValidEmail(email)) {
			console.error('❌ Invalid email address for test:', email);
			return {
				success: false,
				message: `Invalid email address: ${email}. Please use a valid email address (not test.com, example.com, etc.)`
			};
		}

		// Generate a test token
		const crypto = require('crypto');
		const testToken = crypto.randomBytes(32).toString('hex');
		const verificationUrl = `https://kleva-server.vercel.app/api/v1/auth/verify-email/${testToken}`;

		console.log('🧪 Testing email delivery to:', email);
		console.log('🧪 Test token generated:', testToken);

		// Send test verification email
		await sendVerificationEmail(email, testToken);

		return {
			success: true,
			message: 'Test email sent successfully',
			testToken,
			verificationUrl
		};
	} catch (error) {
		console.error('❌ Test email failed:', error);
		return {
			success: false,
			message: `Test email failed: ${error.message}`
		};
	}
};
