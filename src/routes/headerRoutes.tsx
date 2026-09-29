import React, { FC } from 'react';
import { RouteProps } from 'react-router-dom';
import { authPagesMenu, dashboardPagesMenu } from '../menu';
import DashboardHeader from '../pages/_layout/_headers/DashboardHeader';
import DefaultHeader from '../pages/_layout/_headers/DefaultHeader';
import { ENV } from '../config/env.config';

const Page404Header: FC = () => {
	const token = localStorage.getItem(ENV.TOKEN_KEY);
	if (token) {
		return <DefaultHeader />;
	}
	return null;
};

const headers: RouteProps[] = [
	{ path: authPagesMenu.page404.path, element: <Page404Header /> },
	{ path: 'auth-pages/*', element: null },
	{ path: 'auth-pages', element: null },
	{ path: 'resetpassword/*', element: null },
	{ path: 'reset-password/*', element: null },
	{ path: dashboardPagesMenu.dashboard.path, element: <DashboardHeader /> },
	{ path: '*', element: <DefaultHeader /> },
];

export default headers;
