import { Store } from 'react-notifications-component';

export type TNotificationPosition =
	| 'top-right'
	| 'top-left'
	| 'bottom-right'
	| 'bottom-left'
	| 'top-center'
	| 'bottom-center'
	| 'center';

export interface INotificationOptions {
	position?: TNotificationPosition;
	duration?: number;
	insert?: 'top' | 'bottom';
}

const showNotification = (
	title: string | JSX.Element,
	message?: string | JSX.Element,
	type = 'default',
	options?: INotificationOptions,
) => {
	const finalTitle = title;
	const finalMessage = message !== undefined && message !== null ? message : '';
	const container = options?.position || 'top-right';
	const duration = options?.duration !== undefined ? options.duration : 4000;
	const insert = options?.insert || (container.startsWith('bottom') ? 'bottom' : 'top');

	const isLeft = container.includes('left');
	const animationIn = isLeft
		? ['animate__animated', 'animate__fadeInLeft']
		: ['animate__animated', 'animate__fadeInRight'];
	const animationOut = isLeft
		? ['animate__animated', 'animate__fadeOutLeft']
		: ['animate__animated', 'animate__fadeOutRight'];

	Store.addNotification({
		title: finalTitle,
		message: finalMessage,
		// @ts-ignore
		type,
		insert,
		container,
		animationIn,
		animationOut,
		dismiss: {
			duration,
			pauseOnHover: true,
			onScreen: true,
			showIcon: true,
			waitForAnimation: true,
		},
	});
};

export default showNotification;
