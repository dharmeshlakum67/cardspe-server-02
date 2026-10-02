/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, no-nested-ternary */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../components/common/ListingPage';
import Icon from '../../../components/icon/Icon';
import Tooltips from '../../../components/bootstrap/Tooltips';
import showNotification from '../../../components/extras/showNotification';
import { DateRangePicker } from '../../../components/common';
import usePermission from '../../../hooks/usePermission';
import useDebounce from '../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../constants/permissionKeys';
import { formatDateTime } from '../../../helpers/dateUtils';
import loginHistoryService from './service/loginHistoryService';
import { ILoginHistoryItem } from './type/login-history-type';
import './css/LoginHistory.scss';

const getDeviceTheme = (deviceType?: string | null) => {
	const type = (deviceType || '').toLowerCase();
	if (type.includes('mobile') || type.includes('phone')) {
		return { icon: 'Smartphone', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
	}
	if (type.includes('tablet') || type.includes('ipad')) {
		return { icon: 'TabletMac', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
	}
	return { icon: 'Laptop', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' };
};

const getBrowserTheme = (browser?: string | null) => {
	const b = (browser || '').toLowerCase();
	if (b.includes('chrome')) return { icon: 'Public', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
	if (b.includes('safari')) return { icon: 'Explore', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' };
	if (b.includes('firefox')) return { icon: 'Language', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
	if (b.includes('edge')) return { icon: 'Language', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' };
	return { icon: 'Language', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
};

export const LoginHistoryListPage: FC = () => {
	const [historyList, setHistoryList] = useState<ILoginHistoryItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// FILTER STATES
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearchTerm = useDebounce(searchTerm, 400);

	const [statusFilter, setStatusFilter] = useState<string>('');
	const [deviceFilter, setDeviceFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');

	// PAGINATION STATES
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, isLoadingPermissions } = usePermission();

	// REF GUARDS TO PREVENT REDUNDANT API CALLS
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// FETCH LOGIN HISTORY DATA
	const fetchLoginHistory = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.LOGIN_HISTORY) &&
					!canRead('login-history') &&
					!canRead('login_history'))
			) {
				return;
			}

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${debouncedSearchTerm}_${statusFilter}_${deviceFilter}_${isDateRangeValid ? `${startDate}_${endDate}` : ''}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const res = await loginHistoryService.getLoginHistory({
					search: debouncedSearchTerm.trim() || undefined,
					is_logout:
						statusFilter === 'active'
							? false
							: statusFilter === 'logged_out'
							? true
							: undefined,
					device_type: deviceFilter || undefined,
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
					'Error loading login history',
					error?.data?.message || error?.message || 'Could not fetch login records.',
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
			statusFilter,
			deviceFilter,
			currentPage,
			perPage,
		],
	);

	// TRIGGER DATA FETCH ON FILTER / PAGINATION CHANGES
	useEffect(() => {
		fetchLoginHistory();
	}, [fetchLoginHistory]);

	// RESET TO PAGE 1 ON FILTER CHANGE
	useEffect(() => {
		setCurrentPage(1);
	}, [debouncedSearchTerm, statusFilter, deviceFilter, startDate, endDate]);

	// RESET ALL FILTERS
	const handleResetFilters = () => {
		setSearchTerm('');
		setStatusFilter('');
		setDeviceFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	const hasActiveFilters = Boolean(
		searchTerm || statusFilter || deviceFilter || startDate || endDate,
	);

	let activeFilterCount = 0;
	if (searchTerm) activeFilterCount += 1;
	if (statusFilter) activeFilterCount += 1;
	if (deviceFilter) activeFilterCount += 1;
	if (startDate || endDate) activeFilterCount += 1;

	// DEFINING TABLE COLUMNS (FOR CURRENT USER SESSIONS)
	const columns: IListingColumn<ILoginHistoryItem>[] = [
		{
			key: 'device_os',
			header: 'Device & OS',
			minWidth: '180px',
			render: (row) => {
				const deviceTheme = getDeviceTheme(row.device_type);
				const osDisplay = row.os
					? `${row.os}${row.os_version ? ` ${row.os_version}` : ''}`
					: 'Unknown OS';

				return (
					<div className="session-device-box">
						<div
							className="device-avatar"
							style={{
								backgroundColor: deviceTheme.bg,
								border: `1px solid ${deviceTheme.border}`,
								color: deviceTheme.color,
							}}>
							<Icon icon={deviceTheme.icon} size="md" />
						</div>
						<div className="device-info">
							<span className="os-title">{osDisplay}</span>
							<span className="device-type-tag">{row.device_type || 'Desktop'}</span>
						</div>
					</div>
				);
			},
		},
		{
			key: 'browser',
			header: 'Browser',
			minWidth: '170px',
			render: (row) => {
				const browserTheme = getBrowserTheme(row.browser);
				const browserDisplay = row.browser
					? `${row.browser}${row.browser_version ? ` v${row.browser_version}` : ''}`
					: 'Unknown Browser';

				return (
					<span
						className="session-browser-badge"
						style={{
							backgroundColor: browserTheme.bg,
							border: `1px solid ${browserTheme.border}`,
							color: browserTheme.color,
						}}>
						<Icon icon={browserTheme.icon} size="sm" />
						<span>{browserDisplay}</span>
					</span>
				);
			},
		},
		{
			key: 'ip_address',
			header: 'IP Address',
			minWidth: '130px',
			render: (row) => (
				<span className="session-ip-badge">
					<Icon icon="Public" size="sm" className="text-secondary" />
					<span>{row.ip_address || '-'}</span>
				</span>
			),
		},
		{
			key: 'user_agent',
			header: 'User Agent',
			minWidth: '190px',
			render: (row) => {
				if (!row.user_agent) return <span className="text-muted small">-</span>;
				return (
					<Tooltips title={row.user_agent} placement="top">
						<span className="session-ua-pill">
							<span className="ua-text">
								{row.user_agent.length > 20
									? `${row.user_agent.substring(0, 20)}...`
									: row.user_agent}
							</span>
							<Icon icon="Info" size="sm" className="text-primary flex-shrink-0" />
						</span>
					</Tooltips>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			minWidth: '130px',
			render: (row) => {
				return row.is_logout ? (
					<span className="session-status-badge status-logout">
						<span className="logout-dot" />
						<span>Logged Out</span>
					</span>
				) : (
					<span className="session-status-badge status-active">
						<span className="pulse-dot" />
						<span>Active</span>
					</span>
				);
			},
		},
		{
			key: 'created_at',
			header: 'Login Time',
			minWidth: '170px',
			render: (row) => {
				if (!row.created_at) return <span className="text-muted small">-</span>;
				const dt = formatDateTime(row.created_at);
				return (
					<div className="session-time-block">
						<span className="time-date">
							<Icon icon="CalendarToday" size="sm" className="text-muted" />
							<span>{dt.date}</span>
						</span>
						<span className="time-clock">
							<Icon icon="Schedule" size="sm" className="text-muted" />
							<span>{dt.time}</span>
						</span>
					</div>
				);
			},
		},
	];

	return (
		<PageWrapper
			title="Login History"
			permissionKey={PERMISSION_KEYS.LOGIN_HISTORY}>
			<Page container="fluid">
				<div className="login-history-page-wrapper">
					<ListingPage<ILoginHistoryItem>
						title="Login History"
						subTitle="Audit log of your login sessions, devices, IP addresses, and active connections"
						breadcrumbs={[
							{ text: 'Home', to: '/' },
							{ text: 'Login History' },
						]}
						permissionKey={PERMISSION_KEYS.LOGIN_HISTORY}
						data={historyList}
						columns={columns}
						isLoading={isLoading}
						showFilterButton
						activeFilterCount={activeFilterCount}
						emptyMessage="No login history records found"
						emptyIcon="History"
						filterContent={
							<div className="d-flex align-items-end justify-content-end flex-wrap gap-3 w-100">
								{/* SEARCH FILTER */}
								<div style={{ width: '180px' }}>
									<label htmlFor="loginSearch" className="filter-field-label">
										Search
									</label>
									<input
										id="loginSearch"
										type="text"
										className="form-control"
										placeholder="Search IP, OS..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>

								{/* STATUS FILTER */}
								<div style={{ width: '130px' }}>
									<label htmlFor="statusFilter" className="filter-field-label">
										Status
									</label>
									<select
										id="statusFilter"
										className="form-select"
										value={statusFilter}
										onChange={(e) => setStatusFilter(e.target.value)}>
										<option value="">All Statuses</option>
										<option value="active">Active</option>
										<option value="logged_out">Logged Out</option>
									</select>
								</div>

								{/* DEVICE FILTER */}
								<div style={{ width: '130px' }}>
									<label htmlFor="deviceFilter" className="filter-field-label">
										Device
									</label>
									<select
										id="deviceFilter"
										className="form-select"
										value={deviceFilter}
										onChange={(e) => setDeviceFilter(e.target.value)}>
										<option value="">All Devices</option>
										<option value="desktop">Desktop</option>
										<option value="mobile">Mobile</option>
										<option value="tablet">Tablet</option>
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

export default LoginHistoryListPage;
