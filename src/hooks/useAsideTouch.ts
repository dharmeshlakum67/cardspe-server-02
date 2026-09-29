import { useContext, useEffect, useState } from 'react';
import { useMotionValue, useTransform } from 'framer-motion';
import ThemeContext from '../contexts/themeContext';
import useDeviceScreen from './useDeviceScreen';

const useAsideTouch = () => {
	const { asideStatus } = useContext(ThemeContext);
	const deviceScreen = useDeviceScreen();

	const mobileDesign =
		typeof deviceScreen?.width !== 'undefined' &&
		deviceScreen?.width <= (Number(process.env.REACT_APP_MOBILE_BREAKPOINT_SIZE) || 768);
	const hasTouchButton =
		typeof deviceScreen?.width !== 'undefined' &&
		deviceScreen?.width >
		(Number(process.env.REACT_APP_ASIDE_MINIMIZE_BREAKPOINT_SIZE) || 1024);

	const asideWidthWithSpace =
		(parseInt(String(process.env.REACT_APP_ASIDE_WIDTH_PX), 10) +
			parseInt(String(process.env.REACT_APP_SPACER_PX), 10)) *
		-1;

	const x = useMotionValue(
		process.env.REACT_APP_ASIDE_TOUCH_STATUS === 'true' ? 0 : asideWidthWithSpace,
	);
	const [touchStatus, setTouchStatus] = useState(!x.get());
	const left = useTransform(
		x,
		[-100, -90, -10, 0],
		[asideWidthWithSpace, asideWidthWithSpace, 0, 0],
	);

	// X value get
	useEffect(() => {
		function updateX() {
			const X = x.get();
			setTouchStatus(!X);
		}

		// @ts-ignore
		const unsubscribeX = x.onChange(updateX);

		return () => {
			unsubscribeX();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Set Aside & Touch Button value
	useEffect(() => {
		if (!hasTouchButton) {
			x.set(0);
		}
		return () => { };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasTouchButton, deviceScreen.width]);

	// Synchronize asideStatus with touchStatus & motion value x
	useEffect(() => {
		if (!asideStatus) {
			x.set(0);
			setTouchStatus(false);
		} else {
			x.set(0);
			setTouchStatus(true);
		}
	}, [asideStatus, x]);

	const asideStyle = hasTouchButton ? { left } : undefined;

	return { asideStyle, touchStatus, hasTouchButton, asideWidthWithSpace, x };
};

export default useAsideTouch;
