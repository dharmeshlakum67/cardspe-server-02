import apiClient from '../../../../../services/apiClient';
import { API_DOCUMENTATION_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import { decryptData } from '../../../../../helpers/cryptoUtils';
import {
	IApiDocumentation,
	IApiDocumentationQueryParams,
	IApiDocumentationResponse,
	ICreateApiDocumentationPayload,
	IPortalDocumentationResponse,
	IUpdateApiDocumentationPayload,
	TApiDocStatus,
} from '../type/api-documentation.type';

export const apiDocumentationService = {
	// 1. GET ALL API DOCUMENTATIONS (ADMIN LISTING WITH FILTERS & PAGINATION)
	getAllApiDocumentations: async (
		params?: IApiDocumentationQueryParams,
	): Promise<IApiDocumentationResponse> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search !== undefined && params.search.trim() !== '') {
				apiParams.search = params.search.trim();
			}
			if (params.category_group) apiParams.category_group = params.category_group;
			if (params.method) apiParams.method = params.method;
			if (params.status) apiParams.status = params.status;
			if (params.start_date) apiParams.start_date = params.start_date;
			if (params.end_date) apiParams.end_date = params.end_date;
			if (params.sortBy) apiParams.sortBy = params.sortBy;
			if (params.sortOrder) apiParams.sortOrder = params.sortOrder;
			if (params.sort) apiParams.sort = params.sort;
		}

		const res = await apiClient<IApiDocumentationResponse>(API_DOCUMENTATION_ENDPOINTS.GET_ALL, {
			params: apiParams,
		});
		return decryptData(res);
	},

	// 2. GET DISTINCT CATEGORY GROUPS
	getDistinctCategories: async (): Promise<{
		status?: boolean;
		success?: boolean;
		message?: string;
		data: string[];
	}> => {
		const res = await apiClient<{
			status?: boolean;
			success?: boolean;
			message?: string;
			data: string[];
		}>(API_DOCUMENTATION_ENDPOINTS.CATEGORIES);
		return decryptData(res);
	},

	// 3. GET SINGLE API DOCUMENTATION BY ID
	getApiDocumentationById: async (
		id: string | number,
	): Promise<{
		status?: boolean;
		success?: boolean;
		message?: string;
		data: IApiDocumentation;
	}> => {
		const res = await apiClient<{
			status?: boolean;
			success?: boolean;
			message?: string;
			data: IApiDocumentation;
		}>(API_DOCUMENTATION_ENDPOINTS.GET_ONE(id));
		return decryptData(res);
	},

	// 4. GET SINGLE API DOCUMENTATION BY SLUG
	getApiDocumentationBySlug: async (
		slug: string,
	): Promise<{
		status?: boolean;
		success?: boolean;
		message?: string;
		data: IApiDocumentation;
	}> => {
		const res = await apiClient<{
			status?: boolean;
			success?: boolean;
			message?: string;
			data: IApiDocumentation;
		}>(API_DOCUMENTATION_ENDPOINTS.GET_BY_SLUG(slug));
		return decryptData(res);
	},

	// 5. CREATE API DOCUMENTATION
	createApiDocumentation: async (
		payload: ICreateApiDocumentationPayload,
	): Promise<{
		status?: boolean;
		success?: boolean;
		message?: string;
		data: IApiDocumentation;
	}> => {
		const res = await apiClient<{
			status?: boolean;
			success?: boolean;
			message?: string;
			data: IApiDocumentation;
		}>(API_DOCUMENTATION_ENDPOINTS.CREATE, {
			body: payload,
		});
		return decryptData(res);
	},

	// 6. UPDATE API DOCUMENTATION
	updateApiDocumentation: async (
		id: string | number,
		payload: IUpdateApiDocumentationPayload,
	): Promise<{
		status?: boolean;
		success?: boolean;
		message?: string;
		data: IApiDocumentation;
	}> => {
		const res = await apiClient<{
			status?: boolean;
			success?: boolean;
			message?: string;
			data: IApiDocumentation;
		}>(API_DOCUMENTATION_ENDPOINTS.UPDATE(id), {
			body: payload,
		});
		return decryptData(res);
	},

	// 7. UPDATE API DOCUMENTATION STATUS (DRAFT / PUBLISHED / ARCHIVED)
	updateApiDocumentationStatus: async (
		id: string | number,
		status: TApiDocStatus,
	): Promise<{
		status?: boolean;
		success?: boolean;
		message?: string;
		data: { id: number; status: TApiDocStatus; published_at?: string | null };
	}> => {
		const res = await apiClient<{
			status?: boolean;
			success?: boolean;
			message?: string;
			data: { id: number; status: TApiDocStatus; published_at?: string | null };
		}>(API_DOCUMENTATION_ENDPOINTS.UPDATE_STATUS(id), {
			body: { status },
		});
		return decryptData(res);
	},

	// 8. DELETE API DOCUMENTATION (SOFT DELETE)
	deleteApiDocumentation: async (
		id: string | number,
	): Promise<{
		status?: boolean;
		success?: boolean;
		message: string;
	}> => {
		const res = await apiClient<{
			status?: boolean;
			success?: boolean;
			message: string;
		}>(API_DOCUMENTATION_ENDPOINTS.DELETE(id));
		return decryptData(res);
	},

	// 9. GET PUBLIC DOCUMENTATION PORTAL
	getPublicDocumentationPortal: async (): Promise<IPortalDocumentationResponse> => {
		const res = await apiClient<IPortalDocumentationResponse>(API_DOCUMENTATION_ENDPOINTS.PORTAL);
		return decryptData(res);
	},
};

export default apiDocumentationService;
