/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-nested-ternary */
import React, { FC, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import operatorService from './service/operatorService';
import { IOperator, IOperatorInputParam } from './type/operator-type';
import showNotification from '../../../../components/extras/showNotification';
import {
	ConfirmationModal,
	ImagePreviewModal,
	PillBadge,
	AppBreadcrumbs,
} from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';
import { decryptId, encryptId } from '../../../../helpers/routeEncryption';
import { formatDateTime } from '../../../../helpers/dateUtils';
import { getImageUrl } from '../../../../helpers/helpers';
import './css/Operator.scss';

const OperatorViewPage: FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [operator, setOperator] = useState<IOperator | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

	const { canRead, canUpdate, canDelete, isLoadingPermissions } = usePermission();
	const numericId = id ? decryptId(id) : null;

	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// REDIRECT IF PERMISSION DENIED
	useEffect(() => {
		if (
			!isLoadingPermissions &&
			!canRead(PERMISSION_KEYS.SERVICE_MANAGEMENT) &&
			!canRead(PERMISSION_KEYS.OPERATOR) &&
			!canRead('operator')
		) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canRead, navigate]);

	// FETCH OPERATOR DETAIL
	useEffect(() => {
		const fetchDetail = async () => {
			if (!numericId) {
				showNotification('Invalid Link', 'Invalid operator identifier', 'danger');
				navigate(`/${PAGE_ROUTES.OPERATORS}`);
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
				const res = await operatorService.getOperatorById(numericId);
				if (res?.data) {
					setOperator(res.data);
				} else {
					showNotification('Not Found', 'Operator record not found', 'warning');
					navigate(`/${PAGE_ROUTES.OPERATORS}`);
				}
			} catch (error: any) {
				showNotification('Error', error?.message || 'Could not fetch operator details', 'danger');
				navigate(`/${PAGE_ROUTES.OPERATORS}`);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		};

		if (!isLoadingPermissions) {
			fetchDetail();
		}
	}, [numericId, isLoadingPermissions, navigate]);

	// HANDLE DELETE
	const handleConfirmDelete = async () => {
		if (!numericId) return;

		setIsDeleting(true);
		try {
			await operatorService.deleteOperator(numericId);
			showNotification('Success', 'Operator deleted successfully', 'success');
			navigate(`/${PAGE_ROUTES.OPERATORS}`);
		} catch (error: any) {
			showNotification('Error', error?.message || 'Failed to delete operator', 'danger');
		} finally {
			setIsDeleting(false);
			setIsDeleteModalOpen(false);
		}
	};

	if (isLoadingPermissions || isLoading) {
		return (
			<PageWrapper title="Operator Details" permissionKey={PERMISSION_KEYS.OPERATOR}>
				<Page container="fluid">
					<div className="p-5 text-center text-muted">
						<Spinner size="lg" isGrow className="text-primary mb-2" />
						<div>Loading operator details...</div>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	if (!operator) return null;

	const categoryName =
		operator.service_category?.name ||
		operator.serviceCategory?.name ||
		operator.category_name ||
		'-';

	const paramsList: IOperatorInputParam[] =
		operator.parameters ||
		operator.input_params ||
		operator.input_parameters ||
		operator.params ||
		[];

	const rawPaymentModes =
		operator.payment_modes ||
		(operator as any).operator_payment_modes ||
		(operator as any).paymentModes ||
		[];

	const imgSrc = operator.icon ? getImageUrl(operator.icon) : '';

	const canEdit =
		canUpdate(PERMISSION_KEYS.SERVICE_MANAGEMENT) ||
		canUpdate(PERMISSION_KEYS.OPERATOR) ||
		canUpdate('operator');
	const canDel =
		canDelete(PERMISSION_KEYS.SERVICE_MANAGEMENT) ||
		canDelete(PERMISSION_KEYS.OPERATOR) ||
		canDelete('operator');

	return (
		<PageWrapper isProtected permissionKey={PERMISSION_KEYS.OPERATOR} title={`Operator: ${operator.name}`}>
			<Page container="fluid">
				<div className="operator-view-container d-flex flex-column gap-4 pb-5">
					{/* TOP HEADER WITH BREADCRUMBS & ACTIONS */}
					<div className="card shadow-sm border-0 rounded-3">
						<div className="card-body p-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
							<div>
								<AppBreadcrumbs
									items={[
										{ label: 'Service Management', to: `/${PAGE_ROUTES.OPERATORS}` },
										{ label: 'Operators', to: `/${PAGE_ROUTES.OPERATORS}` },
										{ label: operator.name, current: true },
									]}
								/>
							</div>

							<div className="d-flex align-items-center gap-2">
								<button
									type="button"
									className="btn-secondary-action"
									onClick={() => navigate(`/${PAGE_ROUTES.OPERATORS}`)}>
									<Icon icon="ArrowBack" size="sm" />
									<span>Back to List</span>
								</button>
								{canEdit && (
									<button
										type="button"
										className="btn-add-action"
										onClick={() =>
											navigate(
												`/${PAGE_ROUTES.OPERATORS}/edit/${encryptId(operator.id)}`,
											)
										}>
										<Icon icon="Edit" size="sm" />
										<span>Edit Operator</span>
									</button>
								)}
								{canDel && (
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
					</div>

					{/* 1. TOP SUMMARY CARD */}
					<div className="card shadow-sm border-0 rounded-3">
						<div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-4">
							<div className="d-flex align-items-center gap-4">
								<div
									role="button"
									tabIndex={0}
									onClick={() => imgSrc && setPreviewImage({ url: imgSrc, title: operator.name })}
									onKeyDown={(e) => {
										if (e.key === ' ' || e.key === 'Enter') {
											if (imgSrc) setPreviewImage({ url: imgSrc, title: operator.name });
										}
									}}
									className="rounded-3 bg-light border d-flex align-items-center justify-content-center overflow-hidden shadow-sm flex-shrink-0 cursor-pointer"
									style={{ width: '72px', height: '72px' }}
									title="Click to view full image">
									{imgSrc ? (
										<img
											src={imgSrc}
											alt={operator.name}
											className="w-100 h-100 object-fit-contain p-1"
										/>
									) : (
										<Icon icon="Hub" size="3x" className="text-primary" />
									)}
								</div>

								<div>
									<div className="d-flex align-items-center gap-2 flex-wrap mb-1">
										<h4 className="fw-bold text-dark mb-0">
											{operator.name}
											{operator.short_name && (
												<span className="text-muted fw-normal ms-2" style={{ fontSize: '1rem' }}>
													({operator.short_name})
												</span>
											)}
										</h4>
										<PillBadge
											color={operator.status === 'active' ? 'success' : 'secondary'}
											size="sm">
											{operator.status === 'active' ? 'Active' : 'Inactive'}
										</PillBadge>
									</div>
									{operator.slug && (
										<div className="text-muted small">
											<span className="font-monospace text-secondary">{operator.slug}</span>
										</div>
									)}
								</div>
							</div>

							<div className="d-flex align-items-center gap-4 text-muted small border-start ps-4">
								{operator.created_at && (
									<div>
										<div className="text-muted small">Created Date</div>
										<div className="fw-bold text-dark">{formatDateTime(operator.created_at).date}</div>
										<div className="text-muted" style={{ fontSize: '0.75rem' }}>
											{formatDateTime(operator.created_at).time}
										</div>
									</div>
								)}
								{operator.updated_at && (
									<div>
										<div className="text-muted small">Last Updated</div>
										<div className="fw-bold text-dark">{formatDateTime(operator.updated_at).date}</div>
										<div className="text-muted" style={{ fontSize: '0.75rem' }}>
											{formatDateTime(operator.updated_at).time}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="row g-4">
						{/* 2. GENERAL CONFIGURATION SPECIFICATIONS */}
						<div className="col-12 col-lg-6">
							<div className="operator-card h-100">
								<div className="card-header-bar">
									<div className="header-left">
										<div className="card-header-icon">
											<Icon icon="Info" />
										</div>
										<div>
											<h5 className="card-header-title">General Configuration</h5>
											<p className="card-header-subtitle">Identity & transaction limits</p>
										</div>
									</div>
								</div>
								<div className="card-body-content">
									<table className="table table-sm table-borderless mb-0">
										<tbody>
											<tr>
												<td className="text-muted small fw-semibold" style={{ width: '40%' }}>
													Operator Name:
												</td>
												<td className="fw-bold text-dark small">{operator.name}</td>
											</tr>
											{operator.short_name && (
												<tr>
													<td className="text-muted small fw-semibold">Short Name:</td>
													<td className="small text-dark">{operator.short_name}</td>
												</tr>
											)}
											{operator.slug && (
												<tr>
													<td className="text-muted small fw-semibold">Slug:</td>
													<td className="small font-monospace text-muted">{operator.slug}</td>
												</tr>
											)}
											<tr>
												<td className="text-muted small fw-semibold">Service Category:</td>
												<td className="small">
													<span className="badge bg-light text-dark border">{categoryName}</span>
												</td>
											</tr>
											<tr>
												<td className="text-muted small fw-semibold">Operator Code:</td>
												<td className="small font-monospace fw-bold text-primary">
													{operator.operator_code}
												</td>
											</tr>
											<tr>
												<td className="text-muted small fw-semibold">BBPS Biller ID:</td>
												<td className="small font-monospace text-dark">
													{operator.biller_id || <span className="text-muted">-</span>}
												</td>
											</tr>
											<tr>
												<td className="text-muted small fw-semibold">Amount Limits (₹):</td>
												<td className="small">
													{operator.min_amount != null || operator.max_amount != null ? (
														<span>
															Min: ₹{operator.min_amount ?? 0} | Max:{' '}
															{operator.max_amount != null ? `₹${operator.max_amount}` : 'Unlimited'}
														</span>
													) : (
														<span className="text-muted">No limits configured</span>
													)}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>

						{/* 3. BBPS CAPABILITIES & FLAGS */}
						<div className="col-12 col-lg-6">
							<div className="operator-card h-100">
								<div className="card-header-bar">
									<div className="header-left">
										<div className="card-header-icon">
											<Icon icon="Tune" />
										</div>
										<div>
											<h5 className="card-header-title">BBPS Capabilities & Features</h5>
											<p className="card-header-subtitle">Real-time validation & bill fetching rules</p>
										</div>
									</div>
								</div>
								<div className="card-body-content">
									<div className="d-flex flex-column gap-2">
										<div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
											<div>
												<div className="small fw-bold text-dark">BBPS Routing</div>
												<div className="text-muted" style={{ fontSize: '0.78rem' }}>
													Bharat Bill Payment System protocol switch
												</div>
											</div>
											{operator.is_bbps_enabled ? (
												<span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
													Enabled
												</span>
											) : (
												<span className="badge bg-light text-muted border px-3 py-2">Disabled</span>
											)}
										</div>

										<div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
											<div>
												<div className="small fw-bold text-dark">Bill Fetch Requirement</div>
												<div className="text-muted" style={{ fontSize: '0.78rem' }}>
													Customer fetch bill rule before payment
												</div>
											</div>
											<span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 text-capitalize">
												{operator.bill_fetch_requirement
													? operator.bill_fetch_requirement.replace('_', ' ')
													: operator.is_bill_fetch_available
														? 'Mandatory'
														: 'Not Required'}
											</span>
										</div>

										<div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
											<div>
												<div className="small fw-bold text-dark">Amount Exactness</div>
												<div className="text-muted" style={{ fontSize: '0.78rem' }}>
													Payment amount constraint rule
												</div>
											</div>
											<span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 text-capitalize">
												{operator.amount_exactness
													? operator.amount_exactness === 'exact'
														? 'Exact Amount'
														: operator.amount_exactness === 'above'
															? 'Exact & Above'
															: operator.amount_exactness === 'below'
																? 'Exact & Below (Partial)'
																: 'Any Amount'
													: operator.exact_amount_matching
														? 'Exact Amount'
														: operator.is_partial_pay_allowed
															? 'Exact & Below'
															: 'Any Amount'}
											</span>
										</div>

										<div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
											<div>
												<div className="small fw-bold text-dark">Payment Channel</div>
												<div className="text-muted" style={{ fontSize: '0.78rem' }}>
													BBPS channel identifier
												</div>
											</div>
											<span className="badge bg-light text-dark font-monospace border px-3 py-2">
												{operator.payment_channel || 'AGT'}
											</span>
										</div>

										<div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
											<div>
												<div className="small fw-bold text-dark">Circle / Region ID</div>
												<div className="text-muted" style={{ fontSize: '0.78rem' }}>
													Telecom circle or national region
												</div>
											</div>
											<span className="badge bg-light text-dark font-monospace border px-3 py-2">
												{
													operator.circle_id != null
														? String(operator.circle_id) === '0'
															? 'As Per State'
															: String(operator.circle_id)
														: '-'
												}											</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* 4. SUPPORTED PAYMENT MODES */}
						<div className="col-12">
							<div className="operator-card">
								<div className="card-header-bar">
									<div className="header-left">
										<div className="card-header-icon">
											<Icon icon="Payments" />
										</div>
										<div>
											<h5 className="card-header-title">Supported Payment Modes</h5>
											<p className="card-header-subtitle">Accepted transaction payment channels</p>
										</div>
									</div>
								</div>
								<div className="card-body-content">
									{rawPaymentModes && rawPaymentModes.length > 0 ? (
										<div className="row g-3">
											{rawPaymentModes.map((pm: any) => {
												const min =
													pm.min_amount ??
													pm.OperatorPaymentMode?.min_amount ??
													pm.Operator_Payment_Mode_Model?.min_amount ??
													pm.operator_payment_mode?.min_amount ??
													pm.pivot?.min_amount;
												const max =
													pm.max_amount ??
													pm.OperatorPaymentMode?.max_amount ??
													pm.Operator_Payment_Mode_Model?.max_amount ??
													pm.operator_payment_mode?.max_amount ??
													pm.pivot?.max_amount;
												const isDefault = Boolean(
													pm.is_default ??
													pm.OperatorPaymentMode?.is_default ??
													pm.Operator_Payment_Mode_Model?.is_default ??
													pm.operator_payment_mode?.is_default ??
													pm.pivot?.is_default ??
													false,
												);
												const modeName = pm.name || pm.payment_mode?.name || 'Payment Mode';
												return (
													<div key={pm.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
														<div
															className="p-3 bg-light border rounded-3 h-100"
															style={{ borderRadius: '10px' }}>
															<div className="d-flex align-items-center justify-content-between gap-2 mb-1">
																<div className="d-flex align-items-center gap-2">
																	<Icon icon="CheckCircle" size="sm" className="text-success" />
																	<span className="fw-bold text-dark small">{modeName}</span>
																</div>
																{isDefault && (
																	<span
																		className="badge bg-warning text-dark px-2 py-1 d-inline-flex align-items-center gap-1"
																		style={{ fontSize: '0.7rem' }}>
																		<Icon icon="Star" size="sm" />
																		Default
																	</span>
																)}
															</div>
															{min != null || max != null ? (
																<div className="text-muted small mt-1" style={{ fontSize: '0.78rem' }}>
																	Limit: {min != null ? `₹${min}` : '₹0'} -{' '}
																	{max != null ? `₹${max}` : 'No limit'}
																</div>
															) : (
																<div className="text-muted small mt-1" style={{ fontSize: '0.78rem' }}>
																	Limit: Standard / Default
																</div>
															)}
														</div>
													</div>
												);
											})}
										</div>
									) : (
										<div className="text-muted small fst-italic">
											No specific payment modes restricted (all active modes supported).
										</div>
									)}
								</div>
							</div>
						</div>

						{/* 5. DYNAMIC CONSUMER INPUT PARAMETERS */}
						<div className="col-12">
							<div className="operator-card">
								<div className="card-header-bar">
									<div className="header-left">
										<div className="card-header-icon">
											<Icon icon="Input" />
										</div>
										<div>
											<h5 className="card-header-title">
												Consumer Input Parameters ({paramsList.length})
											</h5>
											<p className="card-header-subtitle">
												Dynamic customer bill parameters for validation and bill fetch
											</p>
										</div>
									</div>
								</div>
								<div className="card-body-content p-0">
									{paramsList.length > 0 ? (
										<div className="table-responsive">
											<table className="table table-hover table-striped align-middle mb-0">
												<thead className="table-light text-muted small">
													<tr>
														<th className="px-4 py-3" style={{ width: '60px' }}>
															#
														</th>
														<th className="px-4 py-3">Parameter Name</th>
														<th className="px-4 py-3">Fetch Key (param_key)</th>
														<th className="px-4 py-3">Payment Key (param_external_id)</th>
														<th className="px-4 py-3">Data Type</th>
														<th className="px-4 py-3 text-center">Min-Max Length</th>
														<th className="px-4 py-3 text-center">Required</th>
														<th className="px-4 py-3">Regex Pattern</th>
														<th className="px-4 py-3">Placeholder / Hint</th>
													</tr>
												</thead>
												<tbody className="small">
													{paramsList.map((param, idx) => (
														<tr key={param.id || idx}>
															<td className="px-4 py-3 text-muted fw-bold">{idx + 1}</td>
															<td className="px-4 py-3 fw-bold text-dark">{param.param_name}</td>
															<td className="px-4 py-3">
																<span className="badge bg-light text-dark font-monospace border">
																	{param.param_key}
																</span>
															</td>
															<td className="px-4 py-3">
																<span className="badge bg-light text-dark font-monospace border">
																	{param.param_external_id || param.param_key}
																</span>
															</td>
															<td className="px-4 py-3">
																<div className="d-flex flex-column gap-1">
																	<span className="badge bg-info-subtle text-info border border-info-subtle text-capitalize align-self-start">
																		{param.param_type || param.data_type || 'text'}
																	</span>
																	{param.options && (
																		<div className="text-muted small" style={{ fontSize: '0.72rem' }}>
																			Choices:{' '}
																			{Array.isArray(param.options)
																				? param.options.join(', ')
																				: param.options}
																		</div>
																	)}
																</div>
															</td>
															<td className="px-4 py-3 text-center font-monospace">
																{param.min_length ?? '-'}&nbsp;–&nbsp;{param.max_length ?? '-'}
															</td>
															<td className="px-4 py-3 text-center">
																{param.is_optional === false || param.is_required === true ? (
																	<span className="badge bg-danger-subtle text-danger border border-danger-subtle">
																		Required
																	</span>
																) : (
																	<span className="badge bg-light text-muted border">
																		Optional
																	</span>
																)}
															</td>
															<td className="px-4 py-3 font-monospace text-muted">
																{param.regex ? (
																	<span
																		className="text-truncate d-inline-block"
																		style={{ maxWidth: '180px' }}
																		title={param.regex}>
																		{param.regex}
																	</span>
																) : (
																	'-'
																)}
															</td>
															<td className="px-4 py-3 text-muted">
																{param.placeholder || '-'}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : (
										<div className="p-5 text-center text-muted small">
											<Icon icon="Info" className="me-1" />
											No custom consumer parameters configured for this operator.
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* DELETE CONFIRMATION MODAL */}
				{isDeleteModalOpen && (
					<ConfirmationModal
						isOpen={isDeleteModalOpen}
						setIsOpen={setIsDeleteModalOpen}
						title="Delete Operator"
						message={`Are you sure you want to delete "${operator.name}"? This action cannot be undone.`}
						confirmText="Delete"
						cancelText="Cancel"
						isLoading={isDeleting}
						onConfirm={handleConfirmDelete}
					/>
				)}

				{/* IMAGE PREVIEW MODAL */}
				{isPreviewModalOpen && previewImage && (
					<ImagePreviewModal
						isOpen={isPreviewModalOpen}
						setIsOpen={setIsPreviewModalOpen}
						imageUrl={previewImage.url}
						title={previewImage.title}
					/>
				)}
			</Page>
		</PageWrapper>
	);
};

export default OperatorViewPage;
