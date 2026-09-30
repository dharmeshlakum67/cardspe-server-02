/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import serviceCategoryService from './service/serviceCategoryService';
import {
	IServiceCategory,
	ServiceCategoryStatusType,
} from './type/service-category-type';
import ServiceCategoryModal from './ServiceCategoryModal';
import showNotification from '../../../../components/extras/showNotification';
import Icon from '../../../../components/icon/Icon';
import { ConfirmationModal, StatusToggle, DateRangePicker, ImagePreviewModal } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { formatDateTime } from '../../../../helpers/dateUtils';
import constantService, { IConstantOption } from '../../../../services/constantService';
import { getImageUrl } from '../../../../helpers/helpers';
import './service-category.scss';

export const ServiceCategoryListPage: FC = () => {
	const [categories, setCategories] = useState<IServiceCategory[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// IMAGE PREVIEW MODAL STATE
	const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

	const handleOpenImagePreview = (url: string, title: string) => {
		setPreviewImage({ url, title });
		setIsPreviewModalOpen(true);
	};

	// ADD / EDIT MODAL STATES
	const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
	const [selectedCategory, setSelectedCategory] = useState<IServiceCategory | null>(null);
	const [isSubmittingCategory, setIsSubmittingCategory] = useState<boolean>(false);

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [categoryToDelete, setCategoryToDelete] = useState<IServiceCategory | null>(null);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	// STATUS TOGGLE IN-PROGRESS STATE
	const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

	// DYNAMIC CONSTANTS (STATUS)
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
	]);

	useEffect(() => {
		let isMounted = true;
		const loadConstants = async () => {
			try {
				const sOpts = await constantService.getStatusConstants();
				if (isMounted && sOpts && sOpts.length > 0) {
					setStatusOptions(sOpts);
				}
			} catch (err) {
				// Keep default status options
			}
		};
		loadConstants();
		return () => {
			isMounted = false;
		};
	}, []);

	// FILTER STATES
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearchTerm = useDebounce(searchTerm, 800);
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');

	// PAGINATION STATES
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, canUpdate, isLoadingPermissions } = usePermission();

	// REF TO PREVENT DUPLICATE FETCHES ON MOUNT
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// ACTIVE FILTER COUNT
	const activeFilterCount =
		(searchTerm.trim() ? 1 : 0) +
		(statusFilter ? 1 : 0) +
		(startDate && endDate ? 1 : 0);

	// FETCH CATEGORIES FROM API
	const fetchCategories = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.SERVICE_MANAGEMENT) &&
					!canRead(PERMISSION_KEYS.SERVICE_CATEGORY) &&
					!canRead('service_category'))
			) {
				return;
			}

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${debouncedSearchTerm}_${statusFilter}_${
				isDateRangeValid ? `${startDate}_${endDate}` : ''
			}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			setIsLoading(true);

			try {
				const response = await serviceCategoryService.getServiceCategories({
					page: currentPage,
					limit: perPage,
					search: debouncedSearchTerm.trim() || undefined,
					status: (statusFilter as ServiceCategoryStatusType) || undefined,
					startDate: isDateRangeValid ? startDate : undefined,
					endDate: isDateRangeValid ? endDate : undefined,
				});

				const fetchedData = Array.isArray(response?.data) ? response.data : [];
				let count = fetchedData.length;
				if (typeof response?.total_document === 'number') {
					count = response.total_document;
				} else if (typeof response?.totalDocuments === 'number') {
					count = response.totalDocuments;
				}

				setCategories(fetchedData);
				setTotalDocuments(count);
				lastFetchKeyRef.current = currentFetchKey;
			} catch (error: any) {
				showNotification(
					'Error',
					error?.message || 'Failed to fetch service categories.',
					'danger',
				);
				setCategories([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			canRead,
			currentPage,
			debouncedSearchTerm,
			endDate,
			isLoadingPermissions,
			perPage,
			startDate,
			statusFilter,
		],
	);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	// HANDLE OPEN ADD MODAL
	const handleOpenAddModal = () => {
		setSelectedCategory(null);
		setIsCategoryModalOpen(true);
	};

	// HANDLE OPEN EDIT MODAL
	const handleOpenEditModal = (category: IServiceCategory) => {
		setSelectedCategory(category);
		setIsCategoryModalOpen(true);
	};

	// HANDLE MODAL SUBMIT (CREATE OR UPDATE)
	const handleCategoryModalSubmit = async (payload: FormData) => {
		setIsSubmittingCategory(true);
		try {
			if (selectedCategory) {
				const response = await serviceCategoryService.updateServiceCategory(
					selectedCategory.id,
					payload,
				);
				showNotification(
					'Success',
					response?.message || 'Service category updated successfully.',
					'success',
				);
			} else {
				const response = await serviceCategoryService.createServiceCategory(payload);
				showNotification(
					'Success',
					response?.message || 'Service category created successfully.',
					'success',
				);
			}
			setIsCategoryModalOpen(false);
			await fetchCategories(true);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to save service category.',
				'danger',
			);
		} finally {
			setIsSubmittingCategory(false);
		}
	};

	// HANDLE STATUS TOGGLE
	const handleStatusToggle = async (category: IServiceCategory) => {
		const canToggle =
			canUpdate(PERMISSION_KEYS.SERVICE_MANAGEMENT) ||
			canUpdate(PERMISSION_KEYS.SERVICE_CATEGORY) ||
			canUpdate('service_category');
		if (!canToggle) {
			showNotification('Permission Denied', 'You do not have permission to update status.', 'warning');
			return;
		}

		const newStatus: ServiceCategoryStatusType =
			category.status === 'active' ? 'inactive' : 'active';
		setUpdatingStatusId(category.id);

		try {
			await serviceCategoryService.updateServiceCategoryStatus(category.id, newStatus);
			showNotification(
				'Success',
				`Category marked as ${newStatus} successfully.`,
				'success',
			);

			setCategories((prev) =>
				prev.map((item) => (item.id === category.id ? { ...item, status: newStatus } : item)),
			);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to update category status.',
				'danger',
			);
		} finally {
			setUpdatingStatusId(null);
		}
	};

	// HANDLE OPEN DELETE MODAL
	const handleOpenDeleteModal = (category: IServiceCategory) => {
		setCategoryToDelete(category);
		setIsDeleteModalOpen(true);
	};

	// HANDLE CONFIRM DELETE
	const handleConfirmDelete = async () => {
		if (!categoryToDelete) return;

		setIsDeleting(true);
		try {
			await serviceCategoryService.deleteServiceCategory(categoryToDelete.id);
			showNotification('Success', 'Service category deleted successfully.', 'success');
			setIsDeleteModalOpen(false);
			setCategoryToDelete(null);
			await fetchCategories(true);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to delete service category.',
				'danger',
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// RESET FILTERS
	const handleResetFilters = () => {
		setSearchTerm('');
		setStatusFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	// TABLE COLUMNS CONFIGURATION
	const columns: IListingColumn<IServiceCategory>[] = [
		{
			key: 'icon',
			header: 'Image / Icon',
			align: 'center',
			headerAlign: 'center',
			width: '90px',
			minWidth: '90px',
			render: (item) => {
				const isImage =
					item.icon &&
					(item.icon.startsWith('data:') ||
						item.icon.startsWith('http') ||
						item.icon.includes('/') ||
						/\.(png|jpg|jpeg|svg|webp|gif|avif)$/i.test(item.icon));

				if (isImage) {
					const imgSrc = getImageUrl(item.icon);
					return (
						<div
							role='button'
							tabIndex={0}
							onClick={() => handleOpenImagePreview(imgSrc, item.name)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleOpenImagePreview(imgSrc, item.name);
								}
							}}
							className='category-image-preview-thumbnail d-inline-flex align-items-center justify-content-center rounded-3 bg-light border overflow-hidden shadow-sm'
							style={{ width: '38px', height: '38px' }}
							title='Click to view full image'>
							<img
								src={imgSrc}
								alt={item.name}
								className='w-100 h-100 object-fit-contain p-1'
								onError={(e) => {
									(e.target as HTMLElement).style.display = 'none';
								}}
							/>
							<div className='image-hover-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center text-white'>
								<Icon icon='Visibility' size='sm' />
							</div>
						</div>
					);
				}

				if (item.icon) {
					return (
						<div
							className='d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-primary border'
							style={{ width: '38px', height: '38px' }}
							title={item.icon}>
							<Icon icon={item.icon as any} size='lg' />
						</div>
					);
				}

				return (
					<div
						className='d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-muted border'
						style={{ width: '38px', height: '38px' }}>
						<Icon icon='Category' size='lg' />
					</div>
				);
			},
		},
		{
			key: 'name',
			header: 'Category Name',
			minWidth: '200px',
			render: (item) => (
				<div className='d-flex flex-column'>
					<span className='fw-semibold text-dark' style={{ fontSize: '0.9375rem' }}>
						{item.name}
					</span>
				</div>
			),
		},
		{
			key: 'slug',
			header: 'Slug',
			minWidth: '160px',
			render: (item) => (
				<span
					className='badge bg-light text-muted font-monospace border px-2 py-1'
					style={{ fontSize: '0.8rem', letterSpacing: '0.02em' }}>
					{item.slug || '-'}
				</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			align: 'center',
			headerAlign: 'center',
			width: '160px',
			minWidth: '160px',
			render: (item) => {
				const isChecked = item.status === 'active';
				const canToggle =
					canUpdate(PERMISSION_KEYS.SERVICE_MANAGEMENT) ||
					canUpdate(PERMISSION_KEYS.SERVICE_CATEGORY) ||
					canUpdate('service_category');

				return (
					<div className='d-flex align-items-center justify-content-center'>
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
		<PageWrapper isProtected permissionKey={PERMISSION_KEYS.SERVICE_CATEGORY} title='Service Category'>
			<Page container='fluid'>
				<ListingPage<IServiceCategory>
					title='Service Categories'
					subTitle='Manage service categories, visual icons, and activation status'
					breadcrumbs={[
						{ text: 'Service Management' },
						{ text: 'Service Category' },
					]}
					permissionKey={PERMISSION_KEYS.SERVICE_CATEGORY}
					addNewText='Create Category'
					onAddNew={handleOpenAddModal}
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className='d-flex align-items-end justify-content-end flex-wrap gap-3 w-100'>
							{/* SEARCH INPUT */}
							<div style={{ width: '200px' }}>
								<label htmlFor='categorySearchInput' className='filter-field-label'>
									Search
								</label>
								<input
									id='categorySearchInput'
									type='text'
									className='form-control'
									placeholder='Search Category...'
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* STATUS FILTER */}
							<div style={{ width: '140px' }}>
								<label htmlFor='categoryStatusFilter' className='filter-field-label'>
									Status
								</label>
								<select
									id='categoryStatusFilter'
									className='form-select'
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value=''>All Status</option>
									{statusOptions.map((opt) => (
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
					data={categories}
					isLoading={isLoading}
					emptyMessage='No service categories found'
					emptyIcon='Category'
					actions={{
						permissionKey: PERMISSION_KEYS.SERVICE_CATEGORY,
						actionColumnWidth: '160px',
						onEdit: (catItem) => handleOpenEditModal(catItem),
						onDelete: (catItem) => handleOpenDeleteModal(catItem),
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

				{/* ADD / EDIT CATEGORY MODAL */}
				<ServiceCategoryModal
					isOpen={isCategoryModalOpen}
					setIsOpen={setIsCategoryModalOpen}
					categoryData={selectedCategory}
					onSubmit={handleCategoryModalSubmit}
					isSubmitting={isSubmittingCategory}
				/>

				{/* DELETE CONFIRMATION MODAL */}
				<ConfirmationModal
					isOpen={isDeleteModalOpen}
					setIsOpen={setIsDeleteModalOpen}
					title='Delete Service Category'
					message={
						categoryToDelete
							? `Are you sure you want to delete service category "${categoryToDelete.name}"? This action cannot be undone.`
							: 'Are you sure you want to delete this service category?'
					}
					confirmText='Delete Category'
					onConfirm={handleConfirmDelete}
					isLoading={isDeleting}
				/>

				{/* IMAGE PREVIEW LIGHTBOX MODAL */}
				<ImagePreviewModal
					isOpen={isPreviewModalOpen}
					setIsOpen={setIsPreviewModalOpen}
					imageUrl={previewImage?.url || ''}
					title={previewImage?.title || 'Category Image'}
				/>
			</Page>
		</PageWrapper>
	);
};

export default ServiceCategoryListPage;
