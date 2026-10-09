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
	KYC: 'profile/kyc',
	PROFILE_WALLET: 'profile/wallet',
	MY_WALLET: 'profile/wallet',
	MY_WALLET_TRANSACTIONS: 'profile/wallet',
	MY_COMMISSION: 'profile/commission',

	// USER MANAGEMENT / ROLES, USERS, KYC REQUESTS & BLOCK HISTORY
	USERS: 'users',
	USERS_ADD: 'users/add',
	USERS_VIEW: 'users/view/:id',
	USERS_EDIT: 'users/edit/:id',
	ROLES: 'roles',
	ROLES_ADD: 'roles/add',
	ROLES_VIEW: 'roles/view/:id',
	ROLES_EDIT: 'roles/edit/:id',
	KYC_REQUESTS: 'kyc-requests',
	KYC_REQUESTS_VIEW: 'kyc-requests/view/:id',
	BLOCK_HISTORY: 'users/block-history',
	MANAGE_COMMISSION: 'users/manage-commission',

	// MASTER / DOCUMENT TYPE & STATE
	DOCUMENT_TYPE: 'master/document-type',
	DOCUMENT_TYPE_ADD: 'master/document-type/add',
	DOCUMENT_TYPE_VIEW: 'master/document-type/view/:id',
	DOCUMENT_TYPE_EDIT: 'master/document-type/edit/:id',
	STATE: 'master/state',
	STATE_ALT: 'state',

	// SERVICE MANAGEMENT / SERVICE CATEGORY, MOBILE PLAN TYPE, PAYMENT MODE & OPERATOR
	SERVICE_CATEGORY: 'service-management/service-category',
	MOBILE_PLAN_TYPE: 'service-management/mobile-plan-type',
	MOBILE_PLAN_TYPE_MASTER: 'master/mobile-plan-type',
	PAYMENT_MODE: 'service-management/payment-mode',
	OPERATORS: 'service-management/operators',
	OPERATOR: 'service-management/operators',
	OPERATOR_ADD: 'service-management/operators/add',
	OPERATOR_EDIT: 'service-management/operators/edit/:id',
	OPERATOR_VIEW: 'service-management/operators/view/:id',

	// PAYMENTS / BANK DETAILS & WALLET TRANSACTIONS
	BANK_DETAILS: 'payments/bank-details',
	WALLET_TRANSACTION: 'payments/wallet-transactions',
	WALLET_TRANSACTION_VIEW: 'payments/wallet-transactions/view/:id',

	// LOGIN HISTORY
	LOGIN_HISTORY: 'login-history',

	// SETTINGS
	SETTING: 'setting',
	SETTING_PAYMENT_GATEWAY: 'setting/payment-gateway',

	// DEVELOPER / API KEY REQUESTS & DOCUMENTATION
	API_KEY_REQUEST: 'developer/api-key',
	API_DOCUMENTATION: 'developer/api-documentation',
	API_DOCUMENTATION_ADD: 'developer/api-documentation/add',
	API_DOCUMENTATION_EDIT: 'developer/api-documentation/edit/:id',
	API_DOCUMENTATION_VIEW: 'developer/api-documentation/view/:id',
	API_DOCUMENTATION_PORTAL: 'developer/api-documentation/portal',
	API_DOCUMENTATION_PREVIEW: 'developer/api-documentation/preview/:slug',
} as const;

export type TPageRoutes = (typeof PAGE_ROUTES)[keyof typeof PAGE_ROUTES];

export default PAGE_ROUTES;
