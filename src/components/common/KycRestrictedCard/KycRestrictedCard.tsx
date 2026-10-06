/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props */
import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import Icon from '../../icon/Icon';
import Spinner from '../../bootstrap/Spinner';
import AppBreadcrumbs from '../AppBreadcrumbs/AppBreadcrumbs';
import { PAGE_ROUTES } from '../../../constants/pageRoutes';
import { IKycRestrictedCardProps, IKycRequiredError } from './types';
import './KycRestrictedCard.scss';

export const isKycRequiredError = (error: any): boolean => {
	if (!error) return false;
	const errData = error?.data || error?.response?.data || error;
	return Boolean(
		errData?.error_code === 'KYC_REQUIRED' ||
		errData?.is_kyc_required === true ||
		error?.error_code === 'KYC_REQUIRED' ||
		error?.is_kyc_required === true ||
		error?.status === 403 && (errData?.kyc_status || errData?.is_kyc_required),
	);
};

export const extractKycErrorInfo = (error: any): IKycRequiredError | null => {
	if (!error) return null;
	const errData = error?.data || error?.response?.data || error;
	if (!isKycRequiredError(error)) return null;

	return {
		status: errData?.status || 'fail',
		message: errData?.message || error?.message || 'KYC verification is required to access this page.',
		is_kyc_required: Boolean(errData?.is_kyc_required ?? true),
		kyc_status: errData?.kyc_status || errData?.data?.status || 'not_submitted',
		error_code: errData?.error_code || 'KYC_REQUIRED',
		data: errData?.data,
	};
};

export const KycRestrictedCard: FC<IKycRestrictedCardProps> = ({
	title,
	subTitle,
	message,
	errorData,
	onRetry,
	isRetrying = false,
	showBreadcrumbs = false,
	breadcrumbs = [],
	kycPageRoute = `/${PAGE_ROUTES.KYC}`,
	className,
	isCompact = false,
}) => {
	const navigate = useNavigate();

	const extractedError = React.useMemo(() => {
		if (errorData) {
			return extractKycErrorInfo(errorData) || errorData;
		}
		return null;
	}, [errorData]);

	const kycStatus = (extractedError?.kyc_status || 'not_submitted').toLowerCase();
	const isRejected = kycStatus === 'rejected';
	const isPending = kycStatus === 'pending' || kycStatus === 'in_review' || kycStatus === 'submitted';

	// Determine heading
	let cardHeading = title;
	if (!cardHeading) {
		if (isRejected) {
			cardHeading = 'KYC Verification Rejected';
		} else if (isPending) {
			cardHeading = 'KYC Verification Under Review';
		} else {
			cardHeading = 'KYC Verification Required';
		}
	}

	// Determine badge label and color
	let badgeText = 'Action Required';
	let badgeClass = 'badge-warning';
	let iconName = 'Shield';
	let statusClass = 'status-not_submitted';

	if (isRejected) {
		badgeText = 'Verification Rejected';
		badgeClass = 'badge-danger';
		iconName = 'Cancel';
		statusClass = 'status-rejected';
	} else if (isPending) {
		badgeText = 'Under Review';
		badgeClass = 'badge-info';
		iconName = 'HourglassEmpty';
		statusClass = 'status-pending';
	}

	// Determine message
	const displayMessage =
		message ||
		extractedError?.message ||
		'You must complete your KYC identity verification before you can access this section.';

	// Extract Stats if available
	const stats = extractedError?.data;
	const hasStats = Boolean(
		stats &&
		(typeof stats.total_required === 'number' ||
			typeof stats.total_approved === 'number' ||
			typeof stats.total_pending === 'number' ||
			typeof stats.total_rejected === 'number'),
	);

	const handleGoToKyc = () => {
		navigate(kycPageRoute);
	};

	return (
		<div className={classNames('kyc-restricted-container', { compact: isCompact }, className)}>
			{showBreadcrumbs && breadcrumbs.length > 0 && (
				<div className='mb-3'>
					<AppBreadcrumbs items={breadcrumbs} />
				</div>
			)}

			<div className='kyc-restricted-card'>
				<div className='kyc-restricted-body'>
					{/* GLOWING ICON */}
					<div className={classNames('kyc-icon-wrapper', statusClass)}>
						<div className='kyc-pulse-ring' />
						<Icon icon={iconName} size='2x' />
					</div>

					{/* STATUS BADGE */}
					<div>
						<span className={classNames('kyc-status-badge', badgeClass)}>
							<Icon icon='VerifiedUser' size='sm' />
							<span>{badgeText}</span>
						</span>
					</div>

					{/* TITLE & DESCRIPTION */}
					<h3 className='kyc-title'>{cardHeading}</h3>
					{subTitle && <p className='text-muted small mb-2'>{subTitle}</p>}
					<p className='kyc-message'>{displayMessage}</p>

					{/* OPTIONAL STATS SUMMARY */}
					{hasStats && stats && (
						<div className='kyc-stats-grid'>
							{typeof stats.total_required === 'number' && (
								<div className='kyc-stat-item'>
									<span className='stat-value'>{stats.total_required}</span>
									<span className='stat-label'>Required</span>
								</div>
							)}
							{typeof stats.total_approved === 'number' && (
								<div className='kyc-stat-item'>
									<span className='stat-value text-success'>{stats.total_approved}</span>
									<span className='stat-label'>Approved</span>
								</div>
							)}
							{typeof stats.total_pending === 'number' && (
								<div className='kyc-stat-item'>
									<span className='stat-value text-warning'>{stats.total_pending}</span>
									<span className='stat-label'>Pending</span>
								</div>
							)}
							{typeof stats.total_rejected === 'number' && (
								<div className='kyc-stat-item'>
									<span className='stat-value text-danger'>{stats.total_rejected}</span>
									<span className='stat-label'>Rejected</span>
								</div>
							)}
						</div>
					)}

					{/* ACTIONS */}
					<div className='kyc-actions'>
						<button
							type='button'
							className='btn-kyc-primary'
							onClick={handleGoToKyc}>
							<Icon icon='VerifiedUser' size='sm' />
							<span>
								{isPending ? 'View KYC Status' : 'Complete KYC Verification'}
							</span>
							<Icon icon='ArrowForward' size='sm' />
						</button>

						{onRetry && (
							<button
								type='button'
								className='btn-kyc-secondary'
								onClick={onRetry}
								disabled={isRetrying}>
								{isRetrying ? (
									<>
										<Spinner isSmall isGrow />
										<span>Checking...</span>
									</>
								) : (
									<>
										<Icon icon='Refresh' size='sm' />
										<span>Re-check Access</span>
									</>
								)}
							</button>
						)}
					</div>

					{/* FOOTER NOTE */}
					<div className='kyc-help-note'>
						<Icon icon='Info' size='sm' />
						<span>Once submitted and approved by the admin team, access will be enabled immediately.</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default KycRestrictedCard;
