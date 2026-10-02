/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, no-nested-ternary, react/no-array-index-key, react/require-default-props, jsx-a11y/click-events-have-key-events */
import React, { FC, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import Card, {
	CardBody,
	CardHeader,
	CardTitle,
} from '../../../../components/bootstrap/Card';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import { PillBadge } from '../../../../components/common/PillBadge';
import { ImagePreviewModal, ConfirmationModal } from '../../../../components/common';
import AppBreadcrumbs from '../../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';
import { decryptId } from '../../../../helpers/routeEncryption';
import { formatDateTime, formatDate } from '../../../../helpers/dateUtils';
import { getImageUrl } from '../../../../helpers/helpers';
import showNotification from '../../../../components/extras/showNotification';
import kycService from '../../profile/kyc/service/kycService';
import { IKycRequestItem } from '../../profile/kyc/type/kyc-type';
import './css/KycRequestViewPage.scss';

// FORMAT STATUS: CAPITALIZE ONLY THE FIRST LETTER
const formatStatus = (s?: string): string => {
	if (!s) return '-';
	const cleaned = s.replace(/_/g, ' ').toLowerCase();
	return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

// FORMAT KEY LABELS (E.G. 'date_of_birth' -> 'Date Of Birth')
const formatKeyLabel = (key: string): string => {
	return key
		.replace(/_/g, ' ')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
};

// RENDER STRUCTURED PRIMITIVE VALUES
const renderStructuredValue = (val: any, keyName?: string): React.ReactNode => {
	if (val === null || val === undefined || val === '') {
		return <span className='text-muted'>-</span>;
	}
	if (typeof val === 'boolean') {
		return (
			<span
				className={`badge ${
					val
						? 'bg-success-subtle text-success border border-success-subtle'
						: 'bg-danger-subtle text-danger border border-danger-subtle'
				}`}>
				{val ? 'Yes' : 'No'}
			</span>
		);
	}
	if (typeof val === 'string') {
		const isPureDate =
			/^\d{4}-\d{2}-\d{2}$/.test(val) ||
			/^\d{4}\/\d{2}\/\d{2}$/.test(val) ||
			/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(val);

		if (isPureDate) {
			const formatted = formatDate(val);
			if (formatted && formatted !== '-') {
				return <span className='fw-semibold text-dark'>{formatted}</span>;
			}
		}

		const isIsoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val);
		if (isIsoDateTime) {
			const { date, time } = formatDateTime(val);
			return (
				<span className='fw-medium text-dark'>
					{time && time !== '-' ? `${date} ${time}` : date}
				</span>
			);
		}

		if (keyName && /(date_of_birth|dob|birth_date)/i.test(keyName)) {
			const formatted = formatDate(val);
			if (formatted && formatted !== '-') {
				return <span className='fw-semibold text-dark'>{formatted}</span>;
			}
		}
	}
	return <span className='fw-semibold text-dark'>{String(val)}</span>;
};

// RECURSIVE KEY-VALUE VIEWER FOR NESTED JSON OBJECTS
interface IRenderObjectFieldsProps {
	data: Record<string, any>;
	level?: number;
}
const RenderObjectFields: FC<IRenderObjectFieldsProps> = ({
	data,
	level = 0,
}) => {
	if (!data || typeof data !== 'object') return null;

	const entries = Object.entries(data);
	const primitiveEntries = entries.filter(
		([, v]) => typeof v !== 'object' || v === null,
	);
	const nestedEntries = entries.filter(
		([, v]) => typeof v === 'object' && v !== null && !Array.isArray(v),
	);
	const arrayEntries = entries.filter(([, v]) => Array.isArray(v));

	return (
		<div className='d-flex flex-column gap-3 w-100'>
			{primitiveEntries.length > 0 && (
				<div className='row g-3'>
					{primitiveEntries.map(([k, v]) => (
						<div key={k} className='col-12 col-sm-6 col-md-4'>
							<span className='text-muted small d-block mb-1'>
								{formatKeyLabel(k)}
							</span>
							{renderStructuredValue(v, k)}
						</div>
					))}
				</div>
			)}

			{nestedEntries.map(([k, v]) => (
				<div
					key={k}
					className={`p-3 rounded-3 border ${
						level % 2 === 0 ? 'bg-light' : 'bg-white'
					}`}>
					<h6
						className='fw-bold text-dark mb-3 d-flex align-items-center gap-2'
						style={{ fontSize: '0.875rem' }}>
						<Icon icon='Folder' className='text-primary' size='sm' />
						{formatKeyLabel(k)}
					</h6>
					<RenderObjectFields data={v} level={level + 1} />
				</div>
			))}

			{arrayEntries.map(([k, v]) => (
				<div
					key={k}
					className={`p-3 rounded-3 border ${
						level % 2 === 0 ? 'bg-light' : 'bg-white'
					}`}>
					<h6
						className='fw-bold text-dark mb-2'
						style={{ fontSize: '0.875rem' }}>
						{formatKeyLabel(k)} ({v.length})
					</h6>
					{v.every((item: any) => typeof item !== 'object') ? (
						<div className='d-flex flex-wrap gap-1'>
							{v.map((item: any, i: number) => (
								<span key={`arr_${k}_${i}`} className='badge bg-white text-dark border'>
									{String(item)}
								</span>
							))}
						</div>
					) : (
						<div className='d-flex flex-column gap-2'>
							{v.map((item: any, i: number) => (
								<div key={`obj_${k}_${i}`} className='p-2 bg-white rounded border'>
									<RenderObjectFields data={item} level={level + 1} />
								</div>
							))}
						</div>
					)}
				</div>
			))}
		</div>
	);
};

RenderObjectFields.defaultProps = {
	level: 0,
};

// HELPER TO PARSE & RENDER STRUCTURED RESPONSE
const renderStructuredResponse = (resp: any): React.ReactNode => {
	if (resp === undefined || resp === null || resp === '') return null;

	let parsed = resp;
	if (typeof resp === 'string') {
		try {
			const jsonParsed = JSON.parse(resp);
			if (typeof jsonParsed === 'object' && jsonParsed !== null) {
				parsed = jsonParsed;
			}
		} catch (e) {
			parsed = resp;
		}
	}

	if (typeof parsed === 'object' && parsed !== null) {
		return <RenderObjectFields data={parsed} />;
	}

	return (
		<div className='p-3 rounded-3 bg-light border text-dark font-monospace small text-break'>
			{String(parsed)}
		</div>
	);
};

export const KycRequestViewPage: FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [requestDetail, setRequestDetail] = useState<IKycRequestItem | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [previewModal, setPreviewModal] = useState<{
		isOpen: boolean;
		imageUrl: string;
		title: string;
	}>({ isOpen: false, imageUrl: '', title: '' });

	const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
	const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
	const [rejectRemark, setRejectRemark] = useState<string>('');
	const [rejectError, setRejectError] = useState<string>('');
	const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

	const { canRead, canUpdate, canReview, hasPermission, isLoadingPermissions } = usePermission();
	const numericId = id ? decryptId(id) : null;

	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// PERMISSION GUARD
	useEffect(() => {
		if (
			!isLoadingPermissions &&
			!canRead(PERMISSION_KEYS.KYC_REQUEST) &&
			!canRead(PERMISSION_KEYS.USER_MANAGEMENT)
		) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canRead, navigate]);

	// FETCH KYC REQUEST DETAILS
	useEffect(() => {
		const fetchDetail = async () => {
			if (!numericId) {
				showNotification('Invalid Link', 'Invalid KYC request identifier', 'danger');
				navigate(`/${PAGE_ROUTES.KYC_REQUESTS}`);
				return;
			}

			const currentFetchKey = String(numericId);
			if (isFetchingRef.current || fetchedIdRef.current === currentFetchKey) {
				return;
			}

			isFetchingRef.current = true;
			fetchedIdRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const res = await kycService.getKycRequestById(numericId);
				const data = res?.data || (res as any);
				if (data) {
					setRequestDetail(data);
				} else {
					showNotification('Not Found', 'KYC request record not found', 'warning');
					navigate(`/${PAGE_ROUTES.KYC_REQUESTS}`);
				}
			} catch (error: any) {
				showNotification(
					'Error',
					error?.data?.message || error?.message || 'Could not fetch KYC request details',
					'danger',
				);
				navigate(`/${PAGE_ROUTES.KYC_REQUESTS}`);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		};

		if (!isLoadingPermissions && canRead(PERMISSION_KEYS.KYC_REQUEST)) {
			fetchDetail();
		}
	}, [numericId, isLoadingPermissions, canRead, navigate]);

	// HANDLE APPROVE CONFIRM
	const handleApproveConfirm = async () => {
		if (!numericId) return;
		setIsUpdatingStatus(true);
		try {
			const res = await kycService.updateKycRequestStatus(numericId, { status: 'approved' });
			showNotification(
				'Success',
				res?.message || 'KYC request approved successfully',
				'success',
			);
			setIsApproveModalOpen(false);
			setRequestDetail((prev) => (prev ? { ...prev, status: 'approved' } : null));
		} catch (error: any) {
			showNotification(
				'Error',
				error?.data?.message || error?.message || 'Could not approve KYC request',
				'danger',
			);
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	// HANDLE REJECT SUBMIT WITH REMARK
	const handleRejectSubmit = async () => {
		if (!rejectRemark.trim()) {
			setRejectError('Please enter a rejection reason.');
			return;
		}
		if (!numericId) return;

		setIsUpdatingStatus(true);
		try {
			const res = await kycService.updateKycRequestStatus(numericId, {
				status: 'rejected',
				remark: rejectRemark.trim(),
			});
			showNotification(
				'Success',
				res?.message || 'KYC request rejected successfully',
				'success',
			);
			setIsRejectModalOpen(false);
			setRejectRemark('');
			setRejectError('');
			setRequestDetail((prev) =>
				prev
					? {
							...prev,
							status: 'rejected',
							rejection_reason: rejectRemark.trim(),
					  }
					: null,
			);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.data?.message || error?.message || 'Could not reject KYC request',
				'danger',
			);
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const user = requestDetail?.user || requestDetail?.admin;
	const status = (requestDetail?.status || '').toLowerCase();
	const isVerified = status === 'verified' || status === 'approved';
	const isRejected = status === 'rejected' || status === 'failed';
	const isPending = status === 'pending' || status === 'in_review';
	const statusColor = isVerified ? 'success' : isPending ? 'warning' : 'danger';
	const canReviewPermission =
		Boolean(canReview && canReview(PERMISSION_KEYS.KYC_REQUEST)) ||
		Boolean(canReview && canReview('kyc_requests')) ||
		hasPermission(PERMISSION_KEYS.KYC_REQUEST, 'review') ||
		hasPermission(PERMISSION_KEYS.KYC_REQUEST, 'approve') ||
		hasPermission(PERMISSION_KEYS.KYC_REQUEST, 'update') ||
		hasPermission(PERMISSION_KEYS.KYC_REQUEST, 'edit') ||
		hasPermission('kyc_requests', 'review') ||
		hasPermission('kyc_requests', 'update') ||
		hasPermission('kyc_requests', 'approve') ||
		hasPermission('kyc_requests', 'edit') ||
		canUpdate(PERMISSION_KEYS.KYC_REQUEST) ||
		canUpdate(PERMISSION_KEYS.USER_MANAGEMENT);

	const docTypeName =
		requestDetail?.document_type?.document_name ||
		requestDetail?.kyc_type ||
		requestDetail?.kyc_request?.kyc_type ||
		'KYC Document';

	const verificationService =
		requestDetail?.verification_service ||
		requestDetail?.document_type?.verification_service ||
		'-';

	const fileUrls: string[] = Array.isArray(requestDetail?.file_urls)
		? (requestDetail?.file_urls as string[])
		: [];

	const fieldValues = requestDetail?.field_values
		? Object.entries(requestDetail.field_values)
		: [];

	return (
		<PageWrapper title='KYC Request Details' permissionKey={PERMISSION_KEYS.KYC_REQUEST}>
			<Page container='fluid'>
				<div className='kyc-request-view-page'>
					<div className='row'>
						<div className='col-12'>
							{/* HEADER & BREADCRUMBS */}
							<div className='kyc-view-header'>
								<div>
									<AppBreadcrumbs
										items={[
											{ label: 'User Management' },
											{ label: 'KYC Requests', to: `/${PAGE_ROUTES.KYC_REQUESTS}` },
											{
												label: requestDetail
													? `Request #${requestDetail.id}`
													: 'View KYC Request',
											},
										]}
									/>
								</div>
								<div className='kyc-header-actions'>
									<button
										type='button'
										className='btn-back-action'
										onClick={() => navigate(`/${PAGE_ROUTES.KYC_REQUESTS}`)}>
										<Icon icon='ArrowBack' size='sm' />
										<span>Back to Requests</span>
									</button>
									{canReviewPermission && requestDetail && (
										<>
											{!isRejected && (
												<button
													type='button'
													className='btn-reject-action'
													onClick={() => {
														setRejectRemark(requestDetail.rejection_reason || '');
														setRejectError('');
														setIsRejectModalOpen(true);
													}}>
													<Icon icon='Close' size='sm' />
													<span>Reject</span>
												</button>
											)}
											{!isVerified && (
												<button
													type='button'
													className='btn-approve-action'
													onClick={() => setIsApproveModalOpen(true)}>
													<Icon icon='Check' size='sm' />
													<span>Approve</span>
												</button>
											)}
										</>
									)}
								</div>
							</div>

						{isLoading ? (
							<div
								className='d-flex align-items-center justify-content-center bg-white rounded-3 p-5 border'
								style={{ minHeight: '300px' }}>
								<div className='spinner-border text-primary' role='status'>
									<span className='visually-hidden'>Loading...</span>
								</div>
							</div>
						) : requestDetail ? (
							<div className='row g-4'>
								{/* 1. APPLICANT INFORMATION */}
								<div className='col-12 col-lg-6'>
									<Card className='h-100'>
										<CardHeader>
											<CardTitle className='d-flex align-items-center gap-2'>
												<Icon icon='Person' className='text-primary' />
												Applicant Details
											</CardTitle>
										</CardHeader>
										<CardBody>
											<div className='row g-3'>
												<div className='col-12 col-sm-6'>
													<span className='text-muted small d-block'>Full Name</span>
													<span className='fw-semibold text-dark'>
														{user?.name || '-'}
													</span>
												</div>
												<div className='col-12 col-sm-6'>
													<span className='text-muted small d-block'>Username</span>
													<span className='fw-semibold text-primary font-monospace'>
														@{user?.username || '-'}
													</span>
												</div>
												<div className='col-12 col-sm-6'>
													<span className='text-muted small d-block'>Role</span>
													{user?.role ? (
														<span className='badge bg-primary-subtle text-primary border'>
															{user.role.role_name}
														</span>
													) : (
														<span className='text-muted'>-</span>
													)}
												</div>
												<div className='col-12 col-sm-6'>
													<span className='text-muted small d-block'>Mobile Number</span>
													<span className='fw-medium text-dark'>
														{user?.mobile_number || '-'}
													</span>
												</div>
												<div className='col-12 col-sm-6'>
													<span className='text-muted small d-block'>Email Address</span>
													<span className='fw-medium text-dark'>
														{user?.email_address || '-'}
													</span>
												</div>
												<div className='col-12 col-sm-6'>
													<span className='text-muted small d-block'>Company Name</span>
													<span className='fw-medium text-dark'>
														{user?.company_name || '-'}
													</span>
												</div>

												{/* PARENT DISTRIBUTOR */}
												{user?.parent && (
													<div className='col-12 mt-2 pt-2 border-top'>
														<span className='text-muted small d-block'>
															Parent Distributor
														</span>
														<div className='d-flex align-items-center gap-2 mt-1'>
															<Icon
																icon='CorporateFare'
																size='sm'
																className='text-muted'
															/>
															<span className='fw-bold text-dark'>
																{user.parent.name}
															</span>
															{user.parent.username && (
																<span className='text-muted small font-monospace'>
																	(@{user.parent.username})
																</span>
															)}
															{user.parent.mobile_number && (
																<span className='text-muted small'>
																	· {user.parent.mobile_number}
																</span>
															)}
														</div>
													</div>
												)}
											</div>
										</CardBody>
									</Card>
								</div>

								{/* 2. DOCUMENT & VERIFICATION SPECIFICATIONS */}
								<div className='col-12 col-lg-6'>
									<Card className='h-100'>
										<CardHeader>
											<CardTitle className='d-flex align-items-center gap-2'>
												<Icon icon='Description' className='text-primary' />
												Verification Details
											</CardTitle>
										</CardHeader>
										<CardBody>
											<div className='row g-3'>
												<div className='col-12 col-sm-6'>
													<span className='text-muted small d-block'>Document Name</span>
													<span className='fw-bold text-dark'>{docTypeName}</span>
												</div>
												<div className='col-12 col-sm-6'>
													<span className='text-muted small d-block'>
														Verification Service
													</span>
													<span className='badge bg-info-subtle text-info border'>
														{verificationService.replace(/_/g, ' ')}
													</span>
												</div>
												<div className='col-12 col-sm-6'>
													<span className='text-muted small d-block'>Status</span>
													<PillBadge color={statusColor} size='md'>
														{formatStatus(requestDetail.status)}
													</PillBadge>
												</div>
												<div className='col-12 col-sm-6'>
													<span className='text-muted small d-block'>Submitted on</span>
													<span className='fw-medium text-dark'>
														{requestDetail.created_at
															? `${formatDateTime(requestDetail.created_at).date} ${formatDateTime(requestDetail.created_at).time}`
															: '-'}
													</span>
												</div>
												{requestDetail.document_number && (
													<div className='col-12 col-sm-6'>
														<span className='text-muted small d-block'>
															Document Number
														</span>
														<span className='font-monospace fw-bold text-dark'>
															{requestDetail.document_number}
														</span>
													</div>
												)}
												{requestDetail.rejection_reason && (
													<div className='col-12'>
														<div
															className='d-flex align-items-start gap-2 p-2 rounded-2'
															style={{
																backgroundColor: '#fef2f2',
																border: '1px solid #fecaca',
																color: '#991b1b',
															}}>
															<Icon icon='WarningAmber' size='sm' className='mt-1 text-danger' />
															<div className='small'>
																<strong>Rejection Reason:</strong>{' '}
																<span style={{ color: '#7f1d1d' }}>
																	{requestDetail.rejection_reason}
																</span>
															</div>
														</div>
													</div>
												)}
											</div>
										</CardBody>
									</Card>
								</div>

								{/* 3. DYNAMIC FORM VALUES / EXTRACTED FIELDS */}
								{fieldValues.length > 0 && (
									<div className='col-12'>
										<Card>
											<CardHeader>
												<CardTitle className='d-flex align-items-center gap-2'>
													<Icon icon='Dataset' className='text-primary' />
													Document Details
												</CardTitle>
											</CardHeader>
											<CardBody>
												<div className='row g-3'>
													{fieldValues.map(([k, v]) => (
														<div key={k} className='col-12 col-sm-6 col-md-4'>
															<span className='text-muted small d-block mb-1'>
																{formatKeyLabel(k)}
															</span>
															{renderStructuredValue(v, k)}
														</div>
													))}
												</div>
											</CardBody>
										</Card>
									</div>
								)}

								{/* 4. ATTACHED FILES & DOCUMENTS */}
								{fileUrls.length > 0 && (
									<div className='col-12'>
										<Card>
											<CardHeader>
												<CardTitle className='d-flex align-items-center gap-2'>
													<Icon icon='AttachFile' className='text-primary' />
													Uploaded Files ({fileUrls.length})
												</CardTitle>
											</CardHeader>
											<CardBody>
												<div className='row g-3'>
													{fileUrls.map((fileUrl, fIdx) => {
														const fullUrl = getImageUrl(fileUrl);
														const isPdf = /\.pdf$/i.test(fileUrl);
														const handlePreview = () => {
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
															<div key={fileUrl || `file_${fIdx}`} className='col-12 col-sm-6 col-md-4 col-lg-3'>
																<div
																	className='p-3 border rounded-3 bg-light text-center h-100 d-flex flex-column align-items-center justify-content-center gap-2 cursor-pointer shadow-sm'
																	style={{ cursor: 'pointer', minHeight: '130px' }}
																	role='button'
																	tabIndex={0}
																	onClick={handlePreview}
																	onKeyDown={(e) => {
																		if (e.key === 'Enter' || e.key === ' ') {
																			e.preventDefault();
																			handlePreview();
																		}
																	}}>
																	{isPdf ? (
																		<Icon icon='PictureAsPdf' size='3x' className='text-danger' />
																	) : (
																		<img
																			src={fullUrl}
																			alt={`Attachment #${fIdx + 1}`}
																			style={{
																				maxHeight: '80px',
																				maxWidth: '100%',
																				objectFit: 'contain',
																				borderRadius: '4px',
																			}}
																		/>
																	)}
																	<span className='small fw-bold text-primary text-truncate w-100'>
																		{isPdf ? 'Open PDF File' : `View Image #${fIdx + 1}`}
																	</span>
																</div>
															</div>
														);
													})}
												</div>
											</CardBody>
										</Card>
									</div>
								)}

								{/* 5. GATEWAY & QUICK KYC LOGS IF PRESENT */}
								{requestDetail.kyc_request && (
									<div className='col-12'>
										<Card>
											<CardHeader>
												<div className='d-flex align-items-center justify-content-between w-100 flex-wrap gap-2'>
													<CardTitle className='d-flex align-items-center gap-2 mb-0'>
														<Icon icon='Fingerprint' className='text-primary' />
														Gateway Verification Log
													</CardTitle>
													{requestDetail.kyc_request.status && (
														<PillBadge
															color={
																requestDetail.kyc_request.status.toLowerCase() === 'verified' ||
																requestDetail.kyc_request.status.toLowerCase() === 'success' ||
																requestDetail.kyc_request.status.toLowerCase() === 'approved'
																	? 'success'
																	: requestDetail.kyc_request.status.toLowerCase() === 'pending'
																	? 'warning'
																	: 'danger'
															}
															size='md'>
															{formatStatus(requestDetail.kyc_request.status)}
														</PillBadge>
													)}
												</div>
											</CardHeader>
											<CardBody>
												<div className='row g-3'>
													<div className='col-12 col-sm-6 col-md-3'>
														<span className='text-muted small d-block'>Document Number</span>
														<span className='font-monospace fw-bold text-dark'>
															{requestDetail.kyc_request.document_number || '-'}
														</span>
													</div>
													<div className='col-12 col-sm-6 col-md-3'>
														<span className='text-muted small d-block'>Request ID</span>
														<span className='font-monospace text-dark small text-break'>
															{requestDetail.kyc_request.request_id || '-'}
														</span>
													</div>
													<div className='col-12 col-sm-6 col-md-3'>
														<span className='text-muted small d-block'>Charge</span>
														<span className='fw-bold text-success'>
															₹{requestDetail.kyc_request.charge || '0.00'}
														</span>
													</div>
													{requestDetail.kyc_request.otp_sent_at && (
														<div className='col-12 col-sm-6 col-md-3'>
															<span className='text-muted small d-block'>
																OTP Sent Time
															</span>
															<span className='small text-dark'>
																{formatDateTime(requestDetail.kyc_request.otp_sent_at).date}{' '}
																{formatDateTime(requestDetail.kyc_request.otp_sent_at).time}
															</span>
														</div>
													)}
													{requestDetail.kyc_request.otp_verified_at && (
														<div className='col-12 col-sm-6 col-md-3'>
															<span className='text-muted small d-block'>
																OTP Verified Time
															</span>
															<span className='small text-dark'>
																{formatDateTime(requestDetail.kyc_request.otp_verified_at).date}{' '}
																{formatDateTime(requestDetail.kyc_request.otp_verified_at).time}
															</span>
														</div>
													)}
													{requestDetail.kyc_request.created_at && (
														<div className='col-12 col-sm-6 col-md-3'>
															<span className='text-muted small d-block'>
																Request Created
															</span>
															<span className='small text-dark'>
																{formatDateTime(requestDetail.kyc_request.created_at).date}{' '}
																{formatDateTime(requestDetail.kyc_request.created_at).time}
															</span>
														</div>
													)}

													{/* GATEWAY RESPONSE / PAYLOAD */}
													{requestDetail.kyc_request.response !== undefined &&
														requestDetail.kyc_request.response !== null && (
															<div className='col-12 mt-3 pt-3 border-top'>
																<span className='text-muted small fw-semibold d-block mb-3'>
																	Verification Response Details:
																</span>
																{renderStructuredResponse(requestDetail.kyc_request.response)}
															</div>
														)}
												</div>
											</CardBody>
										</Card>
									</div>
								)}

								{/* 6. THIRD PARTY RESPONSE IF PRESENT ON DOCUMENT */}
								{requestDetail.third_party_response && !requestDetail.kyc_request && (
									<div className='col-12'>
										<Card>
											<CardHeader>
												<CardTitle className='d-flex align-items-center gap-2'>
													<Icon icon='Fingerprint' className='text-primary' />
													Verification Response Details
												</CardTitle>
											</CardHeader>
											<CardBody>
												{renderStructuredResponse(requestDetail.third_party_response)}
											</CardBody>
										</Card>
									</div>
								)}
							</div>
						) : null}
					</div>
				</div>
			</div>
			</Page>

			{/* APPROVE CONFIRMATION MODAL */}
			<ConfirmationModal
				isOpen={isApproveModalOpen}
				setIsOpen={setIsApproveModalOpen}
				title='Approve KYC Request'
				message='Are you sure you want to approve this KYC document and mark the request as approved?'
				confirmText='Yes, Approve'
				cancelText='Cancel'
				isLoading={isUpdatingStatus}
				onConfirm={handleApproveConfirm}
			/>

			{/* REJECT WITH REMARK MODAL */}
			<Modal
				isOpen={isRejectModalOpen}
				setIsOpen={setIsRejectModalOpen}
				isCentered>
				<ModalHeader setIsOpen={setIsRejectModalOpen} className='border-bottom-0 pb-0 pt-4 px-4'>
					<ModalTitle id='reject-modal-title'>
						<div className='d-flex align-items-center gap-3'>
							<div
								className='d-flex align-items-center justify-content-center rounded-3'
								style={{
									width: '44px',
									height: '44px',
									backgroundColor: '#fee2e2',
									color: '#dc2626',
									flexShrink: 0,
								}}>
								<Icon icon='Cancel' size='lg' />
							</div>
							<div>
								<h5 className='fw-bold mb-0 text-dark'>Reject KYC Request</h5>
								<span className='text-muted small' style={{ fontSize: '0.8125rem' }}>
									Specify the reason for rejecting this document so the applicant knows what to fix.
								</span>
							</div>
						</div>
					</ModalTitle>
				</ModalHeader>
				<ModalBody className='px-4 py-3'>
					<div>
						<label
							htmlFor='rejectionRemark'
							className='form-label fw-semibold small text-dark mb-1'>
							Rejection Reason / Remark <span className='text-danger'>*</span>
						</label>
						<textarea
							id='rejectionRemark'
							rows={4}
							className='form-control'
							placeholder='e.g. The uploaded PAN card image is blurry and not clearly readable. Please upload a clear photo.'
							value={rejectRemark}
							onChange={(e) => {
								setRejectRemark(e.target.value);
								if (rejectError) setRejectError('');
							}}
							style={{ fontWeight: 400, fontSize: '0.875rem' }}
						/>
						{rejectError && (
							<div className='text-danger small mt-1'>{rejectError}</div>
						)}
					</div>
				</ModalBody>
				<ModalFooter className='px-4 py-3 border-top-0'>
					<Button
						type='button'
						color='light'
						className='px-4 py-2'
						isDisable={isUpdatingStatus}
						onClick={() => {
							setIsRejectModalOpen(false);
							setRejectRemark('');
							setRejectError('');
						}}>
						Cancel
					</Button>
					<Button
						type='button'
						color='danger'
						className='px-4 py-2 d-inline-flex align-items-center gap-2'
						isDisable={isUpdatingStatus}
						onClick={handleRejectSubmit}>
						{isUpdatingStatus ? (
							<>
								<Spinner isSmall inButton isGrow className='me-1' />
								<span>Rejecting...</span>
							</>
						) : (
							<>
								<Icon icon='Close' />
								<span>Reject Request</span>
							</>
						)}
					</Button>
				</ModalFooter>
			</Modal>

			{/* IMAGE PREVIEW MODAL */}
			<ImagePreviewModal
				isOpen={previewModal.isOpen}
				setIsOpen={(open: boolean) =>
					setPreviewModal((prev) => ({ ...prev, isOpen: open }))
				}
				imageUrl={previewModal.imageUrl}
				title={previewModal.title}
			/>
		</PageWrapper>
	);
};

export default KycRequestViewPage;
