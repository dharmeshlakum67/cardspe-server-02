/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, react/forbid-prop-types */
import React, { FC, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import dayjs from 'dayjs';
import Icon from '../../icon/Icon';
import './DateRangePicker.scss';

export interface IDateRangePickerProps {
	startDate?: string;
	endDate?: string;
	onChange: (dates: { startDate: string; endDate: string }) => void;
	label?: string;
	placeholder?: string;
	isRange?: boolean;
	className?: string;
}

export const DateRangePicker: FC<IDateRangePickerProps> = ({
	startDate = '',
	endDate = '',
	onChange,
	label,
	placeholder = 'Select date range',
	isRange = true,
	className,
}) => {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(
		startDate ? dayjs(startDate) : dayjs(),
	);
	const [hoverDate, setHoverDate] = useState<dayjs.Dayjs | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);

	// CLOSE DROPDOWN ON OUTSIDE CLICK
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	// KEEP CURRENT MONTH IN SYNC WITH START DATE WHEN OPENED
	useEffect(() => {
		if (isOpen && startDate && dayjs(startDate).isValid()) {
			setCurrentMonth(dayjs(startDate));
		}
	}, [isOpen, startDate]);

	// FORMAT DISPLAY VALUE
	let displayValue = '';
	if (startDate && endDate && isRange) {
		const formattedStart = dayjs(startDate).format('DD/MM/YYYY');
		const formattedEnd = dayjs(endDate).format('DD/MM/YYYY');
		displayValue = `${formattedStart} - ${formattedEnd}`;
	} else if (startDate && isRange && isOpen) {
		displayValue = `${dayjs(startDate).format('DD/MM/YYYY')} - ...`;
	} else if (startDate) {
		displayValue = dayjs(startDate).format('DD/MM/YYYY');
	}

	// MONTH NAVIGATION HANDLERS
	const handlePrevYear = () => setCurrentMonth((prev) => prev.subtract(1, 'year'));
	const handlePrevMonth = () => setCurrentMonth((prev) => prev.subtract(1, 'month'));
	const handleNextMonth = () => setCurrentMonth((prev) => prev.add(1, 'month'));
	const handleNextYear = () => setCurrentMonth((prev) => prev.add(1, 'year'));

	// HANDLE DAY CLICK SELECTION
	const handleDayClick = (day: dayjs.Dayjs) => {
		const formatted = day.format('YYYY-MM-DD');

		if (!isRange) {
			onChange({ startDate: formatted, endDate: formatted });
			setIsOpen(false);
			return;
		}

		if (!startDate || (startDate && endDate)) {
			// FIRST CLICK IN RANGE SELECTION
			onChange({ startDate: formatted, endDate: '' });
		} else if (startDate && !endDate) {
			// SECOND CLICK IN RANGE SELECTION
			if (day.isBefore(dayjs(startDate))) {
				onChange({ startDate: formatted, endDate: startDate });
			} else {
				onChange({ startDate, endDate: formatted });
			}
			setIsOpen(false);
		}
	};

	// CLEAR HANDLER
	const handleClear = (e?: React.MouseEvent) => {
		if (e) {
			e.stopPropagation();
		}
		onChange({ startDate: '', endDate: '' });
	};

	// GENERATE 42 DAYS MATRIX FOR CALENDAR
	const startOfMonth = currentMonth.startOf('month');
	const startDayOfWeek = (startOfMonth.day() + 6) % 7; // MONDAY AS FIRST DAY (0=MON, 6=SUN)
	const startDateMatrix = startOfMonth.subtract(startDayOfWeek, 'day');

	const days: dayjs.Dayjs[] = [];
	for (let i = 0; i < 42; i += 1) {
		days.push(startDateMatrix.add(i, 'day'));
	}

	const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	return (
		<div
			ref={containerRef}
			className={classNames('custom-datepicker-wrapper', className)}>
			{/* OPTIONAL TOP LABEL */}
			{label && <span className='datepicker-label d-block'>{label}</span>}

			{/* INPUT TRIGGER */}
			<div className='datepicker-input-container'>
				<Icon icon='DateRange' className='datepicker-start-icon' size='sm' />
				<input
					type='text'
					readOnly
					className={classNames('datepicker-input', { 'is-open': isOpen, 'has-value': !!displayValue })}
					placeholder={placeholder}
					value={displayValue}
					onClick={() => setIsOpen((prev) => !prev)}
				/>
				{displayValue && (
					<button
						type='button'
						className='datepicker-clear-btn'
						aria-label='Clear date'
						onClick={handleClear}
						title='Clear Date'>
						<Icon icon='Close' size='sm' />
					</button>
				)}
			</div>

			{/* CALENDAR POPUP */}
			{isOpen && (
				<div className='datepicker-dropdown'>
					{/* HEADER: NAVIGATION CONTROLS */}
					<div className='datepicker-header'>
						<div className='d-flex align-items-center gap-1'>
							<button
								type='button'
								className='nav-btn'
								aria-label='Previous Year'
								onClick={handlePrevYear}
								title='Previous Year'>
								&laquo;
							</button>
							<button
								type='button'
								className='nav-btn'
								aria-label='Previous Month'
								onClick={handlePrevMonth}
								title='Previous Month'>
								<Icon icon='ChevronLeft' size='sm' />
							</button>
						</div>

						<span className='current-month-year'>
							{currentMonth.format('MMMM YYYY')}
						</span>

						<div className='d-flex align-items-center gap-1'>
							<button
								type='button'
								className='nav-btn'
								aria-label='Next Month'
								onClick={handleNextMonth}
								title='Next Month'>
								<Icon icon='ChevronRight' size='sm' />
							</button>
							<button
								type='button'
								className='nav-btn'
								aria-label='Next Year'
								onClick={handleNextYear}
								title='Next Year'>
								&raquo;
							</button>
						</div>
					</div>

					{/* DAY HEADERS */}
					<div className='datepicker-grid-header'>
						{weekDays.map((d, idx) => (
							<div
								key={d}
								className={classNames('day-header', {
									'is-weekend': idx === 5 || idx === 6,
								})}>
								{d}
							</div>
						))}
					</div>

					{/* DAYS GRID */}
					<div className='datepicker-grid-days'>
						{days.map((day) => {
							const formatted = day.format('YYYY-MM-DD');
							const isCurrentMonth = day.month() === currentMonth.month();
							const dayOfWeek = (day.day() + 6) % 7;
							const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

							const isExactStart = startDate === formatted;
							const isExactEnd = endDate === formatted;
							const isSingleSelected = !isRange && isExactStart;

							const isSelected = isExactStart || isExactEnd || isSingleSelected;
							let isInRange = false;

							if (isRange && startDate && endDate) {
								isInRange =
									day.isAfter(dayjs(startDate), 'day') &&
									day.isBefore(dayjs(endDate), 'day');
							} else if (isRange && startDate && !endDate && hoverDate) {
								const rangeStart = dayjs(startDate);
								if (hoverDate.isAfter(rangeStart)) {
									isInRange =
										day.isAfter(rangeStart, 'day') &&
										day.isBefore(hoverDate, 'day');
								}
							}

							return (
								<button
									type='button'
									key={formatted}
									className={classNames('day-cell', {
										'is-other-month': !isCurrentMonth,
										'is-weekend': isWeekend,
										'is-selected': isSelected,
										'is-in-range': isInRange,
										'is-range-start': isExactStart,
										'is-range-end': isExactEnd,
									})}
									onMouseEnter={() => setHoverDate(day)}
									onClick={() => handleDayClick(day)}>
									<span className='day-number'>{day.date()}</span>
								</button>
							);
						})}
					</div>

					{/* FOOTER */}
					<div className='datepicker-footer'>
						<button
							type='button'
							className='btn-clear'
							onClick={() => {
								handleClear();
								setIsOpen(false);
							}}>
							Clear
						</button>
						<button
							type='button'
							className='btn-today'
							onClick={() => {
								const today = dayjs().format('YYYY-MM-DD');
								onChange({ startDate: today, endDate: today });
								setCurrentMonth(dayjs());
								setIsOpen(false);
							}}>
							Today
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

(DateRangePicker as any).propTypes = {
	startDate: PropTypes.string,
	endDate: PropTypes.string,
	onChange: PropTypes.func.isRequired,
	label: PropTypes.string,
	placeholder: PropTypes.string,
	isRange: PropTypes.bool,
	className: PropTypes.string,
};

DateRangePicker.defaultProps = {
	startDate: '',
	endDate: '',
	label: undefined,
	placeholder: 'Select date range',
	isRange: true,
	className: undefined,
};

export default DateRangePicker;
