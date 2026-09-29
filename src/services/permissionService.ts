import { apiClient } from './apiClient';
import { PERMISSION_ENDPOINTS } from '../constants/apiEndpoints';
import {
	IPermissionItem,
	IPermissionsResponse,
} from '../type/permission-type';

export const permissionService = {
	// GET ALL SYSTEM PERMISSIONS (WITH NESTED CHILDREN & ACCESS OBJECTS)
	async getAllPermissions(): Promise<IPermissionItem[]> {
		try {
			const res = await apiClient<IPermissionsResponse>(PERMISSION_ENDPOINTS.GET_ALL, {
				method: PERMISSION_ENDPOINTS.GET_ALL.method,
				requiresAuth: true,
			});
			if (Array.isArray(res?.data)) {
				return res.data;
			}
			if (Array.isArray(res)) {
				return res;
			}
			return [];
		} catch (error) {
			console.error('Failed to fetch permissions:', error);
			return [];
		}
	},
};

export default permissionService;
