import apiClient from '../../../../../services/apiClient';
import { KYC_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IKycDetailsApiResponse,
	IKycSubmitApiResponse,
	IKycRequestFilterParams,
	IKycRequestListApiResponse,
	IKycRequestDetailApiResponse,
	IUpdateKycRequestStatusPayload,
} from '../type/kyc-type';

export const kycService = {
	// GET CURRENT USER'S KYC REQUIREMENTS AND SUBMISSIONS
	getKycDetails: async (): Promise<IKycDetailsApiResponse> => {
		return apiClient<IKycDetailsApiResponse>(KYC_ENDPOINTS.GET_DATA);
	},

	// SUBMIT / SAVE SINGLE KYC DOCUMENT (HANDLES INITIAL FORM AND OTP VERIFICATION STEPS)
	submitKycDocument: async (formData: FormData): Promise<IKycSubmitApiResponse> => {
		return apiClient<IKycSubmitApiResponse>(KYC_ENDPOINTS.SUBMIT_DOCUMENT, {
			method: 'POST',
			body: formData,
		});
	},

	// GET ALL KYC REQUESTS (FOR ADMIN USER MANAGEMENT LISTING & FILTERING)
	getAllKycRequests: async (
		params?: IKycRequestFilterParams,
	): Promise<IKycRequestListApiResponse> => {
		return apiClient<IKycRequestListApiResponse>(KYC_ENDPOINTS.GET_ALL_REQUESTS, {
			params: params as Record<string, string | number | boolean | undefined>,
		});
	},

	// GET SINGLE KYC REQUEST / DOCUMENT BY ID
	getKycRequestById: async (
		id: number | string,
	): Promise<IKycRequestDetailApiResponse> => {
		return apiClient<IKycRequestDetailApiResponse>(KYC_ENDPOINTS.GET_ONE_REQUEST(id));
	},

	// UPDATE KYC REQUEST / DOCUMENT STATUS (APPROVE / REJECT)
	updateKycRequestStatus: async (
		id: number | string,
		payload: IUpdateKycRequestStatusPayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data?: any }> => {
		return apiClient(KYC_ENDPOINTS.UPDATE_REQUEST_STATUS(id), {
			body: payload,
		});
	},
};

export default kycService;
