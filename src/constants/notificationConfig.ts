import { TIcons } from '../type/icons-type';
import { TColor } from '../type/color-type';
import { NOTIFICATION_TYPE_CONSTANT } from './socketEvents';

export interface INotificationTypeConfig {
	icon: TIcons;
	color: TColor;
	bgColor: string;
	textColor: string;
	label?: string;
}

/**
 * UNIFIED NOTIFICATION TYPE CONFIGURATION
 * All notification types map directly to NOTIFICATION_TYPE_CONSTANT (socket events).
 * Modify icons, colors, and styling from this single place.
 */
export const NOTIFICATION_TYPE_CONFIG: Record<string, INotificationTypeConfig> = {
	// KYC REQUEST EVENTS
	[NOTIFICATION_TYPE_CONSTANT.KYC_REQUEST.SUBMITTED]: {
		icon: 'AssignmentInd',
		color: 'info',
		bgColor: 'rgba(59, 130, 246, 0.12)',
		textColor: '#2563eb',
		label: 'KYC Submitted',
	},
	[NOTIFICATION_TYPE_CONSTANT.KYC_REQUEST.APPROVED]: {
		icon: 'VerifiedUser',
		color: 'success',
		bgColor: 'rgba(16, 185, 129, 0.12)',
		textColor: '#059669',
		label: 'KYC Approved',
	},
	[NOTIFICATION_TYPE_CONSTANT.KYC_REQUEST.REJECTED]: {
		icon: 'GppBad',
		color: 'danger',
		bgColor: 'rgba(239, 68, 68, 0.12)',
		textColor: '#dc2626',
		label: 'KYC Rejected',
	},

	// GENERAL SOCKET NOTIFICATIONS
	[NOTIFICATION_TYPE_CONSTANT.NEW_NOTIFICATION]: {
		icon: 'NotificationsActive',
		color: 'primary',
		bgColor: 'rgba(99, 102, 241, 0.12)',
		textColor: '#4f46e5',
		label: 'New Notification',
	},
	[NOTIFICATION_TYPE_CONSTANT.NOTIFICATION]: {
		icon: 'Notifications',
		color: 'primary',
		bgColor: 'rgba(59, 130, 246, 0.12)',
		textColor: '#2563eb',
		label: 'Notification',
	},

	// BACKWARD-COMPATIBLE / LOWER-CASE ALIASES
	kyc_request: {
		icon: 'AssignmentInd',
		color: 'info',
		bgColor: 'rgba(59, 130, 246, 0.12)',
		textColor: '#2563eb',
		label: 'KYC Request',
	},
	user_kyc_document: {
		icon: 'Badge',
		color: 'info',
		bgColor: 'rgba(59, 130, 246, 0.12)',
		textColor: '#2563eb',
		label: 'KYC Document',
	},

	// DEFAULT FALLBACK
	default: {
		icon: 'Notifications',
		color: 'primary',
		bgColor: 'rgba(59, 130, 246, 0.12)',
		textColor: '#2563eb',
		label: 'Notification',
	},
};

/**
 * Resolves the visual configuration (icon, color, background) for any notification item
 */
export const getNotificationVisuals = (payload: {
	notification_type?: string;
	model_name?: string;
	event?: string;
	message?: string;
}): INotificationTypeConfig => {
	const rawType = (payload.notification_type || '').trim();
	const upperType = rawType.toUpperCase();
	const lowerType = rawType.toLowerCase();

	const modelName = (payload.model_name || '').toLowerCase().trim();
	const event = (payload.event || '').toUpperCase().trim();
	const message = (payload.message || '').toLowerCase();

	// 1. Exact match with NOTIFICATION_TYPE_CONSTANT (e.g. KYC_REQUEST_SUBMITTED)
	if (NOTIFICATION_TYPE_CONFIG[rawType]) {
		return NOTIFICATION_TYPE_CONFIG[rawType];
	}
	if (NOTIFICATION_TYPE_CONFIG[upperType]) {
		return NOTIFICATION_TYPE_CONFIG[upperType];
	}
	if (NOTIFICATION_TYPE_CONFIG[lowerType]) {
		return NOTIFICATION_TYPE_CONFIG[lowerType];
	}

	// 2. Match with Event
	if (event && NOTIFICATION_TYPE_CONFIG[event]) {
		return NOTIFICATION_TYPE_CONFIG[event];
	}

	// 3. Match with Model Name
	if (modelName && NOTIFICATION_TYPE_CONFIG[modelName]) {
		return NOTIFICATION_TYPE_CONFIG[modelName];
	}

	// 4. Keyword matches
	if (upperType.includes('APPROVED') || event.includes('APPROVED') || message.includes('approved')) {
		return NOTIFICATION_TYPE_CONFIG[NOTIFICATION_TYPE_CONSTANT.KYC_REQUEST.APPROVED];
	}
	if (upperType.includes('REJECTED') || event.includes('REJECTED') || message.includes('rejected')) {
		return NOTIFICATION_TYPE_CONFIG[NOTIFICATION_TYPE_CONSTANT.KYC_REQUEST.REJECTED];
	}
	if (upperType.includes('SUBMITTED') || event.includes('SUBMITTED') || message.includes('submitted')) {
		return NOTIFICATION_TYPE_CONFIG[NOTIFICATION_TYPE_CONSTANT.KYC_REQUEST.SUBMITTED];
	}

	return NOTIFICATION_TYPE_CONFIG.default;
};

export default NOTIFICATION_TYPE_CONFIG;
