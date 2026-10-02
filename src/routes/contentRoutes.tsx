import React, { lazy } from 'react';
import { RouteProps } from 'react-router-dom';
import { PAGE_ROUTES } from '../constants/pageRoutes';
import Login from '../pages/presentation/auth/Login';
import Signup from '../pages/presentation/auth/Signup';
import ForgotPassword from '../pages/presentation/auth/ForgotPassword';
import ResetPassword from '../pages/presentation/auth/ResetPassword';
import VerifyEmail from '../pages/presentation/auth/VerifyEmail';
import Page404 from '../pages/presentation/auth/Page404';

const DashboardPage = lazy(() => import('../pages/presentation/dashboard/DashboardPage'));
const RoleListPage = lazy(() => import('../pages/presentation/role/RoleListPage'));
const RoleAddPage = lazy(() => import('../pages/presentation/role/RoleAddPage'));
const RoleViewPage = lazy(() => import('../pages/presentation/role/RoleViewPage'));
const RoleEditPage = lazy(() => import('../pages/presentation/role/RoleEditPage'));

const DocumentTypeListPage = lazy(
	() => import('../pages/presentation/master/documentType/DocumentTypeListPage'),
);
const DocumentTypeAddPage = lazy(
	() => import('../pages/presentation/master/documentType/DocumentTypeAddPage'),
);
const DocumentTypeViewPage = lazy(
	() => import('../pages/presentation/master/documentType/DocumentTypeViewPage'),
);
const DocumentTypeEditPage = lazy(
	() => import('../pages/presentation/master/documentType/DocumentTypeEditPage'),
);
const StateListPage = lazy(
	() => import('../pages/presentation/master/state/StateListPage'),
);
const ServiceCategoryListPage = lazy(
	() => import('../pages/presentation/service-management/service-category/ServiceCategoryListPage'),
);
const MobilePlanTypeListPage = lazy(
	() => import('../pages/presentation/service-management/mobile-plan-type/MobilePlanTypeListPage'),
);
const PaymentModeListPage = lazy(
	() => import('../pages/presentation/service-management/payment-mode/PaymentModeListPage'),
);
const ProfilePage = lazy(() => import('../pages/presentation/profile/ProfilePage'));
const KycPage = lazy(() => import('../pages/presentation/profile/kyc/KycPage'));
const SettingPage = lazy(() => import('../pages/presentation/setting/SettingPage'));
const LoginHistoryListPage = lazy(
	() => import('../pages/presentation/login-history/LoginHistoryListPage'),
);
const KycRequestListPage = lazy(
	() => import('../pages/presentation/user-management/kyc-requests/KycRequestListPage'),
);
const KycRequestViewPage = lazy(
	() => import('../pages/presentation/user-management/kyc-requests/KycRequestViewPage'),
);
const UserListPage = lazy(
	() => import('../pages/presentation/user-management/users/UserListPage'),
);
const UserAddPage = lazy(
	() => import('../pages/presentation/user-management/users/UserAddPage'),
);
const UserViewPage = lazy(
	() => import('../pages/presentation/user-management/users/UserViewPage'),
);
const UserEditPage = lazy(
	() => import('../pages/presentation/user-management/users/UserEditPage'),
);
const BlockHistoryListPage = lazy(
	() => import('../pages/presentation/user-management/block-history/BlockHistoryListPage'),
);

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
		path: PAGE_ROUTES.VERIFY_EMAIL,
		element: <VerifyEmail />,
	},
	{
		path: PAGE_ROUTES.DASHBOARD,
		element: <DashboardPage />,
	},
	{
		path: PAGE_ROUTES.PROFILE,
		element: <ProfilePage />,
	},
	{
		path: PAGE_ROUTES.KYC,
		element: <KycPage />,
	},
	{
		path: PAGE_ROUTES.USERS,
		element: <UserListPage />,
	},
	{
		path: PAGE_ROUTES.USERS_ADD,
		element: <UserAddPage />,
	},
	{
		path: PAGE_ROUTES.USERS_VIEW,
		element: <UserViewPage />,
	},
	{
		path: PAGE_ROUTES.USERS_EDIT,
		element: <UserEditPage />,
	},
	{
		path: PAGE_ROUTES.ROLES,
		element: <RoleListPage />,
	},
	{
		path: PAGE_ROUTES.ROLES_ADD,
		element: <RoleAddPage />,
	},
	{
		path: PAGE_ROUTES.ROLES_VIEW,
		element: <RoleViewPage />,
	},
	{
		path: PAGE_ROUTES.ROLES_EDIT,
		element: <RoleEditPage />,
	},
	{
		path: PAGE_ROUTES.KYC_REQUESTS,
		element: <KycRequestListPage />,
	},
	{
		path: PAGE_ROUTES.KYC_REQUESTS_VIEW,
		element: <KycRequestViewPage />,
	},
	{
		path: PAGE_ROUTES.BLOCK_HISTORY,
		element: <BlockHistoryListPage />,
	},
	{
		path: PAGE_ROUTES.DOCUMENT_TYPE,
		element: <DocumentTypeListPage />,
	},
	{
		path: PAGE_ROUTES.DOCUMENT_TYPE_ADD,
		element: <DocumentTypeAddPage />,
	},
	{
		path: PAGE_ROUTES.DOCUMENT_TYPE_VIEW,
		element: <DocumentTypeViewPage />,
	},
	{
		path: PAGE_ROUTES.DOCUMENT_TYPE_EDIT,
		element: <DocumentTypeEditPage />,
	},
	{
		path: PAGE_ROUTES.STATE,
		element: <StateListPage />,
	},
	{
		path: PAGE_ROUTES.SERVICE_CATEGORY,
		element: <ServiceCategoryListPage />,
	},
	{
		path: PAGE_ROUTES.MOBILE_PLAN_TYPE,
		element: <MobilePlanTypeListPage />,
	},
	{
		path: PAGE_ROUTES.MOBILE_PLAN_TYPE_MASTER,
		element: <MobilePlanTypeListPage />,
	},
	{
		path: PAGE_ROUTES.PAYMENT_MODE,
		element: <PaymentModeListPage />,
	},
	{
		path: PAGE_ROUTES.LOGIN_HISTORY,
		element: <LoginHistoryListPage />,
	},
	{
		path: PAGE_ROUTES.SETTING,
		element: <SettingPage />,
	},
	{
		path: '*',
		element: <Page404 />,
	},
];

export default contents;
