export const dashboardPagesMenu = {
	dashboard: {
		id: 'dashboard',
		text: 'Dashboard',
		path: '/',
		icon: 'Dashboard',
		subMenu: null,
	},
};

export const adminPagesMenu = {
	profile: {
		id: 'profile',
		text: 'Profile',
		path: 'admin/profile',
		icon: 'Person',
	},
};

export const authPagesMenu = {
	login: {
		id: 'login',
		text: 'Login',
		path: 'auth-pages/login',
		icon: 'Login',
	},
	signup: {
		id: 'signup',
		text: 'Signup',
		path: 'auth-pages/signup',
		icon: 'PersonAdd',
	},
	page404: {
		id: 'Page404',
		text: '404 Page',
		path: 'auth-pages/404',
		icon: 'ReportGmailerrorred',
	},
	forgotPassword: {
		id: 'forgotPassword',
		text: 'Forgot Password',
		path: 'auth-pages/forgot-password',
		icon: 'LockReset',
	},
	resetPassword: {
		id: 'resetPassword',
		text: 'Reset Password',
		path: 'auth-pages/reset-password/:token',
		icon: 'Key',
	},
	verifyEmail: {
		id: 'verifyEmail',
		text: 'Verify Email',
		path: 'auth/verify-email/:confirmationToken',
		icon: 'MarkEmailRead',
	},
};

// Aliases for compatibility
export const demoPagesMenu = authPagesMenu;
export const pageLayoutTypesPagesMenu = {};
export const componentPagesMenu = {};
export const gettingStartedPagesMenu = {};
