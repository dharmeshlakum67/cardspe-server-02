export interface ITenantRef {
	id: number;
	name: string;
}

export interface ICompanyRef {
	id: number;
	name: string;
	company_code: string;
}

export type TRoleType = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

export interface IRoleItem {
	id: number;
	tenant_id?: ITenantRef | null;
	company_id?: ICompanyRef | null;
	name: string;
	role_key: string;
	role_type: TRoleType | string;
	status: 'ACTIVE' | 'INACTIVE' | string;
	description?: string | null;
	created_by?: number | string | null;
	updated_by?: number | string | null;
	created_at: string;
	updated_at: string;
}

export interface IRolesResponse {
	success: boolean;
	status: string;
	message: string;
	data: IRoleItem[];
	result: number;
	total_document: number;
}

export interface IRoleFilterParams {
	search?: string;
	start_date?: string;
	end_date?: string;
	from_date?: string;
	to_date?: string;
	page?: number;
	limit?: number;
	status?: string;
}

export interface IRolePermissionModule {
	id?: number | string;
	name?: string;
	permission_key?: string;
	display_order?: number;
	icon?: string;
}

export interface IRolePermissionItem {
	id?: number | string;
	role_id?: number | string;
	permission_id?: IRolePermissionModule | number | string;
	name?: string;
	permission_key?: string;
	read: boolean;
	create: boolean;
	update: boolean;
	delete: boolean;
	[key: string]: any;
}

export interface IRoleDetail extends IRoleItem {
	permissions?: IRolePermissionItem[];
	role_access?: IRolePermissionItem[];
	role_permissions?: IRolePermissionItem[];
	access?: IRolePermissionItem[];
}

export interface IRoleDetailResponse {
	success: boolean;
	status?: string;
	message?: string;
	data: IRoleDetail;
}
