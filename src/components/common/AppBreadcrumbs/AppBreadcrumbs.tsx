/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, react/no-array-index-key */
import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '../../icon/Icon';
import './AppBreadcrumbs.scss';

export type AppBreadcrumbItem = {
	label: string;
	to?: string;
	/** When true, renders as non-clickable muted text (current page). */
	current?: boolean;
};

type AppBreadcrumbsProps = {
	items: AppBreadcrumbItem[];
	className?: string;
	showHome?: boolean;
};

const AppBreadcrumbs: React.FC<AppBreadcrumbsProps> = ({
	items,
	className = '',
	showHome = true,
}) => {
	return (
		<nav className={`app-breadcrumbs ${className}`.trim()} aria-label='Breadcrumbs'>
			{showHome ? (
				<>
					<NavLink to='/' className='breadcrumb-home-link' aria-label='Home'>
						<span className='breadcrumb-home-icon'>
							<Icon icon='Home' size='sm' />
						</span>
					</NavLink>
					{items.length > 0 ? <span className='breadcrumb-sep'>/</span> : null}
				</>
			) : null}

			{items.map((item, index) => {
				const isLast = index === items.length - 1;
				const isCurrent = item.current ?? isLast;
				const showSep = index < items.length - 1;

				return (
					<React.Fragment key={`${item.label}-${index}`}>
						{isCurrent || !item.to ? (
							<span
								className={
									isCurrent ? 'breadcrumb-current' : 'breadcrumb-item-static'
								}>
								{item.label}
							</span>
						) : (
							<NavLink to={item.to} className='breadcrumb-link'>
								{item.label}
							</NavLink>
						)}
						{showSep ? <span className='breadcrumb-sep'>/</span> : null}
					</React.Fragment>
				);
			})}
		</nav>
	);
};

export default AppBreadcrumbs;
