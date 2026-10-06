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

		// 1. GENERIC NOTIFICATION LISTENERS
		const newNotifHandler = handleNotification(SOCKET_EVENT_CONSTANT.NEW_NOTIFICATION);
		const notifHandler = handleNotification(SOCKET_EVENT_CONSTANT.NOTIFICATION);

		// 2. WALLET TRANSACTION LISTENERS
		const walletRequestedHandler = handleNotification(SOCKET_EVENT_CONSTANT.WALLET_TRANSACTION.REQUESTED);
		const walletApprovedHandler = handleNotification(SOCKET_EVENT_CONSTANT.WALLET_TRANSACTION.APPROVED);
		const walletRejectedHandler = handleNotification(SOCKET_EVENT_CONSTANT.WALLET_TRANSACTION.REJECTED);

		// 3. KYC REQUEST LISTENERS
		const kycSubmittedHandler = handleNotification(SOCKET_EVENT_CONSTANT.KYC_REQUEST.SUBMITTED);
		const kycApprovedHandler = handleNotification(SOCKET_EVENT_CONSTANT.KYC_REQUEST.APPROVED);
		const kycRejectedHandler = handleNotification(SOCKET_EVENT_CONSTANT.KYC_REQUEST.REJECTED);

		// 4. API KEY REQUEST LISTENERS
		const apiKeySubmittedHandler = handleNotification(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.SUBMITTED);
		const apiKeyApprovedHandler = handleNotification(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.APPROVED);
		const apiKeyRejectedHandler = handleNotification(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.REJECTED);

		// ATTACH LISTENERS
		socket.on(SOCKET_EVENT_CONSTANT.NEW_NOTIFICATION, newNotifHandler);
		socket.on(SOCKET_EVENT_CONSTANT.NOTIFICATION, notifHandler);

		socket.on(SOCKET_EVENT_CONSTANT.WALLET_TRANSACTION.REQUESTED, walletRequestedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.WALLET_TRANSACTION.APPROVED, walletApprovedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.WALLET_TRANSACTION.REJECTED, walletRejectedHandler);

		socket.on(SOCKET_EVENT_CONSTANT.KYC_REQUEST.SUBMITTED, kycSubmittedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.KYC_REQUEST.APPROVED, kycApprovedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.KYC_REQUEST.REJECTED, kycRejectedHandler);

		socket.on(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.SUBMITTED, apiKeySubmittedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.APPROVED, apiKeyApprovedHandler);
		socket.on(SOCKET_EVENT_CONSTANT.API_KEY_REQUEST.REJECTED, apiKeyRejectedHandler);

		// Aliases
		socket.on('notification', notifHandler);
		socket.on('new_notification', newNotifHandler);

		return () => {
			socket.off(SOCKET_EVENT_CONSTANT.NEW_NOTIFICATION, newNotifHandler);
			socket.off(SOCKET_EVENT_CONSTANT.NOTIFICATION, notifHandler);

			socket.off(SOCKET_EVENT_CONSTANT.WALLET_TRANSACTION.REQUESTED, walletRequestedHandler);
			socket.off(SOCKET_EVENT_CONSTANT.WALLET_TRANSACTION.APPROVED, walletApprovedHandler);
			socket.off(SOCKET_EVENT_CONSTANT.WALLET_TRANSACTION.REJECTED, walletRejectedHandler);

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
