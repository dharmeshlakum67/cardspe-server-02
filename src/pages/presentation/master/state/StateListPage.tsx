/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import { PillBadge } from '../../../../components/common/PillBadge';
import stateService from './service/stateService';
import { IState, StateStatusType } from './type/state-type';
import StateModal from './StateModal';
import showNotification from '../../../../components/extras/showNotification';
import Icon from '../../../../components/icon/Icon';
import { ConfirmationModal, StatusToggle, DateRangePicker } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { formatDateTime } from '../../../../helpers/dateUtils';
import constantService, { IConstantOption } from '../../../../services/constantService';

export const StateListPage: FC = () => {
	const [states, setStates] = useState<IState[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// ADD / EDIT MODAL STATES
	const [isStateModalOpen, setIsStateModalOpen] = useState<boolean>(false);
	const [selectedState, setSelectedState] = useState<IState | null>(null);
	const [isSubmittingState, setIsSubmittingState] = useState<boolean>(false);

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [stateToDelete, setStateToDelete] = useState<IState | null>(null);
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
	const debouncedSearchTerm = useDebounce(searchTerm, 1200);
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

	// FETCH STATES FROM API
	const fetchStates = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.MASTER) && !canRead(PERMISSION_KEYS.STATE))
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
				const response = await stateService.getStates({
					page: currentPage,
					limit: perPage,
					search: debouncedSearchTerm.trim() || undefined,
					status: (statusFilter as StateStatusType) || undefined,
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

				setStates(fetchedData);
				setTotalDocuments(count);
				lastFetchKeyRef.current = currentFetchKey;
			} catch (error: any) {
				showNotification(
					'Error Loading States',
					error?.message || 'Failed to fetch states list from server',
					'danger',
				);
				setStates([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			currentPage,
			perPage,
			debouncedSearchTerm,
			statusFilter,
			startDate,
			endDate,
			canRead,
			isLoadingPermissions,
		],
	);

	useEffect(() => {
		fetchStates();
	}, [fetchStates]);

	// HANDLE RESET ALL FILTERS
	const handleResetFilters = () => {
		setSearchTerm('');
		setStatusFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	// ACTIVE FILTERS COUNT
	const activeFilterCount =
		(searchTerm.trim() ? 1 : 0) +
		(statusFilter ? 1 : 0) +
		(startDate || endDate ? 1 : 0);

	// OPEN ADD MODAL
	const handleOpenAddModal = () => {
		setSelectedState(null);
		setIsStateModalOpen(true);
	};

	// OPEN EDIT MODAL
	const handleOpenEditModal = (stateItem: IState) => {
		setSelectedState(stateItem);
		setIsStateModalOpen(true);
	};

	// HANDLE ADD / EDIT SUBMIT
	const handleStateModalSubmit = async (values: {
		name: string;
		circle_id: number | null;
		status: StateStatusType;
	}) => {
		setIsSubmittingState(true);
		try {
			if (selectedState) {
				const res = await stateService.updateState(selectedState.id, values);
				showNotification(
					'Success',
					res?.message || 'State updated successfully',
					'success',
				);
			} else {
				const res = await stateService.createState(values);
				showNotification(
					'Success',
					res?.message || 'State created successfully',
					'success',
				);
			}
			setIsStateModalOpen(false);
			setSelectedState(null);
			fetchStates(true);
		} catch (error: any) {
			showNotification(
				'Submission Error',
				error?.message || 'Failed to save state details',
				'danger',
			);
		} finally {
			setIsSubmittingState(false);
		}
	};

	// HANDLE STATUS TOGGLE
	const handleStatusToggle = async (stateItem: IState) => {
		if (updatingStatusId === stateItem.id) return;
		const newStatus: StateStatusType = stateItem.status === 'active' ? 'inactive' : 'active';
		setUpdatingStatusId(stateItem.id);

		// Optimistic UI update
		setStates((prev) =>
			prev.map((s) => (s.id === stateItem.id ? { ...s, status: newStatus } : s)),
		);

		try {
			await stateService.updateStateStatus(stateItem.id, newStatus);
			showNotification(
				'Status Updated',
				`State status changed to ${newStatus}`,
				'success',
			);
		} catch (error: any) {
			// Revert on failure
			setStates((prev) =>
				prev.map((s) => (s.id === stateItem.id ? { ...s, status: stateItem.status } : s)),
			);
			showNotification(
				'Status Update Failed',
				error?.message || 'Could not update state status',
				'danger',
			);
		} finally {
			setUpdatingStatusId(null);
		}
	};

	// OPEN DELETE MODAL
	const handleOpenDeleteModal = (stateItem: IState) => {
		setStateToDelete(stateItem);
		setIsDeleteModalOpen(true);
	};

	// CONFIRM DELETE
	const handleConfirmDelete = async () => {
		if (!stateToDelete) return;
		setIsDeleting(true);
		try {
			const res = await stateService.deleteState(stateToDelete.id);
			showNotification(
				'State Deleted',
				res?.message || 'State has been deleted successfully',
				'success',
			);
			setIsDeleteModalOpen(false);
			setStateToDelete(null);
			fetchStates(true);
		} catch (error: any) {
			showNotification(
				'Delete Failed',
				error?.message || 'Failed to delete state',
				'danger',
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// TABLE COLUMNS CONFIGURATION (MATCHING COMMON LISTING STYLE)
	const columns: IListingColumn<IState>[] = [
		{
			key: 'name',
			header: 'State Name',
			render: (item) => <strong className="text-dark fs-6">{item.name}</strong>,
		},
		{
			key: 'circle_id',
			header: 'Circle ID',
			render: (item) =>
				item.circle_id !== null && item.circle_id !== undefined ? (
					<span className="badge bg-light text-dark border px-2 py-1">
						Circle #{item.circle_id}
					</span>
				) : (
					<span className="text-muted small">N/A</span>
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
				const canToggle = canUpdate(PERMISSION_KEYS.MASTER) || canUpdate(PERMISSION_KEYS.STATE);

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
					<div className="d-flex flex-column text-center">
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
		<PageWrapper isProtected permissionKey={PERMISSION_KEYS.STATE} title="State Management">
			<Page container="fluid">
				<ListingPage
					title="States"
					subTitle="Manage state names, circle identifiers, and active/inactive status"
					breadcrumbs={[{ text: 'Master' }, { text: 'States' }]}
					permissionKey={PERMISSION_KEYS.STATE}
					addNewText="Create State"
					onAddNew={handleOpenAddModal}
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className="d-flex align-items-end justify-content-end flex-wrap gap-3 w-100">
							{/* SEARCH INPUT */}
							<div style={{ width: '200px' }}>
								<label htmlFor="stateSearchInput" className="filter-field-label">
									Search
								</label>
								<input
									id="stateSearchInput"
									type="text"
									className="form-control"
									placeholder="Search State..."
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* STATUS FILTER */}
							<div style={{ width: '140px' }}>
								<label htmlFor="stateStatusFilter" className="filter-field-label">
									Status
								</label>
								<select
									id="stateStatusFilter"
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

							{/* DATE RANGE FILTER */}
							<div style={{ width: '240px' }}>
								<span className="filter-field-label d-block">Date Range</span>
								<DateRangePicker
									startDate={startDate}
									endDate={endDate}
									placeholder="Select Start & End Date"
									onChange={({ startDate: sDate, endDate: eDate }: { startDate: string; endDate: string }) => {
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
									<Icon icon="RestartAlt" size="sm" />
									<span>Reset</span>
								</button>
							</div>
						</div>
					}
					columns={columns}
					data={states}
					isLoading={isLoading}
					emptyMessage="No states found"
					emptyIcon="AddLocation"
					actions={{
						permissionKey: PERMISSION_KEYS.STATE,
						actionColumnWidth: '160px',
						onEdit: (stateItem) => handleOpenEditModal(stateItem),
						onDelete: (stateItem) => handleOpenDeleteModal(stateItem),
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

				{/* ADD / EDIT STATE MODAL */}
				<StateModal
					isOpen={isStateModalOpen}
					setIsOpen={setIsStateModalOpen}
					stateData={selectedState}
					onSubmit={handleStateModalSubmit}
					isSubmitting={isSubmittingState}
				/>

				{/* DELETE CONFIRMATION MODAL */}
				<ConfirmationModal
					isOpen={isDeleteModalOpen}
					setIsOpen={setIsDeleteModalOpen}
					title="Delete State"
					message={
						stateToDelete
							? `Are you sure you want to delete state "${stateToDelete.name}"? This action cannot be undone.`
							: 'Are you sure you want to delete this state?'
					}
					confirmText="Delete State"
					onConfirm={handleConfirmDelete}
					isLoading={isDeleting}
				/>
			</Page>
		</PageWrapper>
	);
};

export default StateListPage;
