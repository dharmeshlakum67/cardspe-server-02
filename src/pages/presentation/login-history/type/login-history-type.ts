export interface ILoginHistoryUser {
	id: number;
	name: string;
	username: string;
	email_address?: string;
	mobile_number?: string;
	profile_picture?: string | null;
	role?: {
		id: number;
		role_name: string;
	};
}

export interface ILoginHistoryItem {
	id: number;
	admin_id?: number | null;
	user_id?: number | null;
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
	updated_at?: string;
	admin?: ILoginHistoryUser | null;
	user?: ILoginHistoryUser | null;
}

export interface ILoginHistoryFilterParams {
	page?: number;
	limit?: number;
	search?: string;
	start_date?: string;
	end_date?: string;
	device_type?: string;
	is_logout?: boolean | string;
	admin_id?: string | number;
	user_id?: string | number;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface ILoginHistoryApiResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	total_document?: number;
	total?: number;
	result?: number;
	data: ILoginHistoryItem[] | { data: ILoginHistoryItem[]; total_document?: number };
}
