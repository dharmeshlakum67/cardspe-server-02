import { FC, useEffect } from 'react';
import useSocket from '../../hooks/useSocket';
import { SOCKET_EVENT_CONSTANT } from '../../constants/socketEvents';
import { showSocketNotification, ISocketNotificationPayload } from '../extras/showSocketNotification';

/**
 * Global component that listens to real-time socket events and displays
 * animated notifications at the bottom-right of the screen for a set duration.
 */
export const SocketNotificationListener: FC = () => {
	const { socket, isConnected } = useSocket();

	useEffect(() => {
		if (!socket || !isConnected) return undefined;

		const handleNotification = (event: string) => (data: any) => {
			console.log(`🔔 [Socket Event Received: ${event}]`, data);

			let payload: ISocketNotificationPayload;

			if (typeof data === 'string') {
				payload = { message: data, event };
			} else if (data && typeof data === 'object') {
				const nested = data.data || data.notification || data.payload || data;
				payload = {
					...nested,
					message: nested.message || data.message || 'You have a new notification.',
					event: nested.event || data.event || event,
					model_name: nested.model_name || data.model_name,
					notification_type: nested.notification_type || data.notification_type,
				};
			} else {
				payload = { message: 'You have a new notification.', event };
			}

			// Display the bottom-right toast notification
			showSocketNotification(payload, 6000, 'bottom-right');
		};

		// REGISTER ALL SOCKET EVENT LISTENERS
		const newNotifHandler = handleNotification(SOCKET_EVENT_CONSTANT.NEW_NOTIFICATION);
		const notifHandler = handleNotification(SOCKET_EVENT_CONSTANT.NOTIFICATION);
		const kycSubmittedHandler = handleNotification(SOCKET_EVENT_CONSTANT.KYC_REQUEST.SUBMITTED);
		const kycApprovedHandler = handleNotification(SOCKET_EVENT_CONSTANT.KYC_REQUEST.APPROVED);
		const kycRejectedHandler = handleNotification(SOCKET_EVENT_CONSTANT.KYC_REQUEST.REJECTED);
		const apiKeySubmittedHandler = handleNotification(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.SUBMITTED);
		const apiKeyApprovedHandler = handleNotification(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.APPROVED);
		const apiKeyRejectedHandler = handleNotification(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.REJECTED);

		socket.on(SOCKET_EVENT_CONSTANT.NEW_NOTIFICATION, newNotifHandler);
		socket.on(SOCKET_EVENT_CONSTANT.NOTIFICATION, notifHandler);
		socket.on(SOCKET_EVENT_CONSTANT.KYC_REQUEST.SUBMITTED, kycSubmittedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.KYC_REQUEST.APPROVED, kycApprovedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.KYC_REQUEST.REJECTED, kycRejectedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.SUBMITTED, apiKeySubmittedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.APPROVED, apiKeyApprovedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.REJECTED, apiKeyRejectedHandler);

		// Also listen to lower-case / generic aliases if any
		socket.on('notification', notifHandler);
		socket.on('new_notification', newNotifHandler);

		return () => {
			socket.off(SOCKET_EVENT_CONSTANT.NEW_NOTIFICATION, newNotifHandler);
			socket.off(SOCKET_EVENT_CONSTANT.NOTIFICATION, notifHandler);
			socket.off(SOCKET_EVENT_CONSTANT.KYC_REQUEST.SUBMITTED, kycSubmittedHandler);
			socket.off(SOCKET_EVENT_CONSTANT.KYC_REQUEST.APPROVED, kycApprovedHandler);
			socket.off(SOCKET_EVENT_CONSTANT.KYC_REQUEST.REJECTED, kycRejectedHandler);
			socket.off(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.SUBMITTED, apiKeySubmittedHandler);
			socket.off(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.APPROVED, apiKeyApprovedHandler);
			socket.off(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.REJECTED, apiKeyRejectedHandler);
			socket.off('notification', notifHandler);
			socket.off('new_notification', newNotifHandler);
		};
	}, [socket, isConnected]);

	return null;
};

export default SocketNotificationListener;
