/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-nested-ternary */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import Spinner from '../../../../components/bootstrap/Spinner';
import Collapse from '../../../../components/bootstrap/Collapse';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import { AppBreadcrumbs, DateRangePicker } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import { authPagesMenu } from '../../../../menu';
import {
	IDynamicReportProps,
	IReportColumn,
	IReportRow,
	IReportSummary,
	IReportSummaryCard,
	IReportSummaryCardItem,
	TReportSummary,
	IReportFilterItem,
	IReportQueryParams,
} from '../type/report.type';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { encryptId } from '../../../../helpers/routeEncryption';
import reportService from '../service/reportService';
import '../css/DynamicReport.scss';

// MAP BACKEND ICON NAMES TO MATERIAL / SVG ICONS SAFELY
const mapReportIcon = (name?: string): string => {
	if (!name) return 'Assessment';
	const clean = name.toLowerCase().replace(/[-_ ]/g, '');
	const map: Record<string, string> = {
		accountbalancewallet: 'AccountBalanceWallet',
		wallet: 'AccountBalanceWallet',
		checkcircle: 'CheckCircle',
		check: 'Check',
		hourglass: 'HourglassTop',
		hourglasstop: 'HourglassTop',
		pending: 'HourglassTop',
		cancel: 'Cancel',
		close: 'Close',
		bolt: 'Bolt',
		flash: 'Bolt',
		receiptlong: 'ReceiptLong',
		receipt: 'ReceiptLong',
		tune: 'Tune',
		filter: 'FilterAlt',
		payments: 'Payments',
		trendingup: 'TrendingUp',
		assessment: 'Assessment',
	};
	return map[clean] || name;
};

// FORMAT CURRENCY HELPER
const formatCurrency = (val: any) => {
	if (val === undefined || val === null || val === '') return '₹ 0.00';
	const num = Number(val);
	if (isNaN(num)) return String(val);
	return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// SERVICE CARD THEME MAPPING
const SERVICE_THEMES: Record<
	string,
	{ icon: string; bgColor: string; textColor: string; borderColor: string }
> = {
	custom_bbps: {
		icon: 'bolt',
		bgColor: '#FAF5FF',
		textColor: '#6B21A8',
		borderColor: '#E9D5FF',
	},
	bbps: {
		icon: 'receipt_long',
		bgColor: '#F0F9FF',
		textColor: '#0369A1',
		borderColor: '#BAE6FD',
	},
	custom: {
		icon: 'tune',
		bgColor: '#EEF2FF',
		textColor: '#4338CA',
		borderColor: '#C7D2FE',
	},
};

export interface IReportMetricCard {
	key: string;
	title: string;
	value: string | number;
	countText?: string;
	icon: string;
	theme: 'purple' | 'green' | 'blue' | 'amber' | 'rose';
}

// PARSE BACKEND SUMMARY OBJECT INTO STYLISH METRIC CARDS
export const parseReportSummary = (summary: any): IReportMetricCard[] => {
	if (!summary || typeof summary !== 'object') {
		return [];
	}

	const hasOverview =
		summary.total_amount !== undefined ||
		summary.total_count !== undefined ||
		summary.total_approved_amount !== undefined ||
		summary.total_approved_count !== undefined ||
		summary.total_pending_count !== undefined ||
		summary.total_failed_count !== undefined;

	if (!hasOverview) {
		return [];
	}

	const totalCount =
		summary.total_count ??
		(Number(summary.total_approved_count || 0) +
			Number(summary.total_pending_count || 0) +
			Number(summary.total_failed_count || 0));

	const totalAmount = Number(summary.total_amount || 0);
	const approvedCount = Number(summary.total_approved_count || 0);
	const pendingCount = Number(summary.total_pending_count || 0);
	const failedCount = Number(summary.total_failed_count || 0);

	return [
		// Card 1: Total Transactions
		{
			key: 'total_transactions',
			title: 'Total Transactions',
			value: totalCount,
			icon: 'Description',
			theme: 'purple',
		},
		// Card 2: Total Amount
		{
			key: 'total_amount',
			title: 'Total Amount',
			value: formatCurrency(totalAmount),
			icon: 'AccountBalanceWallet',
			theme: 'green',
		},
		// Card 3: Successful
		{
			key: 'successful',
			title: 'Successful',
			value:
				summary.total_approved_amount !== undefined
					? formatCurrency(summary.total_approved_amount)
					: approvedCount,
			countText:
				summary.total_approved_amount !== undefined ? `(${approvedCount})` : undefined,
			icon: 'CheckCircle',
			theme: 'blue',
		},
		// Card 4: Pending
		{
			key: 'pending',
			title: 'Pending',
			value:
				summary.total_pending_amount !== undefined
					? formatCurrency(summary.total_pending_amount)
					: pendingCount,
			countText:
				summary.total_pending_amount !== undefined ? `(${pendingCount})` : undefined,
			icon: 'HourglassTop',
			theme: 'amber',
		},
		// Card 5: Failed
		{
			key: 'failed',
			title: 'Failed',
			value:
				summary.total_failed_amount !== undefined
					? formatCurrency(summary.total_failed_amount)
					: failedCount,
			countText:
				summary.total_failed_amount !== undefined ? `(${failedCount})` : undefined,
			icon: 'Cancel',
			theme: 'rose',
		},
	];
};

export const DynamicReportViewer: FC<IDynamicReportProps> = ({
	reportType,
	permissionKey,
	parentPermissionKey = 'reports',
	defaultTitle,
	breadcrumbs,
	extraQueryParams,
	hideExport = false,
	onRowClick,
}) => {
	const navigate = useNavigate();
	const { canRead, hasPermission, isLoadingPermissions } = usePermission();

	const resolvedPermKey =
		permissionKey || reportType.toLowerCase().trim().replace(/[-/\s]+/g, '_');

	const hasReadPermission = Boolean(
		canRead(resolvedPermKey) ||
		(parentPermissionKey ? canRead(parentPermissionKey) : false) ||
		canRead('report') ||
		canRead('reports'),
	);

	const canExport = Boolean(
		!hideExport &&
		(hasPermission(resolvedPermKey, 'export') ||
			hasPermission(resolvedPermKey, 'download') ||
			hasPermission(resolvedPermKey, 'excel')),
	);

	// REDIRECT IF PERMISSION DENIED
	useEffect(() => {
		if (!isLoadingPermissions && !hasReadPermission) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, hasReadPermission, navigate]);

	// REPORT DATA STATES
	const fallbackTitle =
		defaultTitle ||
		reportType
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

	const [reportTitle, setReportTitle] = useState<string>(fallbackTitle);
	const [columns, setColumns] = useState<IReportColumn[]>([]);
	const [rows, setRows] = useState<IReportRow[]>([]);
	const [summary, setSummary] = useState<any>(undefined);

	// DERIVE METRIC CARDS FROM RETAINED SUMMARY
	const metricCards = useMemo(() => {
		return parseReportSummary(summary);
	}, [summary]);
	const [rawFilters, setRawFilters] = useState<any>(undefined);
	const [total, setTotal] = useState<number>(0);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isDownloading, setIsDownloading] = useState<boolean>(false);

	// FILTER & PAGINATION STATES
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true);
	const [page, setPage] = useState<number>(1);
	const [limit, setLimit] = useState<number>(20);
	const [sortBy, setSortBy] = useState<string>('created_at');
	const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
	const [filterValues, setFilterValues] = useState<Record<string, any>>({});
	const [debouncedFilterValues, setDebouncedFilterValues] = useState<Record<string, any>>({});

	// NORMALIZE BACKEND-DRIVEN FILTERS (SUPPORTING ARRAY OR OBJECT CONTRACT)
	const parsedFilters = useMemo<IReportFilterItem[]>(() => {
		if (!rawFilters) return [];
		if (Array.isArray(rawFilters)) return rawFilters;
		if (typeof rawFilters === 'object') {
			return Object.entries(rawFilters).map(([fieldKey, def]: [string, any]) => ({
				field: def?.field || fieldKey,
				label: def?.label || fieldKey.replace(/_/g, ' '),
				type: def?.type || 'text',
				placeholder: def?.placeholder,
				options:
					def?.options ||
					(Array.isArray(def?.enum)
						? def.enum.map((val: any) => ({
								label: String(val).toUpperCase(),
								value: String(val),
						  }))
						: undefined),
				...def,
			}));
		}
		return [];
	}, [rawFilters]);

	// COUNT ACTIVE FILTERS (INCREMENTS IF ANY FILTER VALUE IS PRESENT)
	const activeFilterCount = useMemo(() => {
		let count = 0;
		const handledRangeFields = new Set<string>();

		parsedFilters.forEach((filter) => {
			const isDateRange =
				filter.type === 'date_range' ||
				filter.type === 'daterange' ||
				(filter.type === 'date' && filter.field.includes('range')) ||
				filter.field === 'date';

			const isNumberRange =
				filter.type === 'number_range' ||
				filter.type === 'amount_range' ||
				filter.field === 'amount';

			if (isDateRange) {
				if (!handledRangeFields.has(filter.field)) {
					const s = filterValues.date_from || filterValues.startDate;
					const e = filterValues.date_to || filterValues.endDate;
					const directVal = filterValues[filter.field];
					if (
						(s && String(s).trim() !== '') ||
						(e && String(e).trim() !== '') ||
						(directVal && String(directVal).trim() !== '')
					) {
						count += 1;
					}
					handledRangeFields.add(filter.field);
				}
			} else if (isNumberRange) {
				if (!handledRangeFields.has(filter.field)) {
					const min = filterValues.amount_min ?? filterValues[`${filter.field}_min`];
					const max = filterValues.amount_max ?? filterValues[`${filter.field}_max`];
					const directVal = filterValues[filter.field];
					const hasMin =
						min !== undefined && min !== null && String(min).trim() !== '';
					const hasMax =
						max !== undefined && max !== null && String(max).trim() !== '';
					const hasDirect =
						directVal !== undefined &&
						directVal !== null &&
						String(directVal).trim() !== '';
					if (hasMin || hasMax || hasDirect) {
						count += 1;
					}
					handledRangeFields.add(filter.field);
				}
			} else {
				const val = filterValues[filter.field];
				if (val !== undefined && val !== null && val !== '' && val !== 'all') {
					if (typeof val === 'string' ? val.trim() !== '' : true) {
						count += 1;
					}
				}
			}
		});

		// Fallback check: if parsedFilters didn't capture a custom filter value
		if (count === 0) {
			const hasAnyVal = Object.entries(filterValues).some(([_, v]) => {
				if (v === undefined || v === null || v === '' || v === 'all') return false;
				if (typeof v === 'string' && v.trim() === '') return false;
				return true;
			});
			if (hasAnyVal) count = 1;
		}

		return count;
	}, [parsedFilters, filterValues]);

	// KEEP LATEST PARSED FILTERS IN REF TO AVOID TRIGGERING REFETCH ON SCHEMA LOAD
	const parsedFiltersRef = useRef<IReportFilterItem[]>([]);
	parsedFiltersRef.current = parsedFilters;

	// SERIALIZE EXTRA QUERY PARAMS TO PREVENT OBJECT-IDENTITY RE-RENDERS
	const extraQueryParamsSerialized = useMemo(
		() => JSON.stringify(extraQueryParams || {}),
		[extraQueryParams],
	);

	// DEBOUNCE FILTER TEXT VALUES TO PREVENT EXCESSIVE API CALLS
	const prevFilterValuesRef = useRef<string>(JSON.stringify(filterValues));
	useEffect(() => {
		const serialized = JSON.stringify(filterValues);
		if (prevFilterValuesRef.current === serialized) {
			return undefined;
		}
		const timer = setTimeout(() => {
			prevFilterValuesRef.current = serialized;
			setDebouncedFilterValues(filterValues);
			setPage(1);
		}, 350);
		return () => clearTimeout(timer);
	}, [filterValues]);

	// BUILD ACTIVE QUERY PARAMETERS (ONLY SENDS RANGES IF BOTH BOUNDS EXIST)
	const buildQueryParams = useCallback((): IReportQueryParams => {
		const cleanFilters: Record<string, any> = {};
		const handledRangeKeys = new Set<string>();
		const currentFilters = parsedFiltersRef.current || [];

		currentFilters.forEach((filter) => {
			const isDateRange =
				filter.type === 'date_range' ||
				filter.type === 'daterange' ||
				(filter.type === 'date' && filter.field.includes('range')) ||
				filter.field === 'date';

			const isNumberRange =
				filter.type === 'number_range' ||
				filter.type === 'amount_range' ||
				filter.field === 'amount';

			if (isDateRange) {
				const s = debouncedFilterValues.date_from || debouncedFilterValues.startDate;
				const e = debouncedFilterValues.date_to || debouncedFilterValues.endDate;
				if (s && e) {
					cleanFilters.date_from = s;
					cleanFilters.date_to = e;
					cleanFilters.startDate = s;
					cleanFilters.endDate = e;
					cleanFilters[filter.field] = `${s}_${e}`;
				} else if (s) {
					cleanFilters.date_from = s;
					cleanFilters.startDate = s;
				} else if (e) {
					cleanFilters.date_to = e;
					cleanFilters.endDate = e;
				}
				handledRangeKeys.add(filter.field);
				handledRangeKeys.add('date_from');
				handledRangeKeys.add('date_to');
				handledRangeKeys.add('startDate');
				handledRangeKeys.add('endDate');
			} else if (isNumberRange) {
				const min = debouncedFilterValues.amount_min ?? debouncedFilterValues[`${filter.field}_min`];
				const max = debouncedFilterValues.amount_max ?? debouncedFilterValues[`${filter.field}_max`];
				const hasMin = min !== undefined && min !== null && String(min).trim() !== '';
				const hasMax = max !== undefined && max !== null && String(max).trim() !== '';
				if (hasMin) {
					cleanFilters.amount_min = min;
					cleanFilters[`${filter.field}_min`] = min;
				}
				if (hasMax) {
					cleanFilters.amount_max = max;
					cleanFilters[`${filter.field}_max`] = max;
				}
				if (hasMin && hasMax) {
					cleanFilters[filter.field] = `${min}_${max}`;
				} else if (hasMin) {
					cleanFilters[filter.field] = `${min}_`;
				} else if (hasMax) {
					cleanFilters[filter.field] = `_${max}`;
				}
				handledRangeKeys.add(filter.field);
				handledRangeKeys.add('amount_min');
				handledRangeKeys.add('amount_max');
				handledRangeKeys.add(`${filter.field}_min`);
				handledRangeKeys.add(`${filter.field}_max`);
			}
		});

		// Pass remaining non-range filter fields
		Object.entries(debouncedFilterValues).forEach(([k, v]) => {
			if (!handledRangeKeys.has(k) && v !== undefined && v !== null && v !== '' && v !== 'all') {
				cleanFilters[k] = typeof v === 'string' ? v.trim() : v;
			}
		});

		const extra = extraQueryParamsSerialized ? JSON.parse(extraQueryParamsSerialized) : {};

		const query: IReportQueryParams = {
			page,
			limit,
			sortBy,
			sortOrder,
			...cleanFilters,
			...extra,
		};
		return query;
	}, [page, limit, sortBy, sortOrder, debouncedFilterValues, extraQueryParamsSerialized]);

	// REF GUARDS PREVENTING DUPLICATE REQUESTS (REPOSITORY STANDARD)
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	const fetchReport = useCallback(
		async (force = false) => {
			if (isLoadingPermissions) {
				return;
			}

			const queryParams = buildQueryParams();
			const currentFetchKey = `${reportType}_${page}_${limit}_${sortBy}_${sortOrder}_${JSON.stringify(queryParams)}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const res = await reportService.getReportList(reportType, queryParams);
				const data = res?.data;
				if (data) {
					setReportTitle(data.title || fallbackTitle);
					setColumns(Array.isArray(data.columns) ? data.columns : []);
					setRows(Array.isArray(data.rows) ? data.rows : []);
					// Backend sends summary on page 1 only; preserve existing summary when page > 1
					if (data.summary !== undefined && data.summary !== null) {
						setSummary(data.summary);
					}
					if (data.filters !== undefined) {
						setRawFilters((prev: any) => {
							if (!prev && data.filters) return data.filters;
							if (JSON.stringify(prev) === JSON.stringify(data.filters)) {
								return prev;
							}
							return data.filters;
						});
					}
					setTotal(data.total || 0);
					setTotalPages(data.totalPages || 1);
				}
			} catch (error: any) {
				lastFetchKeyRef.current = '';
				const msg =
					error?.data?.message ||
					error?.message ||
					`Failed to fetch ${fallbackTitle} data.`;
				showNotification('Error', msg, 'danger');
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			reportType,
			buildQueryParams,
			fallbackTitle,
			isLoadingPermissions,
			page,
			limit,
			sortBy,
			sortOrder,
		],
	);

	useEffect(() => {
		fetchReport();
	}, [fetchReport]);

	// HANDLE EXCEL EXPORT
	const handleExportExcel = async () => {
		if (isDownloading) return;
		setIsDownloading(true);
		try {
			const queryParams = buildQueryParams();
			await reportService.downloadReport(reportType, queryParams);
			showNotification(
				'Download Complete',
				`${reportTitle} has been downloaded successfully.`,
				'success',
			);
		} catch (error: any) {
			const msg = error?.message || `Failed to download ${reportTitle}.`;
			showNotification('Export Failed', msg, 'danger');
		} finally {
			setIsDownloading(false);
		}
	};

	// RESET ALL FILTERS
	const handleResetFilters = () => {
		lastFetchKeyRef.current = '';
		prevFilterValuesRef.current = '{}';
		setFilterValues({});
		setDebouncedFilterValues({});
		setSortBy('created_at');
		setSortOrder('DESC');
		setPage(1);
	};

	// HANDLE FILTER INPUT CHANGE
	const handleFilterChange = (field: string, val: any) => {
		setFilterValues((prev) => ({
			...prev,
			[field]: val,
		}));
	};

	// HANDLE COLUMN HEADER SORT CLICK
	const handleSortClick = (field: string, isSortable?: boolean) => {
		if (!isSortable) return;
		if (sortBy === field) {
			setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
		} else {
			setSortBy(field);
			setSortOrder('DESC');
		}
		setPage(1);
	};

	// REDIRECT LINK TO DETAILS PAGE
	const handleLinkRedirect = (row: IReportRow, col: IReportColumn) => {
		const styleObj = row.__style?.[col.field];
		const rawValue = row[col.field];

		// 1. Explicit hyperlink provided by backend row.__style
		if (styleObj?.hyperlink && typeof styleObj.hyperlink === 'string' && styleObj.hyperlink.trim()) {
			const link = styleObj.hyperlink.trim();
			if (link.startsWith('http://') || link.startsWith('https://')) {
				window.open(link, '_blank', 'noopener,noreferrer');
				return;
			}
			const targetRoute = link.startsWith('/') ? link : `/${link}`;
			navigate(targetRoute, { state: { transaction: row, from: 'transaction_report' } });
			return;
		}

		// 2. Redirect to transaction details view page using row ID or raw value
		const targetId =
			row.id ||
			row.transaction_id ||
			row.txn_id ||
			row.service_transaction_id ||
			row.wallet_transaction_id ||
			row._id ||
			rawValue;

		if (targetId) {
			const safeEncryptedId = String(targetId).startsWith('sm_')
				? String(targetId)
				: encryptId(String(targetId));
			navigate(`/${PAGE_ROUTES.WALLET_TRANSACTION}/view/${safeEncryptedId}`, {
				state: {
					transaction: row,
					from: 'transaction_report',
				},
			});
		}
	};

	// COLUMN ALIGNMENT HELPER (CENTER ALIGN AMOUNT, CHARGE, PAYABLE AMOUNT, STATUS, ETC.)
	const getColumnAlignment = (col: IReportColumn): { alignmentClass: string; justifyClass: string } => {
		const field = (col.field || '').toLowerCase();
		const header = (col.header || '').toLowerCase();

		// Center aligned columns as requested: amount, charge, payable_amount, currency, status, badge, date
		const isCenter =
			col.align === 'center' ||
			col.type === 'currency' ||
			col.type === 'status' ||
			col.type === 'badge' ||
			col.type === 'date' ||
			col.type === 'datetime' ||
			field === 'amount' ||
			field === 'charge' ||
			field === 'payable_amount' ||
			field === 'status' ||
			field.includes('amount') ||
			field.includes('charge') ||
			header.includes('amount') ||
			header.includes('charge') ||
			header.includes('status');

		if (isCenter) {
			return { alignmentClass: 'text-center', justifyClass: 'justify-content-center' };
		}

		if (col.align === 'right') {
			return { alignmentClass: 'text-end', justifyClass: 'justify-content-end' };
		}

		return { alignmentClass: 'text-start', justifyClass: 'justify-content-start' };
	};

	// DYNAMIC CELL CONTENT RENDERER
	const renderCellContent = (row: IReportRow, col: IReportColumn) => {
		const rawValue = row[col.field];
		const styleObj = row.__style?.[col.field];

		// 1. LINK TYPE OR EXPLICIT HYPERLINK
		if (col.type === 'link' || Boolean(styleObj?.hyperlink)) {
			return (
				<button
					type='button'
					className='cell-link btn btn-link p-0 border-0'
					title='View Details'
					onClick={(e) => {
						e.stopPropagation();
						handleLinkRedirect(row, col);
					}}>
					<span className='cell-link-text'>{rawValue || '-'}</span>
					<Icon icon='OpenInNew' size='sm' className='cell-link-icon' />
				</button>
			);
		}

		switch (col.type) {

			case 'badge': {
				const label = styleObj?.label || rawValue || '-';
				const badgeStyle = {
					backgroundColor: styleObj?.bgColor || '#f1f5f9',
					color: styleObj?.textColor || '#334155',
					border: styleObj?.borderColor
						? `1px solid ${styleObj.borderColor}`
						: '1px solid rgba(0,0,0,0.1)',
				};
				return (
					<span className='cell-badge' style={badgeStyle}>
						{label}
					</span>
				);
			}

			case 'currency': {
				return (
					<span className='cell-currency font-monospace'>
						{formatCurrency(rawValue)}
					</span>
				);
			}

			case 'date':
			case 'datetime': {
				return <span className='text-muted small'>{rawValue || '-'}</span>;
			}

			case 'image': {
				if (!rawValue) return <span className='text-muted small'>-</span>;
				return (
					<img
						src={rawValue}
						alt='thumbnail'
						className='rounded-circle object-fit-cover'
						style={{ width: '32px', height: '32px' }}
					/>
				);
			}

			default: {
				return (
					<span>
						{rawValue !== undefined && rawValue !== null ? String(rawValue) : '-'}
					</span>
				);
			}
		}
	};

	const defaultBreadcrumbs = [
		{ label: 'Reports', to: undefined },
		{ label: reportTitle, current: true },
	];

	const hasActiveFilters = Object.values(filterValues).some(
		(v) => v !== undefined && v !== null && v !== '' && v !== 'all',
	);

	return (
		<PageWrapper isProtected permissionKey={resolvedPermKey} title={reportTitle}>
			<Page container='fluid'>
				<div className='dynamic-report-container'>
					{/* TOP NAVIGATION & ACTIONS BAR */}
					<div className='report-top-bar'>
						<div className='header-title-wrap'>
							<AppBreadcrumbs items={breadcrumbs || defaultBreadcrumbs} />
						</div>

						<div className='header-actions'>
							{/* SHOW / HIDE FILTER TOGGLE BUTTON */}
							{parsedFilters.length > 0 && (
								<button
									type='button'
									className='btn-toggle-filter'
									onClick={() => setIsFilterOpen((prev) => !prev)}>
									{isFilterOpen ? 'Hide Filter' : 'Show Filter'}
									{activeFilterCount > 0 && (
										<span className='badge bg-white text-dark rounded-pill ms-2'>
											{activeFilterCount}
										</span>
									)}
								</button>
							)}

							{/* EXCEL EXPORT BUTTON */}
							{canExport && (
								<button
									type='button'
									className='btn-export-excel'
									disabled={isDownloading || isLoading}
									onClick={handleExportExcel}>
									{isDownloading ? (
										<>
											<Spinner isSmall inButton isGrow={false} />
											<span>Exporting...</span>
										</>
									) : (
										<>
											<Icon icon='Download' size='sm' />
											<span>Export to Excel</span>
										</>
									)}
								</button>
							)}
						</div>
					</div>

					{/* BACKEND-DRIVEN FILTER CARD (COLLAPSIBLE & RIGHT ALIGNED) */}
					{parsedFilters.length > 0 && (
						<Collapse isOpen={isFilterOpen}>
							<div className='report-filter-card'>
								<div className='filter-right-aligned-row'>
									{parsedFilters.map((filter) => {
										const isDateRange =
											filter.type === 'date_range' ||
											filter.type === 'daterange' ||
											(filter.type === 'date' && filter.field.includes('range')) ||
											filter.field === 'date';

										const isNumberRange =
											filter.type === 'number_range' ||
											filter.type === 'amount_range' ||
											filter.field === 'amount';

										// 1. DATE RANGE FILTER WITH COMMON DATERANGEPICKER
										if (isDateRange) {
											const sDate = filterValues.date_from || filterValues.startDate || '';
											const eDate = filterValues.date_to || filterValues.endDate || '';

											return (
												<div
													key={filter.field}
													className='filter-field'
													style={{ width: '240px' }}>
													<span className='filter-field-label d-block'>
														{filter.label || 'Date Range'}
													</span>
													<DateRangePicker
														startDate={sDate}
														endDate={eDate}
														placeholder={filter.placeholder || 'Select Date Range'}
														onChange={({
															startDate: sVal,
															endDate: eVal,
														}: {
															startDate: string;
															endDate: string;
														}) => {
															setFilterValues((prev) => ({
																...prev,
																date_from: sVal,
																date_to: eVal,
																startDate: sVal,
																endDate: eVal,
																[filter.field]:
																	sVal && eVal ? `${sVal}_${eVal}` : '',
															}));
															if ((sVal && eVal) || (!sVal && !eVal)) {
																setPage(1);
															}
														}}
													/>
												</div>
											);
										}

										// 2. NUMBER RANGE (MIN / MAX) FILTER
										if (isNumberRange) {
											const minVal = filterValues.amount_min ?? filterValues[`${filter.field}_min`] ?? '';
											const maxVal = filterValues.amount_max ?? filterValues[`${filter.field}_max`] ?? '';

											return (
												<div
													key={filter.field}
													className='filter-field'
													style={{ width: '230px' }}>
													<span className='filter-field-label d-block'>
														{filter.label}
													</span>
													<div className='d-flex align-items-center gap-2'>
														<input
															type='number'
															className='form-control text-center'
															style={{ width: '100px' }}
															placeholder='Min'
															value={minVal}
															onChange={(e) =>
																setFilterValues((prev) => ({
																	...prev,
																	amount_min: e.target.value,
																	[`${filter.field}_min`]: e.target.value,
																}))
															}
														/>
														<span className='text-muted small fw-bold'>-</span>
														<input
															type='number'
															className='form-control text-center'
															style={{ width: '100px' }}
															placeholder='Max'
															value={maxVal}
															onChange={(e) =>
																setFilterValues((prev) => ({
																	...prev,
																	amount_max: e.target.value,
																	[`${filter.field}_max`]: e.target.value,
																}))
															}
														/>
													</div>
												</div>
											);
										}

										// 3. DROPDOWN / SELECT FILTER
										if (filter.type === 'select' || filter.type === 'dropdown') {
											const currentVal = filterValues[filter.field] ?? '';
											return (
												<div
													key={filter.field}
													className='filter-field'
													style={{ width: '180px' }}>
													<label
														htmlFor={`filter-${filter.field}`}
														className='filter-field-label d-block'>
														{filter.label}
													</label>
													<select
														id={`filter-${filter.field}`}
														className='form-select'
														value={currentVal || 'all'}
														onChange={(e) =>
															handleFilterChange(filter.field, e.target.value)
														}>
														<option value='all'>All {filter.label}</option>
														{filter.options?.map((opt) => (
															<option
																key={String(opt.value)}
																value={String(opt.value)}>
																{opt.label}
															</option>
														))}
													</select>
												</div>
											);
										}

										// 4. SINGLE DATE FILTER
										if (filter.type === 'date') {
											const currentVal = filterValues[filter.field] ?? '';
											return (
												<div
													key={filter.field}
													className='filter-field'
													style={{ width: '180px' }}>
													<label
														htmlFor={`filter-${filter.field}`}
														className='filter-field-label d-block'>
														{filter.label}
													</label>
													<input
														id={`filter-${filter.field}`}
														type='date'
														className='form-control'
														value={currentVal}
														onChange={(e) =>
															handleFilterChange(filter.field, e.target.value)
														}
													/>
												</div>
											);
										}

										// 5. NUMBER FILTER
										if (filter.type === 'number') {
											const currentVal = filterValues[filter.field] ?? '';
											return (
												<div
													key={filter.field}
													className='filter-field'
													style={{ width: '160px' }}>
													<label
														htmlFor={`filter-${filter.field}`}
														className='filter-field-label d-block'>
														{filter.label}
													</label>
													<input
														id={`filter-${filter.field}`}
														type='number'
														className='form-control'
														placeholder={filter.placeholder || filter.label}
														value={currentVal}
														min={filter.min}
														max={filter.max}
														step={filter.step}
														onChange={(e) =>
															handleFilterChange(filter.field, e.target.value)
														}
													/>
												</div>
											);
										}

										// 6. DEFAULT / TEXT / SEARCH FILTER
										const currentVal = filterValues[filter.field] ?? '';
										return (
											<div
												key={filter.field}
												className='filter-field'
												style={{ width: '220px' }}>
												<label
													htmlFor={`filter-${filter.field}`}
													className='filter-field-label d-block'>
													{filter.label}
												</label>
												<div className='position-relative'>
													<input
														id={`filter-${filter.field}`}
														type='text'
														className='form-control pe-4'
														placeholder={
															filter.placeholder || `Search ${filter.label}...`
														}
														value={currentVal}
														onChange={(e) =>
															handleFilterChange(filter.field, e.target.value)
														}
													/>
													{currentVal && (
														<button
															type='button'
															className='btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted p-1 border-0 bg-transparent'
															onClick={() => handleFilterChange(filter.field, '')}>
															<Icon icon='Close' size='sm' />
														</button>
													)}
												</div>
											</div>
										);
									})}

									{/* RESET FILTER ACTION */}
									<div>
										<button
											type='button'
											className={`btn-reset-filters ${activeFilterCount > 0 ? 'is-active' : ''}`}
											disabled={activeFilterCount === 0}
											onClick={handleResetFilters}
											title='Reset all filters'>
											<Icon icon='RestartAlt' size='sm' />
											<span>Reset</span>
										</button>
									</div>
								</div>
							</div>
						</Collapse>
					)}

					{/* BACKEND-DRIVEN STAT METRIC CARDS (PASTEL LUXURY CARDS MATCHING DESIGN) */}
					{metricCards.length > 0 && (
						<div className='report-summary-cards-grid'>
							{metricCards.map((card) => (
								<div key={card.key} className={`summary-metric-card theme-${card.theme}`}>
									<div className='metric-card-inner'>
										<div className='metric-icon-wrap'>
											<Icon icon={mapReportIcon(card.icon)} />
										</div>
										<div className='metric-content-wrap'>
											<div className='metric-title'>{card.title}</div>
											<div className='metric-value-row'>
												<span className='metric-value'>{card.value}</span>
												{card.countText && (
													<span className='metric-count-pill'>{card.countText}</span>
												)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{/* REPORT DATA TABLE */}
					<div className='report-table-card'>
						<div className='table-responsive-wrapper'>
							<table className='report-table'>
								<thead>
									<tr>
										{columns.map((col) => {
											const isCurrentSort = sortBy === col.field;
											const { alignmentClass, justifyClass } = getColumnAlignment(col);

											return (
												<th
													key={col.field}
													className={`${alignmentClass} ${col.sortable ? 'sortable-th' : ''}`}
													style={col.width ? { width: col.width } : undefined}
													onClick={() => handleSortClick(col.field, col.sortable)}>
													<div className={`th-content ${justifyClass}`}>
														<span>{col.header}</span>
														{col.sortable && (
															<span className='ms-1'>
																{isCurrentSort ? (
																	<Icon
																		icon={
																			sortOrder === 'ASC'
																				? 'ArrowUpward'
																				: 'ArrowDownward'
																		}
																		className='sort-indicator'
																	/>
																) : (
																	<Icon icon='UnfoldMore' className='sort-inactive' />
																)}
															</span>
														)}
													</div>
												</th>
											);
										})}
									</tr>
								</thead>
								<tbody>
									{isLoading ? (
										<tr>
											<td colSpan={columns.length || 8} className='text-center py-5'>
												<div className='d-flex flex-column align-items-center justify-content-center gap-2'>
													<Spinner isSmall={false} color='primary' />
													<span className='text-muted small'>
														Loading report data...
													</span>
												</div>
											</td>
										</tr>
									) : rows.length === 0 ? (
										<tr>
											<td
												colSpan={columns.length || 8}
												className='text-center py-5 text-muted'>
												<div className='d-flex flex-column align-items-center justify-content-center gap-2'>
													<Icon
														icon='Assessment'
														size='2x'
														className='text-secondary opacity-50'
													/>
													<span className='fw-bold'>No report records found</span>
													<span className='small text-muted'>
														Try modifying your filter parameters.
													</span>
												</div>
											</td>
										</tr>
									) : (
										rows.map((row, rowIdx) => (
											<tr
												key={row.id || row.transaction_id || rowIdx}
												onClick={() => onRowClick && onRowClick(row)}
												style={onRowClick ? { cursor: 'pointer' } : undefined}>
												{columns.map((col) => {
													const { alignmentClass } = getColumnAlignment(col);

													return (
														<td key={col.field} className={alignmentClass}>
															{renderCellContent(row, col)}
														</td>
													);
												})}
											</tr>
										))
									)}
								</tbody>

								{/* SUMMARY TOTALS FOOTER (IF PRESENT AND NOT CARDS) */}
								{!isLoading &&
									metricCards.length === 0 &&
									summary &&
									!Array.isArray(summary) &&
									Object.keys(summary).length > 0 &&
									rows.length > 0 && (
										<tfoot>
											<tr className='summary-row'>
												{columns.map((col, idx) => {
													const { alignmentClass } = getColumnAlignment(col);

													if (idx === 0) {
														return (
															<td key={col.field} className={alignmentClass}>
																<span className='fw-bold text-uppercase'>
																	Total
																</span>
															</td>
														);
													}

													const sumVal = summary[col.field];
													if (sumVal !== undefined && sumVal !== null) {
														return (
															<td
																key={col.field}
																className={`${alignmentClass} font-monospace fw-bold`}>
																{col.type === 'currency'
																	? formatCurrency(sumVal)
																	: String(sumVal)}
															</td>
														);
													}

													return <td key={col.field} className={alignmentClass} />;
												})}
											</tr>
										</tfoot>
									)}
							</table>
						</div>

						{/* PAGINATION BOTTOM BAR */}
						{!isLoading && rows.length > 0 && (
							<div className='table-pagination-bar'>
								<div className='pagination-left'>
									<span>
										Showing {rows.length} of {total} records
									</span>
									<span className='mx-1'>•</span>
									<label
										htmlFor='dynamicReportLimitSelect'
										className='mb-0 d-flex align-items-center gap-1'>
										<span>Per page:</span>
										<select
											id='dynamicReportLimitSelect'
											className='limit-select'
											value={limit}
											onChange={(e) => {
												setLimit(Number(e.target.value));
												setPage(1);
											}}>
											<option value={10}>10</option>
											<option value={20}>20</option>
											<option value={50}>50</option>
											<option value={100}>100</option>
										</select>
									</label>
								</div>

								<div className='pagination-nav'>
									<button
										type='button'
										className='page-btn'
										disabled={page <= 1}
										onClick={() => setPage(1)}
										title='First page'>
										<Icon icon='FirstPage' size='sm' />
									</button>
									<button
										type='button'
										className='page-btn'
										disabled={page <= 1}
										onClick={() => setPage((p) => Math.max(p - 1, 1))}
										title='Previous page'>
										<Icon icon='ChevronLeft' size='sm' />
									</button>

									<span className='px-2 small fw-bold text-dark'>
										Page {page} of {totalPages}
									</span>

									<button
										type='button'
										className='page-btn'
										disabled={page >= totalPages}
										onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
										title='Next page'>
										<Icon icon='ChevronRight' size='sm' />
									</button>
									<button
										type='button'
										className='page-btn'
										disabled={page >= totalPages}
										onClick={() => setPage(totalPages)}
										title='Last page'>
										<Icon icon='LastPage' size='sm' />
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default DynamicReportViewer;
