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
	reviewed_by: number | null;
	reviewed_at: string | null;
	rejection_reason: string | null;
	created_at: string;
	updated_at?: string;
	can_review?: boolean;
	admin?: IWalletTransactionUser;
	reviewer?: IWalletTransactionUser | null;
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
