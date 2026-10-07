/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props */
import React, { FC, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../components/icon/Icon';
import showNotification from '../../../../../components/extras/showNotification';
import { isKycRequiredError } from '../../../../../components/common/KycRestrictedCard';
import { PAGE_ROUTES } from '../../../../../constants/pageRoutes';
import walletTransactionService from '../service/walletTransactionService';
import { IPaymentMethod, IPaymentMethodBankDetail, IPaymentMethodsData, TAddMoneyType } from '../type/wallet-transaction.type';
import { getAccountTypeLabel } from '../../bank-detail/type/bank-detail-type';
import { getImageUrl } from '../../../../../helpers/helpers';
import '../css/WalletTransactionPage.scss';

interface IAddMoneyModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	onSuccess: () => void;
	adminId?: number | string;
}

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000, 25000];

// Helper to render payment method icon using common getImageUrl
const PaymentMethodIcon: FC<{ icon?: string | null; name: string; isCustom?: boolean }> = ({
	icon,
	name,
	isCustom,
}) => {
	const [hasError, setHasError] = useState(false);
	const fullUrl = icon ? getImageUrl(icon) : null;

	if (fullUrl && !hasError) {
		return (
			<img
				src={fullUrl}
				alt={name}
				onError={() => setHasError(true)}
			/>
		);
	}

	return <Icon icon={isCustom ? 'AccountBalance' : 'Payment'} />;
};

export const AddMoneyModal: FC<IAddMoneyModalProps> = ({
	isOpen,
	setIsOpen,
	onSuccess,
	adminId,
}) => {
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);

	// MODAL STEP: 'SELECT_METHOD' or 'FORM'
	const [modalStep, setModalStep] = useState<'SELECT_METHOD' | 'FORM'>('SELECT_METHOD');

	// PAYMENT METHODS STATE
	const [isLoadingMethods, setIsLoadingMethods] = useState<boolean>(true);
	const [paymentMethodsData, setPaymentMethodsData] = useState<IPaymentMethodsData | null>(null);
	const [selectedMethod, setSelectedMethod] = useState<IPaymentMethod | null>(null);
	const [selectedBankIndex, setSelectedBankIndex] = useState<number>(0);

	// FORM STATE
	const [amount, setAmount] = useState<string>('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [kycErrorMsg, setKycErrorMsg] = useState<string | null>(null);

	// COPIED FEEDBACK STATE
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// FETCH PAYMENT METHODS
	const fetchPaymentMethods = useCallback(async () => {
		setIsLoadingMethods(true);
		try {
			const res = await walletTransactionService.getPaymentMethods(adminId);
			const data = (res as any)?.data?.data || (res as any)?.data || null;
			if (data) {
				setPaymentMethodsData(data);

				const methods: IPaymentMethod[] = data.payment_methods || [];
				const defaultMethod =
					data.default_method ||
					methods.find((m) => m.is_primary) ||
					methods[0] ||
					null;

				setSelectedMethod(defaultMethod);
				setSelectedBankIndex(0);
			}
		} catch (err: any) {
			showNotification(
				'Error',
				err?.message || 'Failed to load active payment methods.',
				'danger',
			);
		} finally {
			setIsLoadingMethods(false);
		}
	}, [adminId]);

	useEffect(() => {
		if (isOpen) {
			setModalStep('SELECT_METHOD');
			fetchPaymentMethods();
		}
	}, [isOpen, fetchPaymentMethods]);

	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
		setModalStep('SELECT_METHOD');
		setAmount('');
		setSelectedFile(null);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			setPreviewUrl(null);
		}
		setKycErrorMsg(null);
		setCopiedField(null);
	};

	const handleSelectMethod = (method: IPaymentMethod) => {
		setSelectedMethod(method);
		setModalStep('FORM');
	};

	const handleBackToMethods = () => {
		setModalStep('SELECT_METHOD');
		setKycErrorMsg(null);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
			if (!validTypes.includes(file.type)) {
				showNotification(
					'Invalid File Format',
					'Please upload a valid JPG, PNG, or WEBP receipt image.',
					'warning',
				);
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				showNotification(
					'File Too Large',
					'Payment proof image size must be under 5MB.',
					'warning',
				);
				return;
			}

			setSelectedFile(file);
			const objectUrl = URL.createObjectURL(file);
			setPreviewUrl(objectUrl);
		}
	};

	const handleRemoveFile = () => {
		setSelectedFile(null);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			setPreviewUrl(null);
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handlePresetClick = (presetAmount: number) => {
		setAmount(String(presetAmount));
	};

	const handleCopy = (textToCopy: string, fieldKey: string) => {
		if (!textToCopy) return;
		navigator.clipboard.writeText(textToCopy);
		setCopiedField(fieldKey);
		setTimeout(() => {
			setCopiedField(null);
		}, 2000);
	};

	const isCustomMethod =
		!selectedMethod ||
		selectedMethod.is_custom ||
		selectedMethod.type === 'custom' ||
		paymentMethodsData?.is_using_custom;

	const defaultBankFallback: IPaymentMethodBankDetail[] = [
		{
			id: 1,
			bank_name: 'HDFC Bank',
			account_number: '50200012345678',
			ifsc_code: 'HDFC0001234',
			account_holder_name: 'Nexora Technologies Pvt Ltd',
			account_type: 'savings',
			branch_name: 'Navrangpura',
			is_primary: true,
		},
		{
			id: 2,
			bank_name: 'State Bank of India',
			account_number: '38192000192831',
			ifsc_code: 'SBIN0004512',
			account_holder_name: 'Nexora Technologies Pvt Ltd',
			account_type: 'current',
			branch_name: 'Main Branch',
			is_primary: false,
		},
	];

	let activeBankList: IPaymentMethodBankDetail[] = defaultBankFallback;
	if (selectedMethod?.bank_details && selectedMethod.bank_details.length > 0) {
		activeBankList = selectedMethod.bank_details;
	} else if (paymentMethodsData?.bank_details && paymentMethodsData.bank_details.length > 0) {
		activeBankList = paymentMethodsData.bank_details;
	}

	const currentBank = activeBankList[selectedBankIndex] || activeBankList[0] || defaultBankFallback[0];

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const numAmount = Number(amount);

		if (!numAmount || numAmount <= 0) {
			showNotification('Validation Error', 'Please enter a valid deposit amount.', 'warning');
			return;
		}

		if (isCustomMethod && !selectedFile) {
			showNotification(
				'Proof Required',
				'Please upload your payment receipt / proof image.',
				'warning',
			);
			return;
		}

		setIsSubmitting(true);
		setKycErrorMsg(null);

		const requestType: TAddMoneyType = isCustomMethod
			? 'custom'
			: 'merchant_payment_gateway';

		try {
			await walletTransactionService.addMoneyRequest({
				amount: numAmount,
				screenshot: selectedFile as File,
				type: requestType,
			});

			showNotification(
				'Deposit Submitted',
				`Wallet deposit request for ₹${numAmount.toLocaleString('en-IN', {
					minimumFractionDigits: 2,
				})} has been submitted for verification.`,
				'success',
			);
			onSuccess();
			handleClose();
		} catch (error: any) {
			if (isKycRequiredError(error)) {
				const msg =
					error?.data?.message ||
					error?.message ||
					'KYC verification required before requesting wallet top-up.';
				setKycErrorMsg(msg);
				showNotification('KYC Required', msg, 'warning');
			} else {
				showNotification(
					'Deposit Failed',
					error?.data?.message ||
						error?.message ||
						'Failed to submit wallet top-up request. Please try again.',
					'danger',
				);
			}
		} finally {
			setIsSubmitting(false);
		}
	};	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={handleClose}
			size='lg'
			isCentered
			isScrollable
			className='fintech-light-modal'
			isStaticBackdrop={isSubmitting}>
			{modalStep === 'SELECT_METHOD' ? (
				<>
					<ModalHeader setIsOpen={handleClose} className='fintech-modal-header'>
						<ModalTitle id='add-money-modal-title'>
							<div className='d-flex align-items-center gap-3'>
								<div className='fintech-header-icon-box'>
									<Icon icon='AccountBalanceWallet' />
								</div>
								<div>
									<h4 className='fintech-modal-title'>Add Money / Top-Up</h4>
									<p className='fintech-modal-subtitle'>
										Select your preferred payment method to proceed
									</p>
								</div>
							</div>
						</ModalTitle>
					</ModalHeader>

					<ModalBody className='fintech-modal-body'>
						<div className='d-flex flex-column gap-3'>
							{/* KYC WARNING IF APPLICABLE */}
							{kycErrorMsg && (
								<div className='fintech-kyc-alert'>
									<div className='d-flex align-items-center gap-2'>
										<Icon icon='Warning' className='text-warning' size='lg' />
										<span className='alert-text'>{kycErrorMsg}</span>
									</div>
									<button
										type='button'
										className='fintech-kyc-btn'
										onClick={() => {
											handleClose();
											navigate(`/${PAGE_ROUTES.KYC}`);
										}}>
										Complete KYC
									</button>
								</div>
							)}

							{/* LOADING SPINNER */}
							{isLoadingMethods ? (
								<div className='fintech-loading-container'>
									<Spinner isGrow={false} size='3rem' color='primary' />
									<div className='loading-text'>Loading available payment methods...</div>
								</div>
							) : (
								<div>
									<p className='fintech-section-caption'>
										Choose a deposit method to top up your wallet balance:
									</p>

									{/* PAYMENT METHOD CARDS */}
									<div className='d-flex flex-column gap-3'>
										{paymentMethodsData?.payment_methods &&
										paymentMethodsData.payment_methods.length > 0 ? (
											paymentMethodsData.payment_methods.map((method) => {
												const isCustom =
													method.is_custom || method.type === 'custom';
												return (
													<div
														key={method.id}
														role='button'
														tabIndex={0}
														className='fintech-payment-method-card'
														onClick={() => handleSelectMethod(method)}
														onKeyDown={(e) => {
															if (e.key === 'Enter' || e.key === ' ') {
																handleSelectMethod(method);
															}
														}}>
														<div className='method-left'>
															<div className='method-icon-wrap'>
																<PaymentMethodIcon
																	icon={method.icon}
																	name={method.name}
																	isCustom={isCustom}
																/>
															</div>
															<div className='method-info'>
																<div className='d-flex align-items-center gap-2'>
																	<span className='method-name'>
																		{method.name}
																	</span>
																	{method.is_primary && (
																		<span className='primary-pill'>
																			Primary
																		</span>
																	)}
																</div>
																<span className='method-description'>
																	{method.description ||
																		(isCustom
																			? 'Direct transfer via IMPS / NEFT / UPI & receipt upload'
																			: 'Automated top-up')}
																</span>
															</div>
														</div>

														<div className='d-flex align-items-center gap-3'>
															<span
																className={`tag-pill ${
																	isCustom ? 'tag-manual' : 'tag-instant'
																}`}>
																{isCustom
																	? 'Manual Verification'
																	: 'Instant Top-Up'}
															</span>
															<Icon
																icon='ChevronRight'
																className='chevron-icon'
															/>
														</div>
													</div>
												);
											})
										) : (
											<div className='text-center py-4 text-muted'>
												No payment methods configured.
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</ModalBody>

					<ModalFooter className='fintech-modal-footer'>
						<button
							type='button'
							className='fintech-btn-secondary'
							onClick={handleClose}>
							Cancel
						</button>
					</ModalFooter>
				</>
			) : (
				<>
					<ModalHeader setIsOpen={handleClose} className='fintech-modal-header'>
						<ModalTitle id='add-money-modal-title'>
							<div className='d-flex align-items-center gap-3'>
								<button
									type='button'
									className='fintech-back-btn'
									onClick={handleBackToMethods}
									disabled={isSubmitting}
									title='Back to Payment Methods'>
									<Icon icon='ArrowBack' />
								</button>
								<div>
									<h4 className='fintech-modal-title'>
										{selectedMethod?.name || 'Custom Payment / Bank Transfer'}
									</h4>
									<p className='fintech-modal-subtitle'>
										{isCustomMethod
											? 'Transfer funds to company bank account and submit deposit proof'
											: 'Instant automated wallet top-up via payment gateway'}
									</p>
								</div>
							</div>
						</ModalTitle>
					</ModalHeader>

					<ModalBody className='fintech-modal-body'>
						<form id='add-money-form' onSubmit={handleSubmit} className='d-flex flex-column gap-3'>
							{/* KYC RESTRICTION ALERT */}
							{kycErrorMsg && (
								<div className='fintech-kyc-alert'>
									<div className='d-flex align-items-center gap-2'>
										<Icon icon='Warning' className='text-warning' size='lg' />
										<span className='alert-text'>{kycErrorMsg}</span>
									</div>
									<button
										type='button'
										className='fintech-kyc-btn'
										onClick={() => {
											handleClose();
											navigate(`/${PAGE_ROUTES.KYC}`);
										}}>
										Complete KYC
									</button>
								</div>
							)}

							{/* 1. ENTER DEPOSIT AMOUNT SECTION */}
							<div className='fintech-card-section'>
								<label
									htmlFor='walletTopupAmountInput'
									className='fintech-field-label'>
									ENTER DEPOSIT AMOUNT (INR) <span className='text-danger'>*</span>
								</label>

								<div className='fintech-amount-input-box'>
									<span className='fintech-currency-symbol'>₹</span>
									<input
										id='walletTopupAmountInput'
										type='number'
										step='0.01'
										min='1'
										className='fintech-amount-input'
										placeholder='0.00'
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										onWheel={(e) => (e.target as HTMLElement).blur()}
										onKeyDown={(e) => {
											if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
												e.preventDefault();
											}
										}}
										required
									/>
								</div>

								{/* QUICK ADD PRESET PILLS */}
								<div className='fintech-quick-add-row'>
									<span className='quick-add-label'>Quick Add:</span>
									<div className='quick-add-chips'>
										{PRESET_AMOUNTS.map((preset) => {
											const isPresetActive = amount === String(preset);
											return (
												<button
													key={preset}
													type='button'
													className={`fintech-preset-pill ${
														isPresetActive ? 'active' : ''
													}`}
													onClick={() => handlePresetClick(preset)}>
													+{preset.toLocaleString('en-IN')}
												</button>
											);
										})}
									</div>
								</div>
							</div>

							{/* 2. COMPANY BANK ACCOUNT DETAILS SECTION (SINGLE UNIFIED CARD) */}
							{isCustomMethod && currentBank && (
								<div className='fintech-card-section'>
									<div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2'>
										<span className='fintech-field-label mb-0'>
											COMPANY BANK ACCOUNT DETAILS (TRANSFER TO)
										</span>

										{/* BANK SWITCHER PILLS (TOP RIGHT) */}
										{activeBankList.length > 1 && (
											<div className='fintech-bank-tabs'>
												{activeBankList.map((b, idx) => (
													<button
														key={b.id || idx}
														type='button'
														className={`fintech-bank-tab-btn ${
															selectedBankIndex === idx ? 'active' : ''
														}`}
														onClick={() => setSelectedBankIndex(idx)}>
														{b.bank_name}
													</button>
												))}
											</div>
										)}
									</div>

									{/* SINGLE UNIFIED BANK CARD */}
									<div className='fintech-bank-single-card'>
										{/* BANK HEADER ROW */}
										<div className='bank-header-row'>
											<div>
												<h5 className='bank-brand-title mb-0'>
													{currentBank.bank_name}
												</h5>
												{currentBank.branch_name && (
													<small className='text-muted'>
														Branch: {currentBank.branch_name}
													</small>
												)}
											</div>
											{currentBank.account_type && (
												<span className='fintech-account-type-badge'>
													{getAccountTypeLabel(currentBank.account_type).toUpperCase()}
												</span>
											)}
										</div>

										{/* BANK DETAILS 4-CELL GRID */}
										<div className='bank-details-grid'>
											{/* ACCOUNT NUMBER */}
											<div className='bank-detail-cell'>
												<div className='cell-info'>
													<span className='cell-label'>ACCOUNT NUMBER</span>
													<span className='cell-val font-mono'>
														{currentBank.account_number}
													</span>
												</div>
												<button
													type='button'
													className={`fintech-copy-btn ${
														copiedField === 'acc_num' ? 'copied' : ''
													}`}
													onClick={() =>
														handleCopy(
															currentBank.account_number,
															'acc_num',
														)
													}
													title='Copy Account Number'>
													<Icon
														icon={
															copiedField === 'acc_num'
																? 'Check'
																: 'ContentCopy'
														}
													/>
													<span>
														{copiedField === 'acc_num'
															? 'Copied'
															: 'Copy'}
													</span>
												</button>
											</div>

											{/* IFSC CODE */}
											<div className='bank-detail-cell'>
												<div className='cell-info'>
													<span className='cell-label'>IFSC CODE</span>
													<span className='cell-val font-mono'>
														{currentBank.ifsc_code}
													</span>
												</div>
												<button
													type='button'
													className={`fintech-copy-btn ${
														copiedField === 'ifsc' ? 'copied' : ''
													}`}
													onClick={() =>
														handleCopy(currentBank.ifsc_code, 'ifsc')
													}
													title='Copy IFSC Code'>
													<Icon
														icon={
															copiedField === 'ifsc'
																? 'Check'
																: 'ContentCopy'
														}
													/>
													<span>
														{copiedField === 'ifsc'
															? 'Copied'
															: 'Copy'}
													</span>
												</button>
											</div>

											{/* BENEFICIARY NAME */}
											<div className='bank-detail-cell'>
												<div className='cell-info'>
													<span className='cell-label'>BENEFICIARY NAME</span>
													<span
														className='cell-val text-truncate'
														title={currentBank.account_holder_name}>
														{currentBank.account_holder_name}
													</span>
												</div>
												<button
													type='button'
													className={`fintech-copy-btn ${
														copiedField === 'holder' ? 'copied' : ''
													}`}
													onClick={() =>
														handleCopy(
															currentBank.account_holder_name,
															'holder',
														)
													}
													title='Copy Beneficiary Name'>
													<Icon
														icon={
															copiedField === 'holder'
																? 'Check'
																: 'ContentCopy'
														}
													/>
													<span>
														{copiedField === 'holder'
															? 'Copied'
															: 'Copy'}
													</span>
												</button>
											</div>

											{/* BRANCH / BANK CODE */}
											<div className='bank-detail-cell'>
												<div className='cell-info'>
													<span className='cell-label'>BRANCH</span>
													<span className='cell-val text-capitalize'>
														{currentBank.branch_name || 'Main Branch'}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* 3. UPLOAD PAYMENT RECEIPT / PROOF SECTION */}
							{isCustomMethod && (
								<div className='fintech-card-section'>
									<label className='fintech-field-label'>
										UPLOAD PAYMENT RECEIPT / PROOF <span className='text-danger'>*</span>
									</label>

									<input
										type='file'
										ref={fileInputRef}
										accept='image/jpeg,image/png,image/webp,image/jpg'
										className='d-none'
										onChange={handleFileChange}
									/>

									{previewUrl ? (
										<div className='fintech-proof-preview'>
											<img
												src={previewUrl}
												alt='Payment Proof Preview'
												className='proof-thumbnail'
											/>
											<div className='proof-info'>
												<div className='proof-filename'>
													{selectedFile?.name}
												</div>
												<div className='proof-filesize'>
													{selectedFile
														? `${(selectedFile.size / 1024).toFixed(1)} KB`
														: ''}
												</div>
												<div className='proof-ready-tag'>
													<Icon icon='CheckCircle' /> Ready to submit
												</div>
											</div>
											<button
												type='button'
												className='fintech-remove-proof-btn'
												title='Remove attached proof'
												onClick={handleRemoveFile}>
												<Icon icon='Delete' />
											</button>
										</div>
									) : (
										<div
											role='button'
											tabIndex={0}
											className='fintech-upload-dropzone'
											onClick={() => fileInputRef.current?.click()}
											onKeyDown={(e) =>
												e.key === 'Enter' && fileInputRef.current?.click()
											}>
											<div className='upload-cloud-icon'>
												<svg
													width='48'
													height='48'
													viewBox='0 0 24 24'
													fill='none'
													stroke='currentColor'
													strokeWidth='1.6'
													strokeLinecap='round'
													strokeLinejoin='round'>
													<path d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' />
													<path d='m12 13-3-3 3-3' transform='rotate(90 12 10)' />
													<path d='M12 10v6' />
												</svg>
											</div>
											<div className='upload-main-text'>
												Upload Payment Receipt
											</div>
											<div className='upload-sub-text'>
												Click to browse or drag & drop JPG, PNG, WEBP (Max 5MB)
											</div>
										</div>
									)}
								</div>
							)}
						</form>
					</ModalBody>

					<ModalFooter className='fintech-modal-footer'>
						<button
							type='button'
							className='fintech-btn-secondary'
							onClick={handleBackToMethods}
							disabled={isSubmitting}>
							Cancel
						</button>
						<button
							type='submit'
							form='add-money-form'
							className='fintech-btn-submit'
							disabled={isSubmitting || isLoadingMethods}>
							{isSubmitting ? (
								<>
									<Spinner isSmall isGrow={false} />
									<span>Submitting Proof...</span>
								</>
							) : (
								<>
									<Icon icon='CheckCircle' />
									<span>
										{isCustomMethod
											? 'Submit Deposit Proof'
											: `Proceed to ${selectedMethod?.name || 'Gateway'}`}
									</span>
								</>
							)}
						</button>
					</ModalFooter>
				</>
			)}
		</Modal>
	);
};

AddMoneyModal.defaultProps = {
	adminId: undefined,
};

export default AddMoneyModal;

