import apiClient from './apiClient';
import { NOTIFICATION_ENDPOINTS } from '../constants/apiEndpoints';

export interface INotificationItem {
	id: number;
	admin_id: number;
	message: string;
	notification_type?: string;
	model_name?: string;
	model_id?: number | string;
	is_read: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface INotificationQueryParams {
	page?: number;
	limit?: number;
	is_read?: boolean | string;
}

export interface INotificationListResponse {
	status?: boolean;
	success?: boolean;
	statusCode?: number;
	message?: string;
	data: INotificationItem[] | {
		data: INotificationItem[];
		unread_count?: number;
		total_document?: number;
		current_page?: number;
		total_page?: number;
	};
	unread_count?: number;
	total_document?: number;
	current_page?: number;
	total_page?: number;
}

export interface IMarkNotificationResponse {
	status?: boolean;
	success?: boolean;
	statusCode?: number;
	message?: string;
	data?: any;
}

export interface IParsedNotificationResult {
	items: INotificationItem[];
	unreadCount: number;
	totalDocument: number;
	currentPage: number;
	totalPages: number;
}

/**
 * Universal extractor to handle any response structure from the backend
 */
export const extractNotificationResponse = (res: any, requestedPage: number = 1, limit: number = 10): IParsedNotificationResult => {
	if (!res) {
		return { items: [], unreadCount: 0, totalDocument: 0, currentPage: 1, totalPages: 1 };
	}

	const nested = res?.data !== undefined && !Array.isArray(res?.data) && typeof res?.data === 'object' ? res.data : res;

	let items: INotificationItem[] = [];
	if (Array.isArray(nested?.data)) {
		items = nested.data;
	} else if (Array.isArray(res?.data)) {
		items = res.data;
	} else if (Array.isArray(nested)) {
		items = nested;
	} else if (Array.isArray(res)) {
		items = res;
	}

	let unreadCount = items.filter((n: any) => !n.is_read).length;
	if (typeof nested?.unread_count === 'number') {
		unreadCount = nested.unread_count;
	} else if (typeof res?.unread_count === 'number') {
		unreadCount = res.unread_count;
	}

	let totalDocument = items.length;
	if (typeof nested?.total_document === 'number') {
		totalDocument = nested.total_document;
	} else if (typeof res?.total_document === 'number') {
		totalDocument = res.total_document;
	}

	const currentPage = nested?.current_page || res?.current_page || requestedPage;
	const calculatedTotalPages = Math.ceil(totalDocument / limit) || 1;
	const totalPages = nested?.total_page || res?.total_page || calculatedTotalPages;

	return {
		items,
		unreadCount,
		totalDocument,
		currentPage,
		totalPages,
	};
};

// In-flight request cache to prevent duplicate concurrent network requests
const inFlightRequests = new Map<string, Promise<INotificationListResponse>>();

export const notificationService = {
	/**
	 * Fetch notifications with pagination and filters (with in-flight deduplication)
	 */
	getAll: async (params: INotificationQueryParams = {}): Promise<INotificationListResponse> => {
		const cacheKey = JSON.stringify({
			page: params.page ?? 1,
			limit: params.limit ?? 10,
			is_read: params.is_read,
		});

		if (inFlightRequests.has(cacheKey)) {
			return inFlightRequests.get(cacheKey)!;
		}

		const promise = (async () => {
			try {
				return await apiClient<INotificationListResponse>(NOTIFICATION_ENDPOINTS.GET_ALL, {
					params: {
						page: params.page ?? 1,
						limit: params.limit ?? 10,
						...(params.is_read !== undefined && { is_read: params.is_read }),
					},
				});
			} finally {
				// Clear from in-flight cache after request completes
				inFlightRequests.delete(cacheKey);
			}
		})();

		inFlightRequests.set(cacheKey, promise);
		return promise;
	},

	/**
	 * Mark a single notification as read
	 */
	markAsRead: async (id: number | string): Promise<IMarkNotificationResponse> => {
		return apiClient<IMarkNotificationResponse>(NOTIFICATION_ENDPOINTS.MARK_READ(id));
	},

	/**
	 * Mark all notifications as read
	 */
	markAllAsRead: async (): Promise<IMarkNotificationResponse> => {
		return apiClient<IMarkNotificationResponse>(NOTIFICATION_ENDPOINTS.MARK_ALL_READ);
	},
};

export default notificationService;
