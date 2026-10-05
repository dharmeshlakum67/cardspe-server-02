import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { ThemeProvider } from 'react-jss';
import { ReactNotifications } from 'react-notifications-component';
import { useFullscreen } from 'react-use';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ToastContainer } from 'react-toastify';
import ThemeContext from '../contexts/themeContext';
import Wrapper from '../layout/Wrapper/Wrapper';
import Portal from '../layout/Portal/Portal';
import useDarkMode from '../hooks/useDarkMode';
import COLORS from '../common/data/enumColors';
import { getOS } from '../helpers/helpers';
import AsideRoutes from '../layout/Aside/AsideRoutes';
import { ToastCloseButton } from '../components/bootstrap/Toasts';
import SocketNotificationListener from '../components/common/SocketNotificationListener';

const App = () => {
	getOS();

	dayjs.extend(localizedFormat);
	dayjs.extend(relativeTime);

	/**
	 * Dark Mode
	 */
	const { themeStatus, darkModeStatus } = useDarkMode();
	const theme = {
		theme: themeStatus,
		primary: COLORS.PRIMARY.code,
		secondary: COLORS.SECONDARY.code,
		success: COLORS.SUCCESS.code,
		info: COLORS.INFO.code,
		warning: COLORS.WARNING.code,
		danger: COLORS.DANGER.code,
		dark: COLORS.DARK.code,
		light: COLORS.LIGHT.code,
	};

	useEffect(() => {
		document.documentElement.removeAttribute('theme');
		document.documentElement.removeAttribute('data-bs-theme');
	}, []);

	/**
	 * Full Screen
	 */
	const { fullScreenStatus, setFullScreenStatus } = useContext(ThemeContext);
	const ref = useRef(null);
	useFullscreen(ref, fullScreenStatus, {
		onClose: () => setFullScreenStatus(false),
	});

	/**
	 * Modern Design
	 */
	useLayoutEffect(() => {
		if (process.env.REACT_APP_MODERN_DESGIN === 'true') {
			document.body.classList.add('modern-design');
		} else {
			document.body.classList.remove('modern-design');
		}
	});

	return (
		<ThemeProvider theme={theme}>
			<SocketNotificationListener />
			<div
				ref={ref}
				className='app'
				style={{
					backgroundColor: fullScreenStatus ? 'var(--bs-body-bg)' : undefined,
					zIndex: fullScreenStatus ? 1 : undefined,
					overflow: fullScreenStatus ? 'scroll' : undefined,
				}}>
				<AsideRoutes />
				<Wrapper />
			</div>
			<Portal id='portal-notification'>
				<ReactNotifications />
			</Portal>
			<ToastContainer closeButton={ToastCloseButton} toastClassName='toast show' />
		</ThemeProvider>
	);
};

export default App;
