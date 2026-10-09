import apiClient from '../../../../../services/apiClient';
import { OPERATOR_COMMISSION_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IGetOperatorCommissionsQueryParams,
	IOperatorCommissionApiResponse,
	ISaveOperatorCommissionPayload,
	IBulkSaveOperatorCommissionPayload,
	IBulkCategoryUpdatePayload,
} from '../type/operator-commission-type';

export const operatorCommissionService = {
	// 1. GET ALL OPERATOR COMMISSIONS (PAGINATED, CATEGORY TABS & SEARCH)
	getOperatorCommissions: async (
		params: IGetOperatorCommissionsQueryParams,
	): Promise<IOperatorCommissionApiResponse> => {
		return apiClient<IOperatorCommissionApiResponse>(OPERATOR_COMMISSION_ENDPOINTS.GET_ALL, {
			params: params as unknown as Record<string, string | number | boolean | undefined>,
		});
	},

	// 2. GET MY OPERATOR COMMISSIONS (CURRENT LOGGED-IN USER)
	getMyOperatorCommissions: async (
		params: IGetOperatorCommissionsQueryParams,
	): Promise<IOperatorCommissionApiResponse> => {
		return apiClient<IOperatorCommissionApiResponse>(OPERATOR_COMMISSION_ENDPOINTS.GET_MY, {
			params: params as unknown as Record<string, string | number | boolean | undefined>,
		});
	},

	// 2. SAVE OR UPDATE SINGLE OPERATOR COMMISSION ("Save" ROW BUTTON)
	saveOperatorCommission: async (
		data: ISaveOperatorCommissionPayload,
	): Promise<{ success: boolean; message: string; data?: any }> => {
		return apiClient<{ success: boolean; message: string; data?: any }>(
			OPERATOR_COMMISSION_ENDPOINTS.SAVE,
			{
				body: data,
			},
		);
	},

	// 3. BULK SAVE OPERATOR COMMISSIONS ("Save All Changes" BOTTOM BAR BUTTON)
	bulkSaveOperatorCommissions: async (
		data: IBulkSaveOperatorCommissionPayload,
	): Promise<{ success: boolean; message: string; data?: any }> => {
		return apiClient<{ success: boolean; message: string; data?: any }>(
			OPERATOR_COMMISSION_ENDPOINTS.BULK_SAVE,
			{
				body: data,
			},
		);
	},

	// 4. BULK UPDATE CATEGORY COMMISSION (BULK UPDATE MODAL)
	bulkCategoryUpdate: async (
		data: IBulkCategoryUpdatePayload,
	): Promise<{ success: boolean; message: string; data?: any }> => {
		return apiClient<{ success: boolean; message: string; data?: any }>(
			OPERATOR_COMMISSION_ENDPOINTS.BULK_CATEGORY_UPDATE,
			{
				body: data,
			},
		);
	},
};

export default operatorCommissionService;
