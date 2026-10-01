import apiClient from './apiClient';
import { CONSTANT_ENDPOINTS } from '../constants/apiEndpoints';
import { PERMISSION_KEYS } from '../constants/permissionKeys';

export interface IConstantOption {
	label: string;
	value: string;
}

export interface IConstantResponse {
	success: boolean;
	statusCode: number;
	message: string;
	result?: number;
	data: IConstantOption[];
}

const constantCache: Partial<Record<string, Promise<IConstantOption[]>>> = {};

export const constantService = {
	getConstantByType: async (type: string): Promise<IConstantOption[]> => {
		const key = (type || '').toLowerCase().trim();
		if (constantCache[key]) {
			return constantCache[key]!;
		}

		const fetchTask = (async (): Promise<IConstantOption[]> => {
			try {
				const res = await apiClient<IConstantResponse>(
					CONSTANT_ENDPOINTS.GET_BY_TYPE(key),
				);
				if (res && res.data) {
					if (Array.isArray(res.data)) {
						return res.data;
					}
					if (typeof res.data === 'object' && res.data !== null) {
						const rawObj = res.data as Record<string, any>;
						if (Array.isArray(rawObj.verification_services)) {
							return rawObj.verification_services;
						}
						if (Array.isArray(rawObj[`${key}_types`])) {
							return rawObj[`${key}_types`];
						}
						if (Array.isArray(rawObj[`${key}s`])) {
							return rawObj[`${key}s`];
						}
						const firstArray = Object.values(rawObj).find((v) => Array.isArray(v));
						if (firstArray && Array.isArray(firstArray)) {
							return firstArray;
						}
					}
				}
				if (key === PERMISSION_KEYS.ROLE) {
					return [
						{ label: 'Super User', value: 'super_user' },
						{ label: 'User', value: 'user' },
						{ label: 'API User', value: 'api_user' },
					];
				}
				if (key === PERMISSION_KEYS.DOCUMENT_TYPE || key === 'document_type') {
					return [
						{ label: 'Custom', value: 'custom' },
						{ label: 'Quick KYC', value: 'quick_kyc' },
						{ label: 'Custom & Quick KYC', value: 'custom_quick_kyc' },
					];
				}
				if (key === PERMISSION_KEYS.KYC_REQUEST || key === 'kyc_request') {
					return [
						{ label: 'Pending', value: 'pending' },
						{ label: 'Verified', value: 'verified' },
						{ label: 'Failed', value: 'failed' },
						{ label: 'Rejected', value: 'rejected' },
					];
				}
				return [
					{ label: 'Active', value: 'active' },
					{ label: 'Inactive', value: 'inactive' },
				];
			} catch (error) {
				delete constantCache[key];
				if (key === PERMISSION_KEYS.ROLE) {
					return [
						{ label: 'Super User', value: 'super_user' },
						{ label: 'User', value: 'user' },
						{ label: 'API User', value: 'api_user' },
					];
				}
				if (key === PERMISSION_KEYS.DOCUMENT_TYPE || key === 'document_type') {
					return [
						{ label: 'Custom', value: 'custom' },
						{ label: 'Quick KYC', value: 'quick_kyc' },
						{ label: 'Custom & Quick KYC', value: 'custom_quick_kyc' },
					];
				}
				if (key === PERMISSION_KEYS.KYC_REQUEST || key === 'kyc_request') {
					return [
						{ label: 'Pending', value: 'pending' },
						{ label: 'Verified', value: 'verified' },
						{ label: 'Failed', value: 'failed' },
						{ label: 'Rejected', value: 'rejected' },
					];
				}
				return [
					{ label: 'Active', value: 'active' },
					{ label: 'Inactive', value: 'inactive' },
				];
			}
		})();

		constantCache[key] = fetchTask;
		return fetchTask;
	},

	// GET STATUS CONSTANTS
	getStatusConstants: async (): Promise<IConstantOption[]> => {
		return constantService.getConstantByType('status');
	},

	// GET ROLE CONSTANTS
	getRoleConstants: async (): Promise<IConstantOption[]> => {
		return constantService.getConstantByType(PERMISSION_KEYS.ROLE);
	},

	// GET DOCUMENT TYPE CONSTANTS
	getDocumentTypeConstants: async (): Promise<IConstantOption[]> => {
		return constantService.getConstantByType(PERMISSION_KEYS.DOCUMENT_TYPE);
	},

	// GET KYC REQUEST STATUS CONSTANTS
	getKycRequestConstants: async (): Promise<IConstantOption[]> => {
		return constantService.getConstantByType(PERMISSION_KEYS.KYC_REQUEST);
	},
};

export default constantService;
