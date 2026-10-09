/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import AppBreadcrumbs from '../../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import ListingPagination from '../../../../components/common/ListingPage/ListingPagination';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import useDebounce from '../../../../hooks/useDebounce';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { getImageUrl } from '../../../../helpers/helpers';
import roleService from '../../role/service/roleService';
import userService from '../users/service/userService';
import operatorCommissionService from './service/operatorCommissionService';
import { IRoleItem } from '../../role/type/role-type';
import { IActiveAdminItem } from '../users/type/user-type';
import {
	ICategorySummaryItem,
	IOperatorCommissionRow,
	IOperatorCommissionDetail,
	TCommissionType,
	TCommissionStatus,
} from './type/operator-commission-type';
import './ManageCommission.scss';

// OPERATOR AVATAR INITIALS
const getOperatorInitials = (name?: string) => {
	if (!name) return 'OP';
	const parts = name.trim().split(/\s+/);
	if (parts.length >= 2) {
		return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
};

// VIBRANT COLOR PALETTE FOR OPERATORS
const AVATAR_COLORS = [
	'#ef4444',
	'#3b82f6',
	'#10b981',
	'#f97316',
	'#8b5cf6',
	'#06b6d4',
	'#d97706',
	'#ec4899',
];

const getAvatarBg = (id: number | string) => {
	const num = typeof id === 'number' ? id : parseInt(id, 10) || 0;
	return AVATAR_COLORS[num % AVATAR_COLORS.length];
};

// RESOLVE INITIAL COMMISSION TYPE (DEFAULTS TO FLAT FOR UNSAVED/UNCONFIGURED ROWS)
const getInitialCommissionType = (
	commission?: IOperatorCommissionDetail | null,
): TCommissionType => {
	if (!commission) return 'FLAT';
	// If commission has no persisted id (unconfigured/default), default to FLAT
	if (!commission.id) {
		return 'FLAT';
	}
	const rawType = String(
		commission.type || (commission as any).commission_type || '',
	)
		.trim()
		.toUpperCase();
	if (rawType === 'PERCENTAGE' || rawType === 'PERCENT') {
		return 'PERCENTAGE';
	}
	return 'FLAT';
};

interface IRowEditState {
	type: TCommissionType;
	value: string;
	status: TCommissionStatus;
}

export interface IManageCommissionPageProps {
	isSelf?: boolean;
}

export const ManageCommissionPage: FC<IManageCommissionPageProps> = ({ isSelf = false }) => {
	// PERMISSION CHECKS: Check specific manage_commission action or write/update permission on manage_commission
	const { hasPermission, permissionsMap } = usePermission();
	const canManageCommission = useMemo(() => {
		if (isSelf) return false;

		// 1. Check permissionsMap for specific manage_commission or users module permission object
		const mcPerm =
			permissionsMap[PERMISSION_KEYS.MANAGE_COMMISSION] ||
			permissionsMap.manage_commission ||
			permissionsMap['manage-commission'] ||
			permissionsMap.manage_commissions ||
			permissionsMap[PERMISSION_KEYS.USERS] ||
			permissionsMap[PERMISSION_KEYS.USER_MANAGEMENT];

		// If access explicitly specifies manage_commission boolean: e.g. { read: true, manage_commission: false }
		if (mcPerm?.manage_commission !== undefined) {
			return Boolean(mcPerm.manage_commission);
		}
		if (mcPerm?.['manage-commission'] !== undefined) {
			return Boolean(mcPerm['manage-commission']);
		}

		// 2. Check explicit manage_commission action via hasPermission
		if (hasPermission(PERMISSION_KEYS.MANAGE_COMMISSION, 'manage_commission')) {
			return true;
		}
		if (hasPermission(PERMISSION_KEYS.USERS, 'manage_commission')) {
			return true;
		}
		if (hasPermission(PERMISSION_KEYS.USER_MANAGEMENT, 'manage_commission')) {
			return true;
		}

		// 3. Check explicit update / edit / write action on MANAGE_COMMISSION permission specifically
		const manageCommissionPerm =
			permissionsMap[PERMISSION_KEYS.MANAGE_COMMISSION] ||
			permissionsMap.manage_commission ||
			permissionsMap['manage-commission'];

		if (manageCommissionPerm) {
			return Boolean(
				manageCommissionPerm.update ||
				manageCommissionPerm.edit ||
				manageCommissionPerm.write ||
				manageCommissionPerm.create ||
				manageCommissionPerm.manage_commission,
			);
		}

		return false;
	}, [hasPermission, permissionsMap, isSelf]);

	// TOP DROPDOWN STATES
	const [roles, setRoles] = useState<IRoleItem[]>([]);
	const [selectedRoleId, setSelectedRoleId] = useState<string>('');
	const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(true);
	const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
	const [roleSearchQuery, setRoleSearchQuery] = useState<string>('');
	const debouncedRoleSearch = useDebounce(roleSearchQuery, 300);
	const roleDropdownRef = useRef<HTMLDivElement>(null);

	const [users, setUsers] = useState<IActiveAdminItem[]>([]);
	const [selectedUserId, setSelectedUserId] = useState<string>('');
	const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
	const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
	const [userSearchQuery, setUserSearchQuery] = useState<string>('');
	const debouncedUserSearch = useDebounce(userSearchQuery, 300);
	const userDropdownRef = useRef<HTMLDivElement>(null);

	// CLOSE DROPDOWNS ON OUTSIDE CLICK
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				roleDropdownRef.current &&
				!roleDropdownRef.current.contains(event.target as Node)
			) {
				setIsRoleDropdownOpen(false);
			}
			if (
				userDropdownRef.current &&
				!userDropdownRef.current.contains(event.target as Node)
			) {
				setIsUserDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// COMMISSION DATA STATES
	const [commissionRows, setCommissionRows] = useState<IOperatorCommissionRow[]>([]);
	const [categories, setCategories] = useState<ICategorySummaryItem[]>([]);
	const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearchTerm = useDebounce(searchTerm, 400);

	const [isLoadingCommissions, setIsLoadingCommissions] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);
	const [totalRecords, setTotalRecords] = useState<number>(0);

	// ROW MODIFICATIONS TRACKER (operator_id -> IRowEditState)
	const [rowEdits, setRowEdits] = useState<Record<number, IRowEditState>>({});
	const [savingRowId, setSavingRowId] = useState<number | null>(null);
	const [isBulkSaving, setIsBulkSaving] = useState<boolean>(false);

	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);
	const lastFetchedRoleSearchRef = useRef<string | null>(null);
	const lastFetchedUserKeyRef = useRef<string>('');

	// 1. FETCH ACTIVE ROLES (SUPPORTS SERVER-SIDE SEARCH QUERY)
	const fetchActiveRoles = useCallback(async (searchQuery?: string) => {
		if (isSelf) return;
		setIsLoadingRoles(true);

		try {
			const res = await roleService.getActiveRoles({
				page: 1,
				limit: 100,
				hide_super_admin: true,
				search: searchQuery?.trim() || undefined,
			});

			let extractedData: IRoleItem[] = [];
			if (Array.isArray(res?.data)) {
				extractedData = res.data;
			} else if (Array.isArray((res as any)?.data?.data)) {
				extractedData = (res as any).data.data;
			}

			setRoles(extractedData);
		} catch (error: any) {
			showNotification(
				'Error loading roles',
				error?.data?.message || error?.message || 'Could not fetch active roles.',
				'danger',
			);
			setRoles([]);
		} finally {
			setIsLoadingRoles(false);
		}
	}, [isSelf]);

	useEffect(() => {
		if (!isSelf) {
			const query = debouncedRoleSearch?.trim() || '';
			if (lastFetchedRoleSearchRef.current !== query) {
				lastFetchedRoleSearchRef.current = query;
				fetchActiveRoles(query);
			}
		}
	}, [isSelf, debouncedRoleSearch, fetchActiveRoles]);

	// 2. FETCH ACTIVE USERS ON ROLE CHANGE (SUPPORTS SERVER-SIDE SEARCH QUERY)
	const fetchActiveUsersByRole = useCallback(
		async (roleId: string | number, searchQuery?: string) => {
			if (isSelf || !roleId) {
				setUsers([]);
				setSelectedUserId('');
				return;
			}

			setIsLoadingUsers(true);
			try {
				const res = await userService.getActiveAdmins({
					role_id: roleId,
					page: 1,
					limit: 100,
					hide_super_admin: true,
					search: searchQuery?.trim() || undefined,
				});

				let extractedUsers: IActiveAdminItem[] = [];
				if (Array.isArray(res?.data)) {
					extractedUsers = res.data;
				} else if (Array.isArray((res as any)?.data?.data)) {
					extractedUsers = (res as any).data.data;
				}

				setUsers(extractedUsers);
			} catch (error: any) {
				showNotification(
					'Error loading users',
					error?.data?.message ||
						error?.message ||
						'Could not fetch users for the selected role.',
					'danger',
				);
				setUsers([]);
			} finally {
				setIsLoadingUsers(false);
			}
		},
		[isSelf],
	);

	// REFETCH ACTIVE USERS WHEN ROLE OR USER SEARCH CHANGES
	useEffect(() => {
		if (!isSelf && selectedRoleId) {
			const key = `${selectedRoleId}_${debouncedUserSearch?.trim() || ''}`;
			if (lastFetchedUserKeyRef.current !== key) {
				lastFetchedUserKeyRef.current = key;
				fetchActiveUsersByRole(selectedRoleId, debouncedUserSearch);
			}
		} else {
			lastFetchedUserKeyRef.current = '';
		}
	}, [isSelf, selectedRoleId, debouncedUserSearch, fetchActiveUsersByRole]);

	// HANDLE ROLE CHANGE
	const handleRoleChange = (newRoleId: string) => {
		setSelectedRoleId(newRoleId);
		setSelectedUserId('');
		setUserSearchQuery('');
		setCommissionRows([]);
		setCategories([]);
		setTotalRecords(0);
		setRowEdits({});
		lastFetchKeyRef.current = '';
		if (!newRoleId) {
			setUsers([]);
		}
	};

	// 3. FETCH OPERATOR COMMISSIONS FOR SELECTED USER OR CURRENT LOGGED-IN USER (isSelf)
	const fetchCommissions = useCallback(
		async (force = false) => {
			if (!isSelf && !selectedUserId) {
				setCommissionRows([]);
				setCategories([]);
				setTotalRecords(0);
				lastFetchKeyRef.current = '';
				return;
			}

			const currentFetchKey = `${isSelf ? 'self' : selectedUserId}_${selectedCategoryId}_${debouncedSearchTerm}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoadingCommissions(true);

			try {
				const res = isSelf
					? await operatorCommissionService.getMyOperatorCommissions({
							page: currentPage,
							limit: perPage,
							service_category_id: selectedCategoryId !== null ? selectedCategoryId : undefined,
							search: debouncedSearchTerm.trim() || undefined,
					  })
					: await operatorCommissionService.getOperatorCommissions({
							admin_id: selectedUserId,
							page: currentPage,
							limit: perPage,
							service_category_id: selectedCategoryId !== null ? selectedCategoryId : undefined,
							search: debouncedSearchTerm.trim() || undefined,
					  });

				const data = res?.data;
				const rows: IOperatorCommissionRow[] = Array.isArray(data?.rows) ? data.rows : [];
				const cats: ICategorySummaryItem[] = Array.isArray(data?.summary?.categories)
					? data.summary.categories
					: [];
				const total =
					data?.pagination?.total ?? (data?.summary?.total_operators || rows.length);

				setCommissionRows(rows);
				setCategories(cats);
				setTotalRecords(total);

				// Populate initial row edit values
				const initialEdits: Record<number, IRowEditState> = {};
				rows.forEach((r) => {
					initialEdits[r.operator_id] = {
						type: getInitialCommissionType(r.commission),
						value:
							r.commission?.value !== undefined && r.commission?.value !== null
								? String(r.commission.value)
								: '0.00',
						status: r.commission?.status || 'active',
					};
				});
				setRowEdits(initialEdits);
			} catch (error: any) {
				showNotification(
					'Error loading commissions',
					error?.data?.message || error?.message || 'Failed to load operator commissions.',
					'danger',
				);
				setCommissionRows([]);
				setCategories([]);
				setTotalRecords(0);
			} finally {
				setIsLoadingCommissions(false);
				isFetchingRef.current = false;
			}
		},
		[isSelf, selectedUserId, currentPage, perPage, selectedCategoryId, debouncedSearchTerm],
	);

	useEffect(() => {
		fetchCommissions();
	}, [fetchCommissions]);

	// RESET TO PAGE 1 ON FILTER / SEARCH CHANGE
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedCategoryId, debouncedSearchTerm]);

	// HANDLE ROW EDITS
	const handleRowFieldChange = (
		operatorId: number,
		field: keyof IRowEditState,
		val: any,
	) => {
		const targetRow = commissionRows.find((r) => r.operator_id === operatorId);
		if (
			targetRow &&
			(targetRow.can_edit === false || targetRow.commission?.can_edit === false)
		) {
			return;
		}
		setRowEdits((prev) => ({
			...prev,
			[operatorId]: {
				...prev[operatorId],
				[field]: val,
			},
		}));
	};

	// CHECK WHICH ROWS ARE MODIFIED FROM SERVER STATE
	const modifiedRowsMap = useMemo(() => {
		const modified: Record<number, boolean> = {};
		commissionRows.forEach((row) => {
			if (row.can_edit === false || row.commission?.can_edit === false) {
				return;
			}
			const current = rowEdits[row.operator_id];
			if (!current) return;

			const origType = getInitialCommissionType(row.commission);
			const origVal =
				row.commission?.value !== undefined && row.commission?.value !== null
					? Number(row.commission.value)
					: 0;
			const origStatus = row.commission?.status || 'active';

			const curVal = parseFloat(current.value) || 0;

			if (
				current.type !== origType ||
				curVal !== origVal ||
				current.status !== origStatus
			) {
				modified[row.operator_id] = true;
			}
		});
		return modified;
	}, [commissionRows, rowEdits]);

	const unsavedCount = Object.keys(modifiedRowsMap).length;

	// SAVE SINGLE OPERATOR ROW
	const handleSaveSingleRow = async (row: IOperatorCommissionRow) => {
		if (row.can_edit === false || row.commission?.can_edit === false) {
			return;
		}
		const current = rowEdits[row.operator_id];
		if (!current || !selectedUserId) return;

		const numVal = parseFloat(current.value);
		if (isNaN(numVal) || numVal < 0) {
			showNotification('Invalid Value', 'Please enter a non-negative commission value.', 'warning');
			return;
		}

		if (current.type === 'PERCENTAGE' && numVal > 100) {
			showNotification('Invalid Value', 'Percentage commission cannot exceed 100%.', 'warning');
			return;
		}

		setSavingRowId(row.operator_id);
		try {
			const res = await operatorCommissionService.saveOperatorCommission({
				admin_id: Number(selectedUserId),
				operator_id: row.operator_id,
				commission_type: current.type,
				commission_value: numVal,
				status: current.status,
			});

			showNotification(
				'Commission Saved',
				res?.message || `${row.name} commission updated successfully.`,
				'success',
			);

			// Update original row state to match saved values
			setCommissionRows((prev) =>
				prev.map((r) =>
					r.operator_id === row.operator_id
						? {
								...r,
								commission: {
									...r.commission,
									type: current.type,
									value: numVal,
									status: current.status,
								},
						  }
						: r,
				),
			);
		} catch (error: any) {
			showNotification(
				'Save Failed',
				error?.data?.message || error?.message || 'Could not save operator commission.',
				'danger',
			);
		} finally {
			setSavingRowId(null);
		}
	};

	// SAVE ALL MODIFIED ROWS (BULK SAVE)
	const handleSaveAllModified = async () => {
		if (unsavedCount === 0 || !selectedUserId) return;

		const payloadCommissions = Object.keys(modifiedRowsMap).map((opIdStr) => {
			const opId = Number(opIdStr);
			const current = rowEdits[opId];
			return {
				operator_id: opId,
				commission_type: current.type,
				commission_value: parseFloat(current.value) || 0,
				status: current.status,
			};
		});

		setIsBulkSaving(true);
		try {
			const res = await operatorCommissionService.bulkSaveOperatorCommissions({
				admin_id: Number(selectedUserId),
				commissions: payloadCommissions,
			});

			showNotification(
				'All Changes Saved',
				res?.message || 'Commissions updated successfully.',
				'success',
			);

			// Refresh from server to sync state
			await fetchCommissions(true);
		} catch (error: any) {
			showNotification(
				'Bulk Save Failed',
				error?.data?.message || error?.message || 'Failed to save all commission changes.',
				'danger',
			);
		} finally {
			setIsBulkSaving(false);
		}
	};

	// RESET MODIFICATIONS TO ORIGINAL VALUES
	const handleResetEdits = () => {
		const resetEdits: Record<number, IRowEditState> = {};
		commissionRows.forEach((r) => {
			resetEdits[r.operator_id] = {
				type: getInitialCommissionType(r.commission),
				value:
					r.commission?.value !== undefined && r.commission?.value !== null
						? String(r.commission.value)
						: '0.00',
				status: r.commission?.status || 'active',
			};
		});
		setRowEdits(resetEdits);
	};

	// SELECTED DETAILS FOR HEADER PREVIEW
	const selectedRoleObj = roles.find((r) => String(r.id) === String(selectedRoleId));
	const selectedUserObj = users.find((u) => String(u.id) === String(selectedUserId));

	let userPlaceholder = '-- Select User --';
	if (!selectedRoleId) {
		userPlaceholder = '-- Select Role First --';
	} else if (isLoadingUsers) {
		userPlaceholder = 'Loading Users...';
	} else if (users.length === 0) {
		userPlaceholder = '-- No Users Found --';
	}

	let emptyStateHeading = 'Manage Operator Commission';
	if (selectedRoleObj) {
		emptyStateHeading = `Select a User from ${selectedRoleObj.role_name}`;
	}

	let emptyStateDescription =
		'Please select a role and a user from the dropdowns above to view or configure customized commission structures.';
	if (selectedRoleId) {
		emptyStateDescription =
			'Select a user from the dropdown above to view or configure specific commission structures.';
	}

	return (
		<PageWrapper
			title={isSelf ? 'My Commission' : 'Manage Commission'}
			permissionKey={isSelf ? undefined : PERMISSION_KEYS.MANAGE_COMMISSION}>
			<Page container='fluid'>
				<div className='manage-commission-page'>
					{/* TOP SECTION: BREADCRUMBS */}
					<div className='commission-header-section'>
						<AppBreadcrumbs
							items={
								isSelf
									? [{ label: 'Profile' }, { label: 'My Commission' }]
									: [{ label: 'User Management' }, { label: 'Manage Commission' }]
							}
						/>
					</div>

					{/* 1. SELECTOR CARD */}
					{isSelf ? (
						<div className='commission-selector-card'>
							<div className='row g-3 align-items-center justify-content-between'>
								<div className='col-12 col-md-6'>
									<div className='d-flex align-items-center gap-3'>
										<div
											className='rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center'
											style={{ width: '44px', height: '44px', minWidth: '44px' }}>
											<Icon icon='Percent' size='lg' />
										</div>
										<div>
											<h5 className='mb-0 fw-bold text-dark'>My Commission Structure</h5>
											<p className='text-muted small mb-0'>
												View your configured commission rates across service operators.
											</p>
										</div>
									</div>
								</div>
								<div className='col-12 col-md-4'>
									<label htmlFor='myCommissionSearchInput' className='selector-label'>
										<Icon icon='Search' size='sm' className='text-primary' />
										<span>Search Operator</span>
									</label>
									<input
										id='myCommissionSearchInput'
										type='text'
										className='form-control'
										placeholder='Search operator by name or code...'
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>
							</div>
						</div>
					) : (
						<div className='commission-selector-card'>
							<div className='row g-3 align-items-end'>
								{/* ROLE DROPDOWN WITH SEARCH */}
								<div className='col-12 col-md-4'>
									<label className='selector-label'>
										<Icon icon='AdminPanelSettings' size='sm' className='text-primary' />
										<span>Select Role</span>
										<span className='text-danger'>*</span>
									</label>
									<div className='custom-searchable-select-wrapper' ref={roleDropdownRef}>
										<button
											type='button'
											disabled={isLoadingRoles}
											className={`custom-searchable-select-control ${isRoleDropdownOpen ? 'is-open' : ''}`}
											onClick={() => {
												setIsRoleDropdownOpen(!isRoleDropdownOpen);
												setIsUserDropdownOpen(false);
											}}>
											<div className='select-value-display'>
												{selectedRoleObj ? (
													<span className='select-text-value text-dark fw-semibold'>
														{selectedRoleObj.role_name}
													</span>
												) : (
													<span className='select-text-placeholder text-muted'>
														{isLoadingRoles ? 'Loading Roles...' : '-- Select Role --'}
													</span>
												)}
											</div>
											<div className='d-flex align-items-center gap-1'>
												{isLoadingRoles ? (
													<Spinner size='sm' isGrow={false} color='primary' />
												) : (
													<span className={`select-arrow-icon ${isRoleDropdownOpen ? 'is-open' : ''}`}>
														<Icon icon='KeyboardArrowDown' size='sm' />
													</span>
												)}
											</div>
										</button>

										{isRoleDropdownOpen && (
											<div className='custom-searchable-select-menu'>
												{/* INLINE SEARCH INPUT */}
												<div className='dropdown-search-box'>
													<Icon icon='Search' size='sm' className='dropdown-search-icon' />
													<input
														type='text'
														className='form-control form-control-sm'
														placeholder='Search role...'
														value={roleSearchQuery}
														onChange={(e) => setRoleSearchQuery(e.target.value)}
														onClick={(e) => e.stopPropagation()}
													/>
													{roleSearchQuery && (
														<button
															type='button'
															className='btn-clear-search'
															onClick={(e) => {
																e.stopPropagation();
																setRoleSearchQuery('');
															}}>
															<Icon icon='Close' size='sm' />
														</button>
													)}
												</div>

												{/* OPTIONS LIST */}
												<div className='dropdown-options-list'>
													{roles.length === 0 ? (
														<div className='dropdown-empty-state'>
															{isLoadingRoles ? 'Loading roles...' : 'No roles found'}
														</div>
													) : (
														roles.map((role) => {
															const isSelected = String(role.id) === String(selectedRoleId);
															return (
																<button
																	key={role.id}
																	type='button'
																	className={`dropdown-option-item ${isSelected ? 'is-selected' : ''}`}
																	onClick={() => {
																		handleRoleChange(String(role.id));
																		setIsRoleDropdownOpen(false);
																		setRoleSearchQuery('');
																	}}>
																	<span className='option-label'>{role.role_name}</span>
																	{isSelected && (
																		<Icon icon='Check' size='sm' className='text-primary' />
																	)}
																</button>
															);
														})
													)}
												</div>
											</div>
										)}
									</div>
								</div>

								{/* USER DROPDOWN WITH SEARCH */}
								<div className='col-12 col-md-4'>
									<label className='selector-label'>
										<Icon icon='Person' size='sm' className='text-primary' />
										<span>Select User</span>
										<span className='text-muted small fw-normal'>
											{selectedRoleId && `(${users.length} available)`}
										</span>
									</label>
									<div className='custom-searchable-select-wrapper' ref={userDropdownRef}>
										<button
											type='button'
											disabled={!selectedRoleId || isLoadingUsers}
											className={`custom-searchable-select-control ${isUserDropdownOpen ? 'is-open' : ''}`}
											onClick={() => {
												if (!selectedRoleId || isLoadingUsers) return;
												setIsUserDropdownOpen(!isUserDropdownOpen);
												setIsRoleDropdownOpen(false);
											}}>
											<div className='select-value-display'>
												{selectedUserObj ? (
													<span className='select-text-value text-dark fw-semibold'>
														{selectedUserObj.name}{' '}
														{selectedUserObj.username ? `(@${selectedUserObj.username})` : ''}
													</span>
												) : (
													<span className='select-text-placeholder text-muted'>
														{userPlaceholder}
													</span>
												)}
											</div>
											<div className='d-flex align-items-center gap-1'>
												{isLoadingUsers ? (
													<Spinner size='sm' isGrow={false} color='primary' />
												) : (
													<span className={`select-arrow-icon ${isUserDropdownOpen ? 'is-open' : ''}`}>
														<Icon icon='KeyboardArrowDown' size='sm' />
													</span>
												)}
											</div>
										</button>

										{isUserDropdownOpen && (
											<div className='custom-searchable-select-menu'>
												{/* INLINE SEARCH INPUT */}
												<div className='dropdown-search-box'>
													<Icon icon='Search' size='sm' className='dropdown-search-icon' />
													<input
														type='text'
														className='form-control form-control-sm'
														placeholder='Search user by name, username...'
														value={userSearchQuery}
														onChange={(e) => setUserSearchQuery(e.target.value)}
														onClick={(e) => e.stopPropagation()}
													/>
													{userSearchQuery && (
														<button
															type='button'
															className='btn-clear-search'
															onClick={(e) => {
																e.stopPropagation();
																setUserSearchQuery('');
															}}>
															<Icon icon='Close' size='sm' />
														</button>
													)}
												</div>

												{/* OPTIONS LIST */}
												<div className='dropdown-options-list'>
													{users.length === 0 ? (
														<div className='dropdown-empty-state'>
															{isLoadingUsers ? 'Loading users...' : 'No users found'}
														</div>
													) : (
														users.map((u) => {
															const isSelected = String(u.id) === String(selectedUserId);
															return (
																<button
																	key={u.id}
																	type='button'
																	className={`dropdown-option-item ${isSelected ? 'is-selected' : ''}`}
																	onClick={() => {
																		setSelectedUserId(String(u.id));
																		setCurrentPage(1);
																		setIsUserDropdownOpen(false);
																		setUserSearchQuery('');
																	}}>
																	<div className='d-flex flex-column text-start'>
																		<span className='option-label fw-semibold text-dark'>
																			{u.name}
																		</span>
																		{u.username && (
																			<span className='small text-muted'>
																				@{u.username}
																			</span>
																		)}
																	</div>
																	{isSelected && (
																		<Icon icon='Check' size='sm' className='text-primary' />
																	)}
																</button>
															);
														})
													)}
												</div>
											</div>
										)}
									</div>
								</div>

								{/* OPERATOR SEARCH INPUT */}
								<div className='col-12 col-md-4'>
									<label htmlFor='manageCommissionSearchInput' className='selector-label'>
										<Icon icon='Search' size='sm' className='text-primary' />
										<span>Search Operator</span>
									</label>
									<input
										id='manageCommissionSearchInput'
										type='text'
										className='form-control'
										placeholder='Search operator by name or code...'
										value={searchTerm}
										disabled={!selectedUserId}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>
							</div>
						</div>
					)}

					{/* 2. COMMISSION MANAGEMENT CONTENT OR EMPTY STATE */}
					{!isSelf && !selectedUserId ? (
						<div className='commission-main-card p-5 text-center'>
							<div
								className='rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center mb-3'
								style={{ width: '60px', height: '60px' }}>
								<Icon icon='Percent' size='2x' />
							</div>
							<h5 className='fw-bold text-dark mb-1'>{emptyStateHeading}</h5>
							<p className='text-muted small mb-0' style={{ maxWidth: '520px', margin: '0 auto' }}>
								{emptyStateDescription}
							</p>
						</div>
					) : (
						<div className='commission-main-card'>
							{/* A. CATEGORY FILTER TABS */}
							<div className='commission-filter-bar'>
								<div className='category-pills-list'>
									{categories.map((cat) => {
										const isAll = cat.id === null || cat.slug === 'all';
										const isActive =
											(isAll && selectedCategoryId === null) ||
											(!isAll && selectedCategoryId === cat.id);

										return (
											<button
												key={cat.id ?? 'all'}
												type='button'
												className={`category-pill-btn ${isActive ? 'active' : ''}`}
												onClick={() => setSelectedCategoryId(isAll ? null : cat.id)}>
												<span>{cat.name}</span>
												<span className='opacity-75'>({cat.count})</span>
											</button>
										);
									})}
								</div>
							</div>

							{/* B. COMMISSION TABLE */}
							<div className='commission-table-wrapper'>
								{isLoadingCommissions && (
									<div className='p-5 text-center'>
										<Spinner size='2.5rem' isGrow={false} color='primary' />
										<div className='text-muted small mt-2'>Loading operator commissions...</div>
									</div>
								)}
								{!isLoadingCommissions && commissionRows.length === 0 && (
									<div className='p-5 text-center text-muted'>
										<Icon icon='SearchOff' size='2x' className='mb-2 text-secondary' />
										<div className='fw-bold text-dark fs-6'>No Operators Found</div>
										<div className='small text-muted'>
											No operators match the selected category or search query.
										</div>
									</div>
								)}
								{!isLoadingCommissions && commissionRows.length > 0 && (
									<table className='table commission-table align-middle'>
										<thead>
											<tr>
												<th style={{ minWidth: '220px' }}>Operator</th>
												<th style={{ width: '150px' }}>Category</th>
												<th style={{ width: '190px' }}>Commission Type</th>
												<th style={{ width: '140px' }}>Commission Value</th>
												<th style={{ width: '110px' }}>Status</th>
												{canManageCommission && (
													<th style={{ width: '110px' }} className='text-end'>
														Action
													</th>
												)}
											</tr>
										</thead>
										<tbody>
											{commissionRows.map((row) => {
												const editState = rowEdits[row.operator_id] || {
													type: getInitialCommissionType(row.commission),
													value: String(row.commission?.value ?? 0),
													status: row.commission?.status || 'active',
												};

												const isRowEditable =
													canManageCommission &&
													row.can_edit !== false &&
													row.commission?.can_edit !== false;

												const isModified = Boolean(modifiedRowsMap[row.operator_id]);
												const isSaving = savingRowId === row.operator_id;

												const avatarBg = getAvatarBg(row.operator_id);
												const avatarImgUrl = row.icon ? getImageUrl(row.icon) : null;

												return (
													<tr
														key={row.operator_id}
														className={isModified ? 'row-modified' : ''}>
														{/* 1. OPERATOR */}
														<td>
															<div className='operator-cell'>
																<div
																	className='operator-avatar'
																	style={{ backgroundColor: avatarBg }}>
																	{avatarImgUrl ? (
																		<img
																			src={avatarImgUrl}
																			alt={row.name}
																			onError={(e) => {
																				(e.target as HTMLElement).style.display =
																					'none';
																			}}
																		/>
																	) : (
																		<span>{getOperatorInitials(row.name)}</span>
																	)}
																</div>
																<div className='operator-info'>
																	<span className='operator-name'>{row.name}</span>
																	<span className='operator-slug'>{row.slug}</span>
																</div>
															</div>
														</td>

														{/* 2. CATEGORY */}
														<td>
															<span className='category-badge'>
																{row.category?.name || '-'}
															</span>
														</td>

														{/* 3. COMMISSION TYPE */}
														<td>
															{isRowEditable ? (
																<div className='type-segmented-control'>
																	<button
																		type='button'
																		className={`segmented-btn ${
																			editState.type === 'FLAT' ? 'active' : ''
																		}`}
																		onClick={() =>
																			handleRowFieldChange(
																				row.operator_id,
																				'type',
																				'FLAT',
																			)
																		}>
																		Flat ₹
																	</button>
																	<button
																		type='button'
																		className={`segmented-btn ${
																			editState.type === 'PERCENTAGE' ? 'active' : ''
																		}`}
																		onClick={() =>
																			handleRowFieldChange(
																				row.operator_id,
																				'type',
																				'PERCENTAGE',
																			)
																		}>
																		Percent %
																	</button>
																</div>
															) : (
																<span className='badge bg-light text-dark border px-3 py-2 fw-semibold'>
																	{editState.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Flat (₹)'}
																</span>
															)}
														</td>

														{/* 4. COMMISSION VALUE */}
														<td>
															{isRowEditable ? (
																<div className='commission-input-box'>
																	<input
																		type='number'
																		step='0.01'
																		min='0'
																		max={
																			editState.type === 'PERCENTAGE' ? 100 : undefined
																		}
																		className='form-control'
																		value={editState.value}
																		onChange={(e) =>
																			handleRowFieldChange(
																				row.operator_id,
																				'value',
																				e.target.value,
																			)
																		}
																	/>
																</div>
															) : (
																<span className='fw-bold text-dark fs-6'>
																	{editState.value} {editState.type === 'PERCENTAGE' ? '%' : '₹'}
																</span>
															)}
														</td>

														{/* 6. STATUS */}
														<td>
															{isRowEditable ? (
																<button
																	type='button'
																	className={`status-toggle-btn ${
																		editState.status === 'active'
																			? 'status-active'
																			: 'status-inactive'
																	}`}
																	onClick={() =>
																		handleRowFieldChange(
																			row.operator_id,
																			'status',
																			editState.status === 'active'
																				? 'inactive'
																				: 'active',
																		)
																	}>
																	<span
																		className='rounded-circle bg-white'
																		style={{ width: '6px', height: '6px' }}
																	/>
																	<span>
																		{editState.status === 'active'
																			? 'Active'
																			: 'Inactive'}
																	</span>
																</button>
															) : (
																<span
																	className={`badge ${
																		editState.status === 'active'
																			? 'bg-success-subtle text-success border border-success-subtle'
																			: 'bg-danger-subtle text-danger border border-danger-subtle'
																	} px-3 py-2 rounded-pill`}>
																	● {editState.status === 'active' ? 'Active' : 'Inactive'}
																</span>
															)}
														</td>

														{/* 7. ACTION (SAVE ROW) */}
														{canManageCommission && (
															<td className='text-end'>
																{isRowEditable ? (
																	<button
																		type='button'
																		className={`btn-row-save ${
																			isModified ? 'btn-save-modified' : ''
																		}`}
																		disabled={isSaving}
																		onClick={() => handleSaveSingleRow(row)}>
																		{isSaving ? (
																			<Spinner size='sm' isGrow={false} />
																		) : (
																			<Icon icon='Save' size='sm' />
																		)}
																		<span>Save</span>
																	</button>
																) : (
																	<button
																		type='button'
																		className='btn-row-save'
																		disabled
																		title='Commission update is disabled for this operator'
																		style={{ opacity: 0.45, cursor: 'not-allowed' }}>
																		<Icon icon='Save' size='sm' />
																		<span>Save</span>
																	</button>
																)}
															</td>
														)}
													</tr>
												);
											})}
										</tbody>
									</table>
								)}
							</div>

							{/* TABLE PAGINATION */}
							{!isLoadingCommissions && totalRecords > 0 && (
								<div className='p-3 border-top bg-light-subtle'>
									<ListingPagination
										pagination={{
											currentPage,
											totalItems: totalRecords,
											perPage,
											perPageOptions: [10, 25, 50, 100],
											onPageChange: (newPage: number) => {
												setCurrentPage(newPage);
											},
											onPerPageChange: (newLimit: number) => {
												setPerPage(newLimit);
												setCurrentPage(1);
											},
										}}
									/>
								</div>
							)}
						</div>
					)}

					{/* 3. STICKY BOTTOM ACTION BAR (SHOWS ON UNSAVED CHANGES WHEN USER HAS EDIT PERMISSION) */}
					{unsavedCount > 0 && canManageCommission && (
						<div className='commission-sticky-bar'>
							<div className='bar-info'>
								<span className='pulse-dot' />
								<div>
									<span className='bar-text'>
										{unsavedCount} unsaved change{unsavedCount > 1 ? 's' : ''}
									</span>
									<span className='bar-subtext d-none d-md-inline ms-2'>
										· Commission is applied on every successful transaction
									</span>
								</div>
							</div>

							<div className='bar-actions'>
								<button
									type='button'
									className='btn-bar-reset'
									onClick={handleResetEdits}
									disabled={isBulkSaving}>
									Reset
								</button>
								<button
									type='button'
									className='btn-bar-save-all'
									onClick={handleSaveAllModified}
									disabled={isBulkSaving}>
									{isBulkSaving ? (
										<>
											<Spinner size='sm' isGrow={false} />
											<span>Saving All...</span>
										</>
									) : (
										<>
											<Icon icon='Check' size='sm' />
											<span>Save All Changes</span>
										</>
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</Page>
		</PageWrapper>
	);
};

ManageCommissionPage.propTypes = {
	isSelf: PropTypes.bool,
};

ManageCommissionPage.defaultProps = {
	isSelf: false,
};

export default ManageCommissionPage;
