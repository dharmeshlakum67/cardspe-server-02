import React, { useContext } from 'react';
import { useWindowSize } from 'react-use';
import ThemeContext from '../../contexts/themeContext';

const WrapperOverlay = () => {
	const { width } = useWindowSize();
	const { asideStatus, setAsideStatus, setLeftMenuStatus, setRightMenuStatus } =
		useContext(ThemeContext);

	const asideMinimizeBreakpoint =
		Number(process.env.REACT_APP_ASIDE_MINIMIZE_BREAKPOINT_SIZE) || 1024;
	if (asideStatus && width < asideMinimizeBreakpoint)
		return (
			<div
				role='presentation'
				onClick={() => {
					setAsideStatus(false);
					setLeftMenuStatus(false);
					setRightMenuStatus(false);
				}}
				className='wrapper-overlay'
			/>
		);
	return null;
};

export default WrapperOverlay;
