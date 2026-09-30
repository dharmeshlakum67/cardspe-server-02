import apiClient from '../../../../../services/apiClient';
import { STATE_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IStateListResponse,
	IStateSingleResponse,
	IActiveStatesResponse,
	IStateQueryParams,
	ICreateStatePayload,
	IUpdateStatePayload,
	IState,
	StateStatusType,
} from '../type/state-type';

export const stateService = {
	// GET ALL STATES WITH FILTERS & PAGINATION
	getStates: async (params?: IStateQueryParams): Promise<IStateListResponse> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search !== undefined && params.search !== '') apiParams.search = params.search;
			if (params.status) apiParams.status = params.status;
			if (params.circle_id !== undefined) apiParams.circle_id = params.circle_id;
			if (params.startDate || params.start_date) apiParams.start_date = params.startDate || params.start_date;
			if (params.endDate || params.end_date) apiParams.end_date = params.endDate || params.end_date;
			if (params.sortBy) apiParams.sortBy = params.sortBy;
			if (params.sortOrder) apiParams.sortOrder = params.sortOrder;
		}

		return apiClient<IStateListResponse>(STATE_ENDPOINTS.GET_ALL, {
			params: apiParams,
		});
	},

	// GET ACTIVE STATES FOR DROPDOWNS
	getActiveStates: async (): Promise<IActiveStatesResponse> => {
		return apiClient<IActiveStatesResponse>(STATE_ENDPOINTS.GET_ACTIVE);
	},

	// GET SINGLE STATE BY ID
	getStateById: async (id: number | string): Promise<IStateSingleResponse> => {
		return apiClient<IStateSingleResponse>(STATE_ENDPOINTS.GET_ONE(id));
	},

	// CREATE STATE
	createState: async (
		payload: ICreateStatePayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data: IState }> => {
		return apiClient<{ success: boolean; statusCode?: number; message?: string; data: IState }>(
			STATE_ENDPOINTS.CREATE,
			{
				body: payload,
			},
		);
	},

	// UPDATE STATE
	updateState: async (
		id: number | string,
		payload: IUpdateStatePayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data: any }> => {
		return apiClient<{ success: boolean; statusCode?: number; message?: string; data: any }>(
			STATE_ENDPOINTS.UPDATE(id),
			{
				body: payload,
			},
		);
	},

	// UPDATE STATE STATUS
	updateStateStatus: async (
		id: number | string,
		status: StateStatusType,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data?: any }> => {
		return apiClient(STATE_ENDPOINTS.UPDATE_STATUS(id), {
			body: { status },
		});
	},

	// DELETE STATE
	deleteState: async (
		id: number | string,
	): Promise<{ success: boolean; statusCode?: number; message?: string }> => {
		return apiClient<{ success: boolean; statusCode?: number; message?: string }>(
			STATE_ENDPOINTS.DELETE(id),
		);
	},
};

export default stateService;
