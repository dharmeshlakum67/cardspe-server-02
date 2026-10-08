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

// COMPANY / GENERAL SETTING TYPES
export interface ICompanySettingData {
	id?: number;
	company_name?: string;
	customer_care_number?: string;
	whatsapp_number?: string;
	support_time?: string;
	support_email_address?: string;
	address?: string;
	about_company?: string;
	third_party_service?: string;
	created_at?: string;
	updated_at?: string;
}

export interface ICompanySettingApiResponse {
	status: boolean;
	status_code: number;
	message: string;
	data: ICompanySettingData;
}

export interface IUpdateCompanySettingPayload {
	company_name?: string;
	customer_care_number?: string;
	whatsapp_number?: string;
	support_time?: string;
	support_email_address?: string;
	address?: string;
	about_company?: string;
	third_party_service?: string;
}

// BBPS / THIRD PARTY SERVICE TYPES
export interface IThirdPartyServiceOption {
	label: string;
	value: string;
	description?: string;
	is_active?: boolean;
}

export interface IThirdPartyServiceData {
	active_third_party_service: string;
	services: IThirdPartyServiceOption[];
}

export interface IThirdPartyServiceApiResponse {
	status?: string | boolean;
	success?: boolean;
	message?: string;
	data: IThirdPartyServiceData;
}
