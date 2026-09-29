import { TIcons } from '../type/icons-type';
import { PAGE_ROUTES } from '../constants/pageRoutes';

export interface IMenuRouteMetadata {
	path?: string | null;
	icon: TIcons;
	text?: string;
	subMenu?: Record<string, any> | null;
}

// CANONICAL ROUTE AND ICON CONFIGURATION FOR SYSTEM PERMISSIONS
export const MENU_ROUTE_CONFIG: Record<string, IMenuRouteMetadata> = {
	dashboard: {
		path: PAGE_ROUTES.DASHBOARD,
		icon: 'Dashboard',
		text: 'Dashboard',
		subMenu: null,
	},

	// USER MANAGEMENT PARENT (PATH NULL = EXPANDABLE GROUP)
	user_management: {
		path: null,
		icon: 'ManageAccounts',
		text: 'User Management',
		subMenu: null,
	},

	// ROLE MODULE (SUPPORT BOTH role / roles KEYS FROM API)
	role: {
		path: PAGE_ROUTES.ROLES,
		icon: 'AdminPanelSettings',
		text: 'Roles',
		subMenu: null,
	},
	roles: {
		path: PAGE_ROUTES.ROLES,
		icon: 'AdminPanelSettings',
		text: 'Roles',
		subMenu: null,
	},
};

// RESOLVE ROUTE METADATA FOR A GIVEN PERMISSION KEY OR NAME DYNAMICALLY
export const getMenuMetadataForPermission = (
	permissionKey: string,
	fallbackName: string,
): IMenuRouteMetadata | null => {
	const normalizeStr = (str: string) => (str || '').toLowerCase().trim().replace(/[-_\s]+/g, '_');

	const keyNorm = normalizeStr(permissionKey);
	const nameNorm = normalizeStr(fallbackName);

	const candidates = [
		keyNorm,
		nameNorm,
		keyNorm.endsWith('s') ? keyNorm.slice(0, -1) : `${keyNorm}s`,
		nameNorm.endsWith('s') ? nameNorm.slice(0, -1) : `${nameNorm}s`,
	];

	for (const candidate of candidates) {
		if (candidate && MENU_ROUTE_CONFIG[candidate]) {
			return {
				...MENU_ROUTE_CONFIG[candidate],
				// Prefer API permission name for dynamic sidebar label
				text: fallbackName || MENU_ROUTE_CONFIG[candidate].text,
			};
		}
	}

	return null;
};
