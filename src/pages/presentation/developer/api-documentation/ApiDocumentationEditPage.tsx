import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import Button from '../../../../components/bootstrap/Button';
import ApiDocumentationForm from './ApiDocumentationForm';
import apiDocumentationService from './service/apiDocumentationService';
import showNotification from '../../../../components/extras/showNotification';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { decryptId } from '../../../../helpers/routeEncryption';
import { IApiDocumentation, IUpdateApiDocumentationPayload } from './type/api-documentation.type';

export const ApiDocumentationEditPage: FC = () => {
	const { id: rawId } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const id = React.useMemo(() => decryptId(rawId), [rawId]);
	const [doc, setDoc] = useState<IApiDocumentation | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [categories, setCategories] = useState<string[]>([]);

	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	useEffect(() => {
		const fetchDoc = async () => {
			if (!id) return;
			const fetchKey = String(id);
			if (isFetchingRef.current || fetchedIdRef.current === fetchKey) {
				return;
			}
			isFetchingRef.current = true;
			fetchedIdRef.current = fetchKey;
			setIsLoading(true);
			try {
				const [docRes, catRes] = await Promise.all([
					apiDocumentationService.getApiDocumentationById(id),
					apiDocumentationService.getDistinctCategories(),
				]);

				if (docRes?.data) {
					setDoc(docRes.data);
				}
				if (catRes?.data && Array.isArray(catRes.data)) {
					setCategories(catRes.data);
				}
			} catch (error: any) {
				console.error('Failed to load documentation for edit:', error);
				showNotification('Error', error?.message || 'Failed to load documentation.', 'danger');
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		};

		fetchDoc();
	}, [id]);

	const handleFormSubmit = async (values: any) => {
		if (!id) return;
		setIsSubmitting(true);
		try {
			const res = await apiDocumentationService.updateApiDocumentation(
				id,
				values as IUpdateApiDocumentationPayload,
			);
			showNotification(
				'Success',
				res?.message || 'API Documentation updated successfully.',
				'success',
			);
			navigate(`/${PAGE_ROUTES.API_DOCUMENTATION}`);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to update API documentation.',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<PageWrapper title='Edit API Documentation' permissionKey={PERMISSION_KEYS.API_DOCUMENTATION}>
				<Page container='fluid'>
					<div className='text-center py-5'>
						<Spinner color='primary' size='3rem' />
						<p className='text-muted mt-2 mb-0'>Loading API documentation...</p>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	if (!doc) {
		return (
			<PageWrapper title='Edit API Documentation' permissionKey={PERMISSION_KEYS.API_DOCUMENTATION}>
				<Page container='fluid'>
					<div className='text-center py-5'>
						<Icon icon='ReportProblem' size='3x' className='text-warning mb-2' />
						<h5 className='fw-bold'>API Documentation Not Found</h5>
						<p className='text-muted small mb-3'>
							The requested API documentation record could not be found.
						</p>
						<Button
							color='primary'
							icon='ArrowBack'
							onClick={() => navigate(`/${PAGE_ROUTES.API_DOCUMENTATION}`)}>
							Return to List
						</Button>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper
			title={`Edit ${doc.title}`}
			permissionKey={PERMISSION_KEYS.API_DOCUMENTATION}>
			<Page container='fluid'>
				<ApiDocumentationForm
					mode='edit'
					initialValues={doc}
					categories={categories}
					isSubmitting={isSubmitting}
					onSubmit={handleFormSubmit}
					onCancel={() => navigate(`/${PAGE_ROUTES.API_DOCUMENTATION}`)}
				/>
			</Page>
		</PageWrapper>
	);
};

export default ApiDocumentationEditPage;
