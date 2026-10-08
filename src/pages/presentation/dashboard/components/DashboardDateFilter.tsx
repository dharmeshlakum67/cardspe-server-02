/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props */
import React, { FC, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import dayjs from 'dayjs';
import Icon from '../../../../components/icon/Icon';
import DateRangePicker from '../../../../components/common/DateRangePicker/DateRangePicker';
import { IDatePresetOption, TDatePreset } from '../type/dashboard.type';
import '../css/Dashboard.scss';

interface IDashboardDateFilterProps {
	startDate: string;
	endDate: string;
	onDateChange: (range: { startDate: string; endDate: string; preset: TDatePreset }) => void;
	onRefresh: () => void;
	isRefreshing: boolean;
	className?: string;
}

const PRESET_OPTIONS: IDatePresetOption[] = [
	{ id: 'today', label: 'Today' },
	{ id: 'yesterday', label: 'Yesterday' },
	{ id: 'this_week', label: 'This Week' },
	{ id: 'last_week', label: 'Last Week' },
	{ id: 'last_7_days', label: 'Last 7 Days' },
	{ id: 'this_month', label: 'This Month' },
	{ id: 'last_month', label: 'Last Month' },
	{ id: 'custom', label: 'Custom Range' },
];

export const calculateDatesForPreset = (
	preset: TDatePreset,
): { startDate: string; endDate: string } => {
	const now = dayjs();
	const dayOfWeek = (now.day() + 6) % 7; // 0=Monday, 6=Sunday

	switch (preset) {
		case 'today': {
			const today = now.format('YYYY-MM-DD');
			return { startDate: today, endDate: today };
		}
		case 'yesterday': {
			const yest = now.subtract(1, 'day').format('YYYY-MM-DD');
			return { startDate: yest, endDate: yest };
		}
		case 'this_week': {
			const start = now.subtract(dayOfWeek, 'day').format('YYYY-MM-DD');
			const end = now.subtract(dayOfWeek, 'day').add(6, 'day').format('YYYY-MM-DD');
			return { startDate: start, endDate: end };
		}
		case 'last_week': {
			const start = now.subtract(dayOfWeek + 7, 'day').format('YYYY-MM-DD');
			const end = now.subtract(dayOfWeek + 1, 'day').format('YYYY-MM-DD');
			return { startDate: start, endDate: end };
		}
		case 'last_7_days': {
			const start = now.subtract(6, 'day').format('YYYY-MM-DD');
			const end = now.format('YYYY-MM-DD');
			return { startDate: start, endDate: end };
		}
		case 'this_month': {
			const start = now.startOf('month').format('YYYY-MM-DD');
			const end = now.endOf('month').format('YYYY-MM-DD');
			return { startDate: start, endDate: end };
		}
		case 'last_month': {
			const lastM = now.subtract(1, 'month');
			const start = lastM.startOf('month').format('YYYY-MM-DD');
			const end = lastM.endOf('month').format('YYYY-MM-DD');
			return { startDate: start, endDate: end };
		}
		default:
			return { startDate: '', endDate: '' };
	}
};

export const DashboardDateFilter: FC<IDashboardDateFilterProps> = ({
	startDate,
	endDate,
	onDateChange,
	onRefresh,
	isRefreshing,
	className,
}) => {
	const [activePreset, setActivePreset] = useState<TDatePreset>('today');
	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// CLOSE DROPDOWN ON CLICK OUTSIDE
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};

		if (isDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isDropdownOpen]);

	// HANDLE PRESET SELECTION
	const handleSelectPreset = (preset: TDatePreset) => {
		setActivePreset(preset);
		setIsDropdownOpen(false);

		if (preset !== 'custom') {
			const dates = calculateDatesForPreset(preset);
			onDateChange({ ...dates, preset });
		}
	};

	// HANDLE CUSTOM DATE RANGE PICKER
	const handleCustomDateChange = (dates: { startDate: string; endDate: string }) => {
		if (!dates.startDate && !dates.endDate) {
			// If cleared by user, reset back to 'today'
			setActivePreset('today');
			const todayDates = calculateDatesForPreset('today');
			onDateChange({
				startDate: todayDates.startDate,
				endDate: todayDates.endDate,
				preset: 'today',
			});
			return;
		}

		setActivePreset('custom');
		onDateChange({
			startDate: dates.startDate,
			endDate: dates.endDate,
			preset: 'custom',
		});
	};

	const currentPresetLabel =
		PRESET_OPTIONS.find((p) => p.id === activePreset)?.label || 'Date Filter';

	let formattedDateDisplay = 'Today';
	if (startDate && endDate) {
		formattedDateDisplay =
			startDate === endDate
				? dayjs(startDate).format('DD MMM YYYY')
				: `${dayjs(startDate).format('DD MMM YYYY')} - ${dayjs(endDate).format('DD MMM YYYY')}`;
	}

	return (
		<div className={classNames('dashboard-filter-bar d-flex align-items-center', className)}>
			{/* PRESET SELECTOR DROPDOWN */}
			<div className='position-relative' ref={dropdownRef}>
				<button
					type='button'
					className={classNames('preset-dropdown-btn', {
						active: isDropdownOpen,
					})}
					onClick={() => setIsDropdownOpen((prev) => !prev)}>
					<Icon icon='CalendarToday' size='sm' />
					<span>{currentPresetLabel}</span>
					<Icon icon='KeyboardArrowDown' size='sm' />
				</button>

				{isDropdownOpen && (
					<div
						className='dropdown-menu show shadow-lg py-1'
						style={{
							position: 'absolute',
							top: 'calc(100% + 4px)',
							right: 0,
							zIndex: 1050,
							minWidth: '170px',
							borderRadius: '0.625rem',
							border: '1px solid #e5e7eb',
						}}>
						{PRESET_OPTIONS.map((option) => (
							<button
								key={option.id}
								type='button'
								className={classNames('dropdown-item py-2 px-3 d-flex align-items-center justify-content-between', {
									'active text-white bg-primary': activePreset === option.id,
								})}
								onClick={() => handleSelectPreset(option.id)}>
								<span>{option.label}</span>
								{activePreset === option.id && (
									<Icon icon='Check' size='sm' />
								)}
							</button>
						))}
					</div>
				)}
			</div>

			{/* CUSTOM DATE PICKER WHEN 'CUSTOM' IS SELECTED, OTHERWISE STATIC DATE BADGE */}
			{activePreset === 'custom' ? (
				<div style={{ minWidth: '220px' }}>
					<DateRangePicker
						startDate={startDate}
						endDate={endDate}
						placeholder='Select Date Range'
						onChange={handleCustomDateChange}
					/>
				</div>
			) : (
				<div className='date-range-badge'>
					<Icon icon='DateRange' size='sm' />
					<span>{formattedDateDisplay}</span>
				</div>
			)}

			{/* REFRESH BUTTON */}
			<button
				type='button'
				className={classNames('refresh-btn', { spinning: isRefreshing })}
				title='Refresh Dashboard'
				onClick={onRefresh}
				disabled={isRefreshing}>
				<Icon icon='Refresh' size='sm' />
			</button>
		</div>
	);
};

(DashboardDateFilter as any).propTypes = {
	startDate: PropTypes.string.isRequired,
	endDate: PropTypes.string.isRequired,
	onDateChange: PropTypes.func.isRequired,
	onRefresh: PropTypes.func.isRequired,
	isRefreshing: PropTypes.bool.isRequired,
	className: PropTypes.string,
};

DashboardDateFilter.defaultProps = {
	className: undefined,
};

export default DashboardDateFilter;
