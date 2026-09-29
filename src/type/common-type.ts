export interface IMasterStatusOption {
	value: number;
	label: string;
}

export interface ICommonConstantsResponse {
	success: boolean;
	status: string;
	message: string;
	data: {
		master_status: IMasterStatusOption[];
		[key: string]: any;
	};
}
