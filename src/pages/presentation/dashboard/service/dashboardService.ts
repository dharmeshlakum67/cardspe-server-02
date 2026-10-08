import apiClient from '../../../../services/apiClient';
import { DASHBOARD_ENDPOINTS } from '../../../../constants/apiEndpoints';
import { decryptData } from '../../../../helpers/cryptoUtils';
import {
	DashboardQueryParams,
	DashboardSummaryResponse,
} from '../type/dashboard.type';

export interface IDashboardApiResponse {
	statusCode: number;
	success?: boolean;
	message: string;
	data: DashboardSummaryResponse;
}

export const dashboardService = {
	/**
	 * Fetch overall dashboard summary (User statistics, Add Money summary, and Recharge services breakdown)
	 * Supports optional date range (start_date, end_date) in YYYY-MM-DD format
	 */
	getDashboardSummary: async (
		params?: DashboardQueryParams,
	): Promise<IDashboardApiResponse> => {
		const apiParams: Record<string, any> = {};

		if (params?.start_date && params.start_date.trim()) {
			apiParams.start_date = params.start_date.trim();
		}
		if (params?.end_date && params.end_date.trim()) {
			apiParams.end_date = params.end_date.trim();
		}

		const res = await apiClient<IDashboardApiResponse>(
			DASHBOARD_ENDPOINTS.GET_SUMMARY,
			{
				params: apiParams,
			},
		);

		return decryptData(res);
	},
};

export default dashboardService;
