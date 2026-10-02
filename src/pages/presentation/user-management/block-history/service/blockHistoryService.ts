import apiClient from '../../../../../services/apiClient';
import { BLOCK_HISTORY_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IBlockHistoryApiResponse,
	IBlockHistoryFilterParams,
} from '../type/block-history-type';

export const blockHistoryService = {
	// FETCH ALL BLOCK / UNBLOCK AUDIT LOGS WITH FILTERS AND PAGINATION
	getBlockHistory: async (
		params?: IBlockHistoryFilterParams,
	): Promise<IBlockHistoryApiResponse> => {
		return apiClient<IBlockHistoryApiResponse>(BLOCK_HISTORY_ENDPOINTS.GET_ALL, {
			params: params as Record<string, string | number | boolean | undefined>,
		});
	},

	// FETCH BLOCK HISTORY FOR A SPECIFIC USER
	getBlockHistoryByUser: async (
		userId: string | number,
		params?: IBlockHistoryFilterParams,
	): Promise<IBlockHistoryApiResponse> => {
		return apiClient<IBlockHistoryApiResponse>(BLOCK_HISTORY_ENDPOINTS.GET_BY_USER(userId), {
			params: params as Record<string, string | number | boolean | undefined>,
		});
	},
};

export default blockHistoryService;
