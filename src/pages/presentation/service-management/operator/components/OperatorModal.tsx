/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, no-nested-ternary, jsx-a11y/label-has-associated-control */
import React, { FC, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Button from '../../../../../components/bootstrap/Button';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../components/icon/Icon';
import showNotification from '../../../../../components/extras/showNotification';
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
} from '../type/operator-type';
import operatorService from '../service/operatorService';
import { getImageUrl } from '../../../../../helpers/helpers';
import constantService, { IConstantOption } from '../../../../../services/constantService';
import { StatusToggle } from '../../../../../components/common';

interface IOperatorModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	operatorData?: IOperator | null;
	onSubmit: (payload: FormData | Record<string, any>) => Promise<void>;
	isSubmitting: boolean;
}

const BILL_FETCH_REQUIREMENT_OPTIONS: { label: string; value: BillFetchRequirementType }[] = [
	{ label: 'Mandatory (Must fetch bill)', value: 'mandatory' },
	{ label: 'Optional (Fetch or Enter amount)', value: 'optional' },
	{ label: 'Not Required (Direct recharge/pay)', value: 'not_required' },
	{ label: 'Not Supported (No fetch available)', value: 'not_supported' },
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

export const OperatorModal: FC<IOperatorModalProps> = ({
	isOpen,
	setIsOpen,
	operatorData,
	onSubmit,
	isSubmitting,
}) => {
	const isEdit = Boolean(operatorData);
	const [activeTab, setActiveTab] = useState<'basic' | 'bbps' | 'payment_modes' | 'params'>('basic');

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
		Record<number, { min_amount: string; max_amount: string; status?: string }>
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
	const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

	// HELPER: PARSE PAYMENT MODES AND LIMITS
	const parsePaymentModesData = (data: any) => {
		const configs: Record<number, { min_amount: string; max_amount: string; status?: string }> = {};
		const ids: number[] = [];

		const rawPms = data.payment_modes || data.paymentModes || [];
		if (Array.isArray(rawPms) && rawPms.length > 0) {
			rawPms.forEach((pm: any) => {
				const pmId = Number(pm.payment_mode_id || pm.id);
				if (pmId) {
					ids.push(pmId);
					const min = pm.min_amount ?? pm.OperatorPaymentMode?.min_amount ?? pm.pivot?.min_amount;
					const max = pm.max_amount ?? pm.OperatorPaymentMode?.max_amount ?? pm.pivot?.max_amount;
					const st = pm.status ?? pm.OperatorPaymentMode?.status ?? 'active';
					configs[pmId] = {
						min_amount: min != null ? String(min) : '',
						max_amount: max != null ? String(max) : '',
						status: st,
					};
				}
			});
		} else if (Array.isArray(data.payment_mode_ids)) {
			data.payment_mode_ids.forEach((id: number) => {
				const numId = Number(id);
				if (numId) {
					ids.push(numId);
					configs[numId] = { min_amount: '', max_amount: '', status: 'active' };
				}
			});
		}

		return { ids, configs };
	};

	// LOAD CATEGORIES & PAYMENT MODES ON MODAL OPEN
	useEffect(() => {
		if (isOpen) {
			operatorService
				.getActiveServiceCategories()
				.then((res) => {
					if (Array.isArray(res?.data)) {
						setCategories(res.data);
					}
				})
				.catch(() => {});

			operatorService
				.getActivePaymentModes()
				.then((res) => {
					if (Array.isArray(res?.data)) {
						setPaymentModes(res.data);
					}
				})
				.catch(() => {});

			constantService
				.getStatusConstants()
				.then((sOpts) => {
					if (sOpts && sOpts.length > 0) setStatusOptions(sOpts);
				})
				.catch(() => {});
		}
	}, [isOpen]);

	// POPULATE FORM STATE ON EDIT / ADD
	useEffect(() => {
		let isMounted = true;

		if (operatorData && isOpen) {
			setName(operatorData.name || '');
			setOperatorCode(String(operatorData.operator_code || ''));
			setServiceCategoryId(String(operatorData.service_category_id || ''));
			setBillerId(operatorData.biller_id || '');
			setShortName(operatorData.short_name || '');
			setMinAmount(operatorData.min_amount != null ? String(operatorData.min_amount) : '1.00');
			setMaxAmount(
				operatorData.max_amount != null ? String(operatorData.max_amount) : '500000.00',
			);
			setHelpLineNumber(operatorData.help_line_number || '');
			setStatus(operatorData.status || 'active');

			setIsBbpsEnabled(operatorData.is_bbps_enabled ?? true);
			setBillFetchRequirement(
				operatorData.bill_fetch_requirement ||
					(operatorData.is_bill_fetch_available ? 'mandatory' : 'not_required'),
			);
			setAmountExactness(
				operatorData.amount_exactness ||
					(operatorData.exact_amount_matching
						? 'exact'
						: operatorData.is_partial_pay_allowed
						? 'below'
						: 'any'),
			);
			setPaymentChannel(operatorData.payment_channel || 'AGT');
			setCircleId(operatorData.circle_id != null ? String(operatorData.circle_id) : '0');

			const parsedInitial = parsePaymentModesData(operatorData);
			setSelectedPaymentModeIds(parsedInitial.ids);
			setPaymentModeConfigs(parsedInitial.configs);

			const rawParams =
				operatorData.parameters ||
				operatorData.input_params ||
				operatorData.input_parameters ||
				operatorData.params ||
				[];
			setInputParams(
				rawParams.map((p: any, idx: number) => ({
					id: p.id,
					param_index: p.param_index != null ? p.param_index : idx + 1,
					param_name: p.param_name || '',
					param_key: p.param_key || `param${idx + 1}`,
					param_external_id: p.param_external_id || p.param_key || `param${idx + 1}`,
					param_type: p.param_type || (p.data_type ? p.data_type.toLowerCase() : 'text'),
					data_type: p.param_type || p.data_type || 'text',
					min_length: p.min_length != null ? p.min_length : null,
					max_length: p.max_length != null ? p.max_length : null,
					is_optional:
						typeof p.is_optional === 'boolean'
							? p.is_optional
							: p.is_required !== undefined
							? !p.is_required
							: false,
					is_required:
						typeof p.is_optional === 'boolean'
							? !p.is_optional
							: Boolean(p.is_required ?? true),
					regex: p.regex || '',
					placeholder: p.placeholder || '',
					display_order: p.display_order != null ? p.display_order : idx + 1,
					options: Array.isArray(p.options) ? p.options.join(', ') : p.options || '',
				})),
			);

			setSelectedFile(null);
			setIsDeleteIcon(false);
			setImagePreview(operatorData.icon ? getImageUrl(operatorData.icon) : '');

			if (operatorData.id) {
				setIsLoadingDetail(true);
				operatorService
					.getOperatorById(operatorData.id)
					.then((res) => {
						if (!isMounted) return;
						const fresh = res?.data;
						if (fresh) {
							setName(fresh.name || '');
							setOperatorCode(String(fresh.operator_code || ''));
							setServiceCategoryId(String(fresh.service_category_id || ''));
							setBillerId(fresh.biller_id || '');
							setShortName(fresh.short_name || '');
							setMinAmount(fresh.min_amount != null ? String(fresh.min_amount) : '1.00');
							setMaxAmount(
								fresh.max_amount != null ? String(fresh.max_amount) : '500000.00',
							);
							setHelpLineNumber(fresh.help_line_number || '');
							setStatus(fresh.status || 'active');

							setIsBbpsEnabled(fresh.is_bbps_enabled ?? true);
							setBillFetchRequirement(
								fresh.bill_fetch_requirement ||
									(fresh.is_bill_fetch_available ? 'mandatory' : 'not_required'),
							);
							setAmountExactness(
								fresh.amount_exactness ||
									(fresh.exact_amount_matching
										? 'exact'
										: fresh.is_partial_pay_allowed
										? 'below'
										: 'any'),
							);
							setPaymentChannel(fresh.payment_channel || 'AGT');
							setCircleId(fresh.circle_id != null ? String(fresh.circle_id) : '0');

							const parsedFresh = parsePaymentModesData(fresh);
							setSelectedPaymentModeIds(parsedFresh.ids);
							setPaymentModeConfigs(parsedFresh.configs);

							const freshParams =
								fresh.parameters ||
								fresh.input_params ||
								fresh.input_parameters ||
								fresh.params ||
								[];
							if (freshParams.length > 0) {
								setInputParams(
									freshParams.map((p: any, idx: number) => ({
										id: p.id,
										param_index: p.param_index != null ? p.param_index : idx + 1,
										param_name: p.param_name || '',
										param_key: p.param_key || `param${idx + 1}`,
										param_external_id: p.param_external_id || p.param_key || `param${idx + 1}`,
										param_type:
											p.param_type || (p.data_type ? p.data_type.toLowerCase() : 'text'),
										data_type: p.param_type || p.data_type || 'text',
										min_length: p.min_length != null ? p.min_length : null,
										max_length: p.max_length != null ? p.max_length : null,
										is_optional:
											typeof p.is_optional === 'boolean'
												? p.is_optional
												: p.is_required !== undefined
												? !p.is_required
												: false,
										is_required:
											typeof p.is_optional === 'boolean'
												? !p.is_optional
												: Boolean(p.is_required ?? true),
										regex: p.regex || '',
										placeholder: p.placeholder || '',
										display_order: p.display_order != null ? p.display_order : idx + 1,
										options: Array.isArray(p.options) ? p.options.join(', ') : p.options || '',
									})),
								);
							}

							if (fresh.icon) {
								setImagePreview(getImageUrl(fresh.icon));
							}
						}
					})
					.catch(() => {})
					.finally(() => {
						if (isMounted) setIsLoadingDetail(false);
					});
			}
		} else if (isOpen) {
			setName('');
			setOperatorCode('');
			setServiceCategoryId('');
			setBillerId('');
			setShortName('');
			setMinAmount('1.00');
			setMaxAmount('500000.00');
			setHelpLineNumber('');
			setStatus('active');
			setIsBbpsEnabled(true);
			setBillFetchRequirement('mandatory');
			setAmountExactness('exact');
			setPaymentChannel('AGT');
			setCircleId('0');
			setSelectedPaymentModeIds([]);
			setPaymentModeConfigs({});
			setInputParams([]);
			setSelectedFile(null);
			setImagePreview('');
			setIsDeleteIcon(false);
			setIsLoadingDetail(false);
			setActiveTab('basic');
		}

		return () => {
			isMounted = false;
		};
	}, [operatorData, isOpen]);

	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
	};

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

	// DYNAMIC INPUT PARAMETERS HANDLERS
	const handleAddParam = (insertIndex?: number) => {
		const newParam: IOperatorInputParam = {
			param_name: '',
			param_key: '',
			param_external_id: '',
			param_type: 'text',
			data_type: 'text',
			min_length: null,
			max_length: null,
			is_optional: false,
			is_required: true,
			regex: '',
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
				if (!current.param_external_id || current.param_external_id === updated[index].param_key) {
					current.param_external_id = value;
				}
			}
			if (field === 'is_required') {
				current.is_optional = !value;
			} else if (field === 'is_optional') {
				current.is_required = !value;
			}
			updated[index] = current;
			return updated;
		});
	};

	const handleRemoveParam = (index: number) => {
		setInputParams((prev) => prev.filter((_, i) => i !== index));
	};

	// PAYMENT MODES TOGGLE HANDLERS
	const handleTogglePaymentMode = (pmId: number) => {
		setSelectedPaymentModeIds((prev) => {
			if (prev.includes(pmId)) {
				return prev.filter((id) => id !== pmId);
			}
			return [...prev, pmId];
		});
		setPaymentModeConfigs((prev) => {
			if (prev[pmId]) return prev;
			return {
				...prev,
				[pmId]: { min_amount: '', max_amount: '', status: 'active' },
			};
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
					updated[pm.id] = { min_amount: '', max_amount: '', status: 'active' };
				}
			});
			return updated;
		});
	};

	const handleClearPaymentModes = () => {
		setSelectedPaymentModeIds([]);
	};

	// FORM SUBMIT
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			showNotification('Validation Error', 'Operator name is required', 'warning');
			setActiveTab('basic');
			return;
		}

		if (!operatorCode.trim()) {
			showNotification('Validation Error', 'Operator code is required', 'warning');
			setActiveTab('basic');
			return;
		}

		if (!serviceCategoryId) {
			showNotification('Validation Error', 'Service category is required', 'warning');
			setActiveTab('basic');
			return;
		}

		// Validate input parameters if any
		for (let i = 0; i < inputParams.length; i += 1) {
			const p = inputParams[i];
			if (!p.param_name.trim()) {
				showNotification(
					'Validation Error',
					`Parameter #${i + 1} is missing a Parameter Label`,
					'warning',
				);
				setActiveTab('params');
				return;
			}
			if (!p.param_key.trim()) {
				showNotification(
					'Validation Error',
					`Parameter #${i + 1} is missing a Parameter Key`,
					'warning',
				);
				setActiveTab('params');
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
			const config = paymentModeConfigs[id] || { min_amount: '', max_amount: '', status: 'active' };
			return {
				payment_mode_id: id,
				min_amount:
					config.min_amount !== '' && config.min_amount != null && !Number.isNaN(Number(config.min_amount))
						? Number(config.min_amount)
						: null,
				max_amount:
					config.max_amount !== '' && config.max_amount != null && !Number.isNaN(Number(config.max_amount))
						? Number(config.max_amount)
						: null,
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
		if (helpLineNumber.trim()) formData.append('help_line_number', helpLineNumber.trim());

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
		<Modal isOpen={isOpen} setIsOpen={handleClose} isCentered size="xl">
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id="operator-modal-title">
					<div className="d-flex align-items-center gap-2">
						<Icon icon={isEdit ? 'Edit' : 'Hub'} color="primary" />
						<span className="fw-bold">{isEdit ? 'Edit Operator' : 'Add New Operator'}</span>
						{isLoadingDetail && <Spinner isSmall className="text-primary ms-2" />}
					</div>
				</ModalTitle>
			</ModalHeader>

			<form onSubmit={handleSubmit}>
				{/* NAVIGATION TABS */}
				<div className="px-4 pt-3 border-bottom bg-light">
					<ul className="nav nav-tabs border-bottom-0" style={{ gap: '0.25rem' }}>
						<li className="nav-item">
							<button
								type="button"
								className={`nav-link fw-semibold px-3 py-2 ${
									activeTab === 'basic' ? 'active text-primary border-bottom-0' : 'text-muted'
								}`}
								onClick={() => setActiveTab('basic')}>
								<Icon icon="Info" className="me-1" size="sm" />
								1. General Details
							</button>
						</li>
						<li className="nav-item">
							<button
								type="button"
								className={`nav-link fw-semibold px-3 py-2 ${
									activeTab === 'bbps' ? 'active text-primary border-bottom-0' : 'text-muted'
								}`}
								onClick={() => setActiveTab('bbps')}>
								<Icon icon="Tune" className="me-1" size="sm" />
								2. BBPS & Billing Configuration
							</button>
						</li>
						<li className="nav-item">
							<button
								type="button"
								className={`nav-link fw-semibold px-3 py-2 ${
									activeTab === 'payment_modes' ? 'active text-primary border-bottom-0' : 'text-muted'
								}`}
								onClick={() => setActiveTab('payment_modes')}>
								<Icon icon="Payments" className="me-1" size="sm" />
								3. Payment Modes ({selectedPaymentModeIds.length})
							</button>
						</li>
						<li className="nav-item">
							<button
								type="button"
								className={`nav-link fw-semibold px-3 py-2 ${
									activeTab === 'params' ? 'active text-primary border-bottom-0' : 'text-muted'
								}`}
								onClick={() => setActiveTab('params')}>
								<Icon icon="Input" className="me-1" size="sm" />
								4. Dynamic Parameters ({inputParams.length})
							</button>
						</li>
					</ul>
				</div>

				<ModalBody className="p-4" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
					{/* TAB 1: BASIC & GENERAL DETAILS */}
					{activeTab === 'basic' && (
						<div className="row g-3">
							{/* OPERATOR NAME */}
							<div className="col-12 col-md-6">
								<label htmlFor="opNameInput" className="form-label fw-bold small mb-1">
									Operator Name <span className="text-danger">*</span>
								</label>
								<input
									id="opNameInput"
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
								<label htmlFor="opCodeInput" className="form-label fw-bold small mb-1">
									Operator Code <span className="text-danger">*</span>
								</label>
								<input
									id="opCodeInput"
									type="text"
									className="form-control role-name-input font-monospace"
									placeholder="e.g. 208, AIRPOST"
									value={operatorCode}
									onChange={(e) => setOperatorCode(e.target.value)}
									style={inputStyle}
									required
								/>
							</div>

							{/* SERVICE CATEGORY DROPDOWN */}
							<div className="col-12 col-md-6">
								<label htmlFor="opCategorySelect" className="form-label fw-bold small mb-1">
									Service Category <span className="text-danger">*</span>
								</label>
								<select
									id="opCategorySelect"
									className="form-select role-name-input"
									value={serviceCategoryId}
									onChange={(e) => setServiceCategoryId(e.target.value)}
									style={inputStyle}
									required>
									<option value="">Select Category...</option>
									{categories.map((cat) => (
										<option key={cat.id} value={cat.id}>
											{cat.name}
										</option>
									))}
								</select>
							</div>

							{/* BBPS BILLER ID */}
							<div className="col-12 col-md-6">
								<label htmlFor="opBillerIdInput" className="form-label fw-bold small mb-1">
									BBPS Biller ID <span className="text-muted fw-normal">(Optional)</span>
								</label>
								<input
									id="opBillerIdInput"
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
								<label htmlFor="opShortNameInput" className="form-label fw-bold small mb-1">
									Short Name <span className="text-muted fw-normal">(Optional)</span>
								</label>
								<input
									id="opShortNameInput"
									type="text"
									className="form-control role-name-input"
									placeholder="e.g. DGVCL, SMC"
									value={shortName}
									onChange={(e) => setShortName(e.target.value)}
									style={inputStyle}
								/>
							</div>

							{/* STATUS SELECT */}
							<div className="col-12 col-md-3">
								<label htmlFor="opStatusSelect" className="form-label fw-bold small mb-1">
									Status
								</label>
								<select
									id="opStatusSelect"
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
								<label htmlFor="opMinAmountInput" className="form-label fw-bold small mb-1">
									Min Amount (₹)
								</label>
								<input
									id="opMinAmountInput"
									type="number"
									min="0"
									step="any"
									className="form-control role-name-input"
									placeholder="e.g. 1.00"
									value={minAmount}
									onChange={(e) => setMinAmount(e.target.value)}
									style={inputStyle}
								/>
							</div>

							{/* MAX AMOUNT */}
							<div className="col-12 col-md-3">
								<label htmlFor="opMaxAmountInput" className="form-label fw-bold small mb-1">
									Max Amount (₹)
								</label>
								<input
									id="opMaxAmountInput"
									type="number"
									min="0"
									step="any"
									className="form-control role-name-input"
									placeholder="e.g. 500000.00"
									value={maxAmount}
									onChange={(e) => setMaxAmount(e.target.value)}
									style={inputStyle}
								/>
							</div>

							{/* HELPLINE NUMBER */}
							<div className="col-12 col-md-6">
								<label htmlFor="opHelplineInput" className="form-label fw-bold small mb-1">
									Customer Helpline Number
								</label>
								<input
									id="opHelplineInput"
									type="text"
									className="form-control role-name-input"
									placeholder="e.g. 1800-123-4567"
									value={helpLineNumber}
									onChange={(e) => setHelpLineNumber(e.target.value)}
									style={inputStyle}
								/>
							</div>

							{/* OPERATOR LOGO / ICON */}
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
											id="operatorLogoInput"
											accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
											className="d-none"
											onChange={handleFileChange}
										/>
										<Button
											type="button"
											color="light"
											size="sm"
											className="border text-nowrap"
											onClick={() => fileInputRef.current?.click()}>
											<Icon icon="Upload" size="sm" className="me-1" />
											{imagePreview ? 'Change Logo' : 'Upload Logo'}
										</Button>
										{imagePreview && (
											<Button
												type="button"
												color="danger"
												isLight
												size="sm"
												onClick={handleRemoveIcon}>
												<Icon icon="Delete" size="sm" />
											</Button>
										)}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* TAB 2: BBPS & BILLING CONFIGURATION */}
					{activeTab === 'bbps' && (
						<div className="row g-3">
							<div className="col-12">
								<div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 rounded-3 mb-2">
									<Icon icon="Info" />
									<span>
										Configure BBPS transaction processing rules, bill fetching requirements, exactness, and channel identifiers.
									</span>
								</div>
							</div>

							{/* BBPS ENABLED */}
							<div className="col-12 col-md-6">
								<div
									role="button"
									tabIndex={0}
									onClick={() => setIsBbpsEnabled(!isBbpsEnabled)}
									onKeyDown={(e) => {
										if (e.key === ' ' || e.key === 'Enter') setIsBbpsEnabled(!isBbpsEnabled);
									}}
									className={`card shadow-none border p-3 rounded-3 h-100 transition-all cursor-pointer ${
										isBbpsEnabled ? 'border-primary bg-primary-subtle' : 'bg-white'
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
							<div className="col-12 col-md-6">
								<label htmlFor="modalBillFetchReq" className="form-label fw-bold small mb-1">
									Bill Fetch Requirement <span className="text-danger">*</span>
								</label>
								<select
									id="modalBillFetchReq"
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
									Controls if customer must fetch bill before paying (e.g. Mandatory, Optional, Not Required)
								</span>
							</div>

							{/* AMOUNT EXACTNESS */}
							<div className="col-12 col-md-6">
								<label htmlFor="modalAmountExactness" className="form-label fw-bold small mb-1">
									Amount Exactness <span className="text-danger">*</span>
								</label>
								<select
									id="modalAmountExactness"
									className="form-select role-name-input"
									value={amountExactness}
									onChange={(e) =>
										setAmountExactness(e.target.value as AmountExactnessType)
									}
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
							<div className="col-12 col-md-3">
								<label htmlFor="modalPaymentChannel" className="form-label fw-bold small mb-1">
									Payment Channel
								</label>
								<input
									id="modalPaymentChannel"
									type="text"
									className="form-control role-name-input font-monospace"
									placeholder="AGT"
									value={paymentChannel}
									onChange={(e) => setPaymentChannel(e.target.value)}
									style={inputStyle}
								/>
								<span className="text-muted small" style={{ fontSize: '0.72rem' }}>
									BBPS Channel (AGT, INT, MOB)
								</span>
							</div>

							{/* CIRCLE ID */}
							<div className="col-12 col-md-3">
								<label htmlFor="modalCircleId" className="form-label fw-bold small mb-1">
									Circle / Region ID
								</label>
								<input
									id="modalCircleId"
									type="text"
									className="form-control role-name-input font-monospace"
									placeholder="0"
									value={circleId}
									onChange={(e) => setCircleId(e.target.value)}
									style={inputStyle}
								/>
								<span className="text-muted small" style={{ fontSize: '0.72rem' }}>
									Region ID (0 = National)
								</span>
							</div>
						</div>
					)}

					{/* TAB 3: SUPPORTED PAYMENT MODES */}
					{activeTab === 'payment_modes' && (
						<div>
							<div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
								<div>
									<h6 className="fw-bold mb-0">
										Payment Modes Accepted ({selectedPaymentModeIds.length})
									</h6>
									<span className="text-muted small">
										Select accepted payment modes and optionally configure custom Min & Max limits.
									</span>
								</div>
								<div className="d-flex align-items-center gap-2">
									<Button
										type="button"
										color="light"
										size="sm"
										className="border"
										onClick={handleSelectAllPaymentModes}>
										Select All
									</Button>
									<Button
										type="button"
										color="light"
										size="sm"
										className="border"
										onClick={handleClearPaymentModes}>
										Clear All
									</Button>
								</div>
							</div>

							{paymentModes.length > 0 ? (
								<div className="row g-3">
									{paymentModes.map((pm) => {
										const isSelected = selectedPaymentModeIds.includes(pm.id);
										const config = paymentModeConfigs[pm.id] || {
											min_amount: '',
											max_amount: '',
										};
										return (
											<div key={pm.id} className="col-12 col-md-6">
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
					)}

					{/* TAB 4: DYNAMIC CONSUMER INPUT PARAMETERS */}
					{activeTab === 'params' && (
						<div>
							<div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
								<div>
									<h6 className="fw-bold mb-0">Consumer Input Fields</h6>
									<span className="text-muted small">
										Configure customer input parameters required to fetch/pay bills (e.g., Consumer
										Number, Subdivision Code).
									</span>
								</div>
								<Button
									type="button"
									color="primary"
									size="sm"
									className="d-inline-flex align-items-center gap-1"
									onClick={() => handleAddParam()}>
									<Icon icon="Add" size="sm" />
									<span>Add Input Field</span>
								</Button>
							</div>

							{inputParams.length > 0 ? (
								<div className="d-flex flex-column gap-3">
									{inputParams.map((param, index) => (
										<div
											key={index}
											className="card shadow-none border rounded-3 p-3 bg-light">
											<div className="d-flex align-items-center justify-content-between mb-2 border-bottom pb-2">
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
															className="btn btn-outline-secondary btn-sm dropdown-toggle d-inline-flex align-items-center gap-1"
															style={{ borderRadius: '10px' }}
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
														className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
														style={{ borderRadius: '10px' }}
														onClick={() => handleRemoveParam(index)}
														title="Remove Field">
														<Icon icon="Delete" size="sm" />
														<span>Remove Field</span>
													</button>
												</div>
											</div>

											<div className="row g-2">
												{/* PARAM NAME */}
												<div className="col-12 col-md-3">
													<label className="form-label fw-bold small mb-1">
														Parameter Label <span className="text-danger">*</span>
													</label>
													<input
														type="text"
														className="form-control"
														placeholder="e.g. Loan Number"
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
														placeholder="e.g. cn, mobile"
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

												{/* MIN LENGTH */}
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

												{/* MAX LENGTH */}
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

												{/* REGEX */}
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

												{/* PLACEHOLDER / HINT */}
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

												{/* REQUIRED TOGGLE */}
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

												{/* CONDITIONAL: DROPDOWN CHOICES IF TYPE IS SELECT */}
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
															Enter choices separated by commas for customer selection menu
														</span>
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="p-4 text-center border rounded-3 bg-light text-muted small">
									<Icon icon="Input" size="2x" className="mb-2 text-muted" />
									<div className="fw-bold text-dark">No Parameters Configured</div>
									<p className="mb-3">
										Click "Add Input Field" to configure dynamic bill fetch parameters.
									</p>
									<Button
										type="button"
										color="primary"
										size="sm"
										onClick={() => handleAddParam()}>
										<Icon icon="Add" size="sm" className="me-1" />
										Add First Input Field
									</Button>
								</div>
							)}
						</div>
					)}
				</ModalBody>

				<ModalFooter className="px-4 py-3">
					<Button
						type="button"
						color="light"
						onClick={handleClose}
						isDisable={isSubmitting}>
						Cancel
					</Button>
					<Button type="submit" color="primary" isDisable={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner isSmall inButton isGrow className="me-2" />
								Saving...
							</>
						) : (
							<>
								<Icon icon="Save" className="me-1" />
								{isEdit ? 'Save Changes' : 'Create Operator'}
							</>
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

(OperatorModal as any).propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	operatorData: PropTypes.any,
	onSubmit: PropTypes.func.isRequired,
	isSubmitting: PropTypes.bool.isRequired,
};

(OperatorModal as any).defaultProps = {
	operatorData: null,
};

export default OperatorModal;
