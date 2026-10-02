import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import Spinner from '../../../../components/bootstrap/Spinner';
import showNotification from '../../../../components/extras/showNotification';
import userService from './service/userService';
import roleService from '../../role/service/roleService';
import stateService from '../../master/state/service/stateService';
import constantService, { IConstantOption } from '../../../../services/constantService';
import { IRoleItem } from '../../role/type/role-type';
import { IActiveStateItem } from '../../master/state/type/state-type';
import { IUserCreatePayload, IUserUpdatePayload } from './type/user-type';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';
import usePermission from '../../../../hooks/usePermission';
import UserForm from './UserForm';

export const UserAddPage: FC = () => {
	const navigate = useNavigate();
	const { canCreate, isLoadingPermissions } = usePermission();

	const [roles, setRoles] = useState<IRoleItem[]>([]);
	const [states, setStates] = useState<IActiveStateItem[]>([]);
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const hasLoadedDataRef = useRef<boolean>(false);

	// REDIRECT IF PERMISSION DENIED
	useEffect(() => {
		if (
			!isLoadingPermissions &&
			!canCreate(PERMISSION_KEYS.USERS) &&
			!canCreate(PERMISSION_KEYS.USER) &&
			!canCreate(PERMISSION_KEYS.USER_MANAGEMENT)
		) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canCreate, navigate]);

	// FETCH ACTIVE ROLES, STATES & DYNAMIC STATUS OPTIONS (STRICTLY ONCE ON MOUNT)
	const loadInitialData = useCallback(async () => {
		if (hasLoadedDataRef.current) return;
		hasLoadedDataRef.current = true;
		setIsLoading(true);

		try {
			const [rolesRes, statesRes, statusRes] = await Promise.all([
				roleService.getActiveRoles(true),
				stateService.getActiveStates(),
				constantService.getUserStatusConstants(),
			]);

			if (rolesRes?.data && Array.isArray(rolesRes.data)) {
				setRoles(rolesRes.data);
			}
			if (statesRes?.data && Array.isArray(statesRes.data)) {
				setStates(statesRes.data);
			}
			if (statusRes && Array.isArray(statusRes) && statusRes.length > 0) {
				setStatusOptions(statusRes);
			} else {
				setStatusOptions([
					{ label: 'Inactive', value: 'inactive' },
					{ label: 'Active', value: 'active' },
					{ label: 'Blocked', value: 'blocked' },
				]);
			}
		} catch (error: any) {
			showNotification(
				'Error loading form data',
				error?.message || 'Could not load form dropdowns',
				'warning',
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (
			!isLoadingPermissions &&
			(canCreate(PERMISSION_KEYS.USERS) ||
				canCreate(PERMISSION_KEYS.USER) ||
				canCreate(PERMISSION_KEYS.USER_MANAGEMENT))
		) {
			loadInitialData();
		}
	}, [isLoadingPermissions, canCreate, loadInitialData]);

	// CREATE USER SUBMIT HANDLER
	const handleCreateUser = async (formData: IUserCreatePayload | IUserUpdatePayload) => {
		setIsSubmitting(true);
		try {
			const res = await userService.createUser(formData as IUserCreatePayload);
			showNotification(
				'Success',
				res?.message || `User "${formData.name}" created successfully`,
				'success',
			);
			navigate(`/${PAGE_ROUTES.USERS}`);
		} catch (error: any) {
			showNotification(
				'Creation Error',
				error?.data?.message || error?.message || 'Failed to create user',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<PageWrapper title="Create User" permissionKey={PERMISSION_KEYS.USERS}>
				<Page container="fluid">
					<div
						className="d-flex flex-column align-items-center justify-content-center py-5"
						style={{ minHeight: '60vh' }}>
						<Spinner color="primary" size="3rem" isGrow={false} />
						<span className="text-muted small mt-3">Loading user creator...</span>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper title="Create User" permissionKey={PERMISSION_KEYS.USERS}>
			<Page container="fluid">
				<UserForm
					roles={roles}
					states={states}
					statusOptions={statusOptions}
					isSubmitting={isSubmitting}
					onSubmit={handleCreateUser}
					onCancel={() => navigate(-1)}
				/>
			</Page>
		</PageWrapper>
	);
};

export default UserAddPage;
