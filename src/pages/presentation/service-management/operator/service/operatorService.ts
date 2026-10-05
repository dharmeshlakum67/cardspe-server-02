import apiClient from '../../../../../services/apiClient';
import {
	OPERATOR_ENDPOINTS,
	SERVICE_CATEGORY_ENDPOINTS,
	PAYMENT_MODE_ENDPOINTS,
} from '../../../../../constants/apiEndpoints';
import {
	IOperatorFilterParams,
	IOperatorListResponse,
	IOperatorSingleResponse,
	OperatorStatusType,
	IActiveServiceCategoryOption,
	IActivePaymentModeOption,
} from '../type/operator-type';

let activeServiceCategoriesCache: Promise<{ status: boolean; data: IActiveServiceCategoryOption[] }> | null = null;
let activePaymentModesCache: Promise<{ status: boolean; data: IActivePaymentModeOption[] }> | null = null;

export const clearOperatorDropdownCache = () => {
	activeServiceCategoriesCache = null;
	activePaymentModesCache = null;
};

export const operatorService = {
	// 1. GET ALL OPERATORS WITH FILTERS & PAGINATION
	getOperators: async (params?: IOperatorFilterParams): Promise<IOperatorListResponse> => {
		const queryParams: Record<string, any> = {};

		if (params) {
			if (params.page !== undefined) queryParams.page = params.page;
			if (params.limit !== undefined) queryParams.limit = params.limit;
			if (params.search?.trim()) queryParams.search = params.search.trim();
			if (params.service_category_id) queryParams.service_category_id = params.service_category_id;
			if (params.status) queryParams.status = params.status;
			if (params.is_bbps_enabled !== undefined && params.is_bbps_enabled !== '') {
				queryParams.is_bbps_enabled = params.is_bbps_enabled;
			}
			if (params.startDate || params.start_date) {
				queryParams.startDate = params.startDate || params.start_date;
				queryParams.start_date = params.startDate || params.start_date;
			}
			if (params.endDate || params.end_date) {
				queryParams.endDate = params.endDate || params.end_date;
				queryParams.end_date = params.endDate || params.end_date;
			}
			if (params.sortBy) queryParams.sortBy = params.sortBy;
			if (params.sortDirection) queryParams.sortDirection = params.sortDirection;
		}

		return apiClient<IOperatorListResponse>(OPERATOR_ENDPOINTS.GET_ALL, {
			params: queryParams,
		});
	},

	// 2. GET ACTIVE SERVICE CATEGORIES FOR DROPDOWN (DEDUPLICATED & CACHED)
	getActiveServiceCategories: async (force = false): Promise<{ status: boolean; data: IActiveServiceCategoryOption[] }> => {
		if (!force && activeServiceCategoriesCache) {
			return activeServiceCategoriesCache;
		}

		activeServiceCategoriesCache = apiClient<{ status: boolean; data: IActiveServiceCategoryOption[] }>(
			SERVICE_CATEGORY_ENDPOINTS.GET_ACTIVE,
		).catch((err) => {
			activeServiceCategoriesCache = null;
			throw err;
		});

		return activeServiceCategoriesCache;
	},

	// 3. GET ACTIVE PAYMENT MODES FOR MULTI-SELECT (DEDUPLICATED & CACHED)
	getActivePaymentModes: async (force = false): Promise<{ status: boolean; data: IActivePaymentModeOption[] }> => {
		if (!force && activePaymentModesCache) {
			return activePaymentModesCache;
		}

		activePaymentModesCache = apiClient<{ status: boolean; data: IActivePaymentModeOption[] }>(
			PAYMENT_MODE_ENDPOINTS.GET_ACTIVE,
		).catch((err) => {
			activePaymentModesCache = null;
			throw err;
		});

		return activePaymentModesCache;
	},

	// 4. GET SINGLE OPERATOR BY ID
	getOperatorById: async (id: number | string): Promise<IOperatorSingleResponse> => {
		return apiClient<IOperatorSingleResponse>(OPERATOR_ENDPOINTS.GET_ONE(id));
	},

	// 5. CREATE OPERATOR
	createOperator: async (
		payload: FormData | Record<string, any>,
	): Promise<{ status?: boolean; success?: boolean; message?: string; data?: any }> => {
		return apiClient<{ status?: boolean; success?: boolean; message?: string; data?: any }>(
			OPERATOR_ENDPOINTS.CREATE,
			{
				body: payload,
			},
		);
	},

	// 6. UPDATE OPERATOR
	updateOperator: async (
		id: number | string,
		payload: FormData | Record<string, any>,
	): Promise<{ status?: boolean; success?: boolean; message?: string; data?: any }> => {
		return apiClient<{ status?: boolean; success?: boolean; message?: string; data?: any }>(
			OPERATOR_ENDPOINTS.UPDATE(id),
			{
				body: payload,
			},
		);
	},

	// 7. UPDATE OPERATOR STATUS
	updateOperatorStatus: async (
		id: number | string,
		status: OperatorStatusType,
	): Promise<{ status?: boolean; success?: boolean; message?: string; data?: any }> => {
		return apiClient(OPERATOR_ENDPOINTS.UPDATE_STATUS(id), {
			body: { status },
		});
	},

	// 8. DELETE OPERATOR
	deleteOperator: async (
		id: number | string,
	): Promise<{ status?: boolean; success?: boolean; message?: string; data?: any }> => {
		return apiClient(OPERATOR_ENDPOINTS.DELETE(id));
	},
};

export default operatorService;

