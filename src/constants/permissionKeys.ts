// SYSTEM PERMISSION KEYS CONSTANTS

export const PERMISSION_KEYS = {
	DASHBOARD: 'dashboard',
	USER_MANAGEMENT: 'user_management',
	USERS: 'users',
	ROLE: 'role',
	ROLES: 'roles',
	LOGIN_HISTORY: 'login_history',
	MASTER: 'master',
	DOCUMENT_TYPE: 'document_type',
	STATE: 'state',
	SERVICE_MANAGEMENT: 'service_management',
	SERVICE_CATEGORY: 'service_category',
	MOBILE_PLAN_TYPE: 'mobile_plan_type',
	PAYMENT_MODE: 'payment_mode',
	SETTING: 'setting',
} as const;

export type TPermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

export default PERMISSION_KEYS;
