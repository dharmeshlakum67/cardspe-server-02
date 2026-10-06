import showNotification, { TNotificationPosition } from './showNotification';

export interface ISocketNotificationPayload {
	id?: number | string;
	title?: string;
	message?: string;
	notification_type?: string;
	model_name?: string;
	event?: string;
	[key: string]: any;
}

/**
 * Determine title based on payload or event
 */
const resolveNotificationTitle = (payload: ISocketNotificationPayload): string => {
	if (payload.title) return payload.title;

	const event = (payload.event || payload.notification_type || '').toUpperCase();

	if (event.includes('WALLET_TRANSACTION_REQUESTED')) return 'Wallet Top-Up Requested';
	if (event.includes('WALLET_TRANSACTION_APPROVED')) return 'Wallet Top-Up Approved';
	if (event.includes('WALLET_TRANSACTION_REJECTED')) return 'Wallet Top-Up Rejected';
	if (event.includes('KYC_REQUEST_SUBMITTED')) return 'KYC Request Submitted';
	if (event.includes('KYC_REQUEST_APPROVED')) return 'KYC Request Approved';
	if (event.includes('KYC_REQUEST_REJECTED')) return 'KYC Request Rejected';
	if (event.includes('API_KEY_REQUEST_SUBMITTED')) return 'API Key Request Submitted';
	if (event.includes('API_KEY_REQUEST_APPROVED')) return 'API Key Request Approved';
	if (event.includes('API_KEY_REQUEST_REJECTED')) return 'API Key Request Rejected';

	const modelName = payload.model_name ? payload.model_name.replace(/_/g, ' ') : '';
	if (modelName) {
		return modelName
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	return 'Real-Time Notification';
};

export const showSocketNotification = (
	payload: ISocketNotificationPayload,
	duration: number = 6000,
	position: TNotificationPosition = 'bottom-right',
) => {
	const messageText = payload.message || 'You have received a new update.';
	const titleText = resolveNotificationTitle(payload);

	showNotification(titleText, messageText, 'default', {
		position,
		duration,
		insert: 'bottom',
	});

	// Trigger browser event so any active page (e.g. Wallet, KYC, API Key) can auto-refresh
	if (typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent('SOCKET_NOTIFICATION_RECEIVED', {
				detail: payload,
			}),
		);
	}
};

export default showSocketNotification;
