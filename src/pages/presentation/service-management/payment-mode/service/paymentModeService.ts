import apiClient from '../../../../../services/apiClient';
import { PAYMENT_MODE_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IPaymentModeListResponse,
	IPaymentModeSingleResponse,
	IActivePaymentModesResponse,
	PaymentModeQueryParams,
	CreatePaymentModePayload,
	UpdatePaymentModePayload,
	IPaymentMode,
	PaymentModeStatusType,
} from '../type/payment-mode-type';

export const paymentModeService = {
	// GET ALL PAYMENT MODES (PAGINATED WITH SEARCH & FILTERS)
	getPaymentModes: async (
		params?: PaymentModeQueryParams,
	): Promise<IPaymentModeListResponse> => {
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

		return apiClient<IPaymentModeListResponse>(PAYMENT_MODE_ENDPOINTS.GET_ALL, {
			params: apiParams,
		});
	},

	// GET ACTIVE PAYMENT MODES FOR DROPDOWNS
	getActivePaymentModes: async (): Promise<IActivePaymentModesResponse> => {
		return apiClient<IActivePaymentModesResponse>(PAYMENT_MODE_ENDPOINTS.GET_ACTIVE);
	},

	// GET ALL ACTIVE PAYMENT MODES (PAGINATED WITH SEARCH)
	getAllActivePaymentModes: async (params?: {
		page?: number;
		limit?: number;
		search?: string;
	}): Promise<IPaymentModeListResponse> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search) apiParams.search = params.search;
		}
		return apiClient<IPaymentModeListResponse>(PAYMENT_MODE_ENDPOINTS.GET_ALL_ACTIVE, {
			params: apiParams,
		});
	},

	// GET SINGLE PAYMENT MODE BY ID
	getPaymentModeById: async (
		id: number | string,
	): Promise<IPaymentModeSingleResponse> => {
		return apiClient<IPaymentModeSingleResponse>(PAYMENT_MODE_ENDPOINTS.GET_ONE(id));
	},

	// CREATE PAYMENT MODE
	createPaymentMode: async (
		payload: CreatePaymentModePayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data: IPaymentMode }> => {
		return apiClient<{
			success: boolean;
			statusCode?: number;
			message?: string;
			data: IPaymentMode;
		}>(PAYMENT_MODE_ENDPOINTS.CREATE, {
			body: payload,
		});
	},

	// UPDATE PAYMENT MODE
	updatePaymentMode: async (
		id: number | string,
		payload: UpdatePaymentModePayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data: any }> => {
		return apiClient<{ success: boolean; statusCode?: number; message?: string; data: any }>(
			PAYMENT_MODE_ENDPOINTS.UPDATE(id),
			{
				body: payload,
			},
		);
	},

	// UPDATE PAYMENT MODE STATUS
	updatePaymentModeStatus: async (
		id: number | string,
		status: PaymentModeStatusType,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data?: any }> => {
		return apiClient(PAYMENT_MODE_ENDPOINTS.UPDATE_STATUS(id), {
			body: { status },
		});
	},

	// DELETE PAYMENT MODE
	deletePaymentMode: async (
		id: number | string,
	): Promise<{ success: boolean; statusCode?: number; message?: string }> => {
		return apiClient<{ success: boolean; statusCode?: number; message?: string }>(
			PAYMENT_MODE_ENDPOINTS.DELETE(id),
		);
	},
};

export default paymentModeService;
