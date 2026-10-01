/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, no-nested-ternary, react/require-default-props */
import React, { FC } from 'react';
import Icon from '../../../../../components/icon/Icon';
import Button from '../../../../../components/bootstrap/Button';
import Tooltips from '../../../../../components/bootstrap/Tooltips';
import { IKycDocumentItem } from '../type/kyc-type';

interface IKycDocumentCardProps {
	document: IKycDocumentItem;
	onAction?: (document: IKycDocumentItem) => void;
}

export const KycDocumentCard: FC<IKycDocumentCardProps> = ({ document, onAction }) => {
	const status = (document.status || 'not_submitted').toLowerCase();
	const isSubmitted = document.is_submitted || status === 'submitted' || status === 'pending';
	const isApproved = status === 'approved';
	const isRejected = status === 'rejected';

	// DYNAMIC ICON BASED ON VERIFICATION SERVICE OR DOCUMENT TYPE
	const getDocIcon = () => {
		const code = document.document_code?.toLowerCase() || '';
		if (code.includes('pan')) return 'CreditCard';
		if (code.includes('adhar') || code.includes('aadhar')) return 'Badge';
		if (code.includes('pass') || code.includes('dl') || code.includes('license')) return 'AssignmentInd';
		return 'Description';
	};

	// DYNAMIC STATUS BADGE CONFIGURATION
	const renderStatusBadge = () => {
		if (isApproved) {
			return (
				<span className='kyc-badge kyc-badge-approved'>
					<Icon icon='CheckCircle' size='sm' />
					<span>Approved</span>
				</span>
			);
		}
		if (isRejected) {
			const badge = (
				<span className='kyc-badge kyc-badge-rejected'>
					<Icon icon='Cancel' size='sm' />
					<span>Rejected</span>
				</span>
			);

			if (document.rejection_reason) {
				return (
					<Tooltips title={`Reason: ${document.rejection_reason}`} placement='top'>
						{badge}
					</Tooltips>
				);
			}
			return badge;
		}
		if (isSubmitted) {
			return (
				<span className='kyc-badge kyc-badge-pending'>
					<Icon icon='HourglassTop' size='sm' />
					<span>Submitted</span>
				</span>
			);
		}
		return (
			<span className='kyc-badge kyc-badge-not-submitted'>
				<Icon icon='RadioButtonUnchecked' size='sm' />
				<span>Not Submitted</span>
			</span>
		);
	};

	// FORMAT VERIFICATION SERVICE LABEL
	const getServiceLabel = (service: string) => {
		if (!service) return 'Manual Verification';
		if (service === 'quick_kyc') return 'Quick KYC';
		if (service === 'custom') return 'Custom Verification';
		return service.replace(/_/g, ' ');
	};

	const cardClass = isApproved
		? 'card-approved'
		: isRejected
		? 'card-rejected'
		: 'card-default';

	return (
		<div className={`kyc-doc-card-item ${cardClass}`}>
			{/* CARD HEADER: ICON, TITLE, CODE & BADGES */}
			<div className='kyc-card-header'>
				<div className='d-flex align-items-start gap-3'>
					<div className={`kyc-doc-icon-box ${isApproved ? 'icon-approved' : isRejected ? 'icon-rejected' : isSubmitted ? 'icon-submitted' : ''}`}>
						<Icon icon={getDocIcon()} size='lg' />
					</div>
					<div className='flex-grow-1'>
						<div className='d-flex align-items-center justify-content-between flex-wrap gap-2'>
							<h5 className='kyc-doc-title mb-0'>{document.document_name}</h5>
							<div className='d-flex align-items-center gap-2 flex-wrap'>
								{document.is_mandatory && (
									<span className='kyc-badge kyc-badge-required'>
										Required
									</span>
								)}
								{renderStatusBadge()}
							</div>
						</div>
						<div className='d-flex align-items-center gap-2 mt-1'>
							<span className='kyc-doc-code font-monospace'>{document.document_code}</span>
						</div>
					</div>
				</div>
			</div>

			{/* REJECTION ALERT BANNER (IF REJECTED) */}
			{isRejected && document.rejection_reason && (
				<div className='kyc-rejection-banner mt-3'>
					<Icon icon='WarningAmber' size='sm' />
					<div className='small'>
						<strong>Rejection Reason:</strong> {document.rejection_reason}
					</div>
				</div>
			)}



			{/* CARD FOOTER: ACTION BUTTON */}
			<div className='kyc-card-footer mt-4 pt-3 border-top d-flex align-items-center justify-content-between'>
				<div className='small text-muted'>
					{isApproved ? (
						<span className='text-success d-inline-flex align-items-center gap-1'>
							<Icon icon='Verified' size='sm' /> Verified
						</span>
					) : isSubmitted ? (
						<span className='text-info d-inline-flex align-items-center gap-1'>
							<Icon icon='Schedule' size='sm' /> Under review
						</span>
					) : (
						<span>Action required</span>
					)}
				</div>

				<Button
					type='button'
					color='primary'
					className='btn-sm px-3 d-inline-flex align-items-center gap-1'
					onClick={() => onAction?.(document)}>
					<Icon icon={isApproved ? 'Visibility' : isSubmitted ? 'Visibility' : 'UploadFile'} size='sm' />
					<span>{isApproved || isSubmitted ? 'View Details' : 'Fill & Upload'}</span>
				</Button>
			</div>
		</div>
	);
};

KycDocumentCard.defaultProps = {
	onAction: undefined,
};

export default KycDocumentCard;
