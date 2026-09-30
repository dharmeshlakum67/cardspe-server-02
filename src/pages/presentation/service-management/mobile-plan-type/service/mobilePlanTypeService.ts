import apiClient from '../../../../../services/apiClient';
import { MOBILE_PLAN_TYPE_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IMobilePlanTypeListResponse,
	MobilePlanTypeQueryParams,
	CreateMobilePlanTypePayload,
	UpdateMobilePlanTypePayload,
	IMobilePlanType,
	MobilePlanTypeStatusType,
} from '../type/mobile-plan-type';

export const mobilePlanTypeService = {
	// GET ALL MOBILE PLAN TYPES (PAGINATED WITH SEARCH & FILTERS)
	getMobilePlanTypes: async (
		params?: MobilePlanTypeQueryParams & { startDate?: string; endDate?: string },
	): Promise<any> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search !== undefined && params.search !== '') apiParams.search = params.search;
			if (params.status) apiParams.status = params.status;
			if (params.plan_type_id !== undefined) apiParams.plan_type_id = params.plan_type_id;
			if (params.startDate || params.start_date)
				apiParams.start_date = params.startDate || params.start_date;
			if (params.endDate || params.end_date)
				apiParams.end_date = params.endDate || params.end_date;
		}

		return apiClient(MOBILE_PLAN_TYPE_ENDPOINTS.GET_ALL, {
			params: apiParams,
		});
	},

	// GET ACTIVE MOBILE PLAN TYPES FOR DROPDOWNS
	getActiveMobilePlanTypes: async (): Promise<{
		statusCode: number;
		message: string;
		data: IMobilePlanType[];
	}> => {
		return apiClient<{
			statusCode: number;
			message: string;
			data: IMobilePlanType[];
		}>(MOBILE_PLAN_TYPE_ENDPOINTS.GET_ACTIVE);
	},

	// GET ALL ACTIVE MOBILE PLAN TYPES (PAGINATED)
	getAllActiveMobilePlanTypes: async (params?: {
		page?: number;
		limit?: number;
		search?: string;
	}): Promise<IMobilePlanTypeListResponse> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search) apiParams.search = params.search;
		}
		return apiClient<IMobilePlanTypeListResponse>(MOBILE_PLAN_TYPE_ENDPOINTS.GET_ALL_ACTIVE, {
			params: apiParams,
		});
	},

	// GET SINGLE MOBILE PLAN TYPE BY ID
	getMobilePlanTypeById: async (
		id: number | string,
	): Promise<{ statusCode: number; message: string; data: IMobilePlanType }> => {
		return apiClient<{ statusCode: number; message: string; data: IMobilePlanType }>(
			MOBILE_PLAN_TYPE_ENDPOINTS.GET_ONE(id),
		);
	},

	// CREATE MOBILE PLAN TYPE
	createMobilePlanType: async (
		payload: CreateMobilePlanTypePayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data: IMobilePlanType }> => {
		return apiClient<{
			success: boolean;
			statusCode?: number;
			message?: string;
			data: IMobilePlanType;
		}>(MOBILE_PLAN_TYPE_ENDPOINTS.CREATE, {
			body: payload,
		});
	},

	// UPDATE MOBILE PLAN TYPE
	updateMobilePlanType: async (
		id: number | string,
		payload: UpdateMobilePlanTypePayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data: any }> => {
		return apiClient<{ success: boolean; statusCode?: number; message?: string; data: any }>(
			MOBILE_PLAN_TYPE_ENDPOINTS.UPDATE(id),
			{
				body: payload,
			},
		);
	},

	// UPDATE MOBILE PLAN TYPE STATUS
	updateMobilePlanTypeStatus: async (
		id: number | string,
		status: MobilePlanTypeStatusType,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data?: any }> => {
		return apiClient(MOBILE_PLAN_TYPE_ENDPOINTS.UPDATE_STATUS(id), {
			body: { status },
		});
	},

	// DELETE MOBILE PLAN TYPE
	deleteMobilePlanType: async (
		id: number | string,
	): Promise<{ success: boolean; statusCode?: number; message?: string }> => {
		return apiClient<{ success: boolean; statusCode?: number; message?: string }>(
			MOBILE_PLAN_TYPE_ENDPOINTS.DELETE(id),
		);
	},
};

export default mobilePlanTypeService;
