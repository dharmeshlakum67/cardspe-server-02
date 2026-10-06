/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props */
import React, { FC } from 'react';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Icon from '../../../../../components/icon/Icon';
import { PillBadge } from '../../../../../components/common/PillBadge';
import { IApiKeyRequest } from '../../../../../type/api-key-request.type';
import { formatDateTime } from '../../../../../helpers/dateUtils';
import '../css/ApiKeyRequestPage.scss';

interface IApiKeyRequestViewModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	request: IApiKeyRequest | null;
}

export const ApiKeyRequestViewModal: FC<IApiKeyRequestViewModalProps> = ({
	isOpen,
	setIsOpen,
	request,
}) => {
	if (!request) return null;

	const isLive = request.key_type === 'live';

	const getStatusColor = (status: string) => {
		if (status === 'approved') return 'success';
		if (status === 'rejected') return 'danger';
		return 'warning';
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered>
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='api-key-request-view-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div className='modal-header-icon-box'>
							<Icon icon='VpnKey' size='lg' />
						</div>
						<div>
							<h5 className='mb-0 fw-bold text-dark'>API Key Request Details (#{request.id})</h5>
							<small className='text-muted'>
								View merchant request status, use case details, and timestamps
							</small>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody className='px-4 pt-3 pb-2'>
				{/* KEY TYPE & STATUS HEADER CARD */}
				<div className='card border mb-3 shadow-sm' style={{ borderRadius: '12px', background: '#fafbfc' }}>
					<div className='card-body p-3'>
						<div className='d-flex align-items-center justify-content-between flex-wrap gap-2'>
							<div className='d-flex align-items-center gap-2'>
								<span className={`indicator-dot ${isLive ? 'live' : 'test'}`} />
								<span className='fw-bold text-dark fs-6'>
									{request.key_type.toUpperCase()} Environment Request
								</span>
							</div>
							<PillBadge color={getStatusColor(request.status)}>
								{request.status.toUpperCase()}
							</PillBadge>
						</div>
					</div>
				</div>

				{/* OWNER / ADMIN DETAILS */}
				{request.admin && (
					<div className='card border mb-3' style={{ borderRadius: '10px' }}>
						<div className='card-header bg-transparent py-2'>
							<div className='d-flex align-items-center gap-2 fw-bold text-muted small text-uppercase'>
								<Icon icon='Person' />
								<span>Requester / Account Info</span>
							</div>
						</div>
						<div className='card-body py-2'>
							<div className='info-item-row'>
								<span className='info-label'>Account Name:</span>
								<span className='info-value'>{request.admin.name || request.admin.username || '-'}</span>
							</div>
							<div className='info-item-row'>
								<span className='info-label'>Username:</span>
								<span className='info-value'>@{request.admin.username || '-'}</span>
							</div>
							<div className='info-item-row'>
								<span className='info-label'>Email Address:</span>
								<span className='info-value'>{request.admin.email_address || '-'}</span>
							</div>
							{request.admin.company_name && (
								<div className='info-item-row'>
									<span className='info-label'>Company:</span>
									<span className='info-value'>{request.admin.company_name}</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* REQUEST REASON */}
				{request.request_reason && (
					<div className='card border mb-3' style={{ borderRadius: '10px' }}>
						<div className='card-header bg-transparent py-2'>
							<div className='d-flex align-items-center gap-2 fw-bold text-muted small text-uppercase'>
								<Icon icon='Description' />
								<span>Integration Reason / Use Case</span>
							</div>
						</div>
						<div className='card-body py-3'>
							<p className='mb-0 text-dark small'>{request.request_reason}</p>
						</div>
					</div>
				)}

				{/* REJECTION REASON IF REJECTED */}
				{request.status === 'rejected' && request.rejection_reason && (
					<div className='card border border-danger mb-3 bg-danger bg-opacity-10' style={{ borderRadius: '10px' }}>
						<div className='card-header bg-transparent border-danger py-2'>
							<div className='d-flex align-items-center gap-2 fw-bold text-danger small text-uppercase'>
								<Icon icon='Cancel' />
								<span>Rejection Reason</span>
							</div>
						</div>
						<div className='card-body py-3'>
							<p className='mb-0 text-danger fw-semibold small'>{request.rejection_reason}</p>
						</div>
					</div>
				)}

				{/* METADATA TIMESTAMPS */}
				<div className='card border mb-0' style={{ borderRadius: '10px' }}>
					<div className='card-header bg-transparent py-2'>
						<div className='d-flex align-items-center gap-2 fw-bold text-muted small text-uppercase'>
							<Icon icon='Info' />
							<span>System Metadata</span>
						</div>
					</div>
					<div className='card-body py-2'>
						<div className='info-item-row'>
							<span className='info-label'>Request ID:</span>
							<span className='info-value text-muted'>#{request.id}</span>
						</div>
						<div className='info-item-row'>
							<span className='info-label'>Requested At:</span>
							<span className='info-value'>{formatDateTime(request.created_at).full}</span>
						</div>
						<div className='info-item-row'>
							<span className='info-label'>Last Updated:</span>
							<span className='info-value'>{formatDateTime(request.updated_at).full}</span>
						</div>
					</div>
				</div>
			</ModalBody>

			<ModalFooter className='border-top-0 pt-0 pb-4 px-4'>
				<button type='button' className='btn-modal-cancel' onClick={() => setIsOpen(false)}>
					Close
				</button>
			</ModalFooter>
		</Modal>
	);
};

export default ApiKeyRequestViewModal;
