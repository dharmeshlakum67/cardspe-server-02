/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, react/forbid-prop-types, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import AppBreadcrumbs from '../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import { TPillBadgeColor } from '../../../components/common/PillBadge';
import Icon from '../../../components/icon/Icon';
import Spinner from '../../../components/bootstrap/Spinner';
import showNotification from '../../../components/extras/showNotification';
import { IPermissionItem } from '../../../type/permission-type';
import { IRoleDetail } from './type/role-type';
import { PAGE_ROUTES } from '../../../constants/pageRoutes';
import { getMenuMetadataForPermission } from '../../../config/menu-route.config';
import './css/RoleEditPage.scss';

// ACTION META LOOKUP
const getActionLabel = (rawKey: string): string => {
	const key = (rawKey || '').toLowerCase().trim();
	if (key === 'create' || key === 'add' || key === 'insert') return 'Create';
	if (key === 'read' || key === 'view' || key === 'get' || key === 'list' || key === 'show') return 'View';
	if (key === 'update' || key === 'edit' || key === 'modify') return 'Update';
	if (key === 'delete' || key === 'remove' || key === 'destroy') return 'Delete';
	if (
		key === 'reset_password' ||
		key === 'resetpassword' ||
		key === 'reset-password' ||
		key === 'reset password'
	) {
		return 'Reset Password';
	}
	if (key === 'export' || key === 'download') return 'Export';
	if (key === 'import' || key === 'upload') return 'Import';
	if (key === 'approve') return 'Approve';
	if (key.length > 0) {
		return key
			.split(/[_\-\s]+/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
	return 'Action';
};

// RESOLVE MODULE ICON
const resolveIcon = (perm: any, permissionKey: string, name: string): string => {
	// 1. CANONICAL APP ROUTE & DESIGN CONFIGURATION (PRIORITY 1)
	const meta = getMenuMetadataForPermission(permissionKey, name);
	if (meta?.icon) return meta.icon;

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

	// 3. SMART KEYWORD MATCHING
	const lower = (permissionKey || name || '').toLowerCase();
	if (lower.includes('item')) return 'Category';
	if (lower.includes('size')) return 'Straighten';
	if (lower.includes('colou') || lower.includes('color')) return 'Palette';
	if (lower.includes('process')) return 'AccountTree';
	if (
		lower.includes('fabric_inward') ||
		lower.includes('fabric inward') ||
		lower.includes('inward')
	)
		return 'Input';
	if (lower.includes('production')) return 'PrecisionManufacturing';
	if (
		lower.includes('fabric_stage') ||
		lower.includes('fabric stage') ||
		lower.includes('stage')
	)
		return 'Timeline';
	if (
		lower.includes('fabric_type') ||
		lower.includes('fabric type') ||
		lower.includes('fabric')
	)
		return 'Texture';
	if (
		lower.includes('party') ||
		lower.includes('client') ||
		lower.includes('customer') ||
		lower.includes('vendor') ||
		lower.includes('supplier')
	)
		return 'People';
	if (lower.includes('cut') || lower.includes('cutting')) return 'ContentCut';
	if (
		lower.includes('labour') ||
		lower.includes('worker') ||
		lower.includes('staff')
	)
		return 'Engineering';
	if (lower.includes('dashboard')) return 'Dashboard';
	if (lower.includes('user')) return 'Group';
	if (lower.includes('role')) return 'AdminPanelSettings';
	if (lower.includes('order')) return 'ShoppingCart';
	if (lower.includes('partner')) return 'LocalShipping';
	if (lower.includes('service')) return 'Build';
	if (lower.includes('report')) return 'Assessment';
	if (lower.includes('account')) return 'AccountBalance';
	if (lower.includes('master')) return 'Folder';
	return 'Shield';
};

// ROLE TYPE OPTIONS (SUPER_ADMIN, ADMIN & STAFF)
interface IRoleTypeOption {
	value: string;
	label: string;
	color: TPillBadgeColor;
}

const ROLE_TYPE_OPTIONS: IRoleTypeOption[] = [
	{ value: 'super_user', label: 'Super User', color: 'purple' },
	{ value: 'user', label: 'User', color: 'indigo' },
	{ value: 'api_user', label: 'API User', color: 'teal' },
];

// STATUS OPTIONS (ACTIVE & INACTIVE)
interface IStatusOption {
	value: 'active' | 'inactive';
	label: string;
	color: string;
}

const STATUS_OPTIONS: IStatusOption[] = [
	{ value: 'active', label: 'Active', color: '#10b981' },
	{ value: 'inactive', label: 'Inactive', color: '#ef4444' },
];

// TREE NODE DEFINITION
export interface ITreePermissionNode {
	id: string;
	name: string;
	permissionKey: string;
	displayOrder: number;
	icon: string;
	parentId?: string | null;
	actions: string[];
	children: ITreePermissionNode[];
}

export type IRoleFormData = Partial<{
	role_name: string;
	role_status: 'active' | 'inactive' | string;
	role_type: string;
	accesses: Array<{
		permission_id: number;
		actions: Record<string, boolean>;
	}>;
}>;

export interface IRoleFormProps {
	mode: 'add' | 'edit';
	initialRole?: IRoleDetail | null;
	allSystemPermissions: IPermissionItem[];
	isSaving: boolean;
	onSubmit: (formData: IRoleFormData) => Promise<void>;
	onDeleteClick?: () => void;
	canDelete?: boolean;
}

export const RoleForm: FC<IRoleFormProps> = ({
	mode,
	initialRole,
	allSystemPermissions,
	isSaving,
	onSubmit,
	onDeleteClick,
	canDelete = false,
}) => {
	const navigate = useNavigate();

	// FORM STATE
	const [roleName, setRoleName] = useState<string>(initialRole?.role_name || '');
	const [roleType, setRoleType] = useState<string>(
		initialRole?.role_type ? initialRole.role_type.toLowerCase().trim() : 'user',
	);
	const [roleStatus, setRoleStatus] = useState<'active' | 'inactive'>(
		(initialRole?.status || '').toLowerCase() === 'inactive' ? 'inactive' : 'active',
	);

	// TRACK INITIAL VALUES FOR DIRTY / CHANGED CHECK
	const initialNameRef = useRef<string>('');
	const initialRoleTypeRef = useRef<string>('');
	const initialStatusRef = useRef<'active' | 'inactive'>('active');
	const initialMatrixRef = useRef<Record<string, Record<string, boolean>>>({});

	// DROPDOWN OPEN STATES
	const [isRoleTypeDropdownOpen, setIsRoleTypeDropdownOpen] = useState<boolean>(false);
	const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);

	// REFS FOR DROPDOWN CLICK OUTSIDE
	const roleTypeDropdownRef = useRef<HTMLDivElement>(null);
	const statusDropdownRef = useRef<HTMLDivElement>(null);

	// PERMISSIONS MATRIX STATE: { [permId]: { [actionKey]: boolean } }
	const [permissionState, setPermissionState] = useState<Record<string, Record<string, boolean>>>(
		{},
	);

	// EXPANDED TREE NODES: Set of node ids
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

	// SYNC INITIAL ROLE DATA
	useEffect(() => {
		if (initialRole) {
			const initName = initialRole.role_name || '';
			const normType = (initialRole.role_type || '').toLowerCase().trim();
			const matchedType =
				ROLE_TYPE_OPTIONS.find((opt) => opt.value === normType)?.value || 'user';
			const initStatus: 'active' | 'inactive' =
				(initialRole.status || '').toLowerCase() === 'inactive' ? 'inactive' : 'active';

			setRoleName(initName);
			setRoleType(matchedType);
			setRoleStatus(initStatus);

			initialNameRef.current = initName;
			initialRoleTypeRef.current = matchedType;
			initialStatusRef.current = initStatus;

			// POPULATE EXISTING GRANTED PERMISSIONS FROM ACCESS OBJECT OR ACTIONS ARRAY
			const matrix: Record<string, Record<string, boolean>> = {};

			const populateFromTree = (items: any[]) => {
				if (!Array.isArray(items)) return;
				items.forEach((item: any) => {
					let permId: string | number | undefined;
					if (item.id !== undefined && item.id !== null) {
						permId = item.id;
					} else if (item.permission_id && typeof item.permission_id === 'object') {
						permId = item.permission_id.id;
					} else if (item.permission_id) {
						permId = item.permission_id;
					}

					if (permId !== undefined) {
						const permIdStr = String(permId);
						if (!matrix[permIdStr]) {
							matrix[permIdStr] = {};
						}

						// 1. POPULATE FROM DIRECT ACCESS OBJECT: { read: true, delete: true, create: false }
						if (item.access && typeof item.access === 'object') {
							Object.entries(item.access).forEach(([actName, isAllowed]) => {
								const clean = actName.toLowerCase().trim();
								const val = isAllowed === true || isAllowed === 1 || isAllowed === '1';
								matrix[permIdStr][clean] = val;
								if (clean === 'edit' || clean === 'update') {
									matrix[permIdStr].edit = val;
									matrix[permIdStr].update = val;
								}
								if (clean === 'read' || clean === 'view') {
									matrix[permIdStr].read = val;
									matrix[permIdStr].view = val;
								}
							});
						}

						// 2. POPULATE FROM ACTIONS ARRAY OF OBJECTS: [{ create: true }, { read: true }]
						if (Array.isArray(item.actions)) {
							item.actions.forEach((actObj: any) => {
								if (typeof actObj === 'object' && actObj !== null) {
									Object.entries(actObj).forEach(([actName, isAllowed]) => {
										const clean = actName.toLowerCase().trim();
										const val = isAllowed === true || isAllowed === 1 || isAllowed === '1';
										matrix[permIdStr][clean] = val;
										if (clean === 'edit' || clean === 'update') {
											matrix[permIdStr].edit = val;
											matrix[permIdStr].update = val;
										}
										if (clean === 'read' || clean === 'view') {
											matrix[permIdStr].read = val;
											matrix[permIdStr].view = val;
										}
									});
								}
							});
						}

						// 3. DIRECT BOOLEAN PROPERTIES: read, create, update, etc.
						const booleanKeys = [
							'read',
							'create',
							'update',
							'edit',
							'delete',
							'reset_password',
							'export',
							'import',
							'approve',
						];
						booleanKeys.forEach((k) => {
							if (item[k] !== undefined) {
								const val = item[k] === true || item[k] === 1 || item[k] === '1';
								matrix[permIdStr][k] = val;
								if (k === 'edit' || k === 'update') {
									matrix[permIdStr].edit = val;
									matrix[permIdStr].update = val;
								}
								if (k === 'read' || k === 'view') {
									matrix[permIdStr].read = val;
									matrix[permIdStr].view = val;
								}
							}
						});
					}

					// RECURSIVELY PROCESS CHILDREN
					if (Array.isArray(item.children) && item.children.length > 0) {
						populateFromTree(item.children);
					}
				});
			};

			const rawPerms =
				initialRole.role_access ||
				initialRole.permissions ||
				initialRole.role_permissions ||
				initialRole.access ||
				[];

			populateFromTree(rawPerms);
			setPermissionState(matrix);
			initialMatrixRef.current = JSON.parse(JSON.stringify(matrix));
		}
	}, [initialRole]);

	// EXPAND ALL ROOT NODES BY DEFAULT
	useEffect(() => {
		if (allSystemPermissions.length > 0) {
			const rootIds = new Set<string>();
			const collectIds = (items: any[]) => {
				items.forEach((p) => {
					rootIds.add(String(p.id));
					if (Array.isArray(p.children)) {
						collectIds(p.children);
					}
				});
			};
			collectIds(allSystemPermissions);
			setExpandedNodes(rootIds);
		}
	}, [allSystemPermissions]);

	// CLOSE DROPDOWNS ON OUTSIDE CLICK
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				roleTypeDropdownRef.current &&
				!roleTypeDropdownRef.current.contains(event.target as Node)
			) {
				setIsRoleTypeDropdownOpen(false);
			}
			if (
				statusDropdownRef.current &&
				!statusDropdownRef.current.contains(event.target as Node)
			) {
				setIsStatusDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const selectedRoleTypeOption = useMemo<IRoleTypeOption>(() => {
		const found = ROLE_TYPE_OPTIONS.find((opt) => opt.value === roleType);
		if (found) return found;
		return ROLE_TYPE_OPTIONS[0];
	}, [roleType]);

	const selectedStatusOption = useMemo<IStatusOption>(() => {
		const found = STATUS_OPTIONS.find((opt) => opt.value === roleStatus);
		if (found) return found;
		return STATUS_OPTIONS[0];
	}, [roleStatus]);

	// BUILD HIERARCHICAL PERMISSION TREE WITH DISPLAY ORDER
	const permissionTree = useMemo<ITreePermissionNode[]>(() => {
		if (allSystemPermissions.length === 0) return [];

		const childrenByParentId: Record<string, IPermissionItem[]> = {};
		allSystemPermissions.forEach((item) => {
			if (Array.isArray(item.children) && item.children.length > 0) {
				const parentIdStr = String(item.id);
				if (!childrenByParentId[parentIdStr]) childrenByParentId[parentIdStr] = [];
				item.children.forEach((c: any) => childrenByParentId[parentIdStr].push(c));
			}
		});

		const extractActions = (permDef: any): string[] => {
			const actionsSet = new Set<string>();

			// 1. EXTRACT ACTIONS FROM ACCESS OBJECT: { create: true, read: true, update: true, delete: true }
			if (permDef.access && typeof permDef.access === 'object') {
				Object.keys(permDef.access).forEach((k) => {
					const clean = k.toLowerCase().trim();
					actionsSet.add(clean);
				});
			}

			// 2. EXTRACT ACTIONS FROM ACTIONS ARRAY
			if (Array.isArray(permDef.actions) && permDef.actions.length > 0) {
				permDef.actions.forEach((act: any) => {
					if (typeof act === 'object' && act !== null) {
						Object.keys(act).forEach((k) => {
							const clean = k.toLowerCase().trim();
							actionsSet.add(clean);
						});
					} else if (typeof act === 'string') {
						const clean = act.toLowerCase().trim();
						actionsSet.add(clean);
					}
				});
			}

			// 3. EXTRACT ACTIONS FROM PERMISSIONS ARRAY
			if (Array.isArray(permDef.permissions) && permDef.permissions.length > 0) {
				permDef.permissions.forEach((p: any) => {
					if (typeof p === 'string') {
						const clean = p.toLowerCase().trim();
						actionsSet.add(clean);
					}
				});
			}

			if (actionsSet.size === 0) {
				return ['read'];
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
			const sorted = Array.from(actionsSet).sort((a, b) => {
				const idxA = standardOrder.indexOf(a);
				const idxB = standardOrder.indexOf(b);
				if (idxA !== -1 && idxB !== -1) return idxA - idxB;
				if (idxA !== -1) return -1;
				if (idxB !== -1) return 1;
				return a.localeCompare(b);
			});

			return sorted;
		};

		const buildTreeNode = (p: IPermissionItem): ITreePermissionNode => {
			const idStr = String(p.id);
			const rawChildren = (Array.isArray(p.children) && p.children.length > 0) ? p.children : (childrenByParentId[idStr] || []);

			const sortedChildren = [...rawChildren].sort((a, b) => {
				const orderA = a.display_order !== undefined && a.display_order !== null ? Number(a.display_order) : 999;
				const orderB = b.display_order !== undefined && b.display_order !== null ? Number(b.display_order) : 999;
				return orderA - orderB;
			});

			const childNodes = sortedChildren.map(buildTreeNode);
			const actions = extractActions(p);
			const icon = resolveIcon(p, p.permission_key || '', p.name);

			return {
				id: idStr,
				name: p.name,
				permissionKey: p.permission_key || p.name,
				displayOrder: p.display_order !== undefined && p.display_order !== null ? Number(p.display_order) : 999,
				icon,
				parentId: p.parent_id ? String(p.parent_id) : null,
				actions,
				children: childNodes,
			};
		};

		const sortedRoots = [...allSystemPermissions].sort((a, b) => {
			const orderA = a.display_order !== undefined && a.display_order !== null ? Number(a.display_order) : 999;
			const orderB = b.display_order !== undefined && b.display_order !== null ? Number(b.display_order) : 999;
			return orderA - orderB;
		});

		const roots: ITreePermissionNode[] = [];
		sortedRoots.forEach((root) => {
			if (!root.parent_id) {
				roots.push(buildTreeNode(root));
			}
		});

		return roots;
	}, [allSystemPermissions]);

	// CHECK IF ACTION IS ACTIVE
	const isActionActive = useCallback(
		(nodeId: string, actionKey: string): boolean => {
			const nodeMap = permissionState[nodeId];
			if (!nodeMap) return false;
			const clean = actionKey.toLowerCase().trim();
			if (nodeMap[clean] === true) return true;
			if (clean === 'edit' && nodeMap.update === true) return true;
			if (clean === 'update' && nodeMap.edit === true) return true;
			if (clean === 'read' && nodeMap.view === true) return true;
			if (clean === 'view' && nodeMap.read === true) return true;
			return false;
		},
		[permissionState],
	);

	// CHECK IF ACTION WAS INITIALLY ACTIVE
	const isInitialActionActive = useCallback(
		(nodeId: string, actionKey: string): boolean => {
			const nodeMap = initialMatrixRef.current[nodeId];
			if (!nodeMap) return false;
			const clean = actionKey.toLowerCase().trim();
			if (nodeMap[clean] === true) return true;
			if (clean === 'edit' && nodeMap.update === true) return true;
			if (clean === 'update' && nodeMap.edit === true) return true;
			if (clean === 'read' && nodeMap.view === true) return true;
			if (clean === 'view' && nodeMap.read === true) return true;
			return false;
		},
		[],
	);

	// GET SELECTION STATE FOR TREE NODE
	const getNodeSelectionState = useCallback(
		(node: ITreePermissionNode): { isChecked: boolean; isIndeterminate: boolean } => {
			if (node.children.length === 0) {
				const nodeActions = node.actions;
				if (nodeActions.length === 0) {
					return { isChecked: false, isIndeterminate: false };
				}

				const grantedCount = nodeActions.filter((act) => isActionActive(node.id, act)).length;

				if (grantedCount === nodeActions.length && grantedCount > 0) {
					return { isChecked: true, isIndeterminate: false };
				}
				if (grantedCount > 0 && grantedCount < nodeActions.length) {
					return { isChecked: false, isIndeterminate: true };
				}
				return { isChecked: false, isIndeterminate: false };
			}

			let allChildrenFull = true;
			let anyChildActive = false;

			node.children.forEach((child) => {
				const childState = getNodeSelectionState(child);
				if (!childState.isChecked) {
					allChildrenFull = false;
				}
				if (childState.isChecked || childState.isIndeterminate) {
					anyChildActive = true;
				}
			});

			if (allChildrenFull && node.children.length > 0) {
				return { isChecked: true, isIndeterminate: false };
			}
			if (anyChildActive) {
				return { isChecked: false, isIndeterminate: true };
			}
			return { isChecked: false, isIndeterminate: false };
		},
		[isActionActive],
	);

	// TOGGLE INDIVIDUAL ACTION
	const handleToggleAction = (nodeId: string, actionKey: string) => {
		const cleanKey = actionKey.toLowerCase().trim();
		const currentActive = isActionActive(nodeId, cleanKey);
		const targetVal = !currentActive;

		setPermissionState((prev) => {
			const currentModuleMap = prev[nodeId] || {};
			const updatedMap: Record<string, boolean> = {
				...currentModuleMap,
				[cleanKey]: targetVal,
			};

			if (cleanKey === 'edit' || cleanKey === 'update') {
				updatedMap.edit = targetVal;
				updatedMap.update = targetVal;
			}
			if (cleanKey === 'read' || cleanKey === 'view') {
				updatedMap.read = targetVal;
				updatedMap.view = targetVal;
			}

			return {
				...prev,
				[nodeId]: updatedMap,
			};
		});
	};

	// TOGGLE NODE AND ALL DESCENDANTS
	const handleToggleNode = (node: ITreePermissionNode) => {
		const { isChecked, isIndeterminate } = getNodeSelectionState(node);
		const targetCheckedState = !(isChecked || isIndeterminate);

		setPermissionState((prev) => {
			const nextState = { ...prev };

			const applyCheck = (currNode: ITreePermissionNode) => {
				if (currNode.children.length === 0) {
					const nodeActions = currNode.actions;
					const updatedMap: Record<string, boolean> = { ...(nextState[currNode.id] || {}) };
					nodeActions.forEach((act) => {
						const clean = act.toLowerCase().trim();
						updatedMap[clean] = targetCheckedState;
						if (clean === 'edit' || clean === 'update') {
							updatedMap.edit = targetCheckedState;
							updatedMap.update = targetCheckedState;
						}
						if (clean === 'read' || clean === 'view') {
							updatedMap.read = targetCheckedState;
							updatedMap.view = targetCheckedState;
						}
					});
					nextState[currNode.id] = updatedMap;
				} else {
					currNode.children.forEach(applyCheck);
				}
			};

			applyCheck(node);
			return nextState;
		});
	};

	// EXPAND / COLLAPSE
	const handleToggleExpand = (nodeId: string) => {
		setExpandedNodes((prev) => {
			const next = new Set(prev);
			if (next.has(nodeId)) {
				next.delete(nodeId);
			} else {
				next.add(nodeId);
			}
			return next;
		});
	};

	// SUBMIT HANDLER
	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!roleName.trim()) {
			showNotification('Validation Error', 'Please enter a Role Name', 'warning');
			return;
		}

		// BUILD EXACT ACCESSES PAYLOAD AND CHECK FOR CHANGES
		const accessesPayload: any[] = [];
		let hasAccessesChanged = false;

		const processNodeForAccess = (node: ITreePermissionNode) => {
			if (node.children.length > 0) {
				node.children.forEach(processNodeForAccess);
			} else if (node.actions.length > 0) {
				const permIdNum = Number(node.id) || node.id;
				const actionsObj: Record<string, boolean> = {};

				node.actions.forEach((act) => {
					const clean = act.toLowerCase().trim();
					const isActive = isActionActive(node.id, clean);
					const initialActive = isInitialActionActive(node.id, clean);
					if (isActive !== initialActive) {
						hasAccessesChanged = true;
					}
					actionsObj[clean] = isActive;
				});

				accessesPayload.push({
					permission_id: permIdNum,
					actions: actionsObj,
				});
			}
		};

		permissionTree.forEach(processNodeForAccess);

		const hasNameChanged = roleName.trim() !== (initialNameRef.current || '').trim();
		const hasRoleTypeChanged = roleType !== initialRoleTypeRef.current;
		const currentNormalizedStatus = roleStatus === 'inactive' ? 'inactive' : 'active';
		const hasStatusChanged = currentNormalizedStatus !== initialStatusRef.current;
		const hasAnyChange =
			hasNameChanged || hasRoleTypeChanged || hasStatusChanged || hasAccessesChanged;

		if (mode === 'add') {
			const payload: IRoleFormData = {
				role_name: roleName.trim(),
				role_status: currentNormalizedStatus,
				role_type: roleType,
				accesses: accessesPayload,
			};
			await onSubmit(payload);
		} else {
			if (!hasAnyChange) {
				showNotification('Info', 'No changes were made to update', 'info');
				navigate(-1);
				return;
			}

			// EDIT MODE: INCLUDE UPDATED DATA FOR API
			const payload: IRoleFormData = {
				role_name: roleName.trim(),
				role_status: currentNormalizedStatus,
				role_type: roleType,
				accesses: accessesPayload,
			};

			await onSubmit(payload);
		}
	};

	const titleText = mode === 'add' ? 'Add New Role' : (initialRole?.role_name || 'Role Details');
	const saveButtonText = mode === 'add' ? 'Save Role' : 'Save Changes';
	const savingButtonText = mode === 'add' ? 'Creating...' : 'Saving...';

	return (
		<div className='role-edit-page'>
			{/* TOP FIXED HEADER SECTION */}
			<div className='role-edit-header'>
				<div className='role-title-section'>
					{/* BREADCRUMBS */}
					<AppBreadcrumbs
						items={[
							{ label: 'User Management' },
							{ label: 'Roles', to: `/${PAGE_ROUTES.ROLES}` },
							{ label: titleText, current: true },
						]}
					/>

					{/* HEADING */}
					<h2 className='role-name-heading'>{titleText}</h2>
				</div>

				{/* HEADER ACTIONS */}
				<div className='role-header-actions'>
					<button
						type='button'
						className='btn-cancel-action'
						onClick={() => navigate(-1)}>
						<Icon icon='ArrowBack' size='sm' />
						<span>Cancel</span>
					</button>

					{/* DELETE BUTTON (IF EDIT MODE AND PERMITTED) */}
					{mode === 'edit' && canDelete && onDeleteClick && (
						<button
							type='button'
							className='btn-delete-action'
							onClick={onDeleteClick}>
							<Icon icon='DeleteOutline' size='sm' />
							<span>Delete</span>
						</button>
					)}

					<button
						type='submit'
						form='role-form'
						disabled={isSaving}
						className='btn-save-action'>
						{isSaving ? (
							<>
								<Spinner size='sm' isGrow={false} />
								<span>{savingButtonText}</span>
							</>
						) : (
							<>
								<Icon icon='Save' size='sm' />
								<span>{saveButtonText}</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* FORM CONTAINER */}
			<form id='role-form' onSubmit={handleFormSubmit} className='role-edit-form'>
				{/* BASIC ROLE INFORMATION CARD */}
				<div className='role-form-card role-info-card'>
					<div className='card-header-bar'>
						<div className='card-header-icon'>
							<Icon icon='Badge' />
						</div>
						<div>
							<h4 className='card-header-title'>Role Information</h4>
							<p className='card-header-subtitle'>
								Configure role name and general attributes
							</p>
						</div>
					</div>

					<div className='card-body-content row g-3'>
						{/* ROLE NAME */}
						<div className='col-md-6 col-12'>
							<label htmlFor='roleName' className='form-label fw-bold'>
								Role Name <span className='text-danger'>*</span>
							</label>
							<input
								id='roleName'
								type='text'
								className='form-control role-name-input'
								placeholder='e.g. Store_Admin'
								value={roleName}
								onChange={(e) => setRoleName(e.target.value)}
								required
							/>
						</div>

						{/* REACT-SELECT STYLED ROLE TYPE DROPDOWN */}
						<div className='col-md-3 col-6' ref={roleTypeDropdownRef}>
							<span className='form-label fw-bold d-block'>Role Type</span>
							<div className='custom-react-select-wrapper'>
								<button
									type='button'
									className={`custom-react-select-control ${isRoleTypeDropdownOpen ? 'is-open' : ''}`}
									onClick={() => {
										setIsRoleTypeDropdownOpen(!isRoleTypeDropdownOpen);
										setIsStatusDropdownOpen(false);
									}}>
									<div className='select-value-display'>
										<span className='select-text-value'>
											{selectedRoleTypeOption.label}
										</span>
									</div>
									<span className={`select-arrow-icon ${isRoleTypeDropdownOpen ? 'is-open' : ''}`}>
										<Icon icon='KeyboardArrowDown' size='sm' />
									</span>
								</button>

								{isRoleTypeDropdownOpen && (
									<div className='custom-react-select-menu'>
										{ROLE_TYPE_OPTIONS.map((opt) => (
											<button
												key={opt.value}
												type='button'
												className={`custom-react-select-option ${roleType === opt.value ? 'is-selected' : ''}`}
												onClick={() => {
													setRoleType(opt.value);
													setIsRoleTypeDropdownOpen(false);
												}}>
												<span className='option-label-text'>{opt.label}</span>
												{roleType === opt.value && (
													<span className='option-check-icon'>
														<Icon icon='Check' size='sm' />
													</span>
												)}
											</button>
										))}
									</div>
								)}
							</div>
						</div>

						{/* REACT-SELECT STYLED STATUS DROPDOWN */}
						<div className='col-md-3 col-6' ref={statusDropdownRef}>
							<span className='form-label fw-bold d-block'>Status</span>
							<div className='custom-react-select-wrapper'>
								<button
									type='button'
									className={`custom-react-select-control ${isStatusDropdownOpen ? 'is-open' : ''}`}
									onClick={() => {
										setIsStatusDropdownOpen(!isStatusDropdownOpen);
										setIsRoleTypeDropdownOpen(false);
									}}>
									<div className='select-value-display d-flex align-items-center gap-2'>
										<span
											className='status-dot-indicator'
											style={{ backgroundColor: selectedStatusOption.color }}
										/>
										<span className='select-text-value'>
											{selectedStatusOption.label}
										</span>
									</div>
									<span className={`select-arrow-icon ${isStatusDropdownOpen ? 'is-open' : ''}`}>
										<Icon icon='KeyboardArrowDown' size='sm' />
									</span>
								</button>

								{isStatusDropdownOpen && (
									<div className='custom-react-select-menu'>
										{STATUS_OPTIONS.map((opt) => (
											<button
												key={opt.value}
												type='button'
												className={`custom-react-select-option ${roleStatus === opt.value ? 'is-selected' : ''}`}
												onClick={() => {
													setRoleStatus(opt.value);
													setIsStatusDropdownOpen(false);
												}}>
												<div className='d-flex align-items-center gap-2'>
													<span
														className='status-dot-indicator'
														style={{ backgroundColor: opt.color }}
													/>
													<span className='option-label-text'>{opt.label}</span>
												</div>
												{roleStatus === opt.value && (
													<span className='option-check-icon'>
														<Icon icon='Check' size='sm' />
													</span>
												)}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* HIERARCHICAL PERMISSIONS TREE CARD */}
				<div className='role-form-card permissions-tree-card'>
					<div className='card-header-bar'>
						<div className='card-header-icon'>
							<Icon icon='Security' />
						</div>
						<div>
							<h4 className='card-header-title'>Permissions :</h4>
							<p className='card-header-subtitle'>
								Assign module and sub-module access permissions
							</p>
						</div>
					</div>

					<div className='permissions-tree-container'>
						{permissionTree.length > 0 ? (
							permissionTree.map((rootNode) => {
								const rootState = getNodeSelectionState(rootNode);
								const isRootExpanded = expandedNodes.has(rootNode.id);
								const hasRootChildren = rootNode.children.length > 0;
								const hasRootActions = rootNode.actions.length > 0;

								return (
									<div key={`tree-${rootNode.id}`} className='tree-root-item'>
										{/* ROOT ROW */}
										<div className='tree-node-row'>
											{(hasRootChildren || hasRootActions) ? (
												<button
													type='button'
													className='tree-caret-btn'
													onClick={() => handleToggleExpand(rootNode.id)}
													title={isRootExpanded ? 'Collapse' : 'Expand'}>
													<span className={`caret-arrow ${isRootExpanded ? 'is-open' : ''}`}>
														{isRootExpanded ? '▾' : '▸'}
													</span>
												</button>
											) : (
												<span className='tree-caret-placeholder' />
											)}

											<input
												id={`tree-root-check-${rootNode.id}`}
												type='checkbox'
												className={`tree-checkbox ${rootState.isIndeterminate ? 'is-indeterminate' : ''}`}
												checked={rootState.isChecked}
												ref={(el) => {
													if (el) el.indeterminate = rootState.isIndeterminate;
												}}
												onChange={() => handleToggleNode(rootNode)}
											/>
											<label
												htmlFor={`tree-root-check-${rootNode.id}`}
												className='tree-checkbox-label'>
												<span className='tree-node-name root-name'>{rootNode.name}</span>
											</label>
										</div>

										{/* EXPANDED CONTENT */}
										{isRootExpanded && (
											<div className='tree-expanded-body'>
												{/* 1. NESTED SUB-MODULE CHILDREN */}
												{hasRootChildren &&
													rootNode.children.map((childNode) => {
														const childState = getNodeSelectionState(childNode);
														const isChildExpanded = expandedNodes.has(childNode.id);
														const hasChildActions = childNode.actions.length > 0;

														return (
															<div key={`child-${childNode.id}`} className='tree-child-item'>
																<div className='tree-node-row child-row'>
																	{hasChildActions ? (
																		<button
																			type='button'
																			className='tree-caret-btn'
																			onClick={() => handleToggleExpand(childNode.id)}
																			title={isChildExpanded ? 'Collapse' : 'Expand'}>
																			<span className={`caret-arrow ${isChildExpanded ? 'is-open' : ''}`}>
																				{isChildExpanded ? '▾' : '▸'}
																			</span>
																		</button>
																	) : (
																		<span className='tree-caret-placeholder' />
																	)}

																	<input
																		id={`tree-child-check-${childNode.id}`}
																		type='checkbox'
																		className={`tree-checkbox ${childState.isIndeterminate ? 'is-indeterminate' : ''}`}
																		checked={childState.isChecked}
																		ref={(el) => {
																			if (el) el.indeterminate = childState.isIndeterminate;
																		}}
																		onChange={() => handleToggleNode(childNode)}
																	/>
																	<label
																		htmlFor={`tree-child-check-${childNode.id}`}
																		className='tree-checkbox-label'>
																		<span className='tree-node-name child-name'>{childNode.name}</span>
																	</label>
																</div>

																{/* CHILD ACTIONS */}
																{isChildExpanded && hasChildActions && (
																	<div className='tree-actions-list'>
																		{childNode.actions.map((act) => {
																			const isActChecked = isActionActive(childNode.id, act);
																			const actCheckId = `child-act-${childNode.id}-${act}`;
																			return (
																				<div key={actCheckId} className='tree-action-item'>
																					<input
																						id={actCheckId}
																						type='checkbox'
																						className='tree-checkbox'
																						checked={isActChecked}
																						onChange={() =>
																							handleToggleAction(childNode.id, act)
																						}
																					/>
																					<label
																						htmlFor={actCheckId}
																						className='tree-action-checkbox-label'>
																						<span className='action-label-text'>
																							{getActionLabel(act)}
																						</span>
																					</label>
																				</div>
																			);
																		})}
																	</div>
																)}
															</div>
														);
													})}

												{/* 2. ROOT ACTIONS IF NO SUB-MODULES */}
												{!hasRootChildren && hasRootActions && (
													<div className='tree-actions-list root-actions-list'>
														{rootNode.actions.map((act) => {
															const isActChecked = isActionActive(rootNode.id, act);
															const rootActId = `root-act-${rootNode.id}-${act}`;
															return (
																<div key={rootActId} className='tree-action-item'>
																	<input
																		id={rootActId}
																		type='checkbox'
																		className='tree-checkbox'
																		checked={isActChecked}
																		onChange={() =>
																			handleToggleAction(rootNode.id, act)
																		}
																	/>
																	<label
																		htmlFor={rootActId}
																		className='tree-action-checkbox-label'>
																		<span className='action-label-text'>
																			{getActionLabel(act)}
																		</span>
																	</label>
																</div>
															);
														})}
													</div>
												)}
											</div>
										)}
									</div>
								);
							})
						) : (
							<div className='no-tree-nodes'>
								<Icon icon='Security' size='2x' />
								<p className='mt-2 mb-0 fw-medium'>No permissions available</p>
							</div>
						)}
					</div>
				</div>
			</form>
		</div>
	);
};

(RoleForm as any).propTypes = {
	mode: PropTypes.oneOf(['add', 'edit']).isRequired,
	initialRole: PropTypes.shape({}),
	allSystemPermissions: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	isSaving: PropTypes.bool.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onDeleteClick: PropTypes.func,
	canDelete: PropTypes.bool,
};

RoleForm.defaultProps = {
	initialRole: null,
	onDeleteClick: undefined,
	canDelete: false,
};

export default RoleForm;
