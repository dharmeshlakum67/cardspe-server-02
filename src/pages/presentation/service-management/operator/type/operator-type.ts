// BBPS OPERATOR TYPES & INTERFACES

export type OperatorStatusType = 'active' | 'inactive';

export type BillFetchRequirementType = 'mandatory' | 'optional' | 'not_supported' | 'not_required';

export type AmountExactnessType = 'exact' | 'above' | 'below' | 'any';

export type ParamType = 'text' | 'number' | 'alphanumeric' | 'select' | 'date';

export interface OperatorParamItem {
	id?: number;
	param_index?: number;
	param_name: string;
	param_key: string;
	param_external_id?: string;
	param_type?: ParamType;
	data_type?: string;
	regex?: string | null;
	min_length?: number | null;
	max_length?: number | null;
	is_optional?: boolean;
	is_required?: boolean;
	placeholder?: string | null;
	display_order?: number;
	options?: any[] | string | null;
}

export type IOperatorInputParam = OperatorParamItem;

export interface IOperatorPaymentModeConfig {
	payment_mode_id: number;
	name?: string;
	code?: string;
	min_amount?: number | string | null;
	max_amount?: number | string | null;
	is_default?: boolean;
	status?: string;
}

export interface IOperatorPaymentMode {
	id: number;
	payment_mode_id?: number;
	name: string;
	code?: string;
	status?: string;
	min_amount?: number | null;
	max_amount?: number | null;
	is_default?: boolean;
	OperatorPaymentMode?: {
		min_amount?: number | null;
		max_amount?: number | null;
		is_default?: boolean;
		status?: string;
	};
	Operator_Payment_Mode_Model?: {
		min_amount?: number | null;
		max_amount?: number | null;
		is_default?: boolean;
		status?: string;
	};
	operator_payment_mode?: {
		min_amount?: number | null;
		max_amount?: number | null;
		is_default?: boolean;
		status?: string;
	};
	pivot?: {
		min_amount?: number | null;
		max_amount?: number | null;
		is_default?: boolean;
		status?: string;
	};
}

export interface IOperator {
	id: number;
	name: string;
	slug: string;
	short_name: string;
	operator_code: string | number;
	service_category_id: number;
	service_category?: {
		id: number;
		name: string;
		slug?: string;
		icon?: string;
	};
	serviceCategory?: {
		id: number;
		name: string;
		slug?: string;
		icon?: string;
	};
	category_name?: string;
	biller_id?: string | null;
	icon?: string | null;
	is_bbps_enabled: boolean;
	bill_fetch_requirement?: BillFetchRequirementType;
	amount_exactness?: AmountExactnessType;
	payment_channel?: string;
	circle_id?: string;
	is_bill_fetch_available?: boolean;
	is_partial_pay_allowed?: boolean;
	is_online_validation_available?: boolean;
	exact_amount_matching?: boolean;
	min_amount?: number | null;
	max_amount?: number | null;
	help_line_number?: string | null;
	display_order?: number | null;
	status: OperatorStatusType;
	parameters?: IOperatorInputParam[];
	input_params?: IOperatorInputParam[];
	input_parameters?: IOperatorInputParam[];
	params?: IOperatorInputParam[];
	payment_modes?: IOperatorPaymentMode[];
	payment_mode_ids?: number[];
	created_at?: string;
	updated_at?: string;
}

export interface IOperatorFilterParams {
	page?: number;
	limit?: number;
	search?: string;
	service_category_id?: number | string;
	status?: OperatorStatusType | '';
	is_bbps_enabled?: boolean | string;
	startDate?: string;
	endDate?: string;
	start_date?: string;
	end_date?: string;
	sortBy?: string;
	sortDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface IOperatorListResponse {
	status: boolean;
	status_code: number;
	message: string;
	data: IOperator[];
	total_document?: number;
	totalDocuments?: number;
	total_pages?: number;
	current_page?: number;
}

export interface IOperatorSingleResponse {
	status: boolean;
	status_code: number;
	message: string;
	data: IOperator;
}

export interface IActiveServiceCategoryOption {
	id: number;
	name: string;
	slug?: string;
	icon?: string;
	transaction_mode?: 'CUSTOM' | 'BBPS' | 'CUSTOM_BBPS';
}

export interface IActivePaymentModeOption {
	id: number;
	name: string;
	code?: string;
}
