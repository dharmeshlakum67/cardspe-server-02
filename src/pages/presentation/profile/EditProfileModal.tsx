/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../components/bootstrap/Modal';
import Button from '../../../components/bootstrap/Button';
import Spinner from '../../../components/bootstrap/Spinner';
import Icon from '../../../components/icon/Icon';
import showNotification from '../../../components/extras/showNotification';
import authService, { IAuthUser, IUpdateProfilePayload } from '../auth/services/authService';
import stateService from '../master/state/service/stateService';
import { IState } from '../master/state/type/state-type';
import useDebounce from '../../../hooks/useDebounce';
import USERS from '../../../common/data/userDummyData';
import { getImageUrl } from '../../../helpers/helpers';

interface IEditProfileModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	authUser?: IAuthUser | null;
	onProfileUpdated: () => Promise<void>;
}

export const EditProfileModal: FC<IEditProfileModalProps> = ({
	isOpen,
	setIsOpen,
	authUser,
	onProfileUpdated,
}) => {
	// FORM STATES
	const [name, setName] = useState<string>('');
	const [username, setUsername] = useState<string>('');
	const [emailAddress, setEmailAddress] = useState<string>('');
	const [mobileNumber, setMobileNumber] = useState<string>('');
	const [companyName, setCompanyName] = useState<string>('');
	const [address, setAddress] = useState<string>('');
	const [stateId, setStateId] = useState<number | null>(null);
	const [postalCode, setPostalCode] = useState<string>('');

	// AVATAR UPLOAD & DELETE STATES
	const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
	const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
	const [isImageDeleted, setIsImageDeleted] = useState<boolean>(false);
	const [isSavingImage, setIsSavingImage] = useState<boolean>(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// HAS UNSAVED IMAGE CHANGES (EITHER SELECTED A FILE OR MARKED FOR DELETION)
	const hasImageChanges = Boolean(selectedImageFile || isImageDeleted);

	// STATES LIST FOR DROPDOWN
	const [states, setStates] = useState<IState[]>([]);
	const [isLoadingStates, setIsLoadingStates] = useState<boolean>(false);
	const [stateSearch, setStateSearch] = useState<string>('');
	const debouncedStateSearch = useDebounce(stateSearch, 500);

	// SUBMITTING STATE FOR OVERALL FORM
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	// INITIALIZE FORM VALUES FROM AUTHUSER
	useEffect(() => {
		if (authUser && isOpen) {
			setName(authUser.name || '');
			setUsername(authUser.username || '');
			setEmailAddress(authUser.email_address || '');
			setMobileNumber(authUser.mobile_number || (authUser as any).user?.mobile_number || '');
			setCompanyName(authUser.company_name || '');

			const profile = authUser.profile || (authUser as any).user?.profile;
			setAddress(profile?.address || '');
			setStateId(profile?.state?.id || (profile as any)?.state_id || null);
			setPostalCode(profile?.postal_code || '');

			const rawPic =
				authUser.profile_picture ||
				authUser.profile_image ||
				(authUser as any).profileImage ||
				(authUser as any).user?.profile_picture;
			const initialUrl = getImageUrl(rawPic, USERS.JOHN.src);
			setImagePreviewUrl(initialUrl);
			setSelectedImageFile(null);
			setIsImageDeleted(false);
		}
	}, [authUser, isOpen]);

	// FETCH ACTIVE STATES WITH PAGINATION & SEARCH
	const fetchActiveStates = useCallback(async () => {
		setIsLoadingStates(true);
		try {
			const res = await stateService.getAllActiveStates({
				page: 1,
				limit: 100,
				search: debouncedStateSearch.trim() || undefined,
			});
			const statesData = Array.isArray(res?.data) ? res.data : [];
			setStates(statesData);
		} catch {
			// fallback: try raw active states
			try {
				const rawRes = await stateService.getActiveStates();
				let rawData: IState[] = [];
				if (Array.isArray((rawRes as any)?.data)) {
					rawData = (rawRes as any).data;
				} else if (Array.isArray(rawRes)) {
					rawData = rawRes;
				}
				setStates(rawData);
			} catch (err) {
				setStates([]);
			}
		} finally {
			setIsLoadingStates(false);
		}
	}, [debouncedStateSearch]);

	useEffect(() => {
		if (isOpen) {
			fetchActiveStates();
		}
	}, [isOpen, fetchActiveStates]);

	// HANDLE IMAGE SELECTION (STORES SELECTION LOCALLY WITHOUT CALLING API YET)
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith('image/')) {
				showNotification('Invalid File', 'Please select a valid image file (PNG, JPG, JPEG, WEBP)', 'warning');
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				showNotification('File Too Large', 'Profile image size must be under 5MB', 'warning');
				return;
			}

			setSelectedImageFile(file);
			setIsImageDeleted(false);
			const preview = URL.createObjectURL(file);
			setImagePreviewUrl(preview);
		}
	};

	// HANDLE DELETE CLICK (MARKS IMAGE FOR REMOVAL & RESETS PREVIEW WITHOUT DIRECT API CALL)
	const handleDeleteClick = () => {
		setSelectedImageFile(null);
		setIsImageDeleted(true);
		setImagePreviewUrl(USERS.JOHN.src);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	// DIRECT SAVE IMAGE ACTION (TRIGGERED WHEN USER CLICKS "SAVE CHANGES" UNDER THE AVATAR)
	const handleSaveImageChanges = async () => {
		if (!hasImageChanges) {
			return;
		}

		setIsSavingImage(true);
		try {
			if (selectedImageFile) {
				const formData = new FormData();
				formData.append('profile_image', selectedImageFile);

				const res = await authService.updateProfileImage(formData);
				showNotification('Success', res?.message || 'Profile picture updated successfully!', 'success');
			} else if (isImageDeleted) {
				const formData = new FormData();
				formData.append('is_delete', 'true');

				const res = await authService.updateProfileImage(formData);
				showNotification('Success', res?.message || 'Profile picture removed successfully!', 'success');
			}

			setSelectedImageFile(null);
			setIsImageDeleted(false);
			await onProfileUpdated();
		} catch (error: any) {
			showNotification(
				'Image Update Failed',
				error?.message || 'Failed to update profile image. Please try again.',
				'danger',
			);
		} finally {
			setIsSavingImage(false);
		}
	};

	// HANDLE FULL FORM SUBMISSION (BASIC DETAILS & ADDRESS)
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			showNotification('Validation Error', 'Full Name is required', 'warning');
			return;
		}

		if (!username.trim()) {
			showNotification('Validation Error', 'Username is required', 'warning');
			return;
		}

		if (!emailAddress.trim()) {
			showNotification('Validation Error', 'Email Address is required', 'warning');
			return;
		}

		setIsSubmitting(true);
		try {
			// 1. UPDATE BASIC DETAILS & ADDRESS
			const payload: IUpdateProfilePayload = {
				name: name.trim(),
				username: username.trim(),
				email_address: emailAddress.trim(),
				company_name: companyName.trim() || null,
				address: address.trim() || null,
				state_id: stateId ? Number(stateId) : null,
				postal_code: postalCode.trim() || null,
			};

			const updateRes = await authService.updateProfile(payload);

			// 2. IF IMAGE WAS CHANGED OR DELETED AND NOT SAVED SEPARATELY, PROCESS IT NOW
			if (selectedImageFile) {
				const formData = new FormData();
				formData.append('profile_image', selectedImageFile);

				try {
					await authService.updateProfileImage(formData);
				} catch (imgError: any) {
					showNotification(
						'Image Upload Warning',
						imgError?.message || 'Profile details updated, but image upload encountered an issue.',
						'warning',
					);
				}
			} else if (isImageDeleted) {
				const formData = new FormData();
				formData.append('is_delete', 'true');

				try {
					await authService.updateProfileImage(formData);
				} catch (imgError: any) {
					showNotification(
						'Image Delete Warning',
						imgError?.message || 'Profile details updated, but image removal encountered an issue.',
						'warning',
					);
				}
			}

			showNotification('Success', updateRes?.message || 'Profile updated successfully!', 'success');
			await onProfileUpdated();
			setIsOpen(false);
		} catch (error: any) {
			showNotification(
				'Update Error',
				error?.message || 'Failed to update profile. Please check the entered details.',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='xl'>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id='edit-profile-modal-title'>
					<div className='d-flex align-items-center gap-2'>
						<Icon icon='AccountCircle' color='primary' size='lg' />
						<span className='fw-bold'>Edit Profile Details</span>
					</div>
				</ModalTitle>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody className='p-3 p-md-4'>
					<div className='row g-4'>
						{/* LEFT SIDE: PROFILE PICTURE UPLOAD & ACTION BUTTONS */}
						<div className='col-12 col-md-5 col-lg-4 d-flex flex-column align-items-center text-center'>
							<div
								className='p-4 rounded-4 w-100 h-100 d-flex flex-column align-items-center justify-content-center'
								style={{
									background: '#f8fafc',
									border: '1px solid #e2e8f0',
									minHeight: '290px',
								}}>
								{/* AVATAR PREVIEW WITH "CLICK TO CHANGE" OVERLAY */}
								<div
									role='button'
									tabIndex={0}
									onClick={() => fileInputRef.current?.click()}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											fileInputRef.current?.click();
										}
									}}
									className='position-relative mb-3 rounded-circle shadow overflow-hidden'
									style={{
										width: '140px',
										height: '140px',
										border: '4px solid #ffffff',
										cursor: 'pointer',
									}}
									title='Click to change photo'>
									<img
										src={imagePreviewUrl || USERS.JOHN.src}
										alt='Profile Avatar'
										className='w-100 h-100 object-fit-cover'
										style={{ background: '#e0e7ff' }}
									/>

									{/* OVERLAY WITH CAMERA ICON AND "CLICK TO CHANGE" */}
									<div
										className='position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white px-2'
										style={{
											backgroundColor: 'rgba(15, 23, 42, 0.45)',
											transition: 'all 0.2s ease-in-out',
										}}>
										<Icon icon='CameraAlt' size='2x' className='mb-1' />
										<span className='fw-bold' style={{ fontSize: '0.8rem', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
											Click to change
										</span>
									</div>
								</div>

								{/* ACTION BUTTONS: DELETE & SAVE CHANGES */}
								<div className='d-flex align-items-center gap-2 mb-2 w-100 justify-content-center flex-wrap'>
									<button
										type='button'
										onClick={handleDeleteClick}
										disabled={isSavingImage || isSubmitting}
										className='btn d-inline-flex align-items-center gap-1 px-3 py-2 fw-semibold rounded-pill'
										style={{
											backgroundColor: '#fee2e2',
											color: '#dc2626',
											border: '1px solid #fecaca',
											fontSize: '0.875rem',
											transition: 'all 0.15s ease',
										}}>
										<Icon icon='DeleteOutline' size='sm' />
										<span>Delete</span>
									</button>

									<button
										type='button'
										onClick={handleSaveImageChanges}
										disabled={!hasImageChanges || isSavingImage || isSubmitting}
										className='btn d-inline-flex align-items-center gap-1 px-3 py-2 fw-semibold rounded-pill'
										style={{
											backgroundColor: hasImageChanges ? '#d1fae5' : '#f1f5f9',
											color: hasImageChanges ? '#059669' : '#94a3b8',
											border: hasImageChanges ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
											fontSize: '0.875rem',
											cursor: hasImageChanges ? 'pointer' : 'not-allowed',
											transition: 'all 0.15s ease',
										}}>
										{isSavingImage ? (
											<Spinner isSmall inButton isGrow />
										) : (
											<Icon icon='Check' size='sm' />
										)}
										<span>Save Changes</span>
									</button>
								</div>

								<span className='text-muted' style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
									Allowed JPG, PNG or WEBP. Max size 5MB.
								</span>

								<input
									ref={fileInputRef}
									type='file'
									accept='image/*'
									className='d-none'
									onChange={handleImageChange}
								/>
							</div>
						</div>

						{/* RIGHT SIDE: SCROLLABLE FORM FIELDS */}
						<div
							className='col-12 col-md-7 col-lg-8'
							style={{
								maxHeight: '65vh',
								overflowY: 'auto',
								paddingRight: '0.75rem',
							}}>
							{/* SECTION 1: BASIC INFORMATION */}
							<div className='mb-4'>
								<div className='d-flex align-items-center gap-2 pb-2 mb-3 border-bottom'>
									<Icon icon='Person' color='primary' />
									<span className='fw-bold text-uppercase small text-muted' style={{ letterSpacing: '0.04em' }}>
										Basic Information
									</span>
								</div>
								<div className='row g-3'>
									{/* FULL NAME */}
									<div className='col-12 col-sm-6'>
										<label htmlFor='editNameInput' className='form-label fw-semibold small mb-1'>
											Full Name <span className='text-danger'>*</span>
										</label>
										<input
											id='editNameInput'
											type='text'
											className='form-control role-name-input'
											placeholder='e.g. Dharmesh Lakum'
											value={name}
											onChange={(e) => setName(e.target.value)}
											style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
											required
										/>
									</div>

									{/* USERNAME */}
									<div className='col-12 col-sm-6'>
										<label htmlFor='editUsernameInput' className='form-label fw-semibold small mb-1'>
											Username <span className='text-danger'>*</span>
										</label>
										<input
											id='editUsernameInput'
											type='text'
											className='form-control role-name-input'
											placeholder='e.g. dharmesh@admin'
											value={username}
											onChange={(e) => setUsername(e.target.value)}
											style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
											required
										/>
									</div>

									{/* EMAIL ADDRESS */}
									<div className='col-12 col-sm-6'>
										<label htmlFor='editEmailInput' className='form-label fw-semibold small mb-1'>
											Email Address <span className='text-danger'>*</span>
										</label>
										<input
											id='editEmailInput'
											type='email'
											className='form-control role-name-input'
											placeholder='e.g. dharmesh@example.com'
											value={emailAddress}
											onChange={(e) => setEmailAddress(e.target.value)}
											style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
											required
										/>
									</div>

									{/* MOBILE NUMBER (DISABLED) */}
									<div className='col-12 col-sm-6'>
										<label htmlFor='editMobileInput' className='form-label fw-semibold small mb-1'>
											Mobile Number
										</label>
										<input
											id='editMobileInput'
											type='text'
											className='form-control'
											value={mobileNumber || 'Not Provided'}
											disabled
											readOnly
											style={{
												height: '38px',
												borderRadius: '0.5rem',
												border: '1px solid #e2e8f0',
												background: '#f8fafc',
												color: '#64748b',
												fontSize: '0.9rem',
												cursor: 'not-allowed',
											}}
										/>
									</div>

									{/* COMPANY NAME */}
									<div className='col-12'>
										<label htmlFor='editCompanyInput' className='form-label fw-semibold small mb-1'>
											Company Name <span className='text-muted fw-normal'>(Optional)</span>
										</label>
										<input
											id='editCompanyInput'
											type='text'
											className='form-control role-name-input'
											placeholder='e.g. Nexora Technologies'
											value={companyName}
											onChange={(e) => setCompanyName(e.target.value)}
											style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
										/>
									</div>
								</div>
							</div>

							{/* SECTION 2: ADDRESS & LOCATION */}
							<div>
								<div className='d-flex align-items-center gap-2 pb-2 mb-3 border-bottom'>
									<Icon icon='HomeWork' color='primary' />
									<span className='fw-bold text-uppercase small text-muted' style={{ letterSpacing: '0.04em' }}>
										Address & Location
									</span>
								</div>
								<div className='row g-3'>
									{/* STREET ADDRESS */}
									<div className='col-12'>
										<label htmlFor='editAddressInput' className='form-label fw-semibold small mb-1'>
											Street Address <span className='text-muted fw-normal'>(Optional)</span>
										</label>
										<input
											id='editAddressInput'
											type='text'
											className='form-control role-name-input'
											placeholder='e.g. 19, Sitanagar Society, Punagam'
											value={address}
											onChange={(e) => setAddress(e.target.value)}
											style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
										/>
									</div>

									{/* STATE SELECT (PAGINATED & SEARCHABLE) */}
									<div className='col-12 col-sm-6'>
										<label htmlFor='editStateSelect' className='form-label fw-semibold small mb-1'>
											State <span className='text-muted fw-normal'>(Optional)</span>
										</label>
										<select
											id='editStateSelect'
											className='form-select role-name-input'
											value={stateId !== null ? String(stateId) : ''}
											onChange={(e) => setStateId(e.target.value ? Number(e.target.value) : null)}
											disabled={isLoadingStates}
											style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
											<option value=''>Select State</option>
											{states.map((s) => (
												<option key={s.id} value={s.id}>
													{s.name}
												</option>
											))}
										</select>
										{isLoadingStates && (
											<span className='text-muted small d-block mt-1'>Loading active states...</span>
										)}
									</div>

									{/* POSTAL / PIN CODE */}
									<div className='col-12 col-sm-6'>
										<label htmlFor='editPostalCodeInput' className='form-label fw-semibold small mb-1'>
											PIN Code <span className='text-muted fw-normal'>(Optional)</span>
										</label>
										<input
											id='editPostalCodeInput'
											type='text'
											className='form-control role-name-input'
											placeholder='e.g. 395010'
											value={postalCode}
											onChange={(e) => setPostalCode(e.target.value)}
											style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</ModalBody>
				<ModalFooter className='px-4 py-3'>
					<Button
						type='button'
						color='light'
						onClick={() => setIsOpen(false)}
						isDisable={isSubmitting}>
						Cancel
					</Button>
					<Button type='submit' color='primary' isDisable={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner isSmall inButton isGrow className='me-2' />
								Saving Changes...
							</>
						) : (
							<>
								<Icon icon='Save' className='me-1' />
								Save Changes
							</>
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

EditProfileModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	// eslint-disable-next-line react/forbid-prop-types
	authUser: PropTypes.any,
	onProfileUpdated: PropTypes.func.isRequired,
};

EditProfileModal.defaultProps = {
	authUser: null,
};

export default EditProfileModal;
