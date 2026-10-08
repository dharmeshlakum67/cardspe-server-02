export type ServiceCategoryStatusType = 'active' | 'inactive';

export type ServiceTransactionModeType = 'CUSTOM' | 'BBPS' | 'CUSTOM_BBPS';

export interface IServiceTransactionModeOption {
	label: string;
	value: ServiceTransactionModeType;
	description?: string;
}

export interface IServiceCategory {
	id: number;
	name: string;
	slug: string;
	icon?: string | null;
	transaction_mode: ServiceTransactionModeType;
	display_order?: number | null;
	status: ServiceCategoryStatusType;
	created_at?: string;
	updated_at?: string;
}

export interface IActiveServiceCategoryItem {
	id: number;
	name: string;
	icon?: string | null;
	slug: string;
	transaction_mode?: ServiceTransactionModeType;
	display_order?: number | null;
}

export type CreateServiceCategoryPayload =
	| FormData
	| {
			name: string;
			icon?: string | null | File;
			transaction_mode?: ServiceTransactionModeType;
			display_order?: number | null;
			status?: ServiceCategoryStatusType;
	  };

export type UpdateServiceCategoryPayload =
	| FormData
	| {
			name?: string;
			icon?: string | null | File;
			transaction_mode?: ServiceTransactionModeType;
			display_order?: number | null;
			status?: ServiceCategoryStatusType;
	  };

export interface ServiceCategoryQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: ServiceCategoryStatusType;
	transaction_mode?: ServiceTransactionModeType | string;
	startDate?: string;
	endDate?: string;
	start_date?: string;
	end_date?: string;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
}

export interface IServiceCategoryListResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IServiceCategory[];
	total_document?: number;
	totalDocuments?: number;
	totalPages?: number;
	page?: number;
	limit?: number;
}

export interface IServiceCategorySingleResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IServiceCategory;
}

export interface IActiveServiceCategoriesResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IActiveServiceCategoryItem[];
}
