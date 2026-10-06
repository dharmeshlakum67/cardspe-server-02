/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import React, { FC, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import AppBreadcrumbs from '../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Icon from '../../../components/icon/Icon';
import Spinner from '../../../components/bootstrap/Spinner';
import usePermission from '../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../constants/pageRoutes';
import ServiceConfigurationModal from './components/ServiceConfigurationModal';
import GeneralSettingModal from './components/GeneralSettingModal';
import './css/SettingPage.scss';

export interface ISettingItem {
	id: string;
	title: string;
	description: string;
	icon: string;
	iconBg: string;
	iconColor: string;
	badge?: string;
}

const SETTING_MODULES: ISettingItem[] = [
	{
		id: 'general',
		title: 'General',
		description: 'Basic system settings like company details, timezone, date format and more.',
		icon: 'Settings',
		iconBg: '#eff6ff',
		iconColor: '#2563eb',
	},
	{
		id: 'service-configuration',
		title: 'Service Configuration',
		description: 'Configure service availability, charges, limits, and service-specific settings.',
		icon: 'SlidersHorizontal',
		iconBg: '#f0fdf4',
		iconColor: '#16a34a',
	},
	{
		id: 'payment-gateway',
		title: 'Payment Gateway',
		description: 'Manage and configure payment gateways, credentials, statuses, and icons.',
		icon: 'AccountBalanceWallet',
		iconBg: '#fdf2f8',
		iconColor: '#db2777',
	},
];

export const SettingPage: FC = () => {
	const navigate = useNavigate();
	const { canRead, isLoadingPermissions } = usePermission();

	// SUB-PERMISSION CHECKS
	const hasBasicSettingAccess =
		canRead(PERMISSION_KEYS.BASIC_SETTING) || canRead('basic_setting');
	const hasServiceConfigAccess =
		canRead(PERMISSION_KEYS.SERVICE_CONFIGURATION) || canRead('service_configuration');
	const hasPaymentGatewayAccess =
		canRead(PERMISSION_KEYS.PAYMENT_GATEWAY) || canRead('payment_gateway');

	// OVERALL SETTINGS ACCESS (IF USER HAS ACCESS TO ANY SUB-MODULE OR PARENT SETTING)
	const hasAnySettingAccess =
		hasBasicSettingAccess ||
		hasServiceConfigAccess ||
		hasPaymentGatewayAccess ||
		canRead(PERMISSION_KEYS.SETTING) ||
		canRead('setting');

	const [searchTerm, setSearchTerm] = useState<string>('');
	const [activeSettingId, setActiveSettingId] = useState<string | null>(null);
	const [isServiceConfigModalOpen, setIsServiceConfigModalOpen] = useState<boolean>(false);
	const [isGeneralSettingModalOpen, setIsGeneralSettingModalOpen] = useState<boolean>(false);

	// FILTER SETTING MODULES BASED ON PERMISSION
	const availableModules = useMemo(() => {
		return SETTING_MODULES.filter((item) => {
			if (item.id === 'general') return hasBasicSettingAccess;
			if (item.id === 'service-configuration') return hasServiceConfigAccess;
			if (item.id === 'payment-gateway') return hasPaymentGatewayAccess;
			return false;
		});
	}, [hasBasicSettingAccess, hasServiceConfigAccess, hasPaymentGatewayAccess]);

	// FILTER SETTINGS BASED ON SEARCH QUERY
	const filteredSettings = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) return availableModules;
		return availableModules.filter(
			(item) =>
				item.title.toLowerCase().includes(query) ||
				item.description.toLowerCase().includes(query),
		);
	}, [availableModules, searchTerm]);

	const handleCardClick = (item: ISettingItem) => {
		setActiveSettingId(item.id);
		if (item.id === 'service-configuration') {
			setIsServiceConfigModalOpen(true);
		} else if (item.id === 'general') {
			setIsGeneralSettingModalOpen(true);
		} else if (item.id === 'payment-gateway') {
			navigate(`/${PAGE_ROUTES.SETTING_PAYMENT_GATEWAY}`);
		}
	};

	if (isLoadingPermissions) {
		return (
			<PageWrapper title='Settings'>
				<Page container='fluid'>
					<div className='d-flex align-items-center justify-content-center min-vh-50 py-5'>
						<Spinner color='primary' size='3rem' isGrow={false} />
					</div>
				</Page>
			</PageWrapper>
		);
	}

	if (!hasAnySettingAccess || availableModules.length === 0) {
		return (
			<PageWrapper title='Settings'>
				<Page container='fluid'>
					<div className='setting-page-wrapper'>
						<div className='setting-top-bar'>
							<AppBreadcrumbs items={[{ label: 'Settings', current: true }]} />
						</div>
						<div className='row justify-content-center py-5'>
							<div className='col-12 col-md-8 col-lg-6'>
								<Card className='text-center shadow-sm p-4'>
									<CardBody>
										<div className='mb-3 text-danger'>
											<Icon icon='Lock' size='3x' />
										</div>
										<h4 className='fw-bold mb-2'>Access Denied</h4>
										<p className='text-muted mb-0'>
											You do not have permission to view any Settings tabs. Please
											contact your system administrator.
										</p>
									</CardBody>
								</Card>
							</div>
						</div>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper title='Settings'>
			<Page container='fluid'>
				<div className='setting-page-wrapper'>
					{/* TOP BREADCRUMBS BAR */}
					<div className='setting-top-bar'>
						<AppBreadcrumbs items={[{ label: 'Settings', current: true }]} />
					</div>

					{/* PAGE HEADER SECTION: ICON, TITLE, SUBTITLE & SEARCH */}
					<div className='setting-header-section'>
						<div className='setting-title-box'>
							<div className='setting-main-icon'>
								<Icon icon='Settings' size='lg' />
							</div>
							<div>
								<h4 className='setting-title'>Settings</h4>
								<p className='setting-subtitle'>
									Manage your system configuration
								</p>
							</div>
						</div>

						{/* SEARCH SETTINGS BAR */}
						<div className='setting-search-box'>
							<span className='setting-search-icon'>
								<Icon icon='Search' size='sm' />
							</span>
							<input
								type='text'
								className='setting-search-input'
								placeholder='Search settings...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
							{searchTerm && (
								<button
									type='button'
									className='setting-search-clear'
									onClick={() => setSearchTerm('')}
									aria-label='Clear search'>
									<Icon icon='Close' size='sm' />
								</button>
							)}
						</div>
					</div>

					{/* SETTINGS CARDS GRID */}
					{filteredSettings.length > 0 ? (
						<div className='row g-3'>
							{filteredSettings.map((item) => {
								const isActive = activeSettingId === item.id;
								return (
									<div key={item.id} className='col-12 col-md-6'>
										<div
											className={`setting-card-item ${isActive ? 'is-active' : ''}`}
											onClick={() => handleCardClick(item)}>
											<div className='setting-card-left'>
												<div
													className='setting-card-icon-box'
													style={{
														backgroundColor: item.iconBg,
														color: item.iconColor,
													}}>
													<Icon icon={item.icon} size='md' />
												</div>
												<div className='setting-card-text'>
													<div className='setting-card-title'>{item.title}</div>
													<p className='setting-card-desc'>{item.description}</p>
												</div>
											</div>
											<div className='setting-card-arrow'>
												<Icon icon='ChevronRight' size='md' />
											</div>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className='setting-empty-search'>
							<div className='text-muted mb-2'>
								<Icon icon='SearchOff' size='2x' />
							</div>
							<h5 className='fw-bold text-dark mb-1'>No settings found</h5>
							<p className='text-muted small mb-0'>
								No settings matched &quot;{searchTerm}&quot;. Try a different search keyword.
							</p>
						</div>
					)}
				</div>

				{/* GENERAL SETTING MODAL */}
				<GeneralSettingModal
					isOpen={isGeneralSettingModalOpen}
					setIsOpen={setIsGeneralSettingModalOpen}
				/>

				{/* SERVICE CONFIGURATION MODAL */}
				<ServiceConfigurationModal
					isOpen={isServiceConfigModalOpen}
					setIsOpen={setIsServiceConfigModalOpen}
				/>
			</Page>
		</PageWrapper>
	);
};

export default SettingPage;
