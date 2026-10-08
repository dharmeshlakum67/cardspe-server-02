/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/no-array-index-key, react/require-default-props, no-nested-ternary */
import React, { FC, useMemo, useState } from 'react';
import classNames from 'classnames';
import Icon from '../../../../components/icon/Icon';
import { ServiceAmountStats } from '../type/dashboard.type';

interface IAddMoneySummarySectionProps {
	addMoneySummary: ServiceAmountStats[];
	isLoading: boolean;
}

const formatCurrency = (val?: number | null): string => {
	if (val === undefined || val === null || isNaN(val)) return '₹0.00';
	return `₹${val.toLocaleString('en-IN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

export const AddMoneySummarySection: FC<IAddMoneySummarySectionProps> = ({
	addMoneySummary,
	isLoading,
}) => {
	const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

	// EXTRACT TOTAL STATS
	const totalStats = useMemo(() => {
		if (!addMoneySummary || addMoneySummary.length === 0) {
			return {
				total_amount: 0,
				success_amount: 0,
				pending_amount: 0,
				fail_amount: 0,
			};
		}
		const totalRow = addMoneySummary.find((item) =>
			item.service_name.toLowerCase().includes('total'),
		);
		return (
			totalRow ||
			addMoneySummary[0] || {
				total_amount: 0,
				success_amount: 0,
				pending_amount: 0,
				fail_amount: 0,
			}
		);
	}, [addMoneySummary]);

	const successAmount = totalStats.success_amount || 0;
	const pendingAmount = totalStats.pending_amount || 0;
	const failAmount = totalStats.fail_amount || 0;
	const totalAmount = totalStats.total_amount || 0;

	const sumMetrics = successAmount + pendingAmount + failAmount || totalAmount;

	// PERCENTAGES
	const successPct = sumMetrics > 0 ? (successAmount / sumMetrics) * 100 : 0;
	const pendingPct = sumMetrics > 0 ? (pendingAmount / sumMetrics) * 100 : 0;
	const failPct = sumMetrics > 0 ? (failAmount / sumMetrics) * 100 : 0;

	// SVG DONUT CALCULATION
	const radius = 70;
	const strokeWidth = 22;
	const circumference = 2 * Math.PI * radius; // ~439.82

	const successLength = (successPct / 100) * circumference;
	const pendingLength = (pendingPct / 100) * circumference;
	const failLength = (failPct / 100) * circumference;

	const successOffset = 0;
	const pendingOffset = -successLength;
	const failOffset = -(successLength + pendingLength);

	const isZeroData = sumMetrics === 0;

	return (
		<div className='dashboard-section-card add-money-pie-card h-100'>
			{/* SECTION HEADER */}
			<div className='section-header'>
				<div className='section-title-wrapper'>
					<div className='section-icon-box add-money'>
						<Icon icon='AccountBalanceWallet' size='lg' />
					</div>
					<h3 className='section-title'>Add Money Summary</h3>
				</div>
			</div>

			{/* SECTION BODY WITH PIE / DONUT CHART */}
			<div className='section-body d-flex flex-column justify-content-between p-3 p-lg-4'>
				{isLoading ? (
					<div className='d-flex flex-column align-items-center justify-content-center py-4 w-100'>
						<div
							className='skeleton-box rounded-circle mb-4'
							style={{ width: 170, height: 170 }}
						/>
						<div className='w-100 d-flex flex-column gap-2'>
							<div className='skeleton-box w-100' style={{ height: 46 }} />
							<div className='skeleton-box w-100' style={{ height: 46 }} />
							<div className='skeleton-box w-100' style={{ height: 46 }} />
						</div>
					</div>
				) : (
					<>
						{/* DONUT CHART CONTAINER */}
						<div className='pie-chart-wrapper position-relative d-flex justify-content-center align-items-center my-2'>
							<svg
								width='200'
								height='200'
								viewBox='0 0 200 200'
								className='pie-svg'
								style={{ transform: 'rotate(-90deg)' }}>
								{/* BACKGROUND NEUTRAL BASE RING */}
								<circle
									cx='100'
									cy='100'
									r={radius}
									fill='transparent'
									stroke='#f3f4f6'
									strokeWidth={strokeWidth}
								/>

								{!isZeroData ? (
									<>
										{/* 1. SUCCESS SLICE (GREEN) */}
										{successAmount > 0 && (
											<circle
												cx='100'
												cy='100'
												r={radius}
												fill='transparent'
												stroke='#10b981'
												strokeWidth={hoveredSlice === 'success' ? strokeWidth + 4 : strokeWidth}
												strokeDasharray={`${successLength} ${circumference - successLength}`}
												strokeDashoffset={successOffset}
												style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
												onMouseEnter={() => setHoveredSlice('success')}
												onMouseLeave={() => setHoveredSlice(null)}
											/>
										)}

										{/* 2. PENDING SLICE (AMBER) */}
										{pendingAmount > 0 && (
											<circle
												cx='100'
												cy='100'
												r={radius}
												fill='transparent'
												stroke='#f59e0b'
												strokeWidth={hoveredSlice === 'pending' ? strokeWidth + 4 : strokeWidth}
												strokeDasharray={`${pendingLength} ${circumference - pendingLength}`}
												strokeDashoffset={pendingOffset}
												style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
												onMouseEnter={() => setHoveredSlice('pending')}
												onMouseLeave={() => setHoveredSlice(null)}
											/>
										)}

										{/* 3. CANCEL / FAIL SLICE (RED) */}
										{failAmount > 0 && (
											<circle
												cx='100'
												cy='100'
												r={radius}
												fill='transparent'
												stroke='#ef4444'
												strokeWidth={hoveredSlice === 'fail' ? strokeWidth + 4 : strokeWidth}
												strokeDasharray={`${failLength} ${circumference - failLength}`}
												strokeDashoffset={failOffset}
												style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
												onMouseEnter={() => setHoveredSlice('fail')}
												onMouseLeave={() => setHoveredSlice(null)}
											/>
										)}
									</>
								) : null}
							</svg>

							{/* CENTER DISPLAY INSIDE DONUT */}
							<div
								className='donut-center-info position-absolute text-center d-flex flex-column align-items-center justify-content-center'
								style={{ pointerEvents: 'none' }}>
								<span className='donut-center-label'>Total Amount</span>
								<span className='donut-center-amount'>
									{formatCurrency(totalAmount)}
								</span>
							</div>
						</div>

						{/* 3 STATUS METRIC CARDS: SUCCESS | PENDING | CANCEL */}
						<div className='pie-legend-cards d-flex flex-column gap-2 mt-3'>
							{/* SUCCESS ROW */}
							<div
								className={classNames('status-breakdown-row row-success', {
									active: hoveredSlice === 'success',
								})}
								onMouseEnter={() => setHoveredSlice('success')}
								onMouseLeave={() => setHoveredSlice(null)}>
								<div className='d-flex align-items-center gap-2'>
									<span className='status-dot dot-success' />
									<span className='status-name'>Success</span>
								</div>
								<div className='d-flex align-items-center gap-2'>
									<span className='status-amount text-success'>
										{formatCurrency(successAmount)}
									</span>
									<span className='status-badge badge-success'>
										{successPct.toFixed(1)}%
									</span>
								</div>
							</div>

							{/* PENDING ROW */}
							<div
								className={classNames('status-breakdown-row row-pending', {
									active: hoveredSlice === 'pending',
								})}
								onMouseEnter={() => setHoveredSlice('pending')}
								onMouseLeave={() => setHoveredSlice(null)}>
								<div className='d-flex align-items-center gap-2'>
									<span className='status-dot dot-pending' />
									<span className='status-name'>Pending</span>
								</div>
								<div className='d-flex align-items-center gap-2'>
									<span className='status-amount text-warning'>
										{formatCurrency(pendingAmount)}
									</span>
									<span className='status-badge badge-pending'>
										{pendingPct.toFixed(1)}%
									</span>
								</div>
							</div>

							{/* CANCEL / FAIL ROW */}
							<div
								className={classNames('status-breakdown-row row-fail', {
									active: hoveredSlice === 'fail',
								})}
								onMouseEnter={() => setHoveredSlice('fail')}
								onMouseLeave={() => setHoveredSlice(null)}>
								<div className='d-flex align-items-center gap-2'>
									<span className='status-dot dot-fail' />
									<span className='status-name'>Cancel</span>
								</div>
								<div className='d-flex align-items-center gap-2'>
									<span className='status-amount text-danger'>
										{formatCurrency(failAmount)}
									</span>
									<span className='status-badge badge-fail'>
										{failPct.toFixed(1)}%
									</span>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default AddMoneySummarySection;
