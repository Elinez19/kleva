import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const generate2FASecret = (email: string): { secret: string; otpauth_url: string } => {
	const secret = speakeasy.generateSecret({
		name: `Handyman App (${email})`,
		issuer: 'Handyman App',
		length: 32
	});

	return {
		secret: secret.base32,
		otpauth_url: secret.otpauth_url || ''
	};
};

export const generateQRCode = async (otpauth_url: string): Promise<string> => {
	try {
		const qrCodeDataUrl = await qrcode.toDataURL(otpauth_url);
		return qrCodeDataUrl;
	} catch (error) {
		console.error('Error generating QR code:', error);
		throw new Error('Failed to generate QR code');
	}
};

export const verify2FAToken = (secret: string, token: string): boolean => {
	return speakeasy.totp.verify({
		secret,
		encoding: 'base32',
		token,
		window: 2 // Allow 2 time steps before and after for clock drift
	});
};

export const generateBackupCodes = (count: number = 10): string[] => {
	const codes: string[] = [];
	for (let i = 0; i < count; i++) {
		const code = crypto.randomBytes(4).toString('hex').toUpperCase();
		codes.push(code);
	}
	return codes;
};

export const hashBackupCode = async (code: string): Promise<string> => {
	const salt = await bcrypt.genSalt(10);
	return await bcrypt.hash(code.toLowerCase(), salt);
};

export const verifyBackupCode = async (code: string, hashedCodes: string[]): Promise<boolean> => {
	for (const hashedCode of hashedCodes) {
		const isMatch = await bcrypt.compare(code.toLowerCase(), hashedCode);
		if (isMatch) {
			return true;
		}
	}
	return false;
};
