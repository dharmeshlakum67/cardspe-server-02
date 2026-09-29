import React, { createContext, useLayoutEffect, useState, useMemo, FC, ReactNode } from 'react';
import PropTypes from 'prop-types';
import useDeviceScreen from '../hooks/useDeviceScreen';

export interface IThemeContextProps {
	asideStatus: boolean;
	darkModeStatus: boolean;
	fullScreenStatus: boolean;
	leftMenuStatus: boolean;
	mobileDesign: boolean;
	rightMenuStatus: boolean;
	rightPanel: boolean;
	setAsideStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setDarkModeStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setFullScreenStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setLeftMenuStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setRightMenuStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setRightPanel: (value: ((prevState: boolean) => boolean) | boolean) => void;
}
const ThemeContext = createContext<IThemeContextProps>({} as IThemeContextProps);

interface IThemeContextProviderProps {
	children: ReactNode;
}
export const ThemeContextProvider: FC<IThemeContextProviderProps> = ({ children }) => {
	const deviceScreen = useDeviceScreen();
	const mobileBreakpoint = Number(process.env.REACT_APP_MOBILE_BREAKPOINT_SIZE) || 768;
	const asideMinimizeBreakpoint =
		Number(process.env.REACT_APP_ASIDE_MINIMIZE_BREAKPOINT_SIZE) || 1024;
	const mobileDesign = (deviceScreen?.width || 0) <= mobileBreakpoint;

	// Remove any legacy dark mode status from localStorage
	try {
		localStorage.removeItem('facit_darkModeStatus');
	} catch (e) {
		// ignore
	}

	const [darkModeStatus, setDarkModeStatus] = useState(false);
	const [fullScreenStatus, setFullScreenStatus] = useState(false);
	const [leftMenuStatus, setLeftMenuStatus] = useState(false);
	const [rightMenuStatus, setRightMenuStatus] = useState(false);

	// INITIALIZE ASIDE STATUS: COLLAPSED ON MOBILE, SAVED STATE ON DESKTOP
	const [asideStatus, setAsideStatus] = useState<boolean>(() => {
		const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
		if (screenWidth < mobileBreakpoint) {
			return false;
		}
		const saved = localStorage.getItem('facit_asideStatus');
		if (saved !== null) {
			return saved === 'true';
		}
		return screenWidth >= asideMinimizeBreakpoint;
	});

	useLayoutEffect(() => {
		if ((deviceScreen?.width || 0) >= asideMinimizeBreakpoint) {
			localStorage.setItem('facit_asideStatus', asideStatus?.toString());
		}
	}, [asideStatus, deviceScreen.width, asideMinimizeBreakpoint]);

	const [rightPanel, setRightPanel] = useState(false);

	useLayoutEffect(() => {
		const currentWidth = deviceScreen?.width || 0;
		if (currentWidth >= asideMinimizeBreakpoint) {
			const saved = localStorage.getItem('facit_asideStatus');
			if (saved !== null) {
				setAsideStatus(saved === 'true');
			} else {
				setAsideStatus(true);
			}
			setLeftMenuStatus(false);
			setRightMenuStatus(false);
		} else {
			setAsideStatus(false);
			setLeftMenuStatus(false);
			setRightMenuStatus(false);
		}
	}, [deviceScreen.width, asideMinimizeBreakpoint]);

	const values: IThemeContextProps = useMemo(
		() => ({
			mobileDesign,
			darkModeStatus,
			setDarkModeStatus,
			fullScreenStatus,
			setFullScreenStatus,
			asideStatus,
			setAsideStatus,
			leftMenuStatus,
			setLeftMenuStatus,
			rightMenuStatus,
			setRightMenuStatus,
			rightPanel,
			setRightPanel,
		}),
		[
			asideStatus,
			darkModeStatus,
			fullScreenStatus,
			leftMenuStatus,
			mobileDesign,
			rightMenuStatus,
			rightPanel,
		],
	);

	return <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>;
};
ThemeContextProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default ThemeContext;
