import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicReportViewer from '../components/DynamicReportViewer';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { IReportRow } from '../type/report.type';
import { encryptId } from '../../../../helpers/routeEncryption';

const INCOME_REPORT_BREADCRUMBS = [
	{ label: 'Reports', to: undefined },
	{ label: 'Income Report', current: true },
];

export const IncomeReportPage: FC = () => {
	const navigate = useNavigate();

	const handleRowClick = (row: IReportRow) => {
		// 1. Check if backend provided an explicit hyperlink on invoice_number or any column style
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
						state: { transaction: row, from: 'income_report' },
					});
					return;
				}
			}
		}

		// 2. If row has wallet_transaction_id or id, navigate to wallet transaction view
		const targetId = row.wallet_transaction_id || row.id;
		if (targetId) {
			navigate(`/payments/wallet-transactions/view/${encryptId(String(targetId))}`, {
				state: { transaction: row, from: 'income_report' },
			});
		}
	};

	return (
		<DynamicReportViewer
			reportType='income-report'
			permissionKey={PERMISSION_KEYS.INCOME_REPORT}
			parentPermissionKey={PERMISSION_KEYS.REPORTS}
			defaultTitle='Income Report'
			defaultSortBy='created_at'
			defaultSortOrder='DESC'
			defaultLimit={20}
			breadcrumbs={INCOME_REPORT_BREADCRUMBS}
			onRowClick={handleRowClick}
			emptyDateRangeByDefault
		/>
	);
};

export default IncomeReportPage;
