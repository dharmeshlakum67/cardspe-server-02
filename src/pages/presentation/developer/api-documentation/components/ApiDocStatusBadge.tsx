import React, { FC } from 'react';
import classNames from 'classnames';
import { TApiDocStatus } from '../type/api-documentation.type';

interface IApiDocStatusBadgeProps {
	status: TApiDocStatus | string;
	className?: string;
	showDot?: boolean;
}

export const ApiDocStatusBadge: FC<IApiDocStatusBadgeProps> = ({
	status,
	className,
	showDot = true,
}) => {
	const normalizedStatus = (status || 'draft').toLowerCase() as TApiDocStatus;

	const getStatusConfig = () => {
		switch (normalizedStatus) {
			case 'published':
				return {
					label: 'Published',
					dotClass: 'bg-success',
					badgeClass: 'status-published',
				};
			case 'draft':
				return {
					label: 'Draft',
					dotClass: 'bg-warning',
					badgeClass: 'status-draft',
				};
			case 'archived':
				return {
					label: 'Archived',
					dotClass: 'bg-secondary',
					badgeClass: 'status-archived',
				};
			default:
				return {
					label: status,
					dotClass: 'bg-secondary',
					badgeClass: 'status-default',
				};
		}
	};

	const { label, dotClass, badgeClass } = getStatusConfig();

	return (
		<span className={classNames('api-doc-status-badge', badgeClass, className)}>
			{showDot && <span className={classNames('status-dot', dotClass)} />}
			<span className='status-label'>{label}</span>
		</span>
	);
};

export default ApiDocStatusBadge;
