/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props */
import React, { FC, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import settingService from '../service/settingService';
import { IThirdPartyServiceOption } from '../type/setting-type';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';

interface IBbpsServiceModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}

const DEFAULT_SERVICES: IThirdPartyServiceOption[] = [
	{
		label: 'Mobikwik',
		value: 'mobiquick',
		description: 'Mobikwik BBPS & recharge integrations.',
		is_active: true,
	},
	{
		label: 'Setu',
		value: 'setu',
		description: 'Setu BBPS & payment APIs.',
		is_active: false,
	},
];

const getProviderIconMeta = (value: string) => {
	const val = value.toLowerCase();
	if (val.includes('mobi')) {
		return {
			icon: 'AccountBalanceWallet',
			bg: '#e0f2fe',
			color: '#0284c7',
		};
	}
	if (val.includes('setu')) {
		return {
			icon: 'CloudDone',
			bg: '#dcfce7',
			color: '#16a34a',
		};
	}
	return {
		icon: 'Hub',
		bg: '#eef2ff',
		color: '#5c56b6',
	};
};

export const BbpsServiceModal: FC<IBbpsServiceModalProps> = ({
	isOpen,
	setIsOpen,
}) => {
	const { canUpdate, hasPermission, permissionsMap } = usePermission();

	// STRICT UPDATE PERMISSION FOR BBPS SERVICE MODULE ONLY
	const isUpdateAllowed = Boolean(
		canUpdate(PERMISSION_KEYS.MANAGE_BBPS_SERVICE) ||
		canUpdate('manage_bbps_service') ||
		hasPermission(PERMISSION_KEYS.MANAGE_BBPS_SERVICE, 'edit') ||
		hasPermission('manage_bbps_service', 'edit') ||
		hasPermission(PERMISSION_KEYS.MANAGE_BBPS_SERVICE, 'update') ||
		hasPermission('manage_bbps_service', 'update'),
	);

	const modalTitle =
		permissionsMap?.manage_bbps_service?.name ||
		permissionsMap?.[PERMISSION_KEYS.MANAGE_BBPS_SERVICE]?.name ||
		'BBPS Service Management';

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const [servicesList, setServicesList] = useState<IThirdPartyServiceOption[]>(DEFAULT_SERVICES);
	const [selectedService, setSelectedService] = useState<string>('mobiquick');
	const [initialActiveService, setInitialActiveService] = useState<string>('mobiquick');

	// FETCH THIRD PARTY SERVICE CONFIGURATION
	const fetchBbpsServices = useCallback(async () => {
		setIsLoading(true);
		setFetchError(null);
		try {
			const res = await settingService.getThirdPartyService();
			const data = res?.data;
			if (data) {
				const active = data.active_third_party_service || 'mobiquick';
				setSelectedService(active);
				setInitialActiveService(active);

				if (Array.isArray(data.services) && data.services.length > 0) {
					setServicesList(data.services);
				}
			}
		} catch (error: any) {
			const errMsg =
				error?.data?.message || error?.message || 'Failed to fetch BBPS service configuration';
			setFetchError(errMsg);
			showNotification('Error', errMsg, 'danger');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			fetchBbpsServices();
		}
	}, [isOpen, fetchBbpsServices]);

	const handleClose = () => {
		if (isSaving) return;
		setIsOpen(false);
	};

	// SUBMIT UPDATE TO API
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isUpdateAllowed) {
			showNotification(
				'Permission Denied',
				'You do not have permission to manage BBPS services.',
				'warning',
			);
			return;
		}

		if (selectedService === initialActiveService) {
			showNotification(
				'Info',
				'No changes were made. Current provider is already active.',
				'info',
			);
			handleClose();
			return;
		}

		setIsSaving(true);
		try {
			const response = await settingService.updateThirdPartyService(selectedService);
			showNotification(
				'Success',
				response?.message || 'Active BBPS service provider updated successfully.',
				'success',
			);
			setInitialActiveService(selectedService);
			handleClose();
		} catch (error: any) {
			showNotification(
				'Error',
				error?.data?.message ||
					error?.message ||
					'Failed to update BBPS service provider.',
				'danger',
			);
		} finally {
			setIsSaving(false);
		}
	};

	const renderModalBody = () => {
		if (isLoading) {
			return (
				<div className='d-flex flex-column align-items-center justify-content-center py-5 min-vh-25'>
					<Spinner isGrow={false} size='2.5rem' color='primary' className='mb-2' />
					<span className='text-muted small'>Loading BBPS service providers...</span>
				</div>
			);
		}

		if (fetchError) {
			return (
				<div className='alert alert-danger d-flex align-items-center gap-2 mb-0' role='alert'>
					<Icon icon='ErrorOutline' size='lg' />
					<div className='flex-grow-1'>{fetchError}</div>
					<Button type='button' color='light' isOutline size='sm' onClick={fetchBbpsServices}>
						Retry
					</Button>
				</div>
			);
		}

		return (
			<div className='d-flex flex-column gap-3'>
				{/* WARNING BANNER */}
				<div
					className='d-flex align-items-center gap-2.5 p-3 rounded-3 border'
					style={{
						backgroundColor: '#fffbeb',
						borderColor: '#fde68a',
						color: '#92400e',
					}}>
					<span
						className='d-inline-flex align-items-center justify-content-center text-warning flex-shrink-0'
						style={{ lineHeight: 0 }}>
						<Icon icon='Warning' size='md' />
					</span>
					<span
						className='small fw-medium mb-0 d-inline-block'
						style={{ lineHeight: 1.4 }}>
						Changing the provider will apply across the entire service flow
					</span>
				</div>

				{/* AVAILABLE PROVIDERS SECTION */}
				<div className='mt-2'>
					<div className='form-label fw-semibold small mb-3 text-dark'>
						Available BBPS Providers <span className='text-danger'>*</span>
					</div>

					{/* SQUARE CARDS GRID */}
					<div className='row g-3 g-md-4'>
						{servicesList.map((service) => {
							const isSelected = selectedService === service.value;
							const isCurrentActive = initialActiveService === service.value;
							const iconMeta = getProviderIconMeta(service.value);

							return (
								<div key={service.value} className='col-12 col-sm-6'>
									<div
										role='button'
										tabIndex={0}
										onClick={() => isUpdateAllowed && setSelectedService(service.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												if (isUpdateAllowed) setSelectedService(service.value);
											}
										}}
										className={`bbps-provider-card ${isUpdateAllowed ? 'is-interactive' : ''} ${
											isSelected ? 'is-selected' : ''
										}`}>
										{/* TOP ROW: ICON BADGE & RADIO INDICATOR */}
										<div className='bbps-card-header'>
											<div
												className='bbps-provider-icon'
												style={{
													backgroundColor: iconMeta.bg,
													color: iconMeta.color,
												}}>
												<Icon icon={iconMeta.icon} size='lg' />
											</div>

											<div className={`bbps-radio-indicator ${isSelected ? 'is-active' : ''}`}>
												{isSelected && <div className='bbps-radio-dot' />}
											</div>
										</div>

										{/* MIDDLE: TITLE & DESCRIPTION */}
										<div>
											<div className='bbps-provider-title'>{service.label}</div>
											<p className='bbps-provider-desc'>
												{service.description ||
													'Third-party BBPS & bill payment integration provider.'}
											</p>
										</div>

										{/* BOTTOM FOOTER BADGES */}
										<div className='bbps-card-footer'>
											{isCurrentActive ? (
												<span
													className='badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1'
													style={{ fontSize: '0.72rem', fontWeight: 600 }}>
													Current Active
												</span>
											) : (
												<span />
											)}

											{isSelected && (
												<span
													className='badge bg-primary text-white d-inline-flex align-items-center gap-1 px-2 py-1'
													style={{ fontSize: '0.72rem', fontWeight: 600 }}>
													<Icon icon='Check' size='sm' />
													Selected
												</span>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} isCentered size='lg'>
			<ModalHeader setIsOpen={handleClose} className='border-bottom pb-3 pt-3 px-4'>
				<ModalTitle id='bbps-service-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-flex align-items-center justify-content-center rounded-3'
							style={{
								width: '44px',
								height: '44px',
								backgroundColor: '#fef3c7',
								color: '#d97706',
								flexShrink: 0,
							}}>
							<Icon icon='CloudDone' size='lg' />
						</div>
						<div>
							<h5 className='mb-0 fw-bold text-dark'>{modalTitle}</h5>
							<small className='text-muted'>
								Manage which BBPS services are available through third-party providers
							</small>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<form onSubmit={handleSubmit}>
				<ModalBody className='px-4 py-4'>
					{renderModalBody()}
				</ModalBody>

				<ModalFooter className='border-top pt-3 pb-3 px-4 gap-2'>
					{isUpdateAllowed ? (
						<>
							<Button
								type='button'
								color='light'
								className='px-4 py-2 border rounded-3'
								onClick={handleClose}
								isDisable={isSaving}>
								Cancel
							</Button>
							<Button
								type='submit'
								color='primary'
								className='px-4 py-2 d-inline-flex align-items-center gap-2 rounded-3'
								isDisable={isSaving || isLoading}>
								{isSaving ? (
									<>
										<Spinner isSmall inButton isGrow={false} className='me-1' />
										Saving Provider...
									</>
								) : (
									<>
										<Icon icon='Save' size='sm' />
										Save Provider
									</>
								)}
							</Button>
						</>
					) : (
						<Button
							type='button'
							color='light'
							className='px-4 py-2 border rounded-3'
							onClick={handleClose}>
							Close
						</Button>
					)}
				</ModalFooter>
			</form>
		</Modal>
	);
};

BbpsServiceModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
};

export default BbpsServiceModal;
