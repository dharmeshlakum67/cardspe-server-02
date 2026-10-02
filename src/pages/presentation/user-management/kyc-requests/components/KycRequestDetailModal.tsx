/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, no-nested-ternary, react/no-array-index-key, jsx-a11y/click-events-have-key-events */
import React, { FC, useState } from 'react';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Button from '../../../../../components/bootstrap/Button';
import Icon from '../../../../../components/icon/Icon';
import { PillBadge } from '../../../../../components/common/PillBadge';
import { IKycRequestItem } from '../../../profile/kyc/type/kyc-type';
import { formatDateTime } from '../../../../../helpers/dateUtils';
import { getImageUrl } from '../../../../../helpers/helpers';
import { ImagePreviewModal } from '../../../../../components/common';

interface IKycRequestDetailModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	request: IKycRequestItem | null;
}

export const KycRequestDetailModal: FC<IKycRequestDetailModalProps> = ({
	isOpen,
	setIsOpen,
	request,
}) => {
	const [previewModal, setPreviewModal] = useState<{
		isOpen: boolean;
		imageUrl: string;
		title: string;
	}>({ isOpen: false, imageUrl: '', title: '' });

	if (!request) return null;

	const admin = request.user || request.admin;
	const kycDocs = request.kyc_documents;
	const status = (request.status || '').toLowerCase();
	const isVerified = status === 'verified' || status === 'approved';
	const isPending = status === 'pending' || status === 'in_review';

	const statusColor = isVerified ? 'success' : isPending ? 'warning' : 'danger';
	const { date: createdDate, time: createdTime } = formatDateTime(request.created_at);
	const formatStatus = (s?: string) => {
		if (!s) return '-';
		const cleaned = s.replace(/_/g, ' ').toLowerCase();
		return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
	};

	const kycTypeLabel =
		request.kyc_type ||
		request.kyc_request?.kyc_type ||
		request.document_type?.document_name ||
		'KYC';

	const otpVerifiedAt = request.kyc_request?.otp_verified_at;

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg'>
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom pb-3 pt-4 px-4'>
				<ModalTitle id='kyc-request-detail-title'>
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
								<h5 className='fw-bold mb-0 text-dark'>
									KYC Request #{request.id}
								</h5>
								<PillBadge color={statusColor} size='md'>
									{formatStatus(request.status)}
								</PillBadge>
								<span className='badge bg-light text-dark border font-monospace'>
									{kycTypeLabel.toUpperCase()}
								</span>
							</div>
							<span className='text-muted small'>
								Submitted on {createdDate} at {createdTime}
							</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody className='px-4 py-3'>
				<div className='row g-4'>
					{/* 1. APPLICANT INFORMATION */}
					<div className='col-12'>
						<div className='p-3 rounded-3 border bg-light'>
							<h6 className='fw-bold text-dark mb-3 d-flex align-items-center gap-2'>
								<Icon icon='Person' className='text-primary' />
								Applicant Information
							</h6>
							<div className='row g-3'>
								<div className='col-12 col-sm-6 col-md-4'>
									<span className='text-muted small d-block'>Full Name</span>
									<span className='fw-semibold text-dark'>{admin?.name || '-'}</span>
								</div>
								<div className='col-12 col-sm-6 col-md-4'>
									<span className='text-muted small d-block'>Username</span>
									<span className='fw-semibold text-primary font-monospace'>
										@{admin?.username || '-'}
									</span>
								</div>
								<div className='col-12 col-sm-6 col-md-4'>
									<span className='text-muted small d-block'>Role</span>
									<span className='badge bg-primary-subtle text-primary border'>
										{admin?.role?.role_name || '-'}
									</span>
								</div>
								<div className='col-12 col-sm-6 col-md-4'>
									<span className='text-muted small d-block'>Mobile Number</span>
									<span className='fw-medium text-dark'>{admin?.mobile_number || '-'}</span>
								</div>
								<div className='col-12 col-sm-6 col-md-4'>
									<span className='text-muted small d-block'>Email Address</span>
									<span className='fw-medium text-dark'>{admin?.email_address || '-'}</span>
								</div>
								<div className='col-12 col-sm-6 col-md-4'>
									<span className='text-muted small d-block'>Company Name</span>
									<span className='fw-medium text-dark'>{admin?.company_name || '-'}</span>
								</div>

								{/* PARENT DISTRIBUTOR IF APPLICABLE */}
								{admin?.parent && (
									<div className='col-12 mt-2 pt-2 border-top'>
										<span className='text-muted small d-block'>Parent Distributor</span>
										<div className='d-flex align-items-center gap-2 mt-1'>
											<Icon icon='CorporateFare' size='sm' className='text-muted' />
											<span className='fw-bold text-dark'>{admin.parent.name}</span>
											<span className='text-muted small font-monospace'>
												(@{admin.parent.username})
											</span>
											{admin.parent.mobile_number && (
												<span className='text-muted small'>· {admin.parent.mobile_number}</span>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* 2. VERIFICATION DETAILS */}
					<div className='col-12'>
						<div className='p-3 rounded-3 border bg-light'>
							<h6 className='fw-bold text-dark mb-3 d-flex align-items-center gap-2'>
								<Icon icon='Fingerprint' className='text-primary' />
								Verification &amp; Gateway Details
							</h6>
							<div className='row g-3'>
								<div className='col-12 col-sm-6 col-md-4'>
									<span className='text-muted small d-block'>KYC Type</span>
									<span className='fw-bold text-uppercase text-dark'>{kycTypeLabel}</span>
								</div>
								<div className='col-12 col-sm-6 col-md-4'>
									<span className='text-muted small d-block'>Document Number</span>
									<span className='fw-bold text-dark font-monospace'>
										{request.document_number || request.kyc_request?.document_number || '-'}
									</span>
								</div>
								<div className='col-12 col-sm-6 col-md-4'>
									<span className='text-muted small d-block'>Service Charge</span>
									<span className='fw-bold text-success'>₹{request.charge || request.kyc_request?.charge || '0.00'}</span>
								</div>
								<div className='col-12 col-sm-6 col-md-6'>
									<span className='text-muted small d-block'>Gateway Request ID</span>
									<span className='small font-monospace text-dark text-break'>
										{request.request_id || request.kyc_request?.request_id || '-'}
									</span>
								</div>
								<div className='col-12 col-sm-6 col-md-6'>
									<span className='text-muted small d-block'>OTP Verified Time</span>
									<span className='small text-dark'>
										{otpVerifiedAt
											? `${formatDateTime(otpVerifiedAt).date} ${formatDateTime(otpVerifiedAt).time}`
											: '-'}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* 3. ATTACHED KYC DOCUMENTS & EXTRACTED FIELDS */}
					{kycDocs && kycDocs.length > 0 && (
						<div className='col-12'>
							<div className='p-3 rounded-3 border bg-white'>
								<h6 className='fw-bold text-dark mb-3 d-flex align-items-center gap-2'>
									<Icon icon='FolderShared' className='text-primary' />
									Attached KYC Documents ({kycDocs.length})
								</h6>
								<div className='d-flex flex-column gap-3'>
									{kycDocs.map((doc, idx) => {
										const docStatus = (doc.status || '').toLowerCase();
										const docStatusColor =
											docStatus === 'approved'
												? 'success'
												: docStatus === 'pending'
												? 'warning'
												: 'danger';

										const fieldEntries = doc.field_values
											? Object.entries(doc.field_values)
											: [];

										const fileUrls = Array.isArray(doc.file_urls)
											? doc.file_urls
											: [];

										return (
											<div
												key={doc.id || idx}
												className='p-3 rounded-3 border bg-light'>
												<div className='d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2'>
													<div className='d-flex align-items-center gap-2'>
														<Icon icon='Description' className='text-primary' />
														<span className='fw-bold text-dark'>
															{doc.document_type?.document_name || 'Document'}
														</span>
														{doc.verification_service && (
															<span className='badge bg-info-subtle text-info border'>
																{doc.verification_service}
															</span>
														)}
													</div>
													<PillBadge color={docStatusColor} size='sm'>
														{doc.status.toUpperCase()}
													</PillBadge>
												</div>

												{/* DYNAMIC FIELD VALUES */}
												{fieldEntries.length > 0 && (
													<div className='row g-2 mt-1 mb-2'>
														{fieldEntries.map(([k, v]) => (
															<div key={k} className='col-12 col-sm-6 col-md-4'>
																<span className='text-muted small d-block text-capitalize'>
																	{k.replace(/_/g, ' ')}
																</span>
																<span className='fw-medium text-dark small'>
																	{String(v ?? '-')}
																</span>
															</div>
														))}
													</div>
												)}

												{/* UPLOADED ATTACHMENTS */}
												{fileUrls.length > 0 && (
													<div className='mt-3 pt-2 border-top'>
														<span className='text-muted small fw-semibold d-block mb-2'>
															Attached Files ({fileUrls.length}):
														</span>
														<div className='d-flex flex-wrap gap-2'>
															{fileUrls.map((fileUrl, fIdx) => {
																const fullUrl = getImageUrl(fileUrl);
																const isPdf = /\.pdf$/i.test(fileUrl);
																const handleDocPreview = () => {
																	if (!isPdf) {
																		setPreviewModal({
																			isOpen: true,
																			imageUrl: fullUrl,
																			title: `Attachment #${fIdx + 1}`,
																		});
																	} else {
																		window.open(fullUrl, '_blank');
																	}
																};
																return (
																	<div
																		key={fileUrl || `file_${fIdx}`}
																		role='button'
																		tabIndex={0}
																		className='border rounded-2 p-1 bg-white d-flex align-items-center gap-2 cursor-pointer shadow-sm'
																		style={{ cursor: 'pointer', maxWidth: 200 }}
																		onClick={handleDocPreview}
																		onKeyDown={(e) => {
																			if (e.key === 'Enter' || e.key === ' ') {
																				e.preventDefault();
																				handleDocPreview();
																			}
																		}}>
																		{isPdf ? (
																			<Icon icon='PictureAsPdf' className='text-danger' />
																		) : (
																			<img
																				src={fullUrl}
																				alt={`Attachment #${fIdx + 1}`}
																				style={{
																					width: 32,
																					height: 32,
																					objectFit: 'cover',
																					borderRadius: 4,
																				}}
																			/>
																		)}
																		<span className='small text-truncate text-primary fw-medium'>
																			View File #{fIdx + 1}
																		</span>
																	</div>
																);
															})}
														</div>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					)}
				</div>
			</ModalBody>

			<ModalFooter className='border-top pt-3'>
				<Button color='secondary' isLight onClick={() => setIsOpen(false)}>
					Close
				</Button>
			</ModalFooter>

			{/* IMAGE PREVIEW MODAL */}
			<ImagePreviewModal
				isOpen={previewModal.isOpen}
				setIsOpen={(open: boolean) =>
					setPreviewModal((prev) => ({ ...prev, isOpen: open }))
				}
				imageUrl={previewModal.imageUrl}
				title={previewModal.title}
			/>
		</Modal>
	);
};

export default KycRequestDetailModal;
