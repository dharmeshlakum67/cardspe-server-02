export interface ILoginCredentials {
	identifier: string;
	password: string;
}

export interface IRole {
	id: number;
	role_name: string;
	role_status?: string;
	role_type: string;
}

export interface IAdminProfileState {
	id: number;
	name: string;
}

export interface IAdminProfile {
	id: number;
	address?: string | null;
	postal_code?: string | null;
	state?: IAdminProfileState | null;
}

export interface IAuthUser {
	id: number;
	name: string;
	username: string;
	email_address: string;
	mobile_number?: string;
	company_name?: string;
	profile_picture?: string | null;
	profile_image?: string | null;
	is_email_verified?: boolean;
	is_mobile_verified?: boolean;
	email_verified_at?: string;
	kyc_status?: string;
	current_balance?: string | number;
	created_at?: string;
	role?: IRole;
	profile?: IAdminProfile | null;
}

export interface IUpdateProfilePayload {
	name?: string;
	username?: string;
	email_address?: string;
	company_name?: string | null;
	address?: string | null;
	state_id?: number | null;
	postal_code?: string | null;
}

export interface ILoginResponse {
	status: string;
	message: string;
	data: {
		token: string;
		user: IAuthUser;
	};
}

export interface IMeResponse {
	success: boolean;
	statusCode?: number;
	message: string;
	data: IAuthUser;
}

export interface IForgotPasswordPayload {
	email_address: string;
}

export interface IForgotPasswordResponse {
	success?: boolean;
	status?: string | number;
	message?: string;
	data?: any;
}

export interface IResetPasswordPayload {
	password: string;
}

export interface IResetPasswordResponse {
	success?: boolean;
	status?: string | number;
	message?: string;
	data?: any;
}

export interface ISignupRole {
	id: number;
	role_name: string;
	role_type: string;
}

export interface IRoleResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	total_document?: number;
	result?: number;
	data: ISignupRole[];
}

export interface IRegisterPayload {
	name: string;
	username: string;
	mobile_number: string;
	email_address: string;
	company_name: string;
	password: string;
	role_id: number;
}

export interface IRegisterResponse {
	message: string;
	user: {
		name: string;
		email_address: string;
		mobile_number: string;
		token?: string;
		token_expiry?: string;
	};
}

export interface IVerifyOTPPayload {
	mobile_number: string;
	otp: string;
}

export interface IVerifyOTPResponse {
	message?: string;
	token?: string;
	user?: IAuthUser;
	data?: {
		token: string;
		user: IAuthUser;
	};
}

export interface IResendOTPPayload {
	mobile_number: string;
}

export interface IResendOTPResponse {
	message?: string;
	cooldown_seconds?: number;
}

export interface ITokenDetails {
	name: string;
	email_address: string;
	password_reset_token_expires_at?: string;
}

export interface ITokenDetailsResponse {
	success: boolean;
	statusCode?: number;
	message: string;
	data: ITokenDetails;
}

export interface IVerifyEmailTokenResponse {
	success: boolean;
	statusCode?: number;
	message: string;
	data?: {
		name?: string;
		email_address?: string;
	};
}

