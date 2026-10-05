export interface IServiceAccessItem {
	id: number;
	name: string;
	service_name?: string;
	slug?: string;
	icon?: string | null;
	status: 'active' | 'inactive' | string;
	is_accessible: boolean;
	can_manage: boolean;
}

export interface IServiceAccessAdminInfo {
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

export interface IAdminServiceAccessData {
	admin: IServiceAccessAdminInfo;
	services: IServiceAccessItem[];
}

export interface IServiceAccessResponse {
	status?: boolean;
	success?: boolean;
	statusCode?: number;
	message?: string;
	data: IAdminServiceAccessData;
}

export interface IUpdateServiceAccessItem {
	service_category_id: number;
	status: 'active' | 'inactive';
}

export interface IUpdateServiceAccessPayload {
	service_category_id?: number;
	status?: 'active' | 'inactive';
	services?: IUpdateServiceAccessItem[];
}
