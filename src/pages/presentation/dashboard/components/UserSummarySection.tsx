/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/no-array-index-key, react/require-default-props, no-nested-ternary */
import React, { FC } from 'react';
import classNames from 'classnames';
import Icon from '../../../../components/icon/Icon';
import { TIcons } from '../../../../type/icons-type';
import { RoleCountStats } from '../type/dashboard.type';

interface IUserSummarySectionProps {
	userSummary: RoleCountStats[];
	isLoading: boolean;
}

const THEME_PALETTE = [
	'theme-blue',
	'theme-green',
	'theme-purple',
	'theme-amber',
	'theme-teal',
	'theme-pink',
	'theme-indigo',
];

const getRoleConfig = (
	roleName: string,
	index: number,
): { theme: string; icon: TIcons } => {
	const normalized = roleName.trim().toLowerCase();

	if (normalized.includes('total')) {
		return { theme: 'theme-blue', icon: 'Group' };
	}
	if (normalized.includes('super user') || normalized === 'admin') {
		return { theme: 'theme-green', icon: 'Person' };
	}
	if (normalized.includes('super distributor')) {
		return { theme: 'theme-purple', icon: 'SupervisorAccount' };
	}
	if (normalized.includes('distributor')) {
		return { theme: 'theme-amber', icon: 'Group' };
	}
	if (normalized.includes('retailer')) {
		return { theme: 'theme-teal', icon: 'Person' };
	}
	if (normalized.includes('api')) {
		return { theme: 'theme-pink', icon: 'Code' };
	}

	return {
		theme: THEME_PALETTE[index % THEME_PALETTE.length],
		icon: 'Person',
	};
};

export const UserSummarySection: FC<IUserSummarySectionProps> = ({
	userSummary,
	isLoading,
}) => {
	// IF NOT LOADING AND NO USERS/ROLES TO DISPLAY, HIDE THE ENTIRE SECTION
	if (!isLoading && (!userSummary || userSummary.length === 0)) {
		return null;
	}

	return (
		<div className='dashboard-section-card mb-4'>
			{/* SECTION HEADER */}
			<div className='section-header'>
				<div className='section-title-wrapper'>
					<div className='section-icon-box users'>
						<Icon icon='Group' size='lg' />
					</div>
					<h3 className='section-title'>User Summary</h3>
				</div>
			</div>

			{/* SECTION BODY */}
			<div className='section-body'>
				{isLoading ? (
					<div className='user-roles-grid'>
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div key={i} className='user-role-card theme-blue'>
								<div className='d-flex align-items-center gap-2 mb-3'>
									<div
										className='skeleton-box'
										style={{ width: 34, height: 34, borderRadius: '50%' }}
									/>
									<div className='skeleton-box' style={{ width: 100, height: 18 }} />
								</div>
								<div className='skeleton-box' style={{ height: 50, width: '100%' }} />
							</div>
						))}
					</div>
				) : (
					<div className='user-roles-grid'>
						{userSummary.map((item, idx) => {
							const { theme, icon } = getRoleConfig(item.role_name, idx);
							return (
								<div
									key={`${item.role_name}-${idx}`}
									className={classNames('user-role-card', theme)}>
									{/* CARD TOP (ICON + ROLE NAME) */}
									<div className='card-top'>
										<div className='role-icon-bubble'>
											<Icon icon={icon} size='sm' />
										</div>
										<h4 className='role-name' title={item.role_name}>
											{item.role_name}
										</h4>
									</div>

									{/* 4-COLUMN METRICS ROW (CLEAN UNIFIED CONTAINER) */}
									<div className='role-metrics-row'>
										<div className='metric-col'>
											<span className='metric-label'>Total</span>
											<span className='metric-val'>{item.total ?? 0}</span>
										</div>
										<div className='metric-col'>
											<span className='metric-label'>Active</span>
											<span className='metric-val val-active'>
												{item.active ?? 0}
											</span>
										</div>
										<div className='metric-col'>
											<span className='metric-label'>Inactive</span>
											<span className='metric-val val-inactive'>
												{item.inactive ?? 0}
											</span>
										</div>
										<div className='metric-col'>
											<span className='metric-label'>Blocked</span>
											<span className='metric-val val-blocked'>
												{item.blocked ?? 0}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default UserSummarySection;
