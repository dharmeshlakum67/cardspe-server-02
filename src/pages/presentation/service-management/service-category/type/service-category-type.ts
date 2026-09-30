export type ServiceCategoryStatusType = 'active' | 'inactive';

export interface IServiceCategory {
	id: number;
	name: string;
	icon?: string | null;
	slug: string;
	status: ServiceCategoryStatusType;
	created_at?: string;
	updated_at?: string;
}

export interface IActiveServiceCategoryItem {
	id: number;
	name: string;
	icon?: string | null;
	slug: string;
}

export type CreateServiceCategoryPayload =
	| FormData
	| {
			name: string;
			icon?: string | null | File;
			status?: ServiceCategoryStatusType;
	  };

export type UpdateServiceCategoryPayload =
	| FormData
	| {
			name?: string;
			icon?: string | null | File;
			status?: ServiceCategoryStatusType;
	  };

export interface ServiceCategoryQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: ServiceCategoryStatusType;
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
