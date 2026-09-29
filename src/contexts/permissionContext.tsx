import React, {
	createContext,
	FC,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import PropTypes from 'prop-types';
import AuthContext from './authContext';
import permissionService from '../services/permissionService';
import {
	IPermissionActionState,
	IPermissionItem,
	IPermissionsMap,
	IUserAccessItem,
} from '../type/permission-type';
import { getMenuMetadataForPermission } from '../config/menu-route.config';
import { dashboardPagesMenu } from '../menu';
import { ENV } from '../config/env.config';
import authService from '../pages/presentation/auth/services/authService';

export interface IPermissionContextProps {
	permissions: IPermissionItem[];
	userAccess: IUserAccessItem[];
	permissionsMap: IPermissionsMap;
	dynamicMenu: Record<string, any>;
	isLoadingPermissions: boolean;
	hasPermission: (permissionKeyOrName: string, action?: string) => boolean;
	canRead: (permissionKeyOrName: string) => boolean;
	canCreate: (permissionKeyOrName: string) => boolean;
	canUpdate: (permissionKeyOrName: string) => boolean;
	canDelete: (permissionKeyOrName: string) => boolean;
	canResetPassword: (permissionKeyOrName: string) => boolean;
	refetchPermissions: () => Promise<void>;
}

export const PermissionContext = createContext<IPermissionContextProps>(
	{} as IPermissionContextProps,
);

interface IPermissionContextProviderProps {
	children: ReactNode;
}

export const PermissionContextProvider: FC<IPermissionContextProviderProps> = ({ children }) => {
	const { authUser, isLoading: isAuthLoading } = useContext(AuthContext);
	const [permissions, setPermissions] = useState<IPermissionItem[]>([]);
	const [isFetchingPermissions, setIsFetchingPermissions] = useState<boolean>(false);
	const [hasFetchedOnce, setHasFetchedOnce] = useState<boolean>(false);

	// FETCH PERMISSIONS DIRECTLY FROM /api/v1/permission (CONTAINS ACCESS OBJECT & TREE)
	const refetchPermissions = useCallback(async () => {
		const token = authService.getToken();
		if (!token) {
			setPermissions([]);
			setIsFetchingPermissions(false);
			setHasFetchedOnce(true);
			return;
		}

		if (!authUser) {
			return;
		}

		setIsFetchingPermissions(true);
		try {
			const allPerms = await permissionService.getAllPermissions();
			setPermissions(Array.isArray(allPerms) ? allPerms : []);
		} catch (error) {
			console.error('Error loading permissions:', error);
			setPermissions([]);
		} finally {
			setIsFetchingPermissions(false);
			setHasFetchedOnce(true);
		}
	}, [authUser]);

	useEffect(() => {
		refetchPermissions();
	}, [refetchPermissions]);

	const token = authService.getToken();
	const isLoadingPermissions = Boolean(
		token && (isAuthLoading || isFetchingPermissions || !hasFetchedOnce)
	);

	// NORMALIZE PERMISSIONS AND ACCESS OBJECTS INTO A FAST LOOKUP MAP
	const permissionsMap = useMemo<IPermissionsMap>(() => {
		const map: IPermissionsMap = {};

		const indexPermission = (p: IPermissionItem) => {
			if (!p) return;

			// EXTRACT ACCESS BOOLEANS (e.g. access: { create: true, read: true, update: true, delete: true, reset_password: true })
			const accessObj: Record<string, any> = { ...(p.access || {}) };

			// Handle actions array if present (could be array of objects or strings)
			if (Array.isArray(p.actions)) {
				p.actions.forEach((act: any) => {
					if (typeof act === 'string') {
						accessObj[act.toLowerCase().trim()] = true;
					} else if (typeof act === 'object' && act !== null) {
						Object.entries(act).forEach(([k, v]) => {
							accessObj[k.toLowerCase().trim()] = Boolean(v);
						});
					}
				});
			}

			// Handle permissions array if present
			if (Array.isArray(p.permissions)) {
				p.permissions.forEach((permKey: string) => {
					if (typeof permKey === 'string') {
						accessObj[permKey.toLowerCase().trim()] = true;
					}
				});
			}

			const readVal = Boolean(
				accessObj.read || (p as any).read || accessObj.view || (p as any).view,
			);
			const createVal = Boolean(
				accessObj.create || (p as any).create || accessObj.add || (p as any).add,
			);
			const updateVal = Boolean(
				accessObj.update ||
					accessObj.edit ||
					(p as any).update ||
					(p as any).edit ||
					accessObj.write ||
					(p as any).write,
			);
			const deleteVal = Boolean(
				accessObj.delete || (p as any).delete || accessObj.remove || (p as any).remove,
			);
			const resetPasswordVal = Boolean(
				accessObj.reset_password ||
					accessObj.resetPassword ||
					accessObj['reset-password'] ||
					(p as any).reset_password ||
					(p as any).resetPassword ||
					(p as any)['reset-password'],
			);

			const state: IPermissionActionState = {
				id: p.id,
				name: p.name,
				permission_key: p.permission_key,
				...accessObj,
				read: readVal,
				create: createVal,
				update: updateVal,
				delete: deleteVal,
				reset_password: resetPasswordVal,
				resetPassword: resetPasswordVal,
			};

			const idStr = String(p.id).trim();
			if (idStr) {
				map[idStr] = state;
			}
			if (p.permission_key) {
				map[p.permission_key.toLowerCase().trim()] = state;
			}
			if (p.name) {
				map[p.name.toLowerCase().trim()] = state;
			}

			if (Array.isArray(p.children) && p.children.length > 0) {
				p.children.forEach(indexPermission);
			}
		};

		permissions.forEach(indexPermission);

		return map;
	}, [permissions]);

	// HELPER PERMISSION CHECKS
	const hasPermission = useCallback(
		(permissionKeyOrName: string, action = 'read'): boolean => {
			if (!permissionKeyOrName) return false;
			const normalized = permissionKeyOrName.toLowerCase().trim();
			const alternate = normalized.endsWith('s')
				? normalized.slice(0, -1)
				: `${normalized}s`;
			const underscore = normalized.replace(/[-\s]+/g, '_');
			const dash = normalized.replace(/[_\s]+/g, '-');
			const space = normalized.replace(/[_-]+/g, ' ');

			const perm =
				permissionsMap[normalized] ||
				permissionsMap[alternate] ||
				permissionsMap[underscore] ||
				permissionsMap[dash] ||
				permissionsMap[space];

			if (!perm) return false;

			const actNorm = action.toLowerCase().trim();
			if (
				actNorm === 'reset_password' ||
				actNorm === 'resetpassword' ||
				actNorm === 'reset-password'
			) {
				return Boolean(
					perm.reset_password ||
						perm.resetPassword ||
						perm['reset-password'] ||
						perm[action],
				);
			}

			return Boolean(perm[action] || perm[actNorm]);
		},
		[permissionsMap],
	);

	const canRead = useCallback(
		(permissionKeyOrName: string): boolean => hasPermission(permissionKeyOrName, 'read'),
		[hasPermission],
	);

	const canCreate = useCallback(
		(permissionKeyOrName: string): boolean => hasPermission(permissionKeyOrName, 'create'),
		[hasPermission],
	);

	const canUpdate = useCallback(
		(permissionKeyOrName: string): boolean => hasPermission(permissionKeyOrName, 'update'),
		[hasPermission],
	);

	const canDelete = useCallback(
		(permissionKeyOrName: string): boolean => hasPermission(permissionKeyOrName, 'delete'),
		[hasPermission],
	);

	const canResetPassword = useCallback(
		(permissionKeyOrName: string): boolean =>
			hasPermission(permissionKeyOrName, 'reset_password'),
		[hasPermission],
	);

	// DYNAMICALLY GENERATE MENU BASED ON PERMISSIONS AND USER READ ACCESS (INCLUDING NESTED CHILDREN)
	const dynamicMenu = useMemo<Record<string, any>>(() => {
		if (!authUser) {
			return {};
		}

		if (permissions.length === 0) {
			return dashboardPagesMenu;
		}

		// NORMALIZE PERMISSIONS INTO HIERARCHICAL TREE (SUPPORTING DIRECT CHILDREN OR parent_id)
		const permissionTree: IPermissionItem[] = [];
		const permMapById: Record<string, IPermissionItem> = {};

		permissions.forEach((p) => {
			permMapById[String(p.id)] = {
				...p,
				children: Array.isArray(p.children) ? [...p.children] : [],
			};
		});

		permissions.forEach((p) => {
			const item = permMapById[String(p.id)];
			if (p.parent_id && permMapById[String(p.parent_id)]) {
				const parent = permMapById[String(p.parent_id)];
				if (!parent.children) {
					parent.children = [];
				}
				if (!parent.children.some((c) => String(c.id) === String(item.id))) {
					parent.children.push(item);
				}
			} else if (!p.parent_id) {
				if (!permissionTree.some((r) => String(r.id) === String(item.id))) {
					permissionTree.push(item);
				}
			}
		});

		// RECURSIVE MENU BUILDER
		const buildMenuItem = (perm: IPermissionItem): any | null => {
			const key = perm.permission_key || perm.name;
			const hasDirectRead = canRead(key) || canRead(perm.name);

			// PROCESS CHILDREN RECURSIVELY
			let subMenuObj: Record<string, any> | null = null;
			if (Array.isArray(perm.children) && perm.children.length > 0) {
				const sortedChildren = [...perm.children].sort((a, b) => {
					const orderA = a.display_order !== undefined ? Number(a.display_order) : 999;
					const orderB = b.display_order !== undefined ? Number(b.display_order) : 999;
					return orderA - orderB;
				});

				const childMenu: Record<string, any> = {};
				sortedChildren.forEach((child) => {
					const childItem = buildMenuItem(child);
					if (childItem) {
						const childKey = child.permission_key || child.name || String(child.id);
						childMenu[childKey] = childItem;
					}
				});

				if (Object.keys(childMenu).length > 0) {
					subMenuObj = childMenu;
				}
			}

			// IF PERMITTED DIRECTLY OR HAS AT LEAST ONE PERMITTED CHILD
			if (hasDirectRead || subMenuObj !== null) {
				const metadata = getMenuMetadataForPermission(key, perm.name);

				let resolvedPath: string | null = '';
				if (metadata?.path !== undefined) {
					resolvedPath = metadata.path;
				} else if (subMenuObj !== null) {
					resolvedPath = null;
				}

				if (metadata || subMenuObj !== null) {
					return {
						id: perm.id || key,
						text: metadata?.text || perm.name,
						path: resolvedPath,
						icon: metadata?.icon || (perm as any).icon || 'ListAlt',
						subMenu: subMenuObj || metadata?.subMenu || null,
					};
				}
			}

			return null;
		};

		// SORT ROOT PERMISSIONS BY DISPLAY ORDER
		const sortedRoots = permissionTree.sort((a, b) => {
			const orderA = a.display_order !== undefined ? Number(a.display_order) : 999;
			const orderB = b.display_order !== undefined ? Number(b.display_order) : 999;
			return orderA - orderB;
		});

		const menuObj: Record<string, any> = {};
		sortedRoots.forEach((rootPerm) => {
			const item = buildMenuItem(rootPerm);
			if (item) {
				const rootKey = rootPerm.permission_key || rootPerm.name || String(rootPerm.id);
				menuObj[rootKey] = item;
			}
		});

		if (Object.keys(menuObj).length > 0) {
			return menuObj;
		}

		if (canRead('dashboard') || canRead('Dashboard')) {
			return dashboardPagesMenu;
		}

		return menuObj;
	}, [authUser, permissions, canRead]);

	const value: IPermissionContextProps = useMemo(
		() => ({
			permissions,
			userAccess: [],
			permissionsMap,
			dynamicMenu,
			isLoadingPermissions,
			hasPermission,
			canRead,
			canCreate,
			canUpdate,
			canDelete,
			canResetPassword,
			refetchPermissions,
		}),
		[
			permissions,
			permissionsMap,
			dynamicMenu,
			isLoadingPermissions,
			hasPermission,
			canRead,
			canCreate,
			canUpdate,
			canDelete,
			canResetPassword,
			refetchPermissions,
		],
	);

	return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

PermissionContextProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default PermissionContext;
