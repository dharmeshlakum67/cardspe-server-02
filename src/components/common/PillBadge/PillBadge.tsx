/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, react/forbid-prop-types */
import React, { FC, ReactNode } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from '../../icon/Icon';
import { TIcons } from '../../../type/icons-type';
import './PillBadge.scss';

export type TPillBadgeColor =
	| 'purple'
	| 'indigo'
	| 'teal'
	| 'primary'
	| 'blue'
	| 'success'
	| 'green'
	| 'warning'
	| 'orange'
	| 'amber'
	| 'danger'
	| 'rose'
	| 'red'
	| 'pink'
	| 'cyan'
	| 'info'
	| 'secondary'
	| 'gray'
	| 'dark';

export type TPillBadgeVariant = 'soft' | 'solid';
export type TPillBadgeSize = 'sm' | 'md' | 'lg';

export interface IPillBadgeProps {
	children: ReactNode;
	color?: TPillBadgeColor;
	variant?: TPillBadgeVariant;
	size?: TPillBadgeSize;
	isPill?: boolean;
	icon?: TIcons;
	className?: string;
	style?: React.CSSProperties;
	onClick?: () => void;
}

export const PillBadge: FC<IPillBadgeProps> = ({
	children,
	color = 'purple',
	variant = 'soft',
	size = 'md',
	isPill = true,
	icon,
	className,
	style,
	onClick,
}) => {
	const content = (
		<>
			{icon && <Icon icon={icon} size='sm' />}
			<span>{children}</span>
		</>
	);

	const badgeClasses = classNames(
		'pill-badge',
		`color-${color}`,
		`variant-${variant}`,
		`size-${size}`,
		{
			'is-pill': isPill,
			'is-rect': !isPill,
			'is-clickable': Boolean(onClick),
		},
		className,
	);

	if (onClick) {
		return (
			<button
				type='button'
				className={badgeClasses}
				style={style}
				onClick={onClick}>
				{content}
			</button>
		);
	}

	return (
		<span className={badgeClasses} style={style}>
			{content}
		</span>
	);
};

(PillBadge as any).propTypes = {
	children: PropTypes.node.isRequired,
	color: PropTypes.string,
	variant: PropTypes.oneOf(['soft', 'solid']),
	size: PropTypes.oneOf(['sm', 'md', 'lg']),
	isPill: PropTypes.bool,
	icon: PropTypes.string,
	className: PropTypes.string,
	style: PropTypes.shape({}),
	onClick: PropTypes.func,
};

PillBadge.defaultProps = {
	color: 'purple',
	variant: 'soft',
	size: 'md',
	isPill: true,
	icon: undefined,
	className: undefined,
	style: undefined,
	onClick: undefined,
};

export default PillBadge;
