/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import paymentModeService from './service/paymentModeService';
import {
	IPaymentMode,
	PaymentModeStatusType,
	CreatePaymentModePayload,
	UpdatePaymentModePayload,
} from './type/payment-mode-type';
import PaymentModeModal from './PaymentModeModal';
import showNotification from '../../../../components/extras/showNotification';
import Icon from '../../../../components/icon/Icon';
import Tooltips from '../../../../components/bootstrap/Tooltips';
import { ConfirmationModal, StatusToggle, DateRangePicker } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { formatDateTime } from '../../../../helpers/dateUtils';
import { decryptAccountInfo } from '../../../../helpers/cryptoUtils';
import constantService, { IConstantOption } from '../../../../services/constantService';

export const PaymentModeListPage: FC = () => {
	const [paymentModes, setPaymentModes] = useState<IPaymentMode[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// ADD / EDIT MODAL STATES
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [selectedPaymentMode, setSelectedPaymentMode] = useState<IPaymentMode | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	// INLINE ACCOUNT INFO REVEAL STATE & DECRYPTED CACHE
	const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});
	const [decryptedInfoMap, setDecryptedInfoMap] = useState<Record<number, string>>({});

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [paymentModeToDelete, setPaymentModeToDelete] = useState<IPaymentMode | null>(null);
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

	const { canRead, canUpdate, hasPermission, isLoadingPermissions } = usePermission();

	const canViewCredential =
		hasPermission(PERMISSION_KEYS.PAYMENT_MODE, 'view_credential') ||
		hasPermission('payment_mode', 'view_credential');

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

	// FETCH PAYMENT MODES FUNCTION WITH DEDUPLICATION GUARD
	const fetchPaymentModes = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.SERVICE_MANAGEMENT) &&
					!canRead(PERMISSION_KEYS.PAYMENT_MODE) &&
					!canRead('payment_mode'))
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
				const response = await paymentModeService.getPaymentModes({
					page: currentPage,
					limit: perPage,
					search: debouncedSearch.trim() || undefined,
					status: statusFilter || undefined,
					startDate: isDateRangeValid ? startDate : undefined,
					endDate: isDateRangeValid ? endDate : undefined,
				});

				let fetchedData: IPaymentMode[] = [];
				if (Array.isArray(response?.data)) {
					fetchedData = response.data;
				} else if (Array.isArray((response?.data as any)?.documents)) {
					fetchedData = (response?.data as any).documents;
				} else if (Array.isArray((response?.data as any)?.rows)) {
					fetchedData = (response?.data as any).rows;
				} else if (Array.isArray((response?.data as any)?.data)) {
					fetchedData = (response?.data as any).data;
				}

				let count = fetchedData.length;
				if (typeof response?.total_document === 'number') {
					count = response.total_document;
				} else if (typeof response?.totalDocuments === 'number') {
					count = response.totalDocuments;
				} else if (typeof (response?.data as any)?.totalDocuments === 'number') {
					count = (response.data as any).totalDocuments;
				} else if (typeof (response?.data as any)?.total_document === 'number') {
					count = (response.data as any).total_document;
				} else if (typeof (response?.data as any)?.count === 'number') {
					count = (response.data as any).count;
				}

				setPaymentModes(fetchedData);
				setTotalDocuments(count);
				lastFetchKeyRef.current = currentFetchKey;
			} catch (error: any) {
				showNotification(
					'Error',
					error?.message || 'Failed to fetch payment modes.',
					'danger',
				);
				setPaymentModes([]);
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
		fetchPaymentModes();
	}, [fetchPaymentModes]);

	// OPEN ADD MODAL
	const handleOpenAddModal = () => {
		setSelectedPaymentMode(null);
		setIsModalOpen(true);
	};

	// OPEN EDIT MODAL
	const handleOpenEditModal = (item: IPaymentMode) => {
		setSelectedPaymentMode(item);
		setIsModalOpen(true);
	};

	// HANDLE MODAL SUBMIT (CREATE OR UPDATE)
	const handleModalSubmit = async (
		payload: CreatePaymentModePayload | UpdatePaymentModePayload,
	) => {
		setIsSubmitting(true);
		try {
			if (selectedPaymentMode) {
				const response = await paymentModeService.updatePaymentMode(
					selectedPaymentMode.id,
					payload,
				);
				showNotification(
					'Success',
					response?.message || 'Payment mode updated successfully.',
					'success',
				);
			} else {
				const response = await paymentModeService.createPaymentMode(
					payload as CreatePaymentModePayload,
				);
				showNotification(
					'Success',
					response?.message || 'Payment mode created successfully.',
					'success',
				);
			}
			setIsModalOpen(false);
			await fetchPaymentModes(true);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to save payment mode.',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// HANDLE STATUS TOGGLE
	const handleStatusToggle = async (item: IPaymentMode) => {
		const canToggle =
			canUpdate(PERMISSION_KEYS.SERVICE_MANAGEMENT) ||
			canUpdate(PERMISSION_KEYS.PAYMENT_MODE) ||
			canUpdate('payment_mode');
		if (!canToggle) {
			showNotification('Permission Denied', 'You do not have permission to update status.', 'warning');
			return;
		}

		const newStatus: PaymentModeStatusType =
			item.status === 'active' ? 'inactive' : 'active';
		setUpdatingStatusId(item.id);

		try {
			await paymentModeService.updatePaymentModeStatus(item.id, newStatus);
			showNotification(
				'Success',
				`Payment mode marked as ${newStatus} successfully.`,
				'success',
			);

			setPaymentModes((prev) =>
				prev.map((pm) => (pm.id === item.id ? { ...pm, status: newStatus } : pm)),
			);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to update payment mode status.',
				'danger',
			);
		} finally {
			setUpdatingStatusId(null);
		}
	};

	// OPEN DELETE MODAL
	const handleOpenDeleteModal = (item: IPaymentMode) => {
		setPaymentModeToDelete(item);
		setIsDeleteModalOpen(true);
	};

	// CONFIRM DELETE
	const handleConfirmDelete = async () => {
		if (!paymentModeToDelete) return;

		setIsDeleting(true);
		try {
			await paymentModeService.deletePaymentMode(paymentModeToDelete.id);
			showNotification('Success', 'Payment mode deleted successfully.', 'success');
			setIsDeleteModalOpen(false);
			setPaymentModeToDelete(null);
			await fetchPaymentModes(true);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to delete payment mode.',
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

	// TOGGLE REVEAL & ASYNC DECRYPT
	const handleToggleReveal = async (item: IPaymentMode) => {
		const willReveal = !revealedIds[item.id];
		setRevealedIds((prev) => ({ ...prev, [item.id]: willReveal }));

		if (willReveal && item.payment_account_info && decryptedInfoMap[item.id] === undefined) {
			const decrypted = await decryptAccountInfo(item.payment_account_info);
			setDecryptedInfoMap((prev) => ({ ...prev, [item.id]: decrypted }));
		}
	};

	// HELPER TO RENDER ACCOUNT INFO (CLICK TEXT TO REVEAL / HIDE WITH DECRYPTION & TOOLTIP)
	const renderAccountInfoSnippet = (item: IPaymentMode) => {
		const rawInfo = item.payment_account_info;
		if (!rawInfo) {
			return <span className='text-muted small'>-</span>;
		}

		const isRevealed = Boolean(revealedIds[item.id]);

		if (!canViewCredential) {
			return (
				<span
					className='badge bg-light text-muted font-monospace border px-2 py-1'
					style={{
						fontSize: '0.85rem',
						letterSpacing: '0.12em',
						cursor: 'not-allowed',
					}}
					title='Permission required to view credentials'>
					••••••••
				</span>
			);
		}

		if (isRevealed) {
			const displayInfo =
				decryptedInfoMap[item.id] !== undefined ? decryptedInfoMap[item.id] : rawInfo;
			const isLong = displayInfo.length > 18;
			const revealedBadge = (
				<span
					role='button'
					tabIndex={0}
					className='badge bg-light text-primary font-monospace border border-primary-subtle px-2 py-1 text-truncate d-inline-block'
					style={{
						fontSize: '0.8125rem',
						maxWidth: isLong ? '160px' : 'none',
						cursor: 'pointer',
						userSelect: 'none',
						verticalAlign: 'middle',
					}}
					onClick={() => handleToggleReveal(item)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							handleToggleReveal(item);
						}
					}}
					title={displayInfo}>
					{displayInfo}
				</span>
			);

			if (isLong) {
				return (
					<Tooltips title={displayInfo} placement='top'>
						{revealedBadge}
					</Tooltips>
				);
			}

			return revealedBadge;
		}

		return (
			<Tooltips title='Click to decrypt & view credentials' placement='top'>
				<span
					role='button'
					tabIndex={0}
					className='badge bg-light text-muted font-monospace border px-2 py-1'
					style={{
						fontSize: '0.85rem',
						letterSpacing: '0.12em',
						cursor: 'pointer',
						userSelect: 'none',
					}}
					onClick={() => handleToggleReveal(item)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							handleToggleReveal(item);
						}
					}}>
					••••••••
				</span>
			</Tooltips>
		);
	};

	// TABLE COLUMNS CONFIGURATION
	const columns: IListingColumn<IPaymentMode>[] = [
		{
			key: 'name',
			header: 'Name',
			minWidth: '200px',
			render: (item) => (
				<div className='d-flex align-items-center gap-2'>
					<div
						className='d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-primary border'
						style={{ width: '36px', height: '36px', flexShrink: 0 }}>
						<Icon icon='Payments' size='sm' />
					</div>
					<div className='d-flex flex-column'>
						<span className='fw-semibold text-dark' style={{ fontSize: '0.9375rem' }}>
							{item.name}
						</span>
					</div>
				</div>
			),
		},
		{
			key: 'code',
			header: 'Code',
			minWidth: '150px',
			render: (item) => (
				<span
					className='badge bg-light text-primary font-monospace border px-2 py-1'
					style={{ fontSize: '0.8125rem', letterSpacing: '0.04em' }}>
					{item.code}
				</span>
			),
		},
		{
			key: 'payment_account_info',
			header: 'Account Info',
			minWidth: '200px',
			render: (item) => renderAccountInfoSnippet(item),
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
					canUpdate(PERMISSION_KEYS.PAYMENT_MODE) ||
					canUpdate('payment_mode');

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
			header: 'Created At',
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
		<PageWrapper isProtected permissionKey={PERMISSION_KEYS.PAYMENT_MODE} title='Payment Mode'>
			<Page container='fluid'>
				<ListingPage<IPaymentMode>
					title='Payment Modes'
					subTitle='Manage payment modes, identifiers, account credentials, and activation status'
					breadcrumbs={[
						{ text: 'Service Management' },
						{ text: 'Payment Mode' },
					]}
					permissionKey={PERMISSION_KEYS.PAYMENT_MODE}
					addNewText='Add Payment Mode'
					onAddNew={handleOpenAddModal}
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className='d-flex align-items-end justify-content-end flex-wrap gap-3 w-100'>
							{/* SEARCH INPUT (NAME & CODE) */}
							<div style={{ width: '220px' }}>
								<label htmlFor='paymentModeSearchInput' className='filter-field-label'>
									Search
								</label>
								<input
									id='paymentModeSearchInput'
									type='text'
									className='form-control'
									placeholder='Search name or code...'
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* STATUS FILTER */}
							<div style={{ width: '140px' }}>
								<label htmlFor='paymentModeStatusFilter' className='filter-field-label'>
									Status
								</label>
								<select
									id='paymentModeStatusFilter'
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
					data={paymentModes}
					isLoading={isLoading}
					emptyMessage='No payment modes found'
					emptyIcon='Payments'
					actions={{
						permissionKey: PERMISSION_KEYS.PAYMENT_MODE,
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
				<PaymentModeModal
					isOpen={isModalOpen}
					setIsOpen={setIsModalOpen}
					paymentModeData={selectedPaymentMode}
					onSubmit={handleModalSubmit}
					isSubmitting={isSubmitting}
				/>

				{/* DELETE CONFIRMATION MODAL */}
				<ConfirmationModal
					isOpen={isDeleteModalOpen}
					setIsOpen={setIsDeleteModalOpen}
					title='Delete Payment Mode'
					message={
						paymentModeToDelete
							? `Are you sure you want to delete payment mode "${paymentModeToDelete.name}" (${paymentModeToDelete.code})? This action cannot be undone.`
							: 'Are you sure you want to delete this payment mode?'
					}
					confirmText='Delete Payment Mode'
					onConfirm={handleConfirmDelete}
					isLoading={isDeleting}
				/>
			</Page>
		</PageWrapper>
	);
};

export default PaymentModeListPage;
