import { Store } from 'react-notifications-component';

const showNotification = (
	title: string | JSX.Element,
	message?: string | JSX.Element,
	type = 'default',
) => {
	const finalTitle = title;
	const finalMessage = message !== undefined && message !== null ? message : '';
	Store.addNotification({
		title: finalTitle,
		message: finalMessage,
		// @ts-ignore
		type,
		insert: 'top',
		container: 'top-right',
		animationIn: ['animate__animated', 'animate__fadeInRight'],
		animationOut: ['animate__animated', 'animate__fadeOutRight'],
		dismiss: {
			duration: 4000,
			pauseOnHover: true,
			onScreen: true,
			showIcon: true,
			waitForAnimation: true,
		},
	});
};

export default showNotification;
