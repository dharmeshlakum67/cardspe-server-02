/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import { PillBadge } from '../../../components/common/PillBadge';
import Icon from '../../../components/icon/Icon';
import Spinner from '../../../components/bootstrap/Spinner';
import showNotification from '../../../components/extras/showNotification';
import roleService from './service/roleService';
import permissionService from '../../../services/permissionService';
import { IRoleDetail } from './type/role-type';
import { IPermissionItem } from '../../../type/permission-type';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { PERMISSION_KEYS } from '../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../constants/pageRoutes';
import { authPagesMenu } from '../../../menu';
import { getMenuMetadataForPermission } from '../../../config/menu-route.config';
import { decryptId, encryptId } from '../../../helpers/routeEncryption';
import { formatDate } from '../../../helpers/dateUtils';
import usePermission from '../../../hooks/usePermission';
import { getRoleTypeDetails } from './util/roleUtils';
import './css/RoleViewPage.scss';

export interface IDynamicActionItem {
	key: string;
	label: string;
	icon: string;
	colorClass: string;
	isGranted: boolean;
}

export interface IModuleActionState {
	id: string | number;
	name: string;
	permissionKey: string;
	icon: string;
	displayOrder: number;
	parentId?: string | number | null;
	availableActions: IDynamicActionItem[];
	grantedActions: IDynamicActionItem[];
	accessLevel: 'full' | 'partial' | 'none';
	summaryText: string;
}

export type TUnifiedModule =
	| {
			type: 'group';
			id: string | number;
			name: string;
			permissionKey: string;
			icon: string;
			displayOrder: number;
			accessLevel: 'full' | 'partial' | 'none';
			summaryText: string;
			directActions?: IModuleActionState;
			children: IModuleActionState[];
	  }
	| {
			type: 'standalone';
			id: string | number;
			name: string;
			permissionKey: string;
			icon: string;
			displayOrder: number;
			accessLevel: 'full' | 'partial' | 'none';
			summaryText: string;
			moduleState: IModuleActionState;
	  };

// NORMALIZE ACTION KEY
const normalizeActionKey = (rawKey: string): string => {
	const clean = (rawKey || '').toLowerCase().trim();
	if (clean === 'view') return 'read';
	if (clean === 'edit') return 'update';
	return clean;
};

// MAP ACTION KEYS TO HUMAN LABELS, ICONS, AND PILL COLORS
const getActionMeta = (rawKey: string): { label: string; icon: string; colorClass: string } => {
	const key = (rawKey || '').toLowerCase().trim();

	if (key === 'create' || key === 'add' || key === 'insert') {
		return { label: 'Create', icon: 'Add', colorClass: 'action-create' };
	}
	if (key === 'read' || key === 'view' || key === 'get' || key === 'show' || key === 'list') {
		return { label: 'View', icon: 'Visibility', colorClass: 'action-view' };
	}
	if (key === 'update' || key === 'edit' || key === 'modify') {
		return { label: 'Update', icon: 'Edit', colorClass: 'action-update' };
	}
	if (key === 'delete' || key === 'remove' || key === 'destroy') {
		return { label: 'Delete', icon: 'DeleteOutline', colorClass: 'action-delete' };
	}
	if (
		key === 'reset_password' ||
		key === 'resetpassword' ||
		key === 'reset-password' ||
		key === 'reset password'
	) {
		return { label: 'Reset Password', icon: 'LockReset', colorClass: 'action-reset-password' };
	}
	if (key === 'export' || key === 'download') {
		return { label: 'Export', icon: 'FileDownload', colorClass: 'action-view' };
	}
	if (key === 'import' || key === 'upload') {
		return { label: 'Import', icon: 'FileUpload', colorClass: 'action-create' };
	}
	if (key === 'approve') {
		return { label: 'Approve', icon: 'CheckCircle', colorClass: 'action-create' };
	}

	// CAPITALIZE CUSTOM KEY
	const capitalized = key
		.split(/[_\-\s]+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
	return { label: capitalized || 'Action', icon: 'CheckCircle', colorClass: 'action-custom' };
};

const RoleViewPage: FC = () => {
	const { id: rawId } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { canRead, canUpdate, canDelete, isLoadingPermissions } = usePermission();

	// DECRYPT ID FOR API REQUEST
	const decryptedId = useMemo(() => decryptId(rawId), [rawId]);

	const [role, setRole] = useState<IRoleDetail | null>(null);
	const [allSystemPermissions, setAllSystemPermissions] = useState<IPermissionItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [searchQuery, setSearchQuery] = useState<string>('');

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	// REF TO PREVENT DUPLICATE API CALLS
	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// CONFIRM DELETE HANDLER
	const handleConfirmDelete = async () => {
		if (!role) return;
		setIsDeleting(true);
		try {
			await roleService.deleteRole(role.id);
			showNotification('Success', `Role "${role.name}" deleted successfully`, 'success');
			setIsDeleteModalOpen(false);
			navigate(`/${PAGE_ROUTES.ROLES}`);
		} catch (error: any) {
			showNotification(
				'Delete Failed',
				error?.message || 'Failed to delete role',
				'danger',
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// REDIRECT TO 404 IF PERMISSION DENIED OR NO VALID ROLE ID
	useEffect(() => {
		if (!isLoadingPermissions && !canRead(PERMISSION_KEYS.ROLE)) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
			return;
		}

		if (!rawId || (rawId && !decryptedId)) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canRead, rawId, decryptedId, navigate]);

	// FETCH ROLE DATA WITH PERMISSIONS VIA GET-ONE API (SINGLE CALL)
	const fetchRoleDetails = useCallback(async () => {
		if (!decryptedId || isFetchingRef.current || fetchedIdRef.current === decryptedId) {
			return;
		}

		isFetchingRef.current = true;
		fetchedIdRef.current = decryptedId;
		setIsLoading(true);

		try {
			const roleRes = await roleService.getRoleOne(decryptedId);

			if (roleRes && roleRes.data) {
				setRole(roleRes.data);
				if (Array.isArray(roleRes.data.role_access) && roleRes.data.role_access.length > 0) {
					setAllSystemPermissions(roleRes.data.role_access as unknown as IPermissionItem[]);
				}
			} else {
				navigate(`/${authPagesMenu.page404.path}`, { replace: true });
			}
		} catch (error: any) {
			showNotification(
				'Error loading role',
				error?.message || 'Could not fetch role details from server',
				'danger',
			);
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		} finally {
			setIsLoading(false);
			isFetchingRef.current = false;
		}
	}, [decryptedId, navigate]);

	useEffect(() => {
		if (
			decryptedId &&
			!isLoadingPermissions &&
			canRead(PERMISSION_KEYS.ROLE) &&
			fetchedIdRef.current !== decryptedId
		) {
			fetchRoleDetails();
		}
	}, [decryptedId, isLoadingPermissions, canRead, fetchRoleDetails]);

	// EXTRACT ASSIGNED ACTION KEYS THAT ARE GRANTED FOR A MODULE
	const extractGrantedActionKeys = (accessItem: any): Set<string> => {
		const grantedSet = new Set<string>();
		if (!accessItem) return grantedSet;

		// 1. PARSE DIRECT ACCESS OBJECT: { create: true, read: false, delete: true }
		if (accessItem.access && typeof accessItem.access === 'object') {
			Object.entries(accessItem.access).forEach(([k, v]) => {
				if (v) {
					const clean = normalizeActionKey(k);
					grantedSet.add(clean);
				}
			});
		}

		// 2. PARSE ACTIONS ARRAY OF OBJECTS: [{ create: true }, { read: true }, ...]
		if (Array.isArray(accessItem.actions)) {
			accessItem.actions.forEach((act: any) => {
				if (typeof act === 'object' && act !== null) {
					Object.entries(act).forEach(([k, v]) => {
						if (v) {
							const clean = normalizeActionKey(k);
							grantedSet.add(clean);
						}
					});
				} else if (typeof act === 'string') {
					const clean = normalizeActionKey(act);
					grantedSet.add(clean);
				}
			});
		}

		// 3. PARSE PERMISSIONS ARRAY OF STRINGS: ["create", "read", ...]
		if (Array.isArray(accessItem.permissions)) {
			accessItem.permissions.forEach((p: any) => {
				if (typeof p === 'string') {
					grantedSet.add(normalizeActionKey(p));
				}
			});
		}

		// 4. DIRECT BOOLEAN PROPERTIES: { create: true, read: true, ... }
		[
			'create',
			'read',
			'view',
			'update',
			'edit',
			'delete',
			'reset_password',
			'export',
			'import',
		].forEach((key) => {
			if (accessItem[key] === true) {
				const mapped = normalizeActionKey(key);
				grantedSet.add(mapped);
			}
		});

		return grantedSet;
	};

	// EXTRACT ALL AVAILABLE ACTION DEFINITIONS FOR A MODULE FROM MASTER DEFINITIONS
	const extractAvailableActionKeys = (permDef: any): string[] => {
		const availableSet = new Set<string>();
		if (!permDef) return [];

		// 1. EXTRACT FROM ACCESS OBJECT
		if (permDef.access && typeof permDef.access === 'object') {
			Object.keys(permDef.access).forEach((k) => {
				availableSet.add(normalizeActionKey(k));
			});
		}

		// 2. EXTRACT FROM ACTIONS ARRAY
		if (Array.isArray(permDef.actions) && permDef.actions.length > 0) {
			permDef.actions.forEach((act: any) => {
				if (typeof act === 'object' && act !== null) {
					Object.keys(act).forEach((k) => {
						availableSet.add(normalizeActionKey(k));
					});
				} else if (typeof act === 'string') {
					availableSet.add(normalizeActionKey(act));
				}
			});
		}

		// 3. EXTRACT FROM PERMISSIONS ARRAY
		if (Array.isArray(permDef.permissions) && permDef.permissions.length > 0) {
			permDef.permissions.forEach((p: any) => {
				if (typeof p === 'string') {
					availableSet.add(normalizeActionKey(p));
				}
			});
		}

		return Array.from(availableSet);
	};

	// RESOLVE ICON FOR MODULE USING MENU ROUTE CONFIG, BACKEND DEFINITION, OR SMART FALLBACK
	const resolveModuleIcon = (
		perm: any,
		permissionKey: string,
		name: string,
		isParentGroup = false,
	): string => {
		// 1. CANONICAL APP ROUTE & DESIGN CONFIGURATION (PRIORITY 1)
		const menuMeta = getMenuMetadataForPermission(permissionKey, name);
		if (menuMeta?.icon) {
			return menuMeta.icon;
		}

		// 2. BACKEND / DATABASE ICON (IF VALID STRING AND NOT 'NULL' OR EMPTY)
		const permObj =
			perm?.permission_id && typeof perm.permission_id === 'object'
				? perm.permission_id
				: perm;
		const rawIcon = perm?.icon || permObj?.icon;

		if (
			rawIcon &&
			typeof rawIcon === 'string' &&
			rawIcon.trim() &&
			rawIcon !== 'null' &&
			rawIcon !== 'undefined'
		) {
			const candidateMeta = getMenuMetadataForPermission(rawIcon.trim(), rawIcon.trim());
			if (candidateMeta?.icon) return candidateMeta.icon;
			return rawIcon.trim();
		}

		if (isParentGroup) {
			return 'Folder';
		}

		// 3. SMART KEYWORD MATCHING
		const lowerKey = (permissionKey || name || '').toLowerCase();
		if (lowerKey.includes('item')) return 'Category';
		if (lowerKey.includes('size')) return 'Straighten';
		if (lowerKey.includes('colou') || lowerKey.includes('color')) return 'Palette';
		if (lowerKey.includes('process')) return 'AccountTree';
		if (
			lowerKey.includes('fabric_inward') ||
			lowerKey.includes('fabric inward') ||
			lowerKey.includes('inward')
		)
			return 'Input';
		if (lowerKey.includes('production')) return 'PrecisionManufacturing';
		if (
			lowerKey.includes('fabric_stage') ||
			lowerKey.includes('fabric stage') ||
			lowerKey.includes('stage')
		)
			return 'Timeline';
		if (
			lowerKey.includes('fabric_type') ||
			lowerKey.includes('fabric type') ||
			lowerKey.includes('fabric')
		)
			return 'Texture';
		if (
			lowerKey.includes('party') ||
			lowerKey.includes('client') ||
			lowerKey.includes('customer') ||
			lowerKey.includes('vendor') ||
			lowerKey.includes('supplier')
		)
			return 'People';
		if (lowerKey.includes('cut') || lowerKey.includes('cutting')) return 'ContentCut';
		if (
			lowerKey.includes('labour') ||
			lowerKey.includes('worker') ||
			lowerKey.includes('staff')
		)
			return 'Engineering';
		if (lowerKey.includes('dashboard')) return 'Dashboard';
		if (lowerKey.includes('user')) return 'Group';
		if (lowerKey.includes('role')) return 'AdminPanelSettings';
		if (lowerKey.includes('history') || lowerKey.includes('log')) return 'History';
		if (lowerKey.includes('setting')) return 'Settings';
		if (lowerKey.includes('master')) return 'Folder';

		return 'Shield';
	};

	// PARSE AND NORMALIZE MODULE PERMISSIONS WITH DYNAMIC ACCESS LEVEL EVALUATION
	const { orderedModules, totalModuleCount } = useMemo(() => {
		if (!role) {
			return { orderedModules: [], totalModuleCount: 0 };
		}

		// EXTRACT ROLE ACCESS ENTRIES FROM ROLE DATA OR SYSTEM PERMISSIONS
		const moduleSourceList: any[] =
			Array.isArray(role.role_access) && role.role_access.length > 0
				? role.role_access
				: allSystemPermissions;

		if (moduleSourceList.length === 0) {
			return { orderedModules: [], totalModuleCount: 0 };
		}

		// BUILD MODULE ACTION STATE GIVEN A PERMISSION DEFINITION OR ROLE ACCESS NODE
		const buildModuleState = (perm: any, fallbackIndex: number): IModuleActionState => {
			const permObj =
				perm?.permission_id && typeof perm.permission_id === 'object'
					? perm.permission_id
					: perm;

			const name =
				perm.name ||
				perm.permission_name ||
				permObj.name ||
				permObj.permission_name ||
				perm.permission_key ||
				permObj.permission_key ||
				perm.key ||
				permObj.key ||
				`Module ${fallbackIndex + 1}`;

			const key =
				perm.permission_key ||
				perm.key ||
				permObj.permission_key ||
				permObj.key ||
				perm.name ||
				permObj.name ||
				'';

			const pid = String(perm.id || permObj.id || fallbackIndex);
			const parentId = perm.parent_id || permObj.parent_id;

			let displayOrder = fallbackIndex + 1;
			if (perm.display_order !== undefined && perm.display_order !== null) {
				displayOrder = Number(perm.display_order);
			} else if (
				permObj.display_order !== undefined &&
				permObj.display_order !== null
			) {
				displayOrder = Number(permObj.display_order);
			}

			// RESOLVE ICON
			const icon = resolveModuleIcon(perm, key, name, false);

			// 1. EXTRACT AVAILABLE ACTIONS FROM ACCESS OBJECT (e.g. { create: true, read: true, update: true, delete: false })
			const availableKeySet = new Set<string>();
			const grantedKeySet = new Set<string>();

			if (perm.access && typeof perm.access === 'object') {
				Object.entries(perm.access).forEach(([actKey, isGranted]) => {
					const clean = actKey.toLowerCase().trim();
					availableKeySet.add(clean);
					if (isGranted) {
						grantedKeySet.add(clean);
					}
				});
			}

			// Fallback: If perm.actions array is present
			if (Array.isArray(perm.actions)) {
				perm.actions.forEach((act: any) => {
					if (typeof act === 'object' && act !== null) {
						Object.entries(act).forEach(([actKey, isGranted]) => {
							const clean = actKey.toLowerCase().trim();
							availableKeySet.add(clean);
							if (isGranted) {
								grantedKeySet.add(clean);
							}
						});
					} else if (typeof act === 'string') {
						const clean = act.toLowerCase().trim();
						availableKeySet.add(clean);
					}
				});
			}

			if (availableKeySet.size === 0) {
				// Default fallback
				availableKeySet.add('read');
			}

			const standardOrder = [
				'create',
				'read',
				'view',
				'edit',
				'update',
				'delete',
				'reset_password',
				'export',
				'import',
				'approve',
			];
			const sortedAvailableKeys = Array.from(availableKeySet).sort((a, b) => {
				const idxA = standardOrder.indexOf(a);
				const idxB = standardOrder.indexOf(b);
				if (idxA !== -1 && idxB !== -1) return idxA - idxB;
				if (idxA !== -1) return -1;
				if (idxB !== -1) return 1;
				return a.localeCompare(b);
			});

			// BUILD ALL DYNAMIC ACTION ITEMS
			const availableActionItems: IDynamicActionItem[] = sortedAvailableKeys.map((actKey) => {
				const meta = getActionMeta(actKey);
				const isGranted = grantedKeySet.has(actKey);
				return {
					key: actKey,
					label: meta.label,
					icon: meta.icon,
					colorClass: meta.colorClass,
					isGranted,
				};
			});

			const grantedActionItems = availableActionItems.filter((a) => a.isGranted);

			let accessLevel: 'full' | 'partial' | 'none' = 'none';
			if (
				availableActionItems.length > 0 &&
				grantedActionItems.length >= availableActionItems.length
			) {
				accessLevel = 'full';
			} else if (grantedActionItems.length > 0) {
				accessLevel = 'partial';
			}

			const summaryText =
				grantedActionItems.length > 0
					? grantedActionItems.map((a) => a.label).join(' · ')
					: 'No access permissions configured';

			const rawModuleName = String(name);
			const formattedName = rawModuleName
				.replace(/[-_]/g, ' ')
				.split(' ')
				.map((w: string) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
				.join(' ');

			return {
				id: pid,
				name: formattedName,
				permissionKey: key,
				icon,
				displayOrder,
				parentId,
				availableActions: availableActionItems,
				grantedActions: grantedActionItems,
				accessLevel,
				summaryText,
			};
		};

		const unifiedList: TUnifiedModule[] = [];
		let subModuleCount = 0;

		// SORT ROOT LEVEL MODULES IN EXACT DISPLAY ORDER
		const sortedRoots = [...moduleSourceList].sort((a, b) => {
			const orderA =
				a.display_order !== undefined && a.display_order !== null
					? Number(a.display_order)
					: 999;
			const orderB =
				b.display_order !== undefined && b.display_order !== null
					? Number(b.display_order)
					: 999;
			return orderA - orderB;
		});

		// PROCESS ROOT LEVEL MODULES AND THEIR NESTED CHILDREN
		sortedRoots.forEach((rootPerm, rootIndex) => {
			const rawChildren = Array.isArray(rootPerm.children) ? rootPerm.children : [];

			if (rawChildren.length > 0) {
				// SORT CHILD SUB-MODULES STRICTLY BY DISPLAY ORDER ASCENDING
				const sortedChildren = [...rawChildren].sort((a, b) => {
					const orderA =
						a.display_order !== undefined && a.display_order !== null
							? Number(a.display_order)
							: 999;
					const orderB =
						b.display_order !== undefined && b.display_order !== null
							? Number(b.display_order)
							: 999;
					return orderA - orderB;
				});

				const childStates = sortedChildren.map((child, cIdx) =>
					buildModuleState(child, cIdx),
				);

				subModuleCount += childStates.length;

				const allChildrenFull = childStates.every((c) => c.accessLevel === 'full');
				const anyChildActive = childStates.some((c) => c.accessLevel !== 'none');

				let parentAccessLevel: 'full' | 'partial' | 'none' = 'none';
				if (allChildrenFull && childStates.length > 0) {
					parentAccessLevel = 'full';
				} else if (anyChildActive) {
					parentAccessLevel = 'partial';
				}

				const parentState = buildModuleState(rootPerm, rootIndex);
				const parentIcon = resolveModuleIcon(
					rootPerm,
					rootPerm.permission_key || parentState.permissionKey,
					parentState.name,
					true,
				);

				unifiedList.push({
					type: 'group',
					id: rootPerm.id,
					name: parentState.name,
					permissionKey: rootPerm.permission_key || parentState.permissionKey,
					icon: parentIcon,
					displayOrder: parentState.displayOrder,
					accessLevel: parentAccessLevel,
					summaryText: `${childStates.length} sub-modules configured`,
					directActions:
						parentState.grantedActions.length > 0 ? parentState : undefined,
					children: childStates,
				});
			} else {
				// ROOT STANDALONE MODULE
				subModuleCount += 1;
				const standaloneState = buildModuleState(rootPerm, rootIndex);
				unifiedList.push({
					type: 'standalone',
					id: rootPerm.id,
					name: standaloneState.name,
					permissionKey: rootPerm.permission_key || standaloneState.permissionKey,
					icon: standaloneState.icon,
					displayOrder: standaloneState.displayOrder,
					accessLevel: standaloneState.accessLevel,
					summaryText: standaloneState.summaryText,
					moduleState: standaloneState,
				});
			}
		});

		return {
			orderedModules: unifiedList,
			totalModuleCount: subModuleCount || moduleSourceList.length,
		};
	}, [role, allSystemPermissions]);

	// FILTER UNIFIED MODULE LIST BY SEARCH QUERY WHILE PRESERVING STRICT DISPLAY ORDER
	const filteredOrderedModules = useMemo(() => {
		if (!searchQuery.trim()) {
			return orderedModules;
		}

		const q = searchQuery.toLowerCase().trim();
		const result: TUnifiedModule[] = [];

		orderedModules.forEach((item) => {
			if (item.type === 'group') {
				const parentMatch = item.name.toLowerCase().includes(q);
				const matchedChildren = item.children.filter((c) =>
					c.name.toLowerCase().includes(q),
				);

				if (parentMatch) {
					result.push(item);
				} else if (matchedChildren.length > 0) {
					result.push({
						...item,
						children: matchedChildren,
					});
				}
			} else {
				const match = item.name.toLowerCase().includes(q);
				if (match) {
					result.push(item);
				}
			}
		});

		return result;
	}, [orderedModules, searchQuery]);

	// FORMAT CREATION DATE (DD/MM/YYYY)
	const formattedCreatedDate = useMemo(() => {
		if (!role?.created_at) return null;
		return formatDate(role.created_at);
	}, [role?.created_at]);

	// ROLE TYPE DETAILS
	const roleTypeMeta = useMemo(() => {
		return getRoleTypeDetails(role?.role_type || '');
	}, [role?.role_type]);

	// LOADING SPINNER
	if (isLoading) {
		return (
			<PageWrapper title='Role Details' permissionKey={PERMISSION_KEYS.ROLE}>
				<Page container='fluid'>
					<div
						className='d-flex flex-column align-items-center justify-content-center py-5'
						style={{ minHeight: '60vh' }}>
						<Spinner color='primary' size='3rem' isGrow={false} />
						<span className='text-muted small mt-3'>Loading role permission details...</span>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	// IF NOT FOUND
	if (!role) {
		return null;
	}

	const isRoleActive = role.status === 'ACTIVE';
	const hasAnyModules = filteredOrderedModules.length > 0;

	return (
		<PageWrapper title={`View Role: ${role.name}`} permissionKey={PERMISSION_KEYS.ROLE}>
			<Page container='fluid'>
				<div className='role-view-page'>
					{/* TOP FIXED HEADER SECTION */}
					<div className='role-view-header'>
						{/* TITLE & META BADGES */}
						<div className='role-title-section'>
							{/* BREADCRUMBS */}
							<nav className='role-breadcrumbs' aria-label='Breadcrumbs'>
								<NavLink to='/' className='breadcrumb-home-link' aria-label='Home'>
									<span className='breadcrumb-home-icon'>
										<Icon icon='Home' size='sm' />
									</span>
								</NavLink>
								<span className='breadcrumb-sep'>›</span>
								<span className='breadcrumb-item-static'>User Management</span>
								<span className='breadcrumb-sep'>›</span>
								<NavLink to={`/${PAGE_ROUTES.ROLES}`} className='breadcrumb-link'>
									Roles
								</NavLink>
								<span className='breadcrumb-sep'>›</span>
								<span className='breadcrumb-current'>{role.name}</span>
							</nav>

							{/* ROLE NAME */}
							<h2 className='role-name-heading'>{role.name}</h2>

							{/* META PILL BADGES ROW */}
							<div className='role-meta-pills'>
								{/* STATUS PILL */}
								<PillBadge
									color={isRoleActive ? 'success' : 'warning'}
									isPill
									size='md'>
									{isRoleActive ? 'Active' : 'Inactive'}
								</PillBadge>

								{/* MODULE COUNT PILL */}
								<span className='meta-info-pill'>
									<Icon icon='GridView' size='sm' />
									<span>{totalModuleCount} Modules</span>
								</span>

								{/* CREATED DATE PILL */}
								{formattedCreatedDate && (
									<span className='meta-info-pill'>
										<Icon icon='Event' size='sm' />
										<span>Created At: {formattedCreatedDate}</span>
									</span>
								)}

								{/* ROLE TYPE PILL */}
								<PillBadge color={roleTypeMeta.color} isPill size='md'>
									{roleTypeMeta.label}
								</PillBadge>
							</div>
						</div>

						{/* HEADER ACTIONS */}
						<div className='role-header-actions'>
							{/* BACK BUTTON */}
							<button
								type='button'
								className='btn-back-action'
								onClick={() => navigate(-1)}>
								<Icon icon='ArrowBack' size='sm' />
								<span>Back</span>
							</button>

							{/* DELETE BUTTON (PERMISSION AWARE) */}
							{canDelete(PERMISSION_KEYS.ROLE) && (
								<button
									type='button'
									className='btn-delete-action'
									onClick={() => setIsDeleteModalOpen(true)}>
									<Icon icon='DeleteOutline' size='sm' />
									<span>Delete</span>
								</button>
							)}

							{/* EDIT BUTTON (PERMISSION AWARE) */}
							{canUpdate(PERMISSION_KEYS.ROLE) && (
								<button
									type='button'
									className='btn-edit-action'
									onClick={() => {
										navigate(`/${PAGE_ROUTES.ROLES_EDIT.replace(':id', encryptId(role.id))}`);
									}}>
									<Icon icon='Edit' size='sm' />
									<span>Edit</span>
								</button>
							)}
						</div>
					</div>

					{/* PERMISSION SETTINGS MAIN SECTION (FIXED BANNER + SCROLLABLE BODY) */}
					<div className='permission-settings-section'>
						{/* FIXED SLEEK DARK BANNER HEADER */}
						<div className='permission-settings-banner'>
							<div className='banner-left'>
								<div className='banner-icon-badge'>
									<Icon icon='Shield' />
								</div>
								<div>
									<h4 className='banner-title'>Permission Settings</h4>
									<p className='banner-subtitle'>
										Access levels configured for each module
									</p>
								</div>
							</div>

							<div className='banner-right'>
								{/* INSTANT MODULE SEARCH */}
								{totalModuleCount > 0 && (
									<input
										type='text'
										className='banner-search-input'
										placeholder='Search modules...'
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								)}
							</div>
						</div>

						{/* SCROLLABLE PERMISSION MODULES BODY CONTAINER (STRICT DISPLAY ORDER) */}
						<div className='permission-modules-body'>
							{hasAnyModules ? (
								filteredOrderedModules.map((item) => {
									// 1. RENDER PARENT MODULE GROUP WITH NESTED SUB-MODULES
									if (item.type === 'group') {
										return (
											<div key={`group-${item.id}`} className='parent-module-group'>
												{/* PARENT HEADER CARD */}
												<div className='parent-header-card'>
													<div className='parent-info-left'>
														<div className='parent-icon-badge'>
															<Icon icon={item.icon as any} />
														</div>
														<div className='parent-title-col'>
															<div className='parent-name-row'>
																<span className='parent-name'>{item.name}</span>

																{/* PARENT ACCESS BADGE */}
																{item.accessLevel === 'full' && (
																	<span className='access-badge badge-full-access'>
																		<Icon icon='Security' size='sm' />
																		<span>Full Access</span>
																	</span>
																)}
																{item.accessLevel === 'partial' && (
																	<span className='access-badge badge-partial-access'>
																		<span>Partial</span>
																	</span>
																)}
																{item.accessLevel === 'none' && (
																	<span className='access-badge badge-no-access'>
																		<span>No Access</span>
																	</span>
																)}

																{/* SUB MODULES COUNT TAG */}
																<span className='sub-modules-count-tag'>
																	{item.children.length} Sub-Modules
																</span>
															</div>

															<p className='parent-summary-subtext'>
																{item.summaryText}
															</p>
														</div>
													</div>

													{/* PARENT DIRECT ACTIONS IF APPLICABLE */}
													{item.directActions && (
														<div className='parent-actions-right'>
															{item.directActions.grantedActions.map((act) => (
																<span
																	key={`parent-act-${act.key}`}
																	className={`action-pill ${act.colorClass}`}>
																	<Icon icon={act.icon as any} size='sm' />
																	<span>{act.label}</span>
																</span>
															))}
														</div>
													)}
												</div>

												{/* CONNECTED CHILD MODULES LIST */}
												<div className='child-modules-container'>
													{item.children.map((child) => (
														<div key={`child-${child.id}`} className='child-module-card'>
															<div className='child-info-left'>
																<div className='child-title-row'>
																	<span className='child-icon-badge'>
																		<Icon icon={child.icon as any} size='sm' />
																	</span>
																	<span className='child-name'>{child.name}</span>

																	{/* ACCESS LEVEL BADGE */}
																	{child.accessLevel === 'full' && (
																		<span className='access-badge badge-full-access'>
																			<Icon icon='Security' size='sm' />
																			<span>Full Access</span>
																		</span>
																	)}
																	{child.accessLevel === 'partial' && (
																		<span className='access-badge badge-partial-access'>
																			<span>Partial</span>
																		</span>
																	)}
																	{child.accessLevel === 'none' && (
																		<span className='access-badge badge-no-access'>
																			<span>No Access</span>
																		</span>
																	)}
																</div>

																<p className='child-summary-subtext'>
																	{child.summaryText}
																</p>
															</div>

															{/* CHILD DYNAMIC ACTION PILLS */}
															<div className='child-actions-right'>
																{child.grantedActions.length > 0 ? (
																	child.grantedActions.map((act) => (
																		<span
																			key={`child-act-${child.id}-${act.key}`}
																			className={`action-pill ${act.colorClass}`}>
																			<Icon icon={act.icon as any} size='sm' />
																			<span>{act.label}</span>
																		</span>
																	))
																) : (
																	<span className='text-muted small'>
																		No permissions granted
																	</span>
																)}
															</div>
														</div>
													))}
												</div>
											</div>
										);
									}

									// 2. RENDER STANDALONE ROOT MODULE IN EXACT SEQUENCE
									const { moduleState } = item;
									return (
										<div key={`standalone-${item.id}`} className='standalone-module-card'>
											{/* LEFT MODULE INFO */}
											<div className='module-info-left'>
												<div className='module-icon-badge'>
													<Icon icon={item.icon as any} />
												</div>
												<div className='module-title-col'>
													<div className='module-title-row'>
														<span className='module-name'>{item.name}</span>

														{/* ACCESS LEVEL BADGE */}
														{item.accessLevel === 'full' && (
															<span className='access-badge badge-full-access'>
																<Icon icon='Security' size='sm' />
																<span>Full Access</span>
															</span>
														)}
														{item.accessLevel === 'partial' && (
															<span className='access-badge badge-partial-access'>
																<span>Partial</span>
															</span>
														)}
														{item.accessLevel === 'none' && (
															<span className='access-badge badge-no-access'>
																<span>No Access</span>
															</span>
														)}
													</div>

													<p className='module-summary-subtext'>{item.summaryText}</p>
												</div>
											</div>

											{/* RIGHT DYNAMIC ACTION PILLS */}
											<div className='module-actions-right'>
												{moduleState.grantedActions.length > 0 ? (
													moduleState.grantedActions.map((act) => (
														<span
															key={`standalone-act-${item.id}-${act.key}`}
															className={`action-pill ${act.colorClass}`}>
															<Icon icon={act.icon as any} size='sm' />
															<span>{act.label}</span>
														</span>
													))
												) : (
													<span className='text-muted small'>
														No permissions granted
													</span>
												)}
											</div>
										</div>
									);
								})
							) : (
								<div className='no-modules-found'>
									<Icon icon='SearchOff' size='3x' />
									<p className='mt-2 mb-0 fw-medium'>No modules matched your search</p>
									<span className='text-muted small'>
										Try adjusting your search query
									</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* CONFIRMATION ALERT MODAL FOR DELETION */}
				<ConfirmationModal
					isOpen={isDeleteModalOpen}
					setIsOpen={setIsDeleteModalOpen}
					title='Confirmation Alert!'
					message='Are you sure to remove this Role ?'
					confirmText='Yes'
					cancelText='No'
					isLoading={isDeleting}
					onConfirm={handleConfirmDelete}
				/>
			</Page>
		</PageWrapper>
	);
};

export default RoleViewPage;
