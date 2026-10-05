/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, no-nested-ternary */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import bankDetailService from './service/bankDetailService';
import {
	IBankDetail,
	IBankDetailPayload,
	BankDetailStatus,
	AccountType,
	ACCOUNT_TYPE_OPTIONS,
	getAccountTypeLabel,
	getAccountTypeBadgeColor,
} from './type/bank-detail-type';
import BankDetailModal from './components/BankDetailModal';
import BankDetailViewModal from './components/BankDetailViewModal';
import showNotification from '../../../../components/extras/showNotification';
import Icon from '../../../../components/icon/Icon';
import { ConfirmationModal, StatusToggle, DateRangePicker, PillBadge } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { formatDateTime } from '../../../../helpers/dateUtils';
import constantService, { IConstantOption } from '../../../../services/constantService';

export const BankDetailListPage: FC = () => {
	const [bankDetails, setBankDetails] = useState<IBankDetail[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// ADD / EDIT MODAL STATES
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [selectedBankDetail, setSelectedBankDetail] = useState<IBankDetail | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	// VIEW MODAL STATES
	const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
	const [viewingBankDetail, setViewingBankDetail] = useState<IBankDetail | null>(null);

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [bankDetailToDelete, setBankDetailToDelete] = useState<IBankDetail | null>(null);
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
	const debouncedSearch = useDebounce(searchTerm, 500);
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [accountTypeFilter, setAccountTypeFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, canCreate, canUpdate, canDelete, isLoadingPermissions } = usePermission();

	// REF TO PREVENT DUPLICATE FETCHES ON MOUNT / RE-RENDERS
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);
	const prevDebouncedSearchRef = useRef<string>(debouncedSearch);

	// ACTIVE FILTER COUNT
	const activeFilterCount =
		(searchTerm.trim() ? 1 : 0) +
		(statusFilter ? 1 : 0) +
		(accountTypeFilter ? 1 : 0) +
		(startDate && endDate ? 1 : 0);

	// LOAD STATUS OPTIONS ONCE ON MOUNT
	useEffect(() => {
		let isMounted = true;
		const loadConstants = async () => {
			try {
				const sOpts = await constantService.getStatusConstants();
				if (isMounted && sOpts && sOpts.length > 0) {
					setStatusOptions(sOpts);
				}
			} catch {
				// Keep defaults
			}
		};
		loadConstants();
		return () => {
			isMounted = false;
		};
	}, []);

	// RESET TO PAGE 1 ON SEARCH CHANGE
	useEffect(() => {
		if (prevDebouncedSearchRef.current !== debouncedSearch) {
			prevDebouncedSearchRef.current = debouncedSearch;
			setCurrentPage(1);
		}
	}, [debouncedSearch]);

	// FETCH BANK DETAILS WITH DEDUPLICATION GUARD
	const fetchBankDetails = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.PAYMENTS) &&
					!canRead(PERMISSION_KEYS.BANK_DETAILS) &&
					!canRead('bank_details') &&
					!canRead('bank_detail'))
			) {
				return;
			}

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${debouncedSearch.trim()}_${statusFilter}_${accountTypeFilter}_${
				isDateRangeValid ? `${startDate}_${endDate}` : ''
			}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			setIsLoading(true);

			try {
				const response = await bankDetailService.getBankDetails({
					page: currentPage,
					limit: perPage,
					search: debouncedSearch.trim() || undefined,
					status: (statusFilter as BankDetailStatus) || undefined,
					account_type: (accountTypeFilter as AccountType) || undefined,
					startDate: isDateRangeValid ? startDate : undefined,
					endDate: isDateRangeValid ? endDate : undefined,
					sortBy: 'created_at',
					sortDirection: 'DESC',
				});

				const rawData = response?.data;
				let fetchedList: IBankDetail[] = [];
				let totalCount = 0;

				if (Array.isArray(rawData)) {
					fetchedList = rawData;
					totalCount =
						response.totalDocuments ??
						response.totalItems ??
						response.total ??
						rawData.length;
				} else if (rawData && typeof rawData === 'object' && Array.isArray((rawData as any).rows)) {
					fetchedList = (rawData as any).rows;
					totalCount =
						(rawData as any).count ??
						response.totalDocuments ??
						response.totalItems ??
						fetchedList.length;
				}

				setBankDetails(fetchedList);
				setTotalDocuments(totalCount);
				lastFetchKeyRef.current = currentFetchKey;
			} catch (error: any) {
				showNotification('Error', error?.message || 'Failed to fetch bank details.', 'danger');
				setBankDetails([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			accountTypeFilter,
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
		fetchBankDetails();
	}, [fetchBankDetails]);

	// HANDLE COPY
	const handleCopyText = (text: string, label: string) => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		showNotification('Copied', `${label} copied to clipboard`, 'success');
	};

	// HANDLE OPEN ADD MODAL
	const handleOpenAddModal = () => {
		setSelectedBankDetail(null);
		setIsModalOpen(true);
	};

	// HANDLE OPEN EDIT MODAL
	const handleOpenEditModal = (item: IBankDetail) => {
		setSelectedBankDetail(item);
		setIsModalOpen(true);
	};

	// HANDLE OPEN VIEW MODAL
	const handleOpenViewModal = (item: IBankDetail) => {
		setViewingBankDetail(item);
		setIsViewModalOpen(true);
	};

	// HANDLE MODAL SUBMIT (CREATE OR UPDATE)
	const handleModalSubmit = async (payload: IBankDetailPayload) => {
		setIsSubmitting(true);
		try {
			if (selectedBankDetail) {
				await bankDetailService.updateBankDetail(selectedBankDetail.id, payload);
				showNotification('Success', 'Bank detail updated successfully.', 'success');
			} else {
				await bankDetailService.createBankDetail(payload);
				showNotification('Success', 'Bank detail created successfully.', 'success');
			}
			setIsModalOpen(false);
			setSelectedBankDetail(null);
			await fetchBankDetails(true);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to save bank detail.',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// HANDLE STATUS TOGGLE
	const handleStatusToggle = async (item: IBankDetail) => {
		const canToggle =
			canUpdate(PERMISSION_KEYS.PAYMENTS) ||
			canUpdate(PERMISSION_KEYS.BANK_DETAILS) ||
			canUpdate('bank_details') ||
			canUpdate('bank_detail');

		if (!canToggle) {
			showNotification(
				'Permission Denied',
				'You do not have permission to update bank detail status.',
				'warning',
			);
			return;
		}

		const newStatus: BankDetailStatus = item.status === 'active' ? 'inactive' : 'active';
		setUpdatingStatusId(item.id);

		try {
			await bankDetailService.updateBankDetailStatus(item.id, newStatus);
			showNotification(
				'Success',
				`Bank account marked as ${newStatus} successfully.`,
				'success',
			);

			setBankDetails((prev) =>
				prev.map((b) => (b.id === item.id ? { ...b, status: newStatus } : b)),
			);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to update bank detail status.',
				'danger',
			);
		} finally {
			setUpdatingStatusId(null);
		}
	};

	// HANDLE OPEN DELETE MODAL
	const handleOpenDeleteModal = (item: IBankDetail) => {
		setBankDetailToDelete(item);
		setIsDeleteModalOpen(true);
	};

	// HANDLE CONFIRM DELETE
	const handleConfirmDelete = async () => {
		if (!bankDetailToDelete) return;

		setIsDeleting(true);
		try {
			await bankDetailService.deleteBankDetail(bankDetailToDelete.id);
			showNotification('Success', 'Bank detail deleted successfully.', 'success');
			setIsDeleteModalOpen(false);
			setBankDetailToDelete(null);
			await fetchBankDetails(true);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to delete bank detail.',
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
		setAccountTypeFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	// TABLE COLUMNS CONFIGURATION
	const columns: IListingColumn<IBankDetail>[] = [
		{
			key: 'bank_name',
			header: 'Bank Details',
			minWidth: '220px',
			render: (item) => (
				<div className="d-flex align-items-center gap-2">
					<div
						className="d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-primary border flex-shrink-0"
						style={{ width: '38px', height: '38px' }}>
						<Icon icon="AccountBalance" size="lg" />
					</div>
					<div className="d-flex flex-column text-truncate">
						<span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem' }}>
							{item.bank_name}
						</span>
						{item.branch_name && (
							<span className="text-muted small text-truncate" style={{ fontSize: '0.78rem' }}>
								{item.branch_name}
							</span>
						)}
					</div>
				</div>
			),
		},
		{
			key: 'account_holder_name',
			header: 'Account Holder',
			minWidth: '180px',
			render: (item) => (
				<span className="fw-medium text-dark" style={{ fontSize: '0.875rem' }}>
					{item.account_holder_name}
				</span>
			),
		},
		{
			key: 'account_number',
			header: 'Account Number',
			align: 'center',
			headerAlign: 'center',
			minWidth: '170px',
			render: (item) => (
				<div className="d-inline-flex align-items-center gap-1 font-monospace">
					<span
						className="badge bg-light text-primary border px-2 py-1"
						style={{ fontSize: '0.8125rem', letterSpacing: '0.04em' }}>
						{item.account_number}
					</span>
					<button
						type="button"
						className="btn btn-sm btn-link p-0 text-muted border-0"
						title="Copy Account Number"
						onClick={() => handleCopyText(item.account_number, 'Account number')}>
						<Icon icon="ContentCopy" size="sm" />
					</button>
				</div>
			),
		},
		{
			key: 'ifsc_code',
			header: 'IFSC Code',
			align: 'center',
			headerAlign: 'center',
			width: '140px',
			minWidth: '140px',
			render: (item) => (
				<div className="d-inline-flex align-items-center gap-1 font-monospace">
					<span
						className="badge bg-light text-dark border px-2 py-1"
						style={{ fontSize: '0.8125rem' }}>
						{item.ifsc_code}
					</span>
					<button
						type="button"
						className="btn btn-sm btn-link p-0 text-muted border-0"
						title="Copy IFSC Code"
						onClick={() => handleCopyText(item.ifsc_code, 'IFSC Code')}>
						<Icon icon="ContentCopy" size="sm" />
					</button>
				</div>
			),
		},
		{
			key: 'account_type',
			header: 'Account Type',
			align: 'center',
			headerAlign: 'center',
			width: '130px',
			minWidth: '130px',
			render: (item) => (
				<PillBadge color={getAccountTypeBadgeColor(item.account_type)} size="sm">
					{getAccountTypeLabel(item.account_type)}
				</PillBadge>
			),
		},
		{
			key: 'status',
			header: 'Status',
			align: 'center',
			headerAlign: 'center',
			width: '130px',
			minWidth: '130px',
			render: (item) => {
				const isChecked = item.status === 'active';
				const canToggle =
					canUpdate(PERMISSION_KEYS.PAYMENTS) ||
					canUpdate(PERMISSION_KEYS.BANK_DETAILS) ||
					canUpdate('bank_details') ||
					canUpdate('bank_detail');

				return (
					<div className="d-flex align-items-center justify-content-center">
						<StatusToggle
							checked={isChecked}
							disabled={!canToggle || updatingStatusId === item.id}
							onChange={() => handleStatusToggle(item)}
							onText="Active"
							offText="Inactive"
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
			width: '150px',
			minWidth: '150px',
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
		<PageWrapper
			isProtected
			permissionKey={PERMISSION_KEYS.BANK_DETAILS}
			title="Bank Details">
			<Page container="fluid">
				<ListingPage<IBankDetail>
					title="Bank Details"
					subTitle="Manage bank accounts for transactions, payouts, and disbursements"
					breadcrumbs={[
						{ text: 'Payments' },
						{ text: 'Bank Details' },
					]}
					permissionKey={PERMISSION_KEYS.BANK_DETAILS}
					onAddNew={
						canCreate(PERMISSION_KEYS.PAYMENTS) ||
						canCreate(PERMISSION_KEYS.BANK_DETAILS) ||
						canCreate('bank_details') ||
						canCreate('bank_detail')
							? handleOpenAddModal
							: undefined
					}
					addNewText="Add Bank Detail"
					addNewIcon="AddCard"
					showFilterButton
					isFilterOpenDefault={false}
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className="d-flex align-items-end justify-content-end flex-wrap gap-3 p-3 w-100">
							{/* SEARCH FILTER */}
							<div style={{ width: '240px' }}>
								<label htmlFor="bankDetailSearchInput" className="filter-field-label d-block">
									Search
								</label>
								<div className="position-relative">
									<input
										id="bankDetailSearchInput"
										type="text"
										className="form-control"
										placeholder="Search bank, holder, IFSC..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
									{searchTerm && (
										<button
											type="button"
											className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted p-0 me-2 border-0"
											onClick={() => setSearchTerm('')}>
											<Icon icon="Close" size="sm" />
										</button>
									)}
								</div>
							</div>

							{/* ACCOUNT TYPE FILTER */}
							<div style={{ width: '160px' }}>
								<label htmlFor="bankDetailAccountTypeFilter" className="filter-field-label d-block">
									Account Type
								</label>
								<select
									id="bankDetailAccountTypeFilter"
									className="form-select"
									value={accountTypeFilter}
									onChange={(e) => {
										setAccountTypeFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value="">All Types</option>
									{ACCOUNT_TYPE_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
							</div>

							{/* STATUS FILTER */}
							<div style={{ width: '150px' }}>
								<label htmlFor="bankDetailStatusFilter" className="filter-field-label d-block">
									Status
								</label>
								<select
									id="bankDetailStatusFilter"
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
					data={bankDetails}
					isLoading={isLoading}
					emptyMessage="No bank details found"
					emptyIcon="AccountBalance"
					actions={{
						permissionKey: PERMISSION_KEYS.BANK_DETAILS,
						actionColumnWidth: '150px',
						onView: (item) => handleOpenViewModal(item),
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
				<BankDetailModal
					isOpen={isModalOpen}
					setIsOpen={setIsModalOpen}
					bankDetailData={selectedBankDetail}
					onSubmit={handleModalSubmit}
					isSubmitting={isSubmitting}
				/>

				{/* VIEW MODAL */}
				<BankDetailViewModal
					isOpen={isViewModalOpen}
					setIsOpen={setIsViewModalOpen}
					bankDetail={viewingBankDetail}
				/>

				{/* DELETE CONFIRMATION MODAL */}
				<ConfirmationModal
					isOpen={isDeleteModalOpen}
					setIsOpen={setIsDeleteModalOpen}
					title="Delete Bank Detail"
					message={
						bankDetailToDelete
							? `Are you sure you want to delete bank account "${bankDetailToDelete.bank_name}" (${bankDetailToDelete.account_number})? This action cannot be undone.`
							: 'Are you sure you want to delete this bank detail?'
					}
					confirmText="Delete Bank Detail"
					onConfirm={handleConfirmDelete}
					isLoading={isDeleting}
				/>
			</Page>
		</PageWrapper>
	);
};

export default BankDetailListPage;
