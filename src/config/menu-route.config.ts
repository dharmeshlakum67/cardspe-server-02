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

	// USERS MODULE (CHILD OF USER MANAGEMENT)
	user: {
		path: PAGE_ROUTES.USERS,
		icon: 'Group',
		text: 'Users',
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

	// KYC REQUESTS MODULE (CHILD OF USER MANAGEMENT)
	kyc_request: {
		path: PAGE_ROUTES.KYC_REQUESTS,
		icon: 'VerifiedUser',
		text: 'KYC Requests',
		subMenu: null,
	},

	// BLOCK HISTORY MODULE (CHILD OF USER MANAGEMENT)
	block_history: {
		path: PAGE_ROUTES.BLOCK_HISTORY,
		icon: 'AppBlocking',
		text: 'Block History',
		subMenu: null,
	},

	// MASTER PARENT
	master: {
		path: null,
		icon: 'Layers',
		text: 'Master',
		subMenu: null,
	},

	// DOCUMENT TYPE CHILD MODULE
	document_type: {
		path: PAGE_ROUTES.DOCUMENT_TYPE,
		icon: 'Description',
		text: 'Document Type',
		subMenu: null,
	},

	// STATE CHILD MODULE
	state: {
		path: PAGE_ROUTES.STATE,
		icon: 'AddLocation',
		text: 'State',
		subMenu: null,
	},
	states: {
		path: PAGE_ROUTES.STATE,
		icon: 'AddLocation',
		text: 'State',
		subMenu: null,
	},

	// SERVICE MANAGEMENT PARENT (EXPANDABLE GROUP)
	service_management: {
		path: null,
		icon: 'Build',
		text: 'Service Management',
		subMenu: null,
	},

	// SERVICE CATEGORY CHILD MODULE
	service_category: {
		path: PAGE_ROUTES.SERVICE_CATEGORY,
		icon: 'Category',
		text: 'Service Category',
		subMenu: null,
	},

	// MOBILE PLAN TYPE CHILD MODULE
	mobile_plan_type: {
		path: PAGE_ROUTES.MOBILE_PLAN_TYPE,
		icon: 'PhoneAndroid',
		text: 'Mobile Plan Type',
		subMenu: null,
	},

	// PAYMENT MODE CHILD MODULE
	payment_mode: {
		path: PAGE_ROUTES.PAYMENT_MODE,
		icon: 'Payments',
		text: 'Payment Mode',
		subMenu: null,
	},

	// LOGIN HISTORY (TOP-LEVEL PARENT MENU)
	login_history: {
		path: PAGE_ROUTES.LOGIN_HISTORY,
		icon: 'History',
		text: 'Login History',
		subMenu: null,
	},

	// SETTINGS MODULE (PARENT)
	setting: {
		path: PAGE_ROUTES.SETTING,
		icon: 'Settings',
		text: 'Settings',
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
