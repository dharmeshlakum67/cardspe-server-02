export interface IPaymentGatewayAccessItem {
	id: number;
	name: string;
	code: string;
	icon?: string | null;
	description?: string | null;
	status: 'active' | 'inactive' | string;
	is_primary: boolean;
	is_assigned: boolean;
	is_system_default?: boolean;
	can_manage?: boolean;
}

export interface IPaymentGatewayAccessAdminInfo {
	id: number;
	name: string;
	username: string;
	role?: {
		id: number;
		role_name: string;
		slug: string;
		role_type: string;
	};
}

export interface IAdminPaymentGatewayAccessData {
	admin: IPaymentGatewayAccessAdminInfo;
	is_using_default: boolean;
	gateways: IPaymentGatewayAccessItem[];
}

export interface IPaymentGatewayAccessResponse {
	status?: string | boolean;
	success?: boolean;
	statusCode?: number;
	message?: string;
	data: IAdminPaymentGatewayAccessData;
}

export interface IUpdatePaymentGatewayAccessItem {
	payment_gateway_id: number;
	status?: 'active' | 'inactive';
	is_primary?: boolean;
}

export interface IUpdatePaymentGatewayAccessPayload {
	is_using_default?: boolean;
	payment_gateway_id?: number;
	status?: 'active' | 'inactive';
	gateways?: IUpdatePaymentGatewayAccessItem[];
}
