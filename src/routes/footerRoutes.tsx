import { RouteProps } from 'react-router-dom';

const footers: RouteProps[] = [
	{ path: 'auth-pages/*', element: null },
	{ path: '*', element: null },
];

export default footers;
