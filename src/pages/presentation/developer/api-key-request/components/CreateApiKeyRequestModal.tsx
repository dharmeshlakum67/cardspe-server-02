/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props */
import React, { FC, useState } from 'react';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../components/icon/Icon';
import showNotification from '../../../../../components/extras/showNotification';
import { isKycRequiredError } from '../../../../../components/common';
import { TApiKeyType, ICreateApiKeyRequestPayload } from '../../../../../type/api-key-request.type';
import apiKeyRequestService from '../service/apiKeyRequestService';
import '../css/ApiKeyRequestPage.scss';

interface ICreateApiKeyRequestModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	onSuccess: () => void;
	defaultKeyType?: TApiKeyType;
}

export const CreateApiKeyRequestModal: FC<ICreateApiKeyRequestModalProps> = ({
	isOpen,
	setIsOpen,
	onSuccess,
	defaultKeyType = 'test',
}) => {
	const [keyType, setKeyType] = useState<TApiKeyType>(defaultKeyType);
	const [requestReason, setRequestReason] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	React.useEffect(() => {
		if (isOpen) {
			setKeyType(defaultKeyType);
		}
	}, [isOpen, defaultKeyType]);

	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
		setRequestReason('');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const payload: ICreateApiKeyRequestPayload = {
				key_type: keyType,
				request_reason: requestReason.trim() || undefined,
			};

			await apiKeyRequestService.createApiKeyRequest(payload);
			showNotification(
				'Request Submitted',
				`Your ${keyType.toUpperCase()} API key request has been submitted for admin approval.`,
				'success',
			);
			onSuccess();
			handleClose();
		} catch (error: any) {
			if (isKycRequiredError(error)) {
				showNotification(
					'KYC Verification Required',
					error?.data?.message || error?.message || 'Please complete your KYC verification before requesting API credentials.',
					'warning',
				);
			} else {
				showNotification(
					'Submission Failed',
					error?.data?.message || error?.message || 'Could not submit API key request.',
					'danger',
				);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='lg' isStaticBackdrop={isSubmitting} isCentered>
			<ModalHeader setIsOpen={handleClose} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='create-api-key-request-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div className='modal-header-icon-box'>
							<Icon icon='VpnKey' size='lg' />
						</div>
						<div>
							<h5 className='mb-0 fw-bold text-dark'>Request API Credentials</h5>
							<small className='text-muted'>
								Submit a request to generate new API credentials for programmatic access
							</small>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<form onSubmit={handleSubmit}>
				<ModalBody className='px-4 pt-3 pb-2'>
					{/* ENVIRONMENT SELECTOR */}
					<div className='mb-4'>
						<label className='form-label fw-bold small text-uppercase text-muted mb-2'>
							Select Environment <span className='text-danger'>*</span>
						</label>
						<div className='row g-3'>
							{/* TEST KEY (SANDBOX) */}
							<div className='col-12 col-md-6'>
								<div
									role='button'
									tabIndex={0}
									className={`env-card test-card h-100 ${keyType === 'test' ? 'active' : ''}`}
									onClick={() => setKeyType('test')}
									onKeyDown={(e) => e.key === 'Enter' && setKeyType('test')}>
									<div>
										<div className='env-card-header'>
											<div className='d-flex align-items-center gap-2'>
												<div className='env-icon-wrapper'>
													<Icon icon='Science' />
												</div>
												<h6 className='env-card-title'>Test Sandbox</h6>
											</div>
											<div className='custom-radio-dot'>
												<div className='dot-inner' />
											</div>
										</div>
										<p className='env-card-desc'>
											For staging, simulated webhooks, and testing integrations without processing real transactions.
										</p>
									</div>
								</div>
							</div>

							{/* LIVE KEY (PRODUCTION) */}
							<div className='col-12 col-md-6'>
								<div
									role='button'
									tabIndex={0}
									className={`env-card live-card h-100 ${keyType === 'live' ? 'active' : ''}`}
									onClick={() => setKeyType('live')}
									onKeyDown={(e) => e.key === 'Enter' && setKeyType('live')}>
									<div>
										<div className='env-card-header'>
											<div className='d-flex align-items-center gap-2'>
												<div className='env-icon-wrapper'>
													<Icon icon='RocketLaunch' />
												</div>
												<h6 className='env-card-title'>Live Production</h6>
											</div>
											<div className='custom-radio-dot'>
												<div className='dot-inner' />
											</div>
										</div>
										<p className='env-card-desc'>
											For real-time live payments, production API workflows, and automated merchant settlements.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* REQUEST REASON / USE CASE */}
					<div className='mb-4'>
						<div className='d-flex align-items-center justify-content-between mb-1'>
							<label htmlFor='requestReasonInput' className='form-label fw-bold small text-uppercase text-muted mb-0'>
								Reason / Use Case <span className='text-muted fw-normal'>(Optional)</span>
							</label>
							<small className='text-muted'>{requestReason.length} / 500</small>
						</div>
						<textarea
							id='requestReasonInput'
							rows={3}
							maxLength={500}
							className='form-control modern-input-textarea'
							placeholder='Describe your integration use case (e.g. E-commerce checkout, Custom POS integration)...'
							value={requestReason}
							onChange={(e) => setRequestReason(e.target.value)}
						/>
					</div>

					{/* STYLISH SECURITY NOTICE BANNER */}
					<div className='modern-notice-banner mb-2'>
						<div className='notice-icon-box'>
							<Icon icon='Shield' />
						</div>
						<div className='notice-content'>
							<strong>Security Policy:</strong> Once approved by an administrator, your new key pair will be issued, and any previous active API key in this environment will automatically be rotated.
						</div>
					</div>
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
						className='btn-modal-submit'
						disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner isSmall isGrow={false} className='me-2' />
								Submitting...
							</>
						) : (
							<>
								<Icon icon='Send' size='sm' />
								<span>Submit Request</span>
							</>
						)}
					</button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default CreateApiKeyRequestModal;
