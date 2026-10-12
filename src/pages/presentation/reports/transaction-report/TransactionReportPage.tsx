import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicReportViewer from '../components/DynamicReportViewer';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { encryptId } from '../../../../helpers/routeEncryption';
import { IReportRow } from '../type/report.type';

const TRANSACTION_REPORT_BREADCRUMBS = [
	{ label: 'Reports', to: undefined },
	{ label: 'Transaction Report', current: true },
];

export const TransactionReportPage: FC = () => {
	const navigate = useNavigate();

	const handleRowClick = (row: IReportRow) => {
		const targetId =
			row.id ||
			row.transaction_id ||
			row.txn_id ||
			row.service_transaction_id ||
			row.wallet_transaction_id ||
			row._id;
		if (targetId) {
			const safeEncryptedId = String(targetId).startsWith('sm_')
				? String(targetId)
				: encryptId(String(targetId));
			navigate(`/${PAGE_ROUTES.WALLET_TRANSACTION}/view/${safeEncryptedId}`, {
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
