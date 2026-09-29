import { TPillBadgeColor } from '../../../../components/common/PillBadge';

// FORMAT ROLE TYPE STRING (REPLACE UNDERSCORES WITH SPACES AND CAPITALIZE WORDS)
export const formatRoleType = (roleType?: string | null): string => {
	if (!roleType) {
		return '-';
	}

	return roleType
		.toLowerCase()
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

// GET ROLE TYPE PILL BADGE COLOR
export const getRoleTypeBadgeColor = (roleType?: string | null): TPillBadgeColor => {
	if (!roleType) {
		return 'indigo';
	}

	const normalized = roleType.toLowerCase().trim();

	if (normalized === 'super_user' || normalized === 'super_admin' || normalized === 'superuser') {
		return 'purple';
	}
	if (normalized === 'user' || normalized === 'staff') {
		return 'indigo';
	}
	if (normalized === 'api_user' || normalized === 'apiuser' || normalized === 'api') {
		return 'teal';
	}

	return 'blue';
};

// GET FORMATTED ROLE TYPE DETAILS (LABEL + COLOR)
export const getRoleTypeDetails = (
	roleType?: string | null,
): { label: string; color: TPillBadgeColor } => {
	return {
		label: formatRoleType(roleType),
		color: getRoleTypeBadgeColor(roleType),
	};
};
