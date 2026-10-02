import apiClient from '../../../../../services/apiClient';
import { ADMIN_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IUsersResponse,
	IUserFilterParams,
	IUserDetailResponse,
	IUserItem,
	IUserCreatePayload,
	IUserUpdatePayload,
	IActiveAdminItem,
	IActiveAdminQueryParams,
} from '../type/user-type';

export const userService = {
	// FETCH ALL USERS / ADMINS WITH FILTERS AND PAGINATION
	getUsers: async (params?: IUserFilterParams): Promise<IUsersResponse> => {
		return apiClient<IUsersResponse>(ADMIN_ENDPOINTS.GET_ALL, {
			params: params as Record<string, string | number | boolean | undefined>,
		});
	},

	// FETCH ACTIVE ADMINS FOR PARENT DROPDOWN (ONLY WHEN NEEDED)
	getActiveAdmins: async (
		params?: IActiveAdminQueryParams,
	): Promise<{ success: boolean; data: IActiveAdminItem[]; total_document?: number }> => {
		return apiClient<{ success: boolean; data: IActiveAdminItem[]; total_document?: number }>(
			ADMIN_ENDPOINTS.GET_ACTIVE,
			{
				params: params as Record<string, string | number | boolean | undefined>,
			},
		);
	},

	// FETCH USER DETAIL BY ID
	getUserById: async (
		id: number | string,
		params?: { detail?: boolean | string; full_detail?: boolean | string },
	): Promise<IUserDetailResponse> => {
		return apiClient<IUserDetailResponse>(ADMIN_ENDPOINTS.GET_ONE(id), {
			params: params as Record<string, string | number | boolean | undefined>,
		});
	},

	// CREATE USER / ADMIN
	createUser: async (
		data: IUserCreatePayload | Partial<IUserItem>,
	): Promise<{ success: boolean; message?: string; data: IUserItem }> => {
		return apiClient<{ success: boolean; message?: string; data: IUserItem }>(
			ADMIN_ENDPOINTS.CREATE,
			{
				body: data,
			},
		);
	},

	// UPDATE USER / ADMIN
	updateUser: async (
		id: number | string,
		data: IUserUpdatePayload | Partial<IUserItem>,
	): Promise<{ success: boolean; message?: string; data: IUserItem }> => {
		return apiClient<{ success: boolean; message?: string; data: IUserItem }>(
			ADMIN_ENDPOINTS.UPDATE(id),
			{
				body: data,
			},
		);
	},

	// UPDATE USER STATUS
	updateUserStatus: async (
		id: number | string,
		status: string,
	): Promise<{ success: boolean; message: string; data?: any }> => {
		return apiClient(ADMIN_ENDPOINTS.UPDATE_STATUS(id), {
			body: { status },
		});
	},

	// BLOCK OR UNBLOCK USER (HIERARCHY SCOPED)
	blockUnblockUser: async (
		id: number | string,
		payload: { action: 'block' | 'unblock'; reason?: string | null },
	): Promise<{ success: boolean; message: string; data?: any }> => {
		return apiClient(ADMIN_ENDPOINTS.BLOCK_STATUS(id), {
			body: payload,
		});
	},

	// DELETE USER / ADMIN
	deleteUser: async (id: number | string): Promise<{ success: boolean; message: string }> => {
		return apiClient<{ success: boolean; message: string }>(ADMIN_ENDPOINTS.DELETE(id));
	},

	// GET USER LOGIN SESSIONS HISTORY
	getUserLoginHistory: async (
		userId: number | string,
		params?: Record<string, any>,
	): Promise<{ success: boolean; message?: string; data: any[]; total_document?: number }> => {
		return apiClient(ADMIN_ENDPOINTS.GET_LOGIN_HISTORY(userId), {
			params,
		});
	},
};

export default userService;
