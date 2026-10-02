/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, no-nested-ternary */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import Icon from '../../../../components/icon/Icon';
import Badge from '../../../../components/bootstrap/Badge';
import Tooltips from '../../../../components/bootstrap/Tooltips';
import showNotification from '../../../../components/extras/showNotification';
import { DateRangePicker } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { formatDateTime } from '../../../../helpers/dateUtils';
import blockHistoryService from './service/blockHistoryService';
import roleService from '../../role/service/roleService';
import { IBlockHistoryItem } from './type/block-history-type';
import { IRoleItem } from '../../role/type/role-type';
import './css/BlockHistory.scss';

// HELPER FOR USER INITIALS
const getInitials = (name?: string) => {
	if (!name) return 'U';
	const parts = name.trim().split(/\s+/);
	if (parts.length >= 2) {
		return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
};

// HELPER FOR ROLE BADGE COLOR
const getRoleBadgeColor = (roleName?: string): any => {
	if (!roleName) return 'secondary';
	const r = roleName.toLowerCase();
	if (r.includes('super admin') || r.includes('super user')) return 'primary';
	if (r.includes('super distributor')) return 'info';
	if (r.includes('distributor')) return 'success';
	if (r.includes('retailer') || r.includes('agent')) return 'warning';
	if (r.includes('api')) return 'dark';
	return 'secondary';
};

export const BlockHistoryListPage: FC = () => {
	const [historyList, setHistoryList] = useState<IBlockHistoryItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// FILTER STATES
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearchTerm = useDebounce(searchTerm, 400);

	const [actionFilter, setActionFilter] = useState<string>('');
	const [roleFilter, setRoleFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');

	// ROLE OPTIONS STATE
	const [roleOptions, setRoleOptions] = useState<IRoleItem[]>([]);

	// PAGINATION STATES
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, isLoadingPermissions } = usePermission();

	// REF GUARDS TO PREVENT REDUNDANT API CALLS
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);
	const hasLoadedRolesRef = useRef<boolean>(false);

	// LOAD ACTIVE ROLES FOR FILTER DROPDOWN
	useEffect(() => {
		if (hasLoadedRolesRef.current) return;
		hasLoadedRolesRef.current = true;

		const loadRoles = async () => {
			try {
				const res = await roleService.getActiveRoles();
				if (res?.data && Array.isArray(res.data)) {
					setRoleOptions(res.data);
				}
			} catch (err) {
				// Non-blocking fallback
			}
		};
		loadRoles();
	}, []);

	// FETCH BLOCK HISTORY AUDIT LOGS
	const fetchBlockHistory = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.USERS) &&
					!canRead(PERMISSION_KEYS.USER) &&
					!canRead(PERMISSION_KEYS.USER_MANAGEMENT) &&
					!canRead(PERMISSION_KEYS.BLOCK_HISTORY) &&
					!canRead('block-history') &&
					!canRead('block_history'))
			) {
				return;
			}

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${debouncedSearchTerm}_${actionFilter}_${roleFilter}_${
				isDateRangeValid ? `${startDate}_${endDate}` : ''
			}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const res = await blockHistoryService.getBlockHistory({
					search: debouncedSearchTerm.trim() || undefined,
					action: actionFilter || undefined,
					role_slug: roleFilter || undefined,
					start_date: isDateRangeValid ? startDate : undefined,
					end_date: isDateRangeValid ? endDate : undefined,
					page: currentPage,
					limit: perPage,
					sortBy: 'created_at',
					sortOrder: 'DESC',
				});

				const extractedData = Array.isArray(res?.data)
					? res.data
					: (res?.data as any)?.data && Array.isArray((res?.data as any).data)
					? (res.data as any).data
					: [];

				const total =
					res?.total_document ??
					(res as any)?.total ??
					(res as any)?.total_count ??
					(res?.data as any)?.total_document ??
					extractedData.length;

				setHistoryList(extractedData);
				setTotalDocuments(Number(total) || 0);
			} catch (error: any) {
				showNotification(
					'Error loading block history',
					error?.data?.message || error?.message || 'Could not fetch block history logs.',
					'danger',
				);
				setHistoryList([]);
				setTotalDocuments(0);
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
			actionFilter,
			roleFilter,
			currentPage,
			perPage,
		],
	);

	// TRIGGER DATA FETCH ON FILTER / PAGINATION CHANGES
	useEffect(() => {
		fetchBlockHistory();
	}, [fetchBlockHistory]);

	// RESET TO PAGE 1 ON FILTER CHANGE
	useEffect(() => {
		setCurrentPage(1);
	}, [debouncedSearchTerm, actionFilter, roleFilter, startDate, endDate]);

	// RESET ALL FILTERS
	const handleResetFilters = () => {
		setSearchTerm('');
		setActionFilter('');
		setRoleFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	const hasActiveFilters = Boolean(
		searchTerm || actionFilter || roleFilter || startDate || endDate,
	);

	let activeFilterCount = 0;
	if (searchTerm) activeFilterCount += 1;
	if (actionFilter) activeFilterCount += 1;
	if (roleFilter) activeFilterCount += 1;
	if (startDate || endDate) activeFilterCount += 1;

	// DEFINING TABLE COLUMNS
	const columns: IListingColumn<IBlockHistoryItem>[] = [
		{
			key: 'admin',
			header: 'Target User',
			minWidth: '220px',
			render: (row) => {
				const target = row.admin;
				if (!target) return <span className="text-muted small">User ID #{row.admin_id}</span>;

				return (
					<div className="block-user-cell">
						<div className="user-avatar">
							{target.profile_picture ? (
								<img src={target.profile_picture} alt={target.name} />
							) : (
								<span>{getInitials(target.name)}</span>
							)}
						</div>
						<div className="user-info">
							<span className="user-name">{target.name}</span>
							<span className="user-username">@{target.username}</span>
							{target.role?.role_name && (
								<Badge
									color={getRoleBadgeColor(target.role.role_name)}
									className="block-role-tag">
									{target.role.role_name}
								</Badge>
							)}
						</div>
					</div>
				);
			},
		},
		{
			key: 'action',
			header: 'Action',
			minWidth: '130px',
			render: (row) => {
				const isBlock = row.action === 'block';
				return (
					<span
						className={`block-action-badge ${
							isBlock ? 'action-block' : 'action-unblock'
						}`}>
						<span className="action-dot" />
						<Icon icon={isBlock ? 'Block' : 'CheckCircle'} size="sm" />
						<span>{isBlock ? 'Blocked' : 'Unblocked'}</span>
					</span>
				);
			},
		},
		{
			key: 'reason',
			header: 'Reason / Remarks',
			minWidth: '240px',
			render: (row) => {
				if (!row.reason) {
					return <span className="text-muted small italic">No reason provided</span>;
				}

				const isLong = row.reason.length > 35;
				const displayReason = isLong ? `${row.reason.substring(0, 35)}...` : row.reason;

				return (
					<Tooltips title={row.reason} placement="top">
						<div className="block-reason-box">
							<Icon icon="FormatQuote" size="sm" className="text-secondary flex-shrink-0" />
							<span className="reason-text">{displayReason}</span>
						</div>
					</Tooltips>
				);
			},
		},
		{
			key: 'action_by',
			header: 'Action Taken By',
			minWidth: '200px',
			render: (row) => {
				const performer = row.action_by;
				if (!performer) {
					return (
						<div className="d-flex align-items-center gap-2 text-muted small">
							<Icon icon="AdminPanelSettings" size="sm" />
							<span>System / Admin #{row.action_taken_by}</span>
						</div>
					);
				}

				return (
					<div className="block-user-cell">
						<div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
							{performer.profile_picture ? (
								<img src={performer.profile_picture} alt={performer.name} />
							) : (
								<span>{getInitials(performer.name)}</span>
							)}
						</div>
						<div className="user-info">
							<span className="user-name" style={{ fontSize: '0.8125rem' }}>
								{performer.name}
							</span>
							<span className="user-username">@{performer.username}</span>
							{performer.role?.role_name && (
								<Badge
									color={getRoleBadgeColor(performer.role.role_name)}
									className="block-role-tag"
									style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
									{performer.role.role_name}
								</Badge>
							)}
						</div>
					</div>
				);
			},
		},
		{
			key: 'created_at',
			header: 'Action Date & Time',
			minWidth: '170px',
			render: (row) => {
				if (!row.created_at) return <span className="text-muted small">-</span>;
				const dt = formatDateTime(row.created_at);
				return (
					<div className="d-flex flex-column">
						<span className="fw-medium text-dark" style={{ fontSize: '0.8125rem' }}>
							{dt.date}
						</span>
						<span className="text-muted" style={{ fontSize: '0.75rem' }}>
							{dt.time}
						</span>
					</div>
				);
			},
		},
	];

	return (
		<PageWrapper
			title="Block History"
			permissionKey={PERMISSION_KEYS.USERS}>
			<Page container="fluid">
				<div className="block-history-page-wrapper">
					<ListingPage<IBlockHistoryItem>
						title="Block History"
						subTitle="Audit log of all user account block and unblock actions across the system"
						breadcrumbs={[
							{ text: 'User Management' },
							{ text: 'Block History' },
						]}
						permissionKey={PERMISSION_KEYS.USERS}
						data={historyList}
						columns={columns}
						isLoading={isLoading}
						showFilterButton
						activeFilterCount={activeFilterCount}
						emptyMessage="No block history records found"
						emptyIcon="Block"
						filterContent={
							<div className="d-flex align-items-end justify-content-end flex-wrap gap-3 w-100">
								{/* SEARCH FILTER */}
								<div style={{ width: '200px' }}>
									<label htmlFor="blockSearch" className="filter-field-label">
										Search
									</label>
									<input
										id="blockSearch"
										type="text"
										className="form-control"
										placeholder="Search user, reason..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>

								{/* ACTION FILTER */}
								<div style={{ width: '130px' }}>
									<label htmlFor="actionFilter" className="filter-field-label">
										Action
									</label>
									<select
										id="actionFilter"
										className="form-select"
										value={actionFilter}
										onChange={(e) => setActionFilter(e.target.value)}>
										<option value="">All Actions</option>
										<option value="block">Blocked</option>
										<option value="unblock">Unblocked</option>
									</select>
								</div>

								{/* ROLE FILTER */}
								<div style={{ width: '150px' }}>
									<label htmlFor="roleFilter" className="filter-field-label">
										Role
									</label>
									<select
										id="roleFilter"
										className="form-select"
										value={roleFilter}
										onChange={(e) => setRoleFilter(e.target.value)}>
										<option value="">All Roles</option>
										{roleOptions.map((role) => (
											<option key={role.id} value={role.slug || role.id}>
												{role.role_name}
											</option>
										))}
									</select>
								</div>

								{/* DATE RANGE PICKER FILTER */}
								<div style={{ width: '220px' }}>
									<span className="filter-field-label d-block">Date Range</span>
									<DateRangePicker
										startDate={startDate}
										endDate={endDate}
										placeholder="Select date range"
										onChange={({ startDate: s, endDate: e }: { startDate: string; endDate: string }) => {
											setStartDate(s);
											setEndDate(e);
										}}
									/>
								</div>

								{/* RESET BUTTON */}
								<div>
									<button
										type="button"
										className="btn-reset-filters"
										disabled={!hasActiveFilters}
										onClick={handleResetFilters}>
										<Icon icon="Refresh" size="sm" />
										<span>Reset</span>
									</button>
								</div>
							</div>
						}
						pagination={{
							currentPage,
							totalItems: totalDocuments,
							perPage,
							perPageOptions: [10, 25, 50, 100],
							onPageChange: (page) => setCurrentPage(page),
							onPerPageChange: (newPerPage) => {
								setPerPage(newPerPage);
								setCurrentPage(1);
							},
						}}
					/>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default BlockHistoryListPage;
