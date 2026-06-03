export const PENDING_VERIFICATION_EMAIL_KEY = 'pendingVerificationEmail';

export function setPendingVerificationEmail(email: string) {
	sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
}

export function getPendingVerificationEmail(): string | null {
	return sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
}

export function clearPendingVerificationEmail() {
	sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
}

/** Strip non-digits and cap at 6 characters. */
export function normalizeOtpCode(raw: string): string {
	return raw.replace(/\D/g, '').slice(0, 6);
}

export function isValidOtpCode(code: string): boolean {
	return /^\d{6}$/.test(code);
}

export function isEmailNotConfirmedError(message: string): boolean {
	const lower = message.toLowerCase();
	return lower.includes('email not confirmed') || lower.includes('not confirmed');
}
