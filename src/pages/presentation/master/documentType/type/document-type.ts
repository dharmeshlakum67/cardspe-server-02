export type TDocumentTypeStatus = 'active' | 'inactive';

export type VerificationServiceType = 'custom' | 'quick_kyc' | 'custom_quick_kyc';

export const VERIFICATION_SERVICE_OPTIONS: {
	label: string;
	value: VerificationServiceType;
}[] = [
	{ label: 'Custom', value: 'custom' },
	{ label: 'Quick KYC', value: 'quick_kyc' },
	{ label: 'Custom + Quick KYC', value: 'custom_quick_kyc' },
];

export interface IDocumentRoleRequirementInput {
	role_id: number;
	is_required: boolean;
}

export interface IDocumentTypeItem {
	id: number;
	document_name: string;
	document_code: string;
	is_mandatory: boolean;
	required_files_count: number;
	verification_service?: VerificationServiceType;
	status: TDocumentTypeStatus | string;
	created_at: string;
	updated_at?: string;
}

export interface IRoleRef {
	id: number;
	role_name: string;
	role_type: string;
}

export interface IRoleDocumentRequirementDetail {
	id: number;
	document_id?: number;
	role_id: number;
	is_required: boolean;
	role?: IRoleRef;
}

export interface IDocumentTypeDetail extends IDocumentTypeItem {
	role_document_requirements?: IRoleDocumentRequirementDetail[];
}

export interface IDocumentTypeQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	verification_service?: VerificationServiceType | string;
	is_mandatory?: boolean | string;
	start_date?: string;
	end_date?: string;
}

export interface IDocumentTypeListResponse {
	success: boolean;
	statusCode: number;
	message: string;
	data: IDocumentTypeItem[];
	total_document?: number;
	result?: number;
}

export interface IDocumentTypeDetailResponse {
	success: boolean;
	statusCode: number;
	message: string;
	data: IDocumentTypeDetail;
}

export interface ICreateDocumentTypePayload {
	document_name: string;
	document_code: string;
	is_mandatory: boolean;
	required_files_count: number;
	verification_service?: VerificationServiceType;
	status: TDocumentTypeStatus | string;
	roles?: IDocumentRoleRequirementInput[];
}

export interface IUpdateDocumentTypePayload {
	document_name?: string;
	document_code?: string;
	is_mandatory?: boolean;
	required_files_count?: number;
	verification_service?: VerificationServiceType;
	status?: TDocumentTypeStatus | string;
	roles?: IDocumentRoleRequirementInput[];
}
