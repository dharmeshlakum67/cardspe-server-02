import { apiClient } from '../../../../services/apiClient';
import { AUTH_ENDPOINTS } from '../../../../constants/apiEndpoints';
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
