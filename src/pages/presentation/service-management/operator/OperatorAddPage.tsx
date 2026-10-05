import React, { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import OperatorForm from './OperatorForm';
import operatorService from './service/operatorService';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';

const OperatorAddPage: FC = () => {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const { canCreate, isLoadingPermissions } = usePermission();

	// REDIRECT IF PERMISSION DENIED
	useEffect(() => {
		if (
			!isLoadingPermissions &&
			!canCreate(PERMISSION_KEYS.SERVICE_MANAGEMENT) &&
			!canCreate(PERMISSION_KEYS.OPERATOR) &&
			!canCreate('operator')
		) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canCreate, navigate]);

	const handleFormSubmit = async (payload: FormData) => {
		setIsSubmitting(true);
		try {
			const res = await operatorService.createOperator(payload);
			showNotification(
				'Success',
				res?.message || 'Operator created successfully.',
				'success',
			);
			navigate(`/${PAGE_ROUTES.OPERATORS}`);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to create operator',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoadingPermissions) {
		return (
			<PageWrapper title="Create Operator" permissionKey={PERMISSION_KEYS.OPERATOR}>
				<Page container="fluid">
					<div className="p-5 text-center text-muted">Loading permissions...</div>
				</Page>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper isProtected permissionKey={PERMISSION_KEYS.OPERATOR} title="Create Operator">
			<Page container="fluid">
				<OperatorForm
					mode="add"
					isSubmitting={isSubmitting}
					onSubmit={handleFormSubmit}
					onCancel={() => navigate(`/${PAGE_ROUTES.OPERATORS}`)}
				/>
			</Page>
		</PageWrapper>
	);
};

export default OperatorAddPage;
