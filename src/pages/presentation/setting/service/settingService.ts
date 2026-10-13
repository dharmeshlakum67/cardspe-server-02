import apiClient from '../../../../services/apiClient';
import { SETTING_ENDPOINTS } from '../../../../constants/apiEndpoints';
import {
	IServiceConfigApiResponse,
	IUpdateServiceConfigPayload,
	IUpdateServiceConfigApiResponse,
	ICompanySettingApiResponse,
	IUpdateCompanySettingPayload,
} from '../type/setting-type';

export const settingService = {
	// GET COMPANY GENERAL SETTINGS
	getCompanySetting: async (): Promise<ICompanySettingApiResponse> => {
		return apiClient<ICompanySettingApiResponse>(SETTING_ENDPOINTS.GET_COMPANY_SETTING);
	},

	// UPDATE COMPANY GENERAL SETTINGS
	updateCompanySetting: async (
		payload: IUpdateCompanySettingPayload,
	): Promise<ICompanySettingApiResponse> => {
		return apiClient<ICompanySettingApiResponse>(
			SETTING_ENDPOINTS.UPDATE_COMPANY_SETTING,
			{
				body: payload,
			},
		);
	},

	// GET SERVICE CONFIGURATION LIST (E.G. QUICK KYC CHARGES & STATUS)
	getServiceConfig: async (): Promise<IServiceConfigApiResponse> => {
		return apiClient<IServiceConfigApiResponse>(SETTING_ENDPOINTS.GET_SERVICE_CONFIG);
	},

	// UPDATE SERVICE CONFIGURATION (E.G. CHARGES & STATUS FOR A SERVICE SLUG)
	updateServiceConfig: async (
		payload: IUpdateServiceConfigPayload,
	): Promise<IUpdateServiceConfigApiResponse> => {
		return apiClient<IUpdateServiceConfigApiResponse>(
			SETTING_ENDPOINTS.UPDATE_SERVICE_CONFIG,
			{
				method: 'POST',
				body: payload,
			},
		);
	},
};

export default settingService;
