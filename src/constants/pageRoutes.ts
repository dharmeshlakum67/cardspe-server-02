// FRONTEND PAGE ROUTE CONSTANTS

export const PAGE_ROUTES = {
	ROOT: '/',
	DASHBOARD: '/',

	// AUTHENTICATION
	LOGIN: 'auth-pages/login',
	FORGOT_PASSWORD: 'auth-pages/forgot-password',
	RESET_PASSWORD: 'auth-pages/reset-password/:token',
	PAGE_404: 'auth-pages/404',

	// ADMIN & PROFILE
	PROFILE: 'admin/profile',
} as const;

export type TPageRoutes = (typeof PAGE_ROUTES)[keyof typeof PAGE_ROUTES];

export default PAGE_ROUTES;

