/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/no-array-index-key, no-nested-ternary, react/require-default-props */
import React, { FC } from 'react';
import classNames from 'classnames';
import Icon from '../../../../components/icon/Icon';
import { ServiceAmountStats } from '../type/dashboard.type';

interface IRechargeSummarySectionProps {
	rechargeSummary: ServiceAmountStats[];
	isLoading: boolean;
}

const formatCurrency = (val?: number | null): string => {
	if (val === undefined || val === null || isNaN(val)) return '₹0.00';
	return `₹${val.toLocaleString('en-IN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

const formatCount = (val?: number | null): string => {
	if (val === undefined || val === null || isNaN(val)) return '0';
	return val.toLocaleString('en-IN');
};

export const RechargeSummarySection: FC<IRechargeSummarySectionProps> = ({
	rechargeSummary,
	isLoading,
}) => {
	const renderCellContent = (
		amount: number,
		count: number,
		valueClassName?: string,
		countBadgeClassName?: string,
	) => {
		return (
			<div className='d-flex flex-column align-items-end gap-0'>
				<span className={classNames('fw-bold', valueClassName)}>
					{formatCurrency(amount)}
				</span>
				<span
					className={classNames(
						'text-muted fw-semibold',
						countBadgeClassName,
					)}
					style={{ fontSize: '0.72rem', letterSpacing: '0.01em' }}>
					{formatCount(count)} txns
				</span>
			</div>
		);
	};

	return (
		<div className='dashboard-section-card h-100'>
			{/* SECTION HEADER */}
			<div className='section-header flex-wrap gap-2'>
				<div className='section-title-wrapper'>
					<div className='section-icon-box recharge'>
						<Icon icon='Bolt' size='lg' />
					</div>
					<h3 className='section-title'>Recharge Summary</h3>
				</div>

				{!isLoading && rechargeSummary && rechargeSummary.length > 0 && (
					<span className='section-badge'>
						{rechargeSummary.length - 1} Services
					</span>
				)}
			</div>

			{/* SECTION BODY (5 COMPACT COLUMNS) */}
			<div className='section-body p-0'>
				<div className='dashboard-table-container scrollable-y'>
					<table className='dashboard-summary-table'>
						<thead>
							<tr>
								<th style={{ minWidth: '150px' }}>Service Name</th>
								<th style={{ minWidth: '110px' }}>Total</th>
								<th style={{ minWidth: '110px' }}>Success</th>
								<th style={{ minWidth: '110px' }}>Pending</th>
								<th style={{ minWidth: '110px' }}>Fail</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								[1, 2, 3, 4, 5, 6].map((i) => (
									<tr key={i}>
										<td>
											<div className='skeleton-box' style={{ width: 130, height: 16 }} />
										</td>
										<td>
											<div className='skeleton-box ms-auto' style={{ width: 70, height: 16 }} />
										</td>
										<td>
											<div className='skeleton-box ms-auto' style={{ width: 70, height: 16 }} />
										</td>
										<td>
											<div className='skeleton-box ms-auto' style={{ width: 70, height: 16 }} />
										</td>
										<td>
											<div className='skeleton-box ms-auto' style={{ width: 70, height: 16 }} />
										</td>
									</tr>
								))
							) : rechargeSummary && rechargeSummary.length > 0 ? (
								rechargeSummary.map((item, idx) => {
									const isTotal = item.service_name.toLowerCase().includes('total');
									return (
										<tr
											key={`${item.service_name}-${idx}`}
											className={classNames({ 'row-total': isTotal })}>
											<td className={classNames({ 'fw-bold': isTotal })}>
												{item.service_name}
											</td>
											<td>
												{renderCellContent(
													item.total_amount,
													item.total_count,
													'text-dark',
												)}
											</td>
											<td>
												{renderCellContent(
													item.success_amount,
													item.success_count,
													'status-success-val',
												)}
											</td>
											<td>
												{renderCellContent(
													item.pending_amount,
													item.pending_count,
													'status-pending-val',
												)}
											</td>
											<td>
												{renderCellContent(
													item.fail_amount,
													item.fail_count,
													'status-fail-val',
												)}
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td colSpan={5} className='text-center py-4 text-muted'>
										No recharge data available for this period.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default RechargeSummarySection;
