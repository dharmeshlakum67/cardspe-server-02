/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import {
	IPaymentMode,
	PaymentModeStatusType,
	CreatePaymentModePayload,
	UpdatePaymentModePayload,
} from './type/payment-mode-type';
import constantService, { IConstantOption } from '../../../../services/constantService';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { decryptAccountInfo } from '../../../../helpers/cryptoUtils';
import paymentModeService from './service/paymentModeService';

interface IPaymentModeModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	paymentModeData?: IPaymentMode | null;
	onSubmit: (payload: CreatePaymentModePayload | UpdatePaymentModePayload) => Promise<void>;
	isSubmitting: boolean;
}

export const PaymentModeModal: FC<IPaymentModeModalProps> = ({
	isOpen,
	setIsOpen,
	paymentModeData,
	onSubmit,
	isSubmitting,
}) => {
	const isEdit = Boolean(paymentModeData);
	const [name, setName] = useState<string>('');
	const [code, setCode] = useState<string>('');
	const [isCodeTouched, setIsCodeTouched] = useState<boolean>(false);
	const [paymentAccountInfo, setPaymentAccountInfo] = useState<string>('');
	const [status, setStatus] = useState<PaymentModeStatusType>('active');
	const [showCredential, setShowCredential] = useState<boolean>(false);
	const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

	const { hasPermission } = usePermission();
	const canViewCredential =
		hasPermission(PERMISSION_KEYS.PAYMENT_MODE, 'view_credential') ||
		hasPermission('payment_mode', 'view_credential');

	// HELPER TO GENERATE CODE FROM NAME
	const generateCodeFromName = (input: string): string => {
		return input
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9\s_-]/g, '')
			.replace(/[\s-]+/g, '_')
			.replace(/_+/g, '_');
	};

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

	useEffect(() => {
		let isMounted = true;
		if (paymentModeData && isOpen) {
			// Populate immediately from list row
			setName(paymentModeData.name || '');
			setCode(paymentModeData.code || '');
			setIsCodeTouched(true);
			setShowCredential(false);
			setStatus(paymentModeData.status || 'active');

			const rawInfo = paymentModeData.payment_account_info || '';
			if (rawInfo) {
				decryptAccountInfo(rawInfo).then((decrypted) => {
					if (isMounted) {
						setPaymentAccountInfo(decrypted);
					}
				});
			} else {
				setPaymentAccountInfo('');
			}

			// Fetch fresh record from backend to avoid stale data
			if (paymentModeData.id) {
				setIsLoadingDetail(true);
				paymentModeService
					.getPaymentModeById(paymentModeData.id)
					.then((res) => {
						if (!isMounted) return;
						const fresh = res?.data;
						if (fresh) {
							setName(fresh.name || '');
							setCode(fresh.code || '');
							setStatus(fresh.status || 'active');
							const freshRawInfo = fresh.payment_account_info || '';
							if (freshRawInfo) {
								decryptAccountInfo(freshRawInfo).then((decrypted) => {
									if (isMounted) {
										setPaymentAccountInfo(decrypted);
									}
								});
							} else {
								setPaymentAccountInfo('');
							}
						}
					})
					.catch(() => {
						// Keep optimistic list data on error
					})
					.finally(() => {
						if (isMounted) {
							setIsLoadingDetail(false);
						}
					});
			}
		} else if (isOpen) {
			setName('');
			setCode('');
			setIsCodeTouched(false);
			setShowCredential(true);
			setPaymentAccountInfo('');
			setStatus('active');
			setIsLoadingDetail(false);
		}

		return () => {
			isMounted = false;
		};
	}, [paymentModeData, isOpen]);

	// HANDLE NAME CHANGE WITH AUTO-FILL CODE
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newName = e.target.value;
		setName(newName);

		// If in create mode and user hasn't manually altered code, auto-fill code
		if (!isEdit && !isCodeTouched) {
			setCode(generateCodeFromName(newName));
		}
	};

	// HANDLE CODE REGENERATION
	const handleRegenerateCode = () => {
		const newCode = generateCodeFromName(name);
		setCode(newCode);
		setIsCodeTouched(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			showNotification('Validation Error', 'Payment mode name is required', 'warning');
			return;
		}

		if (!code.trim()) {
			showNotification('Validation Error', 'Payment mode code is required', 'warning');
			return;
		}

		let accountInfoToSubmit: string | null = paymentAccountInfo.trim() || null;
		if (isEdit && !canViewCredential) {
			// preserve existing value if user cannot view/edit credentials
			accountInfoToSubmit = (paymentModeData?.payment_account_info as string) || null;
		}

		await onSubmit({
			name: name.trim(),
			code: code.trim().toUpperCase(),
			payment_account_info: accountInfoToSubmit,
			status,
		});
	};

	// COMPUTE DISPLAY VALUE AND HELPER TEXT (AVOID NESTED TERNARY FOR ESLINT)
	let accountInfoDisplayValue = paymentAccountInfo;
	let accountInfoHelperText = 'Enter payment account credentials, keys, or details.';

	if (isEdit && !canViewCredential) {
		accountInfoDisplayValue = '••••••••••••••••••••';
		accountInfoHelperText =
			'Account info is protected. (Requires "view_credential" permission to view)';
	} else if (isEdit && !showCredential) {
		accountInfoDisplayValue = paymentAccountInfo ? '••••••••••••••••••••' : '';
		accountInfoHelperText =
			'Account info is hidden. Click "Show Info" above to view or edit.';
	}

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg'>
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='payment-mode-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-flex align-items-center justify-content-center rounded-3'
							style={{
								width: '44px',
								height: '44px',
								backgroundColor: '#e0e7ff',
								color: '#4338ca',
								flexShrink: 0,
							}}>
							<Icon icon={isEdit ? 'Edit' : 'Payments'} size='lg' />
						</div>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h5 className='fw-bold mb-0 text-dark'>
									{isEdit ? 'Edit Payment Mode' : 'Create Payment Mode'}
								</h5>
								{isLoadingDetail && <Spinner isSmall className='text-primary' />}
							</div>
							<span className='text-muted small' style={{ fontSize: '0.8125rem' }}>
								{isEdit
									? 'Update payment mode details, code, and account information.'
									: 'Add a new payment mode to support checkout and transactions.'}
							</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody className='px-4 py-3'>
					<div className='row g-3'>
						{/* PAYMENT MODE NAME */}
						<div className='col-12 col-md-6'>
							<label htmlFor='paymentModeNameInput' className='form-label fw-semibold small mb-1'>
								Payment Mode Name <span className='text-danger'>*</span>
							</label>
							<input
								id='paymentModeNameInput'
								type='text'
								maxLength={100}
								className='form-control'
								placeholder='e.g. UPI, Net Banking, Credit Card'
								value={name}
								onChange={handleNameChange}
								style={{
									height: '42px',
									borderRadius: '0.5rem',
									border: '1px solid #cbd5e1',
									fontSize: '0.9rem',
								}}
								required
							/>
						</div>

						{/* CODE */}
						<div className='col-12 col-md-6'>
							<div className='d-flex justify-content-between align-items-center mb-1'>
								<label htmlFor='paymentModeCodeInput' className='form-label fw-semibold small mb-0'>
									Mode Code <span className='text-danger'>*</span>
								</label>
								{name.trim() && (
									<button
										type='button'
										className='btn btn-link btn-sm p-0 text-decoration-none text-primary small'
										onClick={handleRegenerateCode}
										title='Auto-generate code from name'>
										Auto from Name
									</button>
								)}
							</div>
							<input
								id='paymentModeCodeInput'
								type='text'
								maxLength={50}
								className='form-control font-monospace'
								placeholder='e.g. UPI, NET_BANKING, CREDIT_CARD'
								value={code}
								onChange={(e) => {
									setCode(e.target.value.toUpperCase());
									setIsCodeTouched(true);
								}}
								style={{
									height: '42px',
									borderRadius: '0.5rem',
									border: '1px solid #cbd5e1',
									fontSize: '0.9rem',
									textTransform: 'uppercase',
								}}
								required
							/>
							<div className='text-muted mt-1' style={{ fontSize: '0.75rem' }}>
								Unique identifier code (auto-filled from name, e.g. UPI, WALLET, CARD)
							</div>
						</div>

						{/* STATUS */}
						<div className='col-12'>
							<label htmlFor='paymentModeStatusSelect' className='form-label fw-semibold small mb-1'>
								Status <span className='text-danger'>*</span>
							</label>
							<select
								id='paymentModeStatusSelect'
								className='form-select'
								value={status}
								onChange={(e) => setStatus(e.target.value as PaymentModeStatusType)}
								style={{
									height: '42px',
									borderRadius: '0.5rem',
									border: '1px solid #cbd5e1',
									fontSize: '0.9rem',
								}}>
								{statusOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						{/* PAYMENT ACCOUNT INFO (STRING INPUT) */}
						<div className='col-12'>
							<div className='d-flex justify-content-between align-items-center mb-1'>
								<label htmlFor='paymentAccountInfoInput' className='form-label fw-semibold small mb-0'>
									Payment Account Info <span className='text-muted fw-normal'>(Optional)</span>
								</label>
								<div className='d-flex align-items-center gap-2'>
									{/* EYE TOGGLE BUTTON - ONLY VISIBLE IF USER HAS view_credential PERMISSION */}
									{canViewCredential && isEdit && (
										<button
											type='button'
											className='btn btn-link btn-sm p-0 text-decoration-none text-primary d-inline-flex align-items-center gap-1 small'
											onClick={() => setShowCredential((prev) => !prev)}
											title={showCredential ? 'Hide Account Info' : 'Show Account Info'}>
											<Icon icon={showCredential ? 'VisibilityOff' : 'Visibility'} size='sm' />
											<span>{showCredential ? 'Hide Info' : 'Show Info'}</span>
										</button>
									)}
								</div>
							</div>
							<input
								id='paymentAccountInfoInput'
								type='text'
								maxLength={255}
								className='form-control'
								placeholder='Enter account info, credentials, VPA, merchant keys, or notes...'
								value={accountInfoDisplayValue}
								onChange={(e) => {
									if (showCredential || !isEdit) {
										setPaymentAccountInfo(e.target.value);
									}
								}}
								disabled={isEdit && !canViewCredential}
								readOnly={isEdit && !showCredential}
								style={{
									height: '42px',
									borderRadius: '0.5rem',
									border: '1px solid #cbd5e1',
									fontSize: '0.9rem',
									background:
										isEdit && (!canViewCredential || !showCredential)
											? '#f8fafc'
											: '#ffffff',
									letterSpacing:
										isEdit && !showCredential && paymentAccountInfo
											? '0.15em'
											: 'normal',
									cursor: isEdit && !canViewCredential ? 'not-allowed' : 'text',
								}}
							/>
							<div className='text-muted mt-1' style={{ fontSize: '0.75rem' }}>
								{accountInfoHelperText}
							</div>
						</div>
					</div>
				</ModalBody>
				<ModalFooter className='px-4 py-3 border-top-0'>
					<Button
						type='button'
						color='light'
						className='px-4 py-2'
						onClick={() => setIsOpen(false)}
						isDisable={isSubmitting}>
						Cancel
					</Button>
					<Button
						type='submit'
						color='primary'
						className='px-4 py-2 d-inline-flex align-items-center gap-2'
						isDisable={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner isSmall inButton isGrow className='me-1' />
								{isEdit ? 'Saving Changes...' : 'Creating Payment Mode...'}
							</>
						) : (
							<>
								<Icon icon='Save' />
								{isEdit ? 'Save Changes' : 'Create Payment Mode'}
							</>
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

PaymentModeModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	// eslint-disable-next-line react/forbid-prop-types
	paymentModeData: PropTypes.any,
	onSubmit: PropTypes.func.isRequired,
	isSubmitting: PropTypes.bool.isRequired,
};

PaymentModeModal.defaultProps = {
	paymentModeData: null,
};

export default PaymentModeModal;
