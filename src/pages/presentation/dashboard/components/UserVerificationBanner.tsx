/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react/require-default-props */
import React, { FC } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../../components/icon/Icon';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { TIcons } from '../../../../type/icons-type';

interface IUserVerificationBannerProps {
	isMobileVerified?: boolean;
	isEmailVerified?: boolean;
	kycStatus?: string;
	isSuperAdmin?: boolean;
	isLoading?: boolean;
}

export const UserVerificationBanner: FC<IUserVerificationBannerProps> = ({
	isMobileVerified = false,
	isEmailVerified = false,
	kycStatus = 'not_submitted',
	isSuperAdmin = false,
	isLoading = false,
}) => {
	const navigate = useNavigate();

	const handleProfileRedirect = () => {
		navigate(`/${PAGE_ROUTES.PROFILE}`);
	};

	const handleKycRedirect = () => {
		navigate(`/${PAGE_ROUTES.KYC}`);
	};

	if (isLoading) {
		return (
			<div className='verification-status-container mb-4'>
				<div className='verification-grid'>
					<div className='verification-card skeleton-box' style={{ height: '76px' }} />
					<div className='verification-card skeleton-box' style={{ height: '76px' }} />
					{!isSuperAdmin && (
						<div className='verification-card skeleton-box' style={{ height: '76px' }} />
					)}
				</div>
			</div>
		);
	}

	const normalizedKyc = (kycStatus || 'not_submitted').toString().trim().toLowerCase();

	const getKycConfig = () => {
		switch (normalizedKyc) {
			case 'approved':
				return {
					label: 'KYC Verified',
					badgeText: 'Approved',
					themeClass: 'status-verified',
					pillClass: 'pill-verified',
					pillIcon: 'CheckCircle' as TIcons,
					icon: 'VerifiedUser' as TIcons,
					subtitle: 'Identity verified successfully',
					actionText: 'View Details',
				};
			case 'pending':
			case 'in_review':
			case 'under_review':
				return {
					label: 'KYC Under Review',
					badgeText: 'Pending',
					themeClass: 'status-pending',
					pillClass: 'pill-pending',
					pillIcon: 'HourglassEmpty' as TIcons,
					icon: 'HourglassEmpty' as TIcons,
					subtitle: 'Verification documents in review',
					actionText: 'Check Status',
				};
			case 'rejected':
				return {
					label: 'KYC Rejected',
					badgeText: 'Action Needed',
					themeClass: 'status-rejected',
					pillClass: 'pill-rejected',
					pillIcon: 'Cancel' as TIcons,
					icon: 'Cancel' as TIcons,
					subtitle: 'Verification was rejected • Re-submit',
					actionText: 'Re-submit KYC',
				};
			case 'not_submitted':
			default:
				return {
					label: 'KYC Verification',
					badgeText: 'Not Completed',
					themeClass: 'status-unverified',
					pillClass: 'pill-unverified',
					pillIcon: 'Warning' as TIcons,
					icon: 'Shield' as TIcons,
					subtitle: 'KYC pending • Click to complete verification',
					actionText: 'Complete KYC',
				};
		}
	};

	const kycConfig = getKycConfig();

	return (
		<div className='verification-status-container mb-4'>
			<div className='verification-grid'>
				{/* 1. MOBILE VERIFICATION CARD */}
				<div
					className={`verification-card ${
						isMobileVerified ? 'status-verified' : 'status-unverified'
					}`}
					onClick={handleProfileRedirect}
					role='button'
					tabIndex={0}
					title='Click to go to Profile'>
					<div className='card-left'>
						<div className='status-icon-bubble'>
							<Icon icon={isMobileVerified ? 'Smartphone' : 'PhoneAndroid'} size='lg' />
						</div>
						<div className='status-info'>
							<div className='status-header-line'>
								<span className='status-title'>Mobile Verification</span>
								<span
									className={`status-pill ${
										isMobileVerified ? 'pill-verified' : 'pill-unverified'
									}`}>
									<Icon
										icon={isMobileVerified ? 'CheckCircle' : 'Warning'}
										size='sm'
									/>
									{isMobileVerified ? 'Verified' : 'Unverified'}
								</span>
							</div>
							<p className='status-subtext'>
								{isMobileVerified
									? 'Mobile number is verified'
									: 'Action required • Click to verify in profile'}
							</p>
						</div>
					</div>
					<div className='card-action-btn'>
						<span className='action-label'>
							{isMobileVerified ? 'Profile' : 'Verify'}
						</span>
						<Icon icon='ChevronRight' size='sm' />
					</div>
				</div>

				{/* 2. EMAIL VERIFICATION CARD */}
				<div
					className={`verification-card ${
						isEmailVerified ? 'status-verified' : 'status-unverified'
					}`}
					onClick={handleProfileRedirect}
					role='button'
					tabIndex={0}
					title='Click to go to Profile'>
					<div className='card-left'>
						<div className='status-icon-bubble'>
							<Icon icon='Email' size='lg' />
						</div>
						<div className='status-info'>
							<div className='status-header-line'>
								<span className='status-title'>Email Verification</span>
								<span
									className={`status-pill ${
										isEmailVerified ? 'pill-verified' : 'pill-unverified'
									}`}>
									<Icon
										icon={isEmailVerified ? 'CheckCircle' : 'Warning'}
										size='sm'
									/>
									{isEmailVerified ? 'Verified' : 'Unverified'}
								</span>
							</div>
							<p className='status-subtext'>
								{isEmailVerified
									? 'Email address is verified'
									: 'Action required • Click to verify in profile'}
							</p>
						</div>
					</div>
					<div className='card-action-btn'>
						<span className='action-label'>
							{isEmailVerified ? 'Profile' : 'Verify'}
						</span>
						<Icon icon='ChevronRight' size='sm' />
					</div>
				</div>

				{/* 3. KYC VERIFICATION CARD (EXEMPT FOR SUPER ADMIN) */}
				{!isSuperAdmin && (
					<div
						className={`verification-card ${kycConfig.themeClass}`}
						onClick={handleKycRedirect}
						role='button'
						tabIndex={0}
						title='Click to go to KYC page'>
						<div className='card-left'>
							<div className='status-icon-bubble'>
								<Icon icon={kycConfig.icon} size='lg' />
							</div>
							<div className='status-info'>
								<div className='status-header-line'>
									<span className='status-title'>{kycConfig.label}</span>
									<span className={`status-pill ${kycConfig.pillClass}`}>
										<Icon icon={kycConfig.pillIcon} size='sm' />
										{kycConfig.badgeText}
									</span>
								</div>
								<p className='status-subtext'>{kycConfig.subtitle}</p>
							</div>
						</div>
						<div className='card-action-btn'>
							<span className='action-label'>{kycConfig.actionText}</span>
							<Icon icon='ChevronRight' size='sm' />
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

(UserVerificationBanner as any).propTypes = {
	isMobileVerified: PropTypes.bool,
	isEmailVerified: PropTypes.bool,
	kycStatus: PropTypes.string,
	isSuperAdmin: PropTypes.bool,
	isLoading: PropTypes.bool,
};

UserVerificationBanner.defaultProps = {
	isMobileVerified: false,
	isEmailVerified: false,
	kycStatus: 'not_submitted',
	isSuperAdmin: false,
	isLoading: false,
};

export default UserVerificationBanner;
