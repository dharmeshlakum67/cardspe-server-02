// SYSTEM PERMISSION KEYS CONSTANTS

export const PERMISSION_KEYS = {
	DASHBOARD: 'dashboard',
	USER_MANAGEMENT: 'user_management',
	USERS: 'users',
	USER: 'user',
	ROLE: 'role',
	ROLES: 'roles',
	KYC_REQUEST: 'kyc_request',
	BLOCK_HISTORY: 'block_history',
	MANAGE_COMMISSION: 'manage_commission',
	LOGIN_HISTORY: 'login_history',
	MASTER: 'master',
	DOCUMENT_TYPE: 'document_type',
	STATE: 'state',
	SERVICE_MANAGEMENT: 'service_management',
	SERVICE_CATEGORY: 'service_category',
	MOBILE_PLAN_TYPE: 'mobile_plan_type',
	PAYMENT_MODE: 'payment_mode',
	OPERATOR: 'operator',
	PAYMENTS: 'payments',
	BANK_DETAILS: 'bank_details',
	WALLET_TRANSACTION: 'wallet_transaction',
	SERVICE_TRANSACTION: 'service_transaction',
	SETTING: 'setting',
	BASIC_SETTING: 'basic_setting',
	SERVICE_CONFIGURATION: 'service_configuration',
	PAYMENT_GATEWAY: 'payment_gateway',
	MANAGE_BBPS_SERVICE: 'manage_bbps_service',
	MANAGE_SERVICE: 'manage_service',
	DEVELOPER: 'developer',
	API_REQUEST: 'api_request',
	API_DOCUMENTATION: 'api_documentation',
} as const;

export type TPermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

export default PERMISSION_KEYS;
