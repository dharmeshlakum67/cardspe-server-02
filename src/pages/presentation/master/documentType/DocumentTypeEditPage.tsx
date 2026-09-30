import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import DocumentTypeForm, { IDocumentTypeFormValues } from './DocumentTypeForm';
import documentTypeService from './service/documentTypeService';
import { IDocumentTypeDetail } from './type/document-type';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';
import { decryptId } from '../../../../helpers/routeEncryption';

const DocumentTypeEditPage: FC = () => {
	const { id: rawId } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [docDetail, setDocDetail] = useState<IDocumentTypeDetail | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { canUpdate, isLoadingPermissions } = usePermission();

	const numericId = useMemo(() => (rawId ? decryptId(rawId) : null), [rawId]);

	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// REDIRECT IF PERMISSION DENIED OR INVALID ID
	useEffect(() => {
		if (
			!isLoadingPermissions &&
			!canUpdate(PERMISSION_KEYS.MASTER) &&
			!canUpdate(PERMISSION_KEYS.DOCUMENT_TYPE)
		) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
			return;
		}

		if (!rawId || (rawId && !numericId)) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canUpdate, rawId, numericId, navigate]);

	useEffect(() => {
		const fetchDetail = async () => {
			if (
				!numericId ||
				isFetchingRef.current ||
				fetchedIdRef.current === String(numericId)
			) {
				return;
			}

			isFetchingRef.current = true;
			fetchedIdRef.current = String(numericId);
			setIsLoading(true);

			try {
				const res = await documentTypeService.getDocumentTypeById(numericId);
				if (res?.data) {
					setDocDetail(res.data);
				} else {
					showNotification(
						'Not Found',
						'Document type record not found',
						'warning',
					);
					navigate(`/${PAGE_ROUTES.DOCUMENT_TYPE}`);
				}
			} catch (error: any) {
				showNotification(
					'Error',
					error?.message || 'Could not fetch document type details',
					'danger',
				);
				navigate(`/${PAGE_ROUTES.DOCUMENT_TYPE}`);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		};

		if (
			!isLoadingPermissions &&
			(canUpdate(PERMISSION_KEYS.MASTER) || canUpdate(PERMISSION_KEYS.DOCUMENT_TYPE))
		) {
			fetchDetail();
		}
	}, [numericId, navigate, isLoadingPermissions, canUpdate]);

	const handleFormSubmit = async (values: IDocumentTypeFormValues) => {
		if (!numericId) return;

		setIsSubmitting(true);
		try {
			const res = await documentTypeService.updateDocumentType(numericId, {
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
				res?.message || 'Document type updated successfully.',
				'success',
			);
			navigate(-1);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to update document type',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoadingPermissions || isLoading) {
		return (
			<PageWrapper title="Edit Document Type" permissionKey={PERMISSION_KEYS.DOCUMENT_TYPE}>
				<Page container="fluid">
					<div className="p-4 text-center text-muted">Loading document type details...</div>
				</Page>
			</PageWrapper>
		);
	}

	if (!docDetail) return null;

	const docStatus: 'active' | 'inactive' =
		docDetail.status === 'inactive' ? 'inactive' : 'active';

	const initialFormValues: IDocumentTypeFormValues = {
		document_name: docDetail.document_name,
		document_code: docDetail.document_code,
		is_mandatory: docDetail.is_mandatory,
		required_files_count: docDetail.required_files_count,
		verification_service: docDetail.verification_service || 'custom',
		status: docStatus,
		roles:
			docDetail.role_document_requirements?.map((req) => ({
				role_id: req.role_id,
				is_required: req.is_required,
			})) || [],
		fields: docDetail.fields || [],
	};

	return (
		<PageWrapper
			title={`Edit Document Type - ${docDetail.document_name}`}
			permissionKey={PERMISSION_KEYS.DOCUMENT_TYPE}>
			<Page container="fluid">
				<DocumentTypeForm
					mode="edit"
					initialValues={initialFormValues}
					isSubmitting={isSubmitting}
					onSubmit={handleFormSubmit}
					onCancel={() => navigate(-1)}
				/>
			</Page>
		</PageWrapper>
	);
};

export default DocumentTypeEditPage;
