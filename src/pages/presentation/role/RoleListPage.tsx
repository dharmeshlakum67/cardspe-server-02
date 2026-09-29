import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import { ListingPage, IListingColumn } from '../../../components/common/ListingPage';
import { PillBadge } from '../../../components/common/PillBadge';
import roleService from './service/roleService';
import { IRoleItem } from './type/role-type';
import showNotification from '../../../components/extras/showNotification';
import Icon from '../../../components/icon/Icon';
import { ConfirmationModal, StatusToggle } from '../../../components/common';
import usePermission from '../../../hooks/usePermission';
import useDebounce from '../../../hooks/useDebounce';
import { PERMISSION_KEYS } from '../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../constants/pageRoutes';
import { encryptId } from '../../../helpers/routeEncryption';
import { formatDateTime } from '../../../helpers/dateUtils';
import { getRoleTypeDetails } from './util/roleUtils';

const RoleListPage: FC = () => {
	const navigate = useNavigate();
	const [roles, setRoles] = useState<IRoleItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalDocuments, setTotalDocuments] = useState<number>(0);

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [roleToDelete, setRoleToDelete] = useState<IRoleItem | null>(null);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	// STATUS TOGGLE IN-PROGRESS STATE
	const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

	// FILTER STATES
	const [searchTerm, setSearchTerm] = useState<string>('');
	const debouncedSearchTerm = useDebounce(searchTerm, 1500);
	const [statusFilter, setStatusFilter] = useState<string>('');

	// PAGINATION STATES
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);

	const { canRead, canUpdate, isLoadingPermissions } = usePermission();

	// REF TO PREVENT DUPLICATE FETCHES ON MOUNT / RETURN NAVIGATION
	const lastFetchKeyRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// FETCH ROLES DATA FROM API
	const fetchRoles = useCallback(
		async (force = false) => {
			if (isLoadingPermissions || !canRead(PERMISSION_KEYS.ROLE)) {
				return;
			}

			const currentFetchKey = `${debouncedSearchTerm}_${statusFilter}_${currentPage}_${perPage}`;
			if (!force && (isFetchingRef.current || lastFetchKeyRef.current === currentFetchKey)) {
				return;
			}

			isFetchingRef.current = true;
			lastFetchKeyRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const res = await roleService.getRoles({
					search: debouncedSearchTerm.trim() || undefined,
					status: statusFilter || undefined,
					page: currentPage,
					limit: perPage,
				});

				if (res && res.data) {
					setRoles(res.data);
					setTotalDocuments(res.total_document || res.result || res.data.length);
				} else {
					setRoles([]);
					setTotalDocuments(0);
				}
			} catch (error: any) {
				showNotification(
					'Error fetching roles',
					error?.message || 'Could not load roles data',
					'danger',
				);
				setRoles([]);
				setTotalDocuments(0);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[debouncedSearchTerm, statusFilter, currentPage, perPage, isLoadingPermissions],
	);

	useEffect(() => {
		const currentFetchKey = `${debouncedSearchTerm}_${statusFilter}_${currentPage}_${perPage}`;
		if (
			!isLoadingPermissions &&
			canRead(PERMISSION_KEYS.ROLE) &&
			lastFetchKeyRef.current !== currentFetchKey &&
			!isFetchingRef.current
		) {
			fetchRoles();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearchTerm, statusFilter, currentPage, perPage, isLoadingPermissions]);

	// HANDLE RESET FILTERS
	const handleResetFilters = () => {
		setSearchTerm('');
		setStatusFilter('');
		setCurrentPage(1);
	};

	// HANDLE DELETE ROLE MODAL TRIGGER
	const handleDeleteClick = (role: IRoleItem) => {
		setRoleToDelete(role);
		setIsDeleteModalOpen(true);
	};

	// CONFIRM DELETE ACTION
	const handleConfirmDelete = async () => {
		if (!roleToDelete) return;
		setIsDeleting(true);
		try {
			await roleService.deleteRole(roleToDelete.id);
			showNotification('Success', `Role "${roleToDelete.name}" deleted successfully`, 'success');
			setIsDeleteModalOpen(false);
			setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
			setTotalDocuments((prev) => Math.max(0, prev - 1));
			setRoleToDelete(null);
		} catch (error: any) {
			showNotification(
				'Delete Failed',
				error?.message || 'Failed to delete role',
				'danger',
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// DIRECT INLINE STATUS TOGGLE (NO CONFIRMATION POPUP)
	const handleDirectStatusToggle = async (role: IRoleItem, newChecked: boolean) => {
		if (!canUpdate(PERMISSION_KEYS.ROLE)) return;
		const newStatus = newChecked ? 'ACTIVE' : 'INACTIVE';
		setUpdatingStatusId(role.id);
		try {
			const res = await roleService.updateRoleStatus(role.id, newStatus);
			showNotification(
				'Success',
				`Status of "${role.name}" changed to ${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}`,
				'success',
			);
			setRoles((prev) =>
				prev.map((r) => {
					if (r.id === role.id) {
						return res?.data ? { ...r, ...res.data } : { ...r, status: newStatus };
					}
					return r;
				}),
			);
		} catch (error: any) {
			showNotification(
				'Status Update Failed',
				error?.message || 'Failed to update role status',
				'danger',
			);
		} finally {
			setUpdatingStatusId(null);
		}
	};

	// ACTIVE FILTER COUNT
	let activeFilterCount = 0;
	if (searchTerm) {
		activeFilterCount += 1;
	}
	if (statusFilter) {
		activeFilterCount += 1;
	}

	// TABLE COLUMNS CONFIGURATION WITH DYNAMIC HEADER DIFFERENTIATION & PILL BADGES
	const columns: IListingColumn<IRoleItem>[] = [
		{
			key: 'name',
			header: 'Role Name',
			style: { width: 'auto' },
			headerStyle: { width: 'auto', minWidth: '160px' },
			render: (row) => (
				<div>
					<div className='fw-bold text-dark' style={{ fontSize: '0.875rem' }}>
						{row.name}
					</div>
				</div>
			),
		},
		{
			key: 'role_type',
			header: 'Role Type',
			width: '130px',
			minWidth: '130px',
			headerStyle: { width: '130px', minWidth: '130px' },
			render: (row) => {
				const { label, color } = getRoleTypeDetails(row.role_type);
				return (
					<PillBadge color={color} isPill size='md'>
						{label}
					</PillBadge>
				);
			},
		},
		{
			key: 'company',
			header: 'Company Name',
			align: 'center',
			width: '160px',
			minWidth: '160px',
			headerStyle: { width: '160px', minWidth: '160px' },
			render: (row) => {
				const companyName = row.company_id?.name || '-';
				const companyCode = row.company_id?.company_code || ''; 

				return (
					<div className="d-flex flex-column align-items-center">
						<span className="fw-bold text-dark">{companyName}</span>
						{companyCode && (
							<span className="badge bg-light text-muted border mt-1 px-2 py-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
								{companyCode}
							</span>
						)}
					</div>
				);
			},
		},
		{
			key: 'tenant',
			header: 'Tenant Name',
			align: 'center',
			width: '150px',
			minWidth: '150px',
			headerStyle: { width: '150px', minWidth: '150px' },
			render: (row) => {
				const tenantName = row.tenant_id?.name || '-';
				return <span className='fw-bold text-dark'>{tenantName}</span>;
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
			render: (row) => {
				const isActive = row.status === 'ACTIVE';
				const isPermitted = canUpdate(PERMISSION_KEYS.ROLE);
				return (
					<StatusToggle
						checked={isActive}
						disabled={!isPermitted}
						isLoading={updatingStatusId === row.id}
						onChange={(newChecked) => handleDirectStatusToggle(row, newChecked)}
						ariaLabel={`Toggle status for ${row.name}`}
					/>
				);
			},
		},
		{
			key: 'created_at',
			header: 'Created Date',
			width: '160px',
			minWidth: '160px',
			headerStyle: { width: '160px', minWidth: '160px' },
			render: (row) => {
				if (!row.created_at) {
					return '-';
				}
				const { date, time } = formatDateTime(row.created_at);
				return (
					<div className='d-flex flex-column'>
						<span className='fw-medium text-dark' style={{ fontSize: '0.8125rem' }}>
							{date}
						</span>
						<span className='text-muted' style={{ fontSize: '0.75rem' }}>
							{time}
						</span>
					</div>
				);
			},
		},
	];

	return (
		<PageWrapper title='Role Management' permissionKey={PERMISSION_KEYS.ROLE}>
			<Page container='fluid'>
				<ListingPage<IRoleItem>
					title='Role Management'
					breadcrumbs={[
						{ text: 'User Management' },
						{ text: 'Roles' },
					]}
					permissionKey={PERMISSION_KEYS.ROLE}

					// ADD NEW ROLE ACTION (Permission-aware)
					onAddNew={() => {
						navigate(`/${PAGE_ROUTES.ROLES_ADD}`);
					}}
					addNewText='Add New Role'

					// RIGHT-ALIGNED COMPACT FILTER SECTION
					activeFilterCount={activeFilterCount}
					filterContent={
						<div className='d-flex align-items-end justify-content-end flex-wrap gap-3 w-100'>
							{/* COMPACT UNIFORM SEARCH INPUT */}
							<div style={{ width: '220px' }}>
								<label htmlFor='roleSearch' className='filter-field-label'>Search</label>
								<input
									id='roleSearch'
									type='text'
									className='form-control'
									placeholder='Search Role...'
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* STATUS FILTER DROPDOWN */}
							<div style={{ width: '150px' }}>
								<label htmlFor='roleStatusFilter' className='filter-field-label'>Status</label>
								<select
									id='roleStatusFilter'
									className='form-select'
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value);
										setCurrentPage(1);
									}}>
									<option value=''>All Status</option>
									<option value='ACTIVE'>Active</option>
									<option value='INACTIVE'>Inactive</option>
								</select>
							</div>

							{/* RESET FILTER BUTTON */}
							<div>
								<button
									type='button'
									className='btn btn-outline-secondary d-flex align-items-center gap-1'
									style={{ height: '38px' }}
									onClick={handleResetFilters}>
									<Icon icon='Refresh' size='sm' />
									<span>Reset</span>
								</button>
							</div>
						</div>
					}

					// TABLE DATA & LOADING
					columns={columns}
					data={roles}
					isLoading={isLoading}
					emptyMessage='No roles found'
					emptyIcon='AdminPanelSettings'

					// PERMISSION-AWARE ROW ACTIONS
					actions={{
						permissionKey: PERMISSION_KEYS.ROLE,
						actionColumnWidth: '180px',
						onView: (role) => {
							navigate(`/roles/view/${encryptId(role.id)}`);
						},
						onEdit: (role) => {
							navigate(`/roles/edit/${encryptId(role.id)}`);
						},
						onDelete: (role) => {
							handleDeleteClick(role);
						},
					}}

					// PAGINATION
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

				{/* CONFIRMATION ALERT MODAL FOR DELETION */}
				<ConfirmationModal
					isOpen={isDeleteModalOpen}
					setIsOpen={setIsDeleteModalOpen}
					title='Confirmation Alert!'
					message='Are you sure to remove this Role ?'
					confirmText='Yes'
					cancelText='No'
					isLoading={isDeleting}
					onConfirm={handleConfirmDelete}
					onCancel={() => {
						setRoleToDelete(null);
					}}
				/>
			</Page>
		</PageWrapper>
	);
};

export default RoleListPage;
