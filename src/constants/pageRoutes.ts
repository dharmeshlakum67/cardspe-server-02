// FRONTEND PAGE ROUTE CONSTANTS

export const PAGE_ROUTES = {
	ROOT: '/',
	DASHBOARD: '/',

	// AUTHENTICATION
	LOGIN: 'auth-pages/login',
	SIGNUP: 'auth-pages/signup',
	FORGOT_PASSWORD: 'auth-pages/forgot-password',
	RESET_PASSWORD: 'auth-pages/reset-password/:token',
	PAGE_404: 'auth-pages/404',

	// ADMIN & PROFILE
	PROFILE: 'admin/profile',

	// USER MANAGEMENT / ROLES
	ROLES: 'roles',
	ROLES_ADD: 'roles/add',
	ROLES_VIEW: 'roles/view/:id',
	ROLES_EDIT: 'roles/edit/:id',
} as const;

export type TPageRoutes = (typeof PAGE_ROUTES)[keyof typeof PAGE_ROUTES];

export default PAGE_ROUTES;
