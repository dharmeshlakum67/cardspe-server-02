/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/control-has-associated-label, react/no-array-index-key, react/require-default-props, no-nested-ternary */
import React, { FC, useMemo, useState } from 'react';
import classNames from 'classnames';
import Icon from '../../../../../components/icon/Icon';
import ApiDocMethodBadge from './ApiDocMethodBadge';
import { PillBadge } from '../../../../../components/common/PillBadge';
import {
	IApiDocumentation,
	IBodyParameterItem,
	IPathParameterItem,
	IQueryParameterItem,
	IRequestHeaderItem,
} from '../type/api-documentation.type';
import showNotification from '../../../../../components/extras/showNotification';

interface IApiDocumentationViewContentProps {
	doc: IApiDocumentation;
	onEdit?: (doc: IApiDocumentation) => void;
	canEdit?: boolean;
	className?: string;
}

export const ApiDocumentationViewContent: FC<IApiDocumentationViewContentProps> = ({
	doc,
	onEdit,
	canEdit = false,
	className,
}) => {
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'javascript' | 'python'>('curl');
	const [activeResponseTab, setActiveResponseTab] = useState<'success' | 'fail'>('success');

	const copyToClipboard = (text: string, key: string) => {
		navigator.clipboard.writeText(text);
		setCopiedKey(key);
		showNotification('Copied', 'Copied to clipboard!', 'info');
		setTimeout(() => setCopiedKey(null), 2000);
	};

	// SAFELY PARSE JSON ARRAYS
	const parseArrayField = <T,>(field: any): T[] => {
		if (Array.isArray(field)) return field;
		if (typeof field === 'string') {
			try {
				const parsed = JSON.parse(field);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		return [];
	};

	const headers: IRequestHeaderItem[] = parseArrayField(doc.request_headers);
	const pathParams: IPathParameterItem[] = parseArrayField(doc.path_parameters);
	const queryParams: IQueryParameterItem[] = parseArrayField(doc.query_parameters);

	const bodyParams: IBodyParameterItem[] = useMemo(() => {
		if (!doc?.request_body) return [];
		if (Array.isArray(doc.request_body)) return doc.request_body;
		if (typeof doc.request_body === 'string') {
			try {
				const parsed = JSON.parse(doc.request_body);
				if (Array.isArray(parsed)) return parsed;
				if (typeof parsed === 'object' && parsed !== null) {
					return Object.entries(parsed).map(([k, v]) => ({
						key: k,
						type: Array.isArray(v) ? 'array' : typeof v === 'object' && v !== null ? 'object' : typeof v,
						required: true,
						value: typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''),
						description: '',
					}));
				}
			} catch {
				return [];
			}
		}
		if (typeof doc.request_body === 'object' && doc.request_body !== null) {
			return Object.entries(doc.request_body).map(([k, v]) => ({
				key: k,
				type: Array.isArray(v) ? 'array' : typeof v === 'object' && v !== null ? 'object' : typeof v,
				required: true,
				value: typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''),
				description: '',
			}));
		}
		return [];
	}, [doc]);

	// FORMAT REQUEST BODY & RESPONSE JSON
	const formattedRequestBody = useMemo(() => {
		if (bodyParams && bodyParams.length > 0) {
			const obj = bodyParams.reduce((acc: Record<string, any>, item: any) => {
				const k = item.key || item.name;
				if (!k) return acc;
				let v: any = item.value ?? item.default ?? '';
				if (item.type === 'number') {
					const num = Number(v);
					v = isNaN(num) ? v : num;
				} else if (item.type === 'boolean') {
					v = v === 'true' || v === true;
				} else if (item.type === 'object' || item.type === 'array') {
					try {
						v = JSON.parse(v);
					} catch {
						// string
					}
				}
				acc[k] = v;
				return acc;
			}, {});
			return JSON.stringify(obj, null, 2);
		}
		if (!doc?.request_body) return null;
		if (typeof doc.request_body === 'object') {
			if (Object.keys(doc.request_body).length === 0) return null;
			return JSON.stringify(doc.request_body, null, 2);
		}
		if (typeof doc.request_body === 'string' && doc.request_body !== '{}' && doc.request_body.trim() !== '') {
			try {
				const parsed = JSON.parse(doc.request_body);
				if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length === 0) return null;
				return JSON.stringify(parsed, null, 2);
			} catch {
				return doc.request_body;
			}
		}
		return null;
	}, [bodyParams, doc]);

	const formattedResponse = useMemo(() => {
		if (!doc?.response_example) return null;
		if (typeof doc.response_example === 'object') {
			return JSON.stringify(doc.response_example, null, 2);
		}
		if (typeof doc.response_example === 'string' && doc.response_example !== '{}' && doc.response_example !== '') {
			try {
				return JSON.stringify(JSON.parse(doc.response_example), null, 2);
			} catch {
				return doc.response_example;
			}
		}
		return null;
	}, [doc]);

	const formattedFailResponse = useMemo(() => {
		if (!doc?.fail_response_example) return null;
		if (typeof doc.fail_response_example === 'object') {
			return JSON.stringify(doc.fail_response_example, null, 2);
		}
		if (
			typeof doc.fail_response_example === 'string' &&
			doc.fail_response_example !== '{}' &&
			doc.fail_response_example !== ''
		) {
			try {
				return JSON.stringify(JSON.parse(doc.fail_response_example), null, 2);
			} catch {
				return doc.fail_response_example;
			}
		}
		return null;
	}, [doc]);

	const displayHeaders = useMemo(() => {
		if (headers && headers.length > 0) {
			return headers;
		}
		return [
			{
				key: 'Authorization',
				value: 'Bearer YOUR_API_KEY',
				required: true,
				description: 'Bearer authentication key supplied in request headers.',
			},
		];
	}, [headers]);

	const normalizeEndpoint = (ep?: string) => {
		if (!ep) return '/api';
		const trimmed = ep.trim();
		if (trimmed.startsWith('/api/')) return trimmed;
		if (trimmed === '/api' || trimmed === 'api') return '/api';
		if (trimmed.startsWith('api/')) return `/${trimmed}`;
		return trimmed.startsWith('/') ? `/api${trimmed}` : `/api/${trimmed}`;
	};

	const fullEndpointUrl = normalizeEndpoint(doc.endpoint);

	// DYNAMIC CODE SNIPPETS
	const codeSnippets = useMemo(() => {
		let qs = '';
		const activeQs = queryParams
			.filter((q) => q.name && q.name.trim() !== '')
			.map(
				(q) =>
					`${encodeURIComponent(q.name.trim())}=${encodeURIComponent(
						q.default?.trim() || 'VALUE',
					)}`,
			)
			.join('&');
		if (activeQs) qs = `?${activeQs}`;

		const fullUrl = `https://api.example.com${fullEndpointUrl}${qs}`;

		// cURL
		const hLines: string[] = [];
		const hasAuth = displayHeaders.some(
			(h) =>
				h.key &&
				['authorization', 'x-api-key', 'api-key'].includes(h.key.toLowerCase().trim()),
		);
		if (!hasAuth) hLines.push(`  -H "Authorization: Bearer YOUR_API_KEY"`);
		if (
			['POST', 'PUT', 'PATCH'].includes(doc.method) &&
			!displayHeaders.some((h) => h.key && h.key.toLowerCase().trim() === 'content-type')
		) {
			hLines.push(`  -H "Content-Type: application/json"`);
		}
		displayHeaders.forEach((h) => {
			if (h.key && h.key.trim() !== '') {
				const val = h.value?.trim() || 'YOUR_VALUE';
				hLines.push(`  -H "${h.key.trim()}: ${val}"`);
			}
		});
		let curl = `curl -X ${doc.method} "${fullUrl}"`;
		if (hLines.length > 0) curl += ` \\\n${hLines.join(' \\\n')}`;
		if (formattedRequestBody && ['POST', 'PUT', 'PATCH'].includes(doc.method)) {
			try {
				const minified = JSON.stringify(JSON.parse(formattedRequestBody));
				curl += ` \\\n  -d '${minified}'`;
			} catch {
				curl += ` \\\n  -d '${formattedRequestBody}'`;
			}
		}

		// Axios
		let js = `import axios from 'axios';\n\n`;
		js += `const options = {\n`;
		js += `  method: '${doc.method}',\n`;
		js += `  url: '${fullUrl}',\n`;
		js += `  headers: {\n`;
		if (!hasAuth) js += `    'Authorization': 'Bearer YOUR_API_KEY',\n`;
		if (
			['POST', 'PUT', 'PATCH'].includes(doc.method) &&
			!displayHeaders.some((h) => h.key && h.key.toLowerCase().trim() === 'content-type')
		) {
			js += `    'Content-Type': 'application/json',\n`;
		}
		displayHeaders.forEach((h) => {
			if (h.key && h.key.trim() !== '') {
				const val = h.value?.trim() || 'YOUR_VALUE';
				js += `    '${h.key.trim()}': '${val}',\n`;
			}
		});
		js += `  }`;
		if (formattedRequestBody && ['POST', 'PUT', 'PATCH'].includes(doc.method)) {
			js += `,\n  data: ${formattedRequestBody}`;
		}
		js += `\n};\n\ntry {\n  const response = await axios.request(options);\n  console.log(response.data);\n} catch (error) {\n  console.error(error);\n}`;

		// Python
		let py = `import requests\n\n`;
		py += `url = "${fullUrl}"\n\n`;
		py += `headers = {\n`;
		if (!hasAuth) py += `    "Authorization": "Bearer YOUR_API_KEY",\n`;
		if (
			['POST', 'PUT', 'PATCH'].includes(doc.method) &&
			!displayHeaders.some((h) => h.key && h.key.toLowerCase().trim() === 'content-type')
		) {
			py += `    "Content-Type": "application/json",\n`;
		}
		displayHeaders.forEach((h) => {
			if (h.key && h.key.trim() !== '') {
				const val = h.value?.trim() || 'YOUR_VALUE';
				py += `    "${h.key.trim()}": "${val}",\n`;
			}
		});
		py += `}\n\n`;
		if (formattedRequestBody && ['POST', 'PUT', 'PATCH'].includes(doc.method)) {
			py += `payload = ${formattedRequestBody}\n\n`;
			py += `response = requests.request("${doc.method}", url, json=payload, headers=headers)\n`;
		} else {
			py += `response = requests.request("${doc.method}", url, headers=headers)\n`;
		}
		py += `print(response.json())`;

		return { curl, javascript: js, python: py };
	}, [doc, displayHeaders, queryParams, formattedRequestBody, fullEndpointUrl]);

	return (
		<div className={classNames('api-doc-merchant-view', className)}>
			{/* HEADER ROW */}
			<div className='d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3'>
				<div className='d-flex align-items-center flex-wrap gap-3'>
					<h2 className='doc-name-heading m-0'>{doc.title}</h2>
					<div className='d-flex align-items-center gap-2'>
						<PillBadge
							color={
								doc.status === 'published'
									? 'green'
									: doc.status === 'draft'
										? 'amber'
										: 'gray'
							}
							isPill
							size='sm'>
							{doc.status === 'published'
								? 'Published'
								: doc.status === 'draft'
									? 'Draft'
									: 'Archived'}
						</PillBadge>
						<PillBadge color='purple' isPill size='sm'>
							{doc.category_group || 'General'}
						</PillBadge>
					</div>
				</div>

				{canEdit && onEdit && (
					<button
						type='button'
						className='btn-edit-action'
						onClick={() => onEdit(doc)}>
						<Icon icon='Edit' size='sm' />
						<span>Edit Documentation</span>
					</button>
				)}
			</div>

			{/* ENDPOINT HERO BAR */}
			<div className='endpoint-hero-bar shadow-sm mb-4'>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<ApiDocMethodBadge method={doc.method} size='md' isPill variant='solid' />
					<span className='endpoint-url-text'>{fullEndpointUrl}</span>
				</div>
				<button
					type='button'
					className='btn-copy-url'
					onClick={() => copyToClipboard(fullEndpointUrl, 'endpoint')}>
					<Icon icon={copiedKey === 'endpoint' ? 'Check' : 'ContentCopy'} size='sm' />
					<span>{copiedKey === 'endpoint' ? 'Copied' : 'Copy URL'}</span>
				</button>
			</div>

			{/* 2-COLUMN INDUSTRIAL REFERENCE LAYOUT */}
			<div className='row g-4'>
				{/* LEFT COLUMN: SPECIFICATIONS */}
				<div className='col-xl-7 col-12'>
					{/* DESCRIPTION */}
					{doc.description && (
						<div className='merchant-card mb-4'>
							<h3 className='merchant-card-title'>Description</h3>
							<p className='merchant-description-text mb-0'>{doc.description}</p>
						</div>
					)}

					{/* HEADERS */}
					<div className='merchant-card mb-4'>
						<div className='d-flex align-items-center justify-content-between mb-3'>
							<h3 className='merchant-card-title m-0'>
								<Icon icon='Badge' className='text-primary me-2' />
								Headers
							</h3>
							<span className='text-muted small'>
								{headers.length > 0 ? `${headers.length} header(s)` : 'Default Authorization'}
							</span>
						</div>

						<div className='spec-table-container'>
							<table className='spec-table'>
								<thead>
									<tr>
										<th>Header</th>
										<th>Sample / Type</th>
										<th>Required</th>
										<th>Description</th>
									</tr>
								</thead>
								<tbody>
									{displayHeaders.map((h, idx) => (
										<tr key={`header-${idx}`}>
											<td>
												<span className='param-key font-monospace'>{h.key}</span>
											</td>
											<td>
												<span className='text-muted font-monospace small'>
													{h.value || 'string'}
												</span>
											</td>
											<td>
												<PillBadge
													color={h.required ? 'danger' : 'gray'}
													isPill
													size='sm'>
													{h.required ? 'Required' : 'Optional'}
												</PillBadge>
											</td>
											<td className='text-muted small'>{h.description || '-'}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* PATH PARAMETERS */}
					{pathParams.length > 0 && (
						<div className='merchant-card mb-4'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<h3 className='merchant-card-title m-0'>
									<Icon icon='Link' className='text-primary me-2' />
									Path Parameters
								</h3>
								<span className='text-muted small'>{pathParams.length} variable(s)</span>
							</div>

							<div className='spec-table-container'>
								<table className='spec-table'>
									<thead>
										<tr>
											<th>Parameter</th>
											<th>Type</th>
											<th>Required</th>
											<th>Description</th>
										</tr>
									</thead>
									<tbody>
										{pathParams.map((p, idx) => (
											<tr key={`path-${idx}`}>
												<td>
													<span className='param-key font-monospace'>{p.name}</span>
												</td>
												<td>
													<PillBadge color='teal' isPill size='sm'>
														{p.type || 'string'}
													</PillBadge>
												</td>
												<td>
													<PillBadge
														color={p.required ? 'danger' : 'gray'}
														isPill
														size='sm'>
														{p.required ? 'Required' : 'Optional'}
													</PillBadge>
												</td>
												<td className='text-muted small'>{p.description || '-'}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* QUERY PARAMETERS */}
					{queryParams.length > 0 && (
						<div className='merchant-card mb-4'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<h3 className='merchant-card-title m-0'>
									<Icon icon='FilterAlt' className='text-primary me-2' />
									Query Parameters
								</h3>
								<span className='text-muted small'>{queryParams.length} parameter(s)</span>
							</div>

							<div className='spec-table-container'>
								<table className='spec-table'>
									<thead>
										<tr>
											<th>Query Name</th>
											<th>Type</th>
											<th>Default</th>
											<th>Required</th>
											<th>Description</th>
										</tr>
									</thead>
									<tbody>
										{queryParams.map((q, idx) => (
											<tr key={`query-${idx}`}>
												<td>
													<span className='param-key font-monospace'>{q.name}</span>
												</td>
												<td>
													<PillBadge color='indigo' isPill size='sm'>
														{q.type || 'string'}
													</PillBadge>
												</td>
												<td>
													<span className='font-monospace small text-muted'>
														{q.default || '-'}
													</span>
												</td>
												<td>
													<PillBadge
														color={q.required ? 'danger' : 'gray'}
														isPill
														size='sm'>
														{q.required ? 'Required' : 'Optional'}
													</PillBadge>
												</td>
												<td className='text-muted small'>{q.description || '-'}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* REQUEST BODY PARAMETERS */}
					{bodyParams.length > 0 && (
						<div className='merchant-card mb-4'>
							<div className='d-flex align-items-center justify-content-between mb-3'>
								<h3 className='merchant-card-title m-0'>
									<Icon icon='DataArray' className='text-primary me-2' />
									Request Body Parameters
								</h3>
								<span className='text-muted small'>{bodyParams.length} parameter(s)</span>
							</div>

							<div className='spec-table-container'>
								<table className='spec-table'>
									<thead>
										<tr>
											<th>Field Name</th>
											<th>Type</th>
											<th>Sample / Value</th>
											<th>Required</th>
											<th>Description</th>
										</tr>
									</thead>
									<tbody>
										{bodyParams.map((b, idx) => (
											<tr key={`body-spec-${idx}`}>
												<td>
													<span className='param-key font-monospace'>{b.key}</span>
												</td>
												<td>
													<PillBadge color='teal' isPill size='sm'>
														{b.type || 'string'}
													</PillBadge>
												</td>
												<td>
													<span className='font-monospace small text-muted'>
														{b.value !== undefined && b.value !== '' ? String(b.value) : '-'}
													</span>
												</td>
												<td>
													<PillBadge
														color={b.required ? 'danger' : 'gray'}
														isPill
														size='sm'>
														{b.required ? 'Required' : 'Optional'}
													</PillBadge>
												</td>
												<td className='text-muted small'>{b.description || '-'}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>

				{/* RIGHT COLUMN: LIVE CODE TERMINAL */}
				<div className='col-xl-5 col-12'>
					<div className='sticky-terminal-wrapper'>
						{/* REQUEST CODE SNIPPET TERMINAL */}
						<div className='dark-terminal-card mb-4'>
							<div className='terminal-top-bar'>
								<div className='terminal-dots'>
									<span className='dot dot-red' />
									<span className='dot dot-amber' />
									<span className='dot dot-green' />
								</div>
								<span className='terminal-title'>REQUEST CODE</span>
								<button
									type='button'
									className='btn-terminal-copy'
									onClick={() =>
										copyToClipboard(codeSnippets[activeCodeTab], 'snippet')
									}>
									<Icon
										icon={copiedKey === 'snippet' ? 'Check' : 'ContentCopy'}
										size='sm'
									/>
									<span>{copiedKey === 'snippet' ? 'Copied' : 'Copy'}</span>
								</button>
							</div>

							{/* MULTI-LANGUAGE CODE TABS */}
							<div className='terminal-tabs'>
								<button
									type='button'
									className={`terminal-tab-btn ${activeCodeTab === 'curl' ? 'active' : ''}`}
									onClick={() => setActiveCodeTab('curl')}>
									cURL
								</button>
								<button
									type='button'
									className={`terminal-tab-btn ${activeCodeTab === 'javascript' ? 'active' : ''}`}
									onClick={() => setActiveCodeTab('javascript')}>
									Node.js / Axios
								</button>
								<button
									type='button'
									className={`terminal-tab-btn ${activeCodeTab === 'python' ? 'active' : ''}`}
									onClick={() => setActiveCodeTab('python')}>
									Python
								</button>
							</div>

							<div className='terminal-code-body'>
								<pre>
									<code>{codeSnippets[activeCodeTab]}</code>
								</pre>
							</div>
						</div>

						{/* RESPONSE PREVIEW TERMINAL */}
						<div className='dark-terminal-card'>
							<div className='terminal-top-bar'>
								<div className='d-flex align-items-center gap-2'>
									{activeResponseTab === 'success' ? (
										<span className='status-pill-green'>200 OK</span>
									) : (
										<span className='badge bg-danger text-white px-2 py-1 small fw-bold'>
											4xx / 5xx FAIL
										</span>
									)}
									<span className='terminal-title'>
										{activeResponseTab === 'success' ? 'SUCCESS RESPONSE' : 'FAILURE RESPONSE'}
									</span>
								</div>
								<button
									type='button'
									className='btn-terminal-copy'
									onClick={() =>
										copyToClipboard(
											activeResponseTab === 'success'
												? formattedResponse || '{\n  "status": true,\n  "message": "Success"\n}'
												: formattedFailResponse || '{\n  "status": false,\n  "message": "Error"\n}',
											'response',
										)
									}>
									<Icon
										icon={copiedKey === 'response' ? 'Check' : 'ContentCopy'}
										size='sm'
									/>
									<span>{copiedKey === 'response' ? 'Copied' : 'Copy'}</span>
								</button>
							</div>

							{/* RESPONSE TABS */}
							<div className='terminal-tabs'>
								<button
									type='button'
									className={`terminal-tab-btn ${
										activeResponseTab === 'success' ? 'active' : ''
									}`}
									onClick={() => setActiveResponseTab('success')}>
									<span className='text-success me-1'>●</span> Success (200 OK)
								</button>
								<button
									type='button'
									className={`terminal-tab-btn ${
										activeResponseTab === 'fail' ? 'active' : ''
									}`}
									onClick={() => setActiveResponseTab('fail')}>
									<span className='text-danger me-1'>●</span> Error / Fail
								</button>
							</div>

							<div className='terminal-code-body'>
								<pre>
									<code>
										{activeResponseTab === 'success'
											? formattedResponse ||
											  '{\n  "status": true,\n  "message": "Success"\n}'
											: formattedFailResponse ||
											  '{\n  "status": false,\n  "message": "Invalid request or operation failed."\n}'}
									</code>
								</pre>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ApiDocumentationViewContent;
