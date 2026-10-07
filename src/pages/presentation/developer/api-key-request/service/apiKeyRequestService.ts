import apiClient from '../../../../../services/apiClient';
import { API_KEY_REQUEST_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import { decryptData } from '../../../../../helpers/cryptoUtils';
import {
	ICreateApiKeyRequestPayload,
	IReviewApiKeyRequestPayload,
	IApiKeyRequestQueryParams,
	IApiKeyRequestListResponse,
	IApiKeyRequestSingleResponse,
	TApiKeyType,
} from '../../../../../type/api-key-request.type';

export const apiKeyRequestService = {
	// 1. CREATE API KEY REQUEST (USER / MERCHANT)
	createApiKeyRequest: async (
		payload: ICreateApiKeyRequestPayload,
	): Promise<IApiKeyRequestSingleResponse> => {
		const res = await apiClient<IApiKeyRequestSingleResponse>(API_KEY_REQUEST_ENDPOINTS.CREATE, {
			body: payload,
		});
		return decryptData(res);
	},

	// 1b. INSTANT GENERATE API KEY (FIRST-TIME USERS)
	generateApiKey: async (payload: {
		key_type: TApiKeyType;
	}): Promise<any> => {
		const res = await apiClient<any>(API_KEY_REQUEST_ENDPOINTS.GENERATE, {
			body: payload,
		});
		return decryptData(res);
	},

	// 2. GET ALL API KEY REQUESTS (PAGINATED WITH FILTERS & SEARCH)
	getAllApiKeyRequests: async (
		params?: IApiKeyRequestQueryParams,
	): Promise<IApiKeyRequestListResponse> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search !== undefined && params.search.trim() !== '') {
				apiParams.search = params.search.trim();
			}
			if (params.status) apiParams.status = params.status;
			if (params.key_type) apiParams.key_type = params.key_type;
			if (params.start_date) apiParams.start_date = params.start_date;
			if (params.end_date) apiParams.end_date = params.end_date;
			if (params.admin_id) apiParams.admin_id = params.admin_id;
			if (params.sortBy) apiParams.sortBy = params.sortBy;
			if (params.sortOrder) apiParams.sortOrder = params.sortOrder;
		}

		const res = await apiClient<IApiKeyRequestListResponse>(API_KEY_REQUEST_ENDPOINTS.GET_ALL, {
			params: apiParams,
		});
		return decryptData(res);
	},

	// 3. GET SINGLE API KEY REQUEST BY ID
	getApiKeyRequestById: async (
		id: number | string,
	): Promise<IApiKeyRequestSingleResponse> => {
		const res = await apiClient<IApiKeyRequestSingleResponse>(API_KEY_REQUEST_ENDPOINTS.GET_ONE(id));
		return decryptData(res);
	},

	// 4. REVIEW API KEY REQUEST (APPROVE / REJECT - SUPER USER)
	reviewApiKeyRequest: async (
		id: number | string,
		payload: IReviewApiKeyRequestPayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data?: any }> => {
		const res = await apiClient(API_KEY_REQUEST_ENDPOINTS.REVIEW(id), {
			body: payload,
		});
		return decryptData(res);
	},

	// 5. GET CURRENT USER'S ACTIVE KEYS & GENERATION STATUS
	getMyApiKeys: async (): Promise<any> => {
		const res = await apiClient<any>(API_KEY_REQUEST_ENDPOINTS.MY_KEYS);
		return decryptData(res);
	},
};

export default apiKeyRequestService;
