export interface IQuickKycCharges {
	quick_kyc_charge?: string;
	quick_kyc_aadhar_charge?: string;
	quick_kyc_pan_charge?: string;
	[key: string]: any;
}

export interface IServiceConfigurationItem {
	id: number;
	service_slug: string;
	charges: IQuickKycCharges | Record<string, any>;
	status: 'active' | 'inactive' | string;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: any;
}

export interface IServiceConfigApiResponse {
	statusCode: number;
	message: string;
	data: IServiceConfigurationItem[];
}

export interface IUpdateServiceConfigPayload {
	service_slug: string;
	charges: Record<string, any>;
	status?: 'active' | 'inactive' | string;
}

export interface IUpdateServiceConfigApiResponse {
	statusCode: number;
	message: string;
	data: IServiceConfigurationItem;
}
