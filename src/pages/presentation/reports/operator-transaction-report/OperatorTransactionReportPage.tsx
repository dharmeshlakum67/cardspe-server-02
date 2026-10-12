import React, { FC } from 'react';
import DynamicReportViewer from '../components/DynamicReportViewer';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';

const OPERATOR_TRANSACTION_REPORT_BREADCRUMBS = [
	{ label: 'Reports', to: undefined },
	{ label: 'Operator Transaction Report', current: true },
];

export const OperatorTransactionReportPage: FC = () => {
	return (
		<DynamicReportViewer
			reportType='operator-transaction-report'
			permissionKey={PERMISSION_KEYS.OPERATOR_TRANSACTION_REPORT}
			parentPermissionKey={PERMISSION_KEYS.REPORTS}
			defaultTitle='Operator Transaction Report'
			defaultSortBy='total_amount'
			defaultSortOrder='DESC'
			defaultLimit={10}
			breadcrumbs={OPERATOR_TRANSACTION_REPORT_BREADCRUMBS}
		/>
	);
};

export default OperatorTransactionReportPage;
