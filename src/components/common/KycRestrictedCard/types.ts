export interface IKycRequiredStats {
	status?: string;
	total_required?: number;
	total_approved?: number;
	total_pending?: number;
	total_rejected?: number;
	missing_documents?: string[];
}

export interface IKycRequiredError {
	status?: string;
	message?: string;
	is_kyc_required?: boolean;
	kyc_status?: 'not_submitted' | 'pending' | 'in_review' | 'rejected' | 'approved' | string;
	error_code?: string;
	data?: IKycRequiredStats;
}

export interface IKycRestrictedCardProps {
	title?: string;
	subTitle?: string;
	message?: string;
	errorData?: IKycRequiredError | any;
	onRetry?: () => void;
	isRetrying?: boolean;
	showBreadcrumbs?: boolean;
	breadcrumbs?: { label: string; to?: string; current?: boolean }[];
	kycPageRoute?: string;
	className?: string;
	isCompact?: boolean;
}
