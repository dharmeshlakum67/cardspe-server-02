import React, { FC } from 'react';
import { useParams } from 'react-router-dom';
import DynamicReportViewer from './components/DynamicReportViewer';

export const GenericReportPage: FC = () => {
	const { reportType } = useParams<{ reportType: string }>();
	const activeType = reportType || 'transaction-report';

	return <DynamicReportViewer reportType={activeType} />;
};

export default GenericReportPage;
