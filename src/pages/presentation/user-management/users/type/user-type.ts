export interface IUserRole {
	id: number;
	role_name: string;
	slug?: string;
	role_key?: string;
	role_type?: string;
}

export type TUserStatus = 'active' | 'inactive' | 'blocked' | string;

export interface IUserProfile {
	id?: number;
	address?: string | null;
	city?: string | null;
	state_id?: number | null;
	postal_code?: string | null;
	state?: { id: number; name: string };
}

export interface IKycDocumentItem {
	id: number;
	document_type_id: number;
	status: string;
	field_values?: Record<string, any>;
	file_urls?: string[] | Record<string, any>;
	submitted_data?: Record<string, any>;
	rejection_reason?: string | null;
	created_at: string;
	document_type?: {
		id: number;
		document_name: string;
		document_code?: string;
	};
}

export interface IKycDetailItem {
	id: number;
	status: string;
	rejection_reason?: string | null;
	submitted_at?: string | null;
	verified_at?: string | null;
	created_at: string;
	documents?: IKycDocumentItem[];
}

export interface ISessionItem {
	id: number;
	admin_id?: number;
	session_id?: string;
	user_agent: string;
	ip_address: string;
	device_type?: string | null;
	browser?: string | null;
	browser_version?: string | null;
	os?: string | null;
	os_version?: string | null;
	is_logout: boolean;
	created_at: string;
}

export interface IUserItem {
	id: number;
	name: string;
	username: string;
	company_name?: string | null;
	profile_picture?: string | null;
	mobile_number?: string;
	email_address: string;
	status: TUserStatus;
	parent_id?: number | null;
	role_id?: number;
	current_balance?: string | number;
	is_email_verified?: boolean;
	email_verified_at?: string | null;
	is_mobile_verified?: boolean;
	mobile_verified_at?: string | null;
	last_login_at?: string | null;
	kyc_status?: string;
	created_at: string;
	updated_at?: string;
	role?: IUserRole;
	parent?: {
		id: number;
		name: string;
		username: string;
		email_address?: string;
		mobile_number?: string;
	};
	profile?: IUserProfile;
	kyc?: IKycDetailItem | null;
	sessions?: ISessionItem[];
}

export interface IUsersResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	total_document?: number;
	result?: number;
	data: IUserItem[];
}

export interface IUserFilterParams {
	page?: number;
	limit?: number;
	search?: string;
	role_id?: number | string;
	status?: string;
	start_date?: string;
	end_date?: string;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface IUserDetailResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IUserItem;
}

export interface IUserCreatePayload {
	name: string;
	username: string;
	company_name?: string | null;
	email_address: string;
	mobile_number: string;
	password: string;
	role_id: number;
	parent_id?: number | null;
	status?: string;
	state_id?: number | null;
	city?: string | null;
	address?: string | null;
	postal_code?: string | null;
}

export interface IUserUpdatePayload {
	name?: string;
	username?: string;
	company_name?: string | null;
	email_address?: string;
	mobile_number?: string;
	password?: string;
	role_id?: number;
	parent_id?: number | null;
	status?: string;
	state_id?: number | null;
	city?: string | null;
	address?: string | null;
	postal_code?: string | null;
}

export interface IActiveAdminItem {
	id: number;
	name: string;
	username: string;
	email_address?: string;
}

export interface IActiveAdminQueryParams {
	role_id?: number | string;
	role_slug?: string;
	search?: string;
	page?: number;
	limit?: number;
	hide_super_admin?: boolean | string | number;
}
