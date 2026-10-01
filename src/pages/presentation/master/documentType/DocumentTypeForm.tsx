/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props, react/no-array-index-key */
import React, { FC, useEffect, useRef, useState } from 'react';
import Icon from '../../../../components/icon/Icon';
import roleService from '../../role/service/roleService';
import { IRoleItem } from '../../role/type/role-type';
import {
	IDocumentRoleRequirementInput,
	VerificationServiceType,
	VERIFICATION_SERVICE_OPTIONS,
	DocumentFieldType,
	IDocumentField,
	IDocumentFieldOption,
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
	fields: IDocumentField[];
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

const FIELD_TYPE_OPTIONS: Array<{ value: DocumentFieldType; label: string }> = [
	{ value: 'text', label: 'Text Input' },
	{ value: 'number', label: 'Number Input' },
	{ value: 'select', label: 'Dropdown Select' },
	{ value: 'date', label: 'Date Picker' },
	{ value: 'file', label: 'File Upload' },
	{ value: 'textarea', label: 'Text Area' },
	{ value: 'radio', label: 'Radio Buttons' },
	{ value: 'checkbox', label: 'Checkboxes' },
];

const slugifyCode = (str: string): string => {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
};

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

	// DYNAMIC DOCUMENT FIELDS LIST STATE
	const [fieldsList, setFieldsList] = useState<IDocumentField[]>(
		initialValues?.fields || [],
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

	// Initialize fields list state from initialValues with stable uid
	useEffect(() => {
		if (initialValues?.fields && Array.isArray(initialValues.fields)) {
			setFieldsList(
				initialValues.fields.map((f, i) => ({
					...f,
					_uid: (f as any)._uid || (f.id ? `fid_${f.id}` : `finit_${i}_${Date.now()}`),
				})),
			);
		}
	}, [initialValues]);

	// FETCH ACTIVE ROLES VIA api/role/get-active
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

	// DYNAMIC FIELDS BUILDER HANDLERS
	const handleAddField = (insertAfterIndex?: number) => {
		const newField: IDocumentField & { _uid?: string } = {
			_uid: `field_uid_${Date.now()}_${Math.random()}`,
			field_name: '',
			field_code: '',
			field_type: 'text',
			is_required: false,
			display_order: fieldsList.length + 1,
			placeholder: '',
			options: [],
			status: 'active',
		};

		setFieldsList((prev) => {
			if (typeof insertAfterIndex === 'number' && insertAfterIndex >= 0) {
				const next = [...prev];
				next.splice(insertAfterIndex + 1, 0, newField);
				return next.map((f, i) => ({ ...f, display_order: i + 1 }));
			}
			return [...prev, newField];
		});
	};

	const handleRemoveField = (index: number) => {
		setFieldsList((prev) => prev.filter((_, i) => i !== index));
	};

	const handleFieldChange = (index: number, key: keyof IDocumentField, value: any) => {
		setFieldsList((prev) => {
			const updated = [...prev];
			const item = { ...updated[index] };
			(item as any)[key] = value;

			// Auto generate field_code from field_name
			if (key === 'field_name' && typeof value === 'string') {
				const autoCode = slugifyCode(value);
				const prevNameCode = slugifyCode(prev[index]?.field_name || '');
				if (!item.field_code || item.field_code === prevNameCode) {
					item.field_code = autoCode;
				}
			}

			updated[index] = item;
			return updated;
		});
	};

	const handleAddOption = (fieldIndex: number) => {
		setFieldsList((prev) => {
			const updated = [...prev];
			const item = { ...updated[fieldIndex] };
			const opts = Array.isArray(item.options) ? [...item.options] : [];
			opts.push({ label: '', value: '' });
			item.options = opts as IDocumentFieldOption[];
			updated[fieldIndex] = item;
			return updated;
		});
	};

	const handleOptionChange = (
		fieldIndex: number,
		optionIndex: number,
		key: 'label' | 'value',
		val: string,
	) => {
		setFieldsList((prev) => {
			const updated = [...prev];
			const item = { ...updated[fieldIndex] };
			const rawOpts = Array.isArray(item.options) ? item.options : [];
			const opts: IDocumentFieldOption[] = rawOpts.map((o) =>
				typeof o === 'string' ? { label: o, value: slugifyCode(o) } : { ...o },
			);

			const opt = { ...opts[optionIndex] };
			opt[key] = val;

			if (key === 'label') {
				const autoVal = slugifyCode(val);
				const prevLabelVal = slugifyCode(opts[optionIndex]?.label || '');
				if (!opt.value || opt.value === prevLabelVal) {
					opt.value = autoVal;
				}
			}

			opts[optionIndex] = opt;
			item.options = opts;
			updated[fieldIndex] = item;
			return updated;
		});
	};

	const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
		setFieldsList((prev) => {
			const updated = [...prev];
			const item = { ...updated[fieldIndex] };
			const rawOpts = Array.isArray(item.options) ? item.options : [];
			const opts = rawOpts.filter((_, i) => i !== optionIndex);
			item.options = opts as any;
			updated[fieldIndex] = item;
			return updated;
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

		// VALIDATE DYNAMIC FIELDS
		for (let i = 0; i < fieldsList.length; i += 1) {
			const f = fieldsList[i];
			if (!f.field_name || !f.field_name.trim()) {
				showNotification('Validation Error', `Field #${i + 1} requires a Field Name`, 'warning');
				return;
			}
			if (!f.field_code || !f.field_code.trim()) {
				showNotification('Validation Error', `Field #${i + 1} requires a Field Code`, 'warning');
				return;
			}
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
			fields: fieldsList.map((f, idx) => ({
				...f,
				display_order: f.display_order !== undefined ? Number(f.display_order) : idx + 1,
			})),
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

						{/* MANDATORY DROPDOWN */}
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

						{/* STATUS DROPDOWN */}
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

			{/* CARD 2: DYNAMIC DOCUMENT FIELDS BUILDER */}
			<div className="doc-card">
				<div className="card-header-bar">
					<div className="header-left">
						<div className="card-header-icon">
							<Icon icon="Tune" />
						</div>
						<div>
							<h3 className="card-header-title">Document Fields</h3>
							<p className="card-header-subtitle">
								Configure dynamic input fields and options for this document type
							</p>
						</div>
					</div>
					<button
						type="button"
						className="btn-add-field-action"
						onClick={() => handleAddField()}>
						<Icon icon="Add" size="sm" />
						<span>Add Field</span>
					</button>
				</div>

				<div className="card-body-content">
					{fieldsList.length === 0 ? (
						<div className="p-4 text-center text-muted border rounded-3 bg-light">
							<Icon icon="ListAlt" size="2x" className="mb-2 opacity-50" />
							<p className="mb-0 fw-medium">No dynamic fields configured yet.</p>
							<small>Click <strong>"+ Add Field"</strong> above to configure custom document fields.</small>
						</div>
					) : (
						<div className="fields-builder-container">
							{fieldsList.map((field, index) => {
								const hasOptions =
									field.field_type === 'select' ||
									field.field_type === 'radio' ||
									field.field_type === 'checkbox';

								const fieldOptions: IDocumentFieldOption[] = Array.isArray(field.options)
									? field.options.map((o) =>
											typeof o === 'string'
												? { label: o, value: slugifyCode(o) }
												: o,
									  )
									: [];

								const fieldKey =
									(field as any)._uid ||
									(field.id ? `field_id_${field.id}` : `field_item_${index}`);

								return (
									<div key={fieldKey} className="field-item-card">
										{/* FIELD ITEM HEADER */}
										<div className="field-card-header">
											<div className="d-flex align-items-center gap-2">
												<span className="field-index-badge">Field #{index + 1}</span>
												<span className="field-header-title">
													{field.field_name || 'Untitled Field'}
												</span>
												{field.is_required && (
													<span className="badge bg-danger ms-1" style={{ fontSize: '0.7rem' }}>
														Required
													</span>
												)}
											</div>
											<div className="d-flex align-items-center gap-2">
												<button
													type="button"
													className="btn-add-field-below"
													title="Insert new field after this one"
													onClick={() => handleAddField(index)}>
													<Icon icon="Add" size="sm" />
													<span>Add Below</span>
												</button>
												<button
													type="button"
													className="btn-delete-field"
													onClick={() => handleRemoveField(index)}>
													<Icon icon="Delete" size="sm" />
													<span>Remove</span>
												</button>
											</div>
										</div>

										{/* FIELD ROW 1: NAME, CODE, TYPE, ORDER */}
										<div className="row g-3 mb-3">
											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1">
													Field Name <span className="text-danger">*</span>
												</label>
												<input
													type="text"
													className="form-control role-name-input"
													placeholder="e.g. PAN Number"
													value={field.field_name}
													onChange={(e) =>
														handleFieldChange(index, 'field_name', e.target.value)
													}
													required
												/>
											</div>

											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1">
													Field Code <span className="text-danger">*</span>
												</label>
												<input
													type="text"
													className="form-control role-name-input"
													placeholder="e.g. pan_number"
													value={field.field_code}
													onChange={(e) =>
														handleFieldChange(index, 'field_code', e.target.value)
													}
													required
												/>
											</div>

											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1">
													Field Type <span className="text-danger">*</span>
												</label>
												<select
													className="form-select role-name-input"
													value={field.field_type}
													onChange={(e) =>
														handleFieldChange(
															index,
															'field_type',
															e.target.value as DocumentFieldType,
														)
													}>
													{FIELD_TYPE_OPTIONS.map((opt) => (
														<option key={opt.value} value={opt.value}>
															{opt.label}
														</option>
													))}
												</select>
											</div>

											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1">
													Display Order
												</label>
												<input
													type="number"
													min="1"
													className="form-control role-name-input"
													value={field.display_order || index + 1}
													onChange={(e) =>
														handleFieldChange(
															index,
															'display_order',
															Number(e.target.value),
														)
													}
												/>
											</div>
										</div>

										{/* FIELD ROW 2: PLACEHOLDER, REQUIRED TOGGLE, STATUS */}
										<div className="row g-3 align-items-center">
											<div className="col-12 col-md-5">
												<label className="form-label fw-bold small mb-1">
													Placeholder
												</label>
												<input
													type="text"
													className="form-control role-name-input"
													placeholder="e.g. Enter 10-digit PAN"
													value={field.placeholder || ''}
													onChange={(e) =>
														handleFieldChange(index, 'placeholder', e.target.value)
													}
												/>
											</div>

											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1 d-block">
													Required Field
												</label>
												<div className="form-check form-switch pt-1">
													<input
														className="form-check-input custom-checkbox-styled"
														type="checkbox"
														id={`isRequiredSwitch_${index}`}
														checked={field.is_required}
														onChange={(e) =>
															handleFieldChange(
																index,
																'is_required',
																e.target.checked,
															)
														}
													/>
													<label
														className="form-check-label ms-2 small fw-semibold"
														htmlFor={`isRequiredSwitch_${index}`}>
														{field.is_required ? 'Required' : 'Optional'}
													</label>
												</div>
											</div>

											<div className="col-12 col-md-4">
												<label className="form-label fw-bold small mb-1">
													Field Status
												</label>
												<select
													className="form-select role-name-input"
													value={field.status || 'active'}
													onChange={(e) =>
														handleFieldChange(index, 'status', e.target.value)
													}>
													<option value="active">Active</option>
													<option value="inactive">Inactive</option>
												</select>
											</div>
										</div>

										{/* OPTIONS BUILDER (FOR SELECT, RADIO, CHECKBOX) */}
										{hasOptions && (
											<div className="options-builder-box">
												<div className="options-box-header">
													<div className="options-box-title">
														<Icon icon="List" size="sm" className="me-1" />
														Options Config (for {field.field_type})
													</div>
													<button
														type="button"
														className="btn-add-option-pill"
														onClick={() => handleAddOption(index)}>
														<Icon icon="Add" size="sm" />
														<span>Add Option</span>
													</button>
												</div>

												{fieldOptions.length === 0 ? (
													<p className="text-muted small mb-0 fst-italic">
														No options added yet. Click "+ Add Option" to configure dropdown/radio values.
													</p>
												) : (
													fieldOptions.map((opt, optIdx) => (
														<div key={`f_${index}_opt_${optIdx}`} className="option-row-item">
															<input
																type="text"
																className="form-control form-control-sm role-name-input"
																placeholder="Option Label (e.g. Individual)"
																value={opt.label}
																onChange={(e) =>
																	handleOptionChange(
																		index,
																		optIdx,
																		'label',
																		e.target.value,
																	)
																}
															/>
															<input
																type="text"
																className="form-control form-control-sm role-name-input"
																placeholder="Option Value (e.g. individual)"
																value={opt.value}
																onChange={(e) =>
																	handleOptionChange(
																		index,
																		optIdx,
																		'value',
																		e.target.value,
																	)
																}
															/>
															<button
																type="button"
																className="btn-delete-option"
																title="Remove Option"
																onClick={() => handleRemoveOption(index, optIdx)}>
																<Icon icon="Close" size="sm" />
															</button>
														</div>
													))
												)}
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* CARD 3: ROLE REQUIREMENTS */}
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
