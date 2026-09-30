// FRONTEND PAGE ROUTE CONSTANTS

export const PAGE_ROUTES = {
	ROOT: '/',
	DASHBOARD: '/',

	// AUTHENTICATION
	LOGIN: 'auth-pages/login',
	SIGNUP: 'auth-pages/signup',
	FORGOT_PASSWORD: 'auth-pages/forgot-password',
	RESET_PASSWORD: 'auth-pages/reset-password/:token',
	VERIFY_EMAIL: 'auth/verify-email/:confirmationToken',
	VERIFY_EMAIL_ALT: 'auth-pages/verify-email/:confirmationToken',
	PAGE_404: 'auth-pages/404',

	// ADMIN & PROFILE
	PROFILE: 'admin/profile',

	// USER MANAGEMENT / ROLES
	ROLES: 'roles',
	ROLES_ADD: 'roles/add',
	ROLES_VIEW: 'roles/view/:id',
	ROLES_EDIT: 'roles/edit/:id',

	// MASTER / DOCUMENT TYPE & STATE
	DOCUMENT_TYPE: 'master/document-type',
	DOCUMENT_TYPE_ADD: 'master/document-type/add',
	DOCUMENT_TYPE_VIEW: 'master/document-type/view/:id',
	DOCUMENT_TYPE_EDIT: 'master/document-type/edit/:id',
	STATE: 'master/state',
	STATE_ALT: 'state',

	// SERVICE MANAGEMENT / SERVICE CATEGORY & MOBILE PLAN TYPE
	SERVICE_CATEGORY: 'service-management/service-category',
	MOBILE_PLAN_TYPE: 'service-management/mobile-plan-type',
	MOBILE_PLAN_TYPE_MASTER: 'master/mobile-plan-type',
} as const;

export type TPageRoutes = (typeof PAGE_ROUTES)[keyof typeof PAGE_ROUTES];

export default PAGE_ROUTES;
