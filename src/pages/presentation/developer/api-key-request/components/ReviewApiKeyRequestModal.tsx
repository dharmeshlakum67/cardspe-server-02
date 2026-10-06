/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props */
import React, { FC, useState, useEffect } from 'react';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../components/icon/Icon';
import showNotification from '../../../../../components/extras/showNotification';
import { PillBadge } from '../../../../../components/common/PillBadge';
import { IApiKeyRequest, IReviewApiKeyRequestPayload } from '../../../../../type/api-key-request.type';
import { formatDateTime } from '../../../../../helpers/dateUtils';
import apiKeyRequestService from '../service/apiKeyRequestService';
import '../css/ApiKeyRequestPage.scss';

interface IReviewApiKeyRequestModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	request: IApiKeyRequest | null;
	onSuccess: () => void;
}

export const ReviewApiKeyRequestModal: FC<IReviewApiKeyRequestModalProps> = ({
	isOpen,
	setIsOpen,
	request,
	onSuccess,
}) => {
	const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
	const [rejectionReason, setRejectionReason] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [validationError, setValidationError] = useState<string>('');

	useEffect(() => {
		if (isOpen) {
			setStatus('approved');
			setRejectionReason('');
			setValidationError('');
		}
	}, [isOpen, request]);

	if (!request) return null;

	const isLive = request.key_type === 'live';

	const getStatusColor = (reqStatus: string) => {
		if (reqStatus === 'approved') return 'success';
		if (reqStatus === 'rejected') return 'danger';
		return 'warning';
	};

	const renderSubmitButtonContent = () => {
		if (isSubmitting) {
			return (
				<>
					<Spinner isSmall isGrow={false} className='me-2' />
					Processing...
				</>
			);
		}
		if (status === 'approved') {
			return (
				<>
					<Icon icon='Check' className='me-1' />
					Approve & Issue Credentials
				</>
			);
		}
		return (
			<>
				<Icon icon='Close' className='me-1' />
				Reject Request
			</>
		);
	};

	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (status === 'rejected' && !rejectionReason.trim()) {
			setValidationError('Please provide a reason for rejecting this API key request.');
			return;
		}

		setValidationError('');
		setIsSubmitting(true);

		try {
			const payload: IReviewApiKeyRequestPayload = {
				status,
				rejection_reason: status === 'rejected' ? rejectionReason.trim() : undefined,
			};

			await apiKeyRequestService.reviewApiKeyRequest(request.id, payload);
			showNotification(
				'Request Reviewed',
				`API Key Request #${request.id} has been ${status.toUpperCase()} successfully.`,
				status === 'approved' ? 'success' : 'warning',
			);
			onSuccess();
			handleClose();
		} catch (error: any) {
			showNotification(
				'Review Failed',
				error?.data?.message || error?.message || 'Could not process request review.',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='lg' isStaticBackdrop={isSubmitting} isCentered>
			<ModalHeader setIsOpen={handleClose} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='review-api-key-request-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div className='modal-header-icon-box'>
							<Icon icon='RateReview' size='lg' />
						</div>
						<div>
							<h5 className='mb-0 fw-bold text-dark'>Review API Key Request #{request.id}</h5>
							<small className='text-muted'>
								Approve to issue new API credentials or reject with an explanation
							</small>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<form onSubmit={handleSubmit}>
				<ModalBody className='px-4 pt-3 pb-2'>
					{/* REQUEST SUMMARY HEADER */}
					<div className='card border mb-4 shadow-sm' style={{ borderRadius: '12px', background: '#fafbfc' }}>
						<div className='card-body p-3'>
							<div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3'>
								<div className='d-flex align-items-center gap-2'>
									<span className={`indicator-dot ${isLive ? 'live' : 'test'}`} />
									<span className='fw-bold text-dark fs-6'>
										{request.key_type.toUpperCase()} Environment Key
									</span>
								</div>
								<PillBadge color={getStatusColor(request.status)} size='sm'>
									{request.status.toUpperCase()}
								</PillBadge>
							</div>

							{/* REQUESTER METADATA */}
							<div className='row g-2 pt-2 border-top'>
								<div className='col-12 col-sm-6'>
									<small className='text-muted d-block'>Requester / Account:</small>
									<span className='fw-semibold text-dark small'>
										{request.admin?.name || request.admin?.username || `Admin #${request.admin_id}`}
									</span>
									{request.admin?.email_address && (
										<span className='text-muted d-block' style={{ fontSize: '0.78rem' }}>
											{request.admin.email_address}
										</span>
									)}
								</div>
								<div className='col-12 col-sm-6'>
									<small className='text-muted d-block'>Requested At:</small>
									<span className='fw-semibold text-dark small'>
										{formatDateTime(request.created_at).full}
									</span>
								</div>
								{request.admin?.company_name && (
									<div className='col-12 mt-1'>
										<small className='text-muted d-block'>Company:</small>
										<span className='fw-semibold text-dark small'>{request.admin.company_name}</span>
									</div>
								)}
							</div>

							{/* REQUEST REASON */}
							{request.request_reason && (
								<div className='mt-2 pt-2 border-top'>
									<small className='text-muted d-block fw-bold'>Integration Use Case:</small>
									<p className='mb-0 small text-dark mt-1 p-2 bg-white rounded border'>
										{request.request_reason}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* DECISION SELECTOR */}
					<div className='mb-4'>
						<label className='form-label fw-bold small text-uppercase text-muted mb-2'>
							Review Decision <span className='text-danger'>*</span>
						</label>
						<div className='row g-3'>
							{/* APPROVE OPTION */}
							<div className='col-12 col-md-6'>
								<div
									role='button'
									tabIndex={0}
									className={`env-card live-card h-100 ${status === 'approved' ? 'active' : ''}`}
									onClick={() => {
										setStatus('approved');
										setValidationError('');
									}}
									onKeyDown={(e) => e.key === 'Enter' && setStatus('approved')}>
									<div>
										<div className='env-card-header'>
											<div className='d-flex align-items-center gap-2'>
												<div className='env-icon-wrapper'>
													<Icon icon='CheckCircle' />
												</div>
												<h6 className='env-card-title text-success'>Approve Request</h6>
											</div>
											<div className='custom-radio-dot'>
												<div className='dot-inner' />
											</div>
										</div>
										<p className='env-card-desc'>
											Generate a new {request.key_type.toUpperCase()} key pair, revoke old active credentials, and notify user.
										</p>
									</div>
								</div>
							</div>

							{/* REJECT OPTION */}
							<div className='col-12 col-md-6'>
								<div
									role='button'
									tabIndex={0}
									className={`env-card test-card h-100 ${status === 'rejected' ? 'active' : ''}`}
									style={{ borderColor: status === 'rejected' ? '#ef4444' : undefined }}
									onClick={() => setStatus('rejected')}
									onKeyDown={(e) => e.key === 'Enter' && setStatus('rejected')}>
									<div>
										<div className='env-card-header'>
											<div className='d-flex align-items-center gap-2'>
												<div className='env-icon-wrapper' style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}>
													<Icon icon='Cancel' />
												</div>
												<h6 className='env-card-title text-danger'>Reject Request</h6>
											</div>
											<div className='custom-radio-dot' style={{ borderColor: status === 'rejected' ? '#ef4444' : undefined, background: status === 'rejected' ? '#ef4444' : undefined }}>
												<div className='dot-inner' style={{ background: '#ffffff', transform: status === 'rejected' ? 'scale(1)' : 'scale(0)' }} />
											</div>
										</div>
										<p className='env-card-desc'>
											Decline this request. Provide a clear rejection explanation for the merchant.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* REJECTION REASON */}
					{status === 'rejected' && (
						<div className='mb-3'>
							<label htmlFor='rejectionReasonInput' className='form-label fw-bold small text-uppercase text-danger'>
								Rejection Reason <span className='text-danger'>*</span>
							</label>
							<textarea
								id='rejectionReasonInput'
								rows={3}
								maxLength={500}
								className={`form-control modern-input-textarea ${validationError ? 'is-invalid border-danger' : ''}`}
								placeholder='Explain why this request is rejected (e.g. Incomplete business verification, Invalid integration scope)...'
								value={rejectionReason}
								onChange={(e) => {
									setRejectionReason(e.target.value);
									if (e.target.value.trim()) setValidationError('');
								}}
							/>
							{validationError && <div className='invalid-feedback d-block mt-1'>{validationError}</div>}
						</div>
					)}
				</ModalBody>

				<ModalFooter className='border-top-0 pt-0 pb-4 px-4 gap-2'>
					<button
						type='button'
						className='btn-modal-cancel'
						onClick={handleClose}
						disabled={isSubmitting}>
						Cancel
					</button>
					<button
						type='submit'
						className={`btn ${status === 'approved' ? 'btn-success' : 'btn-danger'} px-4 fw-semibold rounded-3`}
						disabled={isSubmitting}>
						{renderSubmitButtonContent()}
					</button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default ReviewApiKeyRequestModal;
