// DASHBOARD TYPES & INTERFACES

export interface RoleCountStats {
	role_name: string;
	total: number;
	active: number;
	inactive: number;
	blocked: number;
	email_verified?: number;
	email_unverified?: number;
	mobile_verified?: number;
	mobile_unverified?: number;
	kyc_approved?: number;
	kyc_pending?: number;
	kyc_rejected?: number;
	kyc_not_submitted?: number;
}

export interface VerificationSummaryStats {
	email_verified: number;
	email_unverified: number;
	mobile_verified: number;
	mobile_unverified: number;
	kyc_approved: number;
	kyc_pending: number;
	kyc_rejected: number;
	kyc_not_submitted: number;
}

export interface ServiceAmountStats {
	service_name: string;
	total_amount: number;
	success_amount: number;
	pending_amount: number;
	fail_amount: number;
	total_count: number;
	success_count: number;
	pending_count: number;
	fail_count: number;
}

export interface DashboardQueryParams {
	start_date?: string;
	end_date?: string;
}

export interface DashboardSummaryResponse {
	is_mobile_verified?: boolean;
	is_email_verified?: boolean;
	kyc_status?: string;
	user_summary: RoleCountStats[];
	add_money_summary: ServiceAmountStats[];
	recharge_summary: ServiceAmountStats[];
	verification_summary?: VerificationSummaryStats;
}

export type TDatePreset =
	| 'today'
	| 'yesterday'
	| 'this_week'
	| 'last_week'
	| 'last_7_days'
	| 'this_month'
	| 'last_month'
	| 'custom';

export interface IDatePresetOption {
	id: TDatePreset;
	label: string;
}
