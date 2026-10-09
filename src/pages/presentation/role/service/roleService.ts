import apiClient from '../../../../services/apiClient';
import { ROLE_ACCESS_ENDPOINTS, ROLE_ENDPOINTS } from '../../../../constants/apiEndpoints';
import {
	IRolesResponse,
	IRoleFilterParams,
	IRoleItem,
	IRoleDetailResponse,
} from '../type/role-type';

let activeRolesCache: Promise<{ success: boolean; data: IRoleItem[] }> | null = null;

// CLEAR ACTIVE ROLES CACHE ON MUTATIONS
export const clearActiveRolesCache = () => {
	activeRolesCache = null;
};

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
		return apiClient<any>(ROLE_ACCESS_ENDPOINTS.GET_ONE(id));
	},

	// CREATE ROLE
	createRole: async (data: Partial<IRoleItem>): Promise<{ success: boolean; message?: string; data: IRoleItem }> => {
		clearActiveRolesCache();
		return apiClient<{ success: boolean; message?: string; data: IRoleItem }>(ROLE_ENDPOINTS.CREATE, {
			body: data,
		});
	},

	// UPDATE ROLE
	updateRole: async (
		id: number | string,
		data: Partial<IRoleItem>,
	): Promise<{ success: boolean; message?: string; data: IRoleItem }> => {
		clearActiveRolesCache();
		return apiClient<{ success: boolean; message?: string; data: IRoleItem }>(ROLE_ENDPOINTS.UPDATE(id), {
			body: data,
		});
	},

	// UPDATE ROLE STATUS
	updateRoleStatus: async (
		id: number | string,
		role_status: 'active' | 'inactive' | string,
	): Promise<{ success: boolean; message: string; data?: any }> => {
		clearActiveRolesCache();
		return apiClient(ROLE_ENDPOINTS.UPDATE_STATUS(id), {
			body: { role_status },
		});
	},

	// FETCH ACTIVE ROLES FOR DROPDOWNS / ASSIGNMENTS
	getActiveRoles: async (
		paramsOrForce?:
			| boolean
			| { page?: number; limit?: number; search?: string; hide_super_admin?: boolean | string | number },
		forceParam = false,
	): Promise<{ success: boolean; data: IRoleItem[]; total_document?: number }> => {
		const isForce = typeof paramsOrForce === 'boolean' ? paramsOrForce : forceParam;
		const params =
			typeof paramsOrForce === 'object' && paramsOrForce !== null ? paramsOrForce : undefined;

		if (!params && !isForce && activeRolesCache) {
			return activeRolesCache as any;
		}

		const promise = apiClient<{ success: boolean; data: IRoleItem[]; total_document?: number }>(
			ROLE_ENDPOINTS.GET_ACTIVE,
			{
				params: params as Record<string, string | number | boolean | undefined>,
			},
		);

		if (!params) {
			activeRolesCache = promise as any;
			promise.catch(() => {
				activeRolesCache = null;
			});
		}

		return promise;
	},

	// DELETE ROLE
	deleteRole: async (id: number | string): Promise<{ success: boolean; message: string }> => {
		clearActiveRolesCache();
		return apiClient<{ success: boolean; message: string }>(ROLE_ENDPOINTS.DELETE(id));
	},
};

export default roleService;
