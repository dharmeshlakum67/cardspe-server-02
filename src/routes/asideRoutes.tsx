import React, { FC } from 'react';
import { RouteProps } from 'react-router-dom';
import DefaultAside from '../pages/_layout/_asides/DefaultAside';
import { authPagesMenu } from '../menu';
import { ENV } from '../config/env.config';

const Page404Aside: FC = () => {
	const token = localStorage.getItem(ENV.TOKEN_KEY);
	if (token) {
		return <DefaultAside />;
	}
	return null;
};

const asides: RouteProps[] = [
	{ path: authPagesMenu.page404.path, element: <Page404Aside /> },
	{ path: 'auth-pages/*', element: null },
	{ path: 'auth-pages', element: null },
	{ path: 'resetpassword/*', element: null },
	{ path: 'reset-password/*', element: null },
	{ path: '*', element: <DefaultAside /> },
];

export default asides;
