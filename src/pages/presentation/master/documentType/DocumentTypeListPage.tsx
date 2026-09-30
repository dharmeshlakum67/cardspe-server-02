/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../../components/common/ListingPage';
import { PillBadge } from '../../../../components/common/PillBadge';
import documentTypeService from './service/documentTypeService';
import { IDocumentTypeItem } from './type/document-type';
import showNotification from '../../../../components/extras/showNotification';
import Icon from '../../../../components/icon/Icon';
import { ConfirmationModal, StatusToggle, DateRangePicker } from '../../../../components/common';
import usePermission from '../../../../hooks/usePermission';
import useDebounce from '../../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { encryptId } from '../../../../helpers/routeEncryption';
import { formatDateTime } from '../../../../helpers/dateUtils';
import constantService, { IConstantOption } from '../../../../services/constantService';
import './css/DocumentType.scss';

const DocumentTypeListPage: FC = () => {
	const navigate = useNavigate();
	const [documentTypes, setDocumentTypes] = useState<IDocumentTypeItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [docToDelete, setDocToDelete] = useState<IDocumentTypeItem | null>(null);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	// STATUS TOGGLE IN-PROGRESS STATE
	const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

	// DYNAMIC CONSTANTS (STATUS & VERIFICATION SERVICE)
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
	]);
	const [verificationServiceOptions, setVerificationServiceOptions] = useState<IConstantOption[]>([]);

	useEffect(() => {
		let isMounted = true;
		const loadConstants = async () => {
			try {
				const [sOpts, vOpts] = await Promise.all([
					constantService.getStatusConstants(),
					constantService.getDocumentTypeConstants(),
				]);
				if (isMounted) {
					if (sOpts && sOpts.length > 0) setStatusOptions(sOpts);
					if (vOpts && vOpts.length > 0) setVerificationServiceOptions(vOpts);
				}
			} catch (err) {}
		};
		loadConstants();
		return () => {
			isMounted = false;
		};
	}, []);

	// FILTER STATES
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearchTerm = useDebounce(searchTerm, 1500);
	const [statusFilter, setStatusFilter] = useState<string>('');
	const [mandatoryFilter, setMandatoryFilter] = useState<string>('');
	const [verificationServiceFilter, setVerificationServiceFilter] =
		useState<string>('');
	const [startDate, setStartDate] = useState<string>('');
	const [endDate, setEndDate] = useState<string>('');

	// PAGINATION STATES
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, canUpdate, isLoadingPermissions } = usePermission();

	// REF TO PREVENT DUPLICATE FETCHES ON MOUNT / RETURN NAVIGATION
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// FETCH DOCUMENT TYPES FROM API
	const fetchDocumentTypes = useCallback(
		async (force = false) => {
			if (
				isLoadingPermissions ||
				(!canRead(PERMISSION_KEYS.MASTER) && !canRead(PERMISSION_KEYS.DOCUMENT_TYPE))
			) {
				return;
			}

			const isDateRangeValid = Boolean(startDate && endDate);
			const currentFetchKey = `${debouncedSearchTerm}_${statusFilter}_${mandatoryFilter}_${verificationServiceFilter}_${
				isDateRangeValid ? `${startDate}_${endDate}` : ''
			}_${currentPage}_${perPage}`;

			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				let isMandatoryParam: boolean | undefined;
				if (mandatoryFilter === 'true') {
					isMandatoryParam = true;
				} else if (mandatoryFilter === 'false') {
					isMandatoryParam = false;
				}

				const res = await documentTypeService.getDocumentTypes({
					search: debouncedSearchTerm.trim() || undefined,
					status: statusFilter || undefined,
					is_mandatory: isMandatoryParam,
					verification_service: verificationServiceFilter || undefined,
					start_date: isDateRangeValid ? startDate : undefined,
					end_date: isDateRangeValid ? endDate : undefined,
					page: currentPage,
					limit: perPage,
				});

				if (res && res.data) {
					setDocumentTypes(res.data);
					setTotalDocuments(res.total_document ?? res.data.length);
				} else {
					setDocumentTypes([]);
					setTotalDocuments(0);
				}
			} catch (error: any) {
				showNotification(
					'Error fetching document types',
					error?.message || 'Could not load document types data',
					'danger',
				);
				setDocumentTypes([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[
			isLoadingPermissions,
			canRead,
			startDate,
			endDate,
			debouncedSearchTerm,
			statusFilter,
			mandatoryFilter,
			verificationServiceFilter,
			currentPage,
			perPage,
		],
	);

	useEffect(() => {
		const isDateRangeValid = Boolean(startDate && endDate);
		const currentFetchKey = `${debouncedSearchTerm}_${statusFilter}_${mandatoryFilter}_${verificationServiceFilter}_${
			isDateRangeValid ? `${startDate}_${endDate}` : ''
		}_${currentPage}_${perPage}`;

		if (
			!isLoadingPermissions &&
			(canRead(PERMISSION_KEYS.MASTER) || canRead(PERMISSION_KEYS.DOCUMENT_TYPE)) &&
			lastFetchKeyRef.current !== currentFetchKey &&
			!isFetchingRef.current
		) {
			fetchDocumentTypes();
		}
	}, [
		debouncedSearchTerm,
		statusFilter,
		mandatoryFilter,
		verificationServiceFilter,
		startDate,
		endDate,
		currentPage,
		perPage,
		isLoadingPermissions,
		canRead,
		fetchDocumentTypes,
	]);

	// HANDLE STATUS TOGGLE
	const handleStatusToggle = async (item: IDocumentTypeItem, newChecked: boolean) => {
		if (!canUpdate(PERMISSION_KEYS.MASTER) && !canUpdate(PERMISSION_KEYS.DOCUMENT_TYPE)) {
			showNotification(
				'Permission Denied',
				'You do not have permission to update document type status.',
				'warning',
			);
			return;
		}

		const newStatus: 'active' | 'inactive' = newChecked ? 'active' : 'inactive';

		setUpdatingStatusId(item.id);
		try {
			const res = await documentTypeService.updateDocumentTypeStatus(
				item.id,
				newStatus,
			);

			showNotification(
				'Status Updated',
				res?.message || `Status of "${item.document_name}" changed to ${newStatus === 'active' ? 'Active' : 'Inactive'}`,
				'success',
			);

			setDocumentTypes((prev) =>
				prev.map((doc) => (doc.id === item.id ? { ...doc, status: newStatus } : doc)),
			);
		} catch (error: any) {
			showNotification(
				'Update Failed',
				error?.message || 'Could not update document type status',
				'danger',
			);
		} finally {
			setUpdatingStatusId(null);
		}
	};

	// HANDLE DELETE CONFIRMATION
	const handleDeleteConfirm = async () => {
		if (!docToDelete) return;

		setIsDeleting(true);
		try {
			const res = await documentTypeService.deleteDocumentType(docToDelete.id);
			showNotification(
				'Success',
				res?.message || `Document type "${docToDelete.document_name}" deleted successfully`,
				'success',
			);
			setIsDeleteModalOpen(false);
			setDocToDelete(null);
			fetchDocumentTypes(true);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to delete document type',
				'danger',
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// RESET ALL FILTERS
	const handleResetFilters = () => {
		setSearchTerm('');
		setStatusFilter('');
		setMandatoryFilter('');
		setVerificationServiceFilter('');
		setStartDate('');
		setEndDate('');
		setCurrentPage(1);
	};

	// ACTIVE FILTER COUNT
	let activeFilterCount = 0;
	if (searchTerm) activeFilterCount += 1;
	if (statusFilter) activeFilterCount += 1;
	if (mandatoryFilter) activeFilterCount += 1;
	if (verificationServiceFilter) activeFilterCount += 1;
	if (startDate || endDate) activeFilterCount += 1;

	// TABLE COLUMNS CONFIGURATION MATCHING ROLE STYLE
	const columns: IListingColumn<IDocumentTypeItem>[] = [
		{
			key: 'document_name',
			header: 'Document Name',
			style: { width: 'auto' },
			headerStyle: { width: 'auto', minWidth: '160px' },
			render: (item) => (
				<div>
					<div className="fw-bold text-dark" style={{ fontSize: '0.875rem' }}>
						{item.document_name}
					</div>
					<small className="text-muted">{item.document_code}</small>
				</div>
			),
		},
		{
			key: 'is_mandatory',
			header: 'Mandatory',
			align: 'center',
			headerAlign: 'center',
			width: '130px',
			minWidth: '130px',
			headerStyle: { width: '130px', minWidth: '130px' },
			render: (item) => (
				<PillBadge color={item.is_mandatory ? 'danger' : 'gray'} isPill size="md">
					{item.is_mandatory ? 'Mandatory' : 'Optional'}
				</PillBadge>
			),
		},
		{
			key: 'required_files_count',
			header: 'Required Files',
			align: 'center',
			headerAlign: 'center',
			width: '140px',
			minWidth: '140px',
			headerStyle: { width: '140px', minWidth: '140px' },
			render: (item) => (
				<span className="fw-medium text-dark">{item.required_files_count} file(s)</span>
			),
		},
		{
			key: 'verification_service',
			header: 'Verification Service',
			align: 'center',
			headerAlign: 'center',
			width: '180px',
			minWidth: '180px',
			headerStyle: { width: '180px', minWidth: '180px' },
			render: (item) => {
				const service = item.verification_service || 'custom';
				const matchedOpt = verificationServiceOptions.find(
					(opt) => opt.value === service,
				);

				let label = 'Custom';
				if (matchedOpt) {
					label = matchedOpt.label;
				} else if (service === 'quick_kyc') {
					label = 'Quick KYC';
				} else if (service === 'custom_quick_kyc') {
					label = 'Custom & Quick KYC';
				}

				let color: any = 'blue';
				if (service === 'quick_kyc') {
					color = 'purple';
				} else if (service === 'custom_quick_kyc') {
					color = 'teal';
				}

				return (
					<PillBadge color={color} isPill size="md">
						{label}
					</PillBadge>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			align: 'center',
			headerAlign: 'center',
			width: '120px',
			minWidth: '120px',
			headerStyle: { width: '120px', minWidth: '120px' },
			render: (item) => {
				const isActive = (item.status || '').toLowerCase() === 'active';
				const isPermitted =
					canUpdate(PERMISSION_KEYS.MASTER) || canUpdate(PERMISSION_KEYS.DOCUMENT_TYPE);
				return (
					<StatusToggle
						checked={isActive}
						disabled={!isPermitted}
						isLoading={updatingStatusId === item.id}
						onChange={(newChecked) => handleStatusToggle(item, newChecked)}
						statusOptions={statusOptions}
						ariaLabel={`Toggle status for ${item.document_name}`}
					/>
				);
			},
		},
		{
			key: 'created_at',
			header: 'Created Date',
			align: 'center',
			headerAlign: 'center',
			width: '160px',
			minWidth: '160px',
			headerStyle: { width: '160px', minWidth: '160px' },
			render: (item) => {
				if (!item.created_at) return '-';
				const { date, time } = formatDateTime(item.created_at);
				return (
					<div className="d-flex flex-column">
						<span className="fw-medium text-dark" style={{ fontSize: '0.8125rem' }}>
							{date}
						</span>
						<span className="text-muted" style={{ fontSize: '0.75rem' }}>
							{time}
						</span>
					</div>
				);
			},
		},
	];

	return (
		<PageWrapper title="Document Type Master" permissionKey={PERMISSION_KEYS.DOCUMENT_TYPE}>
			<Page container="fluid">
				<ListingPage<IDocumentTypeItem>
					title="Document Types"
					breadcrumbs={[{ text: 'Master' }, { text: 'Document Type' }]}
					permissionKey={PERMISSION_KEYS.DOCUMENT_TYPE}
					onAddNew={() => {
						navigate(`/${PAGE_ROUTES.DOCUMENT_TYPE_ADD}`);
					}}
					addNewText="Create Document Type"
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className="d-flex align-items-end justify-content-end flex-wrap gap-3 w-100">
							{/* SEARCH INPUT */}
							<div style={{ width: '200px' }}>
								<label htmlFor="docSearch" className="filter-field-label">
									Search
								</label>
								<input
									id="docSearch"
									type="text"
									className="form-control"
									placeholder="Search Document..."
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* STATUS FILTER */}
							<div style={{ width: '140px' }}>
								<label htmlFor="docStatusFilter" className="filter-field-label">
									Status
								</label>
								<select
									id="docStatusFilter"
									className="form-select"
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value="">All Status</option>
									{statusOptions.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
							</div>

							{/* MANDATORY FILTER */}
							<div style={{ width: '140px' }}>
								<label htmlFor="docMandatoryFilter" className="filter-field-label">
									Type
								</label>
								<select
									id="docMandatoryFilter"
									className="form-select"
									value={mandatoryFilter}
									onChange={(e) => {
										setMandatoryFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value="">All Types</option>
									<option value="true">Mandatory</option>
									<option value="false">Optional</option>
								</select>
							</div>

							{/* VERIFICATION SERVICE FILTER */}
							<div style={{ width: '170px' }}>
								<label htmlFor="docVerificationFilter" className="filter-field-label">
									Verification Service
								</label>
								<select
									id="docVerificationFilter"
									className="form-select"
									value={verificationServiceFilter}
									onChange={(e) => {
										setVerificationServiceFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value="">All Services</option>
									{verificationServiceOptions.length > 0
										? verificationServiceOptions.map((opt) => (
												<option key={opt.value} value={opt.value}>
													{opt.label}
												</option>
										  ))
										: (
											<>
												<option value="custom">Custom</option>
												<option value="quick_kyc">Quick KYC</option>
												<option value="custom_quick_kyc">Custom + Quick KYC</option>
											</>
										)}
								</select>
							</div>

							{/* CUSTOM DATE RANGE PICKER */}
							<div style={{ width: '240px' }}>
								<span className="filter-field-label d-block">Date Range</span>
								<DateRangePicker
									startDate={startDate}
									endDate={endDate}
									placeholder="Select Start & End Date"
									onChange={({ startDate: sDate, endDate: eDate }) => {
										setStartDate(sDate);
										setEndDate(eDate);
										if ((sDate && eDate) || (!sDate && !eDate)) {
											setCurrentPage(1);
										}
									}}
								/>
							</div>

							{/* RESET FILTER BUTTON */}
							<div>
								<button
									type='button'
									className='btn-reset-filters'
									disabled={activeFilterCount === 0}
									onClick={handleResetFilters}>
									<Icon icon='Refresh' size='sm' />
									<span>Reset</span>
								</button>
							</div>
						</div>
					}
					columns={columns}
					data={documentTypes}
					isLoading={isLoading}
					emptyMessage="No document types found"
					emptyIcon="Description"
					actions={{
						permissionKey: PERMISSION_KEYS.DOCUMENT_TYPE,
						actionColumnWidth: '180px',
						onView: (doc) => {
							navigate(
								`/${PAGE_ROUTES.DOCUMENT_TYPE_VIEW.replace(
									':id',
									encryptId(doc.id),
								)}`,
							);
						},
						onEdit: (doc) => {
							navigate(
								`/${PAGE_ROUTES.DOCUMENT_TYPE_EDIT.replace(
									':id',
									encryptId(doc.id),
								)}`,
							);
						},
						onDelete: (doc) => {
							setDocToDelete(doc);
							setIsDeleteModalOpen(true);
						},
					}}
					pagination={{
						currentPage,
						totalItems: totalDocuments,
						perPage,
						onPageChange: (page) => setCurrentPage(page),
						onPerPageChange: (newPerPage) => {
							setPerPage(newPerPage);
							setCurrentPage(1);
						},
					}}
				/>

				{/* CONFIRMATION MODAL */}
				<ConfirmationModal
					isOpen={isDeleteModalOpen}
					setIsOpen={setIsDeleteModalOpen}
					title="Confirmation Alert!"
					message="Are you sure to remove this Document Type ?"
					confirmText="Yes"
					cancelText="No"
					isLoading={isDeleting}
					onConfirm={handleDeleteConfirm}
					onCancel={() => setDocToDelete(null)}
				/>
			</Page>
		</PageWrapper>
	);
};

export default DocumentTypeListPage;
