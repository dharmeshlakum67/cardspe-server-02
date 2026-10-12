/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/require-default-props, react/default-props-match-prop-types */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import apiClient from '../../../../services/apiClient';
import { IReportFilterItem, IReportFilterOption } from '../type/report.type';

// IN-MEMORY CACHE & IN-FLIGHT PROMISE MAPS (GUARANTEES EXACTLY ONE NETWORK REQUEST)
const dropdownOptionsCache = new Map<string, IReportFilterOption[]>();
const dropdownPendingRequests = new Map<string, Promise<IReportFilterOption[]>>();

const dropdownSearchCache = new Map<string, IReportFilterOption[]>();
const dropdownSearchPendingRequests = new Map<string, Promise<IReportFilterOption[]>>();

export interface IAsyncDropdownFilterProps {
	filter: IReportFilterItem;
	value?: any;
	onChange: (value: any) => void;
	extraParams?: Record<string, any>;
	width?: string | number;
	disabled?: boolean;
	disabledPlaceholder?: string;
}

export const AsyncDropdownFilter: FC<IAsyncDropdownFilterProps> = ({
	filter,
	value,
	onChange,
	extraParams,
	width = '210px',
	disabled = false,
	disabledPlaceholder,
}) => {
	const rawApiRoute = filter.apiRoute || (filter as any).apiUrl || (filter as any).endpoint || '';
	let cleanApiRoute = '';
	if (rawApiRoute) {
		cleanApiRoute = rawApiRoute.startsWith('/') ? rawApiRoute : `/${rawApiRoute}`;
	}

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [options, setOptions] = useState<IReportFilterOption[]>(filter.options || []);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// REFS TO AVOID REDUNDANT EFFECT RE-RUNS
	const extraParamsRef = useRef(extraParams);
	extraParamsRef.current = extraParams;

	const filterOptionsRef = useRef(filter.options);
	filterOptionsRef.current = filter.options;

	// BUILD STABLE SERIALIZED QUERY STRING FOR EXTRA PARAMS
	const extraParamsSerialized = JSON.stringify(extraParams || {});
	const extraParamsKey = useMemo(() => {
		try {
			const parsed = JSON.parse(extraParamsSerialized);
			const searchParams = new URLSearchParams();
			Object.entries(parsed).forEach(([k, v]) => {
				if (v !== undefined && v !== null && v !== '' && v !== 'all') {
					searchParams.append(k, String(v));
				}
			});
			return searchParams.toString();
		} catch {
			return '';
		}
	}, [extraParamsSerialized]);

	// COMPACT STABLE CACHE KEY FOR INITIAL FETCH
	const cacheKey = useMemo(() => {
		if (!cleanApiRoute) return '';
		return `${cleanApiRoute}${extraParamsKey ? `?${extraParamsKey}` : ''}`;
	}, [cleanApiRoute, extraParamsKey]);

	// PARSE BACKEND RESPONSE INTO STANDARDIZED OPTIONS
	const parseApiResponse = useCallback((res: any): IReportFilterOption[] => {
		let items: any[] = [];
		if (Array.isArray(res)) {
			items = res;
		} else if (Array.isArray(res?.data)) {
			items = res.data;
		} else if (Array.isArray(res?.data?.data)) {
			items = res.data.data;
		}

		return items.map((item: any) => {
			const val = item.id !== undefined && item.id !== null ? item.id : item.value;
			let label = item.name || item.title || item.label || String(val);
			if (item.operator_code) {
				label = `${item.name} (${item.operator_code})`;
			}
			return {
				label,
				value: val,
			};
		});
	}, []);

	// FETCH INITIAL OPTIONS EXACTLY ONCE (DEDUPLICATES CONCURRENT IN-FLIGHT CALLS)
	useEffect(() => {
		if (disabled || !cleanApiRoute || !cacheKey) {
			if (filterOptionsRef.current) {
				setOptions(filterOptionsRef.current);
			}
			return undefined;
		}

		// 1. If options already exist in cache, load immediately without network call!
		if (dropdownOptionsCache.has(cacheKey)) {
			setOptions(dropdownOptionsCache.get(cacheKey)!);
			setIsLoading(false);
			return undefined;
		}

		let isCancelled = false;
		setIsLoading(true);

		const fetchInitialOptions = async () => {
			try {
				let parsedOptions: IReportFilterOption[];

				// 2. Check if identical request is already in-flight: reuse existing promise!
				if (dropdownPendingRequests.has(cacheKey)) {
					parsedOptions = await dropdownPendingRequests.get(cacheKey)!;
				} else {
					// 3. Initiate single network request and register promise in pending map
					const requestPromise = (async () => {
						try {
							const params: Record<string, any> = {
								page: 1,
								limit: 50,
								...(extraParamsRef.current || {}),
							};
							const res = await apiClient<any>(cleanApiRoute, { params });
							const parsed = parseApiResponse(res);
							dropdownOptionsCache.set(cacheKey, parsed);
							return parsed;
						} finally {
							dropdownPendingRequests.delete(cacheKey);
						}
					})();

					dropdownPendingRequests.set(cacheKey, requestPromise);
					parsedOptions = await requestPromise;
				}

				if (!isCancelled) {
					setOptions(parsedOptions);
				}
			} catch {
				if (!isCancelled) {
					setOptions([]);
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		};

		fetchInitialOptions();

		return () => {
			isCancelled = true;
		};
	}, [cleanApiRoute, cacheKey, disabled, parseApiResponse]);

	// HANDLE SEARCH DEBOUNCING (300ms) WITH IN-FLIGHT DEDUPLICATION
	useEffect(() => {
		if (!cleanApiRoute) {
			if (filterOptionsRef.current) {
				if (!searchTerm.trim()) {
					setOptions(filterOptionsRef.current);
				} else {
					const lower = searchTerm.toLowerCase();
					setOptions(filterOptionsRef.current.filter((o) => o.label.toLowerCase().includes(lower)));
				}
			}
			return undefined;
		}

		// If search term is empty, restore cached initial options immediately WITHOUT calling API!
		if (!searchTerm.trim()) {
			if (dropdownOptionsCache.has(cacheKey)) {
				setOptions(dropdownOptionsCache.get(cacheKey)!);
			}
			setIsLoading(false);
			return undefined;
		}

		const cleanSearch = searchTerm.trim().toLowerCase();
		const searchCacheKey = `${cacheKey}&search=${cleanSearch}`;

		// If cached, return immediately
		if (dropdownSearchCache.has(searchCacheKey)) {
			setOptions(dropdownSearchCache.get(searchCacheKey)!);
			setIsLoading(false);
			return undefined;
		}

		setIsLoading(true);
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		searchTimeoutRef.current = setTimeout(async () => {
			try {
				let parsed: IReportFilterOption[];

				if (dropdownSearchPendingRequests.has(searchCacheKey)) {
					parsed = await dropdownSearchPendingRequests.get(searchCacheKey)!;
				} else {
					const searchPromise = (async () => {
						try {
							const params: Record<string, any> = {
								search: searchTerm.trim(),
								page: 1,
								limit: 50,
								...(extraParamsRef.current || {}),
							};
							const res = await apiClient<any>(cleanApiRoute, { params });
							const parsedData = parseApiResponse(res);
							dropdownSearchCache.set(searchCacheKey, parsedData);
							return parsedData;
						} finally {
							dropdownSearchPendingRequests.delete(searchCacheKey);
						}
					})();

					dropdownSearchPendingRequests.set(searchCacheKey, searchPromise);
					parsed = await searchPromise;
				}

				setOptions(parsed);
			} catch {
				setOptions([]);
			} finally {
				setIsLoading(false);
			}
		}, 300);

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, [searchTerm, cleanApiRoute, cacheKey, parseApiResponse]);

	// CLOSE DROPDOWN WHEN CLICKING OUTSIDE
	useEffect(() => {
		const handleDocumentClick = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
				setSearchTerm('');
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleDocumentClick);
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 50);
		}

		return () => {
			document.removeEventListener('mousedown', handleDocumentClick);
		};
	}, [isOpen]);

	// RESOLVE CURRENTLY SELECTED OPTION LABEL
	const selectedOption = useMemo(() => {
		if (value === undefined || value === null || value === '' || value === 'all') {
			return null;
		}
		const foundInOptions = options.find((opt) => String(opt.value) === String(value));
		if (foundInOptions) return foundInOptions;

		const cached = dropdownOptionsCache.get(cacheKey);
		if (cached) {
			const foundInCached = cached.find((opt) => String(opt.value) === String(value));
			if (foundInCached) return foundInCached;
		}

		return { label: String(value), value };
	}, [value, options, cacheKey]);

	const hasSelection = Boolean(selectedOption);

	const handleSelect = (val: any) => {
		onChange(val);
		setIsOpen(false);
		setSearchTerm('');
	};

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange('');
		setSearchTerm('');
	};

	// COMPUTE TRIGGER LABEL CLEANLY WITHOUT NESTED TERNARY
	let triggerLabel = filter.placeholder || `All ${filter.label}`;
	if (disabled) {
		triggerLabel = disabledPlaceholder || `Select ${filter.label}`;
	} else if (selectedOption) {
		triggerLabel = selectedOption.label;
	}

	return (
		<div
			ref={containerRef}
			className='filter-field async-dropdown-wrapper position-relative'
			style={{ width }}>
			<span className='filter-field-label d-block'>{filter.label}</span>

			{/* DROPDOWN TRIGGER BUTTON */}
			<button
				type='button'
				disabled={disabled}
				className={`async-select-control form-select d-flex align-items-center justify-content-between text-start ${
					isOpen && !disabled ? 'is-open' : ''
				} ${hasSelection ? 'has-value' : ''} ${disabled ? 'is-disabled' : ''}`}
				onClick={() => {
					if (!disabled) setIsOpen((prev) => !prev);
				}}
				style={disabled ? { cursor: 'not-allowed', backgroundColor: '#f8fafc', opacity: 0.7 } : undefined}>
				<span className='text-truncate me-1' style={{ maxWidth: 'calc(100% - 36px)' }}>
					{triggerLabel}
				</span>

				<div className='d-flex align-items-center gap-1 ms-auto flex-shrink-0'>
					{hasSelection && !disabled && (
						<span
							role='button'
							tabIndex={0}
							className='async-clear-btn p-0 border-0 bg-transparent text-muted'
							title='Clear selection'
							onClick={handleClear}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleClear(e as any);
								}
							}}>
							<Icon icon='Close' size='sm' />
						</span>
					)}
					<Icon
						icon='KeyboardArrowDown'
						size='sm'
						className={`async-arrow-icon ${isOpen && !disabled ? 'rotate-180' : ''}`}
					/>
				</div>
			</button>

			{/* DROPDOWN POPUP MENU */}
			{isOpen && (
				<div className='async-dropdown-menu shadow-lg rounded-3'>
					{/* SEARCH INPUT BAR */}
					<div className='p-2 border-bottom bg-light bg-opacity-50'>
						<div className='position-relative'>
							<input
								ref={searchInputRef}
								type='text'
								className='form-control form-control-sm ps-4 pe-4'
								placeholder={`Search ${filter.label}...`}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
							<Icon
								icon='Search'
								size='sm'
								className='position-absolute top-50 start-0 translate-middle-y ms-2 text-muted'
							/>
							{searchTerm && (
								<button
									type='button'
									className='btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted p-1 border-0 bg-transparent me-1'
									onClick={() => setSearchTerm('')}>
									<Icon icon='Close' size='sm' />
								</button>
							)}
						</div>
					</div>

					{/* OPTIONS LIST */}
					<div className='async-options-list py-1' style={{ maxHeight: '230px', overflowY: 'auto' }}>
						{/* ALL / CLEAR OPTION */}
						<button
							type='button'
							className={`async-option-item w-100 text-start border-0 px-3 py-2 d-flex align-items-center justify-content-between ${
								!hasSelection ? 'is-selected' : ''
							}`}
							onClick={() => handleSelect('')}>
							<span className='small fw-medium text-muted'>All {filter.label}</span>
							{!hasSelection && <Icon icon='Check' size='sm' className='text-primary' />}
						</button>

						{/* SPINNER LOADING */}
						{isLoading && (
							<div className='py-3 text-center text-muted small d-flex align-items-center justify-content-center gap-2'>
								<Spinner isSmall color='primary' />
								<span>Loading {filter.label.toLowerCase()}...</span>
							</div>
						)}

						{/* OPTIONS ITEMS */}
						{!isLoading && options.length === 0 && (
							<div className='py-3 text-center text-muted small'>
								{searchTerm ? 'No matches found' : 'No options available'}
							</div>
						)}

						{!isLoading &&
							options.map((opt) => {
								const isSelected = String(opt.value) === String(value);
								return (
									<button
										key={String(opt.value)}
										type='button'
										className={`async-option-item w-100 text-start border-0 px-3 py-2 d-flex align-items-center justify-content-between ${
											isSelected ? 'is-selected' : ''
										}`}
										onClick={() => handleSelect(opt.value)}>
										<span className='small text-truncate'>{opt.label}</span>
										{isSelected && <Icon icon='Check' size='sm' className='text-primary' />}
									</button>
								);
							})}
					</div>
				</div>
			)}
		</div>
	);
};

export default AsyncDropdownFilter;
