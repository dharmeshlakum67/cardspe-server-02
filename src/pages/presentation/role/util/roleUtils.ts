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
		return 'blue';
	}

	const normalized = roleType.toUpperCase().trim();

	if (normalized === 'SUPER_ADMIN') {
		return 'purple';
	}
	if (normalized === 'ADMIN') {
		return 'indigo';
	}
	if (normalized === 'STAFF') {
		return 'teal';
	}
	if (normalized === 'MANAGER') {
		return 'cyan';
	}
	if (normalized === 'USER') {
		return 'blue';
	}
	if (normalized === 'GUEST') {
		return 'secondary';
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
