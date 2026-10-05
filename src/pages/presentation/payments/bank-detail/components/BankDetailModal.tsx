/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props */
import React, { FC, useEffect, useState } from 'react';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Button from '../../../../../components/bootstrap/Button';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../components/icon/Icon';
import showNotification from '../../../../../components/extras/showNotification';
import {
	IBankDetail,
	IBankDetailPayload,
	AccountType,
	BankDetailStatus,
	ACCOUNT_TYPE_OPTIONS,
	ACCOUNT_TYPE_CONSTANT,
} from '../type/bank-detail-type';
import constantService, { IConstantOption } from '../../../../../services/constantService';
import bankDetailService from '../service/bankDetailService';

interface IBankDetailModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	bankDetailData?: IBankDetail | null;
	onSubmit: (payload: IBankDetailPayload) => Promise<void>;
	isSubmitting: boolean;
}

export const BankDetailModal: FC<IBankDetailModalProps> = ({
	isOpen,
	setIsOpen,
	bankDetailData,
	onSubmit,
	isSubmitting,
}) => {
	const isEdit = Boolean(bankDetailData);
	const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

	// FORM STATES
	const [bankName, setBankName] = useState<string>('');
	const [ifscCode, setIfscCode] = useState<string>('');
	const [accountHolderName, setAccountHolderName] = useState<string>('');
	const [accountNumber, setAccountNumber] = useState<string>('');
	const [confirmAccountNumber, setConfirmAccountNumber] = useState<string>('');
	const [accountType, setAccountType] = useState<AccountType>(ACCOUNT_TYPE_CONSTANT.SAVINGS);
	const [branchName, setBranchName] = useState<string>('');
	const [branchCode, setBranchCode] = useState<string>('');
	const [bankAddress, setBankAddress] = useState<string>('');
	const [status, setStatus] = useState<BankDetailStatus>('active');

	// DYNAMIC STATUS CONSTANTS
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
	]);

	// LOAD STATUS CONSTANTS ON MOUNT
	useEffect(() => {
		let isMounted = true;
		constantService
			.getStatusConstants()
			.then((opts) => {
				if (isMounted && opts && opts.length > 0) {
					setStatusOptions(opts);
				}
			})
			.catch(() => {});
		return () => {
			isMounted = false;
		};
	}, []);

	// POPULATE FORM IN EDIT MODE OR RESET ON ADD (FETCH FRESH VIA GET-ONE)
	useEffect(() => {
		let isMounted = true;
		if (isOpen) {
			if (bankDetailData) {
				setBankName(bankDetailData.bank_name || '');
				setIfscCode(bankDetailData.ifsc_code || '');
				setAccountHolderName(bankDetailData.account_holder_name || '');
				setAccountNumber(bankDetailData.account_number || '');
				setConfirmAccountNumber(bankDetailData.account_number || '');
				setAccountType(bankDetailData.account_type || ACCOUNT_TYPE_CONSTANT.SAVINGS);
				setBranchName(bankDetailData.branch_name || '');
				setBranchCode(bankDetailData.branch_code || '');
				setBankAddress(bankDetailData.bank_address || '');
				setStatus(bankDetailData.status || 'active');

				if (bankDetailData.id) {
					setIsLoadingDetail(true);
					bankDetailService
						.getBankDetailById(bankDetailData.id)
						.then((res) => {
							const fresh = res?.data;
							if (fresh && isMounted) {
								setBankName(fresh.bank_name || '');
								setIfscCode(fresh.ifsc_code || '');
								setAccountHolderName(fresh.account_holder_name || '');
								setAccountNumber(fresh.account_number || '');
								setConfirmAccountNumber(fresh.account_number || '');
								setAccountType(fresh.account_type || ACCOUNT_TYPE_CONSTANT.SAVINGS);
								setBranchName(fresh.branch_name || '');
								setBranchCode(fresh.branch_code || '');
								setBankAddress(fresh.bank_address || '');
								setStatus(fresh.status || 'active');
							}
						})
						.catch(() => {})
						.finally(() => {
							if (isMounted) setIsLoadingDetail(false);
						});
				}
			} else {
				setBankName('');
				setIfscCode('');
				setAccountHolderName('');
				setAccountNumber('');
				setConfirmAccountNumber('');
				setAccountType(ACCOUNT_TYPE_CONSTANT.SAVINGS);
				setBranchName('');
				setBranchCode('');
				setBankAddress('');
				setStatus('active');
			}
		}
		return () => {
			isMounted = false;
		};
	}, [bankDetailData, isOpen]);

	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const cleanBankName = bankName.trim();
		const cleanIfsc = ifscCode.trim().toUpperCase();
		const cleanHolderName = accountHolderName.trim();
		const cleanAccNum = accountNumber.trim();

		if (!cleanBankName) {
			showNotification('Validation Error', 'Bank name is required.', 'danger');
			return;
		}

		if (!cleanHolderName) {
			showNotification('Validation Error', 'Account holder name is required.', 'danger');
			return;
		}

		if (!cleanAccNum) {
			showNotification('Validation Error', 'Account number is required.', 'danger');
			return;
		}

		// CONFIRM ACCOUNT NUMBER CHECK
		if (cleanAccNum !== confirmAccountNumber.trim()) {
			showNotification('Validation Error', 'Account numbers do not match.', 'danger');
			return;
		}

		if (!cleanIfsc) {
			showNotification('Validation Error', 'IFSC code is required.', 'danger');
			return;
		}

		// IFSC CODE VALIDATION: 11 CHARACTERS
		const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
		if (!ifscRegex.test(cleanIfsc)) {
			showNotification(
				'Invalid IFSC Code',
				'Please enter a valid 11-character IFSC code (e.g. SBIN0001234).',
				'warning',
			);
			return;
		}

		const payload: IBankDetailPayload = {
			bank_name: cleanBankName,
			ifsc_code: cleanIfsc,
			account_holder_name: cleanHolderName,
			account_number: cleanAccNum,
			account_type: accountType,
			branch_name: branchName.trim() || undefined,
			branch_code: branchCode.trim() || undefined,
			bank_address: bankAddress.trim() || undefined,
			status,
		};

		await onSubmit(payload);
	};

	const inputStyle: React.CSSProperties = {
		height: '38px',
		borderRadius: '0.5rem',
		border: '1px solid #cbd5e1',
		fontSize: '0.9rem',
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size="lg" isStaticBackdrop={isSubmitting}>
			<form onSubmit={handleSubmit}>
				<ModalHeader setIsOpen={handleClose}>
					<ModalTitle id="bank-detail-modal-title">
						<div className="d-flex align-items-center gap-2">
							<Icon
								icon={isEdit ? 'Edit' : 'AddCard'}
								className="text-primary"
								size="lg"
							/>
							<span className="fw-bold">
								{isEdit ? 'Edit Bank Detail' : 'Add Bank Detail'}
							</span>
							{isLoadingDetail && (
								<span className="badge bg-light text-muted border d-inline-flex align-items-center gap-1 ms-2" style={{ fontSize: '0.75rem' }}>
									<Spinner isSmall isGrow className="text-primary" />
									<span>Fetching latest...</span>
								</span>
							)}
						</div>
					</ModalTitle>
				</ModalHeader>

				<ModalBody>
					<div className="row g-3">
						{/* BANK NAME */}
						<div className="col-12 col-md-6">
							<label htmlFor="bankNameInput" className="form-label fw-bold small mb-1">
								Bank Name <span className="text-danger">*</span>
							</label>
							<input
								id="bankNameInput"
								type="text"
								className="form-control"
								placeholder="e.g. State Bank of India, HDFC Bank"
								value={bankName}
								onChange={(e) => setBankName(e.target.value)}
								style={inputStyle}
								required
							/>
						</div>

						{/* ACCOUNT HOLDER NAME */}
						<div className="col-12 col-md-6">
							<label
								htmlFor="accountHolderInput"
								className="form-label fw-bold small mb-1">
								Account Holder Name <span className="text-danger">*</span>
							</label>
							<input
								id="accountHolderInput"
								type="text"
								className="form-control"
								placeholder="e.g. Cardspe Technologies Pvt Ltd"
								value={accountHolderName}
								onChange={(e) => setAccountHolderName(e.target.value)}
								style={inputStyle}
								required
							/>
						</div>

						{/* ACCOUNT NUMBER */}
						<div className="col-12 col-md-6">
							<label htmlFor="accNumberInput" className="form-label fw-bold small mb-1">
								Account Number <span className="text-danger">*</span>
							</label>
							<input
								id="accNumberInput"
								type="text"
								className="form-control font-monospace"
								placeholder="e.g. 50200012345678"
								value={accountNumber}
								onChange={(e) => setAccountNumber(e.target.value)}
								style={inputStyle}
								required
							/>
						</div>

						{/* CONFIRM ACCOUNT NUMBER */}
						<div className="col-12 col-md-6">
							<label
								htmlFor="confirmAccNumberInput"
								className="form-label fw-bold small mb-1">
								Confirm Account Number <span className="text-danger">*</span>
							</label>
							<input
								id="confirmAccNumberInput"
								type="text"
								className="form-control font-monospace"
								placeholder="Re-enter Account Number"
								value={confirmAccountNumber}
								onChange={(e) => setConfirmAccountNumber(e.target.value)}
								style={inputStyle}
								required
							/>
							{accountNumber &&
								confirmAccountNumber &&
								accountNumber.trim() !== confirmAccountNumber.trim() && (
									<small className="text-danger">Account numbers do not match</small>
								)}
						</div>

						{/* IFSC CODE */}
						<div className="col-12 col-md-6">
							<label htmlFor="ifscCodeInput" className="form-label fw-bold small mb-1">
								IFSC Code <span className="text-danger">*</span>
							</label>
							<input
								id="ifscCodeInput"
								type="text"
								className="form-control font-monospace text-uppercase"
								placeholder="e.g. SBIN0001234"
								value={ifscCode}
								maxLength={11}
								onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
								style={inputStyle}
								required
							/>
							<span className="text-muted small" style={{ fontSize: '0.75rem' }}>
								11-character Indian Financial System Code
							</span>
						</div>

						{/* ACCOUNT TYPE */}
						<div className="col-12 col-md-6">
							<label htmlFor="accountTypeSelect" className="form-label fw-bold small mb-1">
								Account Type <span className="text-danger">*</span>
							</label>
							<select
								id="accountTypeSelect"
								className="form-select"
								value={accountType}
								onChange={(e) => setAccountType(e.target.value as AccountType)}
								style={inputStyle}
								required>
								{ACCOUNT_TYPE_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						{/* BRANCH NAME */}
						<div className="col-12 col-md-6">
							<label htmlFor="branchNameInput" className="form-label fw-bold small mb-1">
								Branch Name <span className="text-muted fw-normal">(Optional)</span>
							</label>
							<input
								id="branchNameInput"
								type="text"
								className="form-control"
								placeholder="e.g. Nariman Point Branch"
								value={branchName}
								onChange={(e) => setBranchName(e.target.value)}
								style={inputStyle}
							/>
						</div>

						{/* BRANCH CODE */}
						<div className="col-12 col-md-6">
							<label htmlFor="branchCodeInput" className="form-label fw-bold small mb-1">
								Branch Code <span className="text-muted fw-normal">(Optional)</span>
							</label>
							<input
								id="branchCodeInput"
								type="text"
								className="form-control font-monospace"
								placeholder="e.g. 001234"
								value={branchCode}
								onChange={(e) => setBranchCode(e.target.value)}
								style={inputStyle}
							/>
						</div>

						{/* STATUS SELECT */}
						<div className="col-12 col-md-6">
							<label htmlFor="statusSelect" className="form-label fw-bold small mb-1">
								Status
							</label>
							<select
								id="statusSelect"
								className="form-select"
								value={status}
								onChange={(e) => setStatus(e.target.value as BankDetailStatus)}
								style={inputStyle}>
								{statusOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						{/* BANK ADDRESS */}
						<div className="col-12">
							<label htmlFor="bankAddressInput" className="form-label fw-bold small mb-1">
								Bank Address <span className="text-muted fw-normal">(Optional)</span>
							</label>
							<textarea
								id="bankAddressInput"
								className="form-control"
								rows={2}
								placeholder="e.g. Ground Floor, Express Towers, Nariman Point, Mumbai - 400021"
								value={bankAddress}
								onChange={(e) => setBankAddress(e.target.value)}
								style={{ borderRadius: '0.5rem', fontSize: '0.9rem' }}
							/>
						</div>
					</div>
				</ModalBody>

				<ModalFooter>
					<Button
						color="light"
						className="border"
						onClick={handleClose}
						isDisable={isSubmitting}>
						Cancel
					</Button>
					<Button color="primary" type="submit" isDisable={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner isSmall inButton isGrow className="me-1" />
								<span>Saving...</span>
							</>
						) : (
							<>
								<Icon icon="Save" size="sm" className="me-1" />
								<span>{isEdit ? 'Save Changes' : 'Create Bank Detail'}</span>
							</>
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

BankDetailModal.defaultProps = {
	bankDetailData: null,
};

export default BankDetailModal;
