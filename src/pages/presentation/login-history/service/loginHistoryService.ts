import apiClient from '../../../../services/apiClient';
import { LOGIN_HISTORY_ENDPOINTS } from '../../../../constants/apiEndpoints';
import {
	ILoginHistoryApiResponse,
	ILoginHistoryFilterParams,
} from '../type/login-history-type';

export const loginHistoryService = {
	// FETCH ALL LOGIN SESSIONS HISTORY WITH FILTERS AND PAGINATION
	getLoginHistory: async (
		params?: ILoginHistoryFilterParams,
	): Promise<ILoginHistoryApiResponse> => {
		return apiClient<ILoginHistoryApiResponse>(LOGIN_HISTORY_ENDPOINTS.GET_ALL, {
			params: params as Record<string, string | number | boolean | undefined>,
		});
	},

	// FETCH LOGIN HISTORY FOR A SPECIFIC USER/ADMIN
	getLoginHistoryByUser: async (
		userId: string | number,
		params?: ILoginHistoryFilterParams,
	): Promise<ILoginHistoryApiResponse> => {
		return apiClient<ILoginHistoryApiResponse>(LOGIN_HISTORY_ENDPOINTS.GET_BY_USER(userId), {
			params: params as Record<string, string | number | boolean | undefined>,
		});
	},
};

export default loginHistoryService;
