import reportService from '../../service/reportService';
import {
	IReportQueryParams as ITransactionReportQueryParams,
	IReportResponse as ITransactionReportResponse,
} from '../../type/report.type';

export const transactionReportService = {
	// 1. GET TRANSACTION REPORT LIST (JSON)
	getTransactionReportList: async (
		params?: ITransactionReportQueryParams,
	): Promise<ITransactionReportResponse> => {
		return reportService.getReportList('transaction-report', params);
	},

	// 2. DOWNLOAD TRANSACTION REPORT (EXCEL XLSX BLOB)
	downloadTransactionReport: async (
		params?: ITransactionReportQueryParams,
	): Promise<void> => {
		return reportService.downloadReport('transaction-report', params);
	},
};

export default transactionReportService;

