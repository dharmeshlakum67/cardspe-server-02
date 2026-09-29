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
	created_at?: string;
	role?: IRole;
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
