export type MobilePlanTypeStatusType = 'active' | 'inactive';

export interface IMobilePlanType {
	id: number;
	name: string;
	plan_type_id?: number | null;
	status: MobilePlanTypeStatusType;
	created_at?: string;
	updated_at?: string;
	deleted_at?: string | null;
}

export interface CreateMobilePlanTypePayload {
	name: string;
	plan_type_id?: number | null;
	status?: MobilePlanTypeStatusType;
}

export interface UpdateMobilePlanTypePayload {
	name?: string;
	plan_type_id?: number | null;
	status?: MobilePlanTypeStatusType;
}

export interface MobilePlanTypeQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	plan_type_id?: number;
	start_date?: string;
	end_date?: string;
}

export interface IMobilePlanTypeListResponse {
	statusCode: number;
	message: string;
	data: {
		documents: IMobilePlanType[];
		totalDocuments: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
}
