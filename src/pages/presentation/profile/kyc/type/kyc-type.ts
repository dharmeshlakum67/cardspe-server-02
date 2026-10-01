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
	kyc_id: number;
	kyc_status: string;
	all_required_submitted: boolean;
	document: {
		id: number;
		document_type_id: number;
		document_name: string;
		document_code: string;
		file_urls: string[];
		field_values: Record<string, any>;
		status: string;
		verification_service?: string;
	};
}

export interface IKycSubmitApiResponse {
	statusCode: number;
	message: string;
	data: IKycSubmitResponseData;
}
