import apiClient from '../../../../services/apiClient';
import { ENV } from '../../../../config/env.config';
import { IReportQueryParams, IReportResponse } from '../type/report.type';

export const reportService = {
	// 1. GET GENERIC REPORT DATA (JSON LIST)
	getReportList: async (
		reportType: string,
		params?: IReportQueryParams,
	): Promise<IReportResponse> => {
		const cleanType = reportType.replace(/^\//, '').replace(/\/$/, '');
		const url = `/api/reports/${cleanType}/list`;

		const apiParams: Record<string, any> = {};
		if (params) {
			Object.entries(params).forEach(([key, val]) => {
				if (val !== undefined && val !== null && val !== '' && val !== 'all') {
					apiParams[key] = typeof val === 'string' ? val.trim() : val;
				}
			});
			if (params.page !== undefined) apiParams.page = params.page;
			if (params.limit !== undefined) apiParams.limit = params.limit;
		}

		return apiClient<IReportResponse>(url, {
			params: apiParams,
		});
	},

	// 2. DOWNLOAD GENERIC REPORT (EXCEL XLSX BLOB)
	downloadReport: async (
		reportType: string,
		params?: IReportQueryParams,
		customFilename?: string,
	): Promise<void> => {
		const cleanType = reportType.replace(/^\//, '').replace(/\/$/, '');
		const rawUrl = `/api/reports/${cleanType}/download`;

		const apiParams: Record<string, any> = {};
		if (params) {
			Object.entries(params).forEach(([key, val]) => {
				if (
					key !== 'page' &&
					key !== 'limit' &&
					val !== undefined &&
					val !== null &&
					val !== '' &&
					val !== 'all'
				) {
					apiParams[key] = typeof val === 'string' ? val.trim() : val;
				}
			});
		}

		const searchParams = new URLSearchParams();
		Object.entries(apiParams).forEach(([key, val]) => {
			if (val !== undefined && val !== null) {
				searchParams.append(key, String(val));
			}
		});

		const queryString = searchParams.toString();
		const fullUrl = `${ENV.API_BASE_URL.replace(/\/$/, '')}/${rawUrl.replace(/^\//, '')}${
			queryString ? `?${queryString}` : ''
		}`;

		const token =
			localStorage.getItem(ENV.TOKEN_KEY) || sessionStorage.getItem(ENV.TOKEN_KEY);

		const response = await fetch(fullUrl, {
			method: 'GET',
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});

		if (!response.ok) {
			let errorMsg = `Download failed with status ${response.status}`;
			try {
				const errorJson = await response.json();
				errorMsg = errorJson?.message || errorJson?.error || errorMsg;
			} catch {
				const errorText = await response.text();
				if (errorText) errorMsg = errorText;
			}
			throw new Error(errorMsg);
		}

		// EXTRACT FILENAME FROM CONTENT-DISPOSITION OR FALLBACK
		let filename =
			customFilename ||
			`${reportType.replace(/-/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

		const disposition = response.headers.get('content-disposition');
		if (disposition && disposition.includes('filename=')) {
			const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
			if (match && match[1]) {
				filename = match[1].replace(/['"]/g, '').trim();
			}
		}

		const blob = await response.blob();
		const downloadUrl = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = downloadUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(downloadUrl);
	},
};

export default reportService;
