export type StateStatusType = 'active' | 'inactive';

export interface IState {
	id: number;
	name: string;
	circle_id: number | null;
	status: StateStatusType;
	created_at?: string;
	updated_at?: string;
}

export interface IActiveStateItem {
	id: number;
	name: string;
	circle_id: number | null;
}

export interface ICreateStatePayload {
	name: string;
	circle_id?: number | null;
	status?: StateStatusType;
}

export interface IUpdateStatePayload {
	name?: string;
	circle_id?: number | null;
	status?: StateStatusType;
}

export interface IStateQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: StateStatusType;
	circle_id?: number;
	startDate?: string;
	endDate?: string;
	start_date?: string;
	end_date?: string;
	sortBy?: string;
	sortOrder?: 'ASC' | 'DESC';
}

export interface IStateListResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IState[];
	total_document?: number;
	totalDocuments?: number;
	totalPages?: number;
	page?: number;
	limit?: number;
}

export interface IStateSingleResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IState;
}

export interface IActiveStatesResponse {
	success: boolean;
	statusCode?: number;
	message?: string;
	data: IActiveStateItem[];
}
