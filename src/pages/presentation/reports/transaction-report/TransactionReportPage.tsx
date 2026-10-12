import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicReportViewer from '../components/DynamicReportViewer';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { IReportRow } from '../type/report.type';
import { encryptId } from '../../../../helpers/routeEncryption';

const TRANSACTION_REPORT_BREADCRUMBS = [
	{ label: 'Reports', to: undefined },
	{ label: 'Transaction Report', current: true },
];

export const TransactionReportPage: FC = () => {
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
						state: { transaction: row, from: 'transaction_report' },
					});
					return;
				}
			}
		}

		// 2. If row has wallet_transaction_id, use encrypted URL
		if (row.wallet_transaction_id) {
			navigate(`/payments/wallet-transactions/view/${encryptId(String(row.wallet_transaction_id))}`, {
				state: { transaction: row, from: 'transaction_report' },
			});
		}
	};

	return (
		<DynamicReportViewer
			reportType='transaction-report'
			permissionKey={PERMISSION_KEYS.TRANSACTION_REPORT}
			parentPermissionKey={PERMISSION_KEYS.REPORTS}
			defaultTitle='Transaction Report'
			breadcrumbs={TRANSACTION_REPORT_BREADCRUMBS}
			onRowClick={handleRowClick}
		/>
	);
};

export default TransactionReportPage;
