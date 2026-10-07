/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/no-array-index-key, react/require-default-props, no-nested-ternary, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { FC, useEffect, useRef, useState } from 'react';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import AppBreadcrumbs from '../../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import {
	IApiDocumentation,
	ICreateApiDocumentationPayload,
	IPathParameterItem,
	IQueryParameterItem,
	IRequestHeaderItem,
	IUpdateApiDocumentationPayload,
	TApiDocMethod,
	TApiDocStatus,
} from './type/api-documentation.type';
import ApiDocMethodBadge from './components/ApiDocMethodBadge';
import ApiDocStatusBadge from './components/ApiDocStatusBadge';
import './css/ApiDocumentation.scss';

export interface IApiDocumentationFormProps {
	initialValues?: IApiDocumentation | null;
	onSubmit: (payload: ICreateApiDocumentationPayload | IUpdateApiDocumentationPayload) => Promise<void>;
	isSubmitting: boolean;
	mode: 'add' | 'edit';
	onCancel: () => void;
	categories?: string[];
}

const HTTP_METHODS: TApiDocMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const STATUS_OPTIONS: Array<{ value: TApiDocStatus; label: string; dotClass: string }> = [
	{ value: 'published', label: 'Published', dotClass: 'bg-success' },
	{ value: 'draft', label: 'Draft', dotClass: 'bg-warning' },
	{ value: 'archived', label: 'Archived', dotClass: 'bg-secondary' },
];

export const ApiDocumentationForm: FC<IApiDocumentationFormProps> = ({
	initialValues,
	onSubmit,
	isSubmitting,
	mode,
	onCancel,
	categories = [],
}) => {
	// BASIC FIELDS
	const [title, setTitle] = useState<string>(initialValues?.title || '');
	const [categoryGroup, setCategoryGroup] = useState<string>(initialValues?.category_group || (categories[0] || 'General'));
	const [isNewCategory, setIsNewCategory] = useState<boolean>(false);
	const [method, setMethod] = useState<TApiDocMethod>(initialValues?.method || 'GET');
	const [endpoint, setEndpoint] = useState<string>(initialValues?.endpoint || '');
	const [description, setDescription] = useState<string>(initialValues?.description || '');
	const [status, setStatus] = useState<TApiDocStatus>(initialValues?.status || 'published');
	const [displayOrder, setDisplayOrder] = useState<number>(initialValues?.display_order || 0);

	// CUSTOM DROPDOWNS
	const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);
	const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
	const statusDropdownRef = useRef<HTMLDivElement>(null);
	const categoryDropdownRef = useRef<HTMLDivElement>(null);

	// PARAMETERS
	const parseArray = <T,>(val: any): T[] => {
		if (Array.isArray(val)) return val;
		if (typeof val === 'string') {
			try {
				const parsed = JSON.parse(val);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		return [];
	};

	const [headers, setHeaders] = useState<IRequestHeaderItem[]>(parseArray(initialValues?.request_headers));
	const [pathParams, setPathParams] = useState<IPathParameterItem[]>(parseArray(initialValues?.path_parameters));
	const [queryParams, setQueryParams] = useState<IQueryParameterItem[]>(parseArray(initialValues?.query_parameters));
	const [requestBodyJson, setRequestBodyJson] = useState<string>(() => {
		if (initialValues?.request_body) {
			return typeof initialValues.request_body === 'object'
				? JSON.stringify(initialValues.request_body, null, 2)
				: String(initialValues.request_body);
		}
		return '{\n  \n}';
	});

	// EXAMPLES
	const [requestExample, setRequestExample] = useState<string>(initialValues?.request_example || '');
	const [responseExampleJson, setResponseExampleJson] = useState<string>(() => {
		if (initialValues?.response_example) {
			return typeof initialValues.response_example === 'object'
				? JSON.stringify(initialValues.response_example, null, 2)
				: String(initialValues.response_example);
		}
		return '{\n  "status": true,\n  "message": "Success"\n}';
	});

	// AUTO SLUG GENERATOR
	const slugify = (text: string) => {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/[\s_-]+/g, '-')
			.replace(/^-+|-+$/g, '');
	};

	const handleTitleChange = (val: string) => {
		setTitle(val);
	};

	// OUTSIDE CLICK FOR DROPDOWNS
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
				setIsStatusDropdownOpen(false);
			}
			if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
				setIsCategoryDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// AUTO GENERATE CURL (CONSIDERING CUSTOM HEADERS, QUERY PARAMS & BODY)
	const handleGenerateCurl = () => {
		const rawEndpoint = endpoint.trim()
			? endpoint.trim().startsWith('/')
				? endpoint.trim()
				: `/${endpoint.trim()}`
			: '/api/v1/resource';
		const cleanEndpoint = rawEndpoint.startsWith('/api') ? rawEndpoint : `/api${rawEndpoint}`;

		// 1. Build Query String
		const activeQueryParams = queryParams.filter((q) => q.name && q.name.trim() !== '');
		let queryString = '';
		if (activeQueryParams.length > 0) {
			const qs = activeQueryParams
				.map(
					(q) =>
						`${encodeURIComponent(q.name.trim())}=${encodeURIComponent(
							q.default?.trim() || 'VALUE',
						)}`,
				)
				.join('&');
			queryString = `?${qs}`;
		}

		let curl = `curl -X ${method} "https://api.example.com${cleanEndpoint}${queryString}"`;

		// 2. Build Headers List
		const headerLines: string[] = [];

		// Check if user defined an Authorization or API Key header
		const hasAuthHeader = headers.some(
			(h) =>
				h.key &&
				['authorization', 'x-api-key', 'api-key', 'x-auth-token'].includes(
					h.key.toLowerCase().trim(),
				),
		);
		if (!hasAuthHeader) {
			headerLines.push(`  -H "Authorization: Bearer YOUR_API_KEY"`);
		}

		// Check Content-Type header
		const hasContentType = headers.some(
			(h) => h.key && h.key.toLowerCase().trim() === 'content-type',
		);
		if (!hasContentType && ['POST', 'PUT', 'PATCH'].includes(method)) {
			headerLines.push(`  -H "Content-Type: application/json"`);
		}

		// Add all user-defined custom headers
		headers.forEach((h) => {
			if (h.key && h.key.trim() !== '') {
				headerLines.push(`  -H "${h.key.trim()}: ${h.value?.trim() || 'YOUR_VALUE'}"`);
			}
		});

		if (headerLines.length > 0) {
			curl += ` \\\n${headerLines.join(' \\\n')}`;
		}

		// 3. Add Request Body
		if (
			['POST', 'PUT', 'PATCH'].includes(method) &&
			requestBodyJson &&
			requestBodyJson.trim() !== '{}' &&
			requestBodyJson.trim() !== '{\n  \n}'
		) {
			try {
				const parsed = JSON.parse(requestBodyJson);
				curl += ` \\\n  -d '${JSON.stringify(parsed)}'`;
			} catch {
				curl += ` \\\n  -d '${requestBodyJson}'`;
			}
		}

		setRequestExample(curl);
		showNotification(
			'Generated',
			'cURL command generated with all custom headers, parameters, and payload.',
			'success',
		);
	};

	// FORMAT JSON HELPERS
	const formatRequestBody = () => {
		try {
			const parsed = JSON.parse(requestBodyJson);
			setRequestBodyJson(JSON.stringify(parsed, null, 2));
			showNotification('Formatted', 'Request body JSON formatted successfully.', 'success');
		} catch {
			showNotification('Invalid JSON', 'Request body is not valid JSON format.', 'danger');
		}
	};

	const formatResponseExample = () => {
		try {
			const parsed = JSON.parse(responseExampleJson);
			setResponseExampleJson(JSON.stringify(parsed, null, 2));
			showNotification('Formatted', 'Response example JSON formatted successfully.', 'success');
		} catch {
			showNotification('Invalid JSON', 'Response example is not valid JSON format.', 'danger');
		}
	};

	// PARAMETER ROW HANDLERS
	const addPathParam = () => {
		setPathParams([...pathParams, { name: '', type: 'string', required: true, description: '' }]);
	};
	const removePathParam = (idx: number) => {
		setPathParams(pathParams.filter((_, i) => i !== idx));
	};
	const updatePathParam = (idx: number, field: keyof IPathParameterItem, val: any) => {
		const next = [...pathParams];
		next[idx] = { ...next[idx], [field]: val };
		setPathParams(next);
	};

	const addQueryParam = () => {
		setQueryParams([...queryParams, { name: '', type: 'string', required: false, default: '', description: '' }]);
	};
	const removeQueryParam = (idx: number) => {
		setQueryParams(queryParams.filter((_, i) => i !== idx));
	};
	const updateQueryParam = (idx: number, field: keyof IQueryParameterItem, val: any) => {
		const next = [...queryParams];
		next[idx] = { ...next[idx], [field]: val };
		setQueryParams(next);
	};

	const addHeader = () => {
		setHeaders([...headers, { key: '', value: '', required: false, description: '' }]);
	};
	const removeHeader = (idx: number) => {
		setHeaders(headers.filter((_, i) => i !== idx));
	};
	const updateHeader = (idx: number, field: keyof IRequestHeaderItem, val: any) => {
		const next = [...headers];
		next[idx] = { ...next[idx], [field]: val };
		setHeaders(next);
	};

	// SUBMIT HANDLER
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!title.trim()) {
			showNotification('Validation Error', 'Title is required.', 'danger');
			return;
		}
		if (!categoryGroup.trim()) {
			showNotification('Validation Error', 'Category group is required.', 'danger');
			return;
		}
		if (!endpoint.trim()) {
			showNotification('Validation Error', 'Endpoint URL is required.', 'danger');
			return;
		}

		const formattedEndpoint = endpoint.trim().startsWith('/') ? endpoint.trim() : `/${endpoint.trim()}`;

		let parsedBody: any = {};
		if (requestBodyJson.trim() && requestBodyJson.trim() !== '{\n  \n}') {
			try {
				parsedBody = JSON.parse(requestBodyJson);
			} catch {
				showNotification('Invalid JSON', 'Request body contains invalid JSON.', 'danger');
				return;
			}
		}

		let parsedResponse: any = null;
		if (responseExampleJson.trim()) {
			try {
				parsedResponse = JSON.parse(responseExampleJson);
			} catch {
				showNotification('Invalid JSON', 'Response example contains invalid JSON.', 'danger');
				return;
			}
		}

		const cleanHeaders = headers.filter((h) => h.key.trim() !== '');
		const cleanPathParams = pathParams.filter((p) => p.name.trim() !== '');
		const cleanQueryParams = queryParams.filter((q) => q.name.trim() !== '');

		const autoSlug = initialValues?.slug || slugify(title);

		const payload: any = {
			title: title.trim(),
			slug: autoSlug,
			category_group: categoryGroup.trim(),
			description: description.trim() || undefined,
			method,
			endpoint: formattedEndpoint,
			request_headers: cleanHeaders,
			path_parameters: cleanPathParams,
			query_parameters: cleanQueryParams,
			request_body: parsedBody,
			request_example: requestExample.trim() || undefined,
			response_example: parsedResponse,
			status,
			display_order: Number(displayOrder) || 0,
		};

		await onSubmit(payload);
	};

	return (
		<div className='document-type-form-page api-doc-form-wrapper'>
			{/* PAGE HEADER BAR */}
			<div className='doc-page-header'>
				<div className='doc-title-section'>
					<AppBreadcrumbs
						items={[
							{ label: 'Developer', to: `/${PAGE_ROUTES.API_KEY_REQUEST}` },
							{ label: 'API Documentation', to: `/${PAGE_ROUTES.API_DOCUMENTATION}` },
							{ label: mode === 'add' ? 'Create' : 'Edit' },
						]}
					/>
					<h1 className='doc-name-heading'>
						{mode === 'add' ? 'Create API Documentation' : `Edit: ${initialValues?.title || 'Documentation'}`}
					</h1>
					<p className='doc-subtitle'>
						Define endpoint specifications, request parameters, custom headers, and response payloads.
					</p>
				</div>

				<div className='doc-header-actions'>
					<button type='button' className='btn-cancel-action' onClick={onCancel}>
						<Icon icon='Close' />
						Cancel
					</button>
					<button
						type='button'
						className='btn-save-action'
						disabled={isSubmitting}
						onClick={handleSubmit}>
						<Icon icon='Save' />
						{isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Documentation' : 'Save Changes'}
					</button>
				</div>
			</div>

			<form onSubmit={handleSubmit}>
				{/* CARD 1: ENDPOINT BASIC INFORMATION */}
				<div className='doc-card mb-4'>
					<div className='card-header-bar'>
						<div className='header-left'>
							<div className='card-header-icon'>
								<Icon icon='Article' />
							</div>
							<div>
								<h2 className='card-header-title'>Endpoint Overview & Routing</h2>
								<p className='card-header-subtitle'>
									Configure method, URL path, category grouping, and visibility status
								</p>
							</div>
						</div>
					</div>

					<div className='card-body-content'>
						<div className='row g-4'>
							{/* TITLE */}
							<div className='col-12'>
								<label className='form-label fw-bold text-dark mb-1'>
									Endpoint Title <span className='text-danger'>*</span>
								</label>
								<input
									type='text'
									className='form-control role-name-input'
									placeholder='e.g. Create a customer'
									value={title}
									onChange={(e) => handleTitleChange(e.target.value)}
									required
								/>
								<small className='text-muted'>A clear human-readable title for this API endpoint.</small>
							</div>

							{/* HTTP METHOD SELECTOR */}
							<div className='col-md-5'>
								<label className='form-label fw-bold text-dark mb-2'>
									HTTP Method <span className='text-danger'>*</span>
								</label>
								<div className='d-flex flex-wrap gap-2 align-items-center'>
									{HTTP_METHODS.map((m) => (
										<ApiDocMethodBadge
											key={m}
											method={m}
											size='md'
											isPill
											variant={method === m ? 'solid' : 'soft'}
											isSelected={method === m}
											onClick={() => setMethod(m)}
										/>
									))}
								</div>
							</div>

							{/* ENDPOINT PATH */}
							<div className='col-md-7'>
								<label className='form-label fw-bold text-dark mb-1'>
									Endpoint URL Path <span className='text-danger'>*</span>
								</label>
								<input
									type='text'
									className='form-control role-name-input font-monospace'
									placeholder='e.g. /api/v1/customers'
									value={endpoint}
									onChange={(e) => setEndpoint(e.target.value)}
									required
								/>
								<small className='text-muted'>Full or relative endpoint URL path starting with / (e.g. /api/v1/customers).</small>
							</div>

							{/* CATEGORY GROUP */}
							<div className='col-md-5'>
								<label className='form-label fw-bold text-dark mb-1'>
									Category Group <span className='text-danger'>*</span>
								</label>
								{!isNewCategory && categories.length > 0 ? (
									<div className='custom-react-select-wrapper' ref={categoryDropdownRef}>
										<div
											className={`custom-react-select-control ${isCategoryDropdownOpen ? 'is-open' : ''}`}
											onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}>
											<div className='select-value-display'>
												<span className='select-text-value'>{categoryGroup || 'Select category'}</span>
											</div>
											<span className={`select-arrow-icon ${isCategoryDropdownOpen ? 'is-open' : ''}`}>
												<Icon icon='KeyboardArrowDown' />
											</span>
										</div>

										{isCategoryDropdownOpen && (
											<div className='custom-react-select-menu'>
												{categories.map((cat) => (
													<button
														key={cat}
														type='button'
														className={`custom-react-select-option ${categoryGroup === cat ? 'is-selected' : ''}`}
														onClick={() => {
															setCategoryGroup(cat);
															setIsCategoryDropdownOpen(false);
														}}>
														<span className='option-label-text'>{cat}</span>
														{categoryGroup === cat && (
															<span className='option-check-icon'>
																<Icon icon='Check' size='sm' />
															</span>
														)}
													</button>
												))}
												<div className='border-top pt-1 mt-1'>
													<button
														type='button'
														className='custom-react-select-option text-primary fw-bold'
														onClick={() => {
															setIsNewCategory(true);
															setCategoryGroup('');
															setIsCategoryDropdownOpen(false);
														}}>
														<Icon icon='Add' size='sm' className='me-1' /> + Type New Category
													</button>
												</div>
											</div>
										)}
									</div>
								) : (
									<div className='input-group'>
										<input
											type='text'
											className='form-control role-name-input'
											placeholder='e.g. Customers, Payments, Auth'
											value={categoryGroup}
											onChange={(e) => setCategoryGroup(e.target.value)}
											required
										/>
										{categories.length > 0 && (
											<button
												type='button'
												className='btn btn-outline-secondary'
												title='Choose from existing'
												onClick={() => setIsNewCategory(false)}>
												<Icon icon='List' />
											</button>
										)}
									</div>
								)}
								<small className='text-muted'>Endpoints are grouped under this category in the developer portal.</small>
							</div>

							{/* STATUS SELECTOR */}
							<div className='col-md-4'>
								<label className='form-label fw-bold text-dark mb-1'>Status</label>
								<div className='custom-react-select-wrapper' ref={statusDropdownRef}>
									<div
										className={`custom-react-select-control ${isStatusDropdownOpen ? 'is-open' : ''}`}
										onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
										<div className='select-value-display d-flex align-items-center gap-2'>
											<span className={`status-dot-indicator ${STATUS_OPTIONS.find((s) => s.value === status)?.dotClass || 'bg-success'}`} />
											<span className='select-text-value'>
												{STATUS_OPTIONS.find((s) => s.value === status)?.label || 'Published'}
											</span>
										</div>
										<span className={`select-arrow-icon ${isStatusDropdownOpen ? 'is-open' : ''}`}>
											<Icon icon='KeyboardArrowDown' />
										</span>
									</div>

									{isStatusDropdownOpen && (
										<div className='custom-react-select-menu'>
											{STATUS_OPTIONS.map((opt) => (
												<button
													key={opt.value}
													type='button'
													className={`custom-react-select-option ${status === opt.value ? 'is-selected' : ''}`}
													onClick={() => {
														setStatus(opt.value);
														setIsStatusDropdownOpen(false);
													}}>
													<div className='d-flex align-items-center gap-2'>
														<span className={`status-dot-indicator ${opt.dotClass}`} />
														<span className='option-label-text'>{opt.label}</span>
													</div>
													{status === opt.value && (
														<span className='option-check-icon'>
															<Icon icon='Check' size='sm' />
														</span>
													)}
												</button>
											))}
										</div>
									)}
								</div>
								<small className='text-muted'>Only published endpoints appear in the public developer portal.</small>
							</div>

							{/* DISPLAY ORDER */}
							<div className='col-md-3'>
								<label className='form-label fw-bold text-dark mb-1'>Display Order</label>
								<input
									type='number'
									className='form-control role-name-input'
									value={displayOrder}
									onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
									min={0}
								/>
								<small className='text-muted'>Priority ranking (1 is top priority, 0 is default).</small>
							</div>

							{/* DESCRIPTION */}
							<div className='col-12'>
								<label className='form-label fw-bold text-dark mb-1'>Endpoint Description</label>
								<textarea
									className='form-control'
									rows={3}
									style={{ borderRadius: '0.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}
									placeholder='Detailed summary of what this endpoint accomplishes, required capabilities, and behavior...'
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* CARD 2: PARAMETERS & HEADERS SPECIFICATION */}
				<div className='doc-card mb-4'>
					<div className='card-header-bar'>
						<div className='header-left'>
							<div className='card-header-icon'>
								<Icon icon='Tune' />
							</div>
							<div>
								<h2 className='card-header-title'>Parameters & Headers Specification</h2>
								<p className='card-header-subtitle'>
									Define path variables, query parameters, authorization headers, and request body schema
								</p>
							</div>
						</div>
					</div>

					<div className='card-body-content'>
						{/* PATH PARAMETERS SECTION */}
						<div className='mb-5'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<div>
									<h3 className='fw-bold text-dark mb-0' style={{ fontSize: '0.95rem' }}>
										<Icon icon='Link' className='me-2 text-primary' /> Path Parameters (URL Variables)
									</h3>
									<small className='text-muted'>Dynamic segment parameters in the endpoint URL like {'{id}'} or {'{userId}'}.</small>
								</div>
								<button type='button' className='btn-add-field-action' onClick={addPathParam}>
									<Icon icon='Add' /> Add Path Parameter
								</button>
							</div>

							{pathParams.length === 0 ? (
								<div className='p-3 bg-light rounded text-muted text-center small border'>
									No path parameters defined. Click "Add Path Parameter" if your URL has variable path segments.
								</div>
							) : (
								<div className='fields-builder-container'>
									{pathParams.map((p, idx) => (
										<div key={`path-param-${idx}`} className='field-item-card'>
											<div className='field-card-header'>
												<div className='d-flex align-items-center gap-2'>
													<span className='field-index-badge'>PATH #{idx + 1}</span>
													<span className='field-header-title'>{p.name || 'Unnamed Parameter'}</span>
												</div>
												<button
													type='button'
													className='btn-delete-field'
													onClick={() => removePathParam(idx)}>
													<Icon icon='Delete' /> Remove
												</button>
											</div>

											<div className='row g-3'>
												<div className='col-md-4'>
													<label className='form-label small fw-bold text-dark mb-1'>Parameter Name</label>
													<input
														type='text'
														className='form-control form-control-sm font-monospace'
														placeholder='e.g. id, customerId'
														value={p.name}
														onChange={(e) => updatePathParam(idx, 'name', e.target.value)}
													/>
												</div>

												<div className='col-md-3'>
													<label className='form-label small fw-bold text-dark mb-1'>Data Type</label>
													<select
														className='form-select form-select-sm'
														value={p.type || 'string'}
														onChange={(e) => updatePathParam(idx, 'type', e.target.value)}>
														<option value='string'>String</option>
														<option value='number'>Number / Integer</option>
														<option value='boolean'>Boolean</option>
													</select>
												</div>

												<div className='col-md-2 d-flex align-items-center pt-3'>
													<div className='form-check'>
														<input
															type='checkbox'
															className='form-check-input custom-checkbox-styled'
															id={`path-req-${idx}`}
															checked={p.required}
															onChange={(e) => updatePathParam(idx, 'required', e.target.checked)}
														/>
														<label htmlFor={`path-req-${idx}`} className='form-check-label small fw-bold ms-1'>
															Required
														</label>
													</div>
												</div>

												<div className='col-md-3'>
													<label className='form-label small fw-bold text-dark mb-1'>Description</label>
													<input
														type='text'
														className='form-control form-control-sm'
														placeholder='e.g. Unique ID of the customer'
														value={p.description || ''}
														onChange={(e) => updatePathParam(idx, 'description', e.target.value)}
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* QUERY PARAMETERS SECTION */}
						<div className='mb-5'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<div>
									<h3 className='fw-bold text-dark mb-0' style={{ fontSize: '0.95rem' }}>
										<Icon icon='FilterAlt' className='me-2 text-primary' /> Query Parameters (URL Query String)
									</h3>
									<small className='text-muted'>URL query parameters used for filtering, pagination, or search (?page=1&limit=10).</small>
								</div>
								<button type='button' className='btn-add-field-action' onClick={addQueryParam}>
									<Icon icon='Add' /> Add Query Parameter
								</button>
							</div>

							{queryParams.length === 0 ? (
								<div className='p-3 bg-light rounded text-muted text-center small border'>
									No query parameters defined. Click "Add Query Parameter" to define optional/required query string fields.
								</div>
							) : (
								<div className='fields-builder-container'>
									{queryParams.map((q, idx) => (
										<div key={`query-param-${idx}`} className='field-item-card'>
											<div className='field-card-header'>
												<div className='d-flex align-items-center gap-2'>
													<span className='field-index-badge bg-info text-dark'>QUERY #{idx + 1}</span>
													<span className='field-header-title'>{q.name || 'Unnamed Parameter'}</span>
												</div>
												<button
													type='button'
													className='btn-delete-field'
													onClick={() => removeQueryParam(idx)}>
													<Icon icon='Delete' /> Remove
												</button>
											</div>

											<div className='row g-3'>
												<div className='col-md-3'>
													<label className='form-label small fw-bold text-dark mb-1'>Parameter Name</label>
													<input
														type='text'
														className='form-control form-control-sm font-monospace'
														placeholder='e.g. page, limit, status'
														value={q.name}
														onChange={(e) => updateQueryParam(idx, 'name', e.target.value)}
													/>
												</div>

												<div className='col-md-2'>
													<label className='form-label small fw-bold text-dark mb-1'>Data Type</label>
													<select
														className='form-select form-select-sm'
														value={q.type || 'string'}
														onChange={(e) => updateQueryParam(idx, 'type', e.target.value)}>
														<option value='string'>String</option>
														<option value='number'>Number</option>
														<option value='boolean'>Boolean</option>
													</select>
												</div>

												<div className='col-md-2'>
													<label className='form-label small fw-bold text-dark mb-1'>Default Value</label>
													<input
														type='text'
														className='form-control form-control-sm font-monospace'
														placeholder='e.g. 10'
														value={q.default || ''}
														onChange={(e) => updateQueryParam(idx, 'default', e.target.value)}
													/>
												</div>

												<div className='col-md-2 d-flex align-items-center pt-3'>
													<div className='form-check'>
														<input
															type='checkbox'
															className='form-check-input custom-checkbox-styled'
															id={`query-req-${idx}`}
															checked={q.required}
															onChange={(e) => updateQueryParam(idx, 'required', e.target.checked)}
														/>
														<label htmlFor={`query-req-${idx}`} className='form-check-label small fw-bold ms-1'>
															Required
														</label>
													</div>
												</div>

												<div className='col-md-3'>
													<label className='form-label small fw-bold text-dark mb-1'>Description</label>
													<input
														type='text'
														className='form-control form-control-sm'
														placeholder='e.g. Number of records per page'
														value={q.description || ''}
														onChange={(e) => updateQueryParam(idx, 'description', e.target.value)}
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* REQUEST HEADERS SECTION */}
						<div className='mb-5'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<div>
									<h3 className='fw-bold text-dark mb-0' style={{ fontSize: '0.95rem' }}>
										<Icon icon='Badge' className='me-2 text-primary' /> Custom Request Headers
									</h3>
									<small className='text-muted'>HTTP headers expected by this endpoint (e.g. Authorization, X-API-KEY).</small>
								</div>
								<button type='button' className='btn-add-field-action' onClick={addHeader}>
									<Icon icon='Add' /> Add Request Header
								</button>
							</div>

							{headers.length === 0 ? (
								<div className='p-3 bg-light rounded text-muted text-center small border'>
									No custom request headers defined (Default Authorization & Content-Type headers are included automatically).
								</div>
							) : (
								<div className='fields-builder-container'>
									{headers.map((h, idx) => (
										<div key={`header-${idx}`} className='field-item-card'>
											<div className='field-card-header'>
												<div className='d-flex align-items-center gap-2'>
													<span className='field-index-badge bg-secondary text-white'>HEADER #{idx + 1}</span>
													<span className='field-header-title'>{h.key || 'Unnamed Header'}</span>
												</div>
												<button
													type='button'
													className='btn-delete-field'
													onClick={() => removeHeader(idx)}>
													<Icon icon='Delete' /> Remove
												</button>
											</div>

											<div className='row g-3'>
												<div className='col-md-4'>
													<label className='form-label small fw-bold text-dark mb-1'>Header Key</label>
													<input
														type='text'
														className='form-control form-control-sm font-monospace'
														placeholder='e.g. X-IDEMPOTENCY-KEY'
														value={h.key}
														onChange={(e) => updateHeader(idx, 'key', e.target.value)}
													/>
												</div>

												<div className='col-md-3'>
													<label className='form-label small fw-bold text-dark mb-1'>Sample Value</label>
													<input
														type='text'
														className='form-control form-control-sm font-monospace'
														placeholder='e.g. 123e4567-e89b-12d3'
														value={h.value || ''}
														onChange={(e) => updateHeader(idx, 'value', e.target.value)}
													/>
												</div>

												<div className='col-md-2 d-flex align-items-center pt-3'>
													<div className='form-check'>
														<input
															type='checkbox'
															className='form-check-input custom-checkbox-styled'
															id={`header-req-${idx}`}
															checked={h.required}
															onChange={(e) => updateHeader(idx, 'required', e.target.checked)}
														/>
														<label htmlFor={`header-req-${idx}`} className='form-check-label small fw-bold ms-1'>
															Required
														</label>
													</div>
												</div>

												<div className='col-md-3'>
													<label className='form-label small fw-bold text-dark mb-1'>Description</label>
													<input
														type='text'
														className='form-control form-control-sm'
														placeholder='e.g. Unique request identifier for retry safety'
														value={h.description || ''}
														onChange={(e) => updateHeader(idx, 'description', e.target.value)}
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* REQUEST BODY PAYLOAD SCHEMA */}
						{['POST', 'PUT', 'PATCH'].includes(method) && (
							<div>
								<div className='d-flex align-items-center justify-content-between mb-2'>
									<div>
										<h3 className='fw-bold text-dark mb-0' style={{ fontSize: '0.95rem' }}>
											<Icon icon='DataArray' className='me-2 text-primary' /> Request Body Payload Schema (JSON)
										</h3>
										<small className='text-muted'>Define the JSON body structure and properties required for {method} requests.</small>
									</div>
									<button type='button' className='btn btn-outline-secondary btn-sm' onClick={formatRequestBody}>
										<Icon icon='AutoFixHigh' className='me-1' /> Format JSON
									</button>
								</div>
								<textarea
									className='form-control font-monospace'
									rows={7}
									style={{
										backgroundColor: '#0f172a',
										color: '#38bdf8',
										borderRadius: '0.65rem',
										fontSize: '0.85rem',
										lineHeight: '1.5',
									}}
									placeholder='{\n  "name": "Jane Cooper",\n  "email": "jane@example.com"\n}'
									value={requestBodyJson}
									onChange={(e) => setRequestBodyJson(e.target.value)}
								/>
							</div>
						)}
					</div>
				</div>

				{/* CARD 3: CODE EXAMPLES & RESPONSE PAYLOAD */}
				<div className='doc-card mb-4'>
					<div className='card-header-bar'>
						<div className='header-left'>
							<div className='card-header-icon'>
								<Icon icon='Code' />
							</div>
							<div>
								<h2 className='card-header-title'>Live Code Examples & Sample Responses</h2>
								<p className='card-header-subtitle'>
									Provide ready-to-use cURL commands and response samples for developer integration
								</p>
							</div>
						</div>
					</div>

					<div className='card-body-content'>
						<div className='row g-4'>
							{/* REQUEST CURL COMMAND */}
							<div className='col-lg-6'>
								<div className='d-flex align-items-center justify-content-between mb-2'>
									<label className='form-label fw-bold text-dark mb-0'>
										Request Example (cURL Command)
									</label>
									<button
										type='button'
										className='btn btn-outline-primary btn-sm'
										onClick={handleGenerateCurl}>
										<Icon icon='AutoAwesome' className='me-1' /> Auto-Generate cURL
									</button>
								</div>
								<textarea
									className='form-control font-monospace'
									rows={10}
									style={{
										backgroundColor: '#0f172a',
										color: '#4ade80',
										borderRadius: '0.65rem',
										fontSize: '0.82rem',
										lineHeight: '1.6',
									}}
									placeholder='curl -X POST https://api.example.com/api/v1/resource ...'
									value={requestExample}
									onChange={(e) => setRequestExample(e.target.value)}
								/>
								<small className='text-muted mt-1 d-block'>
									This cURL command is showcased in the developer interactive terminal.
								</small>
							</div>

							{/* RESPONSE JSON EXAMPLE */}
							<div className='col-lg-6'>
								<div className='d-flex align-items-center justify-content-between mb-2'>
									<label className='form-label fw-bold text-dark mb-0'>
										Response Example (JSON)
									</label>
									<button
										type='button'
										className='btn btn-outline-secondary btn-sm'
										onClick={formatResponseExample}>
										<Icon icon='AutoFixHigh' className='me-1' /> Format JSON
									</button>
								</div>
								<textarea
									className='form-control font-monospace'
									rows={10}
									style={{
										backgroundColor: '#0f172a',
										color: '#fde047',
										borderRadius: '0.65rem',
										fontSize: '0.82rem',
										lineHeight: '1.6',
									}}
									placeholder='{\n  "status": true,\n  "data": { ... }\n}'
									value={responseExampleJson}
									onChange={(e) => setResponseExampleJson(e.target.value)}
								/>
								<small className='text-muted mt-1 d-block'>
									Sample response payload returned upon successful execution (200/201 OK).
								</small>
							</div>
						</div>
					</div>
				</div>

				{/* BOTTOM SUBMIT BAR */}
				<div className='d-flex align-items-center justify-content-end gap-3 pt-3 pb-5'>
					<button type='button' className='btn-cancel-action' onClick={onCancel}>
						Cancel
					</button>
					<button
						type='submit'
						className='btn-save-action'
						disabled={isSubmitting}>
						<Icon icon='Save' />
						{isSubmitting ? 'Saving Documentation...' : mode === 'add' ? 'Create Documentation' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default ApiDocumentationForm;
