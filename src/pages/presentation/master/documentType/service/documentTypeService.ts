import apiClient from '../../../../../services/apiClient';
import { DOCUMENT_TYPE_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import {
	IDocumentTypeListResponse,
	IDocumentTypeDetailResponse,
	IDocumentTypeQueryParams,
	ICreateDocumentTypePayload,
	IUpdateDocumentTypePayload,
	IDocumentTypeItem,
} from '../type/document-type';

let activeDocumentTypesCache: Promise<{ success: boolean; data: { id: number; document_name: string }[] }> | null = null;

// CLEAR ACTIVE DOCUMENT TYPES CACHE ON MUTATIONS
export const clearActiveDocumentTypesCache = () => {
	activeDocumentTypesCache = null;
};

export const documentTypeService = {
	// GET ALL DOCUMENT TYPES (LIST WITH FILTERS & PAGINATION)
	getDocumentTypes: async (params?: IDocumentTypeQueryParams): Promise<IDocumentTypeListResponse> => {
		return apiClient<IDocumentTypeListResponse>(DOCUMENT_TYPE_ENDPOINTS.GET_ALL, {
			params: params as Record<string, string | number | boolean | undefined>,
		});
	},

	// GET ACTIVE DOCUMENT TYPES FOR DROPDOWNS (DEDUPLICATED & CACHED)
	getActiveDocumentTypes: async (force = false): Promise<{ success: boolean; data: { id: number; document_name: string }[] }> => {
		if (!force && activeDocumentTypesCache) {
			return activeDocumentTypesCache;
		}

		activeDocumentTypesCache = apiClient<{ success: boolean; data: { id: number; document_name: string }[] }>(
			DOCUMENT_TYPE_ENDPOINTS.GET_ACTIVE,
		).catch((err) => {
			activeDocumentTypesCache = null;
			throw err;
		});

		return activeDocumentTypesCache;
	},

	// GET SINGLE DOCUMENT TYPE BY ID
	getDocumentTypeById: async (id: number | string): Promise<IDocumentTypeDetailResponse> => {
		return apiClient<IDocumentTypeDetailResponse>(DOCUMENT_TYPE_ENDPOINTS.GET_ONE(id));
	},

	// CREATE DOCUMENT TYPE
	createDocumentType: async (
		payload: ICreateDocumentTypePayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data: IDocumentTypeItem }> => {
		clearActiveDocumentTypesCache();
		return apiClient<{ success: boolean; statusCode?: number; message?: string; data: IDocumentTypeItem }>(
			DOCUMENT_TYPE_ENDPOINTS.CREATE,
			{
				body: payload,
			},
		);
	},

	// UPDATE DOCUMENT TYPE
	updateDocumentType: async (
		id: number | string,
		payload: IUpdateDocumentTypePayload,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data: any }> => {
		clearActiveDocumentTypesCache();
		return apiClient<{ success: boolean; statusCode?: number; message?: string; data: any }>(
			DOCUMENT_TYPE_ENDPOINTS.UPDATE(id),
			{
				body: payload,
			},
		);
	},

	// UPDATE DOCUMENT TYPE STATUS ONLY
	updateDocumentTypeStatus: async (
		id: number | string,
		status: 'active' | 'inactive' | string,
	): Promise<{ success: boolean; statusCode?: number; message?: string; data?: any }> => {
		clearActiveDocumentTypesCache();
		return apiClient(DOCUMENT_TYPE_ENDPOINTS.UPDATE_STATUS(id), {
			body: { status },
		});
	},

	// DELETE DOCUMENT TYPE
	deleteDocumentType: async (
		id: number | string,
	): Promise<{ success: boolean; statusCode?: number; message?: string }> => {
		clearActiveDocumentTypesCache();
		return apiClient<{ success: boolean; statusCode?: number; message?: string }>(
			DOCUMENT_TYPE_ENDPOINTS.DELETE(id),
		);
	},
};

export default documentTypeService;
