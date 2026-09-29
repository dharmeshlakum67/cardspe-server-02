import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Spinner from '../../../components/bootstrap/Spinner';
import showNotification from '../../../components/extras/showNotification';
import roleService from './service/roleService';
import permissionService from '../../../services/permissionService';
import { IRoleDetail } from './type/role-type';
import { IPermissionItem } from '../../../type/permission-type';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { PERMISSION_KEYS } from '../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../constants/pageRoutes';
import { authPagesMenu } from '../../../menu';
import { decryptId } from '../../../helpers/routeEncryption';
import usePermission from '../../../hooks/usePermission';
import RoleForm from './RoleForm';
import type { IRoleFormData } from './RoleForm';

const RoleEditPage: FC = () => {
	const { id: rawId } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { canUpdate, canRead, canDelete, isLoadingPermissions } = usePermission();

	const decryptedId = useMemo(() => decryptId(rawId), [rawId]);

	const [role, setRole] = useState<IRoleDetail | null>(null);
	const [allSystemPermissions, setAllSystemPermissions] = useState<IPermissionItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);

	// DELETE MODAL STATES
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// REDIRECT IF PERMISSION DENIED OR INVALID ID
	useEffect(() => {
		if (!isLoadingPermissions && !canUpdate(PERMISSION_KEYS.ROLE)) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
			return;
		}

		if (!rawId || (rawId && !decryptedId)) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canUpdate, rawId, decryptedId, navigate]);

	// FETCH ROLE DATA & SYSTEM PERMISSIONS
	const fetchData = useCallback(async () => {
		if (!decryptedId || isFetchingRef.current || fetchedIdRef.current === decryptedId) {
			return;
		}

		isFetchingRef.current = true;
		fetchedIdRef.current = decryptedId;
		setIsLoading(true);

		try {
			const roleRes = await roleService.getRoleById(decryptedId);

			if (roleRes && roleRes.data) {
				const roleData = roleRes.data;
				setRole(roleData);

				const embeddedAccess =
					(Array.isArray(roleData.role_access) && roleData.role_access.length > 0
						? roleData.role_access
						: null) ||
					(Array.isArray(roleData.permissions) && roleData.permissions.length > 0
						? roleData.permissions
						: null) ||
					(Array.isArray(roleData.role_permissions) &&
					roleData.role_permissions.length > 0
						? roleData.role_permissions
						: null) ||
					(Array.isArray(roleData.access) && roleData.access.length > 0
						? roleData.access
						: null);

				if (embeddedAccess) {
					setAllSystemPermissions(embeddedAccess as unknown as IPermissionItem[]);
				} else {
					try {
						const accessRes = await roleService.getRoleAccessOne(decryptedId);
						const accessData =
							accessRes?.data?.role_access ||
							accessRes?.data?.permissions ||
							accessRes?.data ||
							accessRes;
						if (Array.isArray(accessData) && accessData.length > 0) {
							setAllSystemPermissions(accessData as unknown as IPermissionItem[]);
						} else {
							const allPerms = await permissionService.getAllPermissions();
							if (Array.isArray(allPerms)) {
								setAllSystemPermissions(allPerms);
							}
						}
					} catch {
						const allPerms = await permissionService.getAllPermissions();
						if (Array.isArray(allPerms)) {
							setAllSystemPermissions(allPerms);
						}
					}
				}
			} else {
				showNotification('Error', 'Role details not found', 'danger');
				navigate(`/${PAGE_ROUTES.ROLES}`);
			}
		} catch (error: any) {
			showNotification(
				'Error loading role data',
				error?.message || 'Could not fetch role details',
				'danger',
			);
			navigate(`/${PAGE_ROUTES.ROLES}`);
		} finally {
			setIsLoading(false);
			isFetchingRef.current = false;
		}
	}, [decryptedId, navigate]);

	useEffect(() => {
		if (
			!isLoadingPermissions &&
			canUpdate(PERMISSION_KEYS.ROLE) &&
			decryptedId &&
			fetchedIdRef.current !== decryptedId &&
			!isFetchingRef.current
		) {
			fetchData();
		}
	}, [isLoadingPermissions, canUpdate, decryptedId, fetchData]);

	// UPDATE ROLE HANDLER
	const handleUpdateRole = async (formData: IRoleFormData) => {
		const targetRoleId = role?.id || decryptedId;
		if (!targetRoleId) return;

		setIsSaving(true);
		try {
			await roleService.updateRole(targetRoleId, formData);
			const displayName = formData.role_name || role?.role_name || 'Role';
			showNotification('Success', `Role "${displayName}" updated successfully`, 'success');
			navigate(-1);
		} catch (error: any) {
			showNotification(
				'Update Error',
				error?.message || 'Could not update role permissions',
				'danger',
			);
		} finally {
			setIsSaving(false);
		}
	};

	// CONFIRM DELETE HANDLER
	const handleConfirmDelete = async () => {
		const targetRoleId = role?.id || decryptedId;
		if (!targetRoleId) return;

		setIsDeleting(true);
		try {
			await roleService.deleteRole(targetRoleId);
			showNotification('Success', `Role "${role?.role_name || ''}" deleted successfully`, 'success');
			setIsDeleteModalOpen(false);
			navigate(`/${PAGE_ROUTES.ROLES}`);
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

	if (isLoading) {
		return (
			<PageWrapper title='' permissionKey={PERMISSION_KEYS.ROLE}>
				<Page container='fluid'>
					<div
						className='d-flex flex-column align-items-center justify-content-center py-5'
						style={{ minHeight: '60vh' }}>
						<Spinner color='primary' size='3rem' isGrow={false} />
						<span className='text-muted small mt-3'>Loading role permission editor...</span>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	if (!role) {
		return null;
	}

	return (
		<PageWrapper title={`${role.role_name}`} permissionKey={PERMISSION_KEYS.ROLE}>
			<Page container='fluid'>
				<RoleForm
					mode='edit'
					initialRole={role}
					allSystemPermissions={allSystemPermissions}
					isSaving={isSaving}
					onSubmit={handleUpdateRole}
					canDelete={canDelete(PERMISSION_KEYS.ROLE)}
					onDeleteClick={() => setIsDeleteModalOpen(true)}
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
				/>
			</Page>
		</PageWrapper>
	);
};

export default RoleEditPage;
