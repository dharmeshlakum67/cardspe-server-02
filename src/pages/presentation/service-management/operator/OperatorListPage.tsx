/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, no-nested-ternary */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import operatorService from './service/operatorService';
import {
	IOperator,
	OperatorStatusType,
	IActiveServiceCategoryOption,
} from './type/operator-type';
import showNotification from '../../../../components/extras/showNotification';
import Icon from '../../../../components/icon/Icon';
import {
	ConfirmationModal,
	StatusToggle,
	DateRangePicker,
	ImagePreviewModal,
	PillBadge,
} from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { encryptId } from '../../../../helpers/routeEncryption';
import constantService, { IConstantOption } from '../../../../services/constantService';
import { getImageUrl } from '../../../../helpers/helpers';
import { formatDateTime } from '../../../../helpers/dateUtils';

export const OperatorListPage: FC = () => {
	const navigate = useNavigate();
	const [operators, setOperators] = useState<IOperator[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// ACTIVE CATEGORIES FOR FILTER DROPDOWN
	const [categories, setCategories] = useState<IActiveServiceCategoryOption[]>([]);

	// IMAGE PREVIEW MODAL STATE
	const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

	const handleOpenImagePreview = (url: string, title: string) => {
		setPreviewImage({ url, title });
		setIsPreviewModalOpen(true);
	};

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [operatorToDelete, setOperatorToDelete] = useState<IOperator | null>(null);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	// STATUS TOGGLE IN-PROGRESS STATE
	const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

	// DYNAMIC CONSTANTS (STATUS)
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
	]);

	// FILTER STATES
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearchTerm = useDebounce(searchTerm, 500);
	const [categoryFilter, setCategoryFilter] = useState<string>('');
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [bbpsFilter, setBbpsFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');

	// PAGINATION STATES
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, canCreate, canUpdate, canDelete, isLoadingPermissions } = usePermission();

	// REF TO PREVENT DUPLICATE FETCHES ON MOUNT
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// ACTIVE FILTER COUNT
	const activeFilterCount =
		(searchTerm.trim() ? 1 : 0) +
		(categoryFilter ? 1 : 0) +
		(statusFilter ? 1 : 0) +
		(bbpsFilter !== '' ? 1 : 0) +
		(startDate && endDate ? 1 : 0);

	// LOAD CATEGORIES & STATUS OPTIONS ON MOUNT
	useEffect(() => {
		let isMounted = true;
		operatorService
			.getActiveServiceCategories()
			.then((res) => {
				if (isMounted && Array.isArray(res?.data)) {
					setCategories(res.data);
				}
			})
			.catch(() => { });

		constantService
			.getStatusConstants()
			.then((sOpts) => {
				if (isMounted && sOpts && sOpts.length > 0) {
					setStatusOptions(sOpts);
				}
			})
			.catch(() => { });

		return () => {
			isMounted = false;
		};
	}, []);

	// FETCH OPERATORS FROM API
	const fetchOperators = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.SERVICE_MANAGEMENT) &&
					!canRead(PERMISSION_KEYS.OPERATOR) &&
					!canRead('operator'))
			) {
				return;
			}

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${debouncedSearchTerm}_${categoryFilter}_${statusFilter}_${bbpsFilter}_${isDateRangeValid ? `${startDate}_${endDate}` : ''
				}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			setIsLoading(true);

			try {
				const response = await operatorService.getOperators({
					page: currentPage,
					limit: perPage,
					search: debouncedSearchTerm.trim() || undefined,
					service_category_id: categoryFilter || undefined,
					status: (statusFilter as OperatorStatusType) || undefined,
					is_bbps_enabled:
						bbpsFilter === 'true' ? true : bbpsFilter === 'false' ? false : undefined,
					startDate: isDateRangeValid ? startDate : undefined,
					endDate: isDateRangeValid ? endDate : undefined,
					sortDirection: 'ASC',
				});

				const respAny = response as any;
				const rawData = respAny?.data;
				let fetchedData: IOperator[] = [];
				let count = 0;

				if (Array.isArray(rawData)) {
					fetchedData = rawData;
				} else if (rawData && typeof rawData === 'object') {
					if (Array.isArray(rawData.rows)) {
						fetchedData = rawData.rows;
					} else if (Array.isArray(rawData.operators)) {
						fetchedData = rawData.operators;
					} else if (Array.isArray(rawData.list)) {
						fetchedData = rawData.list;
					} else if (Array.isArray(rawData.data)) {
						fetchedData = rawData.data;
					}
				} else if (Array.isArray(respAny?.rows)) {
					fetchedData = respAny.rows;
				}

				if (typeof respAny?.total_document === 'number') {
					count = respAny.total_document;
				} else if (typeof respAny?.totalDocuments === 'number') {
					count = respAny.totalDocuments;
				} else if (typeof respAny?.total === 'number') {
					count = respAny.total;
				} else if (typeof respAny?.count === 'number') {
					count = respAny.count;
				} else if (rawData && typeof rawData === 'object') {
					if (typeof rawData.count === 'number') {
						count = rawData.count;
					} else if (typeof rawData.total === 'number') {
						count = rawData.total;
					} else if (typeof rawData.total_document === 'number') {
						count = rawData.total_document;
					} else if (typeof rawData.totalDocuments === 'number') {
						count = rawData.totalDocuments;
					}
				}

				if (!count && fetchedData.length > 0) {
					count = fetchedData.length;
				}

				setOperators(fetchedData);
				setTotalDocuments(count);
				lastFetchKeyRef.current = currentFetchKey;
			} catch (error: any) {
				showNotification('Error', error?.message || 'Failed to fetch operators.', 'danger');
				setOperators([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			canRead,
			categoryFilter,
			currentPage,
			debouncedSearchTerm,
			endDate,
			bbpsFilter,
			isLoadingPermissions,
			perPage,
			startDate,
			statusFilter,
		],
	);

	// SANITIZE DATA
	const sanitizeData = (data: any) => {
		if (typeof data !== "string" || !data) return "-";

		return data
			.replaceAll("_", " ")
			.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	useEffect(() => {
		fetchOperators();
	}, [fetchOperators]);

	// HANDLE STATUS TOGGLE
	const handleStatusToggle = async (operator: IOperator) => {
		const canToggle =
			canUpdate(PERMISSION_KEYS.SERVICE_MANAGEMENT) ||
			canUpdate(PERMISSION_KEYS.OPERATOR) ||
			canUpdate('operator');
		if (!canToggle) {
			showNotification(
				'Permission Denied',
				'You do not have permission to update operator status.',
				'warning',
			);
			return;
		}

		const newStatus: OperatorStatusType = operator.status === 'active' ? 'inactive' : 'active';
		setUpdatingStatusId(operator.id);

		try {
			await operatorService.updateOperatorStatus(operator.id, newStatus);
			showNotification(
				'Success',
				`Operator marked as ${newStatus} successfully.`,
				'success',
			);

			setOperators((prev) =>
				prev.map((item) => (item.id === operator.id ? { ...item, status: newStatus } : item)),
			);
		} catch (error: any) {
			showNotification('Error', error?.message || 'Failed to update status.', 'danger');
		} finally {
			setUpdatingStatusId(null);
		}
	};

	// HANDLE OPEN DELETE MODAL
	const handleOpenDeleteModal = (operator: IOperator) => {
		setOperatorToDelete(operator);
		setIsDeleteModalOpen(true);
	};

	// HANDLE CONFIRM DELETE
	const handleConfirmDelete = async () => {
		if (!operatorToDelete) return;

		setIsDeleting(true);
		try {
			await operatorService.deleteOperator(operatorToDelete.id);
			showNotification('Success', 'Operator deleted successfully.', 'success');
			setIsDeleteModalOpen(false);
			setOperatorToDelete(null);
			await fetchOperators(true);
		} catch (error: any) {
			showNotification('Error', error?.message || 'Failed to delete operator.', 'danger');
		} finally {
			setIsDeleting(false);
		}
	};

	// RESET FILTERS
	const handleResetFilters = () => {
		setSearchTerm('');
		setCategoryFilter('');
		setStatusFilter('');
		setBbpsFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	// TABLE COLUMNS CONFIGURATION
	const columns: IListingColumn<IOperator>[] = [
		{
			key: 'operator_code',
			header: 'Operator Code',
			align: 'center',
			headerAlign: 'center',
			width: '130px',
			minWidth: '130px',
			render: (item) => (
				<span
					className="badge bg-light text-primary font-monospace border px-2 py-1"
					style={{ fontSize: '0.8125rem', letterSpacing: '0.02em' }}>
					{item.operator_code}
				</span>
			),
		},
		{
			key: 'name',
			header: 'Operator Name',
			minWidth: '240px',
			render: (item) => {
				const imgSrc = item.icon ? getImageUrl(item.icon) : null;
				const categoryName =
					item.service_category?.name ||
					item.serviceCategory?.name ||
					item.category_name ||
					'';

				return (
					<div className="d-flex align-items-center gap-2">
						{imgSrc ? (
							<div
								role="button"
								tabIndex={0}
								onClick={() => handleOpenImagePreview(imgSrc, item.name)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										handleOpenImagePreview(imgSrc, item.name);
									}
								}}
								className="d-inline-flex align-items-center justify-content-center rounded-3 bg-light border overflow-hidden shadow-sm cursor-pointer flex-shrink-0"
								style={{ width: '38px', height: '38px' }}
								title="Click to view full logo">
								<img
									src={imgSrc}
									alt={item.name}
									className="w-100 h-100 object-fit-contain p-1"
									onError={(e) => {
										(e.target as HTMLElement).style.display = 'none';
									}}
								/>
							</div>
						) : (
							<div
								className="d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-primary border flex-shrink-0"
								style={{ width: '38px', height: '38px' }}>
								<Icon icon="Hub" size="lg" />
							</div>
						)}
						<div className="d-flex flex-column">
							<span className="fw-bold text-dark" style={{ fontSize: '0.9375rem' }}>
								{item.name}
							</span>
							{categoryName && (
								<span className="text-muted small" style={{ fontSize: '0.78rem' }}>
									{item.short_name ? `(${item.short_name})` : ""}
								</span>
							)}
						</div>
					</div>
				);
			},
		},
		{
			key: 'slug',
			header: 'Slug',
			minWidth: '150px',
			render: (item) => {
				return (
					<span
						className="text-dark px-2 py-1"
						style={{ fontSize: '0.8125rem' }}>
						{item.slug}
					</span>
				);
			},
		},
		{
			key: 'service_category_id',
			header: 'Category',
			minWidth: '150px',
			render: (item) => {
				const categoryName =
					item.service_category?.name ||
					item.serviceCategory?.name ||
					item.category_name ||
					'-';
				return (
					<span
						className="badge bg-light text-dark border px-2 py-1"
						style={{ fontSize: '0.8125rem' }}>
						{categoryName}
					</span>
				);
			},
		},
		{
			key: 'biller_id',
			header: 'Biller ID',
			align: 'center',
			headerAlign: 'center',
			width: '150px',
			minWidth: '150px',
			render: (item) => (
				<span
					className="badge bg-light text-muted font-monospace border px-2 py-1"
					style={{ fontSize: '0.8rem' }}>
					{item.biller_id || '-'}
				</span>
			),
		},
		{
			key: 'bill_fetch_requirement',
			header: 'Bill Fetch Required?',
			align: 'center',
			headerAlign: 'center',
			width: '150px',
			minWidth: '150px',
			render: (item) => (
				<span
					className="badge bg-light text-muted font-monospace border px-2 py-1"
					style={{ fontSize: '0.8rem' }}>
					{sanitizeData(item.bill_fetch_requirement) || '-'}
				</span>
			),
		},
		{
			key: 'circle_id',
			header: 'Circle ID',
			align: 'center',
			headerAlign: 'center',
			width: '150px',
			minWidth: '150px',
			render: (item) => (
				<span
					className="badge bg-light text-muted font-monospace border px-2 py-1"
					style={{ fontSize: '0.8rem' }}>
					{sanitizeData(item.circle_id) || '-'}
				</span>
			),
		},
		{
			key: 'payment_channel',
			header: 'Payment Chanel',
			align: 'center',
			headerAlign: 'center',
			width: '150px',
			minWidth: '150px',
			render: (item) => (
				<span
					className="badge bg-light text-muted font-monospace border px-2 py-1"
					style={{ fontSize: '0.8rem' }}>
					{item.payment_channel || '-'}
				</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			align: 'center',
			headerAlign: 'center',
			width: '150px',
			minWidth: '150px',
			render: (item) => {
				const isChecked = item.status === 'active';
				const canToggle =
					canUpdate(PERMISSION_KEYS.SERVICE_MANAGEMENT) ||
					canUpdate(PERMISSION_KEYS.OPERATOR) ||
					canUpdate('operator');

				return (
					<div className="d-flex align-items-center justify-content-center">
						<StatusToggle
							checked={isChecked}
							onChange={() => handleStatusToggle(item)}
							disabled={!canToggle || updatingStatusId === item.id}
							isLoading={updatingStatusId === item.id}
							statusOptions={statusOptions}
							ariaLabel={`Toggle status for ${item.name}`}
						/>
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
			minWidth: '160px',
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
	];

	return (
		<PageWrapper isProtected permissionKey={PERMISSION_KEYS.OPERATOR} title="Operator Management">
			<Page container="fluid">
				<ListingPage<IOperator>
					title="Operator Management"
					subTitle="Manage BBPS billers, dynamic input parameters, and payment modes"
					breadcrumbs={[{ text: 'Service Management' }, { text: 'Operators' }]}
					permissionKey={PERMISSION_KEYS.OPERATOR}
					onAddNew={
						canCreate(PERMISSION_KEYS.SERVICE_MANAGEMENT) ||
							canCreate(PERMISSION_KEYS.OPERATOR) ||
							canCreate('operator')
							? () => navigate(`/${PAGE_ROUTES.OPERATOR_ADD}`)
							: undefined
					}
					addNewText="+ Add New Operator"
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className="d-flex align-items-end justify-content-end flex-wrap gap-3 w-100">
							{/* SEARCH INPUT */}
							<div style={{ width: '220px' }}>
								<label htmlFor="opSearch" className="form-label fw-bold small mb-1">
									Search
								</label>
								<input
									id="opSearch"
									type="text"
									className="form-control"
									placeholder="Name, Code, Biller ID..."
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
									style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
								/>
							</div>

							{/* CATEGORY FILTER */}
							<div style={{ width: '180px' }}>
								<label htmlFor="categoryFilterSelect" className="form-label fw-bold small mb-1">
									Category
								</label>
								<select
									id="categoryFilterSelect"
									className="form-select"
									value={categoryFilter}
									onChange={(e) => {
										setCategoryFilter(e.target.value);
										setCurrentPage(1);
									}}
									style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
									<option value="">All Categories</option>
									{categories.map((cat) => (
										<option key={cat.id} value={cat.id}>
											{cat.name}
										</option>
									))}
								</select>
							</div>

							{/* STATUS FILTER */}
							<div style={{ width: '140px' }}>
								<label htmlFor="statusFilterSelect" className="form-label fw-bold small mb-1">
									Status
								</label>
								<select
									id="statusFilterSelect"
									className="form-select"
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value);
										setCurrentPage(1);
									}}
									style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
									<option value="">All Status</option>
									{statusOptions.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
							</div>

							{/* BBPS FILTER */}
							<div style={{ width: '140px' }}>
								<label htmlFor="bbpsFilterSelect" className="form-label fw-bold small mb-1">
									BBPS
								</label>
								<select
									id="bbpsFilterSelect"
									className="form-select"
									value={bbpsFilter}
									onChange={(e) => {
										setBbpsFilter(e.target.value);
										setCurrentPage(1);
									}}
									style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
									<option value="">All BBPS</option>
									<option value="true">BBPS Enabled</option>
									<option value="false">Non-BBPS</option>
								</select>
							</div>

							{/* DATE RANGE FILTER */}
							<div style={{ width: '220px' }}>
								<span className="form-label fw-bold small mb-1 d-block">Date Range</span>
								<DateRangePicker
									startDate={startDate}
									endDate={endDate}
									placeholder="Select Date Range"
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

							{/* RESET FILTERS */}
							{activeFilterCount > 0 && (
								<button
									type="button"
									className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
									style={{ height: '38px', borderRadius: '0.5rem' }}
									onClick={handleResetFilters}>
									<Icon icon="RestartAlt" size="sm" />
									<span>Reset</span>
								</button>
							)}
						</div>
					}
					columns={columns}
					data={operators}
					isLoading={isLoading}
					emptyMessage="No operators found matching the criteria."
					emptyIcon="Hub"
					actions={{
						permissionKey: PERMISSION_KEYS.OPERATOR,
						actionColumnWidth: '150px',
						onView: (opItem) =>
							navigate(`/${PAGE_ROUTES.OPERATORS}/view/${encryptId(opItem.id)}`),
						onEdit: (opItem) =>
							navigate(`/${PAGE_ROUTES.OPERATORS}/edit/${encryptId(opItem.id)}`),
						onDelete: (opItem) => handleOpenDeleteModal(opItem),
					}}
					pagination={{
						currentPage,
						totalItems: totalDocuments,
						perPage,
						onPageChange: (page: number) => setCurrentPage(page),
						onPerPageChange: (newPerPage: number) => {
							setPerPage(newPerPage);
							setCurrentPage(1);
						},
					}}
				/>

				{/* DELETE CONFIRMATION MODAL */}
				{isDeleteModalOpen && (
					<ConfirmationModal
						isOpen={isDeleteModalOpen}
						setIsOpen={setIsDeleteModalOpen}
						title="Delete Operator"
						message={`Are you sure you want to delete "${operatorToDelete?.name}"? This action cannot be undone.`}
						confirmText="Delete"
						cancelText="Cancel"
						isLoading={isDeleting}
						onConfirm={handleConfirmDelete}
					/>
				)}

				{/* IMAGE PREVIEW MODAL */}
				{isPreviewModalOpen && previewImage && (
					<ImagePreviewModal
						isOpen={isPreviewModalOpen}
						setIsOpen={setIsPreviewModalOpen}
						imageUrl={previewImage.url}
						title={previewImage.title}
					/>
				)}
			</Page>
		</PageWrapper>
	);
};

export default OperatorListPage;
