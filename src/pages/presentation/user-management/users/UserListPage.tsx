/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import { PillBadge } from '../../../../components/common/PillBadge';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import { ConfirmationModal, DateRangePicker } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { encryptId } from '../../../../helpers/routeEncryption';
import { formatDateTime } from '../../../../helpers/dateUtils';
import userService from './service/userService';
import roleService from '../../role/service/roleService';
import constantService, { IConstantOption } from '../../../../services/constantService';
import { IUserItem } from './type/user-type';
import { IRoleItem } from '../../role/type/role-type';
import './css/UserManagement.scss';

export const UserListPage: FC = () => {
	const navigate = useNavigate();
	const [users, setUsers] = useState<IUserItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalUsers, setTotalUsers] = useState<number>(0);

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [userToDelete, setUserToDelete] = useState<IUserItem | null>(null);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	// AVAILABLE ROLES FOR DROPDOWN (FROM api/role/get-active)
	const [roleOptions, setRoleOptions] = useState<IRoleItem[]>([]);

	// DYNAMIC STATUS CONSTANTS (FROM api/constant/user)
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
		{ label: 'Blocked', value: 'blocked' },
	]);

	// FILTER STATES
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearchTerm = useDebounce(searchTerm, 400);
	const [roleFilter, setRoleFilter] = useState<string>('');
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');

	// PAGINATION STATES
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, canDelete, isLoadingPermissions } = usePermission();

	// REF GUARDS TO PREVENT DUPLICATE FETCHES
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);
	const hasLoadedDropdownDataRef = useRef<boolean>(false);

	// LOAD ACTIVE ROLES & DYNAMIC USER STATUS CONSTANTS
	useEffect(() => {
		if (hasLoadedDropdownDataRef.current) return;
		hasLoadedDropdownDataRef.current = true;

		const loadDropdownData = async () => {
			try {
				const [rolesRes, statusRes] = await Promise.all([
					roleService.getActiveRoles(),
					constantService.getUserStatusConstants(),
				]);

				if (rolesRes?.data && Array.isArray(rolesRes.data)) {
					setRoleOptions(rolesRes.data);
				}
				if (statusRes && Array.isArray(statusRes) && statusRes.length > 0) {
					setStatusOptions(statusRes);
				}
			} catch (err) {
				// Silently fallback if initial fetch fails
			}
		};
		loadDropdownData();
	}, []);

	// FETCH USERS FROM API
	const fetchUsers = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.USERS) &&
					!canRead(PERMISSION_KEYS.USER) &&
					!canRead(PERMISSION_KEYS.USER_MANAGEMENT))
			) {
				return;
			}

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${debouncedSearchTerm}_${roleFilter}_${statusFilter}_${
				isDateRangeValid ? `${startDate}_${endDate}` : ''
			}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const res = await userService.getUsers({
					search: debouncedSearchTerm.trim() || undefined,
					role_id: roleFilter ? Number(roleFilter) : undefined,
					status: statusFilter || undefined,
					start_date: isDateRangeValid ? startDate : undefined,
					end_date: isDateRangeValid ? endDate : undefined,
					page: currentPage,
					limit: perPage,
					sortBy: 'created_at',
					sortOrder: 'DESC',
				});

				const extractedData = res?.data || (res as any)?.result?.data || [];
				const total =
					res?.total_document ??
					(res as any)?.result?.total_document ??
					(Array.isArray(extractedData) ? extractedData.length : 0);

				setUsers(Array.isArray(extractedData) ? extractedData : []);
				setTotalUsers(total);
			} catch (error: any) {
				showNotification(
					'Error fetching users',
					error?.data?.message || error?.message || 'Could not load users data',
					'danger',
				);
				setUsers([]);
				setTotalUsers(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			isLoadingPermissions,
			canRead,
			startDate,
			endDate,
			debouncedSearchTerm,
			roleFilter,
			statusFilter,
			currentPage,
			perPage,
		],
	);

	useEffect(() => {
		const isDateRangeValid = Boolean(startDate && endDate);
		const currentFetchKey = `${debouncedSearchTerm}_${roleFilter}_${statusFilter}_${
			isDateRangeValid ? `${startDate}_${endDate}` : ''
		}_${currentPage}_${perPage}`;

		if (
			!isLoadingPermissions &&
			(canRead(PERMISSION_KEYS.USERS) ||
				canRead(PERMISSION_KEYS.USER) ||
				canRead(PERMISSION_KEYS.USER_MANAGEMENT)) &&
			lastFetchKeyRef.current !== currentFetchKey &&
			!isFetchingRef.current
		) {
			fetchUsers();
		}
	}, [
		debouncedSearchTerm,
		roleFilter,
		statusFilter,
		startDate,
		endDate,
		currentPage,
		perPage,
		isLoadingPermissions,
		canRead,
		fetchUsers,
	]);

	// HANDLE USER DELETE CONFIRMATION
	const handleDeleteConfirm = async () => {
		if (!userToDelete) return;

		setIsDeleting(true);
		try {
			const res = await userService.deleteUser(userToDelete.id);
			showNotification(
				'Success',
				res?.message || `User "${userToDelete.name}" deleted successfully`,
				'success',
			);
			setIsDeleteModalOpen(false);
			setUserToDelete(null);
			fetchUsers(true);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.data?.message || error?.message || 'Failed to delete user',
				'danger',
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// RESET ALL ACTIVE FILTERS
	const handleResetFilters = () => {
		setSearchTerm('');
		setRoleFilter('');
		setStatusFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	// COPY TO CLIPBOARD HELPER
	const handleCopyText = (text: string, label: string) => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		showNotification('Copied', `${label} copied to clipboard`, 'success');
	};

	// HELPER FOR INITIALS
	const getInitials = (name?: string) => {
		if (!name) return 'U';
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	};

	// HELPER FOR ROLE COLOR
	const getRoleBadgeColor = (roleName?: string): any => {
		if (!roleName) return 'gray';
		const r = roleName.toLowerCase();
		if (r.includes('super admin') || r.includes('super user')) return 'purple';
		if (r.includes('super distributor')) return 'blue';
		if (r.includes('distributor')) return 'teal';
		if (r.includes('retailer')) return 'success';
		if (r.includes('admin')) return 'primary';
		return 'gray';
	};

	// HELPER FOR STATUS COLOR & LABEL (LOOKS UP DYNAMIC CONSTANTS)
	const getStatusBadge = (status?: string) => {
		const matched = statusOptions.find(
			(opt) => String(opt.value).toLowerCase() === String(status || '').toLowerCase(),
		);
		const label = matched ? matched.label : status || '-';
		const s = (status || '').toLowerCase();
		let color: any = 'gray';
		if (s === 'active' || s === 'super_user') {
			color = 'success';
		} else if (s === 'inactive' || s === 'in_active' || s === 'user') {
			color = 'warning';
		} else if (s === 'blocked' || s === 'api_user') {
			color = 'danger';
		}
		return (
			<PillBadge color={color} isPill size="md">
				{label}
			</PillBadge>
		);
	};

	// ACTIVE FILTER COUNT
	let activeFilterCount = 0;
	if (searchTerm) activeFilterCount += 1;
	if (roleFilter) activeFilterCount += 1;
	if (statusFilter) activeFilterCount += 1;
	if (startDate || endDate) activeFilterCount += 1;

	// TABLE COLUMNS CONFIGURATION
	const columns: IListingColumn<IUserItem>[] = [
		{
			key: 'name',
			header: 'Name & Username',
			style: { width: 'auto' },
			headerStyle: { width: 'auto', minWidth: '220px' },
			render: (item) => (
				<div className="d-flex align-items-center gap-3">
					{item.profile_picture ? (
						<div className="user-avatar-wrapper">
							<img
								src={item.profile_picture}
								alt={item.name}
								onError={(e) => {
									(e.target as HTMLElement).style.display = 'none';
								}}
							/>
						</div>
					) : (
						<div className="user-avatar-wrapper avatar-fallback">
							{getInitials(item.name)}
						</div>
					)}
					<div>
						<div className="fw-bold text-dark" style={{ fontSize: '0.875rem' }}>
							{item.name}
						</div>
						<small className="text-muted">@{item.username}</small>
					</div>
				</div>
			),
		},
		{
			key: 'email_address',
			header: 'Email Address',
			style: { width: 'auto' },
			headerStyle: { width: 'auto', minWidth: '200px' },
			render: (item) => (
				<div className="d-inline-flex align-items-center gap-1">
					<a
						href={`mailto:${item.email_address}`}
						className="text-primary text-decoration-none fw-medium"
						style={{ fontSize: '0.85rem' }}>
						{item.email_address}
					</a>
					<button
						type="button"
						className="copy-text-btn"
						title="Copy Email"
						onClick={() => handleCopyText(item.email_address, 'Email')}>
						<Icon icon="ContentCopy" size="sm" />
					</button>
				</div>
			),
		},
		{
			key: 'mobile_number',
			header: 'Mobile Number',
			align: 'center',
			headerAlign: 'center',
			width: '150px',
			minWidth: '150px',
			headerStyle: { width: '150px', minWidth: '150px' },
			render: (item) => (
				<span className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>
					{item.mobile_number || '-'}
				</span>
			),
		},
		{
			key: 'role',
			header: 'Role',
			align: 'center',
			headerAlign: 'center',
			width: '170px',
			minWidth: '170px',
			headerStyle: { width: '170px', minWidth: '170px' },
			render: (item) => {
				const roleName = item.role?.role_name || '-';
				return (
					<PillBadge color={getRoleBadgeColor(roleName)} isPill size="md">
						{roleName}
					</PillBadge>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			align: 'center',
			headerAlign: 'center',
			width: '130px',
			minWidth: '130px',
			headerStyle: { width: '130px', minWidth: '130px' },
			render: (item) => getStatusBadge(item.status),
		},
		{
			key: 'created_at',
			header: 'Created Date',
			align: 'center',
			headerAlign: 'center',
			width: '170px',
			minWidth: '170px',
			headerStyle: { width: '170px', minWidth: '170px' },
			render: (item) => {
				if (!item.created_at) return '-';
				const { date, time } = formatDateTime(item.created_at);
				return (
					<div className="d-flex flex-column">
						<span className="fw-medium text-dark" style={{ fontSize: '0.8125rem' }}>
							{date}
						</span>
						<span className="text-muted" style={{ fontSize: '0.75rem' }}>
							{time}
						</span>
					</div>
				);
			},
		},
	];

	return (
		<PageWrapper title="User Management" permissionKey={PERMISSION_KEYS.USERS}>
			<Page container="fluid">
				<ListingPage<IUserItem>
					title="Users"
					breadcrumbs={[{ text: 'User Management' }, { text: 'Users' }]}
					permissionKey={PERMISSION_KEYS.USERS}
					onAddNew={() => {
						navigate(`/${PAGE_ROUTES.USERS_ADD}`);
					}}
					addNewText="Create User"
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className="d-flex align-items-end justify-content-end flex-wrap gap-3 w-100">
							{/* SEARCH INPUT */}
							<div style={{ width: '220px' }}>
								<label htmlFor="userSearch" className="filter-field-label">
									Search
								</label>
								<input
									id="userSearch"
									type="text"
									className="form-control"
									placeholder="Search name, email, mobile..."
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* ROLE FILTER */}
							<div style={{ width: '180px' }}>
								<label htmlFor="userRoleFilter" className="filter-field-label">
									Role
								</label>
								<select
									id="userRoleFilter"
									className="form-select"
									value={roleFilter}
									onChange={(e) => {
										setRoleFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value="">All Roles</option>
									{roleOptions.map((role) => (
										<option key={role.id} value={role.id}>
											{role.role_name}
										</option>
									))}
								</select>
							</div>

							{/* STATUS FILTER */}
							<div style={{ width: '160px' }}>
								<label htmlFor="userStatusFilter" className="filter-field-label">
									Status
								</label>
								<select
									id="userStatusFilter"
									className="form-select"
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value="">All Status</option>
									{statusOptions.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
							</div>

							{/* CUSTOM DATE RANGE PICKER */}
							<div style={{ width: '240px' }}>
								<span className="filter-field-label d-block">Date Range</span>
								<DateRangePicker
									startDate={startDate}
									endDate={endDate}
									placeholder="Select Start & End Date"
									onChange={({ startDate: sDate, endDate: eDate }) => {
										setStartDate(sDate);
										setEndDate(eDate);
										if ((sDate && eDate) || (!sDate && !eDate)) {
											setCurrentPage(1);
										}
									}}
								/>
							</div>

							{/* RESET FILTER BUTTON */}
							<div>
								<button
									type="button"
									className="btn-reset-filters"
									disabled={activeFilterCount === 0}
									onClick={handleResetFilters}>
									<Icon icon="Refresh" size="sm" />
									<span>Reset</span>
								</button>
							</div>
						</div>
					}
					columns={columns}
					data={users}
					isLoading={isLoading}
					emptyMessage="No users found"
					emptyIcon="Group"
					actions={{
						permissionKey: PERMISSION_KEYS.USERS,
						actionColumnWidth: '160px',
						onView: (user) => {
							navigate(`/${PAGE_ROUTES.USERS_VIEW.replace(':id', encryptId(user.id))}`);
						},
						onEdit: (user) => {
							navigate(`/${PAGE_ROUTES.USERS_EDIT.replace(':id', encryptId(user.id))}`);
						},
						onDelete: canDelete(PERMISSION_KEYS.USERS)
							? (user) => {
									setUserToDelete(user);
									setIsDeleteModalOpen(true);
							  }
							: undefined,
					}}
					pagination={{
						currentPage,
						totalItems: totalUsers,
						perPage,
						onPageChange: (page) => setCurrentPage(page),
						onPerPageChange: (newPerPage) => {
							setPerPage(newPerPage);
							setCurrentPage(1);
						},
					}}
				/>

				{/* CONFIRMATION MODAL */}
				<ConfirmationModal
					isOpen={isDeleteModalOpen}
					setIsOpen={setIsDeleteModalOpen}
					title="Confirmation Alert!"
					message={`Are you sure you want to remove user "${userToDelete?.name}"?`}
					confirmText="Yes, Delete"
					cancelText="No"
					isLoading={isDeleting}
					onConfirm={handleDeleteConfirm}
					onCancel={() => setUserToDelete(null)}
				/>
			</Page>
		</PageWrapper>
	);
};

export default UserListPage;
