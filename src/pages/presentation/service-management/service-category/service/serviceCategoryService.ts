import apiClient from '../../../../../services/apiClient';
import { SERVICE_CATEGORY_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IServiceCategoryListResponse,
	IServiceCategorySingleResponse,
	IActiveServiceCategoriesResponse,
	ServiceCategoryQueryParams,
	CreateServiceCategoryPayload,
	UpdateServiceCategoryPayload,
	IServiceCategory,
	ServiceCategoryStatusType,
} from '../type/service-category-type';

export const serviceCategoryService = {
	// GET ALL SERVICE CATEGORIES (PAGINATED WITH SEARCH & FILTERS)
	getServiceCategories: async (
		params?: ServiceCategoryQueryParams,
	): Promise<IServiceCategoryListResponse> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search !== undefined && params.search !== '') apiParams.search = params.search;
			if (params.status) apiParams.status = params.status;
			if (params.startDate || params.start_date)
				apiParams.start_date = params.startDate || params.start_date;
			if (params.endDate || params.end_date)
				apiParams.end_date = params.endDate || params.end_date;
			if (params.sortBy) apiParams.sortBy = params.sortBy;
			if (params.sortOrder) apiParams.sortOrder = params.sortOrder;
		}

		return apiClient<IServiceCategoryListResponse>(SERVICE_CATEGORY_ENDPOINTS.GET_ALL, {
			params: apiParams,
		});
	},

	// GET ACTIVE SERVICE CATEGORIES FOR DROPDOWNS (LIGHTWEIGHT)
	getActiveServiceCategories: async (): Promise<IActiveServiceCategoriesResponse> => {
		return apiClient<IActiveServiceCategoriesResponse>(SERVICE_CATEGORY_ENDPOINTS.GET_ACTIVE);
	},

	// GET ALL ACTIVE SERVICE CATEGORIES (PAGINATED WITH SEARCH)
	getAllActiveServiceCategories: async (params?: {
		page?: number;
		limit?: number;
		search?: string;
	}): Promise<IServiceCategoryListResponse> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search) apiParams.search = params.search;
		}
		return apiClient<IServiceCategoryListResponse>(SERVICE_CATEGORY_ENDPOINTS.GET_ALL_ACTIVE, {
			params: apiParams,
		});
	},

	// GET SINGLE SERVICE CATEGORY BY ID
	getServiceCategoryById: async (
		id: number | string,
	): Promise<IServiceCategorySingleResponse> => {
		return apiClient<IServiceCategorySingleResponse>(SERVICE_CATEGORY_ENDPOINTS.GET_ONE(id));
	},

	// CREATE SERVICE CATEGORY
	createServiceCategory: async (
		payload: CreateServiceCategoryPayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data: IServiceCategory }> => {
		return apiClient<{
			success: boolean;
			statusCode?: number;
			message?: string;
			data: IServiceCategory;
		}>(SERVICE_CATEGORY_ENDPOINTS.CREATE, {
			body: payload,
		});
	},

	// UPDATE SERVICE CATEGORY
	updateServiceCategory: async (
		id: number | string,
		payload: UpdateServiceCategoryPayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data: any }> => {
		return apiClient<{ success: boolean; statusCode?: number; message?: string; data: any }>(
			SERVICE_CATEGORY_ENDPOINTS.UPDATE(id),
			{
				body: payload,
			},
		);
	},

	// UPDATE SERVICE CATEGORY STATUS
	updateServiceCategoryStatus: async (
		id: number | string,
		status: ServiceCategoryStatusType,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data?: any }> => {
		return apiClient(SERVICE_CATEGORY_ENDPOINTS.UPDATE_STATUS(id), {
			body: { status },
		});
	},

	// DELETE SERVICE CATEGORY
	deleteServiceCategory: async (
		id: number | string,
	): Promise<{ success: boolean; statusCode?: number; message?: string }> => {
		return apiClient<{ success: boolean; statusCode?: number; message?: string }>(
			SERVICE_CATEGORY_ENDPOINTS.DELETE(id),
		);
	},
};

export default serviceCategoryService;
