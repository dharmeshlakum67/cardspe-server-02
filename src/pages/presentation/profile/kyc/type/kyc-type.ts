export interface IKycDocumentFieldOption {
	label: string;
	value: string;
}

export interface IKycDocumentField {
	id?: number;
	field_id?: number;
	document_id?: number;
	name?: string;
	field_name?: string;
	code?: string;
	field_code?: string;
	type?: string;
	field_type?: string;
	is_required?: boolean;
	display_order?: number;
	placeholder?: string;
	options?: IKycDocumentFieldOption[];
	status?: string;
	value?: any;
}

export interface IKycDocumentItem {
	requirement_id: number | null;
	document_id: number;
	document_name: string;
	document_code: string;
	is_mandatory: boolean;
	is_required_for_role: boolean;
	required_files_count: number;
	verification_service: string;
	status: string;
	is_submitted: boolean;
	rejection_reason?: string | null;
	uploaded_files: string[];
	field_values: Record<string, any>;
	fields: IKycDocumentField[];
}

export interface IKycDetailsResponseData {
	kyc_id: number | null;
	kyc_status: string;
	rejection_reason?: string | null;
	submitted_at?: string | null;
	verified_at?: string | null;
	is_submitted: boolean;
	is_approved: boolean;
	is_rejected: boolean;
	is_resubmit_requested: boolean;
	initial_form_values: Record<string, Record<string, any>>;
	documents: IKycDocumentItem[];
}

export interface IKycDetailsApiResponse {
	statusCode: number;
	message: string;
	data: IKycDetailsResponseData;
}

export interface IKycSubmitResponseData {
	requires_otp?: boolean;
	request_id?: string;
	kyc_request_id?: number;
	document_id?: number;
	document_code?: string;
	kyc_id?: number;
	kyc_status?: string;
	is_auto_verified?: boolean;
	all_required_submitted?: boolean;
	message?: string;
	document?: {
		id?: number;
		document_type_id?: number;
		kyc_request_id?: number;
		document_name?: string;
		document_code?: string;
		file_urls?: string[];
		field_values?: Record<string, any>;
		status?: string;
		verification_service?: string;
	};
}

export interface IKycSubmitApiResponse {
	status?: boolean;
	statusCode: number;
	message: string;
	data: IKycSubmitResponseData;
}

// ACTIVE DOCUMENT TYPE OPTION FOR DROPDOWNS
export interface IActiveDocumentTypeOption {
	id: number;
	document_name: string;
}

// APPLICANT & PARENT INFO
export interface IKycApplicantParent {
	id: number;
	name: string;
	username: string;
	company_name?: string | null;
	mobile_number: string;
}

export interface IKycApplicantRole {
	id: number;
	role_name: string;
	slug: string;
	role_type: string;
}

export interface IKycApplicant {
	id: number;
	name: string;
	username: string;
	email_address: string;
	mobile_number: string;
	company_name?: string | null;
	profile_picture?: string | null;
	role_id: number;
	parent_id?: number | null;
	role?: IKycApplicantRole;
	parent?: IKycApplicantParent | null;
}

// ATTACHED KYC DOCUMENT
export interface IKycAttachedDocument {
	id: number;
	document_type_id: number;
	status: 'pending' | 'approved' | 'rejected' | string;
	file_urls?: string[] | null;
	field_values?: Record<string, any> | null;
	verification_service?: string;
	document_type?: {
		id: number;
		document_name: string;
		service_type?: string;
	};
}

// KYC REQUEST / DOCUMENT ITEM
export interface IKycRequestItem {
	id: number;
	user_id?: number;
	admin_id?: number;
	status: 'pending' | 'approved' | 'rejected' | 'in_review' | 'verified' | string;
	verification_service?: string;
	created_at: string;
	updated_at?: string;
	user?: {
		id: number;
		name: string;
		username?: string;
		email_address?: string;
		mobile_number?: string;
		company_name?: string;
		profile_picture?: string;
		role?: IKycApplicantRole;
		parent?: IKycApplicantParent;
	};
	admin?: {
		id: number;
		name: string;
		username?: string;
		email_address?: string;
		mobile_number?: string;
		company_name?: string;
		profile_picture?: string;
		role?: IKycApplicantRole;
		parent?: IKycApplicantParent;
	};
	document_type?: {
		id: number;
		document_name: string;
		document_code?: string;
		is_mandatory?: boolean;
		verification_service?: string;
		service_type?: string;
	};
	kyc_request?: {
		id: number;
		kyc_type: string;
		document_number: string;
		request_id: string;
		status: string;
		charge: string;
		response?: any;
		otp_sent_at?: string;
		otp_verified_at?: string;
		created_at: string;
	};
	third_party_response?: any;
	kyc_type?: string;
	document_number?: string;
	request_id?: string;
	charge?: string;
	file_urls?: string[];
	field_values?: Record<string, any>;
	rejection_reason?: string;
	kyc_documents?: IKycAttachedDocument[];
}

// API QUERY PARAMS
export interface IKycRequestFilterParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	document_type_id?: number | string;
	admin_name?: string;
	start_date?: string;
	end_date?: string;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
}

export interface IKycRequestListResponseData {
	data: IKycRequestItem[];
	total_document: number;
	total_page?: number;
	page?: number;
}

export interface IKycRequestListApiResponse {
	status?: string | boolean;
	statusCode?: number;
	message?: string;
	data: IKycRequestListResponseData;
}

export interface IUpdateKycRequestStatusPayload {
	status: 'approved' | 'rejected' | string;
	remark?: string;
}

export interface IKycRequestDetailApiResponse {
	status?: string | boolean;
	statusCode?: number;
	message?: string;
	data: IKycRequestItem;
}
