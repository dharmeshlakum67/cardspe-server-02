import React, { FC, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import Spinner from '../../../../components/bootstrap/Spinner';
import OperatorForm from './OperatorForm';
import operatorService from './service/operatorService';
import { IOperator } from './type/operator-type';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';
import { decryptId } from '../../../../helpers/routeEncryption';

const OperatorEditPage: FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [operatorData, setOperatorData] = useState<IOperator | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { canUpdate, isLoadingPermissions } = usePermission();
	const numericId = id ? decryptId(id) : null;

	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// REDIRECT IF PERMISSION DENIED
	useEffect(() => {
		if (
			!isLoadingPermissions &&
			!canUpdate(PERMISSION_KEYS.SERVICE_MANAGEMENT) &&
			!canUpdate(PERMISSION_KEYS.OPERATOR) &&
			!canUpdate('operator')
		) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canUpdate, navigate]);

	// FETCH OPERATOR DATA BY ID
	useEffect(() => {
		const fetchDetail = async () => {
			if (!numericId) {
				showNotification('Invalid Link', 'Invalid operator identifier', 'danger');
				navigate(`/${PAGE_ROUTES.OPERATORS}`);
				return;
			}

			const currentFetchKey = String(numericId);
			if (isFetchingRef.current || fetchedIdRef.current === currentFetchKey) {
				return;
			}

			isFetchingRef.current = true;
			fetchedIdRef.current = currentFetchKey;
			setIsLoading(true);

			try {
				const res = await operatorService.getOperatorById(numericId);
				if (res?.data) {
					setOperatorData(res.data);
				} else {
					showNotification('Not Found', 'Operator record not found', 'warning');
					navigate(`/${PAGE_ROUTES.OPERATORS}`);
				}
			} catch (error: any) {
				showNotification('Error', error?.message || 'Could not fetch operator details', 'danger');
				navigate(`/${PAGE_ROUTES.OPERATORS}`);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		};

		if (!isLoadingPermissions) {
			fetchDetail();
		}
	}, [numericId, isLoadingPermissions, navigate]);

	const handleFormSubmit = async (payload: FormData) => {
		if (!numericId) return;

		setIsSubmitting(true);
		try {
			const res = await operatorService.updateOperator(numericId, payload);
			showNotification(
				'Success',
				res?.message || 'Operator updated successfully.',
				'success',
			);
			navigate(`/${PAGE_ROUTES.OPERATORS}`);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.message || 'Failed to update operator',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoadingPermissions || isLoading) {
		return (
			<PageWrapper title="Edit Operator" permissionKey={PERMISSION_KEYS.OPERATOR}>
				<Page container="fluid">
					<div className="p-5 text-center text-muted">
						<Spinner size="lg" isGrow className="text-primary mb-2" />
						<div>Loading operator details...</div>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper isProtected permissionKey={PERMISSION_KEYS.OPERATOR} title="Edit Operator">
			<Page container="fluid">
				<OperatorForm
					mode="edit"
					initialValues={operatorData}
					isSubmitting={isSubmitting}
					onSubmit={handleFormSubmit}
					onCancel={() => navigate(`/${PAGE_ROUTES.OPERATORS}`)}
				/>
			</Page>
		</PageWrapper>
	);
};

export default OperatorEditPage;
