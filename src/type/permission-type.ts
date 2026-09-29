// PERMISSION INTERFACES AND TYPES

export interface IPermissionAction {
	[actionKey: string]: boolean;
}

export interface IPermissionItem {
	id: string | number;
	name: string;
	display_order?: number;
	permission_key: string;
	parent_id?: string | number | null;
	actions?: IPermissionAction[];
	permissions?: string[];
	access?: Record<string, boolean>;
	is_show?: boolean;
	status?: string;
	created_at?: string;
	updated_at?: string;
	children?: IPermissionItem[];
}

export interface IUserAccessPermissionInfo {
	id?: number | string;
	name?: string;
	permission_key?: string;
}

export interface IUserAccessItem {
	id?: number | string;
	role_id?: number | string;
	role_name?: string;
	permission_id?: IUserAccessPermissionInfo | number | string;
	read?: boolean;
	create?: boolean;
	update?: boolean;
	delete?: boolean;
	[key: string]: any;
}

export interface IPermissionActionState {
	read: boolean;
	create: boolean;
	update: boolean;
	delete: boolean;
	id?: number | string;
	role_id?: number | string;
	role_name?: string;
	permission_id?: IUserAccessPermissionInfo | number | string;
	[actionKey: string]: any;
}

export interface IPermissionsMap {
	[keyOrName: string]: IPermissionActionState;
}

export interface IPermissionsResponse {
	success?: boolean;
	status?: string;
	message?: string;
	data: IPermissionItem[];
	result?: number;
}

export interface IUserAccessResponse {
	status?: string;
	success?: boolean;
	message?: string;
	data: IUserAccessItem[];
}
