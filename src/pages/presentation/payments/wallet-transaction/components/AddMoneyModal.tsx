/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props */
import React, { FC, useState, useRef } from 'react';
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
import { TAddMoneyType } from '../type/wallet-transaction.type';

interface IAddMoneyModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	onSuccess: () => void;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export const AddMoneyModal: FC<IAddMoneyModalProps> = ({
	isOpen,
	setIsOpen,
	onSuccess,
}) => {
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [amount, setAmount] = useState<string>('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [paymentType] = useState<TAddMoneyType>('custom');
	const [kycErrorMsg, setKycErrorMsg] = useState<string | null>(null);

	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
		setAmount('');
		setSelectedFile(null);
		setPreviewUrl(null);
		setKycErrorMsg(null);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
			if (!validTypes.includes(file.type)) {
				showNotification('Invalid File', 'Please upload a JPG, PNG, or WEBP image file.', 'warning');
				return;
			}
			// Validate size (< 5MB)
			if (file.size > 5 * 1024 * 1024) {
				showNotification('File Too Large', 'Screenshot must be under 5MB.', 'warning');
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const numAmount = Number(amount);

		if (!numAmount || numAmount <= 0) {
			showNotification('Validation Error', 'Please enter a valid positive amount.', 'warning');
			return;
		}

		if (!selectedFile) {
			showNotification('Proof Required', 'Please upload a payment screenshot/receipt.', 'warning');
			return;
		}

		setIsSubmitting(true);
		setKycErrorMsg(null);

		try {
			await walletTransactionService.addMoneyRequest({
				amount: numAmount,
				screenshot: selectedFile,
				type: paymentType,
			});

			showNotification(
				'Request Submitted',
				`Wallet top-up request for ₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been submitted for approval.`,
				'success',
			);
			onSuccess();
			handleClose();
		} catch (error: any) {
			if (isKycRequiredError(error)) {
				const msg = error?.data?.message || error?.message || 'KYC verification required before requesting wallet top-up.';
				setKycErrorMsg(msg);
				showNotification('KYC Required', msg, 'warning');
			} else {
				showNotification(
					'Submission Failed',
					error?.data?.message || error?.message || 'Failed to submit wallet top-up request.',
					'danger',
				);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='lg' isStaticBackdrop={isSubmitting} isCentered>
			<ModalHeader setIsOpen={handleClose} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='add-money-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-inline-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary border flex-shrink-0'
							style={{ width: '44px', height: '44px' }}>
							<Icon icon='AccountBalanceWallet' size='lg' />
						</div>
						<div>
							<h5 className='mb-0 fw-bold text-dark'>Wallet Top-Up Request</h5>
							<small className='text-muted'>
								Submit a deposit proof to add funds to your wallet account
							</small>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<form onSubmit={handleSubmit}>
				<ModalBody className='px-4 pt-3 pb-2'>
					{/* KYC WARNING BANNER IF TRIGGERED */}
					{kycErrorMsg && (
						<div className='alert alert-warning d-flex align-items-center justify-content-between p-3 mb-3 rounded-3 border'>
							<div className='d-flex align-items-center gap-2'>
								<Icon icon='Warning' className='text-warning flex-shrink-0' size='lg' />
								<div className='small'>{kycErrorMsg}</div>
							</div>
							<button
								type='button'
								className='btn btn-warning btn-sm ms-2 flex-shrink-0'
								onClick={() => {
									handleClose();
									navigate(`/${PAGE_ROUTES.KYC}`);
								}}>
								Go to KYC
							</button>
						</div>
					)}

					{/* AMOUNT INPUT */}
					<div className='mb-3'>
						<label htmlFor='topupAmountInput' className='form-label fw-bold small text-uppercase text-muted mb-2'>
							Deposit Amount (INR) <span className='text-danger'>*</span>
						</label>
						<div className='input-group input-group-lg'>
							<span className='input-group-text bg-light fw-bold text-muted'>₹</span>
							<input
								id='topupAmountInput'
								type='number'
								step='0.01'
								min='1'
								className='form-control fw-bold'
								placeholder='0.00'
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								required
								autoFocus
							/>
						</div>

						{/* QUICK AMOUNT CHIPS */}
						<div className='d-flex align-items-center gap-2 mt-2 flex-wrap'>
							<span className='text-muted small me-1'>Quick Add:</span>
							{PRESET_AMOUNTS.map((preset) => (
								<button
									key={preset}
									type='button'
									className='btn btn-sm btn-outline-secondary rounded-pill px-3 py-1'
									style={{ fontSize: '0.78rem' }}
									onClick={() => handlePresetClick(preset)}>
									+₹{preset.toLocaleString('en-IN')}
								</button>
							))}
						</div>
					</div>

					{/* PAYMENT SCREENSHOT UPLOAD */}
					<div className='mb-3'>
						<label className='form-label fw-bold small text-uppercase text-muted mb-2'>
							Payment Proof / Screenshot <span className='text-danger'>*</span>
						</label>

						<input
							type='file'
							ref={fileInputRef}
							accept='image/jpeg,image/png,image/webp,image/jpg'
							className='d-none'
							onChange={handleFileChange}
						/>

						{previewUrl ? (
							<div className='border rounded-3 p-3 bg-light position-relative'>
								<div className='d-flex align-items-center gap-3'>
									<img
										src={previewUrl}
										alt='Proof Preview'
										className='rounded-2 border object-fit-cover'
										style={{ width: '80px', height: '80px' }}
									/>
									<div className='flex-grow-1 text-truncate'>
										<div className='fw-bold text-dark text-truncate small'>
											{selectedFile?.name}
										</div>
										<div className='text-muted small'>
											{selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
										</div>
										<span className='badge bg-success-subtle text-success border border-success mt-1'>
											Ready to submit
										</span>
									</div>
									<button
										type='button'
										className='btn btn-outline-danger btn-sm rounded-circle p-2'
										title='Remove image'
										onClick={handleRemoveFile}>
										<Icon icon='Delete' size='sm' />
									</button>
								</div>
							</div>
						) : (
							<div
								role='button'
								tabIndex={0}
								className='border border-2 border-dashed rounded-3 p-4 text-center bg-light-subtle'
								style={{ cursor: 'pointer' }}
								onClick={() => fileInputRef.current?.click()}
								onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}>
								<div className='mb-2 text-primary'>
									<Icon icon='CloudUpload' size='3x' />
								</div>
								<div className='fw-bold text-dark mb-1' style={{ fontSize: '0.9rem' }}>
									Click or drag payment screenshot here
								</div>
								<div className='text-muted small'>
									Supports PNG, JPG, or WEBP up to 5MB (Bank receipt, UPI confirmation)
								</div>
							</div>
						)}
					</div>

					{/* INFORMATION NOTICE */}
					<div className='d-flex align-items-start gap-2 p-3 rounded-3 bg-light text-muted small border'>
						<Icon icon='Info' className='text-primary mt-1 flex-shrink-0' size='sm' />
						<div>
							Your deposit request will be reviewed and verified by an administrator. Once approved, the funds will immediately reflect in your wallet balance.
						</div>
					</div>
				</ModalBody>

				<ModalFooter className='border-top-0 pt-0 pb-4 px-4 gap-2'>
					<button
						type='button'
						className='btn btn-light border px-4'
						onClick={handleClose}
						disabled={isSubmitting}>
						Cancel
					</button>
					<button
						type='submit'
						className='btn btn-primary px-4 d-inline-flex align-items-center gap-2'
						disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner isSmall isGrow={false} />
								<span>Submitting Request...</span>
							</>
						) : (
							<>
								<Icon icon='Send' size='sm' />
								<span>Submit Deposit Proof</span>
							</>
						)}
					</button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default AddMoneyModal;
