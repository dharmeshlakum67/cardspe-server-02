import { apiClient } from '../../../../services/apiClient';
import { AUTH_ENDPOINTS, ROLE_ENDPOINTS } from '../../../../constants/apiEndpoints';
import { ENV } from '../../../../config/env.config';
import {
	ILoginCredentials,
	ILoginResponse,
	IAuthUser,
	IMeResponse,
	IForgotPasswordPayload,
	IForgotPasswordResponse,
	IResetPasswordPayload,
	IResetPasswordResponse,
	IRoleResponse,
	IRegisterPayload,
	IRegisterResponse,
	IVerifyOTPPayload,
	IVerifyOTPResponse,
	IResendOTPPayload,
	IResendOTPResponse,
} from '../types/authTypes';

// Re-export all auth types for convenience
export * from '../types/authTypes';

// AUTH SERVICES
export const authService = {
	// LOGIN
	async login(credentials: ILoginCredentials): Promise<ILoginResponse> {
		const response = await apiClient<ILoginResponse>(AUTH_ENDPOINTS.LOGIN, {
			method: AUTH_ENDPOINTS.LOGIN.method,
			body: {
				identifier: credentials.identifier,
				password: credentials.password,
			},
			requiresAuth: false,
		});

		// STORE ONLY TOKEN IN LOCALSTORAGE (NO USER DATA)
		const token = response?.data?.token;
		if (token) {
			localStorage.setItem(ENV.TOKEN_KEY, token);
		}
		// PURGE ANY POTENTIAL USER OBJECTS FROM STORAGE
		localStorage.removeItem('cardspe_user');
		localStorage.removeItem('user');
		sessionStorage.removeItem('cardspe_user');
		sessionStorage.removeItem('user');

		return response;
	},

	// GET ACTIVE SIGNUP ROLES (WITH PAGINATION SUPPORT)
	async getActiveSignupRoles(page: number = 1, limit: number = 10): Promise<IRoleResponse> {
		return apiClient<IRoleResponse>(
			`${ROLE_ENDPOINTS.GET_ACTIVE_SIGNUP_ROLES.url}?page=${page}&limit=${limit}`,
			{
				method: ROLE_ENDPOINTS.GET_ACTIVE_SIGNUP_ROLES.method,
				requiresAuth: false,
			},
		);
	},

	// REGISTER / SIGNUP
	async register(payload: IRegisterPayload): Promise<IRegisterResponse> {
		return apiClient<IRegisterResponse>(AUTH_ENDPOINTS.REGISTER, {
			method: AUTH_ENDPOINTS.REGISTER.method,
			body: payload,
			requiresAuth: false,
		});
	},

	// VERIFY OTP
	async verifyOTP(payload: IVerifyOTPPayload): Promise<IVerifyOTPResponse> {
		const response = await apiClient<IVerifyOTPResponse>(AUTH_ENDPOINTS.VERIFY_OTP, {
			method: AUTH_ENDPOINTS.VERIFY_OTP.method,
			body: payload,
			requiresAuth: false,
		});

		// STORE TOKEN ON SUCCESSFUL VERIFICATION (COMPATIBLE WITH LOGIN RESPONSE STRUCTURE)
		const token = response?.token || response?.data?.token;
		if (token) {
			localStorage.setItem(ENV.TOKEN_KEY, token);
		}
		localStorage.removeItem('cardspe_user');
		localStorage.removeItem('user');
		sessionStorage.removeItem('cardspe_user');
		sessionStorage.removeItem('user');

		return response;
	},

	// RESEND OTP
	async resendOTP(payload: IResendOTPPayload): Promise<IResendOTPResponse> {
		return apiClient<IResendOTPResponse>(AUTH_ENDPOINTS.RESEND_OTP, {
			method: AUTH_ENDPOINTS.RESEND_OTP.method,
			body: payload,
			requiresAuth: false,
		});
	},

	// GET ME PROFILE
	async getMe(): Promise<IAuthUser> {
		const response = await apiClient<IMeResponse>(AUTH_ENDPOINTS.ME, {
			method: AUTH_ENDPOINTS.ME.method,
			requiresAuth: true,
		});

		return response.data;
	},

	// FORGOT PASSWORD
	async forgotPassword(payload: IForgotPasswordPayload): Promise<IForgotPasswordResponse> {
		return apiClient<IForgotPasswordResponse>(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
			method: AUTH_ENDPOINTS.FORGOT_PASSWORD.method,
			body: payload,
			requiresAuth: false,
		});
	},

	// RESET PASSWORD
	async resetPassword(token: string, payload: IResetPasswordPayload): Promise<IResetPasswordResponse> {
		return apiClient<IResetPasswordResponse>(AUTH_ENDPOINTS.RESET_PASSWORD(token), {
			body: payload,
			requiresAuth: false,
		});
	},

	// LOGOUT
	logout(): void {
		localStorage.removeItem(ENV.TOKEN_KEY);
		localStorage.removeItem('cardspe_user');
		localStorage.removeItem('user');
		sessionStorage.removeItem(ENV.TOKEN_KEY);
		sessionStorage.removeItem('cardspe_user');
		sessionStorage.removeItem('user');
	},

	// GET TOKEN
	getToken(): string | null {
		return localStorage.getItem(ENV.TOKEN_KEY) || sessionStorage.getItem(ENV.TOKEN_KEY);
	},

	// CHECK FOR THE AUTH
	isAuthenticated(): boolean {
		return !!this.getToken();
	},
};

export default authService;
