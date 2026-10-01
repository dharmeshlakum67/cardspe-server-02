export type PaymentModeStatusType = 'active' | 'inactive';

export interface IPaymentMode {
	id: number;
	name: string;
	code: string;
	payment_account_info?: string | null;
	status: PaymentModeStatusType;
	created_at?: string;
	updated_at?: string;
}

export interface IActivePaymentModeItem {
	id: number;
	name: string;
	code: string;
	payment_account_info?: string | null;
	status?: PaymentModeStatusType;
}

export interface CreatePaymentModePayload {
	name: string;
	code: string;
	payment_account_info?: string | null;
	status?: PaymentModeStatusType;
}

export interface UpdatePaymentModePayload {
	name?: string;
	code?: string;
	payment_account_info?: string | null;
	status?: PaymentModeStatusType;
}

export interface PaymentModeQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: PaymentModeStatusType | string;
	startDate?: string;
	endDate?: string;
	start_date?: string;
	end_date?: string;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
}

export interface IPaymentModeListResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data:
		| IPaymentMode[]
		| {
				documents?: IPaymentMode[];
				rows?: IPaymentMode[];
				data?: IPaymentMode[];
				count?: number;
				totalDocuments?: number;
				total_document?: number;
		  };
	total_document?: number;
	totalDocuments?: number;
	totalPages?: number;
	page?: number;
	limit?: number;
}

export interface IPaymentModeSingleResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IPaymentMode;
}

export interface IActivePaymentModesResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IActivePaymentModeItem[];
}
