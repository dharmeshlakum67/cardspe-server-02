import React, { FC, ReactNode, useContext } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import ThemeContext from '../../contexts/themeContext';

interface IPortalProps {
	children: ReactNode;
	id?: string;
}

const Portal: FC<IPortalProps> = ({ id = 'portal-root', children }) => {
	const { fullScreenStatus } = useContext(ThemeContext);

	if (fullScreenStatus) return children as React.ReactElement | null;
	const mount =
		(id ? document.getElementById(id) : null) ||
		document.getElementById('portal-root') ||
		(typeof document !== 'undefined' ? document.body : null);
	if (mount) return ReactDOM.createPortal(children, mount);
	return children as React.ReactElement | null;
};
Portal.propTypes = {
	children: PropTypes.node.isRequired,
	id: PropTypes.string,
};
Portal.defaultProps = {
	id: 'portal-root',
};

export default Portal;
