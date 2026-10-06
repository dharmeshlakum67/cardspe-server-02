/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import { StatusToggle } from '../../../../components/common/StatusToggle';
import { ImagePreviewModal } from '../../../../components/common/ImagePreviewModal';
import { DateRangePicker } from '../../../../components/common/DateRangePicker';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { formatDateTime } from '../../../../helpers/dateUtils';
import { getImageUrl } from '../../../../helpers/helpers';
import {
	IPaymentGateway,
	TPaymentGatewayStatus,
} from './type/payment-gateway-type';
import paymentGatewayService from './service/paymentGatewayService';
import PaymentGatewayModal from './components/PaymentGatewayModal';
import PaymentGatewayViewModal from './components/PaymentGatewayViewModal';
import './css/payment-gateway.scss';

export const PaymentGatewayListPage: FC = () => {
	const [gateways, setGateways] = useState<IPaymentGateway[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// ADD & EDIT MODAL STATES
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [selectedGateway, setSelectedGateway] = useState<IPaymentGateway | null>(null);

	// VIEW MODAL STATES
	const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
	const [viewingGateway, setViewingGateway] = useState<IPaymentGateway | null>(null);

	// IMAGE PREVIEW MODAL STATE
	const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

	// STATUS TOGGLE IN-PROGRESS STATE
	const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

	// FILTERS & PAGINATION
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearch = useDebounce(searchTerm, 400);
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, canCreate, canUpdate, isLoadingPermissions } = usePermission();

	// REF TO PREVENT DUPLICATE CALLS
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);
	const prevDebouncedSearchRef = useRef<string>(debouncedSearch);

	// ACTIVE FILTER COUNT
	const activeFilterCount =
		(searchTerm.trim() ? 1 : 0) +
		(statusFilter ? 1 : 0) +
		(startDate && endDate ? 1 : 0);

	// RESET TO PAGE 1 ON SEARCH QUERY CHANGE
	useEffect(() => {
		if (prevDebouncedSearchRef.current !== debouncedSearch) {
			prevDebouncedSearchRef.current = debouncedSearch;
			setCurrentPage(1);
		}
	}, [debouncedSearch]);

	// FETCH PAYMENT GATEWAYS
	const fetchGateways = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.PAYMENT_GATEWAY) &&
					!canRead('payment_gateway') &&
					!canRead(PERMISSION_KEYS.SETTING) &&
					!canRead('setting'))
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
				const response = await paymentGatewayService.getPaymentGateways({
					page: currentPage,
					limit: perPage,
					search: debouncedSearch.trim() || undefined,
					status: (statusFilter as TPaymentGatewayStatus) || undefined,
					start_date: isDateRangeValid ? startDate : undefined,
					end_date: isDateRangeValid ? endDate : undefined,
					sort_by: 'created_at',
					sort_order: 'DESC',
				});

				const rawData = response?.data;
				let fetchedList: IPaymentGateway[] = [];
				let totalCount = 0;

				if (Array.isArray(rawData)) {
					fetchedList = rawData;
					totalCount = response?.total_document ?? rawData.length;
				} else if (rawData && typeof rawData === 'object') {
					const respAny = rawData as any;
					if (Array.isArray(respAny.rows)) {
						fetchedList = respAny.rows;
					} else if (Array.isArray(respAny.data)) {
						fetchedList = respAny.data;
					} else if (Array.isArray(respAny.items)) {
						fetchedList = respAny.items;
					}
					totalCount =
						response?.total_document ??
						respAny.total_document ??
						respAny.count ??
						fetchedList.length;
				}

				setGateways(fetchedList);
				setTotalDocuments(totalCount);
				lastFetchKeyRef.current = currentFetchKey;
			} catch (error: any) {
				showNotification(
					'Error',
					error?.data?.message || error?.message || 'Failed to fetch payment gateways',
					'danger',
				);
				setGateways([]);
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
			canRead,
		],
	);

	useEffect(() => {
		fetchGateways();
	}, [fetchGateways]);

	// RESET FILTERS HANDLER
	const handleResetFilters = () => {
		setSearchTerm('');
		setStatusFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	// OPEN CREATE MODAL
	const handleOpenCreate = () => {
		setSelectedGateway(null);
		setIsModalOpen(true);
	};

	// OPEN EDIT MODAL
	const handleOpenEdit = useCallback((item: IPaymentGateway) => {
		setSelectedGateway(item);
		setIsModalOpen(true);
	}, []);

	// OPEN VIEW MODAL
	const handleOpenView = useCallback((item: IPaymentGateway) => {
		setViewingGateway(item);
		setIsViewModalOpen(true);
	}, []);

	// STATUS TOGGLE HANDLER (USES GENERAL UPDATE API WITH STATUS)
	const handleStatusToggle = async (item: IPaymentGateway) => {
		const newStatus: TPaymentGatewayStatus = item.status === 'active' ? 'inactive' : 'active';
		setUpdatingStatusId(item.id);
		try {
			await paymentGatewayService.updatePaymentGatewayStatus(item.id, newStatus);
			setGateways((prev) =>
				prev.map((g) => (g.id === item.id ? { ...g, status: newStatus } : g)),
			);
			showNotification(
				'Status Updated',
				`"${item.name}" status changed to ${newStatus.toUpperCase()}`,
				'success',
			);
		} catch (error: any) {
			showNotification(
				'Status Update Failed',
				error?.data?.message || error?.message || 'Failed to update gateway status',
				'danger',
			);
		} finally {
			setUpdatingStatusId(null);
		}
	};

	// TABLE COLUMNS CONFIGURATION
	const columns: IListingColumn<IPaymentGateway>[] = useMemo(
		() => [
			{
				key: 'gateway',
				header: 'Payment Gateway',
				minWidth: '220px',
				render: (item) => {
					const iconUrl = item.icon ? getImageUrl(item.icon) : '';
					return (
						<div className='gateway-cell-info'>
							<div
								className='gateway-icon-wrapper'
								style={{ cursor: iconUrl ? 'pointer' : 'default' }}
								onClick={() => {
									if (iconUrl) {
										setPreviewImage({ url: iconUrl, title: `${item.name} Icon` });
										setIsPreviewModalOpen(true);
									}
								}}>
								{iconUrl ? (
									<img src={iconUrl} alt={item.name} />
								) : (
									<Icon icon='AccountBalanceWallet' size='md' className='gateway-placeholder-icon' />
								)}
							</div>
							<div className='gateway-text-meta'>
								<span className='gateway-name text-truncate'>{item.name}</span>
								<span className='gateway-code-tag'>{item.code}</span>
							</div>
						</div>
					);
				},
			},
			{
				key: 'description',
				header: 'Description',
				minWidth: '250px',
				render: (item) => (
					<span
						className='text-muted small text-truncate d-inline-block'
						style={{ maxWidth: '300px' }}
						title={item.description || '-'}>
						{item.description || '-'}
					</span>
				),
			},
			{
				key: 'status',
				header: 'Status',
				minWidth: '120px',
				render: (item) => {
					const isAllowed = canUpdate(PERMISSION_KEYS.PAYMENT_GATEWAY) || canUpdate(PERMISSION_KEYS.SETTING);
					const isToggling = updatingStatusId === item.id;
					return (
						<StatusToggle
							checked={item.status === 'active'}
							onChange={() => handleStatusToggle(item)}
							disabled={!isAllowed || isToggling}
							ariaLabel={`Toggle ${item.name} status`}
						/>
					);
				},
			},
			{
				key: 'created_at',
				header: 'Created At',
				minWidth: '170px',
				render: (item) => {
					const { date, time } = formatDateTime(item.created_at);
					return (
						<div className='d-flex flex-column'>
							<span className='fw-medium text-dark small'>{date}</span>
							<span className='text-muted' style={{ fontSize: '0.75rem' }}>
								{time}
							</span>
						</div>
					);
				},
			},
		],
		[canUpdate, updatingStatusId],
	);
	return (
		<PageWrapper title='Payment Gateways'>
			<Page container='fluid'>
				<ListingPage<IPaymentGateway>
					title='Payment Gateways'
					subTitle='Manage and configure payment gateways, credentials, statuses, and icons'
					permissionKey={PERMISSION_KEYS.PAYMENT_GATEWAY}
					breadcrumbs={[
						{ text: 'Settings', to: '/setting' },
						{ text: 'Payment Gateways' },
					]}
					onAddNew={
						canCreate(PERMISSION_KEYS.PAYMENT_GATEWAY) || canCreate(PERMISSION_KEYS.SETTING)
							? handleOpenCreate
							: undefined
					}
					addNewText='Add Gateway'
					addNewIcon='AddCard'
					activeFilterCount={activeFilterCount}
					columns={columns}
					data={gateways}
					isLoading={isLoading}
					emptyMessage='No payment gateways found.'
					actions={{
						permissionKey: PERMISSION_KEYS.PAYMENT_GATEWAY,
						actionColumnWidth: '120px',
						onView: handleOpenView,
						onEdit: handleOpenEdit,
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

				{/* CREATE / EDIT MODAL */}
				<PaymentGatewayModal
					isOpen={isModalOpen}
					setIsOpen={setIsModalOpen}
					gatewayData={selectedGateway}
					onSuccess={() => fetchGateways(true)}
				/>

				{/* VIEW MODAL */}
				<PaymentGatewayViewModal
					isOpen={isViewModalOpen}
					setIsOpen={setIsViewModalOpen}
					gateway={viewingGateway}
				/>

				{/* IMAGE PREVIEW MODAL */}
				{previewImage && (
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

export default PaymentGatewayListPage;
