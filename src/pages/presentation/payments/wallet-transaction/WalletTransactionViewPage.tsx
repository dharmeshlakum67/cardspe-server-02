/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-nested-ternary */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import Button from '../../../../components/bootstrap/Button';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../../../components/bootstrap/Modal';
import showNotification from '../../../../components/extras/showNotification';
import {
	AppBreadcrumbs,
	ImagePreviewModal,
	ConfirmationModal,
	KycRestrictedCard,
	isKycRequiredError,
	extractKycErrorInfo,
	IKycRequiredError,
} from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';
import { decryptId } from '../../../../helpers/routeEncryption';
import { formatDateTime } from '../../../../helpers/dateUtils';
import { getImageUrl } from '../../../../helpers/helpers';
import {
	IWalletTransaction,
	IWalletTransactionConstants,
	IConstantOption,
} from './type/wallet-transaction.type';
import walletTransactionService from './service/walletTransactionService';
import './css/WalletTransactionViewPage.scss';

// NORMALIZE COLOR UTILITY
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
	if (/^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
		return `#${trimmed}`;
	}
	return trimmed;
};

// GET METADATA BY VALUE
const getMeta = (list: IConstantOption[] | undefined, val?: string) => {
	if (!list || !val) return undefined;
	const searchVal = String(val).toLowerCase().trim();
	return list.find((item) => String(item.value).toLowerCase().trim() === searchVal);
};

// COMPUTE CUSTOM BADGE STYLES
const getCustomBadgeStyle = (
	meta?: IConstantOption,
	fallbackBg = '#f1f5f9',
	fallbackColor = '#334155',
) => {
	const rawBg = meta?.background || fallbackBg;
	const rawColor = meta?.color || fallbackColor;
	const bg = normalizeColor(rawBg) || fallbackBg;
	const color = normalizeColor(rawColor) || fallbackColor;

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
		borderColor = color
			.replace(/rgb\((.*)\)/, 'rgba($1, 0.25)')
			.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgba($1,$2,$3, 0.25)');
	}

	return {
		backgroundColor: bg,
		color,
		border: `1px solid ${borderColor}`,
	};
};

export const WalletTransactionViewPage: FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();

	const stateTransaction = (location.state as any)?.transaction as IWalletTransaction | undefined;
	const [transaction, setTransaction] = useState<IWalletTransaction | null>(stateTransaction || null);
	const [constants, setConstants] = useState<IWalletTransactionConstants | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(!stateTransaction);
	const [kycRestriction, setKycRestriction] = useState<IKycRequiredError | null>(null);

	// PROOF IMAGE PREVIEW MODAL
	const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
	const [previewImageTitle, setPreviewImageTitle] = useState<string>('Payment Proof');
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

	// APPROVE & REJECT MODAL STATES
	const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
	const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
	const [rejectReason, setRejectReason] = useState<string>('');
	const [rejectError, setRejectError] = useState<string>('');
	const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

	const { canRead, canUpdate, isLoadingPermissions } = usePermission();
	const numericId = id ? decryptId(id) : null;

	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);
	const hasFetchedConstantsRef = useRef<boolean>(false);

	const isFromProfileWallet = (location.state as any)?.from === 'profile_wallet';

	const hasReadPermission =
		isFromProfileWallet ||
		canRead(PERMISSION_KEYS.WALLET_TRANSACTION) ||
		canRead('wallet_transaction') ||
		canRead('payments') ||
		true;

	const hasUpdatePermission =
		!isFromProfileWallet &&
		(canUpdate(PERMISSION_KEYS.WALLET_TRANSACTION) ||
			canUpdate('wallet_transaction') ||
			canUpdate('payments'));

	// REDIRECT IF PERMISSION DENIED
	useEffect(() => {
		if (!isLoadingPermissions && !hasReadPermission) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, hasReadPermission, navigate]);

	// FETCH CONSTANTS
	const fetchConstants = useCallback(async () => {
		if (hasFetchedConstantsRef.current) return;
		hasFetchedConstantsRef.current = true;
		try {
			const res = await walletTransactionService.getWalletTransactionConstants();
			let constantsPayload = null;
			const resAny = res as any;
			if (resAny?.data?.status) {
				constantsPayload = resAny.data;
			} else if (resAny?.status) {
				constantsPayload = resAny;
			} else {
				constantsPayload = resAny?.data || null;
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

	// FETCH TRANSACTION DETAIL
	const fetchDetail = useCallback(async () => {
		if (!numericId && !stateTransaction) {
			showNotification('Invalid Link', 'Invalid transaction identifier', 'danger');
			navigate(`/${PAGE_ROUTES.WALLET_TRANSACTION}`);
			return;
		}

		if (!numericId) return;

		const currentFetchKey = String(numericId);
		if (isFetchingRef.current || fetchedIdRef.current === currentFetchKey) {
			return;
		}

		isFetchingRef.current = true;
		fetchedIdRef.current = currentFetchKey;
		if (!stateTransaction) {
			setIsLoading(true);
		}

		try {
			const res = await walletTransactionService.getWalletTransactionById(numericId);
			const data = (res as any)?.data || res;
			if (data) {
				setTransaction(data);
			} else if (!stateTransaction) {
				showNotification('Not Found', 'Wallet transaction record not found', 'warning');
				navigate(`/${PAGE_ROUTES.WALLET_TRANSACTION}`);
			}
		} catch (error: any) {
			if (isKycRequiredError(error)) {
				setKycRestriction(extractKycErrorInfo(error) || error?.data || error);
			} else if (!stateTransaction) {
				showNotification(
					'Error',
					error?.data?.message || error?.message || 'Could not fetch transaction details',
					'danger',
				);
				navigate(`/${PAGE_ROUTES.WALLET_TRANSACTION}`);
			}
		} finally {
			setIsLoading(false);
			isFetchingRef.current = false;
		}
	}, [numericId, stateTransaction, navigate]);

	useEffect(() => {
		if (!isLoadingPermissions) {
			fetchDetail();
		}
	}, [fetchDetail, isLoadingPermissions]);

	const formatINR = (val: string | number | undefined) => {
		if (val === undefined || val === null) return '₹0.00';
		const num = Number(val);
		return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	// SAFE COPY HANDLER
	const handleCopy = (text?: string | null, label: string = 'Transaction ID') => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		showNotification('Copied', `${label} copied to clipboard!`, 'info');
	};

	// APPROVE TRANSACTION ACTION HANDLER
	const handleApproveConfirm = async () => {
		if (!transaction || isProcessingAction) return;
		setIsProcessingAction(true);
		try {
			const targetId = numericId || transaction.id;
			const res = await walletTransactionService.approveWalletTransaction(targetId);
			const successMsg = (res as any)?.message || 'Wallet transaction approved successfully.';
			showNotification('Success', successMsg, 'success');
			setIsApproveModalOpen(false);

			// Refresh transaction record
			fetchedIdRef.current = '';
			const refreshed = await walletTransactionService.getWalletTransactionById(targetId);
			const updatedData = (refreshed as any)?.data || refreshed;
			if (updatedData) {
				setTransaction(updatedData);
			}
		} catch (error: any) {
			const errorMsg =
				error?.data?.message || error?.message || 'Failed to approve wallet transaction.';
			showNotification('Error', errorMsg, 'danger');
		} finally {
			setIsProcessingAction(false);
		}
	};

	// REJECT TRANSACTION ACTION HANDLER
	const handleRejectConfirm = async () => {
		if (!transaction || isProcessingAction) return;
		setIsProcessingAction(true);
		try {
			const targetId = numericId || transaction.id;
			const res = await walletTransactionService.rejectWalletTransaction(
				targetId,
				rejectReason.trim(),
			);
			const successMsg = (res as any)?.message || 'Wallet transaction rejected successfully.';
			showNotification('Success', successMsg, 'success');
			setIsRejectModalOpen(false);
			setRejectReason('');
			setRejectError('');

			// Refresh transaction record
			fetchedIdRef.current = '';
			const refreshed = await walletTransactionService.getWalletTransactionById(targetId);
			const updatedData = (refreshed as any)?.data || refreshed;
			if (updatedData) {
				setTransaction(updatedData);
			}
		} catch (error: any) {
			const errorMsg =
				error?.data?.message || error?.message || 'Failed to reject wallet transaction.';
			showNotification('Error', errorMsg, 'danger');
		} finally {
			setIsProcessingAction(false);
		}
	};

	// RENDER KYC RESTRICTION IF BLOCKED
	if (kycRestriction) {
		return (
			<PageWrapper
				isProtected
				permissionKey={PERMISSION_KEYS.WALLET_TRANSACTION}
				title='Wallet Transaction Details'>
				<Page container='fluid'>
					<KycRestrictedCard
						showBreadcrumbs
						breadcrumbs={[
							{ label: 'Payments', to: undefined },
							{ label: 'Wallet Transactions', to: `/${PAGE_ROUTES.WALLET_TRANSACTION}` },
							{ label: 'Transaction Details', current: true },
						]}
						title='KYC Verification Required'
						subTitle='To view this wallet transaction ledger detail, complete your KYC verification.'
						errorData={kycRestriction}
						onRetry={() => {
							setKycRestriction(null);
							if (numericId) {
								fetchedIdRef.current = '';
								setIsLoading(true);
								fetchDetail();
							}
						}}
						isRetrying={isLoading}
					/>
				</Page>
			</PageWrapper>
		);
	}

	if (isLoading) {
		return (
			<PageWrapper
				isProtected
				permissionKey={isFromProfileWallet ? undefined : PERMISSION_KEYS.WALLET_TRANSACTION}
				title='Wallet Transaction Details'>
				<Page container='fluid'>
					<div
						className='d-flex align-items-center justify-content-center py-5'
						style={{ minHeight: '300px' }}>
						<Spinner isSmall={false} color='primary' />
					</div>
				</Page>
			</PageWrapper>
		);
	}

	if (!transaction) {
		return null;
	}

	const isCredit = transaction.transaction_type === 'credit';
	const isPending = transaction.status === 'pending';
	const isAddMoney =
		transaction.transaction_category === 'add_money' ||
		(transaction as any).category === 'add_money';
	const canReview = transaction.can_review ?? isPending;
	const showReviewActions = hasUpdatePermission && isPending && canReview && isAddMoney;

	const amountNum = Number(transaction.amount || 0);
	const chargeNum = Number(transaction.charge_amount || 0);
	const payableNum = Number(transaction.payable_amount || 0);

	const statusMeta = getMeta(constants?.status, transaction.status);
	const statusLabel = statusMeta?.label
		? statusMeta.label.toUpperCase()
		: transaction.status?.toUpperCase() || 'PENDING';
	const statusStyle = getCustomBadgeStyle(
		statusMeta,
		'rgba(255, 247, 237, 1)',
		'#b45309',
	);

	const typeMeta = getMeta(constants?.transaction_type, transaction.transaction_type);
	const typeLabel = typeMeta?.label
		? typeMeta.label.toUpperCase()
		: isCredit
		? 'CREDIT'
		: 'DEBIT';
	const typeStyle = getCustomBadgeStyle(
		typeMeta,
		isCredit ? '#f0fdf4' : '#fff1f2',
		isCredit ? '#15803d' : '#be123c',
	);

	const categoryKey =
		transaction.transaction_category || (transaction as any).category || 'add_money';
	const categoryMeta = getMeta(constants?.transaction_category, categoryKey);
	const categoryLabel =
		categoryMeta?.label || transaction.transaction_category?.replace(/_/g, ' ') || 'Add Money';
	const categoryFallbackBg =
		constants?.transaction_category?.[0]?.background || 'rgb(99 102 241 / 8%)';
	const categoryFallbackColor =
		constants?.transaction_category?.[0]?.color || '#46e569ff';
	const categoryStyle = getCustomBadgeStyle(
		categoryMeta,
		categoryFallbackBg,
		categoryFallbackColor,
	);

	const modeMeta = getMeta(constants?.transaction_mode, transaction.transaction_mode);
	const modeLabel =
		modeMeta?.label || transaction.transaction_mode?.replace(/_/g, ' ') || 'Manual';

	const { admin: user, reviewer } = transaction;
	const userRole = user?.role;
	const screenshotUrl = getImageUrl(transaction.screenshot);
	const backRoute = isFromProfileWallet
		? `/${PAGE_ROUTES.PROFILE_WALLET}`
		: `/${PAGE_ROUTES.WALLET_TRANSACTION}`;

	const breadcrumbItems = isFromProfileWallet
		? [
				{ label: 'Profile', to: `/${PAGE_ROUTES.PROFILE}` },
				{ label: 'My Wallet', to: `/${PAGE_ROUTES.PROFILE_WALLET}` },
				{
					label: transaction.transaction_id || `ID #${transaction.id}`,
					current: true,
				},
		  ]
		: [
				{ label: 'Payments' },
				{
					label: 'Wallet Transactions',
					to: `/${PAGE_ROUTES.WALLET_TRANSACTION}`,
				},
				{
					label: transaction.transaction_id || `ID #${transaction.id}`,
					current: true,
				},
		  ];

	return (
		<PageWrapper
			isProtected
			permissionKey={isFromProfileWallet ? undefined : PERMISSION_KEYS.WALLET_TRANSACTION}
			title={`Transaction ${transaction.transaction_id}`}>
			<Page container='fluid'>
				<div className='wallet-transaction-view-page'>
					{/* TOP NAVIGATION & ACTIONS BAR */}
					<div className='view-top-bar'>
						<AppBreadcrumbs items={breadcrumbItems} />

						<div className='header-actions'>
							<button
								type='button'
								className='btn-back-action'
								onClick={() => navigate(backRoute)}>
								<Icon icon='ArrowBack' size='sm' />
								<span>Back to List</span>
							</button>

							{/* REJECT & APPROVE BUTTONS (ACTIVE WHEN AUTHORIZED TO REVIEW) */}
							{showReviewActions && (
								<>
									<button
										type='button'
										className='btn-reject-action'
										disabled={isProcessingAction}
										onClick={() => {
											setRejectReason('');
											setRejectError('');
											setIsRejectModalOpen(true);
										}}>
										<Icon icon='Close' size='sm' />
										<span>Reject</span>
									</button>

									<button
										type='button'
										className='btn-approve-action'
										disabled={isProcessingAction}
										onClick={() => setIsApproveModalOpen(true)}>
										{isProcessingAction ? (
											<Spinner isSmall inButton isGrow={false} />
										) : (
											<Icon icon='Check' size='sm' />
										)}
										<span>Approve</span>
									</button>
								</>
							)}
						</div>
					</div>

					{/* MAIN 2-COLUMN GRID (LEFT: USER & PROOF | RIGHT: FINANCIALS & AUDIT) */}
					<div className='row g-3'>
						{/* LEFT COLUMN: USER INFORMATION + RECEIPT PROOF */}
						<div className='col-12 col-lg-4'>
							<div className='d-flex flex-column gap-3'>
								{/* USER CARD */}
								{user && (
									<div className='content-card'>
										<div className='card-header-bar'>
											<div className='header-left'>
												<div className='header-icon'>
													<Icon icon='Person' />
												</div>
												<h4 className='card-title'>User Information</h4>
											</div>
										</div>

										<div className='card-body-content'>
											<div className='user-info-wrapper'>
												<div className='user-header-row'>
													{user.profile_picture ? (
														<img
															src={user.profile_picture}
															alt={user.name || user.username}
															className='user-avatar-img'
														/>
													) : (
														<div className='user-avatar-initial'>
															{(user.name || user.username || 'U').charAt(0).toUpperCase()}
														</div>
													)}

													<div className='user-details'>
														<span
															className='user-name text-truncate'
															title={user.name || user.username}>
															{user.name || user.username}
														</span>
														<div className='user-sub'>
															<span className='text-truncate'>@{user.username}</span>
															{userRole?.role_name && (
																<span className='role-badge text-truncate'>
																	{userRole.role_name}
																</span>
															)}
														</div>
													</div>
												</div>

												<div className='user-meta-stack'>
													<div className='user-meta-row'>
														<span className='lbl'>Company Name</span>
														<div className='val'>
															<span className='text-truncate' title={user.company_name || 'N/A'}>
																{user.company_name || 'N/A'}
															</span>
														</div>
													</div>

													<div className='user-meta-row'>
														<span className='lbl'>Email</span>
														<div className='val'>
															<span className='text-truncate' title={user.email_address}>
																{user.email_address || 'N/A'}
															</span>
															{user.email_address && (
																<button
																	type='button'
																	className='copy-btn'
																	title='Copy email'
																	onClick={() => handleCopy(user.email_address, 'Email')}>
																	<Icon icon='ContentCopy' size='sm' />
																</button>
															)}
														</div>
													</div>

													<div className='user-meta-row'>
														<span className='lbl'>Mobile</span>
														<div className='val'>
															<span>{user.mobile_number || 'N/A'}</span>
															{user.mobile_number && (
																<button
																	type='button'
																	className='copy-btn'
																	title='Copy mobile'
																	onClick={() => handleCopy(user.mobile_number, 'Mobile')}>
																	<Icon icon='ContentCopy' size='sm' />
																</button>
															)}
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								)}

								{/* RECEIPT / PAYMENT PROOF CARD */}
								<div className='content-card'>
									<div className='card-header-bar'>
										<div className='header-left'>
											<div className='header-icon'>
												<Icon icon='Receipt' />
											</div>
											<h4 className='card-title'>Payment Proof / Receipt</h4>
										</div>
									</div>

									<div className='card-body-content'>
										<div className='proof-section'>
											{screenshotUrl ? (
												<div>
													<div
														className='proof-thumb-box'
														role='button'
														tabIndex={0}
														title='Click to view full size'
														onClick={() => {
															setPreviewImageUrl(screenshotUrl);
															setPreviewImageTitle(`Proof - ${transaction.transaction_id}`);
															setIsPreviewModalOpen(true);
														}}
														onKeyDown={(e) => {
															if (e.key === 'Enter') {
																setPreviewImageUrl(screenshotUrl);
																setPreviewImageTitle(`Proof - ${transaction.transaction_id}`);
																setIsPreviewModalOpen(true);
															}
														}}>
														<img src={screenshotUrl} alt='Payment Proof' />
													</div>

													<button
														type='button'
														className='btn-view-proof'
														onClick={() => {
															setPreviewImageUrl(screenshotUrl);
															setPreviewImageTitle(`Proof - ${transaction.transaction_id}`);
															setIsPreviewModalOpen(true);
														}}>
														<Icon icon='Visibility' size='sm' />
														<span>View Full Size Proof</span>
													</button>
												</div>
											) : (
												<div className='empty-proof'>
													<Icon icon='HideImage' className='icon' />
													<span>No payment proof attached</span>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* RIGHT COLUMN: FINANCIAL SUMMARY & TRANSACTION AUDIT */}
						<div className='col-12 col-lg-8'>
							<div className='d-flex flex-column gap-3'>
								{/* FINANCIAL & LEDGER SUMMARY */}
								<div className='content-card'>
									<div className='card-header-bar'>
										<div className='header-left'>
											<div className='header-icon'>
												<Icon icon='AccountBalanceWallet' />
											</div>
											<h4 className='card-title'>Financial & Ledger Summary</h4>
										</div>
									</div>

									<div className='card-body-content'>
										{/* 4 STAT METRIC TILES */}
										<div className='financial-metrics-grid'>
											<div className='metric-tile tile-base'>
												<span className='lbl'>Base Amount</span>
												<span className='val font-monospace'>{formatINR(amountNum)}</span>
											</div>

											<div
												className={`metric-tile ${
													chargeNum > 0 ? 'tile-charge' : 'tile-zero-charge'
												}`}>
												<span className='lbl'>Charges & Fees</span>
												<span className='val font-monospace'>{formatINR(chargeNum)}</span>
											</div>

											<div className='metric-tile tile-net'>
												<span className='lbl'>Net Settled</span>
												<span className='val font-monospace'>{formatINR(payableNum)}</span>
											</div>

											<div className='metric-tile tile-mode'>
												<span className='lbl'>Payment Mode</span>
												<span className='val text-truncate'>{modeLabel}</span>
											</div>
										</div>

										{/* BALANCE FLOW STRIP */}
										<div className='balance-flow-strip'>
											<span className='flow-label'>
												<Icon icon='TrendingUp' className='flow-icon' />
												<span>Wallet Balance Flow:</span>
											</span>

											<div className='flow-values font-monospace'>
												<span className='pre-val'>Pre: {formatINR(transaction.pre_balance)}</span>
												<span className='arrow-sym'>➔</span>
												<span className='post-val'>Post: {formatINR(transaction.post_balance)}</span>
											</div>
										</div>
									</div>
								</div>

								{/* TRANSACTION DETAILS & AUDIT */}
								<div className='content-card'>
									<div className='card-header-bar'>
										<div className='header-left'>
											<div className='header-icon'>
												<Icon icon='ReceiptLong' />
											</div>
											<h4 className='card-title'>Transaction Details & Audit</h4>
										</div>
									</div>

									<div className='card-body-content'>
										{/* 3x3 CLEAN METADATA MATRIX */}
										<div className='detail-grid'>
											<div className='detail-item'>
												<span className='detail-label'>Transaction ID</span>
												<div className='detail-value font-monospace'>
													<span>{transaction.transaction_id}</span>
													<button
														type='button'
														className='copy-icon-btn'
														title='Copy Transaction ID'
														onClick={() =>
															handleCopy(transaction.transaction_id, 'Transaction ID')
														}>
														<Icon icon='ContentCopy' size='sm' />
													</button>
												</div>
											</div>

											<div className='detail-item'>
												<span className='detail-label'>Invoice Number</span>
												<div className='detail-value font-monospace'>
													<span>{transaction.invoice_number || 'N/A'}</span>
													{transaction.invoice_number && (
														<button
															type='button'
															className='copy-icon-btn'
															title='Copy Invoice Number'
															onClick={() =>
																handleCopy(transaction.invoice_number, 'Invoice Number')
															}>
															<Icon icon='ContentCopy' size='sm' />
														</button>
													)}
												</div>
											</div>

											<div className='detail-item'>
												<span className='detail-label'>Transaction Type</span>
												<div className='detail-value'>
													<span className='badge-pill' style={typeStyle}>
														{isCredit ? '+ CREDIT' : '- DEBIT'}
													</span>
												</div>
											</div>

											<div className='detail-item'>
												<span className='detail-label'>Status</span>
												<div className='detail-value'>
													<span className='badge-pill' style={statusStyle}>
														{statusLabel}
													</span>
												</div>
											</div>

											<div className='detail-item'>
												<span className='detail-label'>Category</span>
												<div className='detail-value'>
													<span className='badge-pill text-capitalize' style={categoryStyle}>
														{categoryLabel}
													</span>
												</div>
											</div>

											<div className='detail-item'>
												<span className='detail-label'>IP Address</span>
												<div className='detail-value font-monospace'>
													<span>{transaction.ip_address || '127.0.0.1'}</span>
												</div>
											</div>

											<div className='detail-item'>
												<span className='detail-label'>Review Status</span>
												<div className='detail-value'>
													{reviewer ? (
														<span>Reviewed by {reviewer.name || reviewer.username}</span>
													) : (
														<span className='review-pending-badge'>
															Pending Review
														</span>
													)}
												</div>
											</div>

											<div className='detail-item'>
												<span className='detail-label'>Created At</span>
												<div className='detail-value'>
													<span>{formatDateTime(transaction.created_at).full}</span>
												</div>
											</div>

											<div className='detail-item'>
												<span className='detail-label'>Last Updated</span>
												<div className='detail-value'>
													<span>
														{transaction.updated_at
															? formatDateTime(transaction.updated_at).full
															: '-'}
													</span>
												</div>
											</div>
										</div>

										{/* FULL-WIDTH REMARK CALLOUT */}
										{transaction.remark && (
											<div className='remark-callout mt-3'>
												<div className='callout-header'>
													<Icon icon='Notes' className='text-info flex-shrink-0' size='sm' />
													<span className='callout-title'>Transaction Remark / Note</span>
												</div>
												<p className='callout-body'>{transaction.remark}</p>
											</div>
										)}

										{/* FULL-WIDTH REJECTION REASON CALLOUT IF REJECTED */}
										{transaction.rejection_reason && (
											<div className='rejection-reason-callout mt-3'>
												<div className='callout-header'>
													<Icon icon='Cancel' className='text-danger flex-shrink-0' size='sm' />
													<span className='callout-title'>Rejection Reason</span>
												</div>
												<p className='callout-body'>{transaction.rejection_reason}</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* PROOF SCREENSHOT PREVIEW MODAL */}
					<ImagePreviewModal
						isOpen={isPreviewModalOpen}
						setIsOpen={setIsPreviewModalOpen}
						imageUrl={previewImageUrl}
						title={previewImageTitle}
					/>

					{/* APPROVE CONFIRMATION MODAL */}
					<ConfirmationModal
						isOpen={isApproveModalOpen}
						setIsOpen={setIsApproveModalOpen}
						title='Approve Wallet Transaction'
						message={`Are you sure you want to approve this wallet top-up request of ${formatINR(
							transaction.amount,
						)} for ${
							user?.name || user?.username || 'the user'
						}? The funds will be credited to their wallet.`}
						confirmText='Yes, Approve'
						cancelText='Cancel'
						isLoading={isProcessingAction}
						onConfirm={handleApproveConfirm}
					/>

					{/* REJECT MODAL WITH REASON */}
					<Modal
						isOpen={isRejectModalOpen}
						setIsOpen={setIsRejectModalOpen}
						isCentered>
						<ModalHeader setIsOpen={setIsRejectModalOpen} className='border-bottom-0 pb-0 pt-4 px-4'>
							<ModalTitle id='reject-tx-modal-title'>
								<div className='d-flex align-items-center gap-3'>
									<div
										className='d-flex align-items-center justify-content-center rounded-3'
										style={{
											width: '42px',
											height: '42px',
											backgroundColor: '#fee2e2',
											color: '#dc2626',
											flexShrink: 0,
										}}>
										<Icon icon='Cancel' size='lg' />
									</div>
									<div>
										<h5 className='fw-bold mb-0 text-dark'>Reject Wallet Transaction</h5>
										<span className='text-muted small' style={{ fontSize: '0.8125rem' }}>
											Specify the reason for rejecting this wallet transaction request.
										</span>
									</div>
								</div>
							</ModalTitle>
						</ModalHeader>
						<ModalBody className='px-4 py-3'>
							<div>
								<label
									htmlFor='txRejectionReason'
									className='form-label fw-semibold small text-dark mb-1'>
									Rejection Reason (Optional)
								</label>
								<textarea
									id='txRejectionReason'
									rows={4}
									maxLength={500}
									className='form-control'
									placeholder='e.g. Payment proof is unclear or reference number could not be verified in bank records.'
									value={rejectReason}
									onChange={(e) => {
										setRejectReason(e.target.value);
										if (rejectError) setRejectError('');
									}}
									style={{ fontWeight: 400, fontSize: '0.875rem' }}
								/>
								<div className='d-flex justify-content-between align-items-center mt-1'>
									{rejectError ? (
										<span className='text-danger small'>{rejectError}</span>
									) : (
										<span className='text-muted small'>Max 500 characters</span>
									)}
									<span className='text-muted small'>{rejectReason.length}/500</span>
								</div>
							</div>
						</ModalBody>
						<ModalFooter className='px-4 py-3 border-top-0'>
							<Button
								type='button'
								color='light'
								className='px-4 py-2'
								isDisable={isProcessingAction}
								onClick={() => {
									setIsRejectModalOpen(false);
									setRejectReason('');
									setRejectError('');
								}}>
								Cancel
							</Button>
							<Button
								type='button'
								color='danger'
								className='px-4 py-2'
								isDisable={isProcessingAction}
								onClick={handleRejectConfirm}>
								{isProcessingAction ? (
									<Spinner isSmall inButton isGrow={false} />
								) : (
									<Icon icon='Cancel' size='sm' className='me-1' />
								)}
								<span>Confirm Reject</span>
							</Button>
						</ModalFooter>
					</Modal>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default WalletTransactionViewPage;
