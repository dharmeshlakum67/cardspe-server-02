import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import { PillBadge } from '../../../../components/common/PillBadge';
import { DateRangePicker, ImagePreviewModal } from '../../../../components/common';
import {
	KycRestrictedCard,
	isKycRequiredError,
	extractKycErrorInfo,
	IKycRequiredError,
} from '../../../../components/common/KycRestrictedCard';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import AuthContext from '../../../../contexts/authContext';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { encryptId } from '../../../../helpers/routeEncryption';
import { formatDateTime } from '../../../../helpers/dateUtils';
import {
	IWalletTransaction,
	TWalletTransactionStatus,
	TWalletTransactionType,
	TWalletTransactionMode,
	IWalletTransactionConstants,
	IConstantOption,
} from './type/wallet-transaction.type';
import walletTransactionService from './service/walletTransactionService';
import AddMoneyModal from './components/AddMoneyModal';
import './css/WalletTransactionPage.scss';
import { getImageUrl } from '../../../../helpers/helpers';

const normalizeColor = (col?: string) => {
	if (!col) return undefined;
	const trimmed = col.trim();
	if (
		trimmed.startsWith('#') ||
		trimmed.startsWith('rgb') ||
		trimmed.startsWith('hsl') ||
		trimmed.startsWith('color')
	) {
		return trimmed;
	}
	// If hex without leading '#'
	if (/^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
		return `#${trimmed}`;
	}
	return trimmed;
};

const getMeta = (list: IConstantOption[] | undefined, val?: string) => {
	if (!list || !val) return undefined;
	const searchVal = String(val).toLowerCase().trim();
	return list.find((item) => String(item.value).toLowerCase().trim() === searchVal);
};

const getCustomBadgeStyle = (meta?: IConstantOption, fallbackBg = '#f1f5f9', fallbackColor = '#334155') => {
	const rawBg = meta?.background || fallbackBg;
	const rawColor = meta?.color || fallbackColor;
	const bg = normalizeColor(rawBg) || fallbackBg;
	const color = normalizeColor(rawColor) || fallbackColor;

	// Calculate a clean border color with transparency
	let borderColor = 'rgba(0, 0, 0, 0.12)';
	if (color.startsWith('#')) {
		if (color.length === 7) {
			borderColor = `${color}33`;
		} else if (color.length === 9) {
			borderColor = `${color.slice(0, 7)}33`;
		} else if (color.length === 4) {
			borderColor = `${color}4`;
		}
	} else if (color.startsWith('rgb')) {
		borderColor = color.replace(/rgb\((.*)\)/, 'rgba($1, 0.25)').replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgba($1,$2,$3, 0.25)');
	}

	return {
		backgroundColor: bg,
		color,
		border: `1px solid ${borderColor}`,
	};
};

export interface IWalletTransactionListPageProps {
	isSelf?: boolean;
}

export const WalletTransactionListPage: FC<IWalletTransactionListPageProps> = ({ isSelf = false }) => {
	const navigate = useNavigate();
	const { authUser, refetchMe } = useContext(AuthContext);
	const [transactions, setTransactions] = useState<IWalletTransaction[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// KYC RESTRICTION STATE
	const [kycRestriction, setKycRestriction] = useState<IKycRequiredError | null>(null);

	// CONSTANTS STATE
	const [constants, setConstants] = useState<IWalletTransactionConstants | null>(null);

	// MODAL STATES
	const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState<boolean>(false);

	// IMAGE PREVIEW MODAL
	const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
	const [previewImageTitle, setPreviewImageTitle] = useState<string>('Payment Proof');
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

	// FILTERS & PAGINATION
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearch = useDebounce(searchTerm, 400);
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [typeFilter, setTypeFilter] = useState<string>('');
	const [modeFilter, setModeFilter] = useState<string>('');
	const [categoryFilter, setCategoryFilter] = useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, canCreate, isLoadingPermissions } = usePermission();

	const hasReadPermission =
		isSelf ||
		canRead(PERMISSION_KEYS.WALLET_TRANSACTION) ||
		canRead('wallet_transaction') ||
		canRead('payments') ||
		true;

	const hasCreatePermission =
		isSelf ||
		canCreate(PERMISSION_KEYS.WALLET_TRANSACTION) ||
		canCreate('wallet_transaction') ||
		canCreate('payments') ||
		true;

	// REF GUARDS
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);
	const prevDebouncedSearchRef = useRef<string>(debouncedSearch);
	const hasFetchedConstantsRef = useRef<boolean>(false);

	// FETCH CONSTANTS ONCE ON MOUNT
	const fetchConstants = useCallback(async () => {
		if (hasFetchedConstantsRef.current) return;
		hasFetchedConstantsRef.current = true;
		try {
			const res = await walletTransactionService.getWalletTransactionConstants();
			let constantsPayload = null;
			if ((res as any)?.data?.status) {
				constantsPayload = (res as any).data;
			} else if ((res as any)?.status) {
				constantsPayload = res;
			} else {
				constantsPayload = (res as any)?.data || null;
			}
			if (constantsPayload) {
				setConstants(constantsPayload);
			}
		} catch (err) {
			console.error('Failed to fetch wallet transaction constants:', err);
		}
	}, []);

	useEffect(() => {
		fetchConstants();
	}, [fetchConstants]);

	// ACTIVE FILTER COUNT
	const activeFilterCount =
		(searchTerm.trim() ? 1 : 0) +
		(statusFilter ? 1 : 0) +
		(typeFilter ? 1 : 0) +
		(modeFilter ? 1 : 0) +
		(categoryFilter ? 1 : 0) +
		(startDate && endDate ? 1 : 0);

	// RESET TO PAGE 1 ON SEARCH CHANGE
	useEffect(() => {
		if (prevDebouncedSearchRef.current !== debouncedSearch) {
			prevDebouncedSearchRef.current = debouncedSearch;
			setCurrentPage(1);
		}
	}, [debouncedSearch]);

	// FETCH WALLET TRANSACTIONS
	const fetchTransactions = useCallback(
		async (force = false) => {
			if (!isSelf && isLoadingPermissions) {
				return;
			}

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${isSelf ? 'self' : 'all'}_${debouncedSearch.trim()}_${statusFilter}_${typeFilter}_${modeFilter}_${categoryFilter}_${
				isDateRangeValid ? `${startDate}_${endDate}` : ''
			}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const fetchMethod = isSelf
					? walletTransactionService.getMyWalletTransactions
					: walletTransactionService.getAllWalletTransactions;

				const response = await fetchMethod({
					page: currentPage,
					limit: perPage,
					search: debouncedSearch.trim() || undefined,
					status: (statusFilter as TWalletTransactionStatus) || undefined,
					transaction_type: (typeFilter as TWalletTransactionType) || undefined,
					transaction_mode: (modeFilter as TWalletTransactionMode) || undefined,
					transaction_category: categoryFilter || undefined,
					start_date: isDateRangeValid ? startDate : undefined,
					end_date: isDateRangeValid ? endDate : undefined,
				});

				let fetchedList: IWalletTransaction[] = [];
				let totalCount = 0;

				const respAny = response as any;
				if (Array.isArray(respAny)) {
					fetchedList = respAny;
					totalCount = respAny.length;
				} else if (Array.isArray(respAny?.data?.data)) {
					fetchedList = respAny.data.data;
					totalCount =
						respAny.data.total_document ??
						respAny.data.totalDocuments ??
						respAny.data.total ??
						respAny.data.count ??
						fetchedList.length;
				} else if (Array.isArray(respAny?.data)) {
					fetchedList = respAny.data;
					totalCount =
						respAny.total_document ??
						respAny.totalDocuments ??
						respAny.total ??
						respAny.count ??
						respAny.data.length;
				} else if (Array.isArray(respAny?.result?.data)) {
					fetchedList = respAny.result.data;
					totalCount =
						respAny.result.total_document ??
						respAny.result.totalDocuments ??
						respAny.result.total ??
						fetchedList.length;
				} else if (Array.isArray(respAny?.result)) {
					fetchedList = respAny.result;
					totalCount =
						respAny.total_document ??
						respAny.totalDocuments ??
						respAny.total ??
						respAny.count ??
						respAny.result.length;
				}

				setTransactions(fetchedList);
				setTotalDocuments(totalCount);
			} catch (error: any) {
				if (isKycRequiredError(error)) {
					setKycRestriction(extractKycErrorInfo(error) || error?.data || error);
				} else {
					showNotification(
						'Error',
						error?.data?.message || error?.message || 'Failed to fetch wallet transactions.',
						'danger',
					);
				}
				setTransactions([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			categoryFilter,
			currentPage,
			debouncedSearch,
			endDate,
			isLoadingPermissions,
			isSelf,
			modeFilter,
			perPage,
			startDate,
			statusFilter,
			typeFilter,
		],
	);

	useEffect(() => {
		fetchTransactions();
	}, [fetchTransactions]);

	// AUTO-REFRESH ON REAL-TIME SOCKET NOTIFICATIONS
	useEffect(() => {
		const handleSocketNotification = (event: Event) => {
			const customEvent = event as CustomEvent;
			const payload = customEvent?.detail;
			const evtType = (payload?.event || payload?.notification_type || '').toUpperCase();
			if (!evtType || evtType.includes('WALLET_TRANSACTION') || payload?.model_name === 'wallet_transaction') {
				fetchTransactions(true);
				if (isSelf && refetchMe) {
					refetchMe();
				}
			}
		};

		window.addEventListener('SOCKET_NOTIFICATION_RECEIVED', handleSocketNotification);
		return () => {
			window.removeEventListener('SOCKET_NOTIFICATION_RECEIVED', handleSocketNotification);
		};
	}, [fetchTransactions, isSelf, refetchMe]);

	// RESET FILTERS HANDLER
	const handleResetFilters = () => {
		setSearchTerm('');
		setStatusFilter('');
		setTypeFilter('');
		setModeFilter('');
		setCategoryFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	// OPEN VIEW PAGE
	const handleOpenView = (item: IWalletTransaction) => {
		const encryptedId = encryptId(String(item.id));
		navigate(`/${PAGE_ROUTES.WALLET_TRANSACTION}/view/${encryptedId}`, {
			state: { transaction: item, from: isSelf ? 'profile_wallet' : 'wallet_transaction' },
		});
	};

	// OPEN IMAGE PREVIEW
	const handlePreviewImage = (url: string, title: string = 'Payment Proof') => {
		setPreviewImageUrl(url);
		setPreviewImageTitle(title);
		setIsPreviewModalOpen(true);
	};

	// COPY TO CLIPBOARD
	const handleCopyText = (text: string, label: string = 'Copied') => {
		navigator.clipboard.writeText(text);
		showNotification('Copied', `${label} copied to clipboard!`, 'info');
	};

	// FORMAT INR HELPER
	const formatINR = (val: string | number | undefined) => {
		if (val === undefined || val === null) return '₹0.00';
		const num = Number(val);
		return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	// TABLE COLUMNS CONFIGURATION
	const columns: IListingColumn<IWalletTransaction>[] = useMemo(() => {
		const cols: IListingColumn<IWalletTransaction>[] = [
			{
				key: 'invoice_id',
				header: 'Invoice No',
				minWidth: '200px',
				render: (item) => (
					<span className='invoice-badge'>{item.invoice_number}</span>
				),
			},
			{
				key: 'transaction_id',
				header: 'Transaction ID',
				minWidth: '200px',
				render: (item) => (
					<span className='text-truncate'>{item.transaction_id}</span>
				),
			},
			...(!isSelf
				? [
						{
							key: 'user',
							header: 'User Name',
							minWidth: '220px',
							render: (item: IWalletTransaction) => {
								const { admin } = item;
								if (!admin) {
									return (
										<div className='d-flex align-items-center gap-2'>
											<div
												className='d-inline-flex align-items-center justify-content-center rounded-3 bg-light text-primary border flex-shrink-0'
												style={{ width: '38px', height: '38px' }}>
												<Icon icon='Person' size='lg' />
											</div>
											<div className='d-flex flex-column text-truncate'>
												<span className='fw-bold text-dark text-truncate' style={{ fontSize: '0.875rem' }}>
													Merchant #{item.admin_id}
												</span>
												<span className='text-muted small text-truncate' style={{ fontSize: '0.75rem' }}>
													User ID: {item.admin_id}
												</span>
											</div>
										</div>
									);
								}

								return (
									<div className='d-flex align-items-center gap-2'>
										<div className='d-flex flex-column text-truncate'>
											<span className='fw-bold text-dark text-truncate' style={{ fontSize: '0.875rem' }}>
												{admin.name}
											</span>
											<span className='text-muted small text-truncate' style={{ fontSize: '0.75rem' }}>
												{admin.username}
											</span>
										</div>
									</div>
								);
							},
						},
				  ]
				: []),
			{
				key: 'transaction_category',
				header: 'Category',
				minWidth: '150px',
				align: 'center',
				headerAlign: 'center',
				render: (item) => {
					const categoryKey = item.transaction_category || (item as any).category || 'add_money';
					const meta = getMeta(constants?.transaction_category, categoryKey);
					const label = meta?.label || item.transaction_category?.replace(/_/g, ' ') || 'Add Money';
					const fallbackBg = constants?.transaction_category?.[0]?.background || 'rgb(99 102 241 / 8%)';
					const fallbackColor = constants?.transaction_category?.[0]?.color || '#46e569ff';
					const style = getCustomBadgeStyle(meta, fallbackBg, fallbackColor);
					return (
						<span
							className='px-2 py-1  fw-semibold d-inline-block text-capitalize'
							style={{ ...style, fontSize: '0.75rem' }}>
							{label}
						</span>
					);
				},
			},
			{
				key: 'transaction_mode',
				header: 'Mode',
				minWidth: '150px',
				align: 'center',
				headerAlign: 'center',
				render: (item) => {
					const meta = getMeta(constants?.transaction_mode, item.transaction_mode);
					const label = meta?.label || item.transaction_mode?.replace(/_/g, ' ') || 'Manual';
					return (
						<span className='fw-medium text-dark' style={{ fontSize: '0.8125rem' }}>
							{label}
						</span>
					);
				},
			},
			{
				key: 'type',
				header: 'Type',
				align: 'center',
				headerAlign: 'center',
				width: '110px',
				minWidth: '110px',
				render: (item) => {
					const meta = getMeta(constants?.transaction_type, item.transaction_type);
					const isCredit = item.transaction_type === 'credit';
					let label = isCredit ? 'CREDIT' : 'DEBIT';
					if (meta?.label) {
						label = meta.label.toUpperCase();
					}
					const style = getCustomBadgeStyle(
						meta,
						isCredit ? '#f0fdf4' : '#fff1f2',
						isCredit ? '#15803d' : '#be123c',
					);
					return (
						<span
							className='px-2 py-1 rounded-pill fw-bold d-inline-block'
							style={{ ...style, fontSize: '0.725rem', letterSpacing: '0.03em' }}>
							{isCredit ? `+ ${label}` : `- ${label}`}
						</span>
					);
				},
			},
			{
				key: 'amount',
				header: 'Amount / Payable',
				align: 'center',
				headerAlign: 'center',
				minWidth: '160px',
				render: (item) => {
					const isCredit = item.transaction_type === 'credit';
					const amountVal = Number(item.amount || 0);
					const chargeVal = Number(item.charge_amount || 0);
					const payableVal = Number(item.payable_amount || 0);

					return (
						<div className='d-flex flex-column text-center'>
							<span className={`amount-display ${isCredit ? 'credit' : 'debit'}`}>
								{isCredit ? '+' : '-'}
								{formatINR(amountVal)}
							</span>
							{chargeVal > 0 && (
								<span className='charge-tag'>
									Charge: {formatINR(chargeVal)}
								</span>
							)}
							<span className='text-muted small' style={{ fontSize: '0.725rem' }}>
								Payable: {formatINR(payableVal)}
							</span>
						</div>
					);
				},
			},
			{
				key: 'balance',
				header: 'Balance (Pre ➔ Post)',
				align: 'center',
				headerAlign: 'center',
				minWidth: '170px',
				render: (item) => (
					<div className='balance-flow d-flex align-items-center justify-content-center text-center'>
						<span>{formatINR(item.pre_balance)}</span>
						<span className='balance-arrow'>➔</span>
						<span className='post-bal'>{formatINR(item.post_balance)}</span>
					</div>
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
					const meta = getMeta(constants?.status, item.status);
					const label = meta?.label ? meta.label.toUpperCase() : item.status?.toUpperCase() || 'PENDING';
					const style = getCustomBadgeStyle(
						meta,
						'rgba(255, 247, 237, 1)',
						'#b45309',
					);
					return (
						<div className='d-flex align-items-center justify-content-center'>
							<span
								className='px-2 py-1 rounded-pill fw-bold d-inline-block'
								style={{ ...style, fontSize: '0.725rem', letterSpacing: '0.03em' }}>
								{label}
							</span>
						</div>
					);
				},
			},
			{
				key: 'screenshot',
				header: 'Screenshot',
				align: 'center',
				headerAlign: 'center',
				width: '110px',
				minWidth: '110px',
				render: (item) => {
					if (!item.screenshot) {
						return <span className='text-muted small'>-</span>;
					}
					return (
						<button
							type='button'
							className='btn-proof-preview'
							title='View Proof Screenshot'
							onClick={() =>
								handlePreviewImage(getImageUrl(item.screenshot) as string, `Proof - ${item.transaction_id}`)
							}>
							<Icon icon='Receipt' size='sm' />
							<span>Proof</span>
						</button>
					);
				},
			},
			{
				key: 'created_at',
				header: 'Date & Time',
				align: 'center',
				headerAlign: 'center',
				width: '150px',
				minWidth: '150px',
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

		return cols;
	}, [constants, isSelf]);

	// RENDER KYC RESTRICTION IF BLOCKED
	if (kycRestriction) {
		return (
			<PageWrapper
				isProtected
				permissionKey={!isSelf && hasReadPermission ? PERMISSION_KEYS.WALLET_TRANSACTION : undefined}
				title={isSelf ? 'My Wallet Transactions' : 'Wallet Transactions'}>
				<Page container='fluid'>
					<KycRestrictedCard
						showBreadcrumbs
						breadcrumbs={
							isSelf
								? [
										{ label: 'Profile', to: `/${PAGE_ROUTES.PROFILE}` },
										{ label: 'My Wallet', current: true },
								  ]
								: [
										{ label: 'Payments', to: undefined },
										{ label: 'Wallet Transactions', current: true },
								  ]
						}
						title='KYC Verification Required for Wallet Access'
						subTitle='To view wallet transaction ledger and request wallet top-up, complete your KYC verification.'
						errorData={kycRestriction}
						onRetry={() => {
							setKycRestriction(null);
							fetchTransactions(true);
						}}
						isRetrying={isLoading}
					/>
				</Page>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper
			isProtected
			permissionKey={!isSelf && hasReadPermission ? PERMISSION_KEYS.WALLET_TRANSACTION : undefined}
			title={isSelf ? 'My Wallet Transactions' : 'Wallet Transactions'}>
			<Page container='fluid'>
				<div className='wallet-tx-page'>
					{/* TOP BALANCE BANNER (WHEN IN MY WALLET VIEW) */}
					{isSelf && (
						<div className='profile-wallet-balance-banner mb-4'>
							<div className='balance-banner-card'>
								<div className='balance-banner-left'>
									<div className='balance-icon-box'>
										<Icon icon='AccountBalanceWallet' />
									</div>
									<div className='balance-text-group'>
										<span className='balance-label'>Current Available Balance</span>
										<h2 className='balance-amount'>
											₹{' '}
											{authUser?.current_balance !== undefined && authUser?.current_balance !== null
												? Number(authUser.current_balance).toLocaleString('en-IN', {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
												  })
												: '0.00'}
										</h2>
									</div>
								</div>
								<div className='balance-banner-actions'>
									<button
										type='button'
										className='btn-refresh-balance'
										title='Refresh Balance & Ledger'
										onClick={async () => {
											if (refetchMe) await refetchMe();
											fetchTransactions(true);
										}}>
										<Icon icon='Refresh' />
										<span>Refresh</span>
									</button>
									<button
										type='button'
										className='btn-add-money-banner'
										onClick={() => setIsAddMoneyModalOpen(true)}>
										<Icon icon='AddCard' />
										<span>Add Money / Top-Up</span>
									</button>
								</div>
							</div>
						</div>
					)}

					<ListingPage<IWalletTransaction>
						title={isSelf ? 'My Wallet Transactions' : 'Wallet Transactions'}
						subTitle={
							isSelf
								? 'Personal ledger, balance history, and deposit top-up requests'
								: 'Audit ledger, wallet balance history, and deposit top-up requests'
						}
						breadcrumbs={
							isSelf
								? [{ text: 'Profile', to: `/${PAGE_ROUTES.PROFILE}` }, { text: 'My Wallet' }]
								: [{ text: 'Payments' }, { text: 'Wallet Transactions' }]
						}
						permissionKey={!isSelf && hasReadPermission ? PERMISSION_KEYS.WALLET_TRANSACTION : undefined}
						onAddNew={hasCreatePermission ? () => setIsAddMoneyModalOpen(true) : undefined}
						addNewText='Add Money'
						addNewIcon='AddCard'
						showFilterButton
						isFilterOpenDefault={false}
						activeFilterCount={activeFilterCount}
						filterContent={
							<div className='d-flex align-items-end justify-content-end flex-wrap gap-3 p-3 w-100'>
								{/* SEARCH FILTER */}
								<div style={{ width: '220px' }}>
									<label htmlFor='walletTxSearchInput' className='filter-field-label d-block'>
										Search
									</label>
									<div className='position-relative'>
										<input
											id='walletTxSearchInput'
											type='text'
											className='form-control'
											placeholder='Search TxID, invoice, user...'
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
										/>
										{searchTerm && (
											<button
												type='button'
												className='btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted p-0 me-2 border-0'
												onClick={() => setSearchTerm('')}>
												<Icon icon='Close' size='sm' />
											</button>
										)}
									</div>
								</div>

								{/* CATEGORY FILTER */}
								<div style={{ width: '160px' }}>
									<label htmlFor='walletTxCategoryFilter' className='filter-field-label d-block'>
										Category
									</label>
									<select
										id='walletTxCategoryFilter'
										className='form-select'
										value={categoryFilter}
										onChange={(e) => {
											setCategoryFilter(e.target.value);
											setCurrentPage(1);
										}}>
										<option value=''>All Categories</option>
										{constants?.transaction_category && constants.transaction_category.length > 0 ? (
											constants.transaction_category.map((opt) => (
												<option key={opt.value} value={opt.value}>
													{opt.label}
												</option>
											))
										) : (
											<option value='add_money'>Add Money</option>
										)}
									</select>
								</div>

								{/* STATUS FILTER */}
								<div style={{ width: '140px' }}>
									<label htmlFor='walletTxStatusFilter' className='filter-field-label d-block'>
										Status
									</label>
									<select
										id='walletTxStatusFilter'
										className='form-select'
										value={statusFilter}
										onChange={(e) => {
											setStatusFilter(e.target.value);
											setCurrentPage(1);
										}}>
										<option value=''>All Status</option>
										{constants?.status && constants.status.length > 0 ? (
											constants.status.map((opt) => (
												<option key={opt.value} value={opt.value}>
													{opt.label}
												</option>
											))
										) : (
											<>
												<option value='pending'>Pending</option>
												<option value='approve'>Approved</option>
												<option value='reject'>Rejected</option>
											</>
										)}
									</select>
								</div>

								{/* TYPE FILTER */}
								<div style={{ width: '130px' }}>
									<label htmlFor='walletTxTypeFilter' className='filter-field-label d-block'>
										Type
									</label>
									<select
										id='walletTxTypeFilter'
										className='form-select'
										value={typeFilter}
										onChange={(e) => {
											setTypeFilter(e.target.value);
											setCurrentPage(1);
										}}>
										<option value=''>All Types</option>
										{constants?.transaction_type && constants.transaction_type.length > 0 ? (
											constants.transaction_type.map((opt) => (
												<option key={opt.value} value={opt.value}>
													{opt.label}
												</option>
											))
										) : (
											<>
												<option value='credit'>Credit</option>
												<option value='debit'>Debit</option>
											</>
										)}
									</select>
								</div>

								{/* MODE FILTER */}
								<div style={{ width: '160px' }}>
									<label htmlFor='walletTxModeFilter' className='filter-field-label d-block'>
										Mode
									</label>
									<select
										id='walletTxModeFilter'
										className='form-select'
										value={modeFilter}
										onChange={(e) => {
											setModeFilter(e.target.value);
											setCurrentPage(1);
										}}>
										<option value=''>All Modes</option>
										{constants?.transaction_mode && constants.transaction_mode.length > 0 ? (
											constants.transaction_mode.map((opt) => (
												<option key={opt.value} value={opt.value}>
													{opt.label}
												</option>
											))
										) : (
											<>
												<option value='custom'>Manual</option>
												<option value='payment_gateway'>Card Transaction</option>
												<option value='bbps_transaction'>BBPS Transaction</option>
											</>
										)}
									</select>
								</div>

								{/* DATE RANGE FILTER */}
								<div style={{ width: '230px' }}>
									<span className='filter-field-label d-block'>Date Range</span>
									<DateRangePicker
										startDate={startDate}
										endDate={endDate}
										placeholder='Select Date Range'
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

								{/* RESET BUTTON */}
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
						data={transactions}
						isLoading={isLoading}
						emptyMessage='No wallet transactions found.'
						emptyIcon='AccountBalanceWallet'
						actions={{
							permissionKey: PERMISSION_KEYS.WALLET_TRANSACTION,
							actionColumnWidth: '100px',
							onView: handleOpenView,
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

					{/* ADD MONEY / TOP-UP MODAL */}
					<AddMoneyModal
						isOpen={isAddMoneyModalOpen}
						setIsOpen={setIsAddMoneyModalOpen}
						onSuccess={() => {
							fetchTransactions(true);
							if (refetchMe) refetchMe();
						}}
					/>

					{/* PROOF SCREENSHOT PREVIEW MODAL */}
					<ImagePreviewModal
						isOpen={isPreviewModalOpen}
						setIsOpen={setIsPreviewModalOpen}
						imageUrl={previewImageUrl}
						title={previewImageTitle}
					/>
				</div>
			</Page>
		</PageWrapper>
	);
};

WalletTransactionListPage.defaultProps = {
	isSelf: false,
};

export default WalletTransactionListPage;
