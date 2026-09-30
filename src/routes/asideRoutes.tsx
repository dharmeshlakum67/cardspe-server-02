import React, { FC } from 'react';
import { RouteProps } from 'react-router-dom';
import DefaultAside from '../pages/_layout/_asides/DefaultAside';
import { authPagesMenu } from '../menu';
import authService from '../pages/presentation/auth/services/authService';

const DefaultAsideWithAuth: FC = () => {
	if (authService.isAuthenticated()) {
		return <DefaultAside />;
	}
	return null;
};

const asides: RouteProps[] = [
	{ path: authPagesMenu.page404.path, element: <DefaultAsideWithAuth /> },
	{ path: 'auth-pages/*', element: null },
	{ path: 'auth-pages', element: null },
	{ path: 'auth/*', element: null },
	{ path: 'auth', element: null },
	{ path: 'resetpassword/*', element: null },
	{ path: 'reset-password/*', element: null },
	{ path: '*', element: <DefaultAsideWithAuth /> },
];

export default asides;

