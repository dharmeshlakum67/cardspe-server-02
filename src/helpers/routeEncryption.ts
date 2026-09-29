/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-bitwise */
import { ENV } from '../config/env.config';

// GET SECRET ENCRYPTION KEY FROM ENVIRONMENT
const getSecretKey = (): string => {
	return (
		process.env.REACT_APP_ENCRYPTION_KEY ||
		ENV.ENCRYPTION_KEY ||
		'MtLcvI4rsbz2YF0Yf3U1faAh'
	);
};

// COMPUTE CRYPTOGRAPHIC INTEGRITY CHECKSUM / MAC
const computeMac = (data: string, secret: string): number => {
	let h1 = 0xdeadbeef;
	let h2 = 0x41c6ce57;

	for (let i = 0; i < data.length; i += 1) {
		const charCode = data.charCodeAt(i);
		const keyByte = secret.charCodeAt(i % secret.length);
		h1 = Math.imul(h1 ^ charCode, 2654435761) ^ keyByte;
		h2 = Math.imul(h2 ^ keyByte, 1597334677) ^ charCode;
	}

	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return Math.abs(4294967296 * (2097151 & h2) + (h1 >>> 0)) % 1000000;
};

// DERIVE CIPHER STREAM BYTES FROM SECRET KEY
const deriveKeyStream = (key: string, length: number): number[] => {
	const stream: number[] = [];
	let state = 0;
	for (let i = 0; i < key.length; i += 1) {
		state = (state + key.charCodeAt(i) * (i + 1)) & 0xff;
	}

	for (let i = 0; i < length; i += 1) {
		state = (state * 31 + key.charCodeAt(i % key.length) + (i % 7)) & 0xff;
		stream.push(state);
	}
	return stream;
};

// ENCRYPT ID FOR ROUTE NAVIGATION (URL-SAFE CIPHER TOKEN)
export const encryptId = (id: number | string): string => {
	if (id === null || id === undefined || id === '') return '';

	const rawIdStr = String(id).trim();
	const secret = getSecretKey();
	const mac = computeMac(rawIdStr, secret);
	const payload = `${mac}_${rawIdStr}`;

	try {
		const keyStream = deriveKeyStream(secret, payload.length);
		let cipherBytes = '';

		for (let i = 0; i < payload.length; i += 1) {
			const byteVal = payload.charCodeAt(i) ^ keyStream[i];
			cipherBytes += String.fromCharCode(byteVal);
		}

		// URL-SAFE BASE64 ENCODING (REPLACE + / AND STRIP =)
		const urlSafeToken = btoa(encodeURIComponent(cipherBytes))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');

		return `sm_${urlSafeToken}`;
	} catch {
		return String(id);
	}
};

// DECRYPT ROUTE CIPHER TOKEN BACK TO ORIGINAL ID
export const decryptId = (cipherText?: string): string => {
	if (!cipherText || typeof cipherText !== 'string') return '';

	const cleanToken = cipherText.trim();
	if (!cleanToken) return '';

	// IF ALREADY NUMERIC (LEGACY FALLBACK)
	if (/^\d+$/.test(cleanToken)) {
		return cleanToken;
	}

	const secret = getSecretKey();
	let base64 = cleanToken.replace(/^(sm_|stch_)/, '');

	try {
		// RE-ADD BASE64 PADDING IF NEEDED
		base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
		while (base64.length % 4 !== 0) {
			base64 += '=';
		}

		const decodedCipher = decodeURIComponent(atob(base64));
		const keyStream = deriveKeyStream(secret, decodedCipher.length);

		let decryptedPayload = '';
		for (let i = 0; i < decodedCipher.length; i += 1) {
			const byteVal = decodedCipher.charCodeAt(i) ^ keyStream[i];
			decryptedPayload += String.fromCharCode(byteVal);
		}

		// VALIDATE INTEGRITY VIA MAC CHECKSUM
		const delimiterIdx = decryptedPayload.indexOf('_');
		if (delimiterIdx !== -1) {
			const tokenMac = Number(decryptedPayload.slice(0, delimiterIdx));
			const extractedId = decryptedPayload.slice(delimiterIdx + 1);
			const expectedMac = computeMac(extractedId, secret);

			if (tokenMac === expectedMac && extractedId.length > 0) {
				return extractedId;
			}
		}

		return '';
	} catch {
		return '';
	}
};

export default {
	encryptId,
	decryptId,
};

