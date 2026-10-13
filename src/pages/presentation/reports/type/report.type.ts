// GENERIC BACKEND-DRIVEN REPORT ENGINE TYPES

export type TColumnType =
	| 'text'
	| 'link'
	| 'badge'
	| 'currency'
	| 'date'
	| 'datetime'
	| 'number'
	| 'image'
	| string;

export type TColumnAlign = 'left' | 'center' | 'right';

export interface IReportColumn {
	field: string;
	header: string;
	type: TColumnType;
	align?: TColumnAlign;
	sortable?: boolean;
	minWidth?: string | number;
	width?: string | number;
}

export interface IBadgeStyle {
	label?: string;
	bgColor?: string;
	textColor?: string;
	borderColor?: string;
	bold?: boolean;
}

export interface ILinkStyle {
	hyperlink?: string;
	target?: string;
}

export interface IRowStyle {
	[field: string]: IBadgeStyle | ILinkStyle | any;
}

export interface IReportRow {
	id?: string | number;
	[key: string]: any;
	__style?: IRowStyle;
}

export interface IReportSummaryCardItem {
	key: string;
	label: string;
	value: string;
	amount?: number;
	count?: number;
	bgColor?: string;
	textColor?: string;
	borderColor?: string;
	icon?: string;
}

export interface IReportSummaryCard {
	id: string;
	title: string;
	type?: string;
	icon?: string;
	bgColor?: string;
	textColor?: string;
	borderColor?: string;
	totalValue?: string;
	totalCount?: number;
	items: IReportSummaryCardItem[];
}

export interface IReportSummary {
	[field: string]: number | string | undefined;
}

export type TReportSummary = IReportSummaryCard[] | IReportSummary | Record<string, any>;

export interface IReportFilterOption {
	label: string;
	value: string | number;
}

export interface IReportFilterItem {
	field: string;
	label: string;
	type: 'text' | 'search' | 'select' | 'dropdown' | 'date' | 'daterange' | 'date_range' | 'number' | string;
	placeholder?: string;
	options?: IReportFilterOption[];
	apiRoute?: string;
	apiUrl?: string;
	endpoint?: string;
	defaultValue?: any;
	min?: number;
	max?: number;
	step?: number;
	[key: string]: any;
}

export interface IReportMetadata {
	filters?: IReportFilterItem[] | Record<string, any>;
	columns?: IReportColumn[];
}

export interface IReportPagination {
	currentPage?: number;
	page?: number;
	limit?: number;
	totalRecords?: number;
	total?: number;
	totalPages?: number;
}

export interface IReportData {
	title?: string;
	page?: number;
	limit?: number;
	total?: number;
	totalPages?: number;
	columns?: IReportColumn[];
	rows: IReportRow[];
	summary?: TReportSummary;
	cards?: IReportSummaryCard[];
	filters?: IReportFilterItem[] | Record<string, any>;
	pagination?: IReportPagination;
	metadata?: IReportMetadata;
	can_export?: boolean;
	total_commission_earned?: number | string;
	commission_earned?: number | string;
	total_commission?: number | string;
}

export interface IReportResponse {
	statusCode: number;
	status: string;
	message: string;
	data: IReportData;
}

export interface IReportQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
	start_date?: string;
	end_date?: string;
	date?: string;
	[key: string]: any;
}

export interface IDynamicReportProps {
	reportType: string;
	permissionKey?: string;
	parentPermissionKey?: string;
	defaultTitle?: string;
	defaultSortBy?: string;
	defaultSortOrder?: 'ASC' | 'DESC';
	defaultLimit?: number;
	breadcrumbs?: { label: string; to?: string; current?: boolean }[];
	extraQueryParams?: Record<string, any>;
	hideExport?: boolean;
	onRowClick?: (row: IReportRow) => void;
	emptyDateRangeByDefault?: boolean;
}
