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
	SEND_VERIFICATION_EMAIL: {
		url: '/api/auth/send-verification-email',
		method: HTTP_METHODS.POST,
		requiresAuth: true,
	},
	GET_TOKEN_DETAILS: (token: string) => ({
		url: `/api/auth/get-token/${token}`,
		method: HTTP_METHODS.GET,
		requiresAuth: false,
	}),
	VERIFY_EMAIL_TOKEN: (token: string) => ({
		url: `/api/auth/verify-email/${token}`,
		method: HTTP_METHODS.GET,
		requiresAuth: false,
	}),
	EDIT_PROFILE: {
		url: '/api/auth/edit-profile',
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	},
	UPDATE_PROFILE_IMAGE: {
		url: '/api/auth/update-profile-image',
		method: HTTP_METHODS.PATCH,
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
	GET_ALL: {
		url: '/api/role/get-all',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ONE: (id: string | number) => ({
		url: `/api/role/get-one/${id}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
	CREATE: {
		url: '/api/role/create',
		method: HTTP_METHODS.POST,
		requiresAuth: true,
	},
	UPDATE: (id: string | number) => ({
		url: `/api/role/update/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	UPDATE_STATUS: (id: string | number) => ({
		url: `/api/role/update-status/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	DELETE: (id: string | number) => ({
		url: `/api/role/delete/${id}`,
		method: HTTP_METHODS.DELETE,
		requiresAuth: true,
	}),
	GET_ACTIVE: {
		url: '/api/role/get-active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
} as const;

// ROLE ACCESS ENDPOINTS
export const ROLE_ACCESS_ENDPOINTS = {
	GET_ONE: (id: string | number) => ({
		url: `/api/role-access/get-one/${id}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
	UPDATE: (id: string | number) => ({
		url: `/api/role-access/${id}`,
		method: HTTP_METHODS.PUT,
		requiresAuth: true,
	}),
} as const;

// PERMISSION ENDPOINTS
export const PERMISSION_ENDPOINTS = {
	GET_ALL: {
		url: '/api/permission',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
} as const;

// DOCUMENT TYPE ENDPOINTS
export const DOCUMENT_TYPE_ENDPOINTS = {
	GET_ALL: {
		url: '/api/document-type',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ACTIVE: {
		url: '/api/document-type/get-active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ONE: (id: string | number) => ({
		url: `/api/document-type/get-one/${id}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
	CREATE: {
		url: '/api/document-type/create',
		method: HTTP_METHODS.POST,
		requiresAuth: true,
	},
	UPDATE: (id: string | number) => ({
		url: `/api/document-type/update/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	UPDATE_STATUS: (id: string | number) => ({
		url: `/api/document-type/update-status/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	DELETE: (id: string | number) => ({
		url: `/api/document-type/delete/${id}`,
		method: HTTP_METHODS.DELETE,
		requiresAuth: true,
	}),
} as const;

// CONSTANT ENDPOINTS
export const CONSTANT_ENDPOINTS = {
	GET_BY_TYPE: (type: string) => ({
		url: `/api/constant/${type}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
} as const;

// STATE ENDPOINTS
export const STATE_ENDPOINTS = {
	GET_ALL: {
		url: '/api/state/get-all',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ACTIVE: {
		url: '/api/state/active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ALL_ACTIVE: {
		url: '/api/state/get-active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ONE: (id: string | number) => ({
		url: `/api/state/get-one/${id}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
	CREATE: {
		url: '/api/state/create',
		method: HTTP_METHODS.POST,
		requiresAuth: true,
	},
	UPDATE: (id: string | number) => ({
		url: `/api/state/update/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	UPDATE_STATUS: (id: string | number) => ({
		url: `/api/state/update-status/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	DELETE: (id: string | number) => ({
		url: `/api/state/delete/${id}`,
		method: HTTP_METHODS.DELETE,
		requiresAuth: true,
	}),
} as const;

// SERVICE CATEGORY ENDPOINTS
export const SERVICE_CATEGORY_ENDPOINTS = {
	GET_ALL: {
		url: '/api/service-category/get-all',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ACTIVE: {
		url: '/api/service-category/active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ALL_ACTIVE: {
		url: '/api/service-category/get-active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ONE: (id: string | number) => ({
		url: `/api/service-category/get-one/${id}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
	CREATE: {
		url: '/api/service-category/create',
		method: HTTP_METHODS.POST,
		requiresAuth: true,
	},
	UPDATE: (id: string | number) => ({
		url: `/api/service-category/update/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	UPDATE_STATUS: (id: string | number) => ({
		url: `/api/service-category/update-status/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	DELETE: (id: string | number) => ({
		url: `/api/service-category/delete/${id}`,
		method: HTTP_METHODS.DELETE,
		requiresAuth: true,
	}),
} as const;

// MOBILE PLAN TYPE ENDPOINTS
export const MOBILE_PLAN_TYPE_ENDPOINTS = {
	GET_ALL: {
		url: '/api/mobile-plan-type/get-all',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ACTIVE: {
		url: '/api/mobile-plan-type/active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ALL_ACTIVE: {
		url: '/api/mobile-plan-type/get-active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ONE: (id: string | number) => ({
		url: `/api/mobile-plan-type/get-one/${id}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
	CREATE: {
		url: '/api/mobile-plan-type/create',
		method: HTTP_METHODS.POST,
		requiresAuth: true,
	},
	UPDATE: (id: string | number) => ({
		url: `/api/mobile-plan-type/update/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	UPDATE_STATUS: (id: string | number) => ({
		url: `/api/mobile-plan-type/update-status/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	DELETE: (id: string | number) => ({
		url: `/api/mobile-plan-type/delete/${id}`,
		method: HTTP_METHODS.DELETE,
		requiresAuth: true,
	}),
} as const;

// PAYMENT MODE ENDPOINTS
export const PAYMENT_MODE_ENDPOINTS = {
	GET_ALL: {
		url: '/api/payment-mode/get-all',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ACTIVE: {
		url: '/api/payment-mode/active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ALL_ACTIVE: {
		url: '/api/payment-mode/get-active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ONE: (id: string | number) => ({
		url: `/api/payment-mode/get-one/${id}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
	CREATE: {
		url: '/api/payment-mode/create',
		method: HTTP_METHODS.POST,
		requiresAuth: true,
	},
	UPDATE: (id: string | number) => ({
		url: `/api/payment-mode/update/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	UPDATE_STATUS: (id: string | number) => ({
		url: `/api/payment-mode/update-status/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	DELETE: (id: string | number) => ({
		url: `/api/payment-mode/delete/${id}`,
		method: HTTP_METHODS.DELETE,
		requiresAuth: true,
	}),
} as const;

// KYC ENDPOINTS
export const KYC_ENDPOINTS = {
	GET_DATA: {
		url: '/api/kyc/get-data',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	SUBMIT_DOCUMENT: {
		url: '/api/kyc/submit-document',
		method: HTTP_METHODS.POST,
		requiresAuth: true,
	},
	GET_ALL_REQUESTS: {
		url: '/api/kyc/request/get-all',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ONE_REQUEST: (id: string | number) => ({
		url: `/api/kyc/request/get-one/${id}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
	UPDATE_REQUEST_STATUS: (id: string | number) => ({
		url: `/api/kyc/request/update-status/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	GET_USER_KYC: (userId: string | number) => ({
		url: `/api/kyc/get-data/${userId}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
} as const;

// SETTING ENDPOINTS
export const SETTING_ENDPOINTS = {
	GET_SERVICE_CONFIG: {
		url: '/api/setting/get-service-config',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	UPDATE_SERVICE_CONFIG: {
		url: '/api/setting/update-service-config',
		method: HTTP_METHODS.POST,
		requiresAuth: true,
	},
} as const;

// ADMIN / USER ENDPOINTS
export const ADMIN_ENDPOINTS = {
	GET_ALL: {
		url: '/api/admin/get-all',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_ONE: (id: string | number) => ({
		url: `/api/admin/get-one/${id}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
	CREATE: {
		url: '/api/admin/create',
		method: HTTP_METHODS.POST,
		requiresAuth: true,
	},
	UPDATE: (id: string | number) => ({
		url: `/api/admin/update/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	UPDATE_STATUS: (id: string | number) => ({
		url: `/api/admin/update-status/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	BLOCK_STATUS: (id: string | number) => ({
		url: `/api/admin/block-status/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	BLOCK_UNBLOCK: (id: string | number) => ({
		url: `/api/admin/block-unblock/${id}`,
		method: HTTP_METHODS.PATCH,
		requiresAuth: true,
	}),
	DELETE: (id: string | number) => ({
		url: `/api/admin/delete/${id}`,
		method: HTTP_METHODS.DELETE,
		requiresAuth: true,
	}),
	GET_ACTIVE: {
		url: '/api/admin/get-active',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_LOGIN_HISTORY: (userId: string | number) => ({
		url: `/api/admin/login-history/${userId}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
} as const;

export const USER_ENDPOINTS = ADMIN_ENDPOINTS;

// BLOCK HISTORY ENDPOINTS
export const BLOCK_HISTORY_ENDPOINTS = {
	GET_ALL: {
		url: '/api/admin/block-history',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_BY_USER: (userId: string | number) => ({
		url: `/api/admin/block-history/${userId}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
} as const;

// LOGIN HISTORY ENDPOINTS
export const LOGIN_HISTORY_ENDPOINTS = {
	GET_ALL: {
		url: '/api/auth/login-history',
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	},
	GET_BY_USER: (userId: string | number) => ({
		url: `/api/admin/login-history/${userId}`,
		method: HTTP_METHODS.GET,
		requiresAuth: true,
	}),
} as const;

// COMBINED API ENDPOINTS
export const API_ENDPOINTS = {
	AUTH: AUTH_ENDPOINTS,
	ADMIN: ADMIN_ENDPOINTS,
	USER: USER_ENDPOINTS,
	ROLE: ROLE_ENDPOINTS,
	ROLE_ACCESS: ROLE_ACCESS_ENDPOINTS,
	PERMISSIONS: PERMISSION_ENDPOINTS,
	DOCUMENT_TYPE: DOCUMENT_TYPE_ENDPOINTS,
	STATE: STATE_ENDPOINTS,
	SERVICE_CATEGORY: SERVICE_CATEGORY_ENDPOINTS,
	MOBILE_PLAN_TYPE: MOBILE_PLAN_TYPE_ENDPOINTS,
	PAYMENT_MODE: PAYMENT_MODE_ENDPOINTS,
	KYC: KYC_ENDPOINTS,
	BLOCK_HISTORY: BLOCK_HISTORY_ENDPOINTS,
	LOGIN_HISTORY: LOGIN_HISTORY_ENDPOINTS,
	SETTING: SETTING_ENDPOINTS,
	CONSTANT: CONSTANT_ENDPOINTS,
} as const;

export default API_ENDPOINTS;


