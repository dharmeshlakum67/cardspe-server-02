import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicReportViewer from '../components/DynamicReportViewer';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { IReportRow } from '../type/report.type';
import { encryptId } from '../../../../helpers/routeEncryption';

const MOBIQUICK_TRANSACTION_REPORT_BREADCRUMBS = [
	{ label: 'Reports', to: undefined },
	{ label: 'Mobikwik Transaction Report', current: true },
];

export const MobiquickTransactionReportPage: FC = () => {
	const navigate = useNavigate();

	const handleRowClick = (row: IReportRow) => {
		// 1. Check if backend provided a hyperlink on any column style
		if (row.__style) {
			for (const colKey of Object.keys(row.__style)) {
				const styleItem = row.__style[colKey];
				if (
					styleItem?.hyperlink &&
					typeof styleItem.hyperlink === 'string' &&
					styleItem.hyperlink.trim()
				) {
					const link = styleItem.hyperlink.trim();
					if (link.startsWith('http://') || link.startsWith('https://')) {
						window.open(link, '_blank', 'noopener,noreferrer');
						return;
					}
					let targetRoute = link.startsWith('/') ? link : `/${link}`;
					const viewMatch = targetRoute.match(/^(\/.+\/(?:view|edit)\/)(\d+)$/);
					if (viewMatch) {
						targetRoute = `${viewMatch[1]}${encryptId(viewMatch[2])}`;
					}
					navigate(targetRoute, {
						state: { transaction: row, from: 'mobiquick_transaction_report' },
					});
					return;
				}
			}
		}

		// 2. If row has wallet_transaction_id or id, navigate to wallet transaction view
		const targetId = row.wallet_transaction_id || row.id;
		if (targetId) {
			navigate(`/payments/wallet-transactions/view/${encryptId(String(targetId))}`, {
				state: { transaction: row, from: 'mobiquick_transaction_report' },
			});
		}
	};

	return (
		<DynamicReportViewer
			reportType='mobiquick-transaction-report'
			permissionKey={PERMISSION_KEYS.MOBIQUICK_TRANSACTION_REPORT}
			parentPermissionKey={PERMISSION_KEYS.REPORTS}
			defaultTitle='Mobikwik Transaction Report'
			defaultSortBy='created_at'
			defaultSortOrder='DESC'
			defaultLimit={10}
			breadcrumbs={MOBIQUICK_TRANSACTION_REPORT_BREADCRUMBS}
			onRowClick={handleRowClick}
		/>
	);
};

export default MobiquickTransactionReportPage;
