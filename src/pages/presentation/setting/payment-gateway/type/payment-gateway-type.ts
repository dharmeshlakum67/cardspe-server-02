// PAYMENT GATEWAY TYPES & INTERFACES

export type TPaymentGatewayStatus = 'active' | 'inactive';

export interface IPaymentGateway {
	id: number;
	name: string;
	code: string;
	icon?: string | null;
	status: TPaymentGatewayStatus;
	description?: string | null;
	created_at: string;
	updated_at: string;
	deleted_at?: string | null;
}

export interface IPaymentGatewayQueryParams {
	[key: string]: string | number | boolean | undefined;
	page?: number;
	limit?: number;
	search?: string;
	status?: TPaymentGatewayStatus;
	start_date?: string;
	end_date?: string;
	sort_by?: string;
	sort_order?: 'ASC' | 'DESC';
}

export interface IPaymentGatewayPayload {
	name: string;
	code: string;
	status: TPaymentGatewayStatus;
	description?: string;
	icon?: File | null;
	is_delete_icon?: boolean;
}

export interface IPaymentGatewayListResponse {
	status: string;
	statusCode: number;
	message: string;
	data: IPaymentGateway[];
	total_document?: number;
}

export interface IPaymentGatewayDetailResponse {
	status: string;
	statusCode: number;
	message: string;
	data: IPaymentGateway;
}
