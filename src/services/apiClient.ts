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
	const contentType = response.headers.get('content-type');
	if (contentType && contentType.includes('application/json')) {
		responseData = await response.json();
	} else {
		responseData = await response.text();
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
