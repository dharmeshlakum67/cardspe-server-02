/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props */
import React, { FC } from 'react';
import classNames from 'classnames';
import { TApiDocMethod } from '../type/api-documentation.type';

export interface IApiDocMethodBadgeProps {
	method: TApiDocMethod | string;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'soft' | 'solid';
	isPill?: boolean;
	isSelected?: boolean;
	onClick?: () => void;
}

export const ApiDocMethodBadge: FC<IApiDocMethodBadgeProps> = ({
	method,
	className,
	size = 'md',
	variant = 'soft',
	isPill = true,
	isSelected = false,
	onClick,
}) => {
	const normalizedMethod = (method || 'GET').toUpperCase() as TApiDocMethod;

	const getMethodClass = (m: string) => {
		switch (m) {
			case 'GET':
				return 'method-badge-get';
			case 'POST':
				return 'method-badge-post';
			case 'PUT':
				return 'method-badge-put';
			case 'PATCH':
				return 'method-badge-patch';
			case 'DELETE':
				return 'method-badge-delete';
			default:
				return 'method-badge-default';
		}
	};

	const badgeClasses = classNames(
		'api-doc-method-badge',
		getMethodClass(normalizedMethod),
		`badge-${size}`,
		`badge-variant-${variant}`,
		{
			'is-pill': isPill,
			'is-selected': isSelected,
			'is-clickable': Boolean(onClick),
		},
		className,
	);

	if (onClick) {
		return (
			<button
				type='button'
				className={badgeClasses}
				onClick={onClick}>
				{normalizedMethod}
			</button>
		);
	}

	return (
		<span className={badgeClasses}>
			{normalizedMethod}
		</span>
	);
};

export default ApiDocMethodBadge;
