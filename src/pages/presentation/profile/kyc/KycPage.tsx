/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, no-nested-ternary */
import React, { FC, useEffect, useRef, useState } from 'react';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import AppBreadcrumbs from '../../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import showNotification from '../../../../components/extras/showNotification';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import kycService from './service/kycService';
import { IKycDetailsResponseData, IKycDocumentItem } from './type/kyc-type';
import KycDocumentCard from './components/KycDocumentCard';
import KycDocumentModal from './components/KycDocumentModal';
import './css/KycPage.scss';

export const KycPage: FC = () => {
	const [kycData, setKycData] = useState<IKycDetailsResponseData | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [activeDocument, setActiveDocument] = useState<IKycDocumentItem | null>(null);
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	// REF TO PREVENT DUPLICATE CALLS
	const isFetchingRef = useRef<boolean>(false);

	// FETCH KYC REQUIREMENTS & SUBMISSIONS
	const fetchKycData = async (force: boolean = false) => {
		if (isFetchingRef.current && !force) return;
		isFetchingRef.current = true;
		setIsLoading(true);

		try {
			const response = await kycService.getKycDetails();
			const extractedData: IKycDetailsResponseData =
				((response as any)?.data?.data ||
					(response as any)?.data ||
					response) as IKycDetailsResponseData;

			setKycData(extractedData);
		} catch (error: any) {
			showNotification(
				'Error',
				error?.data?.message || error?.message || 'Failed to fetch KYC verification details.',
				'danger',
			);
		} finally {
			setIsLoading(false);
			isFetchingRef.current = false;
		}
	};

	useEffect(() => {
		fetchKycData();
	}, []);

	// HANDLE DOCUMENT CARD ACTION CLICK
	const handleDocumentAction = (doc: IKycDocumentItem) => {
		setActiveDocument(doc);
		setIsModalOpen(true);
	};

	// HANDLE KYC DOCUMENT SUBMISSION
	const handleDocumentSubmit = async (formData: FormData) => {
		setIsSubmitting(true);
		try {
			const response = await kycService.submitKycDocument(formData);
			showNotification(
				'Success',
				response?.message || 'KYC document has been submitted successfully.',
				'success',
			);

			setIsModalOpen(false);
			setActiveDocument(null);

			// Refresh KYC details
			await fetchKycData(true);
		} catch (error: any) {
			showNotification(
				'Submission Failed',
				error?.data?.message || error?.message || 'Failed to submit KYC document.',
				'danger',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// EXTRACT DOCUMENTS ARRAY SAFELY
	let documents: IKycDocumentItem[] = [];
	if (kycData?.documents && Array.isArray(kycData.documents)) {
		documents = kycData.documents;
	} else if ((kycData as any)?.data?.documents && Array.isArray((kycData as any).data.documents)) {
		documents = (kycData as any).data.documents;
	}

	const overallStatus = kycData?.kyc_status || 'pending';
	const isApproved = kycData?.is_approved || overallStatus === 'approved';
	const isRejected = kycData?.is_rejected || overallStatus === 'rejected';
	const isSubmitted = kycData?.is_submitted || overallStatus === 'submitted' || overallStatus === 'in_review';

	const getOverallBadgeClass = () => {
		if (isApproved) return 'bg-success-subtle text-success border border-success';
		if (isRejected) return 'bg-danger-subtle text-danger border border-danger';
		if (isSubmitted) return 'bg-info-subtle text-info border border-info';
		return 'bg-warning-subtle text-warning border border-warning';
	};

	return (
		<PageWrapper title='KYC Verification'>
			<Page container='fluid'>
				<div className='kyc-page-wrapper'>
					{/* SUBHEADER BREADCRUMB */}
					<div className='kyc-top-bar'>
						<AppBreadcrumbs
							items={[
								{ label: 'Profile', to: `/${PAGE_ROUTES.PROFILE}` },
								{ label: 'KYC Verification', current: true },
							]}
						/>
					</div>

					{/* PAGE HEADER SECTION */}
					<div className='kyc-header-card'>
						<div className='d-flex align-items-center justify-content-between flex-wrap gap-3'>
							<div className='d-flex align-items-center gap-3'>
								<div className='kyc-header-icon'>
									<Icon icon='VerifiedUser' size='lg' />
								</div>
								<div>
									<h4 className='fw-bold mb-1 text-dark'>KYC Verification</h4>
									<p className='text-muted small mb-0'>
										Complete your identity verification to unlock full platform capabilities.
									</p>
								</div>
							</div>

							{/* OVERALL KYC STATUS BADGE */}
							{!isLoading && kycData && (
								<div className='d-flex align-items-center gap-2'>
									<span className='text-muted small'>Overall Status:</span>
									<span className={`badge text-capitalize font-monospace px-3 py-2 ${getOverallBadgeClass()}`}>
										{overallStatus.replace(/_/g, ' ')}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* LOADING STATE */}
					{isLoading && (
						<div className='kyc-loading-state text-center py-5'>
							<Spinner isGrow color='primary' className='mb-2' />
							<p className='text-muted small mb-0'>Loading KYC requirements...</p>
						</div>
					)}

					{/* DOCUMENT CARDS GRID */}
					{!isLoading && (
						<div className='row g-4'>
							{documents.length > 0 ? (
								documents.map((doc) => (
									<div
										key={doc.document_id || doc.document_code}
										className='col-12 col-md-6 col-lg-4'>
										<KycDocumentCard
											document={doc}
											onAction={handleDocumentAction}
										/>
									</div>
								))
							) : (
								<div className='col-12'>
									<div className='kyc-loading-state text-center py-5'>
										<Icon icon='FolderOff' size='2x' className='text-muted mb-2' />
										<p className='text-muted mb-0'>No KYC documents required for your role.</p>
									</div>
								</div>
							)}
						</div>
					)}

					{/* DYNAMIC DOCUMENT MODAL */}
					<KycDocumentModal
						isOpen={isModalOpen}
						setIsOpen={(open) => {
							setIsModalOpen(open);
							if (!open) setActiveDocument(null);
						}}
						document={activeDocument}
						onSubmit={handleDocumentSubmit}
						isSubmitting={isSubmitting}
					/>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default KycPage;
