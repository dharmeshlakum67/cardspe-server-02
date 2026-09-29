// HTTP METHODS CONSTANTS
export const HTTP_METHODS = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	PATCH: 'PATCH',
	DELETE: 'DELETE',
} as const;

export type THttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

// AUTH ENDPOINTS
export const AUTH_ENDPOINTS = {
	LOGIN: {
		url: '/api/auth/login',
		method: HTTP_METHODS.POST,
		requiresAuth: false,
	},
	REGISTER: {
		url: '/api/auth/register',
		method: HTTP_METHODS.POST,
		requiresAuth: false,
	},
	VERIFY_OTP: {
		url: '/api/auth/verify-otp',
		method: HTTP_METHODS.POST,
		requiresAuth: false,
	},
	RESEND_OTP: {
		url: '/api/auth/resend-otp',
		method: HTTP_METHODS.POST,
		requiresAuth: false,
	},
	FORGOT_PASSWORD: {
		url: '/api/auth/forgot-password',
		method: HTTP_METHODS.POST,
		requiresAuth: false,
	},
	RESET_PASSWORD: (token?: string) => ({
		url: token ? `/api/auth/reset-password/${token}` : '/api/v1/auth/reset-password',
		method: HTTP_METHODS.POST,
		requiresAuth: false,
	}),
	ME: {
		url: '/api/auth/me',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
} as const;

// ROLE ENDPOINTS
export const ROLE_ENDPOINTS = {
	GET_ACTIVE_SIGNUP_ROLES: {
		url: '/api/role/get-active-signup',
		method: HTTP_METHODS.GET,
		requiresAuth: false,
	},
} as const;

// PERMISSION ENDPOINTS
export const PERMISSION_ENDPOINTS = {
	GET_ALL: {
		url: '/api/permission',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
} as const;

// COMBINED API ENDPOINTS
export const API_ENDPOINTS = {
	AUTH: AUTH_ENDPOINTS,
	ROLE: ROLE_ENDPOINTS,
	PERMISSIONS: PERMISSION_ENDPOINTS,
} as const;

export default API_ENDPOINTS;

