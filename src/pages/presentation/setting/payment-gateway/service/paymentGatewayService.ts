import apiClient from '../../../../../services/apiClient';
import { PAYMENT_GATEWAY_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IPaymentGatewayQueryParams,
	IPaymentGatewayListResponse,
	IPaymentGatewayDetailResponse,
	TPaymentGatewayStatus,
} from '../type/payment-gateway-type';

export const paymentGatewayService = {
	// GET ALL PAYMENT GATEWAYS WITH PAGINATION AND FILTERS
	getPaymentGateways: async (
		params?: IPaymentGatewayQueryParams,
	): Promise<IPaymentGatewayListResponse> => {
		return apiClient<IPaymentGatewayListResponse>(PAYMENT_GATEWAY_ENDPOINTS.GET_ALL, {
			params,
		});
	},

	// GET ACTIVE PAYMENT GATEWAYS
	getActivePaymentGateways: async (): Promise<IPaymentGatewayListResponse> => {
		return apiClient<IPaymentGatewayListResponse>(PAYMENT_GATEWAY_ENDPOINTS.GET_ACTIVE);
	},

	// CREATE PAYMENT GATEWAY (SUPPORTS FORMDATA WITH ICON FILE OR JSON)
	createPaymentGateway: async (
		payload: FormData | Record<string, any>,
	): Promise<IPaymentGatewayDetailResponse> => {
		return apiClient<IPaymentGatewayDetailResponse>(PAYMENT_GATEWAY_ENDPOINTS.CREATE, {
			body: payload,
		});
	},

	// UPDATE PAYMENT GATEWAY (SUPPORTS FORMDATA WITH ICON FILE OR JSON)
	updatePaymentGateway: async (
		id: number | string,
		payload: FormData | Record<string, any>,
	): Promise<IPaymentGatewayDetailResponse> => {
		return apiClient<IPaymentGatewayDetailResponse>(PAYMENT_GATEWAY_ENDPOINTS.UPDATE(id), {
			body: payload,
		});
	},

	// UPDATE PAYMENT GATEWAY STATUS (ACTIVE / INACTIVE) VIA GENERAL UPDATE API
	updatePaymentGatewayStatus: async (
		id: number | string,
		status: TPaymentGatewayStatus,
	): Promise<IPaymentGatewayDetailResponse> => {
		return apiClient<IPaymentGatewayDetailResponse>(
			PAYMENT_GATEWAY_ENDPOINTS.UPDATE(id),
			{
				body: { status },
			},
		);
	},
};

export default paymentGatewayService;
