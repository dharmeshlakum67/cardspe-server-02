/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import mobilePlanTypeService from './service/mobilePlanTypeService';
import {
	IMobilePlanType,
	MobilePlanTypeStatusType,
	CreateMobilePlanTypePayload,
	UpdateMobilePlanTypePayload,
} from './type/mobile-plan-type';
import MobilePlanTypeModal from './MobilePlanTypeModal';
import showNotification from '../../../../components/extras/showNotification';
import Icon from '../../../../components/icon/Icon';
import { ConfirmationModal, StatusToggle, DateRangePicker } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { formatDateTime } from '../../../../helpers/dateUtils';
import constantService, { IConstantOption } from '../../../../services/constantService';

export const MobilePlanTypeListPage: FC = () => {
	const [planTypes, setPlanTypes] = useState<IMobilePlanType[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// ADD / EDIT MODAL STATES
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [selectedPlanType, setSelectedPlanType] = useState<IMobilePlanType | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [planTypeToDelete, setPlanTypeToDelete] = useState<IMobilePlanType | null>(null);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	// STATUS TOGGLE IN-PROGRESS STATE
	const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

	// DYNAMIC CONSTANTS (STATUS)
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
	]);

	// FILTERS & PAGINATION
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const debouncedSearch = useDebounce(searchTerm, 300);
	const prevDebouncedSearchRef = useRef<string>(debouncedSearch);

	const { canRead, canUpdate, isLoadingPermissions } = usePermission();

	// REF TO PREVENT DUPLICATE FETCHES ON MOUNT
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// ACTIVE FILTER COUNT
	const activeFilterCount =
		(searchTerm.trim() ? 1 : 0) +
		(statusFilter ? 1 : 0) +
		(startDate && endDate ? 1 : 0);

	// LOAD STATUS OPTIONS ONCE
	useEffect(() => {
		let isMounted = true;
		const loadConstants = async () => {
			try {
				const sOpts = await constantService.getStatusConstants();
				if (isMounted && sOpts && sOpts.length > 0) {
					setStatusOptions(sOpts);
				}
			} catch (err) {
				// Keep default options
			}
		};
		loadConstants();
		return () => {
			isMounted = false;
		};
	}, []);

	// RESET PAGE TO 1 ON SEARCH CHANGE
	useEffect(() => {
		if (prevDebouncedSearchRef.current !== debouncedSearch) {
			prevDebouncedSearchRef.current = debouncedSearch;
			setCurrentPage(1);
		}
	}, [debouncedSearch]);

	// FETCH PLAN TYPES FUNCTION WITH DEDUPLICATION GUARD
	const fetchPlanTypes = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.SERVICE_MANAGEMENT) &&
					!canRead(PERMISSION_KEYS.MOBILE_PLAN_TYPE) &&
					!canRead('mobile_plan_type'))
			) {
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
			setIsLoading(true);

			try {
				const response = await mobilePlanTypeService.getMobilePlanTypes({
					page: currentPage,
					limit: perPage,
					search: debouncedSearch.trim() || undefined,
					status: statusFilter || undefined,
					startDate: isDateRangeValid ? startDate : undefined,
					endDate: isDateRangeValid ? endDate : undefined,
				});

				let fetchedData: IMobilePlanType[] = [];
				if (Array.isArray(response?.data)) {
					fetchedData = response.data;
				} else if (Array.isArray(response?.data?.documents)) {
					fetchedData = response.data.documents;
				} else if (Array.isArray(response?.data?.rows)) {
					fetchedData = response.data.rows;
				} else if (Array.isArray(response?.data?.data)) {
					fetchedData = response.data.data;
				}

				let count = fetchedData.length;
				if (typeof response?.total_document === 'number') {
					count = response.total_document;
				} else if (typeof response?.totalDocuments === 'number') {
					count = response.totalDocuments;
				} else if (typeof response?.data?.totalDocuments === 'number') {
					count = response.data.totalDocuments;
				} else if (typeof response?.data?.total_document === 'number') {
					count = response.data.total_document;
				} else if (typeof response?.data?.count === 'number') {
					count = response.data.count;
				}

				setPlanTypes(fetchedData);
				setTotalDocuments(count);
				lastFetchKeyRef.current = currentFetchKey;
			} catch (error: any) {
				showNotification(
					'Error',
					error?.message || 'Failed to fetch mobile plan types.',
					'danger',
				);
				setPlanTypes([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			canRead,
			currentPage,
			debouncedSearch,
			endDate,
			isLoadingPermissions,
			perPage,
			startDate,
			statusFilter,
		],
	);

	useEffect(() => {
		fetchPlanTypes();
	}, [fetchPlanTypes]);

	// OPEN ADD MODAL
	const handleOpenAddModal = () => {
		setSelectedPlanType(null);
		setIsModalOpen(true);
	};

	// OPEN EDIT MODAL
	const handleOpenEditModal = (item: IMobilePlanType) => {
		setSelectedPlanType(item);
		setIsModalOpen(true);
	};

	// HANDLE MODAL SUBMIT (CREATE OR UPDATE)
	const handleModalSubmit = async (
		payload: CreateMobilePlanTypePayload | UpdateMobilePlanTypePayload,
	) => {
		setIsSubmitting(true);
		try {
			if (selectedPlanType) {
				const response = await mobilePlanTypeService.updateMobilePlanType(
					selectedPlanType.id,
					payload,
				);
				showNotification(
					'Success',
					response?.message || 'Mobile plan type updated successfully.',
					'success',
				);
			} else {
				const response = await mobilePlanTypeService.createMobilePlanType(
					payload as CreateMobilePlanTypePayload,
				);
				showNotification(
					'Success',
					response?.message || 'Mobile plan type created successfully.',
					'success',
				);
			}
			setIsModalOpen(false);
			await fetchPlanTypes(true);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to save mobile plan type.',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// HANDLE STATUS TOGGLE
	const handleStatusToggle = async (item: IMobilePlanType) => {
		const canToggle =
			canUpdate(PERMISSION_KEYS.SERVICE_MANAGEMENT) ||
			canUpdate(PERMISSION_KEYS.MOBILE_PLAN_TYPE) ||
			canUpdate('mobile_plan_type');
		if (!canToggle) {
			showNotification('Permission Denied', 'You do not have permission to update status.', 'warning');
			return;
		}

		const newStatus: MobilePlanTypeStatusType =
			item.status === 'active' ? 'inactive' : 'active';
		setUpdatingStatusId(item.id);

		try {
			await mobilePlanTypeService.updateMobilePlanTypeStatus(item.id, newStatus);
			showNotification(
				'Success',
				`Plan type marked as ${newStatus} successfully.`,
				'success',
			);

			setPlanTypes((prev) =>
				prev.map((pt) => (pt.id === item.id ? { ...pt, status: newStatus } : pt)),
			);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to update plan type status.',
				'danger',
			);
		} finally {
			setUpdatingStatusId(null);
		}
	};

	// OPEN DELETE MODAL
	const handleOpenDeleteModal = (item: IMobilePlanType) => {
		setPlanTypeToDelete(item);
		setIsDeleteModalOpen(true);
	};

	// CONFIRM DELETE
	const handleConfirmDelete = async () => {
		if (!planTypeToDelete) return;

		setIsDeleting(true);
		try {
			await mobilePlanTypeService.deleteMobilePlanType(planTypeToDelete.id);
			showNotification('Success', 'Mobile plan type deleted successfully.', 'success');
			setIsDeleteModalOpen(false);
			setPlanTypeToDelete(null);
			await fetchPlanTypes(true);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to delete mobile plan type.',
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
	const columns: IListingColumn<IMobilePlanType>[] = [
		{
			key: 'name',
			header: 'Plan Type Name',
			minWidth: '220px',
			render: (item) => (
				<div className='d-flex align-items-center gap-2'>
					<div
						className='d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-primary border'
						style={{ width: '36px', height: '36px', flexShrink: 0 }}>
						<Icon icon='PhoneAndroid' size='sm' />
					</div>
					<span className='fw-semibold text-dark' style={{ fontSize: '0.9375rem' }}>
						{item.name}
					</span>
				</div>
			),
		},
		{
			key: 'plan_type_id',
			header: 'Plan Type ID',
			align: 'center',
			headerAlign: 'center',
			width: '140px',
			minWidth: '140px',
			render: (item) => {
				if (item.plan_type_id !== null && item.plan_type_id !== undefined) {
					return (
						<span
							className='badge bg-light text-dark font-monospace border px-2 py-1'
							style={{ fontSize: '0.8rem', letterSpacing: '0.02em' }}>
							{item.plan_type_id}
						</span>
					);
				}
				return <span className='text-muted'>-</span>;
			},
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
					canUpdate(PERMISSION_KEYS.MOBILE_PLAN_TYPE) ||
					canUpdate('mobile_plan_type');

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
		<PageWrapper isProtected permissionKey={PERMISSION_KEYS.MOBILE_PLAN_TYPE} title='Mobile Plan Type'>
			<Page container='fluid'>
				<ListingPage<IMobilePlanType>
					title='Mobile Plan Types'
					subTitle='Manage mobile recharge plan types and activation status'
					breadcrumbs={[
						{ text: 'Service Management' },
						{ text: 'Mobile Plan Type' },
					]}
					permissionKey={PERMISSION_KEYS.MOBILE_PLAN_TYPE}
					addNewText='Add Plan Type'
					onAddNew={handleOpenAddModal}
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className='d-flex align-items-end justify-content-end flex-wrap gap-3 w-100'>
							{/* SEARCH INPUT */}
							<div style={{ width: '200px' }}>
								<label htmlFor='planTypeSearchInput' className='filter-field-label'>
									Search
								</label>
								<input
									id='planTypeSearchInput'
									type='text'
									className='form-control'
									placeholder='Search Plan Type...'
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* STATUS FILTER */}
							<div style={{ width: '140px' }}>
								<label htmlFor='planTypeStatusFilter' className='filter-field-label'>
									Status
								</label>
								<select
									id='planTypeStatusFilter'
									className='form-select'
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value);
										setCurrentPage(1);
									}}
								>
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
					data={planTypes}
					isLoading={isLoading}
					emptyMessage='No mobile plan types found'
					emptyIcon='PhoneAndroid'
					actions={{
						permissionKey: PERMISSION_KEYS.MOBILE_PLAN_TYPE,
						actionColumnWidth: '160px',
						onEdit: (item) => handleOpenEditModal(item),
						onDelete: (item) => handleOpenDeleteModal(item),
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

				{/* ADD / EDIT MODAL */}
				<MobilePlanTypeModal
					isOpen={isModalOpen}
					setIsOpen={setIsModalOpen}
					planTypeData={selectedPlanType}
					onSubmit={handleModalSubmit}
					isSubmitting={isSubmitting}
				/>

				{/* DELETE CONFIRMATION MODAL */}
				<ConfirmationModal
					isOpen={isDeleteModalOpen}
					setIsOpen={setIsDeleteModalOpen}
					title='Delete Mobile Plan Type'
					message={
						planTypeToDelete
							? `Are you sure you want to delete mobile plan type "${planTypeToDelete.name}"? This action cannot be undone.`
							: 'Are you sure you want to delete this mobile plan type?'
					}
					confirmText='Delete Plan Type'
					onConfirm={handleConfirmDelete}
					isLoading={isDeleting}
				/>
			</Page>
		</PageWrapper>
	);
};

export default MobilePlanTypeListPage;
