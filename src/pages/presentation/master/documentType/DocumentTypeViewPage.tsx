import React, { FC, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import documentTypeService from './service/documentTypeService';
import { IDocumentTypeDetail } from './type/document-type';
import showNotification from '../../../../components/extras/showNotification';
import Icon from '../../../../components/icon/Icon';
import { PillBadge } from '../../../../components/common/PillBadge';
import { ConfirmationModal } from '../../../../components/common';
import AppBreadcrumbs from '../../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';
import { decryptId, encryptId } from '../../../../helpers/routeEncryption';
import { formatDateTime } from '../../../../helpers/dateUtils';
import { getRoleTypeDetails } from '../../role/util/roleUtils';
import constantService, { IConstantOption } from '../../../../services/constantService';
import './css/DocumentType.scss';

const DocumentTypeViewPage: FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [docDetail, setDocDetail] = useState<IDocumentTypeDetail | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);
	const [verificationServiceOptions, setVerificationServiceOptions] = useState<IConstantOption[]>([]);

	const { canRead, canUpdate, canDelete, isLoadingPermissions } = usePermission();
	const numericId = id ? decryptId(id) : null;

	useEffect(() => {
		let isMounted = true;
		const loadConstants = async () => {
			try {
				const opts = await constantService.getDocumentTypeConstants();
				if (isMounted && opts && opts.length > 0) {
					setVerificationServiceOptions(opts);
				}
			} catch (err) {}
		};
		loadConstants();
		return () => {
			isMounted = false;
		};
	}, []);

	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// REDIRECT IF PERMISSION DENIED
	useEffect(() => {
		if (
			!isLoadingPermissions &&
			!canRead(PERMISSION_KEYS.MASTER) &&
			!canRead(PERMISSION_KEYS.DOCUMENT_TYPE)
		) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canRead, navigate]);

	useEffect(() => {
		const fetchDetail = async () => {
			if (!numericId) {
				showNotification('Invalid Link', 'Invalid document type identifier', 'danger');
				navigate(`/${PAGE_ROUTES.DOCUMENT_TYPE}`);
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
				const res = await documentTypeService.getDocumentTypeById(numericId);
				if (res?.data) {
					setDocDetail(res.data);
				} else {
					showNotification('Not Found', 'Document type record not found', 'warning');
					navigate(`/${PAGE_ROUTES.DOCUMENT_TYPE}`);
				}
			} catch (error: any) {
				showNotification(
					'Error',
					error?.message || 'Could not fetch document type details',
					'danger',
				);
				navigate(`/${PAGE_ROUTES.DOCUMENT_TYPE}`);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		};

		if (
			!isLoadingPermissions &&
			(canRead(PERMISSION_KEYS.MASTER) || canRead(PERMISSION_KEYS.DOCUMENT_TYPE)) &&
			fetchedIdRef.current !== String(numericId) &&
			!isFetchingRef.current
		) {
			fetchDetail();
		}
	}, [numericId, navigate, isLoadingPermissions, canRead]);

	const handleDeleteConfirm = async () => {
		if (!numericId) return;

		setIsDeleting(true);
		try {
			const res = await documentTypeService.deleteDocumentType(numericId);
			showNotification(
				'Success',
				res?.message || 'Document type deleted successfully',
				'success',
			);
			setIsDeleteModalOpen(false);
			navigate(`/${PAGE_ROUTES.DOCUMENT_TYPE}`);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to delete document type',
				'danger',
			);
		} finally {
			setIsDeleting(false);
		}
	};

	if (isLoadingPermissions || isLoading) {
		return (
			<PageWrapper title="Document Type Details" permissionKey={PERMISSION_KEYS.DOCUMENT_TYPE}>
				<Page container="fluid">
					<div className="p-4 text-center text-muted">Loading document type details...</div>
				</Page>
			</PageWrapper>
		);
	}

	if (!docDetail) return null;

	const hasUpdatePerm =
		canUpdate(PERMISSION_KEYS.MASTER) || canUpdate(PERMISSION_KEYS.DOCUMENT_TYPE);
	const hasDeletePerm =
		canDelete(PERMISSION_KEYS.MASTER) || canDelete(PERMISSION_KEYS.DOCUMENT_TYPE);

	return (
		<PageWrapper
			title={`Document Type Details - ${docDetail.document_name}`}
			permissionKey={PERMISSION_KEYS.DOCUMENT_TYPE}>
			<Page container="fluid">
				<div className="document-type-view-page">
					{/* HEADER & BREADCRUMBS */}
					<div className="doc-page-header">
						<div className="doc-title-section">
							<AppBreadcrumbs
								items={[
									{ label: 'Master' },
									{ label: 'Document Type', to: `/${PAGE_ROUTES.DOCUMENT_TYPE}` },
									{ label: docDetail.document_name, current: true },
								]}
							/>
						</div>
						<div className="doc-header-actions">
							<button
								type="button"
								className="btn-cancel-action"
								onClick={() => navigate(`/${PAGE_ROUTES.DOCUMENT_TYPE}`)}>
								<Icon icon="ArrowBack" size="sm" />
								<span>Back to List</span>
							</button>

							{hasUpdatePerm && (
								<button
									type="button"
									className="btn-edit-action"
									onClick={() =>
										navigate(
											`/${PAGE_ROUTES.DOCUMENT_TYPE_EDIT.replace(
												':id',
												encryptId(docDetail.id),
											)}`,
										)
									}>
									<Icon icon="Edit" size="sm" />
									<span>Edit</span>
								</button>
							)}

							{hasDeletePerm && (
								<button
									type="button"
									className="btn-delete-action"
									onClick={() => setIsDeleteModalOpen(true)}>
									<Icon icon="Delete" size="sm" />
									<span>Delete</span>
								</button>
							)}
						</div>
					</div>

					{/* GENERAL DETAILS CARD */}
					<div className="doc-card">
						<div className="card-header-bar">
							<div className="header-left">
								<div className="card-header-icon">
									<Icon icon="Info" />
								</div>
								<div>
									<h3 className="card-header-title">Document Information</h3>
									<p className="card-header-subtitle">Overview & status</p>
								</div>
							</div>
						</div>

						<div className="card-body-content">
							<div className="detail-grid">
								<div className="detail-item">
									<span className="detail-label">Document Name</span>
									<span className="detail-value">{docDetail.document_name}</span>
								</div>

								<div className="detail-item">
									<span className="detail-label">Document Code</span>
									<span className="detail-value">{docDetail.document_code}</span>
								</div>

								<div className="detail-item">
									<span className="detail-label">Mandatory Document</span>
									<div>
										<PillBadge color={docDetail.is_mandatory ? 'danger' : 'gray'}>
											{docDetail.is_mandatory ? 'Mandatory' : 'Optional'}
										</PillBadge>
									</div>
								</div>

								<div className="detail-item">
									<span className="detail-label">Required Files Count</span>
									<span className="detail-value">
										{docDetail.required_files_count}
									</span>
								</div>

								<div className="detail-item">
									<span className="detail-label">Verification Service</span>
									<div>
										{(() => {
											const service = docDetail.verification_service || 'custom';
											const matchedOpt = verificationServiceOptions.find(
												(opt) => opt.value === service,
											);

											let label = 'Custom';
											if (matchedOpt) {
												label = matchedOpt.label;
											} else if (service === 'quick_kyc') {
												label = 'Quick KYC';
											} else if (service === 'custom_quick_kyc') {
												label = 'Custom & Quick KYC';
											}

											let color: any = 'blue';
											if (service === 'quick_kyc') {
												color = 'purple';
											} else if (service === 'custom_quick_kyc') {
												color = 'teal';
											}

											return <PillBadge color={color}>{label}</PillBadge>;
										})()}
									</div>
								</div>

								<div className="detail-item">
									<span className="detail-label">Status</span>
									<div>
										<PillBadge
											color={
												docDetail.status === 'active' ? 'success' : 'gray'
											}>
											{docDetail.status === 'active' ? 'Active' : 'Inactive'}
										</PillBadge>
									</div>
								</div>

								<div className="detail-item">
									<span className="detail-label">Created At</span>
									<span className="detail-value">
										{formatDateTime(docDetail.created_at).full}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* ROLE REQUIREMENTS CARD */}
					<div className="doc-card">
						<div className="card-header-bar">
							<div className="header-left">
								<div className="card-header-icon">
									<Icon icon="Group" />
								</div>
								<div>
									<h3 className="card-header-title">Role Requirements</h3>
									<p className="card-header-subtitle">
										Roles configured to supply this document
									</p>
								</div>
							</div>
						</div>

						<div className="card-body-content">
							{!docDetail.role_document_requirements ||
							docDetail.role_document_requirements.length === 0 ? (
								<p className="text-muted mb-0">
									No specific role requirements assigned.
								</p>
							) : (
								<div className="table-responsive">
									<table className="roles-requirement-table">
										<thead>
											<tr>
												<th>Role Name</th>
												<th>Role Type</th>
												<th>Requirement Status</th>
											</tr>
										</thead>
										<tbody>
											{docDetail.role_document_requirements.map((req) => {
												const roleTypeMeta = getRoleTypeDetails(
													req.role?.role_type,
												);

												return (
													<tr key={req.id}>
														<td>
															<strong>
																{req.role?.role_name ||
																	`Role #${req.role_id}`}
															</strong>
														</td>
														<td>
															<PillBadge color={roleTypeMeta.color}>
																{roleTypeMeta.label}
															</PillBadge>
														</td>
														<td>
															<PillBadge
																color={req.is_required ? 'danger' : 'gray'}>
																{req.is_required ? 'Mandatory' : 'Optional'}
															</PillBadge>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>

					{/* DELETE CONFIRMATION MODAL */}
					<ConfirmationModal
						isOpen={isDeleteModalOpen}
						setIsOpen={setIsDeleteModalOpen}
						onConfirm={handleDeleteConfirm}
						title="Delete Document Type"
						message={`Are you sure you want to delete "${docDetail.document_name}"? This action cannot be undone.`}
						confirmText="Delete"
						isLoading={isDeleting}
					/>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default DocumentTypeViewPage;
