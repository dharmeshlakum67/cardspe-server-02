import apiClient from '../../../../services/apiClient';
import { ROLE_ENDPOINTS } from '../../../../constants/apiEndpoints';
import {
	IRolesResponse,
	IRoleFilterParams,
	IRoleItem,
	IRoleDetailResponse,
} from '../type/role-type';

export const roleService = {
	// FETCH ALL ROLES WITH FILTERS AND PAGINATION
	getRoles: async (params?: IRoleFilterParams): Promise<IRolesResponse> => {
		return apiClient<IRolesResponse>(ROLE_ENDPOINTS.GET_ALL, {
			params: params as Record<string, string | number | boolean | undefined>,
		});
	},

	// FETCH ROLE DETAIL (WITH PERMISSIONS) BY ID
	getRoleById: async (id: number | string): Promise<IRoleDetailResponse> => {
		return apiClient<IRoleDetailResponse>(ROLE_ENDPOINTS.GET_ONE(id));
	},

	// FETCH ROLE DETAIL VIA GET-ONE
	getRoleOne: async (id: number | string): Promise<IRoleDetailResponse> => {
		return apiClient<IRoleDetailResponse>(ROLE_ENDPOINTS.GET_ONE(id));
	},

	// FETCH ROLE ACCESS VIA ROLE-ACCESS GET-ONE
	getRoleAccessOne: async (id: number | string): Promise<any> => {
		return apiClient<any>(`/api/role-access/get-one/${id}`);
	},

	// CREATE ROLE
	createRole: async (data: Partial<IRoleItem>): Promise<{ success: boolean; data: IRoleItem }> => {
		return apiClient<{ success: boolean; data: IRoleItem }>(ROLE_ENDPOINTS.CREATE, {
			body: data,
		});
	},

	// UPDATE ROLE
	updateRole: async (
		id: number | string,
		data: Partial<IRoleItem>,
	): Promise<{ success: boolean; data: IRoleItem }> => {
		return apiClient<{ success: boolean; data: IRoleItem }>(ROLE_ENDPOINTS.UPDATE(id), {
			body: data,
		});
	},

	// UPDATE ROLE STATUS
	updateRoleStatus: async (
		id: number | string,
		status: 'ACTIVE' | 'INACTIVE' | string,
	): Promise<{ success: boolean; message: string; data?: any }> => {
		return apiClient(ROLE_ENDPOINTS.UPDATE_STATUS(id), {
			body: { status },
		});
	},

	// DELETE ROLE
	deleteRole: async (id: number | string): Promise<{ success: boolean; message: string }> => {
		return apiClient<{ success: boolean; message: string }>(ROLE_ENDPOINTS.DELETE(id));
	},
};

export default roleService;
