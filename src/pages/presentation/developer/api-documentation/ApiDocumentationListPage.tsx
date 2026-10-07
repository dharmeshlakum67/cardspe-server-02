/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, no-nested-ternary, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import { PillBadge } from '../../../../components/common/PillBadge';
import { ConfirmationModal, DateRangePicker } from '../../../../components/common';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';
import { formatDateTime } from '../../../../helpers/dateUtils';
import { encryptId } from '../../../../helpers/routeEncryption';
import {
	IApiDocumentation,
	TApiDocMethod,
	TApiDocStatus,
} from './type/api-documentation.type';
import apiDocumentationService from './service/apiDocumentationService';
import ApiDocMethodBadge from './components/ApiDocMethodBadge';
import './css/ApiDocumentation.scss';

const STATUS_OPTIONS = [
	{ label: 'Published', value: 'published' },
	{ label: 'Draft', value: 'draft' },
	{ label: 'Archived', value: 'archived' },
];

export const ApiDocumentationListPage: FC = () => {
	const navigate = useNavigate();
	const { canRead, canUpdate, canDelete, hasPermission, isLoadingPermissions } = usePermission();

	const hasRead =
		canRead(PERMISSION_KEYS.API_DOCUMENTATION) ||
		canRead(PERMISSION_KEYS.DEVELOPER) ||
		canRead('api_documentation') ||
		canRead('developer');

	const hasPortal =
		hasPermission(PERMISSION_KEYS.API_DOCUMENTATION, 'portal') ||
		hasPermission(PERMISSION_KEYS.DEVELOPER, 'portal') ||
		hasPermission('api_documentation', 'portal') ||
		hasPermission('developer', 'portal');

	const hasUpdate =
		canUpdate(PERMISSION_KEYS.API_DOCUMENTATION) ||
		canUpdate(PERMISSION_KEYS.DEVELOPER);

	const hasDelete =
		canDelete(PERMISSION_KEYS.API_DOCUMENTATION) ||
		canDelete(PERMISSION_KEYS.DEVELOPER);

	// REDIRECT PORTAL-ONLY USERS DIRECTLY TO THE DEVELOPER PORTAL
	useEffect(() => {
		if (isLoadingPermissions) return;

		if (hasPortal && !hasRead) {
			navigate(`/${PAGE_ROUTES.API_DOCUMENTATION_PORTAL}`, { replace: true });
			return;
		}

		if (!hasRead && !hasPortal) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, hasPortal, hasRead, navigate]);

	// DATA STATES
	const [documentations, setDocumentations] = useState<IApiDocumentation[]>([]);
	const [categories, setCategories] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [docToDelete, setDocToDelete] = useState<IApiDocumentation | null>(null);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	// FILTER STATES
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearchTerm = useDebounce(searchTerm, 1200);
	const [categoryFilter, setCategoryFilter] = useState<string>('');
	const [methodFilter, setMethodFilter] = useState<string>('');
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');

	// PAGINATION STATES
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	// REF TO PREVENT DUPLICATE FETCHES
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);
	const hasFetchedCategoriesRef = useRef<boolean>(false);

	// LOAD CATEGORIES
	const fetchCategories = useCallback(async (force = false) => {
		if (!force && hasFetchedCategoriesRef.current) return;
		hasFetchedCategoriesRef.current = true;
		try {
			const res = await apiDocumentationService.getDistinctCategories();
			if (res?.data && Array.isArray(res.data)) {
				setCategories(res.data);
			}
		} catch (error) {
			console.error('Failed to load categories:', error);
		}
	}, []);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	// FETCH DOCUMENTATION LIST
	const fetchDocumentations = useCallback(
		async (force = false) => {
			if (isLoadingPermissions || !hasRead) return;

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${debouncedSearchTerm.trim()}_${categoryFilter}_${methodFilter}_${statusFilter}_${
				isDateRangeValid ? `${startDate}_${endDate}` : ''
			}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const response = await apiDocumentationService.getAllApiDocumentations({
					page: currentPage,
					limit: perPage,
					search: debouncedSearchTerm.trim() || undefined,
					category_group: categoryFilter || undefined,
					method: (methodFilter as TApiDocMethod) || undefined,
					status: (statusFilter as TApiDocStatus) || undefined,
					start_date: isDateRangeValid ? startDate : undefined,
					end_date: isDateRangeValid ? endDate : undefined,
				});

				setDocumentations(response?.data || []);
				setTotalDocuments(response?.total_document || 0);
				lastFetchKeyRef.current = currentFetchKey;
			} catch (error: any) {
				console.error('Error fetching API documentations:', error);
				showNotification(
					'Error',
					error?.message || 'Failed to load API documentations.',
					'danger',
				);
				setDocumentations([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			isLoadingPermissions,
			hasRead,
			debouncedSearchTerm,
			categoryFilter,
			methodFilter,
			statusFilter,
			startDate,
			endDate,
			currentPage,
			perPage,
		],
	);

	useEffect(() => {
		fetchDocumentations();
	}, [fetchDocumentations]);

	// DELETE CONFIRMATION HANDLER
	const handleDeleteConfirm = async () => {
		if (!docToDelete) return;
		setIsDeleting(true);
		try {
			await apiDocumentationService.deleteApiDocumentation(docToDelete.id);
			showNotification('Success', 'API Documentation deleted successfully.', 'success');
			setIsDeleteModalOpen(false);
			setDocToDelete(null);
			fetchDocumentations(true);
			fetchCategories();
		} catch (error: any) {
			showNotification('Error', error?.message || 'Failed to delete documentation.', 'danger');
		} finally {
			setIsDeleting(false);
		}
	};

	// RESET FILTERS
	const handleResetFilters = () => {
		setSearchTerm('');
		setCategoryFilter('');
		setMethodFilter('');
		setStatusFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	const activeFilterCount = [
		searchTerm,
		categoryFilter,
		methodFilter,
		statusFilter,
		startDate && endDate ? `${startDate}_${endDate}` : '',
	].filter(Boolean).length;

	// TABLE COLUMNS CONFIGURATION
	const columns: IListingColumn<IApiDocumentation>[] = [
		{
			key: 'title',
			header: 'Endpoint / Title',
			align: 'start',
			headerAlign: 'start',
			width: '320px',
			minWidth: '280px',
			headerStyle: { width: '320px', minWidth: '280px' },
			render: (item) => (
				<div className='d-flex align-items-center gap-3'>
					<div
						className='d-flex align-items-center justify-content-center rounded-3 bg-light text-primary flex-shrink-0'
						style={{ width: '40px', height: '40px', border: '1px solid #e2e8f0' }}>
						<Icon icon='Code' size='lg' />
					</div>
					<div className='d-flex flex-column'>
						<span
							className='fw-bold text-dark'
							style={{ cursor: 'pointer', fontSize: '0.925rem' }}
							onClick={() =>
								navigate(
									`/${PAGE_ROUTES.API_DOCUMENTATION_VIEW.replace(
										':id',
										encryptId(item.id),
									)}`,
								)
							}>
							{item.title}
						</span>
						<span
							className='text-muted font-monospace'
							style={{ fontSize: '0.78rem' }}>
							/api{item.endpoint?.startsWith('/') ? item.endpoint : `/${item.endpoint || ''}`}
						</span>
					</div>
				</div>
			),
		},
		{
			key: 'method',
			header: 'Method',
			align: 'center',
			headerAlign: 'center',
			width: '120px',
			minWidth: '120px',
			headerStyle: { width: '120px', minWidth: '120px' },
			render: (item) => (
				<ApiDocMethodBadge method={item.method} size='sm' isPill />
			),
		},
		{
			key: 'category_group',
			header: 'Category',
			align: 'center',
			headerAlign: 'center',
			width: '180px',
			minWidth: '160px',
			headerStyle: { width: '180px', minWidth: '160px' },
			render: (item) => (
				<PillBadge color='purple' isPill size='md'>
					{item.category_group || 'General'}
				</PillBadge>
			),
		},
		{
			key: 'display_order',
			header: 'Order',
			align: 'center',
			headerAlign: 'center',
			width: '100px',
			minWidth: '90px',
			headerStyle: { width: '100px', minWidth: '90px' },
			render: (item) => (
				<span className='fw-semibold text-dark' style={{ fontSize: '0.85rem' }}>
					#{item.display_order ?? 0}
				</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			align: 'center',
			headerAlign: 'center',
			width: '140px',
			minWidth: '130px',
			headerStyle: { width: '140px', minWidth: '130px' },
			render: (item) => {
				const currentStatus = (item.status || 'draft').toLowerCase() as TApiDocStatus;
				return (
					<div className='d-flex align-items-center justify-content-center'>
						<PillBadge
							color={
								currentStatus === 'published'
									? 'green'
									: currentStatus === 'draft'
									? 'amber'
									: 'gray'
							}
							isPill
							size='sm'>
							{currentStatus === 'published'
								? 'Published'
								: currentStatus === 'draft'
								? 'Draft'
								: 'Archived'}
						</PillBadge>
					</div>
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
			render: (item) => {
				if (!item.created_at) return <span className='text-muted'>-</span>;
				const { date, time } = formatDateTime(item.created_at);
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
		<PageWrapper title='API Documentation'>
			<Page container='fluid'>
				<ListingPage<IApiDocumentation>
					title='API Documentation'
					breadcrumbs={[
						{ text: 'Developer' },
						{ text: 'API Documentation' },
					]}
					headerActions={
						<button
							type='button'
							className='btn-portal-shortcut d-inline-flex align-items-center gap-2'
							onClick={() => navigate(`/${PAGE_ROUTES.API_DOCUMENTATION_PORTAL}`)}>
							<Icon icon='MenuBook' size='sm' />
							<span>Developer Portal</span>
						</button>
					}
					permissionKey={PERMISSION_KEYS.API_DOCUMENTATION}
					onAddNew={() => {
						navigate(`/${PAGE_ROUTES.API_DOCUMENTATION_ADD}`);
					}}
					addNewText='Create Documentation'
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className='d-flex align-items-end justify-content-end flex-wrap gap-3 w-100'>
							{/* SEARCH INPUT */}
							<div style={{ width: '220px' }}>
								<label htmlFor='apiDocSearch' className='filter-field-label'>
									Search
								</label>
								<input
									id='apiDocSearch'
									type='text'
									className='form-control'
									placeholder='Search title, endpoint...'
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* CATEGORY FILTER */}
							<div style={{ width: '160px' }}>
								<label htmlFor='apiCategoryFilter' className='filter-field-label'>
									Category
								</label>
								<select
									id='apiCategoryFilter'
									className='form-select'
									value={categoryFilter}
									onChange={(e) => {
										setCategoryFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value=''>All Categories</option>
									{categories.map((cat) => (
										<option key={cat} value={cat}>
											{cat}
										</option>
									))}
								</select>
							</div>

							{/* METHOD FILTER */}
							<div style={{ width: '130px' }}>
								<label htmlFor='apiMethodFilter' className='filter-field-label'>
									Method
								</label>
								<select
									id='apiMethodFilter'
									className='form-select'
									value={methodFilter}
									onChange={(e) => {
										setMethodFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value=''>All Methods</option>
									<option value='GET'>GET</option>
									<option value='POST'>POST</option>
									<option value='PUT'>PUT</option>
									<option value='PATCH'>PATCH</option>
									<option value='DELETE'>DELETE</option>
								</select>
							</div>

							{/* STATUS FILTER */}
							<div style={{ width: '140px' }}>
								<label htmlFor='apiStatusFilter' className='filter-field-label'>
									Status
								</label>
								<select
									id='apiStatusFilter'
									className='form-select'
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value=''>All Status</option>
									{STATUS_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
							</div>

							{/* DATE RANGE FILTER */}
							<div style={{ width: '240px' }}>
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
					columns={columns}
					data={documentations}
					isLoading={isLoading}
					emptyMessage='No API documentations found'
					emptyIcon='MenuBook'
					pagination={{
						currentPage,
						totalItems: totalDocuments,
						perPage,
						onPageChange: (page: number) => setCurrentPage(page),
						onPerPageChange: (limit: number) => {
							setPerPage(limit);
							setCurrentPage(1);
						},
					}}
					actions={{
						permissionKey: PERMISSION_KEYS.API_DOCUMENTATION,
						actionColumnWidth: '160px',
						onView: (doc) => {
							navigate(
								`/${PAGE_ROUTES.API_DOCUMENTATION_VIEW.replace(
									':id',
									encryptId(doc.id),
								)}`,
							);
						},
						onEdit: (doc) => {
							navigate(
								`/${PAGE_ROUTES.API_DOCUMENTATION_EDIT.replace(
									':id',
									encryptId(doc.id),
								)}`,
							);
						},
						onDelete: (doc) => {
							setDocToDelete(doc);
							setIsDeleteModalOpen(true);
						},
					}}
				/>

				{/* DELETE CONFIRMATION MODAL */}
				<ConfirmationModal
					isOpen={isDeleteModalOpen}
					setIsOpen={setIsDeleteModalOpen}
					title='Delete API Documentation'
					message={`Are you sure you want to delete "${docToDelete?.title}"? This action can be reversed by administrators.`}
					confirmText='Delete'
					cancelText='Cancel'
					isLoading={isDeleting}
					onConfirm={handleDeleteConfirm}
				/>
			</Page>
		</PageWrapper>
	);
};

export default ApiDocumentationListPage;
