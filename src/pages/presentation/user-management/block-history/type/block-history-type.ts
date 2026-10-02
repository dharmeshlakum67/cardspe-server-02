// BLOCK HISTORY TYPE DEFINITIONS
export interface IBlockHistoryUserRole {
	id: number;
	role_name: string;
	slug: string;
	role_type: string;
}

export interface IBlockHistoryUserInfo {
	id: number;
	name: string;
	username: string;
	email_address: string;
	mobile_number: string;
	profile_picture?: string | null;
	role?: IBlockHistoryUserRole;
}

export interface IBlockHistoryItem {
	id: number;
	admin_id: number;
	action: 'block' | 'unblock' | string;
	reason?: string | null;
	action_taken_by: number;
	created_at: string;
	admin: IBlockHistoryUserInfo;
	action_by?: IBlockHistoryUserInfo | null;
}

export interface IBlockHistoryFilterParams {
	search?: string;
	action?: 'block' | 'unblock' | string;
	admin_id?: number | string;
	role_id?: number | string;
	role_slug?: string;
	start_date?: string;
	end_date?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
}

export interface IBlockHistoryApiResponse {
	status: boolean;
	status_code: number;
	message: string;
	data: IBlockHistoryItem[];
	total_document: number;
	current_page?: number;
	total_page?: number;
	limit?: number;
}
