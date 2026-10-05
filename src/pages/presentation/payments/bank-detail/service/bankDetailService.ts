import apiClient from '../../../../../services/apiClient';
import { BANK_DETAIL_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IBankDetail,
	IBankDetailPayload,
	IBankDetailFilterParams,
	BankDetailStatus,
	IActiveBankDetailOption,
} from '../type/bank-detail-type';

export interface IBankDetailListResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IBankDetail[] | { rows?: IBankDetail[]; count?: number; totalItems?: number };
	total?: number;
	totalItems?: number;
	totalDocuments?: number;
	page?: number;
	currentPage?: number;
	totalPages?: number;
}

export interface IBankDetailSingleResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IBankDetail;
}

export interface IActiveBankDetailsResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IActiveBankDetailOption[];
}

export const bankDetailService = {
	// GET ALL BANK DETAILS (PAGINATED WITH SEARCH & FILTERS)
	getBankDetails: async (
		params?: IBankDetailFilterParams,
	): Promise<IBankDetailListResponse> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search !== undefined && params.search.trim() !== '')
				apiParams.search = params.search.trim();
			if (params.status) apiParams.status = params.status;
			if (params.account_type) apiParams.account_type = params.account_type;
			if (params.startDate) apiParams.startDate = params.startDate;
			if (params.endDate) apiParams.endDate = params.endDate;
		}

		return apiClient<IBankDetailListResponse>(BANK_DETAIL_ENDPOINTS.GET_ALL, {
			params: apiParams,
		});
	},

	// GET ACTIVE BANK DETAILS (FOR DROPDOWNS)
	getActiveBankDetails: async (): Promise<IActiveBankDetailsResponse> => {
		return apiClient<IActiveBankDetailsResponse>(BANK_DETAIL_ENDPOINTS.GET_ACTIVE);
	},

	// GET SINGLE BANK DETAIL BY ID
	getBankDetailById: async (
		id: number | string,
	): Promise<IBankDetailSingleResponse> => {
		return apiClient<IBankDetailSingleResponse>(BANK_DETAIL_ENDPOINTS.GET_ONE(id));
	},

	// CREATE BANK DETAIL
	createBankDetail: async (
		payload: IBankDetailPayload,
	): Promise<IBankDetailSingleResponse> => {
		return apiClient<IBankDetailSingleResponse>(BANK_DETAIL_ENDPOINTS.CREATE, {
			body: payload,
		});
	},

	// UPDATE BANK DETAIL
	updateBankDetail: async (
		id: number | string,
		payload: Partial<IBankDetailPayload>,
	): Promise<IBankDetailSingleResponse> => {
		return apiClient<IBankDetailSingleResponse>(BANK_DETAIL_ENDPOINTS.UPDATE(id), {
			body: payload,
		});
	},

	// UPDATE BANK DETAIL STATUS
	updateBankDetailStatus: async (
		id: number | string,
		status: BankDetailStatus,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data?: any }> => {
		return apiClient(BANK_DETAIL_ENDPOINTS.UPDATE_STATUS(id), {
			body: { status },
		});
	},

	// DELETE BANK DETAIL
	deleteBankDetail: async (
		id: number | string,
	): Promise<{ success: boolean; statusCode?: number; message?: string }> => {
		return apiClient(BANK_DETAIL_ENDPOINTS.DELETE(id));
	},
};

export default bankDetailService;
