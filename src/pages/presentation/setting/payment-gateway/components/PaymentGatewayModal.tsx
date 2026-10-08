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
	IPaymentGatewayChargeConstantOption,
	parseGatewayCharges,
} from '../type/payment-gateway-type';
import paymentGatewayService from '../service/paymentGatewayService';
import '../css/payment-gateway.scss';

interface IPaymentGatewayModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	gatewayData?: IPaymentGateway | null;
	onSuccess: () => void;
}

interface IChargeFormItem {
	id: string;
	name: string;
	type: string;
	value: string | number;
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
	const [minAmount, setMinAmount] = useState<string | number>('');
	const [maxAmount, setMaxAmount] = useState<string | number>('');

	// CHARGES STATE & CONSTANT DROPDOWN OPTIONS
	const [chargesList, setChargesList] = useState<IChargeFormItem[]>([]);
	const [chargeNamesOptions, setChargeNamesOptions] = useState<IPaymentGatewayChargeConstantOption[]>([
		{ label: 'UPI', value: 'UPI' },
		{ label: 'Credit Card', value: 'Credit Card' },
		{ label: 'Debit Card', value: 'Debit Card' },
		{ label: 'Net Banking', value: 'Net Banking' },
		{ label: 'Wallet', value: 'Wallet' },
	]);
	const [chargeTypesOptions, setChargeTypesOptions] = useState<IPaymentGatewayChargeConstantOption[]>([
		{ label: 'Percentage (%)', value: 'PERCENTAGE' },
		{ label: 'Flat (₹)', value: 'FLAT' },
	]);

	// IMAGE STATE
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>('');
	const [imageLoadFailed, setImageLoadFailed] = useState<boolean>(false);
	const [isDeleteIcon, setIsDeleteIcon] = useState<boolean>(false);

	// FORM & SUBMIT STATES
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	// FETCH CONSTANTS ONCE
	useEffect(() => {
		let isMounted = true;
		const fetchChargesConstants = async () => {
			try {
				const constants = await paymentGatewayService.getChargesConstants();
				if (isMounted) {
					if (constants.charge_names && constants.charge_names.length > 0) {
						setChargeNamesOptions(constants.charge_names);
					}
					if (constants.charge_types && constants.charge_types.length > 0) {
						setChargeTypesOptions(constants.charge_types);
					}
				}
			} catch (err) {
				console.error('Failed to fetch charges constants:', err);
			}
		};
		fetchChargesConstants();
		return () => {
			isMounted = false;
		};
	}, []);

	// POPULATE OR RESET FORM ON MODAL OPEN
	useEffect(() => {
		if (isOpen) {
			setErrors({});
			setIsSubmitting(false);
			setImageLoadFailed(false);
			if (gatewayData) {
				setName(gatewayData.name || '');
				setStatus(gatewayData.status || 'active');
				setDescription(gatewayData.description || '');
				setMinAmount(
					gatewayData.min_amount !== null && gatewayData.min_amount !== undefined
						? gatewayData.min_amount
						: '',
				);
				setMaxAmount(
					gatewayData.max_amount !== null && gatewayData.max_amount !== undefined
						? gatewayData.max_amount
						: '',
				);
				const existingIcon = gatewayData.icon ? getImageUrl(gatewayData.icon) : '';
				setImagePreview(existingIcon);
				setSelectedFile(null);
				setIsDeleteIcon(false);

				// Populate existing charges
				const parsedCharges = parseGatewayCharges(gatewayData.charges);
				setChargesList(
					parsedCharges.map((c, idx) => ({
						id: `charge_${idx}_${Date.now()}`,
						name: c.name || (chargeNamesOptions[0]?.value ?? 'UPI'),
						type: c.type || (chargeTypesOptions[0]?.value ?? 'PERCENTAGE'),
						value: c.value !== undefined ? c.value : '',
					})),
				);
			} else {
				setName('');
				setStatus('active');
				setDescription('');
				setMinAmount('');
				setMaxAmount('');
				setImagePreview('');
				setSelectedFile(null);
				setIsDeleteIcon(false);
				setChargesList([]);
			}
		}
	}, [isOpen, gatewayData, chargeNamesOptions, chargeTypesOptions]);

	// HANDLE CLOSE
	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
	};

	// CHARGES MANAGEMENT HANDLERS (WITH DUPLICATE PREVENTION)
	const handleAddCharge = () => {
		const usedNames = new Set(chargesList.map((c) => c.name));
		const nextAvailableOption = chargeNamesOptions.find((opt) => !usedNames.has(opt.value));
		const defaultName = nextAvailableOption ? nextAvailableOption.value : chargeNamesOptions[0]?.value || 'UPI';
		const defaultType = chargeTypesOptions[0]?.value || 'PERCENTAGE';

		setChargesList((prev) => [
			...prev,
			{
				id: `charge_${Date.now()}_${Math.random()}`,
				name: defaultName,
				type: defaultType,
				value: '',
			},
		]);
		if (errors.charges) {
			setErrors((prev) => ({ ...prev, charges: '' }));
		}
	};

	const handleRemoveCharge = (id: string) => {
		setChargesList((prev) => prev.filter((item) => item.id !== id));
		if (errors.charges) {
			setErrors((prev) => ({ ...prev, charges: '' }));
		}
	};

	const handleUpdateCharge = (id: string, field: 'name' | 'type' | 'value', val: any) => {
		setChargesList((prev) =>
			prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
		);
		if (errors.charges) {
			setErrors((prev) => ({ ...prev, charges: '' }));
		}
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
			setImageLoadFailed(false);
			const previewUrl = URL.createObjectURL(file);
			setImagePreview(previewUrl);
		}
	};

	// HANDLE CLEAR / REMOVE IMAGE
	const handleClearImage = () => {
		setSelectedFile(null);
		setImagePreview('');
		setImageLoadFailed(false);
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

		// Validate transaction limits (min_amount & max_amount)
		if (minAmount !== '' && minAmount !== null && minAmount !== undefined) {
			const numMin = Number(minAmount);
			if (isNaN(numMin) || numMin < 0) {
				newErrors.min_amount = 'Minimum amount must be a valid non-negative number';
			}
		}

		if (maxAmount !== '' && maxAmount !== null && maxAmount !== undefined) {
			const numMax = Number(maxAmount);
			if (isNaN(numMax) || numMax < 0) {
				newErrors.max_amount = 'Maximum amount must be a valid non-negative number';
			}
		}

		if (
			minAmount !== '' &&
			minAmount !== null &&
			minAmount !== undefined &&
			maxAmount !== '' &&
			maxAmount !== null &&
			maxAmount !== undefined &&
			!isNaN(Number(minAmount)) &&
			!isNaN(Number(maxAmount)) &&
			Number(maxAmount) > 0 &&
			Number(minAmount) > Number(maxAmount)
		) {
			newErrors.max_amount = 'Maximum amount cannot be less than Minimum amount';
		}

		// Validate charges and duplicate charge names
		const selectedNames = new Set<string>();
		for (let i = 0; i < chargesList.length; i += 1) {
			const item = chargesList[i];
			if (!item.name) {
				newErrors.charges = `Please select a charge name for row #${i + 1}`;
				break;
			}
			if (selectedNames.has(item.name)) {
				newErrors.charges = `Duplicate charge: "${item.name}" has been added more than once. Please remove or select a different payment mode.`;
				break;
			}
			selectedNames.add(item.name);

			if (!item.type) {
				newErrors.charges = `Please select a charge type for row #${i + 1}`;
				break;
			}
			if (
				item.value === '' ||
				item.value === null ||
				item.value === undefined ||
				isNaN(Number(item.value))
			) {
				newErrors.charges = `Please enter a valid numeric charge value for "${item.name}"`;
				break;
			}
			if (Number(item.value) < 0) {
				newErrors.charges = `Charge value for "${item.name}" cannot be negative`;
				break;
			}
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

			// Min and Max transaction limits
			if (minAmount !== '' && minAmount !== null && minAmount !== undefined) {
				formData.append('min_amount', String(minAmount));
			} else if (isEditMode) {
				formData.append('min_amount', '');
			}

			if (maxAmount !== '' && maxAmount !== null && maxAmount !== undefined) {
				formData.append('max_amount', String(maxAmount));
			} else if (isEditMode) {
				formData.append('max_amount', '');
			}

			// Format charges payload
			const formattedCharges = chargesList.map((c) => ({
				name: c.name,
				type: c.type,
				value: Number(c.value),
			}));
			formData.append('charges', JSON.stringify(formattedCharges));

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

	const isMaxChargesReached = chargesList.length >= chargeNamesOptions.length && chargeNamesOptions.length > 0;

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
									? 'Modify payment gateway details, charges, status, or branding icon.'
									: 'Configure a new payment gateway with custom charge rates.'}
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

						{/* TRANSACTION LIMITS (MIN & MAX AMOUNT) */}
						<div className='col-12 col-md-6'>
							<label htmlFor='gatewayMinAmountInput' className='form-label fw-semibold small mb-1'>
								Min Transaction Amount (₹) <span className='text-muted font-normal'>(Optional)</span>
							</label>
							<input
								id='gatewayMinAmountInput'
								type='number'
								min='0'
								step='any'
								className={`form-control ${errors.min_amount ? 'is-invalid' : ''}`}
								placeholder='e.g. 100'
								value={minAmount}
								onChange={(e) => {
									setMinAmount(e.target.value);
									if (errors.min_amount || errors.max_amount) {
										setErrors((prev) => ({ ...prev, min_amount: '', max_amount: '' }));
									}
								}}
								style={inputStyle}
								disabled={isSubmitting}
							/>
							{errors.min_amount && (
								<div className='invalid-feedback d-block mt-1'>{errors.min_amount}</div>
							)}
						</div>

						<div className='col-12 col-md-6'>
							<label htmlFor='gatewayMaxAmountInput' className='form-label fw-semibold small mb-1'>
								Max Transaction Amount (₹) <span className='text-muted font-normal'>(Optional)</span>
							</label>
							<input
								id='gatewayMaxAmountInput'
								type='number'
								min='0'
								step='any'
								className={`form-control ${errors.max_amount ? 'is-invalid' : ''}`}
								placeholder='e.g. 50000'
								value={maxAmount}
								onChange={(e) => {
									setMaxAmount(e.target.value);
									if (errors.max_amount) {
										setErrors((prev) => ({ ...prev, max_amount: '' }));
									}
								}}
								style={inputStyle}
								disabled={isSubmitting}
							/>
							{errors.max_amount && (
								<div className='invalid-feedback d-block mt-1'>{errors.max_amount}</div>
							)}
						</div>

						{/* DESCRIPTION */}
						<div className='col-12'>
							<label htmlFor='gatewayDescInput' className='form-label fw-semibold small mb-1'>
								Description <span className='text-muted font-normal'>(Optional)</span>
							</label>
							<textarea
								id='gatewayDescInput'
								className='form-control'
								rows={2}
								placeholder='Brief description of supported payment modes, routing, or limits...'
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								style={textareaStyle}
								disabled={isSubmitting}
							/>
						</div>

						{/* GATEWAY CHARGES SECTION */}
						<div className='col-12'>
							<div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2'>
								<div>
									<div className='d-flex align-items-center gap-2'>
										<label className='form-label fw-bold text-dark mb-0' style={{ fontSize: '0.875rem' }}>
											Gateway Charges
										</label>
										<span className='badge bg-light text-muted border' style={{ fontSize: '0.72rem' }}>
											{chargesList.length} / {chargeNamesOptions.length} Configured
										</span>
									</div>
									<div className='text-muted' style={{ fontSize: '0.75rem' }}>
										Configure surcharge or processing fee per payment mode (each mode can be added once)
									</div>
								</div>
								<button
									type='button'
									className='btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1 px-3 py-1 rounded-2 fw-semibold'
									onClick={handleAddCharge}
									disabled={isSubmitting || isMaxChargesReached}>
									<Icon icon='Add' size='sm' />
									<span>{isMaxChargesReached ? 'All Modes Added' : 'Add Charge'}</span>
								</button>
							</div>

							{chargesList.length === 0 ? (
								<div
									className='p-3 border rounded-3 bg-light text-center text-muted'
									style={{ borderStyle: 'dashed' }}>
									<Icon icon='PriceChange' size='lg' className='text-muted mb-1' />
									<p className='mb-0 small'>No custom gateway charges configured.</p>
									<button
										type='button'
										className='btn btn-link btn-sm text-primary p-0 mt-1 fw-semibold text-decoration-none'
										onClick={handleAddCharge}
										disabled={isSubmitting}>
										+ Click here to add charge rate
									</button>
								</div>
							) : (
								<div className='charges-table-wrapper border rounded-3 overflow-hidden'>
									<div
										className='charges-table-header bg-light border-bottom px-3 py-2 d-none d-md-flex align-items-center fw-semibold text-muted'
										style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
										<div className='col-md-4 ps-1'>Payment Mode (Name)</div>
										<div className='col-md-4 ps-1'>Charge Type</div>
										<div className='col-md-3 ps-1'>Rate / Value</div>
										<div className='col-md-1 text-center pe-1'>Action</div>
									</div>
									<div className='charges-list-body p-2 d-flex flex-column gap-2 bg-white'>
										{chargesList.map((charge, idx) => {
											const isFlat = charge.type === 'FLAT';
											return (
												<div
													key={charge.id}
													className='charge-row-item p-2 rounded-2 border bg-light bg-opacity-25'>
													<div className='row g-2 align-items-center'>
														{/* Charge Name */}
														<div className='col-12 col-md-4'>
															<label className='d-md-none form-label small fw-semibold text-muted mb-1'>
																Payment Mode #{idx + 1}
															</label>
															<select
																className='form-select form-select-sm'
																value={charge.name}
																onChange={(e) =>
																	handleUpdateCharge(charge.id, 'name', e.target.value)
																}
																disabled={isSubmitting}
																style={{ height: '38px', fontSize: '0.85rem' }}>
																{chargeNamesOptions.map((opt) => {
																	const isAlreadySelected = chargesList.some(
																		(c) => c.id !== charge.id && c.name === opt.value,
																	);
																	return (
																		<option
																			key={opt.value}
																			value={opt.value}
																			disabled={isAlreadySelected}>
																			{opt.label} {isAlreadySelected ? '(Added)' : ''}
																		</option>
																	);
																})}
															</select>
														</div>

														{/* Charge Type */}
														<div className='col-12 col-md-4'>
															<label className='d-md-none form-label small fw-semibold text-muted mb-1'>
																Charge Type
															</label>
															<select
																className='form-select form-select-sm'
																value={charge.type}
																onChange={(e) =>
																	handleUpdateCharge(charge.id, 'type', e.target.value)
																}
																disabled={isSubmitting}
																style={{ height: '38px', fontSize: '0.85rem' }}>
																{chargeTypesOptions.map((opt) => (
																	<option key={opt.value} value={opt.value}>
																		{opt.label}
																	</option>
																))}
															</select>
														</div>

														{/* Charge Value */}
														<div className='col-9 col-md-3'>
															<label className='d-md-none form-label small fw-semibold text-muted mb-1'>
																Rate / Value
															</label>
															<div className='input-group input-group-sm' style={{ height: '38px' }}>
																{isFlat && (
																	<span className='input-group-text bg-white text-muted fw-bold'>
																		₹
																	</span>
																)}
																<input
																	type='number'
																	min='0'
																	step='0.01'
																	className='form-control form-control-sm'
																	placeholder='0.00'
																	value={charge.value}
																	onChange={(e) =>
																		handleUpdateCharge(charge.id, 'value', e.target.value)
																	}
																	disabled={isSubmitting}
																	style={{ fontSize: '0.85rem' }}
																/>
																{!isFlat && (
																	<span className='input-group-text bg-white text-muted fw-bold'>
																		%
																	</span>
																)}
															</div>
														</div>

														{/* Remove Button */}
														<div className='col-3 col-md-1 d-flex justify-content-end justify-content-md-center'>
															<button
																type='button'
																className='btn btn-outline-danger btn-sm p-1 rounded-2'
																title='Remove Charge'
																onClick={() => handleRemoveCharge(charge.id)}
																disabled={isSubmitting}
																style={{
																	width: '36px',
																	height: '36px',
																	display: 'inline-flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																}}>
																<Icon icon='DeleteOutline' size='sm' />
															</button>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}
							{errors.charges && (
								<div className='invalid-feedback d-block mt-1'>{errors.charges}</div>
							)}
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
											{!imageLoadFailed ? (
												<img
													src={imagePreview}
													alt={name ? `${name} Icon` : 'Gateway Icon'}
													onError={() => setImageLoadFailed(true)}
												/>
											) : (
												<Icon icon='AccountBalanceWallet' size='lg' className='text-primary' />
											)}
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
						className='px-4 fw-semibold border'
						style={{ borderRadius: '10px' }}
						onClick={handleClose}
						isDisable={isSubmitting}>
						Cancel
					</Button>
					<Button
						type='submit'
						color='primary'
						className='px-4 fw-semibold'
						style={{ borderRadius: '10px' }}
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


