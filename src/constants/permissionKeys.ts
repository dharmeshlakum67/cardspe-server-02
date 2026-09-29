// SYSTEM PERMISSION KEYS CONSTANTS

export const PERMISSION_KEYS = {
	DASHBOARD: 'dashboard',
} as const;

export type TPermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

export default PERMISSION_KEYS;

