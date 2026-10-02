/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/no-array-index-key, react/require-default-props, no-nested-ternary, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/interactive-supports-focus */
import React, { FC, useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
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
import { DateRangePicker, ImagePreviewModal } from '../../../../../components/common';
import { IKycDocumentItem, IKycDocumentField } from '../type/kyc-type';
import { getImageUrl } from '../../../../../helpers/helpers';
import kycService from '../service/kycService';

interface IKycDocumentModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	document: IKycDocumentItem | null;
	onSuccess?: () => void;
}

export const KycDocumentModal: FC<IKycDocumentModalProps> = ({
	isOpen,
	setIsOpen,
	document,
	onSuccess,
}) => {
	const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [formValues, setFormValues] = useState<Record<string, any>>({});
	const [existingFiles, setExistingFiles] = useState<string[]>([]);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
	const [requestId, setRequestId] = useState<string>('');
	const [otp, setOtp] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);
	const [previewModal, setPreviewModal] = useState<{
		isOpen: boolean;
		imageUrl: string;
		title: string;
	}>({ isOpen: false, imageUrl: '', title: '' });

	const fileInputRef = useRef<HTMLInputElement>(null);
	const otpInputRef = useRef<HTMLInputElement>(null);

	// AUTO FOCUS OTP INPUT ON OTP STEP
	useEffect(() => {
		if (step === 'OTP') {
			otpInputRef.current?.focus();
		}
	}, [step]);

	// INITIALIZE FORM VALUES AND PREVIEWS WHEN MODAL OPENS
	useEffect(() => {
		if (isOpen && document) {
			setStep('FORM');
			setOtp('');
			setRequestId('');

			const initialValues: Record<string, any> = {};

			if (document.field_values && typeof document.field_values === 'object') {
				Object.entries(document.field_values).forEach(([k, v]) => {
					initialValues[k] = v ?? '';
				});
			}

			if (document.fields && Array.isArray(document.fields)) {
				document.fields.forEach((field) => {
					const code = field.field_code || field.code || '';
					if (code && (initialValues[code] === undefined || initialValues[code] === '')) {
						initialValues[code] = field.value ?? '';
					}
				});
			}

			setFormValues(initialValues);
			setExistingFiles(document.uploaded_files || []);
			setSelectedFiles([]);
			setPreviewUrls([]);

			const currentStatus = (document.status || 'not_submitted').toLowerCase();
			const isAlreadySubmitted =
				document.is_submitted ||
				['submitted', 'pending', 'in_review', 'approved'].includes(currentStatus);
			setIsEditMode(!isAlreadySubmitted);
		}
	}, [isOpen, document]);

	if (!document) return null;

	const status = (document.status || 'not_submitted').toLowerCase();
	const isApproved = status === 'approved';
	const isSubmitted = document.is_submitted || status === 'submitted' || status === 'pending';
	const isReadOnly = isApproved || !isEditMode;
	const isQuickKyc = document.verification_service?.toLowerCase() === 'quick_kyc';

	// CLOSE AND RESET MODAL
	const handleClose = () => {
		setStep('FORM');
		setOtp('');
		setRequestId('');
		setIsOpen(false);
	};

	// HANDLE FIELD VALUE CHANGE
	const handleInputChange = (fieldCode: string, value: any) => {
		setFormValues((prev) => ({ ...prev, [fieldCode]: value }));
	};

	// HANDLE FILE SELECTION
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { files } = e.target;
		if (!files || files.length === 0) return;
		const newFiles: File[] = Array.from(files);
		const maxAllowed = document.required_files_count > 0 ? document.required_files_count : 10;
		const totalCount = existingFiles.length + selectedFiles.length + newFiles.length;
		if (totalCount > maxAllowed) {
			showNotification(
				'File Limit Exceeded',
				`You can upload a maximum of ${maxAllowed} file(s) for this document.`,
				'warning',
			);
			return;
		}
		for (const file of newFiles) {
			if (file.size > 10 * 1024 * 1024) {
				showNotification('File Too Large', `"${file.name}" exceeds the 10MB file size limit.`, 'warning');
				return;
			}
		}
		setSelectedFiles((prev) => [...prev, ...newFiles]);
		const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
		setPreviewUrls((prev) => [...prev, ...newPreviews]);
	};

	const handleRemoveSelectedFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
		setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
	};

	const handleRemoveExistingFile = (index: number) => {
		setExistingFiles((prev) => prev.filter((_, i) => i !== index));
	};

	// VALIDATE REQUIRED FIELDS
	const validateRequiredFields = (): boolean => {
		if (document.fields && Array.isArray(document.fields)) {
			for (const field of document.fields) {
				const isReq = Boolean(field.is_required);
				const code = field.field_code || field.code || '';
				const name = field.field_name || field.name || 'Field';
				const val = formValues[code];
				if (isReq && (val === undefined || val === null || String(val).trim() === '')) {
					showNotification('Validation Error', `Please fill in required field: "${name}"`, 'warning');
					return false;
				}
			}
		}
		return true;
	};

	// STEP 1: INITIAL FORM SUBMIT
	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateRequiredFields()) return;

		const totalFiles = existingFiles.length + selectedFiles.length;
		if (document.required_files_count > 0 && totalFiles < document.required_files_count) {
			showNotification(
				'Missing Attachments',
				`Please upload at least ${document.required_files_count} file(s) for ${document.document_name}. You currently have ${totalFiles}.`,
				'warning',
			);
			return;
		}

		setLoading(true);
		try {
			const formData = new FormData();
			formData.append('document_id', String(document.document_id));

			// Dynamic form fields appended directly
			Object.entries(formValues).forEach(([key, val]) => {
				if (val !== undefined && val !== null) {
					formData.append(key, String(val));
				}
			});

			// Append files
			selectedFiles.forEach((file) => {
				formData.append('files', file);
			});

			// Append existing file URLs
			formData.append('existing_file_urls', JSON.stringify(existingFiles));

			const response = await kycService.submitKycDocument(formData);
			const responseData = (response as any)?.data?.data || (response as any)?.data || response;

			if (responseData?.requires_otp) {
				// Switch modal to OTP step
				setRequestId(responseData.request_id || '');
				setStep('OTP');
				showNotification(
					'OTP Sent',
					responseData.message || (response as any)?.message || 'OTP has been sent to your registered mobile number.',
					'info',
				);
			} else {
				// Non-OTP submission complete or auto-approved
				showNotification(
					'Success',
					responseData?.message || (response as any)?.message || 'KYC document has been submitted successfully.',
					'success',
				);
				handleClose();
				onSuccess?.();
			}
		} catch (err: any) {
			const errorMsg =
				err?.data?.message ||
				err?.response?.data?.message ||
				err?.message ||
				'Failed to submit document.';
			showNotification('Submission Error', errorMsg, 'danger');
		} finally {
			setLoading(false);
		}
	};

	// STEP 2: VERIFY OTP SUBMISSION
	const handleOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!otp || otp.trim().length !== 6) {
			showNotification('Validation Error', 'Please enter a valid 6-digit OTP.', 'warning');
			return;
		}

		setLoading(true);
		try {
			const formData = new FormData();
			formData.append('document_id', String(document.document_id));
			formData.append('request_id', requestId);
			formData.append('otp', otp.trim());

			// Re-append dynamic form fields
			Object.entries(formValues).forEach(([key, val]) => {
				if (val !== undefined && val !== null) {
					formData.append(key, String(val));
				}
			});

			// Re-append existing file URLs
			formData.append('existing_file_urls', JSON.stringify(existingFiles));

			// Re-append files if any
			selectedFiles.forEach((file) => {
				formData.append('files', file);
			});

			const response = await kycService.submitKycDocument(formData);
			const responseData = (response as any)?.data?.data || (response as any)?.data || response;

			showNotification(
				'Verified!',
				responseData?.message || (response as any)?.message || 'Aadhaar verified and approved successfully!',
				'success',
			);
			handleClose();
			onSuccess?.();
		} catch (err: any) {
			const errorMsg =
				err?.data?.message ||
				err?.response?.data?.message ||
				err?.message ||
				'Invalid OTP. Please try again.';
			showNotification('Verification Error', errorMsg, 'danger');
		} finally {
			setLoading(false);
		}
	};

	// RENDER DYNAMIC FIELD INPUT
	const renderDynamicField = (field: IKycDocumentField, index: number) => {
		const fieldName = field.field_name || field.name || `Field #${index + 1}`;
		const fieldCode = field.field_code || field.code || `field_${index}`;
		const fieldType = (field.field_type || field.type || 'text').toLowerCase();
		const isReq = Boolean(field.is_required);
		const placeholder = field.placeholder || `Enter ${fieldName}`;
		const options = Array.isArray(field.options) ? field.options : [];
		const currentValue = formValues[fieldCode] ?? '';
		const inputId = `kyc_field_${fieldCode}_${index}`;
		const isFullWidth = fieldType === 'textarea';
		const colClass = isFullWidth ? 'col-12' : 'col-12 col-md-6';

		return (
			<div key={fieldCode || index} className={colClass}>
				<label htmlFor={inputId} className='form-label fw-bold small mb-1'>
					{fieldName} {isReq && <span className='text-danger'>*</span>}
				</label>

				{/* TEXT / EMAIL / TEL / URL */}
				{(fieldType === 'text' || fieldType === 'email' || fieldType === 'tel' || fieldType === 'url') && (
					<input
						id={inputId}
						type={fieldType}
						className='form-control'
						placeholder={placeholder}
						value={currentValue}
						disabled={isReadOnly}
						onChange={(e) => handleInputChange(fieldCode, e.target.value)}
						required={isReq}
						style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
					/>
				)}

				{/* NUMBER */}
				{fieldType === 'number' && (
					<input
						id={inputId}
						type='number'
						min={0}
						className='form-control'
						placeholder={placeholder}
						value={currentValue}
						disabled={isReadOnly}
						onWheel={(e) => (e.target as HTMLInputElement).blur()}
						onKeyDown={(e) => {
							if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
						}}
						onChange={(e) => {
							const rawVal = e.target.value;
							if (rawVal === '') {
								handleInputChange(fieldCode, '');
							} else {
								handleInputChange(fieldCode, rawVal.replace(/[^0-9]/g, ''));
							}
						}}
						required={isReq}
						style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
					/>
				)}

				{/* DATE */}
				{fieldType === 'date' &&
					(isReadOnly ? (
						<input
							id={inputId}
							type='text'
							className='form-control bg-light'
							value={currentValue && dayjs(currentValue).isValid() ? dayjs(currentValue).format('DD/MM/YYYY') : currentValue || ''}
							disabled
							style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
						/>
					) : (
						<DateRangePicker
							className='kyc-modal-datepicker'
							isRange={false}
							startDate={currentValue ? String(currentValue).split('T')[0] : ''}
							placeholder={placeholder || 'Select Date'}
							onChange={({ startDate }) => handleInputChange(fieldCode, startDate)}
						/>
					))}

				{/* TEXTAREA */}
				{fieldType === 'textarea' && (
					<textarea
						id={inputId}
						rows={3}
						className='form-control'
						placeholder={placeholder}
						value={currentValue}
						disabled={isReadOnly}
						onChange={(e) => handleInputChange(fieldCode, e.target.value)}
						required={isReq}
						style={{ borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
					/>
				)}

				{/* SELECT */}
				{fieldType === 'select' && (
					<select
						id={inputId}
						className='form-select'
						value={currentValue}
						disabled={isReadOnly}
						onChange={(e) => handleInputChange(fieldCode, e.target.value)}
						required={isReq}
						style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
						<option value=''>{placeholder || 'Select an option'}</option>
						{options.map((opt, optIdx) => (
							<option key={opt.value || optIdx} value={opt.value}>
								{opt.label || opt.value}
							</option>
						))}
					</select>
				)}

				{/* RADIO */}
				{fieldType === 'radio' && (
					<div className='d-flex align-items-center flex-wrap gap-3' style={{ minHeight: '38px' }}>
						{options.map((opt, optIdx) => {
							const radioId = `radio_${fieldCode}_${optIdx}`;
							const isChecked = String(currentValue).toLowerCase() === String(opt.value).toLowerCase();
							return (
								<div key={opt.value || optIdx} className='form-check mb-0'>
									<input
										className='form-check-input'
										type='radio'
										name={`radio_group_${fieldCode}`}
										id={radioId}
										value={opt.value}
										checked={isChecked}
										disabled={isReadOnly}
										onChange={() => handleInputChange(fieldCode, opt.value)}
										required={isReq && !currentValue}
									/>
									<label className='form-check-label fw-medium ms-1' htmlFor={radioId}>
										{opt.label || opt.value}
									</label>
								</div>
							);
						})}
					</div>
				)}

				{/* CHECKBOX */}
				{fieldType === 'checkbox' && (
					<div className='d-flex align-items-center flex-wrap gap-3' style={{ minHeight: '38px' }}>
						{options.length > 0 ? (
							options.map((opt, optIdx) => {
								const chkId = `chk_${fieldCode}_${optIdx}`;
								const isChecked = Array.isArray(currentValue)
									? currentValue.includes(opt.value)
									: String(currentValue) === String(opt.value);
								return (
									<div key={opt.value || optIdx} className='form-check mb-0'>
										<input
											className='form-check-input'
											type='checkbox'
											id={chkId}
											value={opt.value}
											checked={isChecked}
											disabled={isReadOnly}
											onChange={(e) => {
												let nextArr = Array.isArray(currentValue) ? [...currentValue] : [];
												if (e.target.checked) {
													nextArr.push(opt.value);
												} else {
													nextArr = nextArr.filter((item) => item !== opt.value);
												}
												handleInputChange(fieldCode, nextArr);
											}}
										/>
										<label className='form-check-label fw-medium ms-1' htmlFor={chkId}>
											{opt.label || opt.value}
										</label>
									</div>
								);
							})
						) : (
							<div className='form-check form-switch mb-0'>
								<input
									className='form-check-input'
									type='checkbox'
									id={`switch_${fieldCode}`}
									checked={Boolean(currentValue)}
									disabled={isReadOnly}
									onChange={(e) => handleInputChange(fieldCode, e.target.checked)}
								/>
								<label className='form-check-label fw-medium ms-2' htmlFor={`switch_${fieldCode}`}>
									{placeholder || fieldName}
								</label>
							</div>
						)}
					</div>
				)}
			</div>
		);
	};

	// RENDER FOOTER BUTTONS
	const renderFooter = () => {
		if (step === 'OTP') {
			return (
				<>
					<Button
						type='button'
						color='light'
						className='px-4 py-2'
						isDisable={loading}
						onClick={() => setStep('FORM')}>
						Back
					</Button>
					<Button
						type='submit'
						color='success'
						className='px-4 py-2 d-inline-flex align-items-center gap-2'
						isDisable={loading || otp.trim().length !== 6}>
						{loading ? (
							<>
								<Spinner isSmall inButton isGrow className='me-1' />
								Verifying...
							</>
						) : (
							<>
								<Icon icon='VerifiedUser' />
								<span>Verify OTP</span>
							</>
						)}
					</Button>
				</>
			);
		}

		if (isApproved) {
			return (
				<Button type='button' color='light' className='px-4 py-2' onClick={handleClose}>
					Close
				</Button>
			);
		}

		if (!isApproved && !isEditMode) {
			return (
				<>
					<Button type='button' color='light' className='px-4 py-2' onClick={handleClose}>
						Close
					</Button>
					<Button
						type='button'
						color='primary'
						className='px-4 py-2 d-inline-flex align-items-center gap-2'
						onClick={() => setIsEditMode(true)}>
						<Icon icon='Edit' />
						<span>Edit Submission</span>
					</Button>
				</>
			);
		}

		return (
			<>
				<Button
					type='button'
					color='light'
					className='px-4 py-2'
					isDisable={loading}
					onClick={() => {
						if (isSubmitted) {
							setIsEditMode(false);
						} else {
							handleClose();
						}
					}}>
					Cancel
				</Button>
				<Button
					type='submit'
					color='primary'
					className='px-4 py-2 d-inline-flex align-items-center gap-2'
					isDisable={loading}>
					{loading ? (
						<>
							<Spinner isSmall inButton isGrow className='me-1' />
							Submitting...
						</>
					) : (
						<>
							<Icon icon={isQuickKyc ? 'VerifiedUser' : 'Send'} />
							<span>{isSubmitted ? 'Update Submission' : 'Submit Document'}</span>
						</>
					)}
				</Button>
			</>
		);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg'>
			{/* MODAL HEADER */}
			<ModalHeader setIsOpen={handleClose} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='kyc-document-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-flex align-items-center justify-content-center rounded-3'
							style={{ width: '44px', height: '44px', backgroundColor: '#e0f2fe', color: '#0284c7', flexShrink: 0 }}>
							<Icon icon={step === 'OTP' ? 'PhoneIphone' : 'VerifiedUser'} size='lg' />
						</div>
						<div>
							<div className='d-flex align-items-center gap-2 flex-wrap'>
								<h5 className='fw-bold mb-0 text-dark'>
									{step === 'OTP' ? 'Enter Aadhaar OTP' : document.document_name}
								</h5>
								{document.is_mandatory && (
									<span className='badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1'>
										Required
									</span>
								)}
								{isQuickKyc && (
									<span className='badge px-2 py-1 bg-info-subtle text-info border border-info-subtle'>
										Quick KYC
									</span>
								)}
								<span
									className={`badge px-2 py-1 ${
										isApproved
											? 'bg-success-subtle text-success border border-success'
											: status === 'rejected'
											? 'bg-danger-subtle text-danger border border-danger'
											: isSubmitted
											? 'bg-info-subtle text-info border border-info'
											: 'bg-light text-muted border'
									}`}>
									{status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
								</span>
							</div>
							<span className='text-muted small' style={{ fontSize: '0.8125rem' }}>
								Code: <strong className='font-monospace'>{document.document_code}</strong>
							</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			{/* FORM */}
			<form onSubmit={step === 'OTP' ? handleOtpSubmit : handleFormSubmit}>
				<ModalBody className='px-4 py-3'>
					{/* STEP 2: OTP VIEW */}
					{step === 'OTP' ? (
						<div className='py-3'>
							<div className='p-4 rounded-3 border text-center' style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
								<div
									className='rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3 shadow-sm'
									style={{ width: 64, height: 64, background: '#eff6ff', color: '#2563eb' }}>
									<Icon icon='Fingerprint' size='2x' />
								</div>
								<h5 className='fw-bold text-dark mb-1'>Aadhaar OTP Verification</h5>
								<p className='text-muted mb-4 mx-auto' style={{ maxWidth: 440, fontSize: '0.875rem' }}>
									A 6-digit OTP has been sent to your Aadhaar-linked mobile number. Enter the code below to complete instant auto-verification.
								</p>

								<div className='d-flex justify-content-center mb-3'>
									<input
										ref={otpInputRef}
										type='text'
										maxLength={6}
										inputMode='numeric'
										className='form-control text-center fw-bold shadow-sm'
										placeholder='------'
										value={otp}
										onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
										style={{
											height: '56px',
											fontSize: '1.75rem',
											letterSpacing: '0.6rem',
											borderRadius: '0.75rem',
											border: '2px solid #93c5fd',
											maxWidth: '260px',
										}}
										required
									/>
								</div>

								<div className='text-muted small mt-2'>
									Didn't receive the OTP or made a typo?{' '}
									<button
										type='button'
										className='btn btn-link btn-sm p-0 text-primary fw-semibold'
										onClick={() => setStep('FORM')}>
										Go back to edit details
									</button>
								</div>
							</div>
						</div>
					) : (
						/* STEP 1: FORM VIEW */
						<>
							{/* REJECTION REASON ALERT */}
							{status === 'rejected' && document.rejection_reason && (
								<div
									className='d-flex align-items-start gap-3 p-3 rounded-3 mb-4'
									style={{
										backgroundColor: '#fef2f2',
										border: '1px solid #fecaca',
									}}>
									<div
										className='d-flex align-items-center justify-content-center rounded-2 flex-shrink-0'
										style={{
											width: '32px',
											height: '32px',
											backgroundColor: '#fee2e2',
											color: '#dc2626',
										}}>
										<Icon icon='WarningAmber' size='md' />
									</div>
									<div className='flex-grow-1'>
										<div
											className='fw-bold mb-1'
											style={{ fontSize: '0.875rem', color: '#991b1b' }}>
											Submission Rejected
										</div>
										<div
											style={{
												fontSize: '0.8125rem',
												color: '#7f1d1d',
												lineHeight: 1.5,
												wordBreak: 'break-word',
											}}>
											{document.rejection_reason}
										</div>
									</div>
								</div>
							)}

							<div className='row g-3'>
								{/* DYNAMIC FIELDS */}
								{document.fields && document.fields.length > 0 ? (
									document.fields.map((field, idx) => renderDynamicField(field, idx))
								) : (
									<div className='col-12'>
										<div className='p-3 text-center text-muted border rounded-3 bg-light'>
											<p className='small mb-0'>No specific input fields configured for this document.</p>
										</div>
									</div>
								)}

								{/* ATTACHMENTS SECTION */}
								<div className='col-12 mt-4 pt-2 border-top'>
									<div className='d-flex align-items-center justify-content-between mb-2'>
										<label className='form-label fw-bold small mb-0'>
											Document Attachments{' '}
											{document.required_files_count > 0 && (
												<span className='text-danger'>* ({document.required_files_count} Required)</span>
											)}
										</label>
										<span className='text-muted small'>Max 10MB per file (PNG, JPG, PDF)</span>
									</div>

									{/* EXISTING UPLOADED FILES */}
									{existingFiles && existingFiles.length > 0 && (
										<div className='mb-3'>
											<span className='small text-muted d-block mb-2 fw-semibold'>
												Previously Uploaded ({existingFiles.length}):
											</span>
											<div className='row g-3'>
												{existingFiles.map((fileUrl, idx) => {
													const fullUrl = getImageUrl(fileUrl);
													const isPdf = /\.pdf$/i.test(fileUrl);
													return (
														<div key={`uploaded_${idx}`} className='col-6 col-sm-4 col-md-3'>
															<div className='card h-100 border shadow-sm rounded-3 overflow-hidden position-relative'>
																{!isReadOnly && (
																	<button
																		type='button'
																		className='btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 rounded-circle d-flex align-items-center justify-content-center shadow'
																		style={{ width: '24px', height: '24px', zIndex: 10 }}
																		onClick={(e) => {
																			e.stopPropagation();
																			handleRemoveExistingFile(idx);
																		}}
																		title='Remove File'>
																		<Icon icon='Close' size='sm' />
																	</button>
																)}
																<div
																	role='button'
																	tabIndex={0}
																	className='d-flex align-items-center justify-content-center bg-light cursor-pointer'
																	style={{ height: '110px', overflow: 'hidden' }}
																	onClick={() => {
																		if (!isPdf) {
																			setPreviewModal({
																				isOpen: true,
																				imageUrl: fullUrl,
																				title: `${document.document_name} - Attachment #${idx + 1}`,
																			});
																		} else {
																			window.open(fullUrl, '_blank');
																		}
																	}}>
																	{!isPdf ? (
																		<img
																			src={fullUrl}
																			alt={`Attachment #${idx + 1}`}
																			className='w-100 h-100 object-fit-cover'
																		/>
																	) : (
																		<div className='text-center p-2'>
																			<Icon icon='PictureAsPdf' size='2x' className='text-danger' />
																			<span className='d-block small text-muted font-monospace mt-1' style={{ fontSize: '0.7rem' }}>
																				PDF Document
																			</span>
																		</div>
																	)}
																</div>
																<div className='p-2 bg-white border-top d-flex align-items-center justify-content-between'>
																	<span className='small text-truncate fw-semibold text-dark' style={{ fontSize: '0.75rem' }}>
																		Attachment #{idx + 1}
																	</span>
																	<span
																		role='button'
																		className='text-primary d-inline-flex align-items-center gap-1 small cursor-pointer'
																		style={{ fontSize: '0.7rem' }}
																		onClick={() => {
																			if (!isPdf) {
																				setPreviewModal({
																					isOpen: true,
																					imageUrl: fullUrl,
																					title: `${document.document_name} - Attachment #${idx + 1}`,
																				});
																			} else {
																				window.open(fullUrl, '_blank');
																			}
																		}}>
																		<Icon icon='Visibility' size='sm' /> View
																	</span>
																</div>
															</div>
														</div>
													);
												})}
											</div>
										</div>
									)}

									{/* NEW FILE UPLOAD */}
									{!isReadOnly && (
										<>
											<input
												ref={fileInputRef}
												type='file'
												accept='image/*,.pdf'
												multiple={document.required_files_count > 1}
												className='d-none'
												onChange={handleFileSelect}
											/>
											<div
												role='button'
												tabIndex={0}
												className='p-4 text-center border border-2 border-dashed rounded-3 bg-light d-flex flex-column align-items-center justify-content-center cursor-pointer'
												onClick={() => fileInputRef.current?.click()}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														fileInputRef.current?.click();
													}
												}}
												style={{ cursor: 'pointer', transition: 'background 0.2s' }}>
												<div
													className='rounded-circle bg-white p-3 shadow-sm text-primary mb-2'
													style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
													<Icon icon='CloudUpload' size='lg' />
												</div>
												<p className='fw-semibold mb-1 text-dark small'>Click to browse or drag &amp; drop document files</p>
												<span className='text-muted' style={{ fontSize: '0.75rem' }}>PNG, JPG, SVG, WEBP or PDF (max 10MB each)</span>
											</div>

											{/* NEWLY SELECTED FILES PREVIEWS */}
											{selectedFiles.length > 0 && (
												<div className='mt-3'>
													<span className='small text-muted d-block mb-2 fw-semibold'>
														Files to Upload ({selectedFiles.length}):
													</span>
													<div className='row g-3'>
														{selectedFiles.map((file, idx) => {
															const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);
															const fileUrl = previewUrls[idx] || '';
															const sizeKb = (file.size / 1024).toFixed(0);
															return (
																<div key={`sel_${idx}`} className='col-6 col-sm-4 col-md-3'>
																	<div className='card h-100 border shadow-sm rounded-3 overflow-hidden position-relative group-preview-card'>
																		<button
																			type='button'
																			className='btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 rounded-circle d-flex align-items-center justify-content-center shadow'
																			style={{ width: '24px', height: '24px', zIndex: 10 }}
																			onClick={(e) => {
																				e.stopPropagation();
																				handleRemoveSelectedFile(idx);
																			}}
																			title='Remove File'>
																			<Icon icon='Close' size='sm' />
																		</button>
																		<div
																			role='button'
																			tabIndex={0}
																			className='d-flex align-items-center justify-content-center bg-light cursor-pointer'
																			style={{ height: '110px', overflow: 'hidden' }}
																			onClick={() => {
																				if (isImage && fileUrl) {
																					setPreviewModal({ isOpen: true, imageUrl: fileUrl, title: file.name });
																				}
																			}}>
																			{isImage && fileUrl ? (
																				<img src={fileUrl} alt={file.name} className='w-100 h-100 object-fit-cover' />
																			) : (
																				<div className='text-center p-2'>
																					<Icon icon='PictureAsPdf' size='2x' className='text-danger' />
																					<span className='d-block small text-muted font-monospace mt-1' style={{ fontSize: '0.7rem' }}>
																						PDF
																					</span>
																				</div>
																			)}
																		</div>
																		<div className='p-2 bg-white border-top'>
																			<div className='small text-truncate fw-semibold text-dark' title={file.name} style={{ fontSize: '0.75rem' }}>
																				{file.name}
																			</div>
																			<div className='d-flex align-items-center justify-content-between text-muted mt-1' style={{ fontSize: '0.7rem' }}>
																				<span>{sizeKb} KB</span>
																				{isImage && (
																					<span
																						role='button'
																						className='text-primary d-inline-flex align-items-center gap-1 cursor-pointer'
																						onClick={() => setPreviewModal({ isOpen: true, imageUrl: fileUrl, title: file.name })}>
																						<Icon icon='Visibility' size='sm' /> View
																					</span>
																				)}
																			</div>
																		</div>
																	</div>
																</div>
															);
														})}
													</div>
												</div>
											)}
										</>
									)}
								</div>
							</div>
						</>
					)}
				</ModalBody>

				{/* MODAL FOOTER */}
				<ModalFooter className='px-4 py-3 border-top-0'>
					{renderFooter()}
				</ModalFooter>
			</form>

			{/* IMAGE PREVIEW MODAL */}
			<ImagePreviewModal
				isOpen={previewModal.isOpen}
				setIsOpen={(open: boolean) =>
					setPreviewModal((prev) => ({ ...prev, isOpen: open }))
				}
				imageUrl={previewModal.imageUrl}
				title={previewModal.title}
			/>
		</Modal>
	);
};

KycDocumentModal.defaultProps = {
	onSuccess: undefined,
};

export default KycDocumentModal;
