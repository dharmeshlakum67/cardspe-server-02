/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useEffect, useRef, useState } from 'react';
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
import { IServiceCategory, ServiceCategoryStatusType } from './type/service-category-type';
import constantService, { IConstantOption } from '../../../../services/constantService';
import { getImageUrl } from '../../../../helpers/helpers';
import { ImagePreviewModal } from '../../../../components/common';
import './service-category.scss';

interface IServiceCategoryModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	categoryData?: IServiceCategory | null;
	onSubmit: (payload: FormData) => Promise<void>;
	isSubmitting: boolean;
}

export const ServiceCategoryModal: FC<IServiceCategoryModalProps> = ({
	isOpen,
	setIsOpen,
	categoryData,
	onSubmit,
	isSubmitting,
}) => {
	const isEdit = Boolean(categoryData);
	const [name, setName] = useState<string>('');
	const [displayOrder, setDisplayOrder] = useState<string>('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>('');
	const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
	const [status, setStatus] = useState<ServiceCategoryStatusType>('active');
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [isDeleteIcon, setIsDeleteIcon] = useState<boolean>(false);

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
				// Keep default options
			}
		};
		loadConstants();
		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (categoryData && isOpen) {
			setName(categoryData.name || '');
			setDisplayOrder(
				categoryData.display_order !== null && categoryData.display_order !== undefined
					? String(categoryData.display_order)
					: '',
			);
			setSelectedFile(null);
			setIsDeleteIcon(false);
			const rawIcon = categoryData.icon || '';
			setImagePreview(rawIcon ? getImageUrl(rawIcon) : '');
			setStatus(categoryData.status || 'active');
		} else if (isOpen) {
			setName('');
			setDisplayOrder('');
			setSelectedFile(null);
			setIsDeleteIcon(false);
			setImagePreview('');
			setStatus('active');
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}, [categoryData, isOpen]);

	// HANDLE USER IMAGE FILE SELECTION
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith('image/')) {
				showNotification('Invalid File', 'Please select an image file (PNG, JPG, SVG, WEBP)', 'warning');
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				showNotification('File Too Large', 'Category image size must be under 5MB', 'warning');
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
		if (isEdit && categoryData?.icon) {
			setIsDeleteIcon(true);
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	// SUBMIT WITH FORMDATA
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			showNotification('Validation Error', 'Category name is required', 'warning');
			return;
		}

		const formData = new FormData();
		formData.append('name', name.trim());
		formData.append('status', status);

		if (displayOrder.trim() !== '') {
			formData.append('display_order', displayOrder.trim());
		}

		if (selectedFile) {
			formData.append('icon', selectedFile);
		} else if (isDeleteIcon) {
			formData.append('is_delete_icon', 'true');
		}

		await onSubmit(formData);
	};

	return (
		<>
			<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg'>
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='service-category-modal-title'>
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
							<Icon icon={isEdit ? 'Edit' : 'Category'} size='lg' />
						</div>
						<div>
							<h5 className='fw-bold mb-0 text-dark'>
								{isEdit ? 'Edit Service Category' : 'Create Service Category'}
							</h5>
							<span className='text-muted small' style={{ fontSize: '0.8125rem' }}>
								{isEdit
									? 'Update service category details and activation status.'
									: 'Add a new service category to keep your services organized.'}
							</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody className='px-4 py-3'>
					<div className='row g-3'>
						{/* ROW 1: CATEGORY NAME (FULL WIDTH) */}
						<div className='col-12'>
							<label htmlFor='categoryNameInput' className='form-label fw-semibold small mb-1'>
								Category Name <span className='text-danger'>*</span>
							</label>
							<input
								id='categoryNameInput'
								type='text'
								maxLength={100}
								className='form-control role-name-input'
								placeholder='e.g. Credit Card, Verification, Utility'
								value={name}
								onChange={(e) => setName(e.target.value)}
								style={{
									height: '42px',
									borderRadius: '0.5rem',
									border: '1px solid #cbd5e1',
									fontSize: '0.9rem',
								}}
								required
							/>
							<div className='text-end text-muted mt-1' style={{ fontSize: '0.75rem' }}>
								{name.length}/100
							</div>
						</div>

						{/* ROW 2: LEFT = CATEGORY IMAGE UPLOADER, RIGHT = STATUS */}
						{/* LEFT COLUMN: UPLOAD BOX */}
						<div className='col-12 col-md-6'>
							<label className='form-label fw-semibold small mb-1 d-block'>
								Category Image <span className='text-muted fw-normal'>(Optional)</span>
							</label>
							<div
								role='button'
								tabIndex={0}
								onClick={() => fileInputRef.current?.click()}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										fileInputRef.current?.click();
									}
								}}
								className='d-flex flex-column align-items-center justify-content-center p-3 rounded-3 position-relative cursor-pointer'
								style={{
									minHeight: '124px',
									background: '#f8fafc',
									border: '1.5px dashed #cbd5e1',
									borderRadius: '0.75rem',
									transition: 'all 0.2s ease',
								}}>
								{imagePreview ? (
									<div
										className='modal-image-preview-wrapper position-relative d-flex align-items-center justify-content-center w-100 h-100'
										style={{ minHeight: '94px' }}>
										<img
											src={imagePreview}
											alt='Category Preview'
											className='rounded-2 object-fit-contain'
											style={{ maxHeight: '84px', maxWidth: '100%' }}
										/>

										{/* HOVER OVERLAY WITH ACTIONS */}
										<div className='modal-image-hover-actions position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center gap-2 rounded-2'>
											{/* EYE BUTTON TO VIEW FULL SIZE OVERLAY */}
											<button
												type='button'
												className='btn btn-light btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center shadow-sm text-primary'
												style={{ width: '32px', height: '32px' }}
												onClick={(e: React.MouseEvent) => {
													e.stopPropagation();
													setIsPreviewOpen(true);
												}}
												title='View full size image'>
												<Icon icon='Visibility' size='sm' />
											</button>

											{/* CHANGE BUTTON */}
											<button
												type='button'
												className='btn btn-light btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center shadow-sm text-dark'
												style={{ width: '32px', height: '32px' }}
												onClick={(e: React.MouseEvent) => {
													e.stopPropagation();
													fileInputRef.current?.click();
												}}
												title='Change image'>
												<Icon icon='Edit' size='sm' />
											</button>

											{/* REMOVE BUTTON */}
											<button
												type='button'
												className='btn btn-danger btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center shadow-sm'
												style={{ width: '32px', height: '32px' }}
												onClick={(e: React.MouseEvent) => {
													e.stopPropagation();
													handleClearImage();
												}}
												title='Remove image'>
												<Icon icon='DeleteOutline' size='sm' />
											</button>
										</div>
									</div>
								) : (
									<div className='d-flex flex-column align-items-center justify-content-center text-center'>
										<div
											className='rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-sm'
											style={{
												width: '44px',
												height: '44px',
												backgroundColor: '#e0f2fe',
												color: '#0284c7',
											}}>
											<Icon icon='AddPhotoAlternate' size='lg' />
										</div>
										<span className='fw-semibold text-dark' style={{ fontSize: '0.8125rem' }}>
											Click to upload image
										</span>
										<span className='text-muted' style={{ fontSize: '0.72rem' }}>
											Supports JPG, PNG, SVG (Max 5MB)
										</span>
									</div>
								)}

								<input
									ref={fileInputRef}
									type='file'
									accept='image/*,.svg'
									className='d-none'
									onChange={handleFileSelect}
								/>
							</div>
						</div>

						{/* RIGHT COLUMN: DISPLAY ORDER & STATUS (& SLUG IN EDIT MODE) */}
						<div className='col-12 col-md-6 d-flex flex-column justify-content-start'>
							<div className='mb-2'>
								<label htmlFor='categoryDisplayOrderInput' className='form-label fw-semibold small mb-1'>
									Display Order <span className='text-muted fw-normal'>(Optional)</span>
								</label>
								<input
									id='categoryDisplayOrderInput'
									type='number'
									min='0'
									className='form-control role-name-input'
									placeholder='e.g. 1, 2, 10'
									value={displayOrder}
									onChange={(e) => setDisplayOrder(e.target.value)}
									style={{
										height: '42px',
										borderRadius: '0.5rem',
										border: '1px solid #cbd5e1',
										fontSize: '0.9rem',
									}}
								/>
							</div>

							<div>
								<label htmlFor='categoryStatusSelect' className='form-label fw-semibold small mb-1'>
									Status <span className='text-danger'>*</span>
								</label>
								<select
									id='categoryStatusSelect'
									className='form-select role-name-input'
									value={status}
									onChange={(e) => setStatus(e.target.value as ServiceCategoryStatusType)}
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

							{/* SLUG FIELD (EDIT MODE ONLY - IMMUTABLE / READ-ONLY) */}
							{isEdit && categoryData?.slug && (
								<div className='mt-2'>
									<label htmlFor='categorySlugInput' className='form-label fw-semibold small mb-1'>
										Category Slug <span className='text-muted fw-normal'>(Read-only)</span>
									</label>
									<input
										id='categorySlugInput'
										type='text'
										className='form-control font-monospace'
										value={categoryData.slug}
										disabled
										readOnly
										style={{
											height: '38px',
											borderRadius: '0.5rem',
											border: '1px solid #e2e8f0',
											background: '#f8fafc',
											color: '#64748b',
											fontSize: '0.85rem',
											cursor: 'not-allowed',
										}}
									/>
								</div>
							)}
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
								{isEdit ? 'Saving Changes...' : 'Creating Category...'}
							</>
						) : (
							<>
								<Icon icon='Save' />
								{isEdit ? 'Save Changes' : 'Create Category'}
							</>
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>

		{/* IMAGE PREVIEW LIGHTBOX OVERLAY */}
		<ImagePreviewModal
			isOpen={isPreviewOpen}
			setIsOpen={setIsPreviewOpen}
			imageUrl={imagePreview}
			title={name ? `${name} Image` : 'Category Image'}
		/>
	</>
	);
};

ServiceCategoryModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	// eslint-disable-next-line react/forbid-prop-types
	categoryData: PropTypes.any,
	onSubmit: PropTypes.func.isRequired,
	isSubmitting: PropTypes.bool.isRequired,
};

ServiceCategoryModal.defaultProps = {
	categoryData: null,
};

export default ServiceCategoryModal;
