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

	const event = (payload.event || '').toUpperCase();

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

	// Trigger browser event so any active page (e.g. KYC, notification bell) can auto-refresh
	if (typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent('SOCKET_NOTIFICATION_RECEIVED', {
				detail: payload,
			}),
		);
	}
};

export default showSocketNotification;
