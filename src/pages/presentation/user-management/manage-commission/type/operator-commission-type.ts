export type TCommissionType = 'FLAT' | 'PERCENTAGE';
export type TCommissionStatus = 'active' | 'inactive';

export interface ICategorySummaryItem {
	id: number | null;
	name: string;
	slug: string;
	count: number;
}

export interface ICommissionSummary {
	total_operators: number;
	categories: ICategorySummaryItem[];
}

export interface ICommissionPagination {
	total: number;
	page: number;
	limit: number;
	total_pages?: number;
}

export interface IOperatorCommissionDetail {
	id?: number | null;
	type: TCommissionType;
	value: number | string;
	is_fixed?: boolean;
	status: TCommissionStatus;
	can_edit?: boolean;
}

export interface IOperatorCommissionRow {
	operator_id: number;
	name: string;
	slug: string;
	icon?: string | null;
	can_edit?: boolean;
	category: {
		id: number;
		name: string;
	};
	commission: IOperatorCommissionDetail;
}

export interface IOperatorCommissionResponseData {
	summary: ICommissionSummary;
	pagination: ICommissionPagination;
	rows: IOperatorCommissionRow[];
}

export interface IOperatorCommissionApiResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IOperatorCommissionResponseData;
}

export interface IGetOperatorCommissionsQueryParams {
	admin_id?: number | string;
	page?: number;
	limit?: number;
	service_category_id?: number | string | null;
	search?: string;
	[key: string]: any;
}

export interface ISaveOperatorCommissionPayload {
	admin_id: number;
	operator_id: number;
	commission_type: TCommissionType;
	commission_value: number;
	status: TCommissionStatus;
}

export interface IBulkSaveOperatorCommissionItem {
	operator_id: number;
	commission_type: TCommissionType;
	commission_value: number;
	status: TCommissionStatus;
}

export interface IBulkSaveOperatorCommissionPayload {
	admin_id: number;
	commissions: IBulkSaveOperatorCommissionItem[];
}

export interface IBulkCategoryUpdatePayload {
	admin_id?: number | null;
	service_category_id: number;
	commission_type: TCommissionType;
	commission_value: number;
}
