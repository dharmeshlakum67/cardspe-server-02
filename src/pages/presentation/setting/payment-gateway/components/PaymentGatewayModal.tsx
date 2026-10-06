/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { FC, useEffect, useRef, useState } from 'react';
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
import { getImageUrl } from '../../../../../helpers/helpers';
import {
	IPaymentGateway,
	TPaymentGatewayStatus,
} from '../type/payment-gateway-type';
import paymentGatewayService from '../service/paymentGatewayService';
import '../css/payment-gateway.scss';

interface IPaymentGatewayModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	gatewayData?: IPaymentGateway | null;
	onSuccess: () => void;
}

const inputStyle: React.CSSProperties = {
	height: '42px',
	borderRadius: '0.5rem',
	border: '1px solid #cbd5e1',
	fontSize: '0.9rem',
};

const textareaStyle: React.CSSProperties = {
	borderRadius: '0.5rem',
	border: '1px solid #cbd5e1',
	fontSize: '0.9rem',
};

export const PaymentGatewayModal: FC<IPaymentGatewayModalProps> = ({
	isOpen,
	setIsOpen,
	gatewayData,
	onSuccess,
}) => {
	const isEditMode = Boolean(gatewayData);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [name, setName] = useState<string>('');
	const [status, setStatus] = useState<TPaymentGatewayStatus>('active');
	const [description, setDescription] = useState<string>('');

	// IMAGE STATE
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>('');
	const [isDeleteIcon, setIsDeleteIcon] = useState<boolean>(false);

	// FORM & SUBMIT STATES
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	// POPULATE OR RESET FORM ON MODAL OPEN
	useEffect(() => {
		if (isOpen) {
			setErrors({});
			setIsSubmitting(false);
			if (gatewayData) {
				setName(gatewayData.name || '');
				setStatus(gatewayData.status || 'active');
				setDescription(gatewayData.description || '');
				const existingIcon = gatewayData.icon ? getImageUrl(gatewayData.icon) : '';
				setImagePreview(existingIcon);
				setSelectedFile(null);
				setIsDeleteIcon(false);
			} else {
				setName('');
				setStatus('active');
				setDescription('');
				setImagePreview('');
				setSelectedFile(null);
				setIsDeleteIcon(false);
			}
		}
	}, [isOpen, gatewayData]);

	// HANDLE CLOSE
	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
	};

	// HANDLE FILE SELECTION
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith('image/')) {
				showNotification('Invalid File', 'Please upload a valid image (PNG, JPG, SVG, WEBP)', 'warning');
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				showNotification('File Too Large', 'Icon size must be less than 5MB', 'warning');
				return;
			}

			setSelectedFile(file);
			setIsDeleteIcon(false);
			const previewUrl = URL.createObjectURL(file);
			setImagePreview(previewUrl);
		}
	};

	// HANDLE CLEAR / REMOVE IMAGE
	const handleClearImage = () => {
		setSelectedFile(null);
		setImagePreview('');
		setIsDeleteIcon(true);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	// VALIDATE FORM
	const validate = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!name.trim()) {
			newErrors.name = 'Gateway name is required';
		} else if (name.trim().length < 2) {
			newErrors.name = 'Gateway name must be at least 2 characters';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// SUBMIT HANDLER
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setIsSubmitting(true);
		try {
			const formData = new FormData();
			formData.append('name', name.trim());
			formData.append('status', status);
			if (description.trim()) {
				formData.append('description', description.trim());
			}

			if (selectedFile) {
				formData.append('icon', selectedFile);
			} else if (isDeleteIcon && isEditMode) {
				formData.append('is_delete_icon', 'true');
			}

			if (isEditMode && gatewayData) {
				await paymentGatewayService.updatePaymentGateway(gatewayData.id, formData);
				showNotification('Success', `Payment Gateway "${name}" updated successfully`, 'success');
			} else {
				await paymentGatewayService.createPaymentGateway(formData);
				showNotification('Success', `Payment Gateway "${name}" created successfully`, 'success');
			}

			onSuccess();
			handleClose();
		} catch (error: any) {
			showNotification(
				'Error',
				error?.data?.message || error?.message || 'Failed to save payment gateway',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='lg' isCentered isStaticBackdrop={isSubmitting}>
			<ModalHeader setIsOpen={handleClose} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='payment-gateway-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-flex align-items-center justify-content-center rounded-3'
							style={{
								width: '44px',
								height: '44px',
								backgroundColor: '#fdf2f8',
								color: '#db2777',
								flexShrink: 0,
							}}>
							<Icon icon={isEditMode ? 'Edit' : 'AccountBalanceWallet'} size='lg' />
						</div>
						<div>
							<h5 className='fw-bold mb-0 text-dark'>
								{isEditMode ? 'Edit Payment Gateway' : 'Add New Payment Gateway'}
							</h5>
							<span className='text-muted small' style={{ fontSize: '0.8125rem' }}>
								{isEditMode
									? 'Modify payment gateway details, status, or branding icon.'
									: 'Configure a new payment gateway for payment processing.'}
							</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<form onSubmit={handleSubmit}>
				<ModalBody className='px-4 py-3'>
					<div className='row g-3'>
						{/* GATEWAY NAME */}
						<div className='col-12 col-md-7'>
							<label htmlFor='gatewayNameInput' className='form-label fw-semibold small mb-1'>
								Gateway Name <span className='text-danger'>*</span>
							</label>
							<input
								id='gatewayNameInput'
								type='text'
								className={`form-control ${errors.name ? 'is-invalid' : ''}`}
								placeholder='e.g. Razorpay, Stripe, Cashfree'
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
								}}
								style={inputStyle}
								disabled={isSubmitting}
								required
							/>
							{errors.name && <div className='invalid-feedback d-block mt-1'>{errors.name}</div>}
						</div>

						{/* STATUS */}
						<div className='col-12 col-md-5'>
							<label htmlFor='gatewayStatusSelect' className='form-label fw-semibold small mb-1'>
								Status <span className='text-danger'>*</span>
							</label>
							<select
								id='gatewayStatusSelect'
								className='form-select'
								value={status}
								onChange={(e) => setStatus(e.target.value as TPaymentGatewayStatus)}
								style={inputStyle}
								disabled={isSubmitting}>
								<option value='active'>Active</option>
								<option value='inactive'>Inactive</option>
							</select>
						</div>

						{/* DESCRIPTION */}
						<div className='col-12'>
							<label htmlFor='gatewayDescInput' className='form-label fw-semibold small mb-1'>
								Description <span className='text-muted font-normal'>(Optional)</span>
							</label>
							<textarea
								id='gatewayDescInput'
								className='form-control'
								rows={3}
								placeholder='Brief description of supported payment modes, routing, or limits...'
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								style={textareaStyle}
								disabled={isSubmitting}
							/>
						</div>

						{/* ICON / LOGO UPLOAD */}
						<div className='col-12'>
							<label className='form-label fw-semibold small mb-1 d-block'>
								Gateway Icon / Logo <span className='text-muted font-normal'>(Optional)</span>
							</label>
							<input
								type='file'
								ref={fileInputRef}
								accept='image/png, image/jpeg, image/jpg, image/svg+xml, image/webp'
								style={{ display: 'none' }}
								onChange={handleFileSelect}
								disabled={isSubmitting}
							/>

							{imagePreview ? (
								<div className='gateway-image-preview-box'>
									<div className='preview-left'>
										<div className='preview-img-frame'>
											<img src={imagePreview} alt='Gateway Icon' />
										</div>
										<div className='preview-file-info'>
											<span className='file-name'>
												{selectedFile ? selectedFile.name : `${name || 'Gateway'} Icon`}
											</span>
											<span className='file-size'>
												{selectedFile
													? `${(selectedFile.size / 1024).toFixed(1)} KB`
													: 'Active gateway icon'}
											</span>
										</div>
									</div>
									<div className='preview-actions'>
										<button
											type='button'
											className='btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1 px-3 py-1.5 rounded-2'
											onClick={() => fileInputRef.current?.click()}
											disabled={isSubmitting}>
											<Icon icon='Edit' size='sm' />
											<span>Change</span>
										</button>
										<button
											type='button'
											className='btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1 px-3 py-1.5 rounded-2'
											onClick={handleClearImage}
											disabled={isSubmitting}>
											<Icon icon='DeleteOutline' size='sm' />
											<span>Remove</span>
										</button>
									</div>
								</div>
							) : (
								<div
									role='button'
									tabIndex={0}
									className='gateway-image-dropzone'
									onClick={() => fileInputRef.current?.click()}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											fileInputRef.current?.click();
										}
									}}>
									<div className='dropzone-content'>
										<div className='dropzone-icon'>
											<Icon icon='CloudUpload' size='lg' />
										</div>
										<div className='dropzone-title'>Click to upload gateway icon</div>
										<div className='dropzone-hint'>PNG, JPG, SVG, or WEBP (Max 5MB)</div>
										<button
											type='button'
											className='btn btn-light btn-sm mt-2 border shadow-sm px-3 fw-semibold'
											onClick={(e) => {
												e.stopPropagation();
												fileInputRef.current?.click();
											}}>
											<Icon icon='Upload' size='sm' className='me-1 text-primary' />
											Browse File
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</ModalBody>

				<ModalFooter className='border-top-0 pt-2 pb-4 px-4 gap-2'>
					<Button
						type='button'
						color='light'
						className='px-4 fw-semibold rounded-2'
						onClick={handleClose}
						isDisable={isSubmitting}>
						Cancel
					</Button>
					<Button
						type='submit'
						color='primary'
						className='px-4 fw-semibold rounded-2'
						isDisable={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner isSmall inButton isGrow={false} className='me-2' />
								{isEditMode ? 'Updating...' : 'Creating...'}
							</>
						) : (
							<>
								<Icon icon={isEditMode ? 'Check' : 'Add'} className='me-1' />
								{isEditMode ? 'Update Gateway' : 'Create Gateway'}
							</>
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

PaymentGatewayModal.defaultProps = {
	gatewayData: null,
};

export default PaymentGatewayModal;
