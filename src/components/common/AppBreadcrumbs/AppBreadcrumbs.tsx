/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, react/no-array-index-key */
import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../icon/Icon';
import usePermission from '../../../hooks/usePermission';
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

type TMenuTrailNode = {
	text: string;
	path: string;
};

const normalizePath = (path?: string | null) =>
	(path || '').split('?')[0].replace(/^\/+|\/+$/g, '');

// ANCESTOR CHAIN (ROOT -> LEAF) OF THE SIDEBAR ITEM WHOSE PATH BEST MATCHES THE CURRENT URL
const findMenuTrail = (menu: Record<string, any>, pathname: string): TMenuTrailNode[] => {
	const currentPath = normalizePath(pathname);
	let bestTrail: TMenuTrailNode[] = [];
	let bestLength = -1;

	const walk = (nodes: Record<string, any> | null | undefined, ancestors: TMenuTrailNode[]) => {
		Object.values(nodes || {}).forEach((node: any) => {
			if (!node || typeof node !== 'object' || !node.text) return;
			const nodePath = normalizePath(node.path);
			const trail = [...ancestors, { text: String(node.text), path: nodePath }];
			const isMatch =
				nodePath !== '' &&
				(currentPath === nodePath || currentPath.startsWith(`${nodePath}/`));
			if (isMatch && nodePath.length > bestLength) {
				bestTrail = trail;
				bestLength = nodePath.length;
			}
			if (node.subMenu) walk(node.subMenu, trail);
		});
	};

	walk(menu, []);
	return bestTrail;
};

const AppBreadcrumbs: React.FC<AppBreadcrumbsProps> = ({
	items,
	className = '',
	showHome = true,
}) => {
	const { pathname } = useLocation();
	const { dynamicMenu } = usePermission();
	const { t } = useTranslation('menu');

	// REPLACE STATIC LABELS WITH THE BACKEND-DRIVEN SIDEBAR NAMES WHEN THE POSITIONS LINE UP
	const resolvedItems = useMemo(() => {
		const trail = findMenuTrail(dynamicMenu || {}, pathname);
		if (trail.length === 0) return items;

		const currentPath = normalizePath(pathname);

		return items.map((item, index) => {
			const menuNode = trail[index];
			if (!menuNode) return item;

			const itemPath = normalizePath(item.to);
			const isCurrentItem = item.current ?? index === items.length - 1;

			const isGroupMatch = !itemPath && !menuNode.path && !isCurrentItem;
			const isLinkMatch = itemPath !== '' && itemPath === menuNode.path;
			const isCurrentPageMatch =
				isCurrentItem && index === trail.length - 1 && currentPath === menuNode.path;

			if (isGroupMatch || isLinkMatch || isCurrentPageMatch) {
				return { ...item, label: t(menuNode.text) as string };
			}
			return item;
		});
	}, [items, dynamicMenu, pathname, t]);

	return (
		<nav className={`app-breadcrumbs ${className}`.trim()} aria-label='Breadcrumbs'>
			{showHome ? (
				<>
					<NavLink to='/' className='breadcrumb-home-link' aria-label='Home'>
						<span className='breadcrumb-home-icon'>
							<Icon icon='Home' size='sm' />
						</span>
					</NavLink>
					{resolvedItems.length > 0 ? <span className='breadcrumb-sep'>/</span> : null}
				</>
			) : null}

			{resolvedItems.map((item, index) => {
				const isLast = index === resolvedItems.length - 1;
				const isCurrent = item.current ?? isLast;
				const showSep = index < resolvedItems.length - 1;

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
