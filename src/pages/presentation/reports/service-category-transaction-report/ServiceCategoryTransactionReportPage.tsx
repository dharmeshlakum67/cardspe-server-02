import React, { FC } from 'react';
import DynamicReportViewer from '../components/DynamicReportViewer';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';

const SERVICE_CATEGORY_REPORT_BREADCRUMBS = [
	{ label: 'Reports', to: undefined },
	{ label: 'Service Category Transaction Report', current: true },
];

export const ServiceCategoryTransactionReportPage: FC = () => {
	return (
		<DynamicReportViewer
			reportType='service-category-transaction-report'
			permissionKey={PERMISSION_KEYS.SERVICE_CATEGORY_TRANSACTION_REPORT}
			parentPermissionKey={PERMISSION_KEYS.REPORTS}
			defaultTitle='Service Category Transaction Report'
			defaultSortBy='total_amount'
			defaultSortOrder='DESC'
			defaultLimit={10}
			breadcrumbs={SERVICE_CATEGORY_REPORT_BREADCRUMBS}
		/>
	);
};

export default ServiceCategoryTransactionReportPage;
