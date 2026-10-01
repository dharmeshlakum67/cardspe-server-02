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

interface IKycDocumentModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	document: IKycDocumentItem | null;
	onSubmit?: (formData: FormData) => Promise<void>;
	isSubmitting?: boolean;
}

export const KycDocumentModal: FC<IKycDocumentModalProps> = ({
	isOpen,
	setIsOpen,
	document,
	onSubmit,
	isSubmitting = false,
}) => {
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [formValues, setFormValues] = useState<Record<string, any>>({});
	const [existingFiles, setExistingFiles] = useState<string[]>([]);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
	const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; imageUrl: string; title: string }>({
		isOpen: false,
		imageUrl: '',
		title: '',
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	// INITIALIZE FORM VALUES AND PREVIEWS WHEN MODAL OPENS
	useEffect(() => {
		if (isOpen && document) {
			const initialValues: Record<string, any> = {};

			// Seed with document.field_values if present
			if (document.field_values && typeof document.field_values === 'object') {
				Object.entries(document.field_values).forEach(([k, v]) => {
					initialValues[k] = v ?? '';
				});
			}

			// Also ensure each field in schema has an initial value
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

			// If document is already submitted and not rejected, open in View Mode (isEditMode: false)
			// If not submitted or rejected, open directly in Edit Mode (isEditMode: true)
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

	// HANDLE FIELD VALUE CHANGE
	const handleInputChange = (fieldCode: string, value: any) => {
		setFormValues((prev) => ({
			...prev,
			[fieldCode]: value,
		}));
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

		// Validate file types and sizes (max 10MB per file)
		for (const file of newFiles) {
			if (file.size > 10 * 1024 * 1024) {
				showNotification(
					'File Too Large',
					`"${file.name}" exceeds the 10MB file size limit.`,
					'warning',
				);
				return;
			}
		}

		setSelectedFiles((prev) => [...prev, ...newFiles]);

		// Generate local object preview URLs
		const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
		setPreviewUrls((prev) => [...prev, ...newPreviews]);
	};

	// REMOVE NEWLY SELECTED FILE
	const handleRemoveSelectedFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
		setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
	};

	// REMOVE PREVIOUSLY UPLOADED FILE
	const handleRemoveExistingFile = (index: number) => {
		setExistingFiles((prev) => prev.filter((_, i) => i !== index));
	};

	// SUBMIT HANDLER
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate all required fields
		if (document.fields && Array.isArray(document.fields)) {
			for (const field of document.fields) {
				const isReq = Boolean(field.is_required);
				const code = field.field_code || field.code || '';
				const name = field.field_name || field.name || 'Field';
				const val = formValues[code];

				if (isReq && (val === undefined || val === null || String(val).trim() === '')) {
					showNotification(
						'Validation Error',
						`Please fill in required field: "${name}"`,
						'warning',
					);
					return;
				}
			}
		}

		// Validate required files
		const totalFiles = existingFiles.length + selectedFiles.length;
		if (document.required_files_count > 0 && totalFiles < document.required_files_count) {
			showNotification(
				'Missing Attachments',
				`Please upload at least ${document.required_files_count} file(s) for ${document.document_name}. You currently have ${totalFiles}.`,
				'warning',
			);
			return;
		}

		// CONSTRUCT FORM DATA
		const formData = new FormData();
		formData.append('document_id', String(document.document_id));
		formData.append('document_code', document.document_code);
		formData.append('field_values', JSON.stringify(formValues));
		formData.append('existing_file_urls', JSON.stringify(existingFiles));
		selectedFiles.forEach((file) => {
			formData.append('files', file);
		});

		if (onSubmit) {
			await onSubmit(formData);
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

		// FULL WIDTH ONLY FOR TEXTAREA
		const isFullWidth = fieldType === 'textarea';
		const colClass = isFullWidth ? 'col-12' : 'col-12 col-md-6';

		return (
			<div key={fieldCode || index} className={colClass}>
				<label htmlFor={inputId} className='form-label fw-bold small mb-1'>
					{fieldName} {isReq && <span className='text-danger'>*</span>}
				</label>

				{/* 1. TEXT / EMAIL / TEL / URL INPUT */}
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

				{/* 2. NUMBER INPUT */}
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
							if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
								e.preventDefault();
							}
						}}
						onChange={(e) => {
							const rawVal = e.target.value;
							if (rawVal === '') {
								handleInputChange(fieldCode, '');
							} else {
								const sanitized = rawVal.replace(/[^0-9]/g, '');
								handleInputChange(fieldCode, sanitized);
							}
						}}
						required={isReq}
						style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
					/>
				)}

				{/* 3. COMMON DATE PICKER (AS IN FILTERS) */}
				{fieldType === 'date' && (
					isReadOnly ? (
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
					)
				)}

				{/* 4. TEXTAREA */}
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

				{/* 5. DROPDOWN SELECT */}
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

				{/* 6. RADIO BUTTONS GROUP */}
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

				{/* 7. CHECKBOX GROUP */}
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

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg'>
			{/* MODAL HEADER */}
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='kyc-document-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-flex align-items-center justify-content-center rounded-3'
							style={{
								width: '44px',
								height: '44px',
								backgroundColor: '#e0f2fe',
								color: '#0284c7',
								flexShrink: 0,
							}}>
							<Icon icon='VerifiedUser' size='lg' />
						</div>
						<div>
							<div className='d-flex align-items-center gap-2 flex-wrap'>
								<h5 className='fw-bold mb-0 text-dark'>{document.document_name}</h5>
								{document.is_mandatory && (
									<span className='badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1'>
										Required
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

			{/* FORM BODY */}
			<form onSubmit={handleSubmit}>
				<ModalBody className='px-4 py-3'>
					{/* REJECTION REASON ALERT (IF REJECTED) */}
					{status === 'rejected' && document.rejection_reason && (
						<div className='alert alert-danger d-flex align-items-start gap-2 mb-3'>
							<Icon icon='WarningAmber' size='sm' className='mt-1' />
							<div>
								<strong>Submission Rejected:</strong>
								<div className='small'>{document.rejection_reason}</div>
							</div>
						</div>
					)}

					<div className='row g-3'>
						{/* DYNAMIC FIELDS GENERATION */}
						{document.fields && document.fields.length > 0 ? (
							document.fields.map((field, idx) => renderDynamicField(field, idx))
						) : (
							<div className='col-12'>
								<div className='p-3 text-center text-muted border rounded-3 bg-light'>
									<p className='small mb-0'>No specific input fields configured for this document.</p>
								</div>
							</div>
						)}

						{/* ATTACHMENTS / FILE UPLOADS SECTION */}
						<div className='col-12 mt-4 pt-2 border-top'>
							<div className='d-flex align-items-center justify-content-between mb-2'>
								<label className='form-label fw-bold small mb-0'>
									Document Attachments{' '}
									{document.required_files_count > 0 && (
										<span className='text-danger'>* ({document.required_files_count} Required)</span>
									)}
								</label>
								<span className='text-muted small'>Max 5MB per file (PNG, JPG, PDF)</span>
							</div>

							{/* EXISTING UPLOADED FILES PREVIEW */}
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
														{/* REMOVE EXISTING FILE BUTTON (IF NOT READONLY) */}
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

							{/* NEW FILE UPLOAD UPLOADER (IF NOT READONLY) */}
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
										<p className='fw-semibold mb-1 text-dark small'>
											Click to browse or drag & drop document files
										</p>
										<span className='text-muted' style={{ fontSize: '0.75rem' }}>
											PNG, JPG, SVG, WEBP or PDF (max 5MB each)
										</span>
									</div>

									{/* NEWLY SELECTED FILES PREVIEWS (IMAGE THUMBNAILS & CARDS) */}
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
																{/* REMOVE FILE BUTTON */}
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

																{/* THUMBNAIL PREVIEW */}
																<div
																	role='button'
																	tabIndex={0}
																	className='d-flex align-items-center justify-content-center bg-light cursor-pointer'
																	style={{ height: '110px', overflow: 'hidden' }}
																	onClick={() => {
																		if (isImage && fileUrl) {
																			setPreviewModal({
																				isOpen: true,
																				imageUrl: fileUrl,
																				title: file.name,
																			});
																		}
																	}}>
																	{isImage && fileUrl ? (
																		<img
																			src={fileUrl}
																			alt={file.name}
																			className='w-100 h-100 object-fit-cover'
																		/>
																	) : (
																		<div className='text-center p-2'>
																			<Icon icon='PictureAsPdf' size='2x' className='text-danger' />
																			<span className='d-block small text-muted font-monospace mt-1' style={{ fontSize: '0.7rem' }}>
																				PDF
																			</span>
																		</div>
																	)}
																</div>

																{/* FILE NAME & SIZE */}
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
																				onClick={() =>
																					setPreviewModal({
																						isOpen: true,
																						imageUrl: fileUrl,
																						title: file.name,
																					})
																				}>
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
				</ModalBody>

				{/* MODAL FOOTER */}
				<ModalFooter className='px-4 py-3 border-top-0'>
					{/* APPROVED / FULLY READ-ONLY */}
					{isApproved && (
						<Button
							type='button'
							color='light'
							className='px-4 py-2'
							onClick={() => setIsOpen(false)}>
							Close
						</Button>
					)}

					{/* VIEW MODE FOR SUBMITTED / PENDING DOCUMENT */}
					{!isApproved && !isEditMode && (
						<>
							<Button
								type='button'
								color='light'
								className='px-4 py-2'
								onClick={() => setIsOpen(false)}>
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
					)}

					{/* EDIT MODE (OR FIRST-TIME / RE-SUBMISSION) */}
					{!isApproved && isEditMode && (
						<>
							<Button
								type='button'
								color='light'
								className='px-4 py-2'
								onClick={() => {
									if (isSubmitted) {
										setIsEditMode(false);
									} else {
										setIsOpen(false);
									}
								}}
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
										Submitting...
									</>
								) : (
									<>
										<Icon icon='Send' />
										<span>{isSubmitted ? 'Update Submission' : 'Submit Document'}</span>
									</>
								)}
							</Button>
						</>
					)}
				</ModalFooter>
			</form>

			{/* FULL IMAGE PREVIEW MODAL */}
			<ImagePreviewModal
				isOpen={previewModal.isOpen}
				setIsOpen={(open) => setPreviewModal((prev) => ({ ...prev, isOpen: open }))}
				imageUrl={previewModal.imageUrl}
				title={previewModal.title}
			/>
		</Modal>
	);
};

KycDocumentModal.defaultProps = {
	onSubmit: undefined,
	isSubmitting: false,
};

export default KycDocumentModal;
