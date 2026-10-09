/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, no-nested-ternary, jsx-a11y/label-has-associated-control, react/no-array-index-key, react/forbid-prop-types */
import React, { FC, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import {
	IOperator,
	IOperatorInputParam,
	OperatorStatusType,
	IActiveServiceCategoryOption,
	IActivePaymentModeOption,
	BillFetchRequirementType,
	AmountExactnessType,
	ParamType,
	OperatorParamItem,
} from './type/operator-type';
import operatorService from './service/operatorService';
import { getImageUrl } from '../../../../helpers/helpers';
import constantService, { IConstantOption } from '../../../../services/constantService';
import { StatusToggle } from '../../../../components/common';
import './css/Operator.scss';

export interface IOperatorFormProps {
	mode: 'add' | 'edit';
	initialValues?: IOperator | null;
	onSubmit: (payload: FormData) => Promise<void>;
	onCancel: () => void;
	isSubmitting: boolean;
}

const BILL_FETCH_REQUIREMENT_OPTIONS: { label: string; value: BillFetchRequirementType }[] = [
	{ label: 'Mandatory (Must fetch bill)', value: 'mandatory' },
	{ label: 'Optional (Fetch or Enter amount)', value: 'optional' },
	{ label: 'Not Supported (Direct pay only)', value: 'not_supported' },
	{ label: 'Not Required (Direct recharge/pay)', value: 'not_required' },
];

const AMOUNT_EXACTNESS_OPTIONS: { label: string; value: AmountExactnessType }[] = [
	{ label: 'Exact Amount', value: 'exact' },
	{ label: 'Exact and Above', value: 'above' },
	{ label: 'Exact and Below', value: 'below' },
	{ label: 'Any Amount', value: 'any' },
];

const PARAM_TYPE_OPTIONS: { label: string; value: ParamType }[] = [
	{ label: 'Text (Single Line)', value: 'text' },
	{ label: 'Numeric (Digits Only)', value: 'number' },
	{ label: 'Alphanumeric', value: 'alphanumeric' },
	{ label: 'Dropdown / Select', value: 'select' },
	{ label: 'Date Picker', value: 'date' },
];

export const OperatorForm: FC<IOperatorFormProps> = ({
	mode,
	initialValues,
	onSubmit,
	onCancel,
	isSubmitting,
}) => {
	// FORM STATE: BASIC DETAILS
	const [name, setName] = useState<string>('');
	const [operatorCode, setOperatorCode] = useState<string>('');
	const [serviceCategoryId, setServiceCategoryId] = useState<string>('');
	const [billerId, setBillerId] = useState<string>('');
	const [shortName, setShortName] = useState<string>('');
	const [minAmount, setMinAmount] = useState<string>('1.00');
	const [maxAmount, setMaxAmount] = useState<string>('500000.00');
	const [helpLineNumber, setHelpLineNumber] = useState<string>('');
	const [status, setStatus] = useState<OperatorStatusType>('active');

	// ICON STATE
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>('');
	const [isDeleteIcon, setIsDeleteIcon] = useState<boolean>(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// FORM STATE: BBPS & BILLING CONFIGURATION
	const [isBbpsEnabled, setIsBbpsEnabled] = useState<boolean>(true);
	const [billFetchRequirement, setBillFetchRequirement] =
		useState<BillFetchRequirementType>('mandatory');
	const [amountExactness, setAmountExactness] = useState<AmountExactnessType>('exact');
	const [paymentChannel, setPaymentChannel] = useState<string>('AGT');
	const [circleId, setCircleId] = useState<string>('0');

	// FORM STATE: PAYMENT MODES
	const [selectedPaymentModeIds, setSelectedPaymentModeIds] = useState<number[]>([]);
	const [paymentModeConfigs, setPaymentModeConfigs] = useState<
		Record<number, { min_amount: string; max_amount: string; is_default?: boolean; status?: string }>
	>({});

	// FORM STATE: DYNAMIC INPUT PARAMETERS
	const [inputParams, setInputParams] = useState<IOperatorInputParam[]>([]);

	// DEPENDENT DATA
	const [categories, setCategories] = useState<IActiveServiceCategoryOption[]>([]);
	const [paymentModes, setPaymentModes] = useState<IActivePaymentModeOption[]>([]);
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
	]);

	// HELPER: PARSE PAYMENT MODES AND LIMITS
	const parsePaymentModesData = (data: any) => {
		const configs: Record<
			number,
			{ min_amount: string; max_amount: string; is_default?: boolean; status?: string }
		> = {};
		const ids: number[] = [];

		const rawPms =
			data.payment_modes ||
			data.paymentModes ||
			data.operator_payment_modes ||
			data.operatorPaymentModes ||
			[];
		if (Array.isArray(rawPms) && rawPms.length > 0) {
			rawPms.forEach((pm: any) => {
				const pmId = Number(pm.payment_mode_id || pm.id);
				if (pmId) {
					ids.push(pmId);
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
					const isDef = Boolean(
						pm.is_default ??
						pm.OperatorPaymentMode?.is_default ??
						pm.Operator_Payment_Mode_Model?.is_default ??
						pm.operator_payment_mode?.is_default ??
						pm.pivot?.is_default ??
						false,
					);
					const st =
						pm.status ??
						pm.OperatorPaymentMode?.status ??
						pm.Operator_Payment_Mode_Model?.status ??
						pm.operator_payment_mode?.status ??
						'active';
					configs[pmId] = {
						min_amount: min != null ? String(min) : '',
						max_amount: max != null ? String(max) : '',
						is_default: isDef,
						status: st,
					};
				}
			});
		} else if (Array.isArray(data.payment_mode_ids)) {
			data.payment_mode_ids.forEach((id: number) => {
				const numId = Number(id);
				if (numId) {
					ids.push(numId);
					configs[numId] = { min_amount: '', max_amount: '', is_default: false, status: 'active' };
				}
			});
		}

		return { ids, configs };
	};

	// LOAD CATEGORIES, PAYMENT MODES & STATUS OPTIONS
	useEffect(() => {
		operatorService
			.getActiveServiceCategories()
			.then((res) => {
				if (Array.isArray(res?.data)) {
					setCategories(res.data);
				}
			})
			.catch(() => { });

		operatorService
			.getActivePaymentModes()
			.then((res) => {
				if (Array.isArray(res?.data)) {
					setPaymentModes(res.data);
				}
			})
			.catch(() => { });

		constantService
			.getStatusConstants()
			.then((sOpts) => {
				if (sOpts && sOpts.length > 0) setStatusOptions(sOpts);
			})
			.catch(() => { });
	}, []);

	// POPULATE INITIAL VALUES (EDIT MODE)
	useEffect(() => {
		if (initialValues) {
			setName(initialValues.name || '');
			setOperatorCode(String(initialValues.operator_code || ''));
			setServiceCategoryId(String(initialValues.service_category_id || ''));
			setBillerId(initialValues.biller_id || '');
			setShortName(initialValues.short_name || '');
			setMinAmount(initialValues.min_amount != null ? String(initialValues.min_amount) : '1.00');
			setMaxAmount(
				initialValues.max_amount != null ? String(initialValues.max_amount) : '500000.00',
			);
			setHelpLineNumber(initialValues.help_line_number || '');
			setStatus(initialValues.status || 'active');

			setIsBbpsEnabled(initialValues.is_bbps_enabled ?? true);
			setBillFetchRequirement(
				initialValues.bill_fetch_requirement ||
				(initialValues.is_bill_fetch_available ? 'mandatory' : 'not_required'),
			);
			setAmountExactness(
				initialValues.amount_exactness ||
				(initialValues.exact_amount_matching
					? 'exact'
					: initialValues.is_partial_pay_allowed
						? 'below'
						: 'any'),
			);
			setPaymentChannel(initialValues.payment_channel || 'AGT');
			setCircleId(initialValues.circle_id != null ? String(initialValues.circle_id) : '0');

			const parsedPms = parsePaymentModesData(initialValues);
			setSelectedPaymentModeIds(parsedPms.ids);
			setPaymentModeConfigs(parsedPms.configs);

			const rawParams =
				initialValues.parameters ||
				initialValues.input_params ||
				initialValues.input_parameters ||
				initialValues.params ||
				[];
			if (rawParams.length > 0) {
				setInputParams(
					rawParams.map((p: any, idx: number) => ({
						id: p.id,
						param_name: p.param_name || '',
						param_key: p.param_key || `param${idx + 1}`,
						param_type: p.param_type || p.data_type?.toLowerCase() || 'number',
						data_type: p.param_type || p.data_type || 'number',
						min_length: p.min_length != null ? p.min_length : null,
						max_length: p.max_length != null ? p.max_length : null,
						is_optional: p.is_optional ?? false,
						is_required: p.is_required ?? !p.is_optional,
						regex: p.regex || '',
						placeholder: p.placeholder || '',
						display_order: p.display_order != null ? p.display_order : idx + 1,
						options: Array.isArray(p.options) ? p.options.join(', ') : (p.options || ''),
					})),
				);
			}

			setSelectedFile(null);
			setIsDeleteIcon(false);
			setImagePreview(initialValues.icon ? getImageUrl(initialValues.icon) : '');
		}
	}, [initialValues]);

	// ICON HANDLERS
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.match(/^image\/(png|jpeg|jpg|webp|svg\+xml)$/)) {
				showNotification(
					'Invalid File',
					'Please upload a valid image file (PNG, JPG, WEBP, SVG)',
					'danger',
				);
				return;
			}
			if (file.size > 2 * 1024 * 1024) {
				showNotification('File Too Large', 'Image size must be less than 2MB', 'danger');
				return;
			}
			setSelectedFile(file);
			setIsDeleteIcon(false);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveIcon = () => {
		setSelectedFile(null);
		setImagePreview('');
		setIsDeleteIcon(true);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

	useEffect(() => {
		const handleClickOutside = () => {
			setOpenDropdownIndex(null);
		};
		window.addEventListener('click', handleClickOutside);
		return () => window.removeEventListener('click', handleClickOutside);
	}, []);

	// DYNAMIC PARAMETER HANDLERS
	const handleAddParam = (insertIndex?: number) => {
		const newParam: IOperatorInputParam = {
			param_name: '',
			param_key: '',
			param_external_id: '',
			param_type: 'text',
			regex: '',
			min_length: null,
			max_length: null,
			is_optional: false,
			placeholder: '',
			display_order: 1,
			options: '',
		};
		setInputParams((prev) => {
			let updated: IOperatorInputParam[];
			if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= prev.length) {
				updated = [...prev.slice(0, insertIndex), newParam, ...prev.slice(insertIndex)];
			} else {
				updated = [...prev, newParam];
			}
			return updated.map((p, idx) => ({
				...p,
				param_index: idx + 1,
				param_key: p.param_key || `param${idx + 1}`,
				param_external_id: p.param_external_id || p.param_key || `param${idx + 1}`,
				display_order: idx + 1,
			}));
		});
	};

	const handleAddAbove = (index: number) => {
		handleAddParam(index);
	};

	const handleAddBelow = (index: number) => {
		handleAddParam(index + 1);
	};

	const handleUpdateParam = (index: number, field: keyof IOperatorInputParam, value: any) => {
		setInputParams((prev) => {
			const updated = [...prev];
			const current = { ...updated[index], [field]: value };
			if (field === 'param_key') {
				// If external id was matching old key or empty, auto-sync
				if (!current.param_external_id || current.param_external_id === updated[index].param_key) {
					current.param_external_id = value;
				}
			}
			updated[index] = current;
			return updated;
		});
	};

	const handleRemoveParam = (index: number) => {
		setInputParams((prev) => prev.filter((_, i) => i !== index));
	};

	// PAYMENT MODE TOGGLE HANDLERS
	const handleTogglePaymentMode = (pmId: number) => {
		setSelectedPaymentModeIds((prev) => {
			if (prev.includes(pmId)) {
				return prev.filter((id) => id !== pmId);
			}
			return [...prev, pmId];
		});
		setPaymentModeConfigs((prev) => {
			if (prev[pmId]) {
				if (prev[pmId].is_default) {
					return {
						...prev,
						[pmId]: {
							...prev[pmId],
							is_default: false,
						},
					};
				}
				return prev;
			}
			return {
				...prev,
				[pmId]: { min_amount: '', max_amount: '', is_default: false, status: 'active' },
			};
		});
	};

	const handleSetDefaultPaymentMode = (pmId: number) => {
		setPaymentModeConfigs((prev) => {
			const updated: Record<
				number,
				{ min_amount: string; max_amount: string; is_default?: boolean; status?: string }
			> = {};
			Object.keys(prev).forEach((key) => {
				const id = Number(key);
				updated[id] = {
					...prev[id],
					is_default: id === pmId,
				};
			});
			if (!updated[pmId]) {
				updated[pmId] = { min_amount: '', max_amount: '', is_default: true, status: 'active' };
			}
			return updated;
		});
	};

	const handlePaymentModeAmountChange = (
		pmId: number,
		field: 'min_amount' | 'max_amount',
		val: string,
	) => {
		setPaymentModeConfigs((prev) => ({
			...prev,
			[pmId]: {
				...prev[pmId],
				min_amount: prev[pmId]?.min_amount ?? '',
				max_amount: prev[pmId]?.max_amount ?? '',
				[field]: val,
			},
		}));
	};

	const handleSelectAllPaymentModes = () => {
		setSelectedPaymentModeIds(paymentModes.map((pm) => pm.id));
		setPaymentModeConfigs((prev) => {
			const updated = { ...prev };
			paymentModes.forEach((pm) => {
				if (!updated[pm.id]) {
					updated[pm.id] = { min_amount: '', max_amount: '', is_default: false, status: 'active' };
				}
			});
			return updated;
		});
	};

	const handleClearPaymentModes = () => {
		setSelectedPaymentModeIds([]);
		setPaymentModeConfigs((prev) => {
			const updated: Record<
				number,
				{ min_amount: string; max_amount: string; is_default?: boolean; status?: string }
			> = {};
			Object.keys(prev).forEach((key) => {
				const id = Number(key);
				updated[id] = {
					...prev[id],
					is_default: false,
				};
			});
			return updated;
		});
	};

	// FORM SUBMIT
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			showNotification('Validation Error', 'Operator name is required', 'warning');
			return;
		}

		if (!operatorCode.trim()) {
			showNotification('Validation Error', 'Operator code is required', 'warning');
			return;
		}

		if (!serviceCategoryId) {
			showNotification('Validation Error', 'Service category is required', 'warning');
			return;
		}

		// Validate parameters
		for (let i = 0; i < inputParams.length; i += 1) {
			const p = inputParams[i];
			if (!p.param_name.trim()) {
				showNotification(
					'Validation Error',
					`Parameter #${i + 1} is missing a Label`,
					'warning',
				);
				return;
			}
			if (!p.param_key.trim()) {
				showNotification(
					'Validation Error',
					`Parameter #${i + 1} is missing a Parameter Key`,
					'warning',
				);
				return;
			}
		}

		const cleanParams: OperatorParamItem[] = inputParams.map((p, idx) => {
			let optArray: string[] | null = null;
			if (p.param_type === 'select') {
				if (Array.isArray(p.options)) {
					optArray = p.options;
				} else if (typeof p.options === 'string' && p.options.trim()) {
					optArray = p.options
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean);
				}
			}
			return {
				...(p.id ? { id: p.id } : {}),
				param_index: idx + 1,
				param_name: p.param_name.trim(),
				param_key: p.param_key.trim(),
				param_external_id: (p.param_external_id || p.param_key).trim(),
				param_type: (p.param_type || 'text') as ParamType,
				regex: p.regex?.trim() || null,
				min_length:
					p.min_length != null && !Number.isNaN(Number(p.min_length))
						? Number(p.min_length)
						: null,
				max_length:
					p.max_length != null && !Number.isNaN(Number(p.max_length))
						? Number(p.max_length)
						: null,
				is_optional: Boolean(p.is_optional ?? !p.is_required),
				placeholder: p.placeholder?.trim() || null,
				display_order: p.display_order != null ? Number(p.display_order) : idx + 1,
				options: optArray,
			};
		});

		// Build formatted payment_modes array payload
		const paymentModesPayload = selectedPaymentModeIds.map((id) => {
			const config = paymentModeConfigs[id] || {
				min_amount: '',
				max_amount: '',
				is_default: false,
				status: 'active',
			};
			return {
				payment_mode_id: id,
				min_amount:
					config.min_amount !== '' &&
						config.min_amount != null &&
						!Number.isNaN(Number(config.min_amount))
						? Number(config.min_amount)
						: null,
				max_amount:
					config.max_amount !== '' &&
						config.max_amount != null &&
						!Number.isNaN(Number(config.max_amount))
						? Number(config.max_amount)
						: null,
				is_default: Boolean(config.is_default),
				status: config.status || 'active',
			};
		});

		const formData = new FormData();
		formData.append('service_category_id', String(serviceCategoryId));
		formData.append('operator_code', operatorCode.trim());
		if (billerId.trim()) formData.append('biller_id', billerId.trim());
		formData.append('name', name.trim());
		formData.append('short_name', shortName.trim());
		formData.append('status', status);

		formData.append('is_bbps_enabled', String(isBbpsEnabled));
		formData.append('bill_fetch_requirement', billFetchRequirement);
		formData.append('amount_exactness', amountExactness);
		formData.append('payment_channel', paymentChannel.trim() || 'AGT');
		formData.append('circle_id', circleId.trim() || '0');
		formData.append('min_amount', String(minAmount || 1.00));
		formData.append('max_amount', String(maxAmount || 500000.00));

		formData.append('parameters', JSON.stringify(cleanParams));
		formData.append('payment_modes', JSON.stringify(paymentModesPayload));

		if (selectedFile) {
			formData.append('icon', selectedFile);
		} else if (isDeleteIcon) {
			formData.append('is_delete_icon', 'true');
		}

		await onSubmit(formData);
	};

	const inputStyle: React.CSSProperties = {
		height: '38px',
		borderRadius: '0.5rem',
		border: '1px solid #cbd5e1',
		fontSize: '0.9rem',
	};

	return (
		<div className="operator-form-container">
			<form onSubmit={handleSubmit} className="d-flex flex-column gap-4 pb-5">
				{/* 1. TOP HEADER ACTION BAR */}
				<div className="card shadow-sm border-0 rounded-3">
					<div className="card-body p-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
						<div className="d-flex align-items-center gap-3">
							<button
								type="button"
								className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center"
								style={{ width: '38px', height: '38px' }}
								onClick={onCancel}>
								<Icon icon="ArrowBack" size="sm" />
							</button>
							<div>
								<h4 className="fw-bold mb-0 text-dark">
									{mode === 'edit' ? 'Edit Operator' : 'Create New Operator'}
								</h4>
								<span className="text-muted small">
									{mode === 'edit'
										? `Update configuration details for "${initialValues?.name || 'Operator'}"`
										: 'Configure a new BBPS biller / operator with dynamic consumer parameters'}
								</span>
							</div>
						</div>

						<div className="d-flex align-items-center gap-2">
							<button
								type="button"
								className="btn-cancel-action"
								onClick={onCancel}
								disabled={isSubmitting}>
								Cancel
							</button>
							<button
								type="submit"
								className="btn-save-action"
								disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Spinner isSmall inButton isGrow className="me-1" />
										<span>Saving...</span>
									</>
								) : (
									<>
										<Icon icon="Save" size="sm" />
										<span>{mode === 'edit' ? 'Save Changes' : 'Create Operator'}</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>

				{/* 2. CARD: BASIC & GENERAL DETAILS */}
				<div className="operator-card">
					<div className="card-header-bar">
						<div className="header-left">
							<div className="card-header-icon">
								<Icon icon="Info" />
							</div>
							<div>
								<h5 className="card-header-title">General Information</h5>
								<p className="card-header-subtitle">
									Basic identity, category, and limits configuration
								</p>
							</div>
						</div>
					</div>
					<div className="card-body-content">
						<div className="row g-3">
							{/* OPERATOR NAME */}
							<div className="col-12 col-md-6">
								<label htmlFor="opName" className="form-label fw-bold small mb-1">
									Operator Name <span className="text-danger">*</span>
								</label>
								<input
									id="opName"
									type="text"
									className="form-control role-name-input"
									placeholder="e.g. Torrent Power, Airtel Postpaid"
									value={name}
									onChange={(e) => setName(e.target.value)}
									style={inputStyle}
									required
								/>
							</div>

							{/* OPERATOR CODE */}
							<div className="col-12 col-md-6">
								<label htmlFor="opCode" className="form-label fw-bold small mb-1">
									Operator Code <span className="text-danger">*</span>
								</label>
								<input
									id="opCode"
									type="text"
									className="form-control role-name-input font-monospace"
									placeholder="e.g. 208, AIRPOST"
									value={operatorCode}
									onChange={(e) => setOperatorCode(e.target.value)}
									style={inputStyle}
									required
								/>
							</div>

							{/* SERVICE CATEGORY */}
							<div className="col-12 col-md-6">
								<label htmlFor="opCatSelect" className="form-label fw-bold small mb-1">
									Service Category <span className="text-danger">*</span>
								</label>
								<select
									id="opCatSelect"
									className="form-select role-name-input"
									value={serviceCategoryId}
									onChange={(e) => setServiceCategoryId(e.target.value)}
									style={inputStyle}
									required>
									<option value="">Select Service Category...</option>
									{categories.map((cat) => (
										<option key={cat.id} value={cat.id}>
											{cat.name}
										</option>
									))}
								</select>
							</div>

							{/* BBPS BILLER ID */}
							<div className="col-12 col-md-6">
								<label htmlFor="opBillerId" className="form-label fw-bold small mb-1">
									BBPS Biller ID <span className="text-muted fw-normal">(Optional)</span>
								</label>
								<input
									id="opBillerId"
									type="text"
									className="form-control role-name-input font-monospace"
									placeholder="e.g. TORR00000NAT01"
									value={billerId}
									onChange={(e) => setBillerId(e.target.value)}
									style={inputStyle}
								/>
							</div>

							{/* SHORT NAME */}
							<div className="col-12 col-md-3">
								<label htmlFor="opShortName" className="form-label fw-bold small mb-1">
									Short Name <span className="text-muted fw-normal">(Optional)</span>
								</label>
								<input
									id="opShortName"
									type="text"
									className="form-control role-name-input"
									placeholder="e.g. DGVCL, SMC"
									value={shortName}
									onChange={(e) => setShortName(e.target.value)}
									style={inputStyle}
								/>
							</div>

							{/* STATUS */}
							<div className="col-12 col-md-3">
								<label htmlFor="opStatus" className="form-label fw-bold small mb-1">
									Status
								</label>
								<select
									id="opStatus"
									className="form-select role-name-input"
									value={status}
									onChange={(e) => setStatus(e.target.value as OperatorStatusType)}
									style={inputStyle}>
									{statusOptions.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
							</div>

							{/* MIN AMOUNT */}
							<div className="col-12 col-md-3">
								<label htmlFor="opMinAmt" className="form-label fw-bold small mb-1">
									Min Amount (₹)
								</label>
								<input
									id="opMinAmt"
									type="number"
									min="0"
									step="any"
									className="form-control role-name-input"
									placeholder="e.g. 10"
									value={minAmount}
									onChange={(e) => setMinAmount(e.target.value)}
									style={inputStyle}
								/>
							</div>

							{/* MAX AMOUNT */}
							<div className="col-12 col-md-3">
								<label htmlFor="opMaxAmt" className="form-label fw-bold small mb-1">
									Max Amount (₹)
								</label>
								<input
									id="opMaxAmt"
									type="number"
									min="0"
									step="any"
									className="form-control role-name-input"
									placeholder="e.g. 50000"
									value={maxAmount}
									onChange={(e) => setMaxAmount(e.target.value)}
									style={inputStyle}
								/>
							</div>

							{/* OPERATOR LOGO UPLOAD */}
							<div className="col-12 col-md-6">
								<label className="form-label fw-bold small mb-1">Operator Logo / Icon</label>
								<div className="d-flex align-items-center gap-3">
									<div
										className="rounded-3 bg-light border d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
										style={{ width: '48px', height: '48px' }}>
										{imagePreview ? (
											<img
												src={imagePreview}
												alt="Operator preview"
												className="w-100 h-100 object-fit-contain p-1"
											/>
										) : (
											<Icon icon="Hub" className="text-muted" size="lg" />
										)}
									</div>
									<div className="d-flex align-items-center gap-2 flex-grow-1">
										<input
											ref={fileInputRef}
											type="file"
											id="operatorLogoFileInput"
											accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
											className="d-none"
											onChange={handleFileChange}
										/>
										<button
											type="button"
											className="btn-secondary-action"
											onClick={() => fileInputRef.current?.click()}>
											<Icon icon="Upload" size="sm" />
											<span>{imagePreview ? 'Change Logo' : 'Upload Logo'}</span>
										</button>
										{imagePreview && (
											<button
												type="button"
												className="btn-delete-action"
												onClick={handleRemoveIcon}
												title="Remove Logo">
												<Icon icon="Delete" size="sm" />
												<span>Remove</span>
											</button>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* 3. CARD: BBPS & BILLING CONFIGURATION */}
				<div className="operator-card">
					<div className="card-header-bar">
						<div className="header-left">
							<div className="card-header-icon">
								<Icon icon="Tune" />
							</div>
							<div>
								<h5 className="card-header-title">BBPS & Billing Configuration</h5>
								<p className="card-header-subtitle">
									Configure transaction processing rules, bill fetching requirements, exactness, and payment channel
								</p>
							</div>
						</div>
					</div>
					<div className="card-body-content">
						<div className="row g-3">
							{/* BBPS ENABLED */}
							<div className="col-12 col-md-6 col-lg-4">
								<div
									role="button"
									tabIndex={0}
									onClick={() => setIsBbpsEnabled(!isBbpsEnabled)}
									onKeyDown={(e) => {
										if (e.key === ' ' || e.key === 'Enter') setIsBbpsEnabled(!isBbpsEnabled);
									}}
									className={`card shadow-none border p-3 rounded-3 h-100 transition-all cursor-pointer ${isBbpsEnabled ? 'border-primary bg-primary-subtle' : 'bg-white'
										}`}>
									<div className="d-flex align-items-center justify-content-between mb-2">
										<span className="fw-bold text-dark small">BBPS Routing</span>
										<StatusToggle
											checked={isBbpsEnabled}
											onChange={(checked) => setIsBbpsEnabled(checked)}
											onText="Enabled"
											offText="Disabled"
										/>
									</div>
									<p className="text-muted small mb-0">
										Tells whether this biller routes through Bharat BillPay (BBPS) switch or direct API.
									</p>
								</div>
							</div>

							{/* BILL FETCH REQUIREMENT */}
							<div className="col-12 col-md-6 col-lg-4">
								<label htmlFor="billFetchReq" className="form-label fw-bold small mb-1">
									Bill Fetch Requirement <span className="text-danger">*</span>
								</label>
								<select
									id="billFetchReq"
									className="form-select role-name-input"
									value={billFetchRequirement}
									onChange={(e) =>
										setBillFetchRequirement(e.target.value as BillFetchRequirementType)
									}
									style={inputStyle}>
									{BILL_FETCH_REQUIREMENT_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
								<span className="text-muted small" style={{ fontSize: '0.75rem' }}>
									Controls if customer must fetch bill before paying (e.g. Electricity vs Mobile)
								</span>
							</div>

							{/* AMOUNT EXACTNESS */}
							<div className="col-12 col-md-6 col-lg-4">
								<label htmlFor="amountExactness" className="form-label fw-bold small mb-1">
									Amount Exactness <span className="text-danger">*</span>
								</label>
								<select
									id="amountExactness"
									className="form-select role-name-input"
									value={amountExactness}
									onChange={(e) => setAmountExactness(e.target.value as AmountExactnessType)}
									style={inputStyle}>
									{AMOUNT_EXACTNESS_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
								<span className="text-muted small" style={{ fontSize: '0.75rem' }}>
									Allowed payment amount relationship (Exact, Above/Advance, Below/Partial, Any)
								</span>
							</div>

							{/* PAYMENT CHANNEL */}
							<div className="col-12 col-md-6">
								<label htmlFor="paymentChannel" className="form-label fw-bold small mb-1">
									Payment Channel
								</label>
								<input
									id="paymentChannel"
									type="text"
									className="form-control role-name-input font-monospace"
									placeholder="AGT"
									value={paymentChannel}
									onChange={(e) => setPaymentChannel(e.target.value)}
									style={inputStyle}
								/>
								<span className="text-muted small" style={{ fontSize: '0.75rem' }}>
									BBPS channel identifier (AGT = Agent Assisted Outlet, INT = Web, MOB = Mobile App)
								</span>
							</div>

							{/* CIRCLE ID */}
							<div className="col-12 col-md-6">
								<label htmlFor="circleId" className="form-label fw-bold small mb-1">
									Circle / Region ID
								</label>
								<input
									id="circleId"
									type="text"
									className="form-control role-name-input font-monospace"
									placeholder="0"
									value={circleId}
									onChange={(e) => setCircleId(e.target.value)}
									style={inputStyle}
								/>
								<span className="text-muted small" style={{ fontSize: '0.75rem' }}>
									Telecom circle / region ID (0 = Pan-India / National)
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* 4. CARD: SUPPORTED PAYMENT MODES */}
				<div className="operator-card">
					<div className="card-header-bar">
						<div className="header-left">
							<div className="card-header-icon">
								<Icon icon="Payments" />
							</div>
							<div>
								<h5 className="card-header-title">
									Supported Payment Modes ({selectedPaymentModeIds.length})
								</h5>
								<p className="card-header-subtitle">
									Select accepted payment channels for this operator
								</p>
							</div>
						</div>
						<div className="d-flex align-items-center gap-2">
							<button
								type="button"
								className="btn-secondary-action"
								onClick={handleSelectAllPaymentModes}>
								Select All
							</button>
							<button
								type="button"
								className="btn-secondary-action"
								onClick={handleClearPaymentModes}>
								Clear All
							</button>
						</div>
					</div>
					<div className="card-body-content">
						{paymentModes.length > 0 ? (
							<div className="row g-3">
								{paymentModes.map((pm) => {
									const isSelected = selectedPaymentModeIds.includes(pm.id);
									const config = paymentModeConfigs[pm.id] || {
										min_amount: '',
										max_amount: '',
										is_default: false,
									};
									return (
										<div key={pm.id} className="col-12 col-md-6 col-lg-4">
											<div
												style={{ borderRadius: '10px' }}
												className={`card shadow-none border p-3 transition-all ${
													isSelected ? 'border-primary bg-primary-subtle' : 'bg-white'
												}`}>
												<div
													role="button"
													tabIndex={0}
													className="d-flex align-items-center justify-content-between cursor-pointer"
													onClick={() => handleTogglePaymentMode(pm.id)}
													onKeyDown={(e) => {
														if (e.key === ' ' || e.key === 'Enter') {
															handleTogglePaymentMode(pm.id);
														}
													}}>
													<div className="d-flex align-items-center gap-2">
														<input
															type="checkbox"
															className="form-check-input mt-0 cursor-pointer"
															checked={isSelected}
															onChange={() => handleTogglePaymentMode(pm.id)}
															onClick={(e) => e.stopPropagation()}
														/>
														<span className="fw-bold text-dark small">{pm.name}</span>
													</div>
													{isSelected && (
														<span
															className="badge bg-primary px-2 py-1"
															style={{ fontSize: '0.72rem' }}>
															Selected
														</span>
													)}
												</div>

												{isSelected && (
													<>
														<div className="row g-2 mt-2 pt-2 border-top">
															<div className="col-6">
																<label
																	className="form-label fw-bold text-muted small mb-1"
																	style={{ fontSize: '0.78rem' }}>
																	Min Amount (₹)
																</label>
																<input
																	type="number"
																	min="0"
																	step="any"
																	className="form-control form-control-sm"
																	placeholder="e.g. 10"
																	value={config.min_amount}
																	onChange={(e) =>
																		handlePaymentModeAmountChange(
																			pm.id,
																			'min_amount',
																			e.target.value,
																		)
																	}
																	onClick={(e) => e.stopPropagation()}
																	style={{ borderRadius: '8px', fontSize: '0.85rem' }}
																/>
															</div>
															<div className="col-6">
																<label
																	className="form-label fw-bold text-muted small mb-1"
																	style={{ fontSize: '0.78rem' }}>
																	Max Amount (₹)
																</label>
																<input
																	type="number"
																	min="0"
																	step="any"
																	className="form-control form-control-sm"
																	placeholder="e.g. 100000"
																	value={config.max_amount}
																	onChange={(e) =>
																		handlePaymentModeAmountChange(
																			pm.id,
																			'max_amount',
																			e.target.value,
																		)
																	}
																	onClick={(e) => e.stopPropagation()}
																	style={{ borderRadius: '8px', fontSize: '0.85rem' }}
																/>
															</div>
														</div>

														<div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
															<label className="form-check-label small fw-semibold text-dark d-flex align-items-center gap-2 cursor-pointer mb-0">
																<input
																	type="radio"
																	name="default_payment_mode_form"
																	className="form-check-input mt-0 cursor-pointer"
																	checked={Boolean(config.is_default)}
																	onChange={() => handleSetDefaultPaymentMode(pm.id)}
																	onClick={(e) => e.stopPropagation()}
																/>
																<span>Set as Default</span>
															</label>
															{config.is_default && (
																<span
																	className="badge bg-warning text-dark px-2 py-1 d-inline-flex align-items-center gap-1"
																	style={{ fontSize: '0.72rem' }}>
																	<Icon icon="Star" size="sm" />
																	Default
																</span>
															)}
														</div>
													</>
												)}
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="p-4 text-center text-muted small bg-light rounded-3">
								Loading active payment modes...
							</div>
						)}
					</div>
				</div>

				{/* 5. CARD: DYNAMIC CONSUMER INPUT PARAMETERS */}
				<div className="operator-card">
					<div className="card-header-bar">
						<div className="header-left">
							<div className="card-header-icon">
								<Icon icon="Input" />
							</div>
							<div>
								<h5 className="card-header-title">
									Consumer Input Parameters ({inputParams.length})
								</h5>
								<p className="card-header-subtitle">
									Configure dynamic fields required from the customer (e.g. Consumer Number,
									Subdivision Code)
								</p>
							</div>
						</div>
						<button
							type="button"
							className="btn-add-action"
							onClick={() => handleAddParam()}>
							<Icon icon="Add" size="sm" />
							<span>Add Parameter Field</span>
						</button>
					</div>
					<div className="card-body-content">
						{inputParams.length > 0 ? (
							<div className="d-flex flex-column gap-3">
								{inputParams.map((param, index) => (
									<div key={index} className="card shadow-none border rounded-3 p-3 bg-light">
										<div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
											<div className="d-flex align-items-center gap-2">
												<span className="badge bg-primary px-2 py-1">Field #{index + 1}</span>
												<span className="fw-bold text-dark small">
													{param.param_name || 'Untitled Field'}
												</span>
											</div>
											<div className="d-flex align-items-center gap-2">
												<div className="dropdown position-relative">
													<button
														type="button"
														className="btn-secondary-action dropdown-toggle d-inline-flex align-items-center gap-1"
														onClick={(e) => {
															e.stopPropagation();
															setOpenDropdownIndex(openDropdownIndex === index ? null : index);
														}}>
														<Icon icon="Add" size="sm" />
														<span>Add</span>
													</button>
													{openDropdownIndex === index && (
														<ul
															className="dropdown-menu show shadow-sm border py-1"
															style={{
																position: 'absolute',
																top: '100%',
																right: 0,
																zIndex: 1050,
																minWidth: '140px',
																borderRadius: '10px',
																marginTop: '4px',
															}}>
															<li>
																<button
																	type="button"
																	className="dropdown-item small d-flex align-items-center gap-2 py-2 px-3"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleAddAbove(index);
																		setOpenDropdownIndex(null);
																	}}>
																	<Icon icon="ArrowUpward" size="sm" className="text-primary" />
																	<span>Add Above</span>
																</button>
															</li>
															<li>
																<button
																	type="button"
																	className="dropdown-item small d-flex align-items-center gap-2 py-2 px-3"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleAddBelow(index);
																		setOpenDropdownIndex(null);
																	}}>
																	<Icon icon="ArrowDownward" size="sm" className="text-primary" />
																	<span>Add Below</span>
																</button>
															</li>
														</ul>
													)}
												</div>
												<button
													type="button"
													className="btn-delete-action"
													onClick={() => handleRemoveParam(index)}
													title="Remove Field">
													<Icon icon="Delete" size="sm" />
													<span>Remove Field</span>
												</button>
											</div>
										</div>

										<div className="row g-3">
											{/* PARAMETER LABEL */}
											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1">
													Parameter Label <span className="text-danger">*</span>
												</label>
												<input
													type="text"
													className="form-control"
													placeholder="e.g. Loan Number, Consumer No"
													value={param.param_name}
													onChange={(e) =>
														handleUpdateParam(index, 'param_name', e.target.value)
													}
													style={inputStyle}
													required
												/>
											</div>

											{/* BILL FETCH KEY */}
											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1">
													Fetch Key (param_key) <span className="text-danger">*</span>
												</label>
												<input
													type="text"
													className="form-control font-monospace"
													placeholder="e.g. cn, mobile, account_no"
													value={param.param_key}
													onChange={(e) =>
														handleUpdateParam(index, 'param_key', e.target.value)
													}
													style={inputStyle}
													required
												/>
											</div>

											{/* PAYMENT KEY */}
											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1">
													Payment Key (param_external_id)
												</label>
												<input
													type="text"
													className="form-control font-monospace"
													placeholder="e.g. cn, ad1, ad2"
													value={param.param_external_id ?? param.param_key ?? ''}
													onChange={(e) =>
														handleUpdateParam(index, 'param_external_id', e.target.value)
													}
													style={inputStyle}
												/>
											</div>

											{/* PARAMETER TYPE */}
											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1">Parameter Type</label>
												<select
													className="form-select"
													value={param.param_type || 'text'}
													onChange={(e) =>
														handleUpdateParam(index, 'param_type', e.target.value)
													}
													style={inputStyle}>
													{PARAM_TYPE_OPTIONS.map((dto) => (
														<option key={dto.value} value={dto.value}>
															{dto.label}
														</option>
													))}
												</select>
											</div>

											{/* ROW 2: MIN LENGTH, MAX LENGTH, REGEX, PLACEHOLDER, REQUIRED */}
											<div className="col-6 col-md-2">
												<label className="form-label fw-bold small mb-1">Min Length</label>
												<input
													type="number"
													min="0"
													className="form-control"
													placeholder="e.g. 8"
													value={param.min_length != null ? param.min_length : ''}
													onChange={(e) =>
														handleUpdateParam(
															index,
															'min_length',
															e.target.value ? Number(e.target.value) : null,
														)
													}
													style={inputStyle}
												/>
											</div>

											<div className="col-6 col-md-2">
												<label className="form-label fw-bold small mb-1">Max Length</label>
												<input
													type="number"
													min="0"
													className="form-control"
													placeholder="e.g. 12"
													value={param.max_length != null ? param.max_length : ''}
													onChange={(e) =>
														handleUpdateParam(
															index,
															'max_length',
															e.target.value ? Number(e.target.value) : null,
														)
													}
													style={inputStyle}
												/>
											</div>

											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1">Regex Pattern</label>
												<input
													type="text"
													className="form-control font-monospace"
													placeholder="e.g. ^[0-9]{8,12}$"
													value={param.regex || ''}
													onChange={(e) => handleUpdateParam(index, 'regex', e.target.value)}
													style={inputStyle}
												/>
											</div>

											<div className="col-12 col-md-3">
												<label className="form-label fw-bold small mb-1">Placeholder / Hint</label>
												<input
													type="text"
													className="form-control"
													placeholder="e.g. Enter Loan Number"
													value={param.placeholder || ''}
													onChange={(e) =>
														handleUpdateParam(index, 'placeholder', e.target.value)
													}
													style={inputStyle}
												/>
											</div>

											<div className="col-12 col-md-2">
												<label className="form-label fw-bold small mb-1 d-block">Required?</label>
												<div className="d-flex align-items-center" style={{ height: '38px' }}>
													<StatusToggle
														checked={param.is_optional === false || param.is_required === true}
														onChange={(checked) =>
															handleUpdateParam(index, 'is_optional', !checked)
														}
														onText="Required"
														offText="Optional"
													/>
												</div>
											</div>

											{/* CONDITIONAL: DROPDOWN OPTIONS IF TYPE IS SELECT */}
											{param.param_type === 'select' && (
												<div className="col-12">
													<label className="form-label fw-bold small mb-1">
														Dropdown Choices <span className="text-muted fw-normal">(Comma-separated)</span>
													</label>
													<input
														type="text"
														className="form-control"
														placeholder="e.g. Ahmedabad, Surat, Gandhinagar, Vadodara"
														value={
															Array.isArray(param.options)
																? param.options.join(', ')
																: param.options || ''
														}
														onChange={(e) =>
															handleUpdateParam(index, 'options', e.target.value)
														}
														style={inputStyle}
													/>
													<span className="text-muted small" style={{ fontSize: '0.75rem' }}>
														Enter choices separated by commas for the customer selection menu
													</span>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="p-5 text-center border rounded-3 bg-light text-muted">
								<Icon icon="Input" size="2x" className="mb-2 text-muted" />
								<h6 className="fw-bold text-dark">No Custom Parameters Configured</h6>
								<p className="small mb-3">
									Add dynamic input parameters if this biller requires consumer identifiers (e.g.,
									Consumer Number, Account ID).
								</p>
								<button
									type="button"
									className="btn-add-action mt-2"
									onClick={() => handleAddParam()}>
									<Icon icon="Add" size="sm" />
									<span>Add First Parameter Field</span>
								</button>
							</div>
						)}
					</div>
				</div>

				{/* 6. BOTTOM ACTION BAR */}
				<div className="card shadow-sm border-0 rounded-3">
					<div className="card-body p-3 d-flex align-items-center justify-content-end gap-2">
						<button
							type="button"
							className="btn-cancel-action"
							onClick={onCancel}
							disabled={isSubmitting}>
							Cancel
						</button>
						<button
							type="submit"
							className="btn-save-action"
							disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Spinner isSmall inButton isGrow className="me-1" />
									<span>Saving...</span>
								</>
							) : (
								<>
									<Icon icon="Save" size="sm" />
									<span>{mode === 'edit' ? 'Save Changes' : 'Create Operator'}</span>
								</>
							)}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
};

(OperatorForm as any).propTypes = {
	mode: PropTypes.oneOf(['add', 'edit']).isRequired,
	initialValues: PropTypes.any,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
	isSubmitting: PropTypes.bool.isRequired,
};

(OperatorForm as any).defaultProps = {
	initialValues: null,
};

export default OperatorForm;
