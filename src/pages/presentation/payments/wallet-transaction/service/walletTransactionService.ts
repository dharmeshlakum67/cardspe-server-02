import apiClient from '../../../../../services/apiClient';
import { WALLET_TRANSACTION_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IWalletTransaction,
	IWalletTransactionQueryParams,
	IWalletTransactionResponse,
	IWalletTransactionConstants,
	TAddMoneyType,
	IPaymentMethodsResponse,
} from '../type/wallet-transaction.type';

export const walletTransactionService = {
	// 1. GET WALLET TRANSACTION CONSTANTS
	getWalletTransactionConstants: async (): Promise<{
		success: boolean;
		statusCode: number;
		message: string;
		data: IWalletTransactionConstants;
	}> => {
		return apiClient<{
			success: boolean;
			statusCode: number;
			message: string;
			data: IWalletTransactionConstants;
		}>(WALLET_TRANSACTION_ENDPOINTS.GET_CONSTANTS);
	},

	// 2. GET ALL WALLET TRANSACTIONS (SCOPED)
	getAllWalletTransactions: async (
		params?: IWalletTransactionQueryParams,
	): Promise<IWalletTransactionResponse> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search !== undefined && params.search.trim() !== '') {
				apiParams.search = params.search.trim();
			}
			if (params.status) apiParams.status = params.status;
			if (params.transaction_type) apiParams.transaction_type = params.transaction_type;
			if (params.transaction_mode) apiParams.transaction_mode = params.transaction_mode;
			if (params.transaction_category) apiParams.transaction_category = params.transaction_category;
			if (params.admin_id) apiParams.admin_id = params.admin_id;
			if (params.start_date) apiParams.start_date = params.start_date;
			if (params.end_date) apiParams.end_date = params.end_date;
			if (params.sort) apiParams.sort = params.sort;
		}

		return apiClient<IWalletTransactionResponse>(WALLET_TRANSACTION_ENDPOINTS.GET_ALL, {
			params: apiParams,
		});
	},

	// 2.1 GET MY (SELF) WALLET TRANSACTIONS
	getMyWalletTransactions: async (
		params?: IWalletTransactionQueryParams,
	): Promise<IWalletTransactionResponse> => {
		const apiParams: Record<string, any> = {};
		if (params) {
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
			if (params.search !== undefined && params.search.trim() !== '') {
				apiParams.search = params.search.trim();
			}
			if (params.status) apiParams.status = params.status;
			if (params.transaction_type) apiParams.transaction_type = params.transaction_type;
			if (params.transaction_mode) apiParams.transaction_mode = params.transaction_mode;
			if (params.transaction_category) apiParams.transaction_category = params.transaction_category;
			if (params.admin_id) apiParams.admin_id = params.admin_id;
			if (params.start_date) apiParams.start_date = params.start_date;
			if (params.end_date) apiParams.end_date = params.end_date;
			if (params.sort) apiParams.sort = params.sort;
		}

		return apiClient<IWalletTransactionResponse>(WALLET_TRANSACTION_ENDPOINTS.GET_MY_TRANSACTIONS, {
			params: apiParams,
		});
	},

	// 3. GET SINGLE WALLET TRANSACTION BY ID
	getWalletTransactionById: async (
		id: string | number,
	): Promise<{
		success: boolean;
		statusCode: number;
		message: string;
		data: IWalletTransaction;
	}> => {
		return apiClient<{
			success: boolean;
			statusCode: number;
			message: string;
			data: IWalletTransaction;
		}>(WALLET_TRANSACTION_ENDPOINTS.GET_ONE(id));
	},

	// 4. ADD MONEY / TOP-UP REQUEST (MULTIPART FORM-DATA)
	addMoneyRequest: async (payload: {
		amount: number;
		screenshot: File;
		type?: TAddMoneyType;
	}): Promise<any> => {
		const formData = new FormData();
		formData.append('amount', String(payload.amount));
		if (payload.screenshot) {
			formData.append('screenshot', payload.screenshot);
		}

		const requestType = payload.type || 'custom';
		return apiClient<any>(WALLET_TRANSACTION_ENDPOINTS.ADD_MONEY(requestType), {
			body: formData,
		});
	},

	// 4.1 GET PAYMENT METHODS FOR USER (GATEWAYS OR CUSTOM BANK DETAILS)
	getPaymentMethods: async (adminId?: number | string): Promise<IPaymentMethodsResponse> => {
		return apiClient<IPaymentMethodsResponse>(
			WALLET_TRANSACTION_ENDPOINTS.GET_PAYMENT_METHODS(),
		);
	},

	// 5. APPROVE WALLET TRANSACTION
	approveWalletTransaction: async (
		id: string | number,
	): Promise<{
		success: boolean;
		statusCode: number;
		message: string;
		data: any;
	}> => {
		return apiClient<{
			success: boolean;
			statusCode: number;
			message: string;
			data: any;
		}>(WALLET_TRANSACTION_ENDPOINTS.APPROVE(id));
	},

	// 6. REJECT WALLET TRANSACTION
	rejectWalletTransaction: async (
		id: string | number,
		rejection_reason?: string,
	): Promise<{
		success: boolean;
		statusCode: number;
		message: string;
		data: any;
	}> => {
		return apiClient<{
			success: boolean;
			statusCode: number;
			message: string;
			data: any;
		}>(WALLET_TRANSACTION_ENDPOINTS.REJECT(id), {
			body: { rejection_reason: rejection_reason || '' },
		});
	},
};

export default walletTransactionService;
