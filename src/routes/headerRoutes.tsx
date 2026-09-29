import React, { FC } from 'react';
import { RouteProps } from 'react-router-dom';
import { authPagesMenu, dashboardPagesMenu } from '../menu';
import DashboardHeader from '../pages/_layout/_headers/DashboardHeader';
import DefaultHeader from '../pages/_layout/_headers/DefaultHeader';
import authService from '../pages/presentation/auth/services/authService';

const DefaultHeaderWithAuth: FC = () => {
	if (authService.isAuthenticated()) {
		return <DefaultHeader />;
	}
	return null;
};

const DashboardHeaderWithAuth: FC = () => {
	if (authService.isAuthenticated()) {
		return <DashboardHeader />;
	}
	return null;
};

const headers: RouteProps[] = [
	{ path: authPagesMenu.page404.path, element: <DefaultHeaderWithAuth /> },
	{ path: 'auth-pages/*', element: null },
	{ path: 'auth-pages', element: null },
	{ path: 'resetpassword/*', element: null },
	{ path: 'reset-password/*', element: null },
	{ path: dashboardPagesMenu.dashboard.path, element: <DashboardHeaderWithAuth /> },
	{ path: '*', element: <DefaultHeaderWithAuth /> },
];

export default headers;

