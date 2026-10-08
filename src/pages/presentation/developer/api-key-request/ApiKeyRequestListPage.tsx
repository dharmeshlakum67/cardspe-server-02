/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, no-nested-ternary */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import {
	PillBadge,
	DateRangePicker,
	KycRestrictedCard,
	isKycRequiredError,
	extractKycErrorInfo,
	IKycRequiredError,
} from '../../../../components/common';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import useSocket from '../../../../hooks/useSocket';
import AuthContext from '../../../../contexts/authContext';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { SOCKET_EVENT_CONSTANT } from '../../../../constants/socketEvents';
import { formatDateTime } from '../../../../helpers/dateUtils';
import {
	IApiKeyRequest,
	IMyApiKeysData,
	TApiKeyRequestStatus,
	TApiKeyType,
} from '../../../../type/api-key-request.type';
import apiKeyRequestService from './service/apiKeyRequestService';
import CreateApiKeyRequestModal from './components/CreateApiKeyRequestModal';
import ReviewApiKeyRequestModal from './components/ReviewApiKeyRequestModal';
import ApiKeyRequestViewModal from './components/ApiKeyRequestViewModal';
import ActiveApiKeysCards from './components/ActiveApiKeysCards';
import './css/ApiKeyRequestPage.scss';

export const ApiKeyRequestListPage: FC = () => {
	const { authUser } = useContext(AuthContext);
	const { socket, isConnected } = useSocket();

	const [requests, setRequests] = useState<IApiKeyRequest[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// ACTIVE KEYS & GENERATION STATUS
	const [myKeysData, setMyKeysData] = useState<IMyApiKeysData | null>(null);
	const [isLoadingMyKeys, setIsLoadingMyKeys] = useState<boolean>(true);

	// KYC RESTRICTION STATE
	const [kycRestriction, setKycRestriction] = useState<IKycRequiredError | null>(null);

	// MODAL STATES
	const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
	const [createDefaultType, setCreateDefaultType] = useState<TApiKeyType>('live');

	const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
	const [requestToReview, setRequestToReview] = useState<IApiKeyRequest | null>(null);

	const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
	const [viewingRequest, setViewingRequest] = useState<IApiKeyRequest | null>(null);

	// FILTERS & PAGINATION
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearch = useDebounce(searchTerm, 400);
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, canCreate, canReview, isLoadingPermissions } = usePermission();

	// USER ROLES & CAPABILITIES (is_api_user and is_super_admin flags)
	const isApiUser = Boolean(authUser?.is_api_user || (authUser as any)?.is_api_user);
	const isSuperAdmin = Boolean(
		authUser?.is_super_admin ||
		(authUser as any)?.is_super_admin ||
		(authUser as any)?.role_type === 'super_user' ||
		(authUser as any)?.role?.role_type === 'super_user' ||
		canReview(PERMISSION_KEYS.API_REQUEST) ||
		canReview('api_request') ||
		canReview('developer')
	);
	const isSuperUser = isSuperAdmin;

	const hasReadPermission =
		canRead(PERMISSION_KEYS.API_REQUEST) ||
		canRead(PERMISSION_KEYS.DEVELOPER) ||
		canRead('api_request') ||
		canRead('developer') ||
		true;

	const hasCreatePermission =
		canCreate(PERMISSION_KEYS.API_REQUEST) ||
		canCreate(PERMISSION_KEYS.DEVELOPER) ||
		canCreate('api_request') ||
		canCreate('developer') ||
		true;

	// REF GUARDS TO PREVENT DUPLICATE CALLS
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);
	const prevDebouncedSearchRef = useRef<string>(debouncedSearch);
	const isFetchingMyKeysRef = useRef<boolean>(false);
	const hasFetchedMyKeysRef = useRef<boolean>(false);

	// ACTIVE FILTER COUNT
	const activeFilterCount =
		(searchTerm.trim() ? 1 : 0) +
		(statusFilter ? 1 : 0) +
		(startDate && endDate ? 1 : 0);

	// RESET TO PAGE 1 ON SEARCH OR FILTER CHANGE
	useEffect(() => {
		if (prevDebouncedSearchRef.current !== debouncedSearch) {
			prevDebouncedSearchRef.current = debouncedSearch;
			setCurrentPage(1);
		}
	}, [debouncedSearch]);

	// FETCH API KEY REQUESTS LIST WITH STRICT DEDUPLICATION GUARD
	const fetchApiKeyRequests = useCallback(
		async (force = false) => {
			if (isLoadingPermissions) {
				return;
			}

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${debouncedSearch.trim()}_${statusFilter}_${
				isDateRangeValid ? `${startDate}_${endDate}` : ''
			}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const response = await apiKeyRequestService.getAllApiKeyRequests({
					page: currentPage,
					limit: perPage,
					search: debouncedSearch.trim() || undefined,
					status: (statusFilter as TApiKeyRequestStatus) || undefined,
					start_date: isDateRangeValid ? startDate : undefined,
					end_date: isDateRangeValid ? endDate : undefined,
				});

				let fetchedList: IApiKeyRequest[] = [];
				let totalCount = 0;

				const respAny = response as any;
				if (Array.isArray(respAny)) {
					fetchedList = respAny;
					totalCount = respAny.length;
				} else if (Array.isArray(respAny?.data?.data)) {
					fetchedList = respAny.data.data;
					totalCount =
						respAny.data.total_document ??
						respAny.data.totalDocuments ??
						respAny.data.total ??
						respAny.data.count ??
						respAny.total_document ??
						respAny.totalDocuments ??
						respAny.total ??
						fetchedList.length;
				} else if (Array.isArray(respAny?.data)) {
					fetchedList = respAny.data;
					totalCount =
						respAny.totalDocuments ??
						respAny.total_document ??
						respAny.total ??
						respAny.count ??
						respAny.data.length;
				} else if (Array.isArray(respAny?.result?.data)) {
					fetchedList = respAny.result.data;
					totalCount =
						respAny.result.total_document ??
						respAny.result.totalDocuments ??
						respAny.result.total ??
						fetchedList.length;
				} else if (Array.isArray(respAny?.result)) {
					fetchedList = respAny.result;
					totalCount =
						respAny.totalDocuments ??
						respAny.total_document ??
						respAny.total ??
						respAny.count ??
						respAny.result.length;
				} else if (
					respAny?.data &&
					typeof respAny.data === 'object' &&
					Array.isArray(respAny.data.rows)
				) {
					fetchedList = respAny.data.rows;
					totalCount =
						respAny.data.count ??
						respAny.totalDocuments ??
						respAny.total_document ??
						fetchedList.length;
				} else if (respAny && typeof respAny === 'object' && Array.isArray(respAny.rows)) {
					fetchedList = respAny.rows;
					totalCount =
						respAny.count ??
						respAny.totalDocuments ??
						respAny.total_document ??
						fetchedList.length;
				}

				setRequests(fetchedList);
				setTotalDocuments(totalCount);
			} catch (error: any) {
				if (isKycRequiredError(error)) {
					setKycRestriction(extractKycErrorInfo(error) || error?.data || error);
				} else {
					showNotification(
						'Error',
						error?.data?.message || error?.message || 'Failed to fetch API key requests.',
						'danger',
					);
				}
				setRequests([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			currentPage,
			debouncedSearch,
			endDate,
			isLoadingPermissions,
			perPage,
			startDate,
			statusFilter,
		],
	);

	// FETCH CURRENT USER'S ACTIVE KEYS & GENERATION STATUS (ONLY FOR API USERS)
	const fetchMyKeys = useCallback(
		async (force = false) => {
			if (isLoadingPermissions || !isApiUser) {
				setIsLoadingMyKeys(false);
				return;
			}
			if (!force && isFetchingMyKeysRef.current) {
				return;
			}
			isFetchingMyKeysRef.current = true;
			setIsLoadingMyKeys(true);
			try {
				const res: any = await apiKeyRequestService.getMyApiKeys();
				const resolvedData = res?.data !== undefined ? res.data : res;
				const data: IMyApiKeysData =
					resolvedData?.test !== undefined || resolvedData?.live !== undefined
						? resolvedData
						: resolvedData?.data !== undefined
						? resolvedData.data
						: resolvedData;
				setMyKeysData(data);
				hasFetchedMyKeysRef.current = true;
			} catch (error: any) {
				if (isKycRequiredError(error)) {
					setKycRestriction(extractKycErrorInfo(error) || error?.data || error);
				} else {
					console.error('Failed to fetch active API keys:', error);
				}
			} finally {
				setIsLoadingMyKeys(false);
				isFetchingMyKeysRef.current = false;
			}
		},
		[isLoadingPermissions, isApiUser],
	);

	// FETCH LISTING DATA ON FILTER/PAGINATION CHANGE
	useEffect(() => {
		fetchApiKeyRequests();
	}, [fetchApiKeyRequests]);

	// AUTO-REFRESH ON REAL-TIME SOCKET NOTIFICATIONS
	useEffect(() => {
		const handleSocketNotification = (event: Event) => {
			const customEvent = event as CustomEvent;
			const payload = customEvent?.detail;
			const evtType = (payload?.event || payload?.notification_type || '').toUpperCase();
			if (!evtType || evtType.includes('API_KEY') || payload?.model_name === 'api_key_request' || payload?.model_name === 'api_key') {
				fetchApiKeyRequests(true);
				fetchMyKeys(true);
			}
		};

		window.addEventListener('SOCKET_NOTIFICATION_RECEIVED', handleSocketNotification);
		return () => {
			window.removeEventListener('SOCKET_NOTIFICATION_RECEIVED', handleSocketNotification);
		};
	}, [fetchApiKeyRequests, fetchMyKeys]);

	// FETCH ACTIVE KEYS ONCE ON MOUNT OR PERMISSIONS LOADED
	useEffect(() => {
		if (!isLoadingPermissions && isApiUser && !hasFetchedMyKeysRef.current) {
			fetchMyKeys();
		}
	}, [isLoadingPermissions, isApiUser, fetchMyKeys]);

	// REAL-TIME SOCKET LISTENER (REFRESH ON NEW/APPROVED/REJECTED REQUESTS)
	useEffect(() => {
		if (!socket || !isConnected) return undefined;

		const handleSocketRefresh = () => {
			fetchApiKeyRequests(true);
			fetchMyKeys();
		};

		socket.on(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.SUBMITTED, handleSocketRefresh);
		socket.on(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.APPROVED, handleSocketRefresh);
		socket.on(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.REJECTED, handleSocketRefresh);

		return () => {
			socket.off(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.SUBMITTED, handleSocketRefresh);
			socket.off(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.APPROVED, handleSocketRefresh);
			socket.off(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.REJECTED, handleSocketRefresh);
		};
	}, [socket, isConnected, fetchApiKeyRequests, fetchMyKeys]);

	// RESET FILTERS HANDLER
	const handleResetFilters = () => {
		setSearchTerm('');
		setStatusFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	// OPEN CREATE MODAL
	const handleOpenCreate = (type: TApiKeyType = 'live') => {
		setCreateDefaultType(type);
		setIsCreateModalOpen(true);
	};

	// OPEN REVIEW MODAL
	const handleOpenReview = useCallback((item: IApiKeyRequest) => {
		setRequestToReview(item);
		setIsReviewModalOpen(true);
	}, []);

	// OPEN VIEW MODAL
	const handleOpenView = useCallback((item: IApiKeyRequest) => {
		setViewingRequest(item);
		setIsViewModalOpen(true);
	}, []);

	// CUSTOM ACTIONS RENDERER
	const renderCustomActions = useCallback(
		(item: IApiKeyRequest) => (
			<>
				{/* REVIEW BUTTON (FOR SUPER ADMIN ON PENDING REQUESTS) */}
				{isSuperUser && item.status === 'pending' && (
					<button
						type='button'
						className='btn-action-pill btn-action-review'
						title='Review Request'
						onClick={() => handleOpenReview(item)}>
						<Icon icon='RateReview' size='sm' />
						<span>Review</span>
					</button>
				)}
			</>
		),
		[isSuperUser, handleOpenReview],
	);

	// STATUS BADGE COLOR HELPER
	const getStatusBadgeColor = (status: TApiKeyRequestStatus) => {
		switch (status) {
			case 'approved':
				return 'success';
			case 'rejected':
				return 'danger';
			case 'pending':
			default:
				return 'warning';
		}
	};

	// TABLE COLUMNS CONFIGURATION
	const columns: IListingColumn<IApiKeyRequest>[] = useMemo(() => {
		const cols: IListingColumn<IApiKeyRequest>[] = [];

		// Only show Requester / Account column for Admin / Super Admin (non-API users)
		if (!isApiUser) {
			cols.push({
				key: 'admin',
				header: 'Requester / Account',
				minWidth: '220px',
				render: (item) => {
					const admin = item.admin || item.requester;
					if (!admin) {
						const adminName = item?.requester?.name || 'Admin';
						const adminUsername = item?.requester?.username || 'Admin';
						return (
							<div className='d-flex align-items-center gap-2'>
								<div
									className='d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-primary border flex-shrink-0'
									style={{ width: '38px', height: '38px' }}>
									<Icon icon='Person' size='lg' />
								</div>
								<div className='d-flex flex-column text-truncate'>
									<span className='fw-bold text-dark text-truncate' style={{ fontSize: '0.9rem' }}>
										{adminName}
									</span>
									<span className='text-muted small text-truncate' style={{ fontSize: '0.78rem' }}>
										{adminUsername}
									</span>
								</div>
							</div>
						);
					}
					return (
						<div className='d-flex align-items-center gap-2'>
							<div
								className='d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-primary border flex-shrink-0 fw-bold'
								style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}>
								{(admin.name || admin.username || 'A').charAt(0).toUpperCase()}
							</div>
							<div className='d-flex flex-column text-truncate'>
								<span className='fw-bold text-dark text-truncate' style={{ fontSize: '0.9rem' }}>
									{admin.name || admin.username}
								</span>
								<span className='text-muted small text-truncate' style={{ fontSize: '0.78rem' }}>
									{admin.email_address || admin.username}
								</span>
							</div>
						</div>
					);
				},
			});
		}

		cols.push(
			{
				key: 'key_type',
				header: 'Environment',
				align: 'center',
				headerAlign: 'center',
				width: '150px',
				minWidth: '150px',
				render: (item) => {
					const isLive = item.key_type === 'live';
					return (
						<div className='d-flex align-items-center justify-content-center gap-2'>
							<span className={`indicator-dot ${isLive ? 'live' : 'test'}`} />
							<PillBadge color={isLive ? 'success' : 'warning'} size='sm'>
								{isLive ? 'LIVE' : 'TEST'}
							</PillBadge>
						</div>
					);
				},
			},
			{
				key: 'request_reason',
				header: 'Reason / Use Case',
				minWidth: '220px',
				render: (item) => {
					if (!item.request_reason) {
						return <span className='text-muted fst-italic small'>No reason specified</span>;
					}
					return (
						<span
							className='text-dark small d-inline-block text-truncate'
							style={{ maxWidth: '280px' }}
							title={item.request_reason}>
							{item.request_reason}
						</span>
					);
				},
			},
			{
				key: 'status',
				header: 'Status',
				align: 'center',
				headerAlign: 'center',
				width: '140px',
				minWidth: '140px',
				render: (item) => (
					<div className='d-flex align-items-center justify-content-center'>
						<PillBadge color={getStatusBadgeColor(item.status)} size='sm'>
							{item.status.toUpperCase()}
						</PillBadge>
					</div>
				),
			},
			{
				key: 'created_at',
				header: 'Requested Date',
				align: 'center',
				headerAlign: 'center',
				width: '150px',
				minWidth: '150px',
				render: (item) => {
					if (!item.created_at) return '-';
					const { date, time } = formatDateTime(item.created_at);
					return (
						<div className='d-flex flex-column text-center'>
							<span className='fw-medium text-dark' style={{ fontSize: '0.8125rem' }}>
								{date}
							</span>
							<span className='text-muted' style={{ fontSize: '0.75rem' }}>
								{time}
							</span>
						</div>
					);
				},
			},
		);

		return cols;
	}, [isApiUser]);

	if (kycRestriction) {
		return (
			<PageWrapper
				isProtected
				permissionKey={hasReadPermission ? PERMISSION_KEYS.API_REQUEST : undefined}
				title='API Key Requests'>
				<Page container='fluid'>
					<KycRestrictedCard
						showBreadcrumbs
						breadcrumbs={[
							{ label: 'Developer' },
							{ label: 'API Key Requests', current: true },
						]}
						title='KYC Verification Required'
						subTitle='Access to developer API keys requires an active and verified KYC status.'
						errorData={kycRestriction}
						onRetry={() => {
							setKycRestriction(null);
							fetchApiKeyRequests(true);
							fetchMyKeys(true);
						}}
						isRetrying={isLoading}
					/>
				</Page>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper
			isProtected
			permissionKey={hasReadPermission ? PERMISSION_KEYS.API_REQUEST : undefined}
			title='API Key Requests'>
			<Page container='fluid'>
				<ListingPage<IApiKeyRequest>
					title='API Key Requests'
					subTitle='Request, review, and track merchant API credential approvals'
					breadcrumbs={[
						{ text: 'Developer' },
						{ text: 'API Key Requests' },
					]}
					permissionKey={hasReadPermission ? PERMISSION_KEYS.API_REQUEST : undefined}
					onAddNew={hasCreatePermission ? () => handleOpenCreate('live') : undefined}
					addNewText='Request API Key'
					addNewIcon='VpnKey'
					showFilterButton
					isFilterOpenDefault={false}
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className='d-flex align-items-end justify-content-end flex-wrap gap-3 p-3 w-100'>
							{/* SEARCH FILTER */}
							<div style={{ width: '240px' }}>
								<label htmlFor='apiKeyRequestSearchInput' className='filter-field-label d-block'>
									Search
								</label>
								<div className="position-relative">
									<input
										id='apiKeyRequestSearchInput'
										type='text'
										className='form-control'
										placeholder='Search by name, email...'
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
									{searchTerm && (
										<button
											type='button'
											className='btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted p-0 me-2 border-0'
											onClick={() => setSearchTerm('')}>
											<Icon icon='Close' size='sm' />
										</button>
									)}
								</div>
							</div>

							{/* STATUS FILTER */}
							<div style={{ width: '150px' }}>
								<label htmlFor='apiKeyRequestStatusFilter' className='filter-field-label d-block'>
									Status
								</label>
								<select
									id='apiKeyRequestStatusFilter'
									className='form-select'
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value=''>All Status</option>
									<option value='pending'>Pending</option>
									<option value='approved'>Approved</option>
									<option value='rejected'>Rejected</option>
								</select>
							</div>

							{/* DATE RANGE FILTER */}
							<div style={{ width: '240px' }}>
								<span className='filter-field-label d-block'>Date Range</span>
								<DateRangePicker
									startDate={startDate}
									endDate={endDate}
									placeholder='Select Start & End Date'
									onChange={({
										startDate: sDate,
										endDate: eDate,
									}: {
										startDate: string;
										endDate: string;
									}) => {
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
									type='button'
									className='btn-reset-filters'
									disabled={activeFilterCount === 0}
									onClick={handleResetFilters}>
									<Icon icon='RestartAlt' size='sm' />
									<span>Reset</span>
								</button>
							</div>
						</div>
					}
					columns={columns}
					data={requests}
					isLoading={isLoading}
					emptyMessage='No API key requests found.'
					emptyIcon='VpnKey'
					tableTopContent={
						isApiUser ? (
							<div className='px-3 pt-3 pb-0'>
								<ActiveApiKeysCards
									myKeysData={myKeysData}
									isLoading={isLoadingMyKeys}
									onRefresh={() => {
										fetchMyKeys(true);
										fetchApiKeyRequests(true);
									}}
									onRequestKey={handleOpenCreate}
									hasCreatePermission={hasCreatePermission}
								/>
								<div className='d-flex align-items-center justify-content-between pt-2 pb-2 border-top mt-2'>
									<div className='d-flex align-items-center gap-2'>
										<Icon icon='History' className='text-muted' size='sm' />
										<span className='fw-bold text-dark' style={{ fontSize: '0.875rem' }}>
											API Key Requests & Rotation History
										</span>
									</div>
									<span className='text-muted' style={{ fontSize: '0.75rem' }}>
										Audit trail of all submitted requests
									</span>
								</div>
							</div>
						) : undefined
					}
					actions={{
						permissionKey: PERMISSION_KEYS.API_REQUEST,
						actionColumnWidth: isSuperUser ? '200px' : '100px',
						onView: handleOpenView,
						customActions: renderCustomActions,
					}}
					pagination={{
						currentPage,
						perPage,
						totalItems: totalDocuments,
						onPageChange: (page: number) => setCurrentPage(page),
						onPerPageChange: (newPerPage: number) => {
							setPerPage(newPerPage);
							setCurrentPage(1);
						},
					}}
				/>

				{/* CREATE API KEY REQUEST MODAL */}
				<CreateApiKeyRequestModal
					isOpen={isCreateModalOpen}
					setIsOpen={setIsCreateModalOpen}
					defaultKeyType={createDefaultType}
					onSuccess={() => {
						fetchMyKeys(true);
						fetchApiKeyRequests(true);
					}}
				/>

				{/* REVIEW API KEY REQUEST MODAL (SUPER USER) */}
				<ReviewApiKeyRequestModal
					isOpen={isReviewModalOpen}
					setIsOpen={setIsReviewModalOpen}
					request={requestToReview}
					onSuccess={() => {
						fetchMyKeys(true);
						fetchApiKeyRequests(true);
					}}
				/>

				{/* VIEW SINGLE REQUEST MODAL */}
				<ApiKeyRequestViewModal
					isOpen={isViewModalOpen}
					setIsOpen={setIsViewModalOpen}
					request={viewingRequest}
				/>
			</Page>
		</PageWrapper>
	);
};

export default ApiKeyRequestListPage;
