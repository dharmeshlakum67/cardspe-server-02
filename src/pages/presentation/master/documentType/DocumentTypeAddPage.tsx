import React, { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import DocumentTypeForm, { IDocumentTypeFormValues } from './DocumentTypeForm';
import documentTypeService from './service/documentTypeService';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';

const DocumentTypeAddPage: FC = () => {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const { canCreate, isLoadingPermissions } = usePermission();

	// REDIRECT IF PERMISSION DENIED
	useEffect(() => {
		if (
			!isLoadingPermissions &&
			!canCreate(PERMISSION_KEYS.MASTER) &&
			!canCreate(PERMISSION_KEYS.DOCUMENT_TYPE)
		) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canCreate, navigate]);

	const handleFormSubmit = async (values: IDocumentTypeFormValues) => {
		setIsSubmitting(true);
		try {
			const res = await documentTypeService.createDocumentType({
				document_name: values.document_name,
				document_code: values.document_code,
				is_mandatory: values.is_mandatory,
				required_files_count: values.required_files_count,
				verification_service: values.verification_service,
				status: values.status,
				roles: values.roles,
				fields: values.fields,
			});

			showNotification(
				'Success',
				res?.message || 'Document type created successfully.',
				'success',
			);
			navigate(`/${PAGE_ROUTES.DOCUMENT_TYPE}`);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to create document type',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoadingPermissions) {
		return (
			<PageWrapper title="Create Document Type" permissionKey={PERMISSION_KEYS.DOCUMENT_TYPE}>
				<Page container="fluid">
					<div className="p-4 text-center text-muted">Loading permissions...</div>
				</Page>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper title="Create Document Type" permissionKey={PERMISSION_KEYS.DOCUMENT_TYPE}>
			<Page container="fluid">
				<DocumentTypeForm
					mode="add"
					isSubmitting={isSubmitting}
					onSubmit={handleFormSubmit}
					onCancel={() => navigate(`/${PAGE_ROUTES.DOCUMENT_TYPE}`)}
				/>
			</Page>
		</PageWrapper>
	);
};

export default DocumentTypeAddPage;
