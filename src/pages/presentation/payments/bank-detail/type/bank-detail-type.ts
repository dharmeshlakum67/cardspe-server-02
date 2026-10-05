// BANK DETAIL TYPES & INTERFACES

export const ACCOUNT_TYPE_CONSTANT = {
	SAVINGS: 'savings',
	CURRENT: 'current',
	CASH_CREDIT: 'cash_credit',
} as const;

export type AccountType =
	(typeof ACCOUNT_TYPE_CONSTANT)[keyof typeof ACCOUNT_TYPE_CONSTANT];

export type BankDetailStatus = 'active' | 'inactive';

export const ACCOUNT_TYPE_OPTIONS: { label: string; value: AccountType }[] = [
	{ label: 'Savings', value: ACCOUNT_TYPE_CONSTANT.SAVINGS },
	{ label: 'Current', value: ACCOUNT_TYPE_CONSTANT.CURRENT },
	{ label: 'Cash Credit', value: ACCOUNT_TYPE_CONSTANT.CASH_CREDIT },
];

export interface IBankDetail {
	id: number;
	bank_name: string;
	ifsc_code: string;
	account_holder_name: string;
	account_number: string;
	account_type: AccountType;
	branch_name?: string | null;
	branch_code?: string | null;
	bank_address?: string | null;
	status: BankDetailStatus;
	created_at?: string;
	updated_at?: string;
}

export interface IBankDetailPayload {
	bank_name: string;
	ifsc_code: string;
	account_holder_name: string;
	account_number: string;
	account_type: AccountType;
	branch_name?: string;
	branch_code?: string;
	bank_address?: string;
	status?: BankDetailStatus;
}

export interface IBankDetailFilterParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: BankDetailStatus;
	account_type?: AccountType;
	startDate?: string;
	endDate?: string;
	sortBy?: string;
	sortDirection?: 'ASC' | 'DESC';
}

export interface IActiveBankDetailOption {
	id: number;
	bank_name: string;
	account_number: string;
	ifsc_code: string;
	account_type: AccountType;
}

export const getAccountTypeLabel = (type?: string): string => {
	switch (type?.toLowerCase()) {
		case ACCOUNT_TYPE_CONSTANT.SAVINGS:
			return 'Savings';
		case ACCOUNT_TYPE_CONSTANT.CURRENT:
			return 'Current';
		case ACCOUNT_TYPE_CONSTANT.CASH_CREDIT:
			return 'Cash Credit';
		default:
			return type || '-';
	}
};

export const getAccountTypeBadgeColor = (
	type?: string,
): 'primary' | 'success' | 'info' | 'secondary' => {
	switch (type?.toLowerCase()) {
		case ACCOUNT_TYPE_CONSTANT.SAVINGS:
			return 'info';
		case ACCOUNT_TYPE_CONSTANT.CURRENT:
			return 'primary';
		case ACCOUNT_TYPE_CONSTANT.CASH_CREDIT:
			return 'success';
		default:
			return 'secondary';
	}
};
