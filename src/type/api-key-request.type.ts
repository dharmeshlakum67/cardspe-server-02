export type TApiKeyRequestStatus = 'pending' | 'approved' | 'rejected';
export type TApiKeyType = 'test' | 'live';

export interface IApiKeyRequestAdminRole {
	id: number;
	name: string;
	role_type?: string;
	role_slug?: string;
}

export interface IApiKeyRequestAdmin {
	id: number;
	name: string;
	username: string;
	email_address: string;
	company_name?: string | null;
	role?: IApiKeyRequestAdminRole;
}

export interface IApiKeyRequest {
	id: number;
	admin_id: number;
	api_key_id?: number | string | null;
	key_type: TApiKeyType;
	request_reason?: string | null;
	status: TApiKeyRequestStatus;
	rejection_reason?: string | null;
	created_at: string;
	updated_at: string;
	admin?: IApiKeyRequestAdmin;
	requester?: IApiKeyRequestAdmin;
}

export interface ICreateApiKeyRequestPayload {
	key_type: TApiKeyType;
	request_reason?: string;
}

export interface IReviewApiKeyRequestPayload {
	status: 'approved' | 'rejected';
	rejection_reason?: string;
}

export interface IApiKeyRequestQueryParams {
	page?: number;
	limit?: number;
	status?: TApiKeyRequestStatus | '';
	key_type?: TApiKeyType | '';
	search?: string;
	start_date?: string;
	end_date?: string;
	admin_id?: number | string;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
}

export interface IApiKeyRequestListResponse {
	success: boolean;
	statusCode: number;
	message: string;
	data: {
		data: IApiKeyRequest[];
		total_document: number;
		total_page?: number;
		current_page?: number;
	} | IApiKeyRequest[];
	total_document?: number;
	totalDocuments?: number;
	total?: number;
}

export interface IApiKeyRequestSingleResponse {
	success: boolean;
	statusCode: number;
	message: string;
	data: IApiKeyRequest;
}

export interface IActiveApiKey {
	id: number;
	key_type: TApiKeyType;
	api_key: string;
	api_secret?: string;
	status: string;
	created_at: string;
	updated_at?: string;
}

export interface IEnvKeyStatus {
	key: IActiveApiKey | null;
	has_active_key: boolean;
	has_pending_request: boolean;
	is_first_time: boolean;
	can_generate: boolean;
}

export interface IMyApiKeysData {
	test: IEnvKeyStatus;
	live: IEnvKeyStatus;
	can_generate_test: boolean;
	can_generate_live: boolean;
}

export interface IMyApiKeysResponse {
	success?: boolean;
	statusCode: number;
	status?: string;
	message: string;
	data: IMyApiKeysData;
}

