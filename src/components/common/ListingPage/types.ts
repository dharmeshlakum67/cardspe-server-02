import { ReactNode } from 'react';
import { TIcons } from '../../../type/icons-type';

export interface IBreadcrumbItem {
	text: string;
	to?: string;
}

export interface IListingColumn<T = any> {
	key: string;
	header: string | ReactNode;
	headerStyle?: React.CSSProperties;
	headerClassName?: string;
	headerAlign?: 'start' | 'center' | 'end';
	headerGradient?: string;
	headerBackground?: string;
	headerRender?: (column: IListingColumn<T>) => ReactNode;
	align?: 'start' | 'center' | 'end';
	width?: string | number;
	minWidth?: string | number;
	className?: string;
	style?: React.CSSProperties;
	render?: (row: T, index: number) => ReactNode;
	sortable?: boolean;
}

export interface IListingActionConfig<T = any> {
	permissionKey?: string;
	showView?: boolean | ((row: T) => boolean);
	showEdit?: boolean | ((row: T) => boolean);
	showDelete?: boolean | ((row: T) => boolean);
	onView?: (row: T) => void;
	onEdit?: (row: T) => void;
	onDelete?: (row: T) => void;
	viewText?: string;
	editText?: string;
	deleteText?: string;
	buttonVariant?: 'pill' | 'circle' | 'outline';
	customActions?: (row: T) => ReactNode;
	actionColumnHeader?: string;
	actionColumnWidth?: string | number;
}

export interface IListingPaginationConfig {
	currentPage: number;
	totalItems: number;
	perPage: number;
	perPageOptions?: number[];
	onPageChange: (page: number) => void;
	onPerPageChange?: (perPage: number) => void;
}

export interface IListingPageProps<T = any> {
	title: string;
	subTitle?: string;
	breadcrumbs?: IBreadcrumbItem[];
	permissionKey?: string;

	// TOP HEADER ACTIONS
	showFilterButton?: boolean;
	isFilterOpenDefault?: boolean;
	onAddNew?: () => void;
	addNewText?: string;
	addNewIcon?: TIcons;
	headerActions?: ReactNode;

	// COLLAPSIBLE FILTER SECTION
	filterContent?: ReactNode;
	onResetFilter?: () => void;
	onApplyFilter?: () => void;
	activeFilterCount?: number;

	// DATA TABLE
	columns: IListingColumn<T>[];
	data: T[];
	isLoading?: boolean;
	keyExtractor?: (row: T, index: number) => string | number;
	emptyMessage?: string;
	emptyIcon?: TIcons;

	// ACTION COLUMN
	actions?: IListingActionConfig<T>;

	// PAGINATION
	pagination?: IListingPaginationConfig;

	// EXTRA CUSTOM SECTIONS
	tableTopContent?: ReactNode;
	tableBottomContent?: ReactNode;
	className?: string;
}
