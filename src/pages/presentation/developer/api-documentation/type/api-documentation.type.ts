// API DOCUMENTATION TYPES

export type TApiDocMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type TApiDocStatus = 'draft' | 'published' | 'archived';

export interface IRequestHeaderItem {
	key: string;
	value?: string;
	sample?: string;
	default?: string;
	required: boolean;
	description?: string;
}

export interface IPathParameterItem {
	name: string;
	type: string;
	required: boolean;
	description?: string;
}

export interface IQueryParameterItem {
	name: string;
	type: string;
	required: boolean;
	default?: any;
	description?: string;
}

export interface IBodyParameterItem {
	key: string;
	type: string;
	required: boolean;
	value?: any;
	default?: any;
	description?: string;
}

export interface IApiDocumentation {
	id: number;
	title: string;
	slug: string;
	category_group: string;
	description?: string | null;
	method: TApiDocMethod;
	endpoint: string;
	request_headers?: IRequestHeaderItem[] | string;
	path_parameters?: IPathParameterItem[] | string;
	query_parameters?: IQueryParameterItem[] | string;
	request_body?: IBodyParameterItem[] | Record<string, any> | string;
	request_example?: string | null;
	response_example?: any;
	response_description?: string | null;
	status: TApiDocStatus;
	display_order: number;
	published_at?: string | null;
	created_at: string;
	updated_at?: string;
}

export interface ICreateApiDocumentationPayload {
	title: string;
	slug?: string;
	category_group: string;
	description?: string;
	method: TApiDocMethod;
	endpoint: string;
	request_headers?: IRequestHeaderItem[] | string;
	path_parameters?: IPathParameterItem[] | string;
	query_parameters?: IQueryParameterItem[] | string;
	request_body?: IBodyParameterItem[] | Record<string, any> | string;
	request_example?: string;
	response_example?: any;
	response_description?: string;
	status?: TApiDocStatus;
	display_order?: number;
	published_at?: string | null;
}

export interface IUpdateApiDocumentationPayload {
	title?: string;
	slug?: string;
	category_group?: string;
	description?: string;
	method?: TApiDocMethod;
	endpoint?: string;
	request_headers?: IRequestHeaderItem[] | string;
	path_parameters?: IPathParameterItem[] | string;
	query_parameters?: IQueryParameterItem[] | string;
	request_body?: IBodyParameterItem[] | Record<string, any> | string;
	request_example?: string;
	response_example?: any;
	response_description?: string;
	status?: TApiDocStatus;
	display_order?: number;
	published_at?: string | null;
}

export interface IApiDocumentationQueryParams {
	search?: string;
	category_group?: string;
	method?: TApiDocMethod | '';
	status?: TApiDocStatus | '';
	start_date?: string;
	end_date?: string;
	page?: number;
	limit?: number;
	sort?: string;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface IApiDocumentationResponse {
	status?: boolean;
	success?: boolean;
	message?: string;
	data: IApiDocumentation[];
	total_document: number;
}

export interface ApiDocNavigationItem {
	id: number;
	title: string;
	slug: string;
	method: TApiDocMethod;
	endpoint: string;
}

export interface ApiDocPortalResponse {
	categories: string[];
	groups: Record<string, ApiDocNavigationItem[]>;
	total: number;
}

export interface ApiDocDetail {
	id: number;
	title: string;
	slug: string;
	category_group: string;
	description: string | null;
	method: TApiDocMethod;
	endpoint: string;
	request_headers: Array<{ key: string; value?: string; required: boolean; description?: string }>;
	path_parameters: Array<{ name: string; type: string; required: boolean; description?: string }>;
	query_parameters: Array<{ name: string; type: string; required: boolean; default?: any; description?: string }>;
	request_body: any;
	request_example: string | null;
	response_example: any;
	response_description: string | null;
	status: TApiDocStatus;
	display_order: number;
	published_at: string | null;
}

export interface IPortalDocumentationResponse {
	status?: boolean;
	success?: boolean;
	message?: string;
	data: ApiDocPortalResponse;
}
