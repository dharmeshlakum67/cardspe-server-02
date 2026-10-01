import apiClient from '../../../../../services/apiClient';
import { KYC_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import { IKycDetailsApiResponse, IKycSubmitApiResponse } from '../type/kyc-type';

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
};

export default kycService;
