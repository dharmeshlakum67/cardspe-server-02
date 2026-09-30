/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { FC, useContext, useState, useEffect } from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import AppBreadcrumbs from '../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import Icon from '../../../components/icon/Icon';
import showNotification from '../../../components/extras/showNotification';
import AuthContext from '../../../contexts/authContext';
import authService from '../auth/services/authService';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../components/bootstrap/Modal';
import Button from '../../../components/bootstrap/Button';
import Spinner from '../../../components/bootstrap/Spinner';
import EditProfileModal from './EditProfileModal';
import { getImageUrl } from '../../../helpers/helpers';
import USERS from '../../../common/data/userDummyData';
import './ProfilePage.scss';

const ProfilePage: FC = () => {
	const { authUser, userData, refetchMe } = useContext(AuthContext);

	// REAL USER DETAILS WITH DESTRUCTURING FROM API RESPONSE
	const name = authUser?.name || userData?.name || '';
	const username = authUser?.username || userData?.username || '';
	const email = authUser?.email_address || userData?.email || '';
	const mobile = authUser?.mobile_number || '';
	const company = authUser?.company_name || '';
	const roleName = authUser?.role?.role_name || (userData as any)?.position || '';
	const rawPic =
		authUser?.profile_picture ||
		authUser?.profile_image ||
		(authUser as any)?.profileImage ||
		userData?.src;
	const profilePic = rawPic ? getImageUrl(rawPic, USERS.JOHN.src) : '';

	// BALANCE & KYC & VERIFICATION STATUS FIELDS FROM API
	const currentBalance =
		authUser?.current_balance !== undefined && authUser?.current_balance !== null
			? authUser.current_balance
			: '0.00';
	const kycStatus = authUser?.kyc_status || 'Pending';
	const isEmailVerified = authUser?.is_email_verified ?? false;
	const isMobileVerified = authUser?.is_mobile_verified ?? false;

	// PROFILE & ADDRESS DETAILS FROM API
	const profile = authUser?.profile || (authUser as any)?.user?.profile;
	const address = profile?.address?.trim() || '-';
	const stateName = (profile?.state?.name || (typeof profile?.state === 'string' ? profile.state : ''))?.trim() || '-';
	const postalCode = profile?.postal_code?.trim() || '-';

	// EDIT PROFILE MODAL STATE
	const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);

	// EMAIL VERIFICATION MODAL STATE
	const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
	const [emailInput, setEmailInput] = useState<string>(email);
	const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);

	// SYNC EMAIL INPUT WHEN AUTHUSER LOADED
	useEffect(() => {
		if (email) {
			setEmailInput(email);
		}
	}, [email]);

	// HANDLE SEND VERIFICATION EMAIL API CALL
	const handleSendVerificationEmail = async () => {
		if (!emailInput || !emailInput.trim()) {
			showNotification('Error', 'Please enter a valid email address', 'danger');
			return;
		}

		setIsSendingEmail(true);
		try {
			const res = await authService.sendVerificationEmail(emailInput.trim());
			showNotification(
				'Success',
				res?.message || 'Verification email sent successfully!',
				'success',
			);
			setIsEmailModalOpen(false);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to send verification email. Please try again.',
				'danger',
			);
		} finally {
			setIsSendingEmail(false);
		}
	};

	return (
		<PageWrapper title='Profile'>
			<Page container='fluid'>
				<div className='profile-page-wrapper'>
					{/* SUBHEADER BREADCRUMB */}
					<div className='profile-top-bar'>
						<AppBreadcrumbs items={[{ label: 'Profile' }]} />
					</div>

					{/* 1. TOP MAIN PROFILE HEADER CARD */}
					<div className='profile-card profile-header-card'>
						{/* TOP ROW: AVATAR, NAME, BADGE, AND ACTION */}
						<div className='profile-header-top'>
							<div className='profile-header-user'>
								<div className='profile-avatar-wrapper'>
									{profilePic ? (
										<img
											src={profilePic}
											alt={name}
											className='profile-avatar-circle'
										/>
									) : (
										<div className='profile-avatar-circle'>
											<Icon icon='Person' />
										</div>
									)}
								</div>

								<div className='profile-user-info'>
									<div className='d-flex align-items-center gap-2 flex-wrap'>
										<h3 className='profile-name mb-0'>{name || 'User Profile'}</h3>
										{roleName && (
											<span className='badge-super-admin'>
												<Icon icon='WorkspacePremium' size='sm' />
												{roleName}
											</span>
										)}
									</div>
									{username && <div className='profile-handle'>@{username}</div>}
								</div>
							</div>

							<button
								type='button'
								className='btn-edit-profile'
								onClick={() => setIsEditProfileModalOpen(true)}>
								<Icon icon='Edit' size='sm' />
								<span>Edit Profile</span>
							</button>
						</div>

						{/* BOTTOM GRID: CONTACT & ADDRESS DETAILS */}
						<div className='profile-header-body'>
							{/* CONTACT INFORMATION */}
							<div className='profile-details-col'>
								<div className='profile-col-heading'>
									<Icon icon='ContactPhone' className='col-heading-icon' />
									<span>Contact Information</span>
								</div>
								<div className='profile-info-list'>
									<div className='profile-info-item'>
										<Icon icon='Phone' className='info-icon' />
										<span>{mobile || '-'}</span>
									</div>
									<div className='profile-info-item'>
										<Icon icon='Mail' className='info-icon' />
										<span>{email || '-'}</span>
									</div>
									<div className='profile-info-item'>
										<Icon icon='Business' className='info-icon' />
										<span>{company || '-'}</span>
									</div>
								</div>
							</div>

							{/* ADDRESS DETAILS */}
							<div className='profile-details-col'>
								<div className='profile-col-heading'>
									<Icon icon='HomeWork' className='col-heading-icon' />
									<span>Address Details</span>
								</div>
								<div className='profile-info-list'>
									<div className='profile-info-item'>
										<Icon icon='Home' className='info-icon' />
										<span title={address}>{address}</span>
									</div>
									<div className='profile-info-item'>
										<Icon icon='Public' className='info-icon' />
										<span>State: {stateName}</span>
									</div>
									<div className='profile-info-item'>
										<Icon icon='PinDrop' className='info-icon' />
										<span>PIN Code: {postalCode}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* 2. METRIC STAT CARDS ROW (WALLET & KYC) */}
					<div className='row g-4 mb-4 align-items-stretch'>
						{/* WALLET CARD */}
						<div className='col-12 col-md-6 d-flex'>
							<div className='profile-card metric-card profile-card-hover w-100 h-100'>
								<div className='metric-card-left'>
									<div className='metric-icon-box bg-wallet'>
										<Icon icon='AccountBalanceWallet' />
									</div>
									<div className='metric-info'>
										<div className='metric-title'>Wallet</div>
										<div className='metric-value mt-1'>₹ {currentBalance}</div>
										<a href='#/wallet' className='metric-link link-blue mt-2'>
											View Wallet
										</a>
									</div>
								</div>
								<div className='metric-arrow-btn' title='View Wallet'>
									<Icon icon='ChevronRight' />
								</div>
							</div>
						</div>

						{/* KYC CARD */}
						<div className='col-12 col-md-6 d-flex'>
							<div className='profile-card metric-card profile-card-hover w-100 h-100'>
								<div className='metric-card-left'>
									<div className='metric-icon-box bg-kyc'>
										<Icon icon='Shield' />
									</div>
									<div className='metric-info'>
										<div className='d-flex align-items-center gap-2'>
											<div className='metric-title mb-0'>KYC</div>
											<span className='kyc-status-pill'>{kycStatus}</span>
										</div>
										<a href='#/kyc' className='metric-link link-purple mt-3'>
											Complete KYC
										</a>
									</div>
								</div>
								<div className='metric-arrow-btn' title='Complete KYC'>
									<Icon icon='ChevronRight' />
								</div>
							</div>
						</div>
					</div>

					{/* 3. MAIN CONTENT TWO-COLUMN LAYOUT (ACCOUNT STATUS & RECENT ACTIVITY) */}
					<div className='row g-4 align-items-stretch'>
						{/* LEFT COLUMN: ACCOUNT STATUS CARD */}
						<div className='col-12 col-md-6 d-flex'>
							<div className='profile-card w-100 h-100'>
								<div className='section-card-header'>
									<div className='header-title-group'>
										<div className='header-icon-circle'>
											<Icon icon='Shield' />
										</div>
										<h5 className='header-title'>Account Status</h5>
									</div>
								</div>

								<div className='status-list-container'>
									{/* EMAIL VERIFICATION STATUS ROW */}
									<div
										role='button'
										tabIndex={isEmailVerified ? -1 : 0}
										className='status-row-item'
										style={{ cursor: isEmailVerified ? 'default' : 'pointer' }}
										title={isEmailVerified ? 'Email is verified' : 'Click to send verification email'}
										onKeyDown={(e) => {
											if (!isEmailVerified && (e.key === 'Enter' || e.key === ' ')) {
												e.preventDefault();
												setIsEmailModalOpen(true);
											}
										}}
										onClick={() => {
											if (!isEmailVerified) {
												setIsEmailModalOpen(true);
											}
										}}>
										<div className='status-row-left'>
											<div className={`status-icon-circle ${isEmailVerified ? 'verified' : 'unverified'}`}>
												<Icon icon={isEmailVerified ? 'CheckCircle' : 'Error'} />
											</div>
											<span className='status-title'>Email Verification</span>
										</div>
										<div className='status-row-right'>
											<span className={`status-text ${isEmailVerified ? 'text-verified' : 'text-unverified'}`}>
												{isEmailVerified ? 'Verified' : 'Not Verified'}
											</span>
											<Icon icon='ChevronRight' className='chevron-icon' />
										</div>
									</div>

									{/* MOBILE VERIFICATION STATUS ROW */}
									<div className='status-row-item'>
										<div className='status-row-left'>
											<div className={`status-icon-circle ${isMobileVerified ? 'verified' : 'unverified'}`}>
												<Icon icon={isMobileVerified ? 'CheckCircle' : 'Error'} />
											</div>
											<span className='status-title'>Mobile Verification</span>
										</div>
										<div className='status-row-right'>
											<span className={`status-text ${isMobileVerified ? 'text-verified' : 'text-unverified'}`}>
												{isMobileVerified ? 'Verified' : 'Not Verified'}
											</span>
											<Icon icon='ChevronRight' className='chevron-icon' />
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* RIGHT COLUMN: RECENT ACTIVITY CARD */}
						<div className='col-12 col-md-6 d-flex'>
							<div className='profile-card w-100 h-100'>
								<div className='section-card-header'>
									<div className='header-title-group'>
										<div className='header-icon-circle'>
											<Icon icon='AccessTime' />
										</div>
										<h5 className='header-title'>Recent Activity</h5>
									</div>
									<a href='#/activity' className='header-action-link'>
										<span>View All</span>
										<Icon icon='ChevronRight' size='sm' />
									</a>
								</div>

								<div className='activity-list-container'>
									{/* ITEM 1: LOGIN */}
									<div className='activity-row-item'>
										<div className='activity-row-left'>
											<div className='activity-icon-sq icon-login'>
												<Icon icon='NorthEast' />
											</div>
											<div className='activity-details'>
												<div className='activity-action'>Login to account</div>
												<div className='activity-meta'>From 192.168.1.1</div>
											</div>
										</div>
										<div className='activity-time'>Today, 09:12 AM</div>
									</div>

									{/* ITEM 2: PROFILE UPDATED */}
									<div className='activity-row-item'>
										<div className='activity-row-left'>
											<div className='activity-icon-sq icon-edit'>
												<Icon icon='Edit' />
											</div>
											<div className='activity-details'>
												<div className='activity-action'>Profile updated</div>
												<div className='activity-meta'>By {name || 'User'}</div>
											</div>
										</div>
										<div className='activity-time'>29 Sep 2026</div>
									</div>

									{/* ITEM 3: PASSWORD CHANGED */}
									<div className='activity-row-item'>
										<div className='activity-row-left'>
											<div className='activity-icon-sq icon-security'>
												<Icon icon='Lock' />
											</div>
											<div className='activity-details'>
												<div className='activity-action'>Password changed</div>
												<div className='activity-meta'>For security</div>
											</div>
										</div>
										<div className='activity-time'>25 Sep 2026</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Page>

			{/* SEND VERIFICATION EMAIL MODAL */}
			<Modal
				isOpen={isEmailModalOpen}
				setIsOpen={setIsEmailModalOpen}
				isCentered>
				<ModalHeader setIsOpen={setIsEmailModalOpen}>
					<ModalTitle id='email-verification-modal-title'>
						Verify Email Address
					</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<div className='py-2'>
						<p className='text-muted small mb-3'>
							Enter your email address below to receive a verification link.
						</p>
						<label htmlFor='verificationEmailInput' className='form-label fw-bold small text-dark'>
							Email Address
						</label>
						<input
							id='verificationEmailInput'
							type='email'
							className='form-control'
							value={emailInput}
							onChange={(e) => setEmailInput(e.target.value)}
							placeholder='Enter your email address'
						/>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button color='light' onClick={() => setIsEmailModalOpen(false)}>
						Cancel
					</Button>
					<Button
						color='primary'
						isDisable={isSendingEmail}
						onClick={handleSendVerificationEmail}>
						{isSendingEmail ? (
							<>
								<Spinner isGrow={false} size='sm' className='me-2' />
								Sending...
							</>
						) : (
							'Send Verification Email'
						)}
					</Button>
				</ModalFooter>
			</Modal>

			{/* EDIT PROFILE MODAL */}
			<EditProfileModal
				isOpen={isEditProfileModalOpen}
				setIsOpen={setIsEditProfileModalOpen}
				authUser={authUser || null}
				onProfileUpdated={async () => {
					await refetchMe?.();
				}}
			/>
		</PageWrapper>
	);
};

export default ProfilePage;
