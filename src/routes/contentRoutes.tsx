import React, { lazy } from 'react';
import { RouteProps } from 'react-router-dom';
import { PAGE_ROUTES } from '../constants/pageRoutes';
import Login from '../pages/presentation/auth/Login';
import Signup from '../pages/presentation/auth/Signup';
import ForgotPassword from '../pages/presentation/auth/ForgotPassword';
import ResetPassword from '../pages/presentation/auth/ResetPassword';
import Page404 from '../pages/presentation/auth/Page404';

const DashboardPage = lazy(() => import('../pages/presentation/dashboard/DashboardPage'));

const contents: RouteProps[] = [
	{
		path: PAGE_ROUTES.LOGIN,
		element: <Login />,
	},
	{
		path: PAGE_ROUTES.SIGNUP,
		element: <Signup />,
	},
	{
		path: PAGE_ROUTES.FORGOT_PASSWORD,
		element: <ForgotPassword />,
	},
	{
		path: PAGE_ROUTES.RESET_PASSWORD,
		element: <ResetPassword />,
	},
	{
		path: PAGE_ROUTES.DASHBOARD,
		element: <DashboardPage />,
	},
	{
		path: '*',
		element: <Page404 />,
	},
];

export default contents;
