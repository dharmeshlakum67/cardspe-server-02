/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props */
import React, { FC, useEffect, useRef, useState } from 'react';
import Icon from '../../../../components/icon/Icon';
import roleService from '../../role/service/roleService';
import { IRoleItem } from '../../role/type/role-type';
import {
	IDocumentRoleRequirementInput,
	VerificationServiceType,
	VERIFICATION_SERVICE_OPTIONS,
} from './type/document-type';
import { getRoleTypeDetails } from '../../role/util/roleUtils';
import showNotification from '../../../../components/extras/showNotification';
import { PillBadge } from '../../../../components/common/PillBadge';
import AppBreadcrumbs from '../../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import constantService from '../../../../services/constantService';
import './css/DocumentType.scss';

export interface IDocumentTypeFormValues {
	document_name: string;
	document_code: string;
	is_mandatory: boolean;
	required_files_count: number;
	verification_service: VerificationServiceType;
	status: 'active' | 'inactive';
	roles: IDocumentRoleRequirementInput[];
}

interface IDocumentTypeFormProps {
	initialValues?: IDocumentTypeFormValues;
	onSubmit: (values: IDocumentTypeFormValues) => Promise<void>;
	isSubmitting: boolean;
	mode: 'add' | 'edit';
	onCancel: () => void;
}

const DEFAULT_STATUS_OPTIONS: Array<{
	value: 'active' | 'inactive';
	label: string;
	color: string;
}> = [
	{ value: 'active', label: 'Active', color: '#10b981' },
	{ value: 'inactive', label: 'Inactive', color: '#ef4444' },
];

const MANDATORY_OPTIONS: Array<{
	value: boolean;
	label: string;
}> = [
	{ value: true, label: 'Mandatory' },
	{ value: false, label: 'Optional' },
];

export const DocumentTypeForm: FC<IDocumentTypeFormProps> = ({
	initialValues,
	onSubmit,
	isSubmitting,
	mode,
	onCancel,
}) => {
	const [documentName, setDocumentName] = useState<string>(
		initialValues?.document_name || '',
	);
	const [documentCode, setDocumentCode] = useState<string>(
		initialValues?.document_code || '',
	);
	const [isMandatory, setIsMandatory] = useState<boolean>(
		initialValues?.is_mandatory ?? true,
	);
	const [requiredFilesCount, setRequiredFilesCount] = useState<number>(
		initialValues?.required_files_count !== undefined
			? Number(initialValues.required_files_count)
			: 1,
	);
	const [verificationService, setVerificationService] =
		useState<VerificationServiceType>(
			initialValues?.verification_service || 'custom',
		);
	const [status, setStatus] = useState<'active' | 'inactive'>(
		initialValues?.status || 'active',
	);

	const [statusOptions, setStatusOptions] = useState(DEFAULT_STATUS_OPTIONS);
	const [verificationServiceOptions, setVerificationServiceOptions] = useState<
		Array<{ label: string; value: VerificationServiceType }>
	>(VERIFICATION_SERVICE_OPTIONS);

	// Load dynamic constants (status & document_type / verification_services)
	useEffect(() => {
		const loadConstants = async () => {
			try {
				const [sOpts, vOpts] = await Promise.all([
					constantService.getStatusConstants(),
					constantService.getDocumentTypeConstants(),
				]);

				if (sOpts && sOpts.length > 0) {
					setStatusOptions(
						sOpts.map((opt) => ({
							value: opt.value as 'active' | 'inactive',
							label: opt.label,
							color: opt.value === 'active' ? '#10b981' : '#ef4444',
						})),
					);
				}

				if (vOpts && vOpts.length > 0) {
					setVerificationServiceOptions(
						vOpts.map((opt) => ({
							value: opt.value as VerificationServiceType,
							label: opt.label,
						})),
					);
				}
			} catch (err) {
				// keep default options
			}
		};
		loadConstants();
	}, []);

	// Custom React-Select dropdown open states & refs
	const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);
	const [isMandatoryDropdownOpen, setIsMandatoryDropdownOpen] = useState<boolean>(false);
	const [isVerificationDropdownOpen, setIsVerificationDropdownOpen] =
		useState<boolean>(false);

	const statusDropdownRef = useRef<HTMLDivElement>(null);
	const mandatoryDropdownRef = useRef<HTMLDivElement>(null);
	const verificationDropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdowns on click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				statusDropdownRef.current &&
				!statusDropdownRef.current.contains(event.target as Node)
			) {
				setIsStatusDropdownOpen(false);
			}
			if (
				mandatoryDropdownRef.current &&
				!mandatoryDropdownRef.current.contains(event.target as Node)
			) {
				setIsMandatoryDropdownOpen(false);
			}
			if (
				verificationDropdownRef.current &&
				!verificationDropdownRef.current.contains(event.target as Node)
			) {
				setIsVerificationDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Roles management
	const [allRoles, setAllRoles] = useState<IRoleItem[]>([]);
	const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(true);
	const [selectedRoleRequirements, setSelectedRoleRequirements] = useState<
		Record<number, { selected: boolean; is_required: boolean }>
	>({});

	const fetchedActiveRolesRef = useRef<boolean>(false);

	// Initialize selected roles state from initialValues
	useEffect(() => {
		if (initialValues?.roles && Array.isArray(initialValues.roles)) {
			const map: Record<number, { selected: boolean; is_required: boolean }> = {};
			initialValues.roles.forEach((r) => {
				map[r.role_id] = {
					selected: true,
					is_required: Boolean(r.is_required),
				};
			});
			setSelectedRoleRequirements(map);
		}
	}, [initialValues]);

	// FETCH ACTIVE ROLES VIA api/role/get-active (CALLED ONCE ONLY)
	useEffect(() => {
		if (fetchedActiveRolesRef.current) return;
		fetchedActiveRolesRef.current = true;

		const fetchActiveRoles = async () => {
			setIsLoadingRoles(true);
			try {
				const res = await roleService.getActiveRoles();
				if (res?.data && Array.isArray(res.data)) {
					setAllRoles(res.data);
				} else {
					setAllRoles([]);
				}
			} catch (error: any) {
				showNotification(
					'Failed to load active roles',
					error?.message || 'Could not fetch active roles list',
					'warning',
				);
			} finally {
				setIsLoadingRoles(false);
			}
		};

		fetchActiveRoles();
	}, []);

	const handleRoleSelectionToggle = (roleId: number) => {
		setSelectedRoleRequirements((prev) => {
			const current = prev[roleId];
			if (current?.selected) {
				const next = { ...prev };
				delete next[roleId];
				return next;
			}
			return {
				...prev,
				[roleId]: { selected: true, is_required: true },
			};
		});
	};

	const handleRoleIsRequiredToggle = (roleId: number) => {
		setSelectedRoleRequirements((prev) => {
			const current = prev[roleId];
			if (!current?.selected) return prev;
			return {
				...prev,
				[roleId]: {
					...current,
					is_required: !current.is_required,
				},
			};
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!documentName.trim()) {
			showNotification('Validation Error', 'Document name is required', 'warning');
			return;
		}

		if (!documentCode.trim()) {
			showNotification('Validation Error', 'Document code is required', 'warning');
			return;
		}

		if (requiredFilesCount < 0) {
			showNotification(
				'Validation Error',
				'Required files count cannot be negative',
				'warning',
			);
			return;
		}

		const rolesPayload: IDocumentRoleRequirementInput[] = Object.entries(
			selectedRoleRequirements,
		)
			.filter(([, val]) => val.selected)
			.map(([rId, val]) => ({
				role_id: Number(rId),
				is_required: val.is_required,
			}));

		await onSubmit({
			document_name: documentName.trim(),
			document_code: documentCode.trim(),
			is_mandatory: isMandatory,
			required_files_count: Number(requiredFilesCount),
			verification_service: verificationService,
			status,
			roles: rolesPayload,
		});
	};

	const pageTitle =
		mode === 'add'
			? 'Create Document Type'
			: initialValues?.document_name || 'Edit Document Type';

	const selectedStatusOption =
		statusOptions.find((opt) => opt.value === status) || statusOptions[0];

	const selectedMandatoryOption =
		MANDATORY_OPTIONS.find((opt) => opt.value === isMandatory) || MANDATORY_OPTIONS[0];

	const selectedVerificationOption =
		verificationServiceOptions.find(
			(opt) => opt.value === verificationService,
		) || verificationServiceOptions[0] || { label: verificationService, value: verificationService };

	return (
		<form onSubmit={handleSubmit} className="document-type-form-page">
			{/* HEADER & BREADCRUMBS */}
			<div className="doc-page-header">
				<div className="doc-title-section">
					<AppBreadcrumbs
						items={[
							{ label: 'Master' },
							{ label: 'Document Type', to: `/${PAGE_ROUTES.DOCUMENT_TYPE}` },
							{ label: pageTitle, current: true },
						]}
					/>
				</div>
				<div className="doc-header-actions">
					<button
						type="button"
						className="btn-cancel-action"
						onClick={onCancel}
						disabled={isSubmitting}>
						<Icon icon="Cancel" size="sm" />
						<span>Cancel</span>
					</button>
					{(() => {
						let btnText = 'Save Changes';
						if (isSubmitting) btnText = 'Saving...';
						else if (mode === 'add') btnText = 'Save Document Type';
						return (
							<button
								type="submit"
								className="btn-save-action"
								disabled={isSubmitting}>
								<Icon icon="Save" size="sm" />
								<span>{btnText}</span>
							</button>
						);
					})()}
				</div>
			</div>

			{/* CARD 1: GENERAL INFORMATION */}
			<div className="doc-card">
				<div className="card-header-bar">
					<div className="header-left">
						<div className="card-header-icon">
							<Icon icon="Description" />
						</div>
						<div>
							<h3 className="card-header-title">Document Details</h3>
							<p className="card-header-subtitle">
								Basic identity and configuration settings
							</p>
						</div>
					</div>
				</div>

				<div className="card-body-content">
					<div className="row g-3">
						{/* DOCUMENT NAME */}
						<div className="col-12 col-md-6">
							<label htmlFor="docNameInput" className="form-label fw-bold">
								Document Name <span className="text-danger">*</span>
							</label>
							<input
								id="docNameInput"
								type="text"
								className="form-control role-name-input"
								placeholder="e.g. PAN Card, Aadhaar Card"
								value={documentName}
								onChange={(e) => setDocumentName(e.target.value)}
								required
							/>
						</div>

						{/* DOCUMENT CODE */}
						<div className="col-12 col-md-6">
							<label htmlFor="docCodeInput" className="form-label fw-bold">
								Document Code <span className="text-danger">*</span>
							</label>
							<input
								id="docCodeInput"
								type="text"
								className="form-control role-name-input"
								placeholder="e.g. PAN_CARD_01"
								value={documentCode}
								onChange={(e) => setDocumentCode(e.target.value)}
								required
							/>
						</div>

						{/* REQUIRED FILES COUNT */}
						<div className="col-12 col-md-3">
							<label
								htmlFor="requiredFilesCountInput"
								className="form-label fw-bold">
								Required Files Count <span className="text-danger">*</span>
							</label>
							<input
								id="requiredFilesCountInput"
								type="number"
								min="0"
								className="form-control role-name-input"
								value={requiredFilesCount}
								onChange={(e) =>
									setRequiredFilesCount(Math.max(0, Number(e.target.value)))
								}
								required
							/>
						</div>

						{/* CUSTOM REACT-SELECT STYLED MANDATORY DROPDOWN */}
						<div className="col-12 col-md-3" ref={mandatoryDropdownRef}>
							<span className="form-label fw-bold d-block">Document Requirement</span>
							<div className="custom-react-select-wrapper">
								<button
									type="button"
									className={`custom-react-select-control ${
										isMandatoryDropdownOpen ? 'is-open' : ''
									}`}
									onClick={() => {
										setIsMandatoryDropdownOpen(!isMandatoryDropdownOpen);
										setIsStatusDropdownOpen(false);
										setIsVerificationDropdownOpen(false);
									}}>
									<div className="select-value-display">
										<span className="select-text-value">
											{selectedMandatoryOption.label}
										</span>
									</div>
									<span
										className={`select-arrow-icon ${
											isMandatoryDropdownOpen ? 'is-open' : ''
										}`}>
										<Icon icon="KeyboardArrowDown" size="sm" />
									</span>
								</button>

								{isMandatoryDropdownOpen && (
									<div className="custom-react-select-menu">
										{MANDATORY_OPTIONS.map((opt) => (
											<button
												key={String(opt.value)}
												type="button"
												className={`custom-react-select-option ${
													isMandatory === opt.value ? 'is-selected' : ''
												}`}
												onClick={() => {
													setIsMandatory(opt.value);
													setIsMandatoryDropdownOpen(false);
												}}>
												<span className="option-label-text">{opt.label}</span>
												{isMandatory === opt.value && (
													<span className="option-check-icon">
														<Icon icon="Check" size="sm" />
													</span>
												)}
											</button>
										))}
									</div>
								)}
							</div>
						</div>

						{/* VERIFICATION SERVICE DROPDOWN */}
						<div className="col-12 col-md-3" ref={verificationDropdownRef}>
							<span className="form-label fw-bold d-block">
								Verification Service
							</span>
							<div className="custom-react-select-wrapper">
								<button
									type="button"
									className={`custom-react-select-control ${
										isVerificationDropdownOpen ? 'is-open' : ''
									}`}
									onClick={() => {
										setIsVerificationDropdownOpen(!isVerificationDropdownOpen);
										setIsStatusDropdownOpen(false);
										setIsMandatoryDropdownOpen(false);
									}}>
									<div className="select-value-display">
										<span className="select-text-value">
											{selectedVerificationOption.label}
										</span>
									</div>
									<span
										className={`select-arrow-icon ${
											isVerificationDropdownOpen ? 'is-open' : ''
										}`}>
										<Icon icon="KeyboardArrowDown" size="sm" />
									</span>
								</button>

								{isVerificationDropdownOpen && (
									<div className="custom-react-select-menu">
										{verificationServiceOptions.map((opt) => (
											<button
												key={opt.value}
												type="button"
												className={`custom-react-select-option ${
													verificationService === opt.value
														? 'is-selected'
														: ''
												}`}
												onClick={() => {
													setVerificationService(opt.value);
													setIsVerificationDropdownOpen(false);
												}}>
												<span className="option-label-text">{opt.label}</span>
												{verificationService === opt.value && (
													<span className="option-check-icon">
														<Icon icon="Check" size="sm" />
													</span>
												)}
											</button>
										))}
									</div>
								)}
							</div>
						</div>

						{/* CUSTOM REACT-SELECT STYLED STATUS DROPDOWN */}
						<div className="col-12 col-md-3" ref={statusDropdownRef}>
							<span className="form-label fw-bold d-block">Status</span>
							<div className="custom-react-select-wrapper">
								<button
									type="button"
									className={`custom-react-select-control ${
										isStatusDropdownOpen ? 'is-open' : ''
									}`}
									onClick={() => {
										setIsStatusDropdownOpen(!isStatusDropdownOpen);
										setIsMandatoryDropdownOpen(false);
										setIsVerificationDropdownOpen(false);
									}}>
									<div className="select-value-display d-flex align-items-center gap-2">
										<span
											className="status-dot-indicator"
											style={{ backgroundColor: selectedStatusOption.color }}
										/>
										<span className="select-text-value">
											{selectedStatusOption.label}
										</span>
									</div>
									<span
										className={`select-arrow-icon ${
											isStatusDropdownOpen ? 'is-open' : ''
										}`}>
										<Icon icon="KeyboardArrowDown" size="sm" />
									</span>
								</button>

								{isStatusDropdownOpen && (
									<div className="custom-react-select-menu">
										{statusOptions.map((opt) => (
											<button
												key={opt.value}
												type="button"
												className={`custom-react-select-option ${
													status === opt.value ? 'is-selected' : ''
												}`}
												onClick={() => {
													setStatus(opt.value);
													setIsStatusDropdownOpen(false);
												}}>
												<div className="d-flex align-items-center gap-2">
													<span
														className="status-dot-indicator"
														style={{ backgroundColor: opt.color }}
													/>
													<span className="option-label-text">{opt.label}</span>
												</div>
												{status === opt.value && (
													<span className="option-check-icon">
														<Icon icon="Check" size="sm" />
													</span>
												)}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* CARD 2: ROLE REQUIREMENTS */}
			<div className="doc-card">
				<div className="card-header-bar">
					<div className="header-left">
						<div className="card-header-icon">
							<Icon icon="SupervisorAccount" />
						</div>
						<div>
							<h3 className="card-header-title">Role Document Requirements</h3>
							<p className="card-header-subtitle">
								Select roles that require this document type and set their mandatory flag
							</p>
						</div>
					</div>
				</div>

				<div className="card-body-content">
					{(() => {
						if (isLoadingRoles) {
							return <div className="p-4 text-center text-muted">Loading active roles...</div>;
						}
						if (allRoles.length === 0) {
							return <div className="p-4 text-center text-muted">No active roles found</div>;
						}
						return (
							<div className="table-responsive">
							<table className="roles-requirement-table">
								<thead>
									<tr>
										<th style={{ width: '60px' }}>Enable</th>
										<th>Role Name</th>
										<th>Role Type</th>
										<th style={{ width: '150px' }}>Requirement Level</th>
									</tr>
								</thead>
								<tbody>
									{allRoles.map((r) => {
										const rReq = selectedRoleRequirements[r.id];
										const isSelected = Boolean(rReq?.selected);
										const isReq = Boolean(rReq?.is_required);
										const roleTypeMeta = getRoleTypeDetails(r.role_type);

										return (
											<tr key={r.id}>
												<td className="text-center">
													<input
														type="checkbox"
														className="custom-checkbox-styled"
														checked={isSelected}
														onChange={() => handleRoleSelectionToggle(r.id)}
													/>
												</td>
												<td>
													<strong style={{ color: '#0f172a' }}>
														{r.role_name}
													</strong>
												</td>
												<td>
													<PillBadge color={roleTypeMeta.color}>
														{roleTypeMeta.label}
													</PillBadge>
												</td>
												<td>
													{isSelected ? (
														<button
															type="button"
															className={`btn btn-sm ${
																isReq ? 'btn-danger' : 'btn-outline-secondary'
															}`}
															onClick={() => handleRoleIsRequiredToggle(r.id)}
															style={{
																fontSize: '0.75rem',
																fontWeight: 600,
																padding: '0.2rem 0.6rem',
															}}>
															{isReq ? 'Mandatory' : 'Optional'}
														</button>
													) : (
														<span className="text-muted small">N/A</span>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
						);
					})()}
				</div>
			</div>
		</form>
	);
};

export default DocumentTypeForm;
