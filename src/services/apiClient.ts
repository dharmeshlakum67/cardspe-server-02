import { ENV } from '../config/env.config';
import { authPagesMenu } from '../menu';

export type TEndpointConfig = {
	url: string | ((...args: any[]) => string);
	method: string;
	requiresAuth?: boolean;
};

export type TEndpointInput = string | TEndpointConfig;
export interface IRequestOptions extends Omit<RequestInit, 'body'> {
	params?: Record<string, string | number | boolean | undefined>;
	body?: any;
	requiresAuth?: boolean;
}

export class ApiError extends Error {
	status: number;

	data: any;

	constructor(message: string, status: number, data?: any) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.data = data;
	}
}

function parseJsonSafely(text: string): any {
	if (typeof text !== 'string') return text;
	const trimmed = text.trim();
	if (!trimmed) return {};

	try {
		return JSON.parse(trimmed);
	} catch (err: any) {
		// 1. Try extracting up to syntax error position (e.g. "Unexpected non-whitespace character after JSON at position 571")
		const posMatch = err?.message?.match(/position\s+(\d+)/i);
		if (posMatch && posMatch[1]) {
			const pos = parseInt(posMatch[1], 10);
			if (!isNaN(pos) && pos > 0 && pos <= trimmed.length) {
				try {
					return JSON.parse(trimmed.slice(0, pos).trim());
				} catch {
					// Fall through to brace matching
				}
			}
		}

		// 2. Try to extract first complete JSON object { ... } or array [ ... ] using brace matching
		const firstBrace = trimmed.indexOf('{');
		const firstBracket = trimmed.indexOf('[');
		let startIdx = -1;
		let openChar = '{';
		let closeChar = '}';

		if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
			startIdx = firstBrace;
			openChar = '{';
			closeChar = '}';
		} else if (firstBracket !== -1) {
			startIdx = firstBracket;
			openChar = '[';
			closeChar = ']';
		}

		if (startIdx !== -1) {
			let depth = 0;
			let inString = false;
			let escape = false;
			for (let i = startIdx; i < trimmed.length; i++) {
				const char = trimmed[i];
				if (inString) {
					if (escape) {
						escape = false;
					} else if (char === '\\') {
						escape = true;
					} else if (char === '"') {
						inString = false;
					}
				} else if (char === '"') {
					inString = true;
				} else if (char === openChar) {
					depth++;
				} else if (char === closeChar) {
					depth--;
					if (depth === 0) {
						try {
							return JSON.parse(trimmed.slice(startIdx, i + 1));
						} catch {
							break;
						}
					}
				}
			}
		}

		return text;
	}
}

// API CLIENT
export async function apiClient<T = any>(endpoint: TEndpointInput, options: IRequestOptions = {},): Promise<T> {
	const { params, headers, body, requiresAuth, ...customConfig } = options;

	let rawUrl: string;
	let defaultMethod = 'GET';
	let endpointRequiresAuth = true;

	if (typeof endpoint === 'string') {
		rawUrl = endpoint;
	}
	else {
		rawUrl = typeof endpoint.url === 'function' ? endpoint.url() : endpoint.url;
		defaultMethod = endpoint.method;
		if (endpoint.requiresAuth !== undefined) {
			endpointRequiresAuth = endpoint.requiresAuth;
		}
	}

	let url = `${ENV.API_BASE_URL.replace(/\/$/, '')}/${rawUrl.replace(/^\//, '')}`;
	if (params) {
		const searchParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined) {
				searchParams.append(key, String(value));
			}
		});
		const queryString = searchParams.toString();
		if (queryString) {
			url += `?${queryString}`;
		}
	}

	// AUTH TOKEN CHECK
	const isAuthRequired = requiresAuth !== undefined ? requiresAuth : endpointRequiresAuth;
	const token = isAuthRequired
		? localStorage.getItem(ENV.TOKEN_KEY) || sessionStorage.getItem(ENV.TOKEN_KEY)
		: null;

	const defaultHeaders: Record<string, string> = {
		...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};

	let formattedBody = body;
	if (body && typeof body === 'object' && !(body instanceof FormData)) {
		formattedBody = JSON.stringify(body);
	}

	const config: RequestInit = {
		method: customConfig.method || defaultMethod,
		headers: {
			...defaultHeaders,
			...headers,
		},
		body: formattedBody,
		...customConfig,
	};

	const response = await fetch(url, config);

	let responseData: any;
	const rawText = await response.text();
	const contentType = response.headers.get('content-type');
	const isJson = (contentType && contentType.includes('application/json')) ||
		(rawText && (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')));

	if (isJson) {
		responseData = parseJsonSafely(rawText);
	} else {
		responseData = rawText;
	}

	if (!response.ok) {
		// HANDLE 401 UNAUTHORIZED
		if (response.status === 401) {
			localStorage.removeItem(ENV.TOKEN_KEY);
			localStorage.removeItem('cardspe_user');
			sessionStorage.removeItem(ENV.TOKEN_KEY);
			sessionStorage.removeItem('cardspe_user');

			if (
				typeof window !== 'undefined' &&
				!window.location.pathname.includes('/auth-pages/')
			) {
				window.location.href = `/${authPagesMenu.login.path}`;
			}
		}

		const errorMessage =
			responseData?.message ||
			responseData?.error ||
			responseData?.errors?.[0]?.msg ||
			`Request failed with status ${response.status}`;
		throw new ApiError(errorMessage, response.status, responseData);
	}

	return responseData as T;
}

export default apiClient;
