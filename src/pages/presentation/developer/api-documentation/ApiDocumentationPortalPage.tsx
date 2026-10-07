/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/control-has-associated-label, no-nested-ternary, prefer-destructuring */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import Card, { CardBody } from '../../../../components/bootstrap/Card';
import Button from '../../../../components/bootstrap/Button';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import Input from '../../../../components/bootstrap/forms/Input';
import AppBreadcrumbs from '../../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { encryptId } from '../../../../helpers/routeEncryption';
import { IApiDocumentation } from './type/api-documentation.type';
import apiDocumentationService from './service/apiDocumentationService';
import ApiDocMethodBadge from './components/ApiDocMethodBadge';
import ApiDocumentationViewContent from './components/ApiDocumentationViewContent';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { authPagesMenu } from '../../../../menu';
import './css/ApiDocumentation.scss';

export const ApiDocumentationPortalPage: FC = () => {
	const navigate = useNavigate();
	const { slug } = useParams<{ slug?: string }>();
	const { canRead, canUpdate, hasPermission, isLoadingPermissions } = usePermission();

	const hasRead =
		canRead(PERMISSION_KEYS.API_DOCUMENTATION) ||
		canRead(PERMISSION_KEYS.DEVELOPER) ||
		canRead('api_documentation') ||
		canRead('developer');

	const hasPortal =
		hasPermission(PERMISSION_KEYS.API_DOCUMENTATION, 'portal') ||
		hasPermission(PERMISSION_KEYS.DEVELOPER, 'portal') ||
		hasPermission('api_documentation', 'portal') ||
		hasPermission('developer', 'portal');

	const hasUpdate =
		canUpdate(PERMISSION_KEYS.API_DOCUMENTATION) ||
		canUpdate(PERMISSION_KEYS.DEVELOPER);

	// REDIRECT UNAUTHORIZED USERS (NEITHER READ NOR PORTAL PERMISSION)
	useEffect(() => {
		if (isLoadingPermissions) return;
		if (!hasRead && !hasPortal) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, hasRead, hasPortal, navigate]);

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [categories, setCategories] = useState<string[]>([]);
	const [groups, setGroups] = useState<Record<string, IApiDocumentation[]>>({});
	const [selectedDoc, setSelectedDoc] = useState<IApiDocumentation | null>(null);
	const [sidebarSearch, setSidebarSearch] = useState<string>('');

	const isFetchingPortalRef = useRef<boolean>(false);
	const fetchedSlugRef = useRef<string | null>(null);

	// DYNAMIC BREADCRUMBS (HIDE LINK TO LIST PAGE IF USER HAS ONLY PORTAL ACCESS)
	const breadcrumbItems = useMemo(() => {
		if (hasRead) {
			return [
				{ label: 'Developer', to: `/${PAGE_ROUTES.API_KEY_REQUEST}` },
				{ label: 'API Documentation', to: `/${PAGE_ROUTES.API_DOCUMENTATION}` },
				{ label: 'Developer Portal', current: true },
			];
		}
		return [
			{ label: 'Developer', to: `/${PAGE_ROUTES.API_KEY_REQUEST}` },
			{ label: 'Developer Portal', current: true },
		];
	}, [hasRead]);

	// FETCH PORTAL DATA
	useEffect(() => {
		const fetchPortalData = async () => {
			const currentSlugKey = slug || '__ALL__';
			if (isFetchingPortalRef.current || fetchedSlugRef.current === currentSlugKey) {
				return;
			}
			isFetchingPortalRef.current = true;
			fetchedSlugRef.current = currentSlugKey;
			setIsLoading(true);
			try {
				const res = await apiDocumentationService.getPublicDocumentationPortal();
				const data = res?.data || { categories: [], groups: {}, total: 0 };
				setCategories(data.categories || []);
				setGroups(data.groups || {});

				// SELECT INITIAL DOC (EITHER MATCHING SLUG OR FIRST AVAILABLE)
				let foundDoc: IApiDocumentation | null = null;
				if (slug) {
					for (const cat of Object.keys(data.groups || {})) {
						const match = data.groups[cat].find(
							(d) => d.slug === slug || String(d.id) === slug,
						);
						if (match) {
							foundDoc = match;
							break;
						}
					}
				}

				if (!foundDoc && data.categories && data.categories.length > 0) {
					const firstCat = data.categories[0];
					if (data.groups[firstCat] && data.groups[firstCat].length > 0) {
						foundDoc = data.groups[firstCat][0];
					}
				}

				setSelectedDoc(foundDoc);
			} catch (error) {
				console.error('Failed to load developer portal:', error);
			} finally {
				setIsLoading(false);
				isFetchingPortalRef.current = false;
			}
		};

		fetchPortalData();
	}, [slug]);

	// FILTERED GROUPS BY SIDEBAR SEARCH
	const filteredGroups = useMemo(() => {
		if (!sidebarSearch.trim()) return groups;
		const query = sidebarSearch.toLowerCase().trim();
		const result: Record<string, IApiDocumentation[]> = {};

		Object.entries(groups).forEach(([cat, docs]) => {
			const matched = docs.filter(
				(d) =>
					d.title.toLowerCase().includes(query) ||
					d.endpoint.toLowerCase().includes(query) ||
					d.method.toLowerCase().includes(query),
			);
			if (matched.length > 0) {
				result[cat] = matched;
			}
		});

		return result;
	}, [groups, sidebarSearch]);

	const totalEndpointsCount = useMemo(() => {
		return Object.values(groups).reduce((acc, curr) => acc + (curr?.length || 0), 0);
	}, [groups]);

	return (
		<PageWrapper title='Developer Documentation Portal'>
			<Page container='fluid'>
				<div className='document-type-page document-type-view-page api-doc-merchant-view api-documentation-portal'>
					{/* TOP ROW: BREADCRUMBS (LEFT) & ACTION BUTTON (RIGHT) */}
					<div className='doc-page-header mb-3'>
						<div className='doc-title-section'>
							<AppBreadcrumbs items={breadcrumbItems} />
						</div>

						{hasRead && (
							<div className='doc-header-actions'>
								<button
									type='button'
									className='btn-cancel-action'
									onClick={() => navigate(`/${PAGE_ROUTES.API_DOCUMENTATION}`)}>
									<Icon icon='ArrowBack' size='sm' />
									<span>Back to Documentation List</span>
								</button>
							</div>
						)}
					</div>

					{isLoading ? (
						<div className='text-center py-5'>
							<Spinner color='primary' size='3rem' />
							<p className='text-muted mt-2 mb-0'>Loading documentation portal...</p>
						</div>
					) : categories.length === 0 || Object.keys(groups).length === 0 ? (
						<Card className='shadow-sm'>
							<CardBody className='text-center py-5'>
								<Icon icon='MenuBook' size='3x' className='text-muted opacity-50 mb-2' />
								<h6 className='fw-bold text-muted'>No Published Documentation Found</h6>
								<p className='text-muted small mb-3'>
									There are no published API endpoints yet. Published documentations will appear
									here automatically.
								</p>
								{hasRead && (
									<Button
										color='primary'
										icon='ArrowBack'
										onClick={() => navigate(`/${PAGE_ROUTES.API_DOCUMENTATION}`)}>
										Go to Documentation Manager
									</Button>
								)}
							</CardBody>
						</Card>
					) : (
						<div className='api-portal-layout'>
							{/* SIDEBAR NAVIGATION */}
							<aside className='portal-sidebar'>
								<div className='sidebar-search'>
									<div className='input-group input-group-sm'>
										<span className='input-group-text bg-transparent border-end-0'>
											<Icon icon='Search' className='text-muted' />
										</span>
										<Input
											placeholder='Filter endpoints...'
											className='border-start-0'
											value={sidebarSearch}
											onChange={(e: any) => setSidebarSearch(e.target.value)}
										/>
										{sidebarSearch && (
											<button
												type='button'
												className='btn btn-outline-secondary border-start-0'
												onClick={() => setSidebarSearch('')}>
												<Icon icon='Close' size='sm' />
											</button>
										)}
									</div>
								</div>

								{/* CATEGORIES ACCORDION WITH INDEPENDENT SCROLL */}
								<div className='portal-sidebar-body'>
									{Object.keys(filteredGroups).map((catName) => {
										const docs = filteredGroups[catName] || [];
										if (docs.length === 0) return null;

										return (
											<div key={catName} className='portal-category-group'>
												<div className='category-title'>
													<span>{catName}</span>
													<span className='category-count'>{docs.length}</span>
												</div>
												<div className='category-items'>
													{docs.map((doc) => {
														const isActive = selectedDoc?.id === doc.id;
														return (
															<button
																key={doc.id}
																type='button'
																className={`portal-endpoint-link ${isActive ? 'active' : ''}`}
																onClick={() => setSelectedDoc(doc)}>
																<span className='item-title'>{doc.title}</span>
																<ApiDocMethodBadge method={doc.method} size='sm' />
															</button>
														);
													})}
												</div>
											</div>
										);
									})}
								</div>
							</aside>

							{/* MAIN DOCUMENTATION CONTENT */}
							<main className='portal-content-card'>
								{selectedDoc ? (
									<ApiDocumentationViewContent
										doc={selectedDoc}
										onEdit={(d) =>
											navigate(
												`/${PAGE_ROUTES.API_DOCUMENTATION_EDIT.replace(
													':id',
													encryptId(d.id),
												)}`,
											)
										}
										canEdit={hasUpdate}
									/>
								) : (
									<div className='text-center py-5 text-muted'>
										<Icon icon='TouchApp' size='2x' className='mb-2 opacity-50' />
										<p>Select an endpoint from the sidebar to view its documentation.</p>
									</div>
								)}
							</main>
						</div>
					)}
				</div>
			</Page>
		</PageWrapper>
	);
};

export default ApiDocumentationPortalPage;
