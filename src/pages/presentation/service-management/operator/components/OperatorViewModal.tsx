/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, no-nested-ternary */
import React, { FC } from 'react';
import PropTypes from 'prop-types';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Button from '../../../../../components/bootstrap/Button';
import Icon from '../../../../../components/icon/Icon';
import { IOperator, IOperatorInputParam } from '../type/operator-type';
import { getImageUrl } from '../../../../../helpers/helpers';
import { formatDateTime } from '../../../../../helpers/dateUtils';
import PillBadge from '../../../../../components/common/PillBadge/PillBadge';

interface IOperatorViewModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	operator: IOperator | null;
	onEdit?: (operator: IOperator) => void;
}

export const OperatorViewModal: FC<IOperatorViewModalProps> = ({
	isOpen,
	setIsOpen,
	operator,
	onEdit,
}) => {
	if (!operator) return null;

	const handleClose = () => {
		setIsOpen(false);
	};

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

	const categoryName =
		operator.service_category?.name ||
		operator.serviceCategory?.name ||
		operator.category_name ||
		'-';

	const imgSrc = operator.icon ? getImageUrl(operator.icon) : '';

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} isCentered size="xl">
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id="operator-view-modal-title">
					<div className="d-flex align-items-center gap-2">
						<Icon icon="Hub" color="primary" />
						<span className="fw-bold">Operator Details</span>
						<span className="text-muted fw-normal" style={{ fontSize: '0.9rem' }}>
							({operator.name})
						</span>
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody className="p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
				{/* 1. TOP HEADER SUMMARY CARD */}
				<div className="card shadow-none border bg-light mb-4 rounded-3">
					<div className="card-body p-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
						<div className="d-flex align-items-center gap-3">
							<div
								className="rounded-3 bg-white border d-flex align-items-center justify-content-center overflow-hidden shadow-sm flex-shrink-0"
								style={{ width: '56px', height: '56px' }}>
								{imgSrc ? (
									<img
										src={imgSrc}
										alt={operator.name}
										className="w-100 h-100 object-fit-contain p-1"
										onError={(e) => {
											(e.target as HTMLElement).style.display = 'none';
										}}
									/>
								) : (
									<Icon icon="Hub" size="2x" className="text-primary" />
								)}
							</div>
							<div>
								<div className="d-flex align-items-center gap-2 flex-wrap">
									<h5 className="fw-bold text-dark mb-0">
										{operator.name}
										{operator.short_name && (
											<span className="text-muted fw-normal ms-2" style={{ fontSize: '0.9rem' }}>
												({operator.short_name})
											</span>
										)}
									</h5>
									<PillBadge
										color={operator.status === 'active' ? 'success' : 'secondary'}
										size="sm">
										{operator.status === 'active' ? 'Active' : 'Inactive'}
									</PillBadge>
									{operator.is_bbps_enabled ? (
										<span className="badge bg-primary px-2 py-1" style={{ fontSize: '0.75rem' }}>
											BBPS Enabled
										</span>
									) : (
										<span className="badge bg-secondary px-2 py-1" style={{ fontSize: '0.75rem' }}>
											Non-BBPS
										</span>
									)}
								</div>
								{operator.slug && (
									<div className="text-muted small">
										<span className="font-monospace text-secondary">{operator.slug}</span>
									</div>
								)}
								<div className="d-flex align-items-center gap-3 text-muted small mt-1">
									<span>
										Category: <strong className="text-dark">{categoryName}</strong>
									</span>
									<span>•</span>
									<span>
										Code: <strong className="text-dark font-monospace">{operator.operator_code}</strong>
									</span>
									{operator.biller_id && (
										<>
											<span>•</span>
											<span>
												Biller ID:{' '}
												<strong className="text-dark font-monospace">{operator.biller_id}</strong>
											</span>
										</>
									)}
								</div>
							</div>
						</div>

						{operator.created_at && (
							<div className="text-end text-muted small">
								<div>Created: {formatDateTime(operator.created_at).date}</div>
								<div>Time: {formatDateTime(operator.created_at).time}</div>
							</div>
						)}
					</div>
				</div>

				<div className="row g-4">
					{/* 2. GENERAL SPECIFICATIONS */}
					<div className="col-12 col-lg-6">
						<div className="card shadow-none border h-100 rounded-3">
							<div className="card-header bg-white border-bottom py-2 px-3 d-flex align-items-center gap-2">
								<Icon icon="Info" className="text-primary" />
								<span className="fw-bold small text-uppercase" style={{ letterSpacing: '0.04em' }}>
									General Configuration
								</span>
							</div>
							<div className="card-body p-3">
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
											<td className="text-muted small fw-semibold">Display Order:</td>
											<td className="small">
												<span className="badge bg-light text-dark border">
													{operator.display_order ?? '-'}
												</span>
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
										<tr>
											<td className="text-muted small fw-semibold">Helpline Number:</td>
											<td className="small">
												{operator.help_line_number ? (
													<span className="text-dark fw-medium">{operator.help_line_number}</span>
												) : (
													<span className="text-muted">-</span>
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
						<div className="card shadow-none border h-100 rounded-3">
							<div className="card-header bg-white border-bottom py-2 px-3 d-flex align-items-center gap-2">
								<Icon icon="Tune" className="text-primary" />
								<span className="fw-bold small text-uppercase" style={{ letterSpacing: '0.04em' }}>
									BBPS Capabilities & Features
								</span>
							</div>
							<div className="card-body p-3">
								<div className="d-flex flex-column gap-2">
									<div className="d-flex align-items-center justify-content-between p-2 rounded bg-light border">
										<span className="small fw-semibold text-dark">BBPS Routing</span>
										{operator.is_bbps_enabled ? (
											<span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
												Enabled
											</span>
										) : (
											<span className="badge bg-light text-muted border px-2 py-1">Disabled</span>
										)}
									</div>
									<div className="d-flex align-items-center justify-content-between p-2 rounded bg-light border">
										<span className="small fw-semibold text-dark">Bill Fetch Requirement</span>
										<span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 text-capitalize">
											{operator.bill_fetch_requirement
												? operator.bill_fetch_requirement.replace('_', ' ')
												: operator.is_bill_fetch_available
												? 'Mandatory'
												: 'Not Required'}
										</span>
									</div>
									<div className="d-flex align-items-center justify-content-between p-2 rounded bg-light border">
										<span className="small fw-semibold text-dark">Amount Exactness</span>
										<span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 text-capitalize">
											{operator.amount_exactness
												? operator.amount_exactness === 'exact'
													? 'Exact Amount'
													: operator.amount_exactness === 'above'
													? 'Exact & Above'
													: operator.amount_exactness === 'below'
													? 'Exact & Below'
													: 'Any Amount'
												: operator.exact_amount_matching
												? 'Exact Amount'
												: operator.is_partial_pay_allowed
												? 'Exact & Below'
												: 'Any Amount'}
										</span>
									</div>
									<div className="d-flex align-items-center justify-content-between p-2 rounded bg-light border">
										<span className="small fw-semibold text-dark">Payment Channel</span>
										<span className="badge bg-light text-dark font-monospace border px-2 py-1">
											{operator.payment_channel || 'AGT'}
										</span>
									</div>
									<div className="d-flex align-items-center justify-content-between p-2 rounded bg-light border">
										<span className="small fw-semibold text-dark">Circle / Region ID</span>
										<span className="badge bg-light text-dark font-monospace border px-2 py-1">
											{operator.circle_id != null ? String(operator.circle_id) : '0 (Pan-India)'}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* 4. SUPPORTED PAYMENT MODES */}
					<div className="col-12">
						<div className="card shadow-none border rounded-3">
							<div className="card-header bg-white border-bottom py-2 px-3 d-flex align-items-center gap-2">
								<Icon icon="Payments" className="text-primary" />
								<span className="fw-bold small text-uppercase" style={{ letterSpacing: '0.04em' }}>
									Supported Payment Modes
								</span>
							</div>
							<div className="card-body p-3">
								{rawPaymentModes && rawPaymentModes.length > 0 ? (
									<div className="row g-2">
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
											const modeName = pm.name || pm.payment_mode?.name || 'Payment Mode';
											return (
												<div key={pm.id} className="col-12 col-sm-6 col-md-4">
													<div className="p-2 bg-light border rounded-3">
														<div className="d-flex align-items-center gap-2">
															<Icon icon="CheckCircle" size="sm" className="text-success" />
															<span className="fw-semibold small text-dark">{modeName}</span>
														</div>
														{min != null || max != null ? (
															<div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
																Limit: {min != null ? `₹${min}` : '₹0'} -{' '}
																{max != null ? `₹${max}` : 'No limit'}
															</div>
														) : (
															<div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
																Limit: Default
															</div>
														)}
													</div>
												</div>
											);
										})}
									</div>
								) : (
									<div className="text-muted small fst-italic">
										No specific payment modes restricted (all active modes supported by default).
									</div>
								)}
							</div>
						</div>
					</div>

					{/* 5. DYNAMIC CONSUMER INPUT PARAMETERS */}
					<div className="col-12">
						<div className="card shadow-none border rounded-3">
							<div className="card-header bg-white border-bottom py-2 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
								<div className="d-flex align-items-center gap-2">
									<Icon icon="Input" className="text-primary" />
									<span className="fw-bold small text-uppercase" style={{ letterSpacing: '0.04em' }}>
										Consumer Input Parameters ({paramsList.length})
									</span>
								</div>
								<span className="text-muted small">Dynamic consumer biller fields</span>
							</div>
							<div className="card-body p-0">
								{paramsList.length > 0 ? (
									<div className="table-responsive">
										<table className="table table-hover table-striped align-middle mb-0">
											<thead className="table-light text-muted small">
												<tr>
													<th className="px-3 py-2" style={{ width: '50px' }}>
														#
													</th>
													<th className="px-3 py-2">Parameter Name</th>
													<th className="px-3 py-2">Fetch Key (param_key)</th>
													<th className="px-3 py-2">Payment Key (param_external_id)</th>
													<th className="px-3 py-2">Data Type</th>
													<th className="px-3 py-2 text-center">Min-Max Length</th>
													<th className="px-3 py-2 text-center">Required</th>
													<th className="px-3 py-2">Regex Pattern</th>
													<th className="px-3 py-2">Placeholder / Hint</th>
												</tr>
											</thead>
											<tbody className="small">
												{paramsList.map((param, idx) => (
													<tr key={param.id || idx}>
														<td className="px-3 py-2 text-muted fw-bold">{idx + 1}</td>
														<td className="px-3 py-2 fw-bold text-dark">{param.param_name}</td>
														<td className="px-3 py-2">
															<span className="badge bg-light text-dark font-monospace border">
																{param.param_key}
															</span>
														</td>
														<td className="px-3 py-2">
															<span className="badge bg-light text-dark font-monospace border">
																{param.param_external_id || param.param_key}
															</span>
														</td>
														<td className="px-3 py-2">
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
														<td className="px-3 py-2 text-center font-monospace">
															{param.min_length ?? '-'}&nbsp;–&nbsp;{param.max_length ?? '-'}
														</td>
														<td className="px-3 py-2 text-center">
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
														<td className="px-3 py-2 font-monospace text-muted" style={{ maxWidth: '140px' }}>
															{param.regex ? (
																<span className="text-truncate d-inline-block" style={{ maxWidth: '130px' }} title={param.regex}>
																	{param.regex}
																</span>
															) : (
																'-'
															)}
														</td>
														<td className="px-3 py-2 text-muted">
															{param.placeholder || '-'}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								) : (
									<div className="p-4 text-center text-muted small">
										<Icon icon="Info" className="me-1" />
										No custom consumer parameters configured for this operator.
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</ModalBody>

			<ModalFooter className="px-4 py-3 border-top d-flex justify-content-between">
				<Button type="button" color="light" onClick={handleClose}>
					Close
				</Button>
				{onEdit && (
					<Button
						type="button"
						color="primary"
						className="d-inline-flex align-items-center gap-2"
						onClick={() => {
							handleClose();
							onEdit(operator);
						}}>
						<Icon icon="Edit" size="sm" />
						<span>Edit Operator</span>
					</Button>
				)}
			</ModalFooter>
		</Modal>
	);
};

(OperatorViewModal as any).propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	operator: PropTypes.any,
	onEdit: PropTypes.func,
};

(OperatorViewModal as any).defaultProps = {
	operator: null,
	onEdit: undefined,
};

export default OperatorViewModal;
