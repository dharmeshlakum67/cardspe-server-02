import apiClient from '../../../../../services/apiClient';
import { PAYMENT_GATEWAY_ENDPOINTS, CONSTANT_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IPaymentGatewayQueryParams,
	IPaymentGatewayListResponse,
	IPaymentGatewayDetailResponse,
	TPaymentGatewayStatus,
	IPaymentGatewayChargesConstants,
} from '../type/payment-gateway-type';

let chargesConstantsCache: Promise<IPaymentGatewayChargesConstants> | null = null;

export const paymentGatewayService = {
	// GET PAYMENT GATEWAY CHARGES CONSTANTS (CHARGE NAMES & CHARGE TYPES) - CACHED
	getChargesConstants: async (forceRefresh = false): Promise<IPaymentGatewayChargesConstants> => {
		if (chargesConstantsCache && !forceRefresh) {
			return chargesConstantsCache;
		}

		chargesConstantsCache = (async () => {
			try {
				const res: any = await apiClient<any>(CONSTANT_ENDPOINTS.GET_BY_TYPE('payment_gateway'));
				const data = res?.data || res;
				if (data && (Array.isArray(data.charge_names) || Array.isArray(data.charge_types))) {
					return {
						charge_names: Array.isArray(data.charge_names) ? data.charge_names : [],
						charge_types: Array.isArray(data.charge_types) ? data.charge_types : [],
					};
				}
				return {
					charge_names: [
						{ label: 'UPI', value: 'UPI' },
						{ label: 'Credit Card', value: 'Credit Card' },
						{ label: 'Debit Card', value: 'Debit Card' },
						{ label: 'Net Banking', value: 'Net Banking' },
						{ label: 'Wallet', value: 'Wallet' },
					],
					charge_types: [
						{ label: 'Percentage (%)', value: 'PERCENTAGE' },
						{ label: 'Flat (₹)', value: 'FLAT' },
					],
				};
			} catch (error) {
				chargesConstantsCache = null;
				return {
					charge_names: [
						{ label: 'UPI', value: 'UPI' },
						{ label: 'Credit Card', value: 'Credit Card' },
						{ label: 'Debit Card', value: 'Debit Card' },
						{ label: 'Net Banking', value: 'Net Banking' },
						{ label: 'Wallet', value: 'Wallet' },
					],
					charge_types: [
						{ label: 'Percentage (%)', value: 'PERCENTAGE' },
						{ label: 'Flat (₹)', value: 'FLAT' },
					],
				};
			}
		})();

		return chargesConstantsCache;
	},

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

