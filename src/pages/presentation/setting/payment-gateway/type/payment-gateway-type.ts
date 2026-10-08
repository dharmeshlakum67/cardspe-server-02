// PAYMENT GATEWAY TYPES & INTERFACES

export type TPaymentGatewayStatus = 'active' | 'inactive';
export type TPaymentGatewayChargeType = 'PERCENTAGE' | 'FLAT' | string;

export interface IPaymentGatewayCharge {
	name: string;
	type: TPaymentGatewayChargeType;
	value: number;
}

export interface IPaymentGatewayChargeConstantOption {
	label: string;
	value: string;
}

export interface IPaymentGatewayChargesConstants {
	charge_names: IPaymentGatewayChargeConstantOption[];
	charge_types: IPaymentGatewayChargeConstantOption[];
}

export interface IPaymentGateway {
	id: number;
	name: string;
	code: string;
	icon?: string | null;
	status: TPaymentGatewayStatus;
	description?: string | null;
	charges?: IPaymentGatewayCharge[] | string | null;
	min_amount?: number | null;
	max_amount?: number | null;
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
	code?: string;
	status: TPaymentGatewayStatus;
	description?: string;
	charges?: IPaymentGatewayCharge[];
	min_amount?: number | null;
	max_amount?: number | null;
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

/**
 * Safely parse charges from array or JSON string
 */
export const parseGatewayCharges = (charges: any): IPaymentGatewayCharge[] => {
	if (!charges) return [];
	if (Array.isArray(charges)) return charges;
	if (typeof charges === 'string') {
		try {
			const parsed = JSON.parse(charges);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
};
