/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-bitwise, no-await-in-loop, no-continue */
import { ENV } from '../config/env.config';

// GET SECRET CRYPTO ENCRYPTION KEY FROM ENVIRONMENT
export const getCryptoKey = (): string => {
	return (
		process.env.REACT_APP_CRYPTO_ENCRYPTION_KEY ||
		process.env.REACT_APP_ENCRYPTION_KEY ||
		ENV.CRYPTO_ENCRYPTION_KEY ||
		'LOygQaVibJdeIXTtMve3C1iJieD9'
	);
};

// HELPER: CONVERT HEX STRING TO UINT8ARRAY
export const hexToUint8Array = (hex: string): Uint8Array => {
	const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) {
		bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
	}
	return bytes;
};

// HELPER: CONVERT UINT8ARRAY TO HEX STRING
export const uint8ArrayToHex = (bytes: Uint8Array): string => {
	let hex = '';
	for (let i = 0; i < bytes.length; i += 1) {
		hex += bytes[i].toString(16).padStart(2, '0');
	}
	return hex;
};

// CHECK IF STRING IS IN THE BACKEND ENCRYPTED FORMAT (${ivHex}:${encryptedHex})
export const isEncryptedFormat = (text?: string | null): boolean => {
	if (!text || typeof text !== 'string') return false;
	const parts = text.trim().split(':');
	return parts.length === 2 && parts[0].length === 32 && /^[0-9a-fA-F]+$/.test(parts[1]);
};

// DERIVE AES-CBC CRYPTO KEY VIA SHA-256 HASH OF SECRET
const getSubtleCryptoKey = async (secret: string): Promise<CryptoKey> => {
	const encoder = new TextEncoder();
	const keyBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(secret));
	return window.crypto.subtle.importKey(
		'raw',
		keyBuffer,
		{ name: 'AES-CBC' },
		false,
		['decrypt', 'encrypt'],
	);
};

// GET CANDIDATE SECRET KEYS FOR DECRYPTION WITH FALLBACKS
const getCandidateKeys = (customKey?: string): string[] => {
	const candidates: string[] = [];
	if (customKey) candidates.push(customKey);
	if (process.env.REACT_APP_CRYPTO_ENCRYPTION_KEY) candidates.push(process.env.REACT_APP_CRYPTO_ENCRYPTION_KEY);
	if (process.env.REACT_APP_ENCRYPTION_KEY) candidates.push(process.env.REACT_APP_ENCRYPTION_KEY);
	if (ENV.CRYPTO_ENCRYPTION_KEY) candidates.push(ENV.CRYPTO_ENCRYPTION_KEY);
	candidates.push('LOygQaVibJdeIXTtMve3C1iJieD9');
	candidates.push('default_secret_key_change_in_production');
	return Array.from(new Set(candidates.filter(Boolean)));
};

// DECRYPT ENCRYPTED DATA STRING (MATCHES BACKEND AES-256-CBC WITH SHA-256 HASHED SECRET)
export const decryptAccountInfo = async (
	cipherText?: string | null,
	customKey?: string,
): Promise<string> => {
	if (!cipherText || typeof cipherText !== 'string') return '';

	const cleanCipher = cipherText.trim();
	if (!cleanCipher) return '';

	// IF NOT IN ENCRYPTED FORMAT (${iv}:${data}), RETURN AS-IS (PLAINTEXT FALLBACK)
	if (!isEncryptedFormat(cleanCipher)) {
		return cleanCipher;
	}

	try {
		if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
			return cleanCipher;
		}

		const [ivHex, encryptedDataHex] = cleanCipher.split(':');
		const ivBytes = hexToUint8Array(ivHex);
		const encryptedBytes = hexToUint8Array(encryptedDataHex);

		const keys = getCandidateKeys(customKey);
		for (const secret of keys) {
			try {
				const cryptoKey = await getSubtleCryptoKey(secret);
				const decryptedBuffer = await window.crypto.subtle.decrypt(
					{ name: 'AES-CBC', iv: ivBytes.buffer as ArrayBuffer },
					cryptoKey,
					encryptedBytes.buffer as ArrayBuffer,
				);

				const decoder = new TextDecoder();
				const result = decoder.decode(decryptedBuffer);
				if (result) {
					return result;
				}
			} catch {
				// Try next candidate key
				continue;
			}
		}

		return cleanCipher;
	} catch (error) {
		// If decryption fails, return original text safely
		return cleanCipher;
	}
};

// DECRYPT GENERIC DATA OR RESPONSE OBJECTS (AUTOMATICALLY PARSES JSON IF APPLICABLE)
export const decryptData = async <T = any>(
	payload?: any,
	customKey?: string,
): Promise<T> => {
	if (!payload) return payload;

	// 1. If payload itself is an encrypted string
	if (typeof payload === 'string') {
		const clean = payload.trim();
		if (isEncryptedFormat(clean)) {
			const decryptedStr = await decryptAccountInfo(clean, customKey);
			try {
				return JSON.parse(decryptedStr);
			} catch {
				return decryptedStr as unknown as T;
			}
		}
		return payload as unknown as T;
	}

	// 2. If payload is an API response object where data property is encrypted
	if (
		typeof payload === 'object' &&
		payload !== null &&
		typeof payload.data === 'string' &&
		isEncryptedFormat(payload.data)
	) {
		const decryptedStr = await decryptAccountInfo(payload.data, customKey);
		try {
			const parsed = JSON.parse(decryptedStr);
			return {
				...payload,
				data: parsed,
			};
		} catch {
			return {
				...payload,
				data: decryptedStr,
			};
		}
	}

	return payload;
};

// ENCRYPT PLAIN DATA STRING (AES-256-CBC MATCHING BACKEND FORMAT)
export const encryptAccountInfo = async (
	plainText: string,
	customKey?: string,
): Promise<string> => {
	if (!plainText || typeof plainText !== 'string') return '';

	try {
		if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
			return plainText;
		}

		const secret = customKey || getCryptoKey();
		const iv = window.crypto.getRandomValues(new Uint8Array(16));
		const cryptoKey = await getSubtleCryptoKey(secret);
		const encoder = new TextEncoder();

		const encryptedBuffer = await window.crypto.subtle.encrypt(
			{ name: 'AES-CBC', iv: iv.buffer as ArrayBuffer },
			cryptoKey,
			encoder.encode(plainText),
		);

		const ivHex = uint8ArrayToHex(iv);
		const encryptedHex = uint8ArrayToHex(new Uint8Array(encryptedBuffer));

		return `${ivHex}:${encryptedHex}`;
	} catch (error) {
		return plainText;
	}
};

export default {
	getCryptoKey,
	isEncryptedFormat,
	decryptAccountInfo,
	decryptData,
	encryptAccountInfo,
};
