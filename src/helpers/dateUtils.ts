import dayjs from 'dayjs';

export const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';
export const DEFAULT_TIME_FORMAT = 'hh:mm A';
export const DEFAULT_DATE_TIME_FORMAT = 'DD/MM/YYYY hh:mm A';

// FORMAT DATE IN DD/MM/YYYY FORMAT
export const formatDate = (
	date?: string | number | Date | null,
	formatStr = DEFAULT_DATE_FORMAT,
): string => {
	if (!date) return '-';
	const parsed = dayjs(date);
	if (!parsed.isValid()) return '-';
	return parsed.format(formatStr);
};

// FORMAT TIME IN 12-HOUR / 24-HOUR FORMAT
export const formatTime = (
	date?: string | number | Date | null,
	formatStr = DEFAULT_TIME_FORMAT,
): string => {
	if (!date) return '-';
	const parsed = dayjs(date);
	if (!parsed.isValid()) return '-';
	return parsed.format(formatStr);
};

// FORMAT DATE AND TIME OBJECT FOR MULTI-LINE RENDERING
export const formatDateTime = (
	date?: string | number | Date | null,
): { date: string; time: string; full: string } => {
	if (!date) {
		return { date: '-', time: '-', full: '-' };
	}
	const parsed = dayjs(date);
	if (!parsed.isValid()) {
		return { date: '-', time: '-', full: '-' };
	}
	return {
		date: parsed.format(DEFAULT_DATE_FORMAT),
		time: parsed.format(DEFAULT_TIME_FORMAT),
		full: parsed.format(DEFAULT_DATE_TIME_FORMAT),
	};
};

export default {
	formatDate,
	formatTime,
	formatDateTime,
	DEFAULT_DATE_FORMAT,
	DEFAULT_TIME_FORMAT,
	DEFAULT_DATE_TIME_FORMAT,
};
