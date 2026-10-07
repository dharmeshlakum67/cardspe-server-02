import React, { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import ApiDocumentationForm from './ApiDocumentationForm';
import apiDocumentationService from './service/apiDocumentationService';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { ICreateApiDocumentationPayload } from './type/api-documentation.type';

export const ApiDocumentationAddPage: FC = () => {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [categories, setCategories] = useState<string[]>([]);
	const { canCreate, isLoadingPermissions } = usePermission();

	const hasCreate =
		canCreate(PERMISSION_KEYS.API_DOCUMENTATION) ||
		canCreate(PERMISSION_KEYS.DEVELOPER);

	const fetchedRef = React.useRef<boolean>(false);

	useEffect(() => {
		if (fetchedRef.current) return;
		fetchedRef.current = true;
		apiDocumentationService.getDistinctCategories().then((res) => {
			if (res?.data && Array.isArray(res.data)) {
				setCategories(res.data);
			}
		});
	}, []);

	const handleFormSubmit = async (values: any) => {
		setIsSubmitting(true);
		try {
			const res = await apiDocumentationService.createApiDocumentation(values as ICreateApiDocumentationPayload);
			showNotification(
				'Success',
				res?.message || 'API Documentation created successfully.',
				'success',
			);
			navigate(`/${PAGE_ROUTES.API_DOCUMENTATION}`);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to create API documentation.',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PageWrapper
			title='Create API Documentation'
			permissionKey={PERMISSION_KEYS.API_DOCUMENTATION}>
			<Page container='fluid'>
				<ApiDocumentationForm
					mode='add'
					isSubmitting={isSubmitting}
					categories={categories}
					onSubmit={handleFormSubmit}
					onCancel={() => navigate(`/${PAGE_ROUTES.API_DOCUMENTATION}`)}
				/>
			</Page>
		</PageWrapper>
	);
};

export default ApiDocumentationAddPage;
