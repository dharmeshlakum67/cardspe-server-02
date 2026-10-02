import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { IUserCreatePayload, IUserUpdatePayload, IUserItem } from './type/user-type';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';
import { decryptId } from '../../../../helpers/routeEncryption';
import usePermission from '../../../../hooks/usePermission';
import UserForm from './UserForm';

export const UserEditPage: FC = () => {
	const { id: rawId } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { canUpdate, isLoadingPermissions } = usePermission();

	const decryptedId = useMemo(() => decryptId(rawId), [rawId]);

	const [user, setUser] = useState<IUserItem | null>(null);
	const [initialValues, setInitialValues] = useState<Partial<IUserCreatePayload & { id?: number }> | null>(null);
	const [roles, setRoles] = useState<IRoleItem[]>([]);
	const [states, setStates] = useState<IActiveStateItem[]>([]);
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// REDIRECT IF PERMISSION DENIED OR ID INVALID
	useEffect(() => {
		if (
			!isLoadingPermissions &&
			!canUpdate(PERMISSION_KEYS.USERS) &&
			!canUpdate(PERMISSION_KEYS.USER) &&
			!canUpdate(PERMISSION_KEYS.USER_MANAGEMENT)
		) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
			return;
		}

		if (!rawId || (rawId && !decryptedId)) {
			showNotification('Invalid User', 'The user ID provided is invalid or corrupted.', 'danger');
			navigate(`/${PAGE_ROUTES.USERS}`, { replace: true });
		}
	}, [isLoadingPermissions, canUpdate, rawId, decryptedId, navigate]);

	// PARALLEL INITIAL DATA LOADING
	const loadInitialData = useCallback(async () => {
		if (!decryptedId || isFetchingRef.current || fetchedIdRef.current === decryptedId) {
			return;
		}

		isFetchingRef.current = true;
		fetchedIdRef.current = decryptedId;
		setIsLoading(true);

		try {
			const [userRes, rolesRes, statesRes, statusRes] = await Promise.all([
				userService.getUserById(decryptedId),
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

			if (userRes && userRes.data) {
				const userData = userRes.data;
				setUser(userData);

				const roleIdValue = userData.role?.id || (userData as any).role_id || '';
				const parentIdValue =
					(userData as any).parent_id !== undefined && (userData as any).parent_id !== null
						? (userData as any).parent_id
						: (userData as any).parent?.id || '';

				const stateIdValue =
					userData.profile?.state_id !== undefined && userData.profile?.state_id !== null
						? userData.profile.state_id
						: userData.profile?.state?.id || '';

				setInitialValues({
					id: userData.id,
					name: userData.name || '',
					username: userData.username || '',
					company_name: userData.company_name || '',
					email_address: userData.email_address || '',
					mobile_number: userData.mobile_number || '',
					role_id: roleIdValue ? Number(roleIdValue) : undefined,
					parent_id: parentIdValue ? Number(parentIdValue) : null,
					status: userData.status || 'inactive',
					state_id: stateIdValue ? Number(stateIdValue) : null,
					city: userData.profile?.city || '',
					address: userData.profile?.address || '',
					postal_code: userData.profile?.postal_code || '',
					password: '',
				});
			} else {
				showNotification('Error', 'User details not found', 'danger');
				navigate(`/${PAGE_ROUTES.USERS}`);
			}
		} catch (error: any) {
			showNotification(
				'Error loading user',
				error?.data?.message || error?.message || 'Could not fetch user details',
				'danger',
			);
			navigate(`/${PAGE_ROUTES.USERS}`);
		} finally {
			setIsLoading(false);
			isFetchingRef.current = false;
		}
	}, [decryptedId, navigate]);

	useEffect(() => {
		if (
			!isLoadingPermissions &&
			(canUpdate(PERMISSION_KEYS.USERS) ||
				canUpdate(PERMISSION_KEYS.USER) ||
				canUpdate(PERMISSION_KEYS.USER_MANAGEMENT)) &&
			decryptedId &&
			fetchedIdRef.current !== decryptedId &&
			!isFetchingRef.current
		) {
			loadInitialData();
		}
	}, [isLoadingPermissions, canUpdate, decryptedId, loadInitialData]);

	// UPDATE USER SUBMIT HANDLER
	const handleUpdateUser = async (formData: IUserCreatePayload | IUserUpdatePayload) => {
		if (!decryptedId) return;

		setIsSubmitting(true);
		try {
			// Clean payload: if password is blank, omit or send empty
			const payload: IUserUpdatePayload = {
				name: formData.name,
				username: formData.username,
				company_name: formData.company_name || null,
				email_address: formData.email_address,
				mobile_number: formData.mobile_number,
				role_id: formData.role_id,
				parent_id: formData.parent_id,
				status: formData.status,
				state_id: formData.state_id,
				city: formData.city,
				address: formData.address,
				postal_code: formData.postal_code,
			};

			if (formData.password && formData.password.trim()) {
				payload.password = formData.password.trim();
			}

			const res = await userService.updateUser(decryptedId, payload);
			showNotification(
				'Success',
				res?.message || 'User updated successfully.',
				'success',
			);
			navigate(`/${PAGE_ROUTES.USERS}`);
		} catch (error: any) {
			showNotification(
				'Update Error',
				error?.data?.message || error?.message || 'Failed to update user',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<PageWrapper title="Edit User" permissionKey={PERMISSION_KEYS.USERS}>
				<Page container="fluid">
					<div
						className="d-flex flex-column align-items-center justify-content-center py-5"
						style={{ minHeight: '60vh' }}>
						<Spinner color="primary" size="3rem" isGrow={false} />
						<span className="text-muted small mt-3">Loading user details...</span>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	if (!user || !initialValues) {
		return null;
	}

	return (
		<PageWrapper title={`Edit User - ${user.name}`} permissionKey={PERMISSION_KEYS.USERS}>
			<Page container="fluid">
				<UserForm
					mode="edit"
					title={`Edit User (${user.name})`}
					initialValues={initialValues}
					roles={roles}
					states={states}
					statusOptions={statusOptions}
					isSubmitting={isSubmitting}
					onSubmit={handleUpdateUser}
					onCancel={() => navigate(-1)}
				/>
			</Page>
		</PageWrapper>
	);
};

export default UserEditPage;
