import { useContext } from 'react';
import { useWindowSize } from 'react-use';
import ThemeContext from '../contexts/themeContext';

const useNavigationItemHandle = () => {
	const { setAsideStatus, setLeftMenuStatus, setRightMenuStatus } = useContext(ThemeContext);
	const { width } = useWindowSize();
	const asideMinimizeBreakpoint =
		Number(process.env.REACT_APP_ASIDE_MINIMIZE_BREAKPOINT_SIZE) || 1024;

	return () => {
		if (width < asideMinimizeBreakpoint) setAsideStatus(false);
		setLeftMenuStatus(false);
		setRightMenuStatus(false);
	};
};
export default useNavigationItemHandle;
