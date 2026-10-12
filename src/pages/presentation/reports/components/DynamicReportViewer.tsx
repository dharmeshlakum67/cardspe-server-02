/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/require-default-props, react/default-props-match-prop-types */
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import Spinner from '../../../../components/bootstrap/Spinner';
import Collapse from '../../../../components/bootstrap/Collapse';
import Icon from '../../../../components/icon/Icon';
import showNotification from '../../../../components/extras/showNotification';
import { AppBreadcrumbs, DateRangePicker, ListingPagination } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import { authPagesMenu } from '../../../../menu';
import AuthContext from '../../../../contexts/authContext';
import {
	IDynamicReportProps,
	IReportColumn,
	IReportRow,
	IReportSummary,
	IReportSummaryCard,
	IReportSummaryCardItem,
	TReportSummary,
	IReportFilterItem,
	IReportFilterOption,
	IReportQueryParams,
} from '../type/report.type';
import { getImageUrl } from '../../../../helpers/helpers';
import { encryptId } from '../../../../helpers/routeEncryption';
import reportService from '../service/reportService';
import AsyncDropdownFilter, { loadDropdownOptions } from './AsyncDropdownFilter';
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

// NORMALIZE COLOR FOR BADGES MATCHING WALLET PAGE
const normalizeColor = (col?: string) => {
	if (!col) return undefined;
	const trimmed = col.trim();
	if (
		trimmed.startsWith('#') ||
		trimmed.startsWith('rgb') ||
		trimmed.startsWith('hsl') ||
		trimmed.startsWith('color')
	) {
		return trimmed;
	}
	if (/^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
		return `#${trimmed}`;
	}
	return trimmed;
};

// HELPER TO CONVERT ANY COLOR TO A RICH, VISIBLE MATCHING BORDER
const getBorderForColor = (color?: string, fallback = '#cbd5e1') => {
	if (!color) return fallback;
	const c = normalizeColor(color);
	if (!c) return fallback;

	if (c.startsWith('#')) {
		const hex = c.slice(1);
		if (hex.length === 3) {
			const r = parseInt(hex[0] + hex[0], 16);
			const g = parseInt(hex[1] + hex[1], 16);
			const b = parseInt(hex[2] + hex[2], 16);
			return `rgba(${r}, ${g}, ${b}, 0.55)`;
		}
		if (hex.length >= 6) {
			const r = parseInt(hex.slice(0, 2), 16);
			const g = parseInt(hex.slice(2, 4), 16);
			const b = parseInt(hex.slice(4, 6), 16);
			return `rgba(${r}, ${g}, ${b}, 0.55)`;
		}
	}
	if (c.startsWith('rgb')) {
		return c
			.replace(/rgb\((.*)\)/, 'rgba($1, 0.55)')
			.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 'rgba($1,$2,$3, 0.55)');
	}
	return c;
};

// GET CUSTOM BADGE STYLE MATCHING WALLET PAGE WITH MATCHING COLORED BORDER
const getCustomBadgeStyle = (meta?: any, fallbackBg = '#f1f5f9', fallbackColor = '#334155') => {
	const rawBg = meta?.bgColor || meta?.background || fallbackBg;
	const rawColor = meta?.textColor || meta?.color || fallbackColor;
	const bg = normalizeColor(rawBg) || fallbackBg;
	const color = normalizeColor(rawColor) || fallbackColor;

	// Calculate a clean, clearly visible border matching the pill's own color
	let borderColor = meta?.borderColor;
	if (
		!borderColor ||
		borderColor === 'rgba(0,0,0,0.12)' ||
		borderColor === 'rgba(0, 0, 0, 0.12)' ||
		borderColor === 'transparent'
	) {
		borderColor = getBorderForColor(color);
	}

	return {
		backgroundColor: bg,
		color,
		border: `1px solid ${borderColor}`,
	};
};

// FORMAT CURRENCY HELPER
const formatCurrency = (val: any) => {
	if (val === undefined || val === null || val === '') return '₹ 0.00';
	const num = Number(val);
	if (isNaN(num)) return String(val);
	return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// GET DEFAULT DATE RANGE FOR CURRENT MONTH (YYYY-MM-01 TO YYYY-MM-LAST_DAY)
const getCurrentMonthDateRange = () => {
	const now = dayjs();
	const s = now.startOf('month').format('YYYY-MM-DD');
	const e = now.endOf('month').format('YYYY-MM-DD');
	return {
		date_from: s,
		date_to: e,
		startDate: s,
		endDate: e,
		start_date: s,
		end_date: e,
		date: `${s} to ${e}`,
	};
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
	subtext?: string;
	email?: string;
	mobile_number?: string;
	image?: string;
	icon: string;
	theme: 'purple' | 'green' | 'blue' | 'amber' | 'rose' | 'custom';
	bgColor?: string;
	textColor?: string;
	borderColor?: string;
}

// PARSE BACKEND SUMMARY OBJECT INTO STYLISH METRIC CARDS
export const parseReportSummary = (summary: any): IReportMetricCard[] => {
	if (!summary || typeof summary !== 'object') {
		return [];
	}

	// 1. Support backend cards array (e.g. Ledger Report contract)
	if (Array.isArray(summary.cards) && summary.cards.length > 0) {
		return summary.cards.map((c: any, index: number) => {
			let defaultIcon = 'Assessment';
			let defaultTheme: 'purple' | 'green' | 'blue' | 'amber' | 'rose' = 'blue';
			const titleLower = (c.title || '').toLowerCase();
			const isProfileCard =
				titleLower.includes('profile') ||
				titleLower.includes('user') ||
				Boolean(c.image);

			if (isProfileCard) {
				let email = c.email || summary.email;
				let mobile = c.mobile_number || summary.mobile_number;
				if ((!email || !mobile) && c.subtext && typeof c.subtext === 'string' && c.subtext.includes('|')) {
					const [emailPart, mobilePart] = c.subtext.split('|').map((s: string) => s.trim());
					if (!email) email = emailPart;
					if (!mobile) mobile = mobilePart;
				}

				return {
					key: c.key || `card_${index}`,
					title: '', // User requested to remove "User Profile" title
					value: c.value || summary.user_name || 'User Profile',
					subtext: (!email && !mobile) ? c.subtext : undefined,
					email,
					mobile_number: mobile,
					image: c.image || summary.image,
					icon: 'Person',
					theme: 'purple',
					bgColor: c.bgColor || '#F8FAFC',
					textColor: c.textColor || '#0F172A',
					borderColor: c.borderColor,
				};
			}

			if (titleLower.includes('current') || titleLower.includes('balance')) {
				defaultIcon = 'AccountBalanceWallet';
				defaultTheme = 'blue';
			} else if (titleLower.includes('add') || titleLower.includes('credit')) {
				defaultIcon = 'AddCircle';
				defaultTheme = 'green';
			} else if (titleLower.includes('expense') || titleLower.includes('debit')) {
				defaultIcon = 'TrendingDown';
				defaultTheme = 'rose';
			}

			return {
				key: c.key || `card_${index}`,
				title: c.title,
				value: c.value,
				subtext: c.subtext,
				image: c.image,
				icon: c.icon || defaultIcon,
				theme: defaultTheme,
				bgColor: c.bgColor,
				textColor: c.textColor,
				borderColor: c.borderColor,
			};
		});
	}

	// 2. Support user profile summary object if cards array is absent
	if (
		summary.current_balance !== undefined ||
		summary.total_add_money !== undefined ||
		summary.total_expense !== undefined
	) {
		const { email, mobile_number: mobile } = summary;
		return [
			{
				key: 'user_profile',
				title: '', // User requested to remove "User Profile" title
				value: summary.user_name || 'User Profile',
				email,
				mobile_number: mobile,
				image: summary.image,
				icon: 'Person',
				theme: 'purple',
				bgColor: '#F8FAFC',
				textColor: '#0F172A',
			},
			{
				key: 'current_balance',
				title: 'Current Balance',
				value: formatCurrency(summary.current_balance),
				icon: 'AccountBalanceWallet',
				theme: 'blue',
				bgColor: '#EFF6FF',
				textColor: '#1D4ED8',
				borderColor: '#BFDBFE',
			},
			{
				key: 'total_add_money',
				title: 'Total Add Money',
				value: formatCurrency(summary.total_add_money),
				icon: 'AddCircle',
				theme: 'green',
				bgColor: '#ECFDF5',
				textColor: '#047857',
				borderColor: '#A7F3D0',
			},
			{
				key: 'total_expense',
				title: 'Total Expense',
				value: formatCurrency(summary.total_expense),
				icon: 'TrendingDown',
				theme: 'rose',
				bgColor: '#FEF2F2',
				textColor: '#B91C1C',
				borderColor: '#FECACA',
			},
		];
	}

	const hasOverview =
		summary.total_amount !== undefined ||
		summary.total !== undefined ||
		summary.total_count !== undefined ||
		summary.total_approved_amount !== undefined ||
		summary.total_approved_count !== undefined ||
		summary.total_pending_count !== undefined ||
		summary.total_failed_count !== undefined ||
		summary.success_amount !== undefined ||
		summary.success !== undefined ||
		summary.success_count !== undefined ||
		summary.pending_amount !== undefined ||
		summary.pending !== undefined ||
		summary.pending_count !== undefined ||
		summary.failed !== undefined ||
		summary.failed_count !== undefined ||
		summary.fail_amount !== undefined ||
		summary.fail_count !== undefined;

	if (!hasOverview) {
		return [];
	}

	const approvedCount = Number(summary.success_count ?? summary.total_approved_count ?? 0);
	const pendingCount = Number(summary.pending_count ?? summary.total_pending_count ?? 0);
	const failedCount = Number(
		summary.failed_count ?? summary.fail_count ?? summary.total_failed_count ?? 0,
	);

	const totalCount =
		summary.total_count ?? (approvedCount + pendingCount + failedCount);

	const totalAmount = Number(summary.total ?? summary.total_amount ?? 0);
	const approvedAmount =
		summary.success !== undefined
			? summary.success
			: summary.success_amount !== undefined
			? summary.success_amount
			: summary.total_approved_amount;
	const pendingAmount =
		summary.pending !== undefined
			? summary.pending
			: summary.pending_amount !== undefined
			? summary.pending_amount
			: summary.total_pending_amount;
	const failedAmount =
		summary.failed !== undefined
			? summary.failed
			: summary.fail_amount !== undefined
			? summary.fail_amount
			: summary.total_failed_amount;

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
				approvedAmount !== undefined
					? formatCurrency(approvedAmount)
					: approvedCount,
			countText:
				approvedAmount !== undefined ? `(${approvedCount})` : undefined,
			icon: 'CheckCircle',
			theme: 'blue',
		},
		// Card 4: Pending
		{
			key: 'pending',
			title: 'Pending',
			value:
				pendingAmount !== undefined
					? formatCurrency(pendingAmount)
					: pendingCount,
			countText:
				pendingAmount !== undefined ? `(${pendingCount})` : undefined,
			icon: 'HourglassTop',
			theme: 'amber',
		},
		// Card 5: Failed
		{
			key: 'failed',
			title: 'Failed',
			value:
				failedAmount !== undefined
					? formatCurrency(failedAmount)
					: failedCount,
			countText:
				failedAmount !== undefined ? `(${failedCount})` : undefined,
			icon: 'Cancel',
			theme: 'rose',
		},
	];
};

// AVATAR / LOGO CELL COMPONENT WITH GRACEFUL FALLBACK
interface IReportImageCellProps {
	src?: any;
	name?: string;
	size?: number;
}

const ReportImageCell: FC<IReportImageCellProps> = ({ src, name = '', size = 36 }) => {
	const [hasError, setHasError] = useState<boolean>(false);
	const imageUrl = src ? getImageUrl(src) : '';
	const displayName = (name || '').trim();

	// Calculate clean initial / word representation (e.g. "Vedachala Seva Trust" -> "V" or "VS")
	const initial = useMemo(() => {
		if (!displayName) return 'O';
		const words = displayName.split(/\s+/).filter(Boolean);
		if (words.length > 1) {
			return (words[0][0] + words[1][0]).toUpperCase();
		}
		return words[0][0].toUpperCase();
	}, [displayName]);

	// Deterministic pastel color palette so the fallback avatar matches high design standard
	const palette = useMemo(() => {
		const palettes = [
			{ bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' }, // blue
			{ bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' }, // green
			{ bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' }, // purple
			{ bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' }, // orange
			{ bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' }, // pink
			{ bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' }, // teal
		];
		let hash = 0;
		for (let i = 0; i < displayName.length; i += 1) {
			hash = (hash * 31 + displayName.charCodeAt(i)) % 1000000;
		}
		const index = Math.abs(hash) % palettes.length;
		return palettes[index];
	}, [displayName]);

	if (!imageUrl || hasError) {
		return (
			<div
				className='report-avatar-fallback d-inline-flex align-items-center justify-content-center flex-shrink-0'
				style={{
					width: `${size}px`,
					height: `${size}px`,
					borderRadius: '50%',
					backgroundColor: palette.bg,
					color: palette.text,
					border: `1.5px solid ${palette.border}`,
					fontSize: initial.length > 1 ? `${Math.round(size * 0.36)}px` : `${Math.round(size * 0.44)}px`,
					fontWeight: 700,
					letterSpacing: '0.02em',
					lineHeight: 1,
					userSelect: 'none',
				}}
				title={displayName || 'User'}>
				{initial}
			</div>
		);
	}

	return (
		<div
			className='report-image-wrapper d-inline-flex align-items-center justify-content-center flex-shrink-0'
			style={{
				width: `${size}px`,
				height: `${size}px`,
				borderRadius: '50%',
				backgroundColor: '#ffffff',
				border: '1px solid #e2e8f0',
				overflow: 'hidden',
			}}>
			<img
				src={imageUrl}
				alt=''
				className='w-100 h-100 object-fit-contain p-1'
				onError={() => setHasError(true)}
			/>
		</div>
	);
};

export const DynamicReportViewer: FC<IDynamicReportProps> = ({
	reportType,
	permissionKey,
	parentPermissionKey = 'reports',
	defaultTitle,
	defaultSortBy,
	defaultSortOrder,
	defaultLimit,
	breadcrumbs,
	extraQueryParams,
	hideExport = false,
	onRowClick,
}) => {
	const navigate = useNavigate();
	const { canRead, hasPermission, isLoadingPermissions } = usePermission();
	const { authUser, isLoading: isAuthLoading } = useContext(AuthContext);
	const authUserId = authUser?.id;
	const authRoleId = (authUser as any)?.role_id || authUser?.role?.id;
	const authRoleName = authUser?.role?.role_name;
	const isAuthSuperAdmin = Boolean((authUser as any)?.is_super_admin);

	const isLedgerReport = reportType.toLowerCase().includes('ledger');
	const needsRoleDefaults = isLedgerReport || Boolean(permissionKey?.includes('ledger'));

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
	const [limit, setLimit] = useState<number>(defaultLimit || (isLedgerReport ? 20 : 10));
	const [sortBy, setSortBy] = useState<string>(
		defaultSortBy || (isLedgerReport ? 'date' : 'created_at'),
	);
	const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(defaultSortOrder || 'DESC');
	const [filterValues, setFilterValues] = useState<Record<string, any>>(() =>
		isLedgerReport ? {} : getCurrentMonthDateRange(),
	);
	const [debouncedFilterValues, setDebouncedFilterValues] = useState<Record<string, any>>(() =>
		isLedgerReport ? {} : getCurrentMonthDateRange(),
	);

	const [roleOptions, setRoleOptions] = useState<IReportFilterOption[]>([]);

	// REPORT LIST MUST NOT BE FETCHED UNTIL DEFAULT ROLE / USER FILTERS ARE APPLIED
	const [areFilterDefaultsReady, setAreFilterDefaultsReady] = useState<boolean>(
		!needsRoleDefaults,
	);

	// 1. FETCH ROLES FIRST FOR USER FILTERING (api/role/get-active?page=1&limit=50)
	useEffect(() => {
		if (!needsRoleDefaults || isAuthLoading) {
			return undefined;
		}

		let isCancelled = false;
		const loadRolesFirst = async () => {
			try {
				const options = await loadDropdownOptions('/api/role/get-active');
				if (isCancelled) return;

				setRoleOptions(options);

				// Once roles arrive, find appropriate role for logged-in user or first role
				let targetRoleId: any;
				if (authRoleId) {
					const found = options.find((o) => String(o.value) === String(authRoleId));
					if (found) targetRoleId = found.value;
				}
				if (!targetRoleId && authRoleName) {
					const found = options.find(
						(o) => String(o.label).toLowerCase() === authRoleName.toLowerCase(),
					);
					if (found) targetRoleId = found.value;
				}
				if (!targetRoleId && isAuthSuperAdmin) {
					const found = options.find((o) =>
						String(o.label).toLowerCase().includes('super'),
					);
					if (found) targetRoleId = found.value;
				}
				if (!targetRoleId && options.length > 0) {
					targetRoleId = options[0].value;
				}

				if (targetRoleId) {
					// Applied to both states at once so the debounce does not trigger a second fetch
					const applyRoleDefaults = (prev: Record<string, any>) => ({
						...prev,
						role_id: prev.role_id || targetRoleId,
						admin_id:
							prev.admin_id !== undefined && prev.admin_id !== ''
								? prev.admin_id
								: authUserId,
					});
					setFilterValues(applyRoleDefaults);
					setDebouncedFilterValues(applyRoleDefaults);
				}
			} catch {
				// Silently fallback if role fetch fails
			} finally {
				if (!isCancelled) {
					setAreFilterDefaultsReady(true);
				}
			}
		};

		loadRolesFirst();

		return () => {
			isCancelled = true;
		};
	}, [needsRoleDefaults, isAuthLoading, authUserId, authRoleId, authRoleName, isAuthSuperAdmin]);

	// STABLE EXTRA PARAMS FOR OPERATOR DROPDOWN (CASCADING FILTER)
	const selectedCategory =
		filterValues.service_category_id || filterValues.category_id || filterValues.category;
	const operatorExtraParams = useMemo(() => {
		if (selectedCategory && selectedCategory !== 'all') {
			return {
				service_category_id: selectedCategory,
				category_id: selectedCategory,
				category: selectedCategory,
			};
		}
		return undefined;
	}, [selectedCategory]);

	// STABLE EXTRA PARAMS FOR ADMIN DROPDOWN (CASCADING FILTER FROM ROLE)
	const selectedRole = filterValues.role_id;
	const adminExtraParams = useMemo(() => {
		const params: Record<string, any> = {};
		if (selectedRole && selectedRole !== 'all') {
			params.role_id = selectedRole;
		}
		return params;
	}, [selectedRole]);

	// NORMALIZE BACKEND-DRIVEN FILTERS (SUPPORTING ARRAY OR OBJECT CONTRACT)
	const parsedFilters = useMemo<IReportFilterItem[]>(() => {
		let list: IReportFilterItem[] = [];
		if (Array.isArray(rawFilters)) {
			list = [...rawFilters];
		} else if (rawFilters && typeof rawFilters === 'object') {
			list = Object.entries(rawFilters).map(([fieldKey, def]: [string, any]) => ({
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
				apiRoute: def?.apiRoute || def?.apiUrl || def?.endpoint,
				...def,
			}));
		}

		// Ensure Admin (admin_id) filter exists for Ledger Report
		if (isLedgerReport && !list.some((f) => f.field === 'admin_id')) {
			list.unshift({
				field: 'admin_id',
				label: 'User',
				type: 'dropdown',
				placeholder: 'Select User',
				apiRoute: '/api/admin/get-active',
			});
		}

		// Ensure Role dropdown is prepended before User (admin_id) dropdown
		const hasAdmin = list.some((f) => f.field === 'admin_id');
		const hasRole = list.some((f) => f.field === 'role_id');
		if (hasAdmin && !hasRole) {
			const adminIndex = list.findIndex((f) => f.field === 'admin_id');
			const roleFilter: IReportFilterItem = {
				field: 'role_id',
				label: 'Role',
				type: 'dropdown',
				placeholder: 'Select Role',
				apiRoute: '/api/role/get-active',
				options: roleOptions.length > 0 ? roleOptions : undefined,
			};
			if (adminIndex >= 0) {
				list.splice(adminIndex, 0, roleFilter);
			} else {
				list.unshift(roleFilter);
			}
		} else if (hasRole && roleOptions.length > 0) {
			list = list.map((f) =>
				f.field === 'role_id' ? { ...f, options: roleOptions } : f,
			);
		}

		return list;
	}, [rawFilters, isLedgerReport, roleOptions]);

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
					const s = filterValues.start_date || filterValues.startDate || filterValues.date_from;
					const e = filterValues.end_date || filterValues.endDate || filterValues.date_to;
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
	useEffect(() => {
		if (JSON.stringify(filterValues) === JSON.stringify(debouncedFilterValues)) {
			return undefined;
		}
		const timer = setTimeout(() => {
			setDebouncedFilterValues(filterValues);
			setPage(1);
		}, 350);
		return () => clearTimeout(timer);
	}, [filterValues, debouncedFilterValues]);

	// BUILD ACTIVE QUERY PARAMETERS (CLEAN BACKEND-COMPLIANT PARAMS)
	const buildQueryParams = useCallback((): IReportQueryParams => {
		const cleanFilters: Record<string, any> = {};
		const handledRangeKeys = new Set<string>([
			'date_from',
			'date_to',
			'startDate',
			'endDate',
			'start_date',
			'end_date',
			'date',
		]);
		const currentFilters = parsedFiltersRef.current || [];

		// TWO SEPARATE DATE PARAMETERS (start_date AND end_date)
		const s =
			debouncedFilterValues.start_date ||
			debouncedFilterValues.startDate ||
			debouncedFilterValues.date_from;
		const e =
			debouncedFilterValues.end_date ||
			debouncedFilterValues.endDate ||
			debouncedFilterValues.date_to;

		if (s) {
			cleanFilters.start_date = s;
		}
		if (e) {
			cleanFilters.end_date = e;
		}

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
				handledRangeKeys.add(filter.field);
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
				if (k === 'role_id' && isLedgerReport) {
					return;
				}
				cleanFilters[k] = typeof v === 'string' ? v.trim() : v;
			}
		});

		// Support category <-> service_category_id bidirectional mapping
		if (cleanFilters.category && !cleanFilters.service_category_id) {
			cleanFilters.service_category_id = cleanFilters.category;
		} else if (cleanFilters.service_category_id && !cleanFilters.category) {
			cleanFilters.category = cleanFilters.service_category_id;
		}

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
	}, [
		page,
		limit,
		sortBy,
		sortOrder,
		debouncedFilterValues,
		extraQueryParamsSerialized,
		isLedgerReport,
	]);

	// REF GUARDS PREVENTING DUPLICATE REQUESTS (REPOSITORY STANDARD)
	const lastFetchKeyRef = useRef<string>('');
	const latestRequestIdRef = useRef<number>(0);

	const fetchReport = useCallback(
		async (force = false) => {
			if (isLoadingPermissions || !areFilterDefaultsReady) {
				return;
			}

			const queryParams = buildQueryParams();
			const currentFetchKey = `${reportType}_${JSON.stringify(queryParams)}`;

			if (!force && lastFetchKeyRef.current === currentFetchKey) {
				return;
			}

			lastFetchKeyRef.current = currentFetchKey;
			latestRequestIdRef.current += 1;
			const requestId = latestRequestIdRef.current;
			setIsLoading(true);

			try {
				const res = await reportService.getReportList(reportType, queryParams);
				// A newer request has started; ignore this stale response
				if (requestId !== latestRequestIdRef.current) return;
				const rawData = res?.data;
				const data = (rawData as any)?.formattedData
					? { ...rawData, ...(rawData as any).formattedData }
					: rawData;
				if (data) {
					setReportTitle(data.title || fallbackTitle);
					const metaCols = data.metadata?.columns;
					const cols = Array.isArray(data.columns)
						? data.columns
						: Array.isArray(metaCols)
						? metaCols
						: [];
					setColumns(cols);
					setRows(Array.isArray(data.rows) ? data.rows : []);
					// Backend sends summary on page 1 only; preserve existing summary when page > 1
					if (data.summary !== undefined && data.summary !== null) {
						setSummary(data.summary);
					}
					const metaFilters = data.metadata?.filters;
					const fltrs =
						data.filters !== undefined
							? data.filters
							: metaFilters !== undefined
							? metaFilters
							: undefined;
					if (fltrs !== undefined) {
						setRawFilters((prev: any) => {
							if (!prev && fltrs) return fltrs;
							if (JSON.stringify(prev) === JSON.stringify(fltrs)) {
								return prev;
							}
							return fltrs;
						});
					}
					const totalRecords =
						data.pagination?.totalRecords ??
						data.pagination?.total ??
						data.total ??
						0;
					const pages =
						data.pagination?.totalPages ?? data.totalPages ?? 1;
					setTotal(totalRecords);
					setTotalPages(pages);
				}
			} catch (error: any) {
				if (requestId !== latestRequestIdRef.current) return;
				lastFetchKeyRef.current = '';
				const msg =
					error?.data?.message ||
					error?.message ||
					`Failed to fetch ${fallbackTitle} data.`;
				showNotification('Error', msg, 'danger');
			} finally {
				if (requestId === latestRequestIdRef.current) {
					setIsLoading(false);
				}
			}
		},
		[reportType, buildQueryParams, fallbackTitle, isLoadingPermissions, areFilterDefaultsReady],
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

	// RESET ALL FILTERS (RESTORES CURRENT MONTH DEFAULT FOR STANDARD REPORTS)
	const handleResetFilters = () => {
		lastFetchKeyRef.current = '';
		const defaultDateRange = isLedgerReport ? {} : getCurrentMonthDateRange();
		setFilterValues((prev) => {
			const nextVals: Record<string, any> = { ...defaultDateRange };
			if (isLedgerReport && prev.role_id) nextVals.role_id = prev.role_id;
			if (isLedgerReport && prev.admin_id) nextVals.admin_id = prev.admin_id;
			return nextVals;
		});
		setDebouncedFilterValues((prev) => {
			const nextVals: Record<string, any> = { ...defaultDateRange };
			if (isLedgerReport && prev.role_id) nextVals.role_id = prev.role_id;
			if (isLedgerReport && prev.admin_id) nextVals.admin_id = prev.admin_id;
			return nextVals;
		});
		setSortBy(defaultSortBy || 'created_at');
		setSortOrder(defaultSortOrder || 'DESC');
		setPage(1);
	};

	// HANDLE FILTER INPUT CHANGE (WITH CASCADING RESET SUPPORT)
	const handleFilterChange = (field: string, val: any) => {
		const cleanVal = val === 'all' ? '' : val;
		setFilterValues((prev) => {
			const next = {
				...prev,
				[field]: cleanVal,
			};

			// CASCADING: If service category changes or is cleared, reset the operator filter
			if (field === 'service_category_id' || field === 'category_id') {
				if (prev.operator_id) {
					next.operator_id = '';
				}
			}

			// CASCADING: If role changes or is cleared, reset the user/admin filter
			if (field === 'role_id') {
				if (prev.admin_id) {
					next.admin_id = '';
				}
			}

			return next;
		});
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
			let targetRoute = link.startsWith('/') ? link : `/${link}`;
			const viewMatch = targetRoute.match(/^(\/.+\/(?:view|edit)\/)(\d+)$/);
			if (viewMatch) {
				targetRoute = `${viewMatch[1]}${encryptId(viewMatch[2])}`;
			}
			navigate(targetRoute, { state: { transaction: row, from: 'transaction_report' } });
			return;
		}

		// 2. Fallback to wallet transaction view if wallet_transaction_id is present
		if (row.wallet_transaction_id) {
			navigate(`/payments/wallet-transactions/view/${encryptId(String(row.wallet_transaction_id))}`, {
				state: {
					transaction: row,
					from: 'transaction_report',
				},
			});
		}
	};

	// COLUMN ALIGNMENT HELPER (RESPECTS BACKEND ALIGN, FALLS BACK TO SENSIBLE DEFAULTS)
	const getColumnAlignment = (col: IReportColumn): { alignmentClass: string; justifyClass: string } => {
		if (col.align === 'right') {
			return { alignmentClass: 'text-end', justifyClass: 'justify-content-end' };
		}
		if (col.align === 'center') {
			return { alignmentClass: 'text-center', justifyClass: 'justify-content-center' };
		}
		if (col.align === 'left') {
			return { alignmentClass: 'text-start', justifyClass: 'justify-content-start' };
		}

		const field = (col.field || '').toLowerCase();
		const header = (col.header || '').toLowerCase();

		// Center aligned columns as default if no align specified: amount, charge, payable_amount, currency, status, badge, date
		const isCenter =
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

		return { alignmentClass: 'text-start', justifyClass: 'justify-content-start' };
	};

	// DYNAMIC CELL CONTENT RENDERER
	const renderCellContent = (row: IReportRow, col: IReportColumn) => {
		const rawValue = row[col.field];
		const styleObj = row.__style?.[col.field];
		const fieldLower = (col.field || '').toLowerCase();
		const headerLower = (col.header || '').toLowerCase();
		const isStatus =
			fieldLower === 'status' ||
			headerLower === 'status' ||
			col.type === 'status';

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

		// 2. STATUS BADGE (MATCHING WALLET STATUS PILL: ROUNDED-PILL, UPPERCASE, BOLD)
		if (isStatus) {
			const label = (styleObj?.label || rawValue || '-').toString().toUpperCase();
			let defaultBg = '#f1f5f9';
			let defaultColor = '#475569';
			let defaultBorder = '#cbd5e1';

			if (label.includes('SUCCESS') || label.includes('APPROVED')) {
				defaultBg = '#f0fdf4';
				defaultColor = '#15803d';
				defaultBorder = '#86efac';
			} else if (label.includes('FAIL') || label.includes('REJECT')) {
				defaultBg = '#fff1f2';
				defaultColor = '#be123c';
				defaultBorder = '#fca5a5';
			} else if (label.includes('PENDING') || label.includes('REQUEST')) {
				defaultBg = '#fffbeb';
				defaultColor = '#b45309';
				defaultBorder = '#fcd34d';
			}

			const textColor = normalizeColor(styleObj?.textColor) || defaultColor;
			const bgColor = normalizeColor(styleObj?.bgColor) || defaultBg;

			let borderColor = styleObj?.borderColor;
			if (
				!borderColor ||
				borderColor === 'rgba(0,0,0,0.12)' ||
				borderColor === 'rgba(0, 0, 0, 0.12)' ||
				borderColor === 'transparent'
			) {
				borderColor = defaultBorder || getBorderForColor(textColor);
			}

			const badgeStyle = {
				backgroundColor: bgColor,
				color: textColor,
				border: `1px solid ${borderColor}`,
			};

			return (
				<span
					className='status-pill-badge px-2 py-1 rounded-pill fw-bold d-inline-block text-uppercase'
					style={badgeStyle}>
					{label}
				</span>
			);
		}

		// 3. DIFFERENCE BADGE (MATCHING LEDGER REPORT DIFFERENCE: PILL BADGE WITH GREEN +₹ FOR CREDITS & RED -₹ FOR DEBITS)
		const isDifference =
			fieldLower === 'difference' ||
			headerLower === 'difference';

		if (isDifference) {
			const label = styleObj?.label || rawValue || '-';
			const isNegative = String(label).trim().startsWith('-');
			const badgeStyle = getCustomBadgeStyle(
				styleObj,
				isNegative ? '#FEF2F2' : '#DCFCE7',
				isNegative ? '#B91C1C' : '#15803D',
			);
			return (
				<span
					className='difference-pill-badge px-2 py-1 rounded-pill fw-bold d-inline-block'
					style={{
						...badgeStyle,
						fontSize: '0.75rem',
						lineHeight: 1.2,
					}}>
					{label}
				</span>
			);
		}

		// 4. CATEGORY / TYPE BADGE (MATCHING WALLET TRANSACTION CATEGORY: CRISP RECTANGLE, ZERO BORDER-RADIUS)
		if (
			col.type === 'badge' ||
			Boolean(styleObj?.bgColor) ||
			fieldLower.includes('category') ||
			fieldLower.includes('type') ||
			fieldLower.includes('mode') ||
			headerLower.includes('category') ||
			headerLower.includes('type') ||
			headerLower.includes('mode')
		) {
			const label = styleObj?.label || rawValue || '-';
			const badgeStyle = getCustomBadgeStyle(styleObj);
			return (
				<span
					className='category-tag px-2 py-1 fw-semibold d-inline-block text-capitalize'
					style={{
						...badgeStyle,
						fontSize: '0.75rem',
						borderRadius: 0,
					}}>
					{label}
				</span>
			);
		}

		// 5. CURRENCY / AMOUNT (MATCHING WALLET AMOUNT DISPLAY: POPPINS BOLD)
		if (
			col.type === 'currency' ||
			fieldLower.includes('amount') ||
			fieldLower.includes('charge') ||
			fieldLower.includes('balance') ||
			fieldLower.includes('prebalance') ||
			fieldLower.includes('post_balance') ||
			headerLower.includes('amount') ||
			headerLower.includes('charge') ||
			headerLower.includes('balance')
		) {
			return (
				<span className='amount-display'>
					{formatCurrency(rawValue)}
				</span>
			);
		}

		// 5. DATE
		if (col.type === 'date' || col.type === 'datetime' || fieldLower.includes('date')) {
			return <span className='text-muted small'>{rawValue || '-'}</span>;
		}

		// 6. IMAGE (WITH ELEGANT INITIALS AVATAR FALLBACK IF BROKEN OR EMPTY)
		if (
			col.type === 'image' ||
			fieldLower === 'logo' ||
			fieldLower === 'icon' ||
			fieldLower === 'operator_icon' ||
			fieldLower.includes('logo')
		) {
			const operatorName =
				String(
					row.name ||
					row.operator_name ||
					row.operator?.name ||
					row.operator ||
					row.title ||
					row.service_name ||
					'',
				).trim();

			return <ReportImageCell src={rawValue} name={operatorName} />;
		}

		// 7. DEFAULT TEXT
		return (
			<span>
				{rawValue !== undefined && rawValue !== null ? String(rawValue) : '-'}
			</span>
		);
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
											const sDate =
												filterValues.start_date ||
												filterValues.startDate ||
												filterValues.date_from ||
												'';
											const eDate =
												filterValues.end_date ||
												filterValues.endDate ||
												filterValues.date_to ||
												'';

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
																start_date: sVal,
																end_date: eVal,
																date: sVal && eVal ? `${sVal} to ${eVal}` : '',
																[filter.field]:
																	sVal && eVal ? `${sVal} to ${eVal}` : '',
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

										// 3. DROPDOWN / SELECT FILTER (DYNAMIC API OR STATIC OPTIONS)
										if (filter.type === 'select' || filter.type === 'dropdown') {
											const currentVal = filterValues[filter.field] ?? '';
											const hasApiRoute = Boolean(
												filter.apiRoute ||
												(filter as any).apiUrl ||
												(filter as any).endpoint,
											);

											// Render dynamic searchable dropdown if apiRoute is provided
											if (hasApiRoute) {
												const isOperatorField = filter.field === 'operator_id';
												const isCategoryChosen = Boolean(selectedCategory && selectedCategory !== 'all');
												const isOperatorDisabled = isOperatorField && !isCategoryChosen;

												const isAdminField = filter.field === 'admin_id';
												const isRoleChosen = Boolean(selectedRole && selectedRole !== 'all');
												const isAdminDisabled = isAdminField && !isRoleChosen;
												const fallbackLabel =
													isAdminField && String(currentVal) === String(authUser?.id)
														? authUser?.name || authUser?.username
														: undefined;

												return (
													<AsyncDropdownFilter
														key={filter.field}
														filter={filter}
														value={currentVal}
														fallbackLabel={fallbackLabel}
														disabled={isOperatorDisabled || isAdminDisabled}
														disabledPlaceholder={
															isOperatorDisabled
																? 'Select Category first'
																: isAdminDisabled
																? 'Select Role first'
																: undefined
														}
														extraParams={
															isOperatorField
																? operatorExtraParams
																: isAdminField
																? adminExtraParams
																: undefined
														}
														onChange={(newVal) => handleFilterChange(filter.field, newVal)}
														width={
															filter.field === 'service_category_id' || filter.field === 'admin_id'
																? '220px'
																: '200px'
														}
													/>
												);
											}

											// Standard static dropdown
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
						<div
							className={`report-summary-cards-grid ${
								metricCards.some((c) => c.image || c.email || c.mobile_number)
									? 'has-profile-card'
									: ''
							}`}>
							{metricCards.map((card) => {
								const cardStyle: React.CSSProperties = {};
								if (card.bgColor) cardStyle.backgroundColor = card.bgColor;
								if (card.borderColor) cardStyle.borderColor = card.borderColor;
								const isProfile = Boolean(card.image || card.email || card.mobile_number);

								return (
									<div
										key={card.key}
										className={`summary-metric-card theme-${card.theme} ${
											isProfile ? 'is-profile-card' : ''
										}`}
										style={cardStyle}>
										<div className='metric-card-inner'>
											{card.image ? (
												<div className='metric-icon-wrap bg-transparent shadow-none border-0'>
													<ReportImageCell
														src={card.image}
														name={String(card.value || card.title)}
														size={44}
													/>
												</div>
											) : (
												<div
													className='metric-icon-wrap'
													style={card.textColor ? { color: card.textColor } : undefined}>
													<Icon icon={mapReportIcon(card.icon)} />
												</div>
											)}
											<div className='metric-content-wrap'>
												{card.title && (
													<div
														className='metric-title'
														style={card.textColor ? { color: card.textColor, opacity: 0.85 } : undefined}>
														{card.title}
													</div>
												)}
												<div className='metric-value-row'>
													<span
														className='metric-value'
														style={card.textColor ? { color: card.textColor } : undefined}>
														{card.value}
													</span>
													{card.countText && (
														<span className='metric-count-pill'>{card.countText}</span>
													)}
												</div>
												{card.email || card.mobile_number ? (
													<div className='metric-contact-wrap mt-1 d-flex flex-column'>
														{card.email && (
															<span
																className='metric-subtext text-truncate'
																title={card.email}
																style={
																	card.textColor
																		? { color: card.textColor, opacity: 0.8 }
																		: undefined
																}>
																{card.email}
															</span>
														)}
														{card.mobile_number && (
															<span
																className='metric-subtext text-truncate'
																title={card.mobile_number}
																style={
																	card.textColor
																		? { color: card.textColor, opacity: 0.8 }
																		: undefined
																}>
																{card.mobile_number}
															</span>
														)}
													</div>
												) : card.subtext ? (
													<div
														className='metric-subtext'
														title={card.subtext}
														style={card.textColor ? { color: card.textColor, opacity: 0.75 } : undefined}>
														{card.subtext}
													</div>
												) : null}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{/* REPORT DATA TABLE */}
					<div className='listing-main-card report-table-card'>
						<div className='listing-table-container table-responsive-wrapper'>
							<table className='table report-table align-middle'>
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
																className={`${alignmentClass} amount-display fw-bold`}>
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

						{/* STANDARDIZED LISTING PAGINATION (MATCHES ENTIRE CARDSPE SUITE) */}
						{!isLoading && rows.length > 0 && (
							<div className='report-pagination-wrapper'>
								<ListingPagination
									pagination={{
										currentPage: page,
										totalItems: total,
										perPage: limit,
										perPageOptions: [10, 25, 50, 100],
										onPageChange: (newPage: number) => {
											setPage(newPage);
										},
										onPerPageChange: (newLimit: number) => {
											setLimit(newLimit);
											setPage(1);
										},
									}}
								/>
							</div>
						)}
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default DynamicReportViewer;
