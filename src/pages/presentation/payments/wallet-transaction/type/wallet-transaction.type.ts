// WALLET TRANSACTION ENUMS & TYPES
export type TWalletTransactionStatus = 'pending' | 'approve' | 'reject';
export type TWalletTransactionType = 'credit' | 'debit';
export type TWalletTransactionMode = 'custom' | 'payment_gateway' | 'bbps_transaction';
export type TTransactionCategory = 'add_money' | 'withdraw_money' | 'bbps_transaction' | string;
export type TAddMoneyType = 'custom' | 'merchant_payment_gateway';

export interface IWalletTransactionRole {
	id: number;
	role_name?: string;
	name?: string;
	slug?: string;
	role_type?: string;
}

export interface IWalletTransactionUser {
	id: number;
	name: string;
	username: string;
	company_name?: string | null;
	email_address: string;
	mobile_number: string;
	profile_picture?: string | null;
	role?: IWalletTransactionRole | null;
}

export interface IWalletTransaction {
	id: number;
	admin_id: number;
	amount: string | number;
	charge_amount: string | number;
	charges: Record<string, any> | null;
	payable_amount: string | number;
	status: TWalletTransactionStatus;
	pre_balance: string | number;
	post_balance: string | number;
	screenshot: string | null;
	ip_address: string | null;
	transaction_type: TWalletTransactionType;
	transaction_category: TTransactionCategory;
	transaction_mode: TWalletTransactionMode;
	transaction_id: string;
	invoice_number: string | null;
	order_id?: string | null;
	user_id?: number;
	reviewed_by: number | null;
	reviewed_at: string | null;
	rejection_reason: string | null;
	remark?: string | null;
	created_at: string;
	updated_at?: string;
	can_review?: boolean;
	admin?: IWalletTransactionUser;
	user?: IWalletTransactionUser;
	reviewer?: IWalletTransactionUser | null;
	commission?: IWalletTransactionCommission | null;
}

export interface IWalletTransactionCommissionItem {
	level: number;
	admin_id: number;
	admin_name: string;
	role_name?: string;
	commission_type: 'FLAT' | 'PERCENTAGE' | string;
	commission_value: number | string;
	admin_commission: number | string;
	status: string;
}

export interface IWalletTransactionCommission {
	total_commission: number | string;
	items: IWalletTransactionCommissionItem[];
}

export interface IConstantOption {
	label: string;
	value: string;
	background?: string;
	color?: string;
}

export interface IWalletTransactionConstants {
	status: IConstantOption[];
	transaction_type: IConstantOption[];
	transaction_mode: IConstantOption[];
	transaction_category: IConstantOption[];
}

export interface IWalletTransactionQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: TWalletTransactionStatus;
	transaction_type?: TWalletTransactionType;
	transaction_mode?: TWalletTransactionMode;
	transaction_category?: string;
	admin_id?: number;
	start_date?: string;
	end_date?: string;
	sort?: string;
}

export interface IWalletTransactionResponse {
	result: number;
	total_document: number;
	data: IWalletTransaction[];
}

export interface IAddMoneyPayload {
	amount: number;
	screenshot?: File | null;
	type?: TAddMoneyType;
}

export interface IPaymentMethodBankDetail {
	id: number;
	bank_name: string;
	ifsc_code: string;
	account_holder_name: string;
	account_number: string;
	account_type?: string;
	branch_name?: string | null;
	branch_code?: string | null;
	bank_address?: string | null;
	is_primary?: boolean;
}

export interface IPaymentMethod {
	id: number;
	payment_gateway_id?: number | null;
	name: string;
	code: string;
	icon?: string | null;
	description?: string | null;
	type: TAddMoneyType | string;
	is_primary?: boolean;
	is_custom?: boolean;
	bank_details?: IPaymentMethodBankDetail[];
}

export interface IPaymentMethodsData {
	is_using_custom: boolean;
	payment_methods: IPaymentMethod[];
	default_method?: IPaymentMethod;
	bank_details?: IPaymentMethodBankDetail[];
}

export interface IPaymentMethodsResponse {
	status?: string;
	success?: boolean;
	message?: string;
	data: IPaymentMethodsData;
}
