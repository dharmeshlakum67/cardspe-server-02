/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, no-nested-ternary */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import { PillBadge } from '../../../../components/common/PillBadge';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import { DateRangePicker } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { encryptId } from '../../../../helpers/routeEncryption';
import { formatDateTime } from '../../../../helpers/dateUtils';
import kycService from '../../profile/kyc/service/kycService';
import {
	IKycRequestItem,
	IActiveDocumentTypeOption,
} from '../../profile/kyc/type/kyc-type';
import constantService, { IConstantOption } from '../../../../services/constantService';
import documentTypeService from '../../master/documentType/service/documentTypeService';

export const KycRequestListPage: FC = () => {
	const navigate = useNavigate();
	const [requests, setRequests] = useState<IKycRequestItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// FILTER STATES
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearchTerm = useDebounce(searchTerm, 400);

	const [adminNameFilter, setAdminNameFilter] = useState<string>('');
	const debouncedAdminName = useDebounce(adminNameFilter, 400);

	const [statusFilter, setStatusFilter] = useState<string>('');
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([]);

	const [docTypeFilter, setDocTypeFilter] = useState<string>('');
	const [docTypeOptions, setDocTypeOptions] = useState<IActiveDocumentTypeOption[]>([]);

	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');

	// PAGINATION STATES
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, isLoadingPermissions } = usePermission();

	// REF GUARDS TO PREVENT DUPLICATE CALLS
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);
	const hasFetchedOptionsRef = useRef<boolean>(false);

	// CAPITALIZE ONLY THE FIRST LETTER OF STATUS (E.G. 'Pending', 'Approved', 'Rejected')
	const formatStatus = (s?: string) => {
		if (!s) return '-';
		const cleaned = s.replace(/_/g, ' ').toLowerCase();
		return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
	};

	// FETCH KYC REQUESTS DATA
	const fetchKycRequests = useCallback(
		async (force = false) => {
			if (isLoadingPermissions || !canRead(PERMISSION_KEYS.KYC_REQUEST)) {
				return;
			}

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${debouncedSearchTerm}_${debouncedAdminName}_${statusFilter}_${docTypeFilter}_${isDateRangeValid ? `${startDate}_${endDate}` : ''}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const res = await kycService.getAllKycRequests({
					search: debouncedSearchTerm.trim() || undefined,
					admin_name: debouncedAdminName.trim() || undefined,
					status: statusFilter || undefined,
					document_type_id: docTypeFilter ? Number(docTypeFilter) : undefined,
					start_date: isDateRangeValid ? startDate : undefined,
					end_date: isDateRangeValid ? endDate : undefined,
					page: currentPage,
					limit: perPage,
					sortBy: 'created_at',
					sortOrder: 'DESC',
				});

				const extractedData = res?.data?.data || (res as any)?.data || [];
				const total =
					res?.data?.total_document ||
					(res as any)?.total_document ||
					(Array.isArray(extractedData) ? extractedData.length : 0);

				setRequests(Array.isArray(extractedData) ? extractedData : []);
				setTotalDocuments(total);
			} catch (error: any) {
				showNotification(
					'Error fetching KYC requests',
					error?.data?.message || error?.message || 'Could not load KYC requests data',
					'danger',
				);
				setRequests([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			debouncedSearchTerm,
			debouncedAdminName,
			statusFilter,
			docTypeFilter,
			startDate,
			endDate,
			currentPage,
			perPage,
			isLoadingPermissions,
		],
	);

	useEffect(() => {
		const isDateRangeValid = Boolean(startDate && endDate);
		const currentFetchKey = `${debouncedSearchTerm}_${debouncedAdminName}_${statusFilter}_${docTypeFilter}_${isDateRangeValid ? `${startDate}_${endDate}` : ''}_${currentPage}_${perPage}`;

		if (
			!isLoadingPermissions &&
			canRead(PERMISSION_KEYS.KYC_REQUEST) &&
			lastFetchKeyRef.current !== currentFetchKey &&
			!isFetchingRef.current
		) {
			fetchKycRequests();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		debouncedSearchTerm,
		debouncedAdminName,
		statusFilter,
		docTypeFilter,
		startDate,
		endDate,
		currentPage,
		perPage,
		isLoadingPermissions,
	]);

	// AUTO-REFRESH ON REAL-TIME SOCKET NOTIFICATIONS
	useEffect(() => {
		const handleSocketNotification = (event: Event) => {
			const customEvent = event as CustomEvent;
			const payload = customEvent?.detail;
			const evtType = (payload?.event || payload?.notification_type || '').toUpperCase();
			if (!evtType || evtType.includes('KYC') || payload?.model_name === 'kyc_request' || payload?.model_name === 'user_kyc') {
				fetchKycRequests(true);
			}
		};

		window.addEventListener('SOCKET_NOTIFICATION_RECEIVED', handleSocketNotification);
		return () => {
			window.removeEventListener('SOCKET_NOTIFICATION_RECEIVED', handleSocketNotification);
		};
	}, [fetchKycRequests]);

	// FETCH DYNAMIC CONSTANT STATUS OPTIONS & ACTIVE DOCUMENT TYPES ONCE ON MOUNT
	useEffect(() => {
		if (hasFetchedOptionsRef.current) return;
		hasFetchedOptionsRef.current = true;

		const fetchOptions = async () => {
			try {
				const [statusRes, docTypeRes] = await Promise.all([
					constantService.getConstantByType(PERMISSION_KEYS.KYC_REQUEST),
					documentTypeService.getActiveDocumentTypes(),
				]);

				if (statusRes && statusRes.length > 0) {
					setStatusOptions(statusRes);
				}
				const activeTypes = docTypeRes?.data || [];
				if (Array.isArray(activeTypes)) {
					setDocTypeOptions(activeTypes);
				}
			} catch (err) {
				console.error('Failed to load filter options:', err);
			}
		};

		fetchOptions();
	}, []);

	// HANDLE RESET FILTERS
	const handleResetFilters = () => {
		setSearchTerm('');
		setAdminNameFilter('');
		setStatusFilter('');
		setDocTypeFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	// ACTIVE FILTER COUNT
	let activeFilterCount = 0;
	if (searchTerm) activeFilterCount += 1;
	if (adminNameFilter) activeFilterCount += 1;
	if (statusFilter) activeFilterCount += 1;
	if (docTypeFilter) activeFilterCount += 1;
	if (startDate || endDate) activeFilterCount += 1;

	// TABLE COLUMNS CONFIGURATION
	const columns: IListingColumn<IKycRequestItem>[] = [
		{
			key: 'id',
			header: 'Request ID',
			width: '120px',
			minWidth: '110px',
			headerStyle: { width: '120px', minWidth: '110px' },
			render: (row) => (
				<span className='badge bg-light text-dark font-monospace border px-2 py-1'>
					#KYC-{row.id}
				</span>
			),
		},
		{
			key: 'applicant',
			header: 'Applicant Details',
			style: { width: 'auto' },
			headerStyle: { width: 'auto', minWidth: '220px' },
			render: (row) => {
				const user = row.user || row.admin;
				const parent = user?.parent;
				return (
					<div>
						<div className='d-flex align-items-center gap-2 flex-wrap'>
							<span className='fw-bold text-dark' style={{ fontSize: '0.875rem' }}>
								{user?.name || '-'}
							</span>
							{user?.role && (
								<span
									className='badge bg-primary-subtle text-primary border'
									style={{ fontSize: '0.72rem' }}>
									{user.role.role_name}
								</span>
							)}
						</div>
						<div className='text-muted small d-flex align-items-center gap-2 mt-0.5'>
							{user?.username && (
								<span
									className='font-monospace text-primary'
									style={{ fontSize: '0.78rem' }}>
									@{user.username}
								</span>
							)}
							{user?.mobile_number && (
								<span>· {user.mobile_number}</span>
							)}
						</div>
						{parent && (
							<div className='text-muted' style={{ fontSize: '0.72rem', marginTop: '2px' }}>
								<span className='fw-semibold'>Parent:</span> {parent.name}{' '}
								{parent.username && (
									<span className='font-monospace text-muted'>
										({parent.username})
									</span>
								)}
							</div>
						)}
					</div>
				);
			},
		},
		{
			key: 'document',
			header: 'Document Type',
			width: '180px',
			minWidth: '160px',
			headerStyle: { width: '180px', minWidth: '160px' },
			render: (row) => {
				const docName =
					row.document_type?.document_name ||
					row.kyc_type ||
					row.kyc_request?.kyc_type ||
					'-';
				const isAadhaar =
					docName.toLowerCase().includes('aadhaar') ||
					docName.toLowerCase().includes('adhar');
				const service =
					row.verification_service ||
					row.document_type?.verification_service;

				return (
					<div>
						<div className='d-flex align-items-center gap-1 mb-1'>
							<span
								className={`badge ${
									isAadhaar
										? 'bg-info-subtle text-info border border-info-subtle'
										: 'bg-secondary-subtle text-secondary border'
								}`}>
								{docName}
							</span>
						</div>
						{service && (
							<div
								className='text-muted'
								style={{ fontSize: '0.75rem' }}>
								{service.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
							</div>
						)}
						{row.document_number && (
							<div
								className='font-monospace fw-bold text-dark'
								style={{ fontSize: '0.8125rem' }}>
								{row.document_number}
							</div>
						)}
					</div>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			align: 'center',
			headerAlign: 'center',
			width: '130px',
			minWidth: '120px',
			headerStyle: { width: '130px', minWidth: '120px' },
			render: (row) => {
				const status = (row.status || '').toLowerCase();
				const isVerified = status === 'verified' || status === 'approved';
				const isPending = status === 'pending' || status === 'in_review';
				const color = isVerified ? 'success' : isPending ? 'warning' : 'danger';

				return (
					<PillBadge color={color} isPill size='md'>
						{formatStatus(row.status)}
					</PillBadge>
				);
			},
		},
		{
			key: 'created_at',
			header: 'Created Date',
			align: 'center',
			headerAlign: 'center',
			width: '160px',
			minWidth: '150px',
			headerStyle: { width: '160px', minWidth: '150px' },
			render: (row) => {
				if (!row.created_at) return '-';
				const { date, time } = formatDateTime(row.created_at);
				return (
					<div className='d-flex flex-column'>
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
	];

	return (
		<PageWrapper title='KYC Requests' permissionKey={PERMISSION_KEYS.KYC_REQUEST}>
			<Page container='fluid'>
				<ListingPage<IKycRequestItem>
					title='KYC Requests'
					breadcrumbs={[
						{ text: 'User Management' },
						{ text: 'KYC Requests' },
					]}
					permissionKey={PERMISSION_KEYS.KYC_REQUEST}

					// RIGHT-ALIGNED COMPACT FILTER SECTION
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className='d-flex align-items-end justify-content-end flex-wrap gap-3 w-100'>
							{/* GENERAL KEYWORD SEARCH */}
							<div style={{ width: '190px' }}>
								<label htmlFor='kycSearch' className='filter-field-label'>Search</label>
								<input
									id='kycSearch'
									type='text'
									className='form-control'
									placeholder='Search doc / user...'
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* APPLICANT NAME SPECIFIC FILTER */}
							<div style={{ width: '160px' }}>
								<label htmlFor='applicantNameFilter' className='filter-field-label'>Applicant Name</label>
								<input
									id='applicantNameFilter'
									type='text'
									className='form-control'
									placeholder='Filter by name...'
									value={adminNameFilter}
									onChange={(e) => {
										setAdminNameFilter(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* STATUS FILTER DROPDOWN */}
							<div style={{ width: '140px' }}>
								<label htmlFor='kycStatusFilter' className='filter-field-label'>Status</label>
								<select
									id='kycStatusFilter'
									className='form-select'
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value=''>All Status</option>
									{statusOptions.length > 0 ? (
										statusOptions.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))
									) : (
										<>
											<option value='pending'>Pending</option>
											<option value='verified'>Verified</option>
											<option value='failed'>Failed</option>
											<option value='rejected'>Rejected</option>
										</>
									)}
								</select>
							</div>

							{/* DOCUMENT TYPE FILTER DROPDOWN */}
							<div style={{ width: '160px' }}>
								<label htmlFor='docTypeFilter' className='filter-field-label'>Document Type</label>
								<select
									id='docTypeFilter'
									className='form-select'
									value={docTypeFilter}
									onChange={(e) => {
										setDocTypeFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value=''>All Documents</option>
									{docTypeOptions.map((docType) => (
										<option key={docType.id} value={docType.id}>
											{docType.document_name}
										</option>
									))}
								</select>
							</div>

							{/* DATE RANGE PICKER */}
							<div style={{ width: '230px' }}>
								<span className='filter-field-label d-block'>Date Range</span>
								<DateRangePicker
									startDate={startDate}
									endDate={endDate}
									placeholder='Select Start & End Date'
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
									type='button'
									className='btn-reset-filters'
									disabled={activeFilterCount === 0}
									onClick={handleResetFilters}>
									<Icon icon='Refresh' size='sm' />
									<span>Reset</span>
								</button>
							</div>
						</div>
					}

					// TABLE DATA & LOADING
					columns={columns}
					data={requests}
					isLoading={isLoading}
					emptyMessage='No KYC requests found'
					emptyIcon='FolderShared'

					// ROW ACTIONS: VIEW DETAILS
					actions={{
						permissionKey: PERMISSION_KEYS.KYC_REQUEST,
						actionColumnWidth: '100px',
						onView: (req) => {
							navigate(
								`/${PAGE_ROUTES.KYC_REQUESTS_VIEW.replace(
									':id',
									encryptId(req.id),
								)}`,
							);
						},
					}}

					// PAGINATION
					pagination={{
						currentPage,
						totalItems: totalDocuments,
						perPage,
						onPageChange: (page) => setCurrentPage(page),
						onPerPageChange: (newPerPage) => {
							setPerPage(newPerPage);
							setCurrentPage(1);
						},
					}}
				/>
			</Page>
		</PageWrapper>
	);
};

export default KycRequestListPage;
