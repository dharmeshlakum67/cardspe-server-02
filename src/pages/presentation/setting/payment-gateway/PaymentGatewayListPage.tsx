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
import Tooltips from '../../../../components/bootstrap/Tooltips';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { formatDateTime } from '../../../../helpers/dateUtils';
import { getImageUrl } from '../../../../helpers/helpers';
import {
	IPaymentGateway,
	TPaymentGatewayStatus,
	parseGatewayCharges,
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
				minWidth: '200px',
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
									<img
										src={iconUrl}
										alt={item.name}
										onError={(e) => {
											(e.target as HTMLElement).style.display = 'none';
											const parent = (e.target as HTMLElement).parentElement;
											if (
												parent &&
												!parent.querySelector('.gateway-fallback-text') &&
												!parent.querySelector('.gateway-placeholder-icon')
											) {
												const fallback = document.createElement('span');
												fallback.className = 'gateway-fallback-text font-bold text-primary';
												fallback.style.fontSize = '0.85rem';
												fallback.style.fontWeight = '700';
												fallback.innerText = (item.name || 'PG').substring(0, 2).toUpperCase();
												parent.appendChild(fallback);
											}
										}}
									/>
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
				key: 'charges',
				header: 'Gateway Charges',
				minWidth: '220px',
				render: (item) => {
					const chargesList = parseGatewayCharges(item.charges);
					if (!chargesList || chargesList.length === 0) {
						return <span className='text-muted small fst-italic'>None configured</span>;
					}

					const chargesTooltipContent = (
						<div className='p-2 text-start' style={{ minWidth: '190px' }}>
							<div className='d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-50 pb-1 mb-2'>
								<span className='fw-bold text-white' style={{ fontSize: '0.8rem' }}>
									Gateway Charges
								</span>
								<span
									className='badge bg-light text-dark'
									style={{ fontSize: '0.675rem', fontWeight: 600 }}>
									{chargesList.length} rules
								</span>
							</div>
							<div className='d-flex flex-column gap-1'>
								{chargesList.map((charge) => {
									const isFlat = charge.type === 'FLAT';
									const formattedVal = isFlat
										? `₹${Number(charge.value).toFixed(2)}`
										: `${Number(charge.value).toFixed(2)}%`;
									return (
										<div
											key={`tooltip_charge_${charge.name}_${charge.type}`}
											className='d-flex justify-content-between align-items-center py-0.5'
											style={{ fontSize: '0.775rem' }}>
											<span className='text-white-50 fw-semibold'>{charge.name}</span>
											<span className='fw-bold text-white font-monospace'>
												{formattedVal}
												<span
													className='text-white-50 ms-1'
													style={{ fontSize: '0.675rem' }}>
													({isFlat ? 'Flat' : 'Pct'})
												</span>
											</span>
										</div>
									);
								})}
							</div>
						</div>
					);

					return (
						<Tooltips title={chargesTooltipContent} placement='top'>
							<div
								className='gateway-charges-pill-group d-inline-flex align-items-center gap-2'
								style={{ cursor: 'pointer' }}>
								{chargesList.slice(0, 2).map((charge) => {
									const isFlat = charge.type === 'FLAT';
									const formattedVal = isFlat ? `₹${charge.value}` : `${charge.value}%`;
									return (
										<span
											key={`pill_charge_${charge.name}_${charge.type}`}
											className='badge bg-light text-dark border d-inline-flex align-items-center gap-1.5 shadow-sm'
											style={{
												fontSize: '0.75rem',
												fontWeight: 500,
												padding: '4px 10px',
												borderRadius: '6px',
											}}>
											<span className='fw-bold text-primary'>{charge.name}:</span>
											<span>{formattedVal}</span>
										</span>
									);
								})}
								{chargesList.length > 2 && (
									<span
										className='badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 d-inline-flex align-items-center'
										style={{
											fontSize: '0.75rem',
											fontWeight: 600,
											padding: '4px 10px',
											borderRadius: '6px',
										}}>
										+{chargesList.length - 2} more
									</span>
								)}
							</div>
						</Tooltips>
					);
				},
			},
			{
				key: 'limits',
				header: 'Transaction Limits',
				minWidth: '180px',
				render: (item) => {
					const hasMin =
						item.min_amount !== null &&
						item.min_amount !== undefined &&
						item.min_amount !== ('' as any);
					const hasMax =
						item.max_amount !== null &&
						item.max_amount !== undefined &&
						item.max_amount !== ('' as any);

					if (!hasMin && !hasMax) {
						return <span className='text-muted small fst-italic'>No limit</span>;
					}

					const formattedMin = hasMin
						? `₹${Number(item.min_amount).toLocaleString('en-IN')}`
						: '₹0';
					const formattedMax = hasMax
						? `₹${Number(item.max_amount).toLocaleString('en-IN')}`
						: 'No Max';

					let limitsText = '';
					if (hasMin && hasMax) {
						limitsText = `${formattedMin} - ${formattedMax}`;
					} else if (hasMin) {
						limitsText = `Min: ${formattedMin}`;
					} else {
						limitsText = `Max: ${formattedMax}`;
					}

					return (
						<div className='d-flex flex-column text-center'>
							<span className='fw-medium text-dark small font-monospace'>
								{limitsText}
							</span>
						</div>
					);
				},
			},
			{
				key: 'description',
				header: 'Description',
				minWidth: '220px',
				render: (item) => {
					if (!item.description) {
						return <span className='text-muted small'>-</span>;
					}
					return (
						<Tooltips title={item.description} placement='top'>
							<span
								className='text-muted small text-truncate d-inline-block'
								style={{ maxWidth: '260px', cursor: 'pointer' }}>
								{item.description}
							</span>
						</Tooltips>
					);
				},
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
