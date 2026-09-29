/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props */
import React, { FC } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Spinner from '../../bootstrap/Spinner';
import './StatusToggle.scss';

export interface IStatusOption {
	value: string | number;
	label: string;
}

export interface IStatusToggleProps {
	checked: boolean;
	onChange: (newChecked: boolean) => void | Promise<void>;
	disabled?: boolean;
	isLoading?: boolean;
	onText?: string;
	offText?: string;
	statusOptions?: IStatusOption[];
	ariaLabel?: string;
	className?: string;
}

export const StatusToggle: FC<IStatusToggleProps> = ({
	checked,
	onChange,
	disabled = false,
	isLoading = false,
	onText,
	offText,
	statusOptions,
	ariaLabel = 'Toggle Status',
	className,
}) => {
	const activeLabel =
		onText ||
		statusOptions?.find(
			(opt) => String(opt.value).toLowerCase() === 'active' || opt.value === 1,
		)?.label ||
		'Active';

	const inactiveLabel =
		offText ||
		statusOptions?.find(
			(opt) => String(opt.value).toLowerCase() === 'inactive' || opt.value === 0,
		)?.label ||
		'Inactive';

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		if (disabled || isLoading) return;
		onChange(!checked);
	};

	return (
		<button
			type='button'
			role='switch'
			aria-checked={checked}
			aria-label={ariaLabel}
			disabled={disabled || isLoading}
			onClick={handleClick}
			className={classNames(
				'status-toggle-switch',
				checked ? 'is-on' : 'is-off',
				className,
			)}>
			{checked ? (
				<>
					<span className='toggle-label'>{activeLabel}</span>
					<span className='toggle-thumb d-flex align-items-center justify-content-center'>
						{isLoading && <Spinner size='sm' isGrow={false} />}
					</span>
				</>
			) : (
				<>
					<span className='toggle-thumb d-flex align-items-center justify-content-center'>
						{isLoading && <Spinner size='sm' isGrow={false} />}
					</span>
					<span className='toggle-label'>{inactiveLabel}</span>
				</>
			)}
		</button>
	);
};

(StatusToggle as any).propTypes = {
	checked: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired,
	disabled: PropTypes.bool,
	isLoading: PropTypes.bool,
	onText: PropTypes.string,
	offText: PropTypes.string,
	statusOptions: PropTypes.arrayOf(
		PropTypes.shape({
			value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			label: PropTypes.string.isRequired,
		}),
	),
	ariaLabel: PropTypes.string,
	className: PropTypes.string,
};

StatusToggle.defaultProps = {
	disabled: false,
	isLoading: false,
	onText: undefined,
	offText: undefined,
	statusOptions: undefined,
	ariaLabel: 'Toggle Status',
	className: undefined,
};

export default StatusToggle;
