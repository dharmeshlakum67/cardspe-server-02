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
};

// RESOLVE ROUTE METADATA FOR A GIVEN PERMISSION KEY OR NAME DYNAMICALLY
export const getMenuMetadataForPermission = (
	permissionKey: string,
	fallbackName: string,
): IMenuRouteMetadata | null => {
	const normalizeStr = (str: string) => (str || '').toLowerCase().trim().replace(/[-_\s]+/g, '_');

	const keyNorm = normalizeStr(permissionKey);
	const nameNorm = normalizeStr(fallbackName);

	const candidates = [keyNorm, nameNorm];

	for (const candidate of candidates) {
		if (candidate && MENU_ROUTE_CONFIG[candidate]) {
			return {
				...MENU_ROUTE_CONFIG[candidate],
				text: MENU_ROUTE_CONFIG[candidate].text || fallbackName,
			};
		}
	}

	return null;
};

