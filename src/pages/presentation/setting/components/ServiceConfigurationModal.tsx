/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, no-nested-ternary */
import React, { FC, useCallback, useEffect, useState } from 'react';
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
import { IServiceConfigurationItem } from '../type/setting-type';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';

interface IServiceConfigurationModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}

// FORMAT SLUG TO TITLE CASE
const formatSlugName = (slug: string): string => {
	if (!slug) return 'Service';
	return slug
		.split(/[_-]+/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(' ');
};

// FORMAT CHARGE KEY TO READABLE LABEL
const formatChargeLabel = (key: string): string => {
	if (!key) return 'Charge';
	return key
		.split(/[_-]+/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(' ');
};

export const ServiceConfigurationModal: FC<IServiceConfigurationModalProps> = ({
	isOpen,
	setIsOpen,
}) => {
	const { canUpdate, hasPermission, permissionsMap } = usePermission();
	const isUpdateAllowed =
		canUpdate(PERMISSION_KEYS.SERVICE_CONFIGURATION) ||
		canUpdate('service_configuration') ||
		hasPermission(PERMISSION_KEYS.SERVICE_CONFIGURATION, 'edit') ||
		hasPermission('service_configuration', 'edit') ||
		hasPermission(PERMISSION_KEYS.SERVICE_CONFIGURATION, 'update') ||
		hasPermission('service_configuration', 'update') ||
		canUpdate(PERMISSION_KEYS.SETTING) ||
		canUpdate('setting');

	const modalTitle =
		permissionsMap?.service_configuration?.name ||
		permissionsMap?.[PERMISSION_KEYS.SERVICE_CONFIGURATION]?.name ||
		'Service Configuration';

	const [configs, setConfigs] = useState<IServiceConfigurationItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	// EDITING STATES PER SERVICE SLUG
	const [editingSlug, setEditingSlug] = useState<string | null>(null);
	const [editCharges, setEditCharges] = useState<Record<string, string>>({});
	const [editStatus, setEditStatus] = useState<string>('active');
	const [isSaving, setIsSaving] = useState<boolean>(false);

	// FETCH SERVICE CONFIGURATIONS FROM API
	const fetchConfigs = useCallback(async () => {
		setIsLoading(true);
		setFetchError(null);
		setEditingSlug(null);
		try {
			const res = await settingService.getServiceConfig();
			if (res && res.data) {
				const list = Array.isArray(res.data) ? res.data : [res.data];
				setConfigs(list);
			} else {
				setConfigs([]);
			}
		} catch (error: any) {
			const errMsg = error?.message || 'Failed to fetch service configuration data';
			setFetchError(errMsg);
			showNotification('Error', errMsg, 'danger');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			fetchConfigs();
		}
	}, [isOpen, fetchConfigs]);

	// ENTER EDIT MODE FOR A CONFIG ITEM
	const handleStartEdit = (config: IServiceConfigurationItem) => {
		setEditingSlug(config.service_slug);
		const initialCharges: Record<string, string> = {};
		if (config.charges && typeof config.charges === 'object') {
			Object.entries(config.charges).forEach(([k, v]) => {
				initialCharges[k] = String(v ?? '');
			});
		}
		setEditCharges(initialCharges);
		setEditStatus(config.status || 'active');
	};

	// CANCEL EDIT
	const handleCancelEdit = () => {
		setEditingSlug(null);
		setEditCharges({});
	};

	// HANDLE CHARGE INPUT CHANGE
	const handleChargeChange = (key: string, value: string) => {
		setEditCharges((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// SAVE UPDATED CONFIGURATION
	const handleSaveConfig = async (serviceSlug: string) => {
		// VALIDATE NUMERIC VALUES
		for (const [k, v] of Object.entries(editCharges)) {
			if (v.trim() === '' || isNaN(Number(v)) || Number(v) < 0) {
				showNotification(
					'Validation Error',
					`Please enter a valid non-negative amount for ${formatChargeLabel(k)}`,
					'warning',
				);
				return;
			}
		}

		setIsSaving(true);
		try {
			const payload = {
				service_slug: serviceSlug,
				charges: editCharges,
				status: editStatus,
			};

			const res = await settingService.updateServiceConfig(payload);
			showNotification(
				'Success',
				res?.message || 'Service configuration updated successfully',
				'success',
			);

			// UPDATE LOCAL STATE
			setConfigs((prev) =>
				prev.map((item) =>
					item.service_slug === serviceSlug
						? {
								...item,
								charges: { ...editCharges },
								status: editStatus,
							}
						: item,
				),
			);
			setEditingSlug(null);
		} catch (error: any) {
			const errMsg = error?.message || 'Failed to update service configuration';
			showNotification('Update Error', errMsg, 'danger');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			size='lg'
			isStaticBackdrop
			isCentered>
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom pb-3'>
				<div className='d-flex align-items-center gap-3'>
					<div
						className='rounded-3 d-flex align-items-center justify-content-center'
						style={{
							width: '42px',
							height: '42px',
							backgroundColor: '#f0fdf4',
							color: '#16a34a',
						}}>
						<Icon icon='Tune' size='lg' />
					</div>
					<div>
						<ModalTitle id='service-config-modal-title' className='h5 fw-bold mb-0 text-dark'>
							{modalTitle}
						</ModalTitle>
						<small className='text-muted'>
							Manage service availability, pricing, and charge rules
						</small>
					</div>
				</div>
			</ModalHeader>

			<ModalBody className='py-4'>
				{isLoading ? (
					<div className='d-flex flex-column align-items-center justify-content-center py-5'>
						<Spinner color='primary' size='3rem' isGrow={false} />
						<p className='text-muted small mt-3 mb-0'>Fetching service configuration...</p>
					</div>
				) : fetchError ? (
					<div className='alert alert-danger d-flex align-items-center justify-content-between p-3'>
						<div className='d-flex align-items-center gap-2'>
							<Icon icon='ErrorOutline' size='lg' />
							<span>{fetchError}</span>
						</div>
						<Button color='danger' size='sm' onClick={fetchConfigs}>
							Retry
						</Button>
					</div>
				) : configs.length === 0 ? (
					<div className='text-center py-5'>
						<Icon icon='SearchOff' size='3x' className='text-muted mb-2' />
						<h6 className='fw-bold text-dark'>No Service Configurations Found</h6>
						<p className='text-muted small mb-0'>
							No active service configurations are currently available in the system.
						</p>
					</div>
				) : (
					<div className='d-flex flex-column gap-4'>
						{configs.map((config) => {
							const charges = config.charges || {};
							const chargeEntries = Object.entries(charges);
							const isActive = config.status === 'active';
							const isEditing = editingSlug === config.service_slug;

							return (
								<div
									key={config.id || config.service_slug}
									className={`card rounded-3 shadow-none overflow-hidden ${
										isEditing ? 'border-primary' : 'border'
									}`}>
									{/* CONFIG ITEM HEADER */}
									<div className='card-header bg-light d-flex align-items-center justify-content-between py-3 px-4'>
										<div className='d-flex align-items-center gap-2'>
											<span className='fw-bold text-dark fs-6'>
												{formatSlugName(config.service_slug)}
											</span>
											<span className='text-muted small font-monospace'>
												({config.service_slug})
											</span>
										</div>
										<div className='d-flex align-items-center gap-2'>
											{isEditing ? (
												<select
													className='form-select form-select-sm'
													style={{ width: '120px' }}
													value={editStatus}
													onChange={(e) => setEditStatus(e.target.value)}>
													<option value='active'>Active</option>
													<option value='inactive'>Inactive</option>
												</select>
											) : (
												<>
													<span
														className={`badge px-3 py-2 rounded-pill font-monospace ${
															isActive
																? 'bg-success-subtle text-success border border-success'
																: 'bg-secondary-subtle text-secondary border'
														}`}>
														{isActive ? 'ACTIVE' : 'INACTIVE'}
													</span>
													{isUpdateAllowed && (
														<Button
															color='primary'
															isLight
															size='sm'
															icon='Edit'
															onClick={() => handleStartEdit(config)}>
															Edit
														</Button>
													)}
												</>
											)}
										</div>
									</div>

									{/* CHARGES BREAKDOWN / EDIT FORM */}
									<div className='card-body p-4'>
										<h6 className='text-muted text-uppercase fw-bold small mb-3'>
											Service Charges Breakdown
										</h6>
										{isEditing ? (
											<div>
												<div className='row g-3'>
													{Object.keys(editCharges).map((chargeKey, idx) => (
														<div key={chargeKey} className='col-12 col-md-4'>
															<div
																className='p-3 rounded-3 border bg-white h-100'
																style={{
																	transition: 'all 0.2s ease',
																}}>
																<label
																	htmlFor={`input-${chargeKey}`}
																	className='text-muted small mb-1 d-block'
																	style={{ cursor: 'pointer' }}>
																	{formatChargeLabel(chargeKey)}
																</label>
																<div className='d-flex align-items-center gap-1 border-bottom border-primary-subtle pb-1'>
																	<span className='h4 fw-bold text-dark mb-0'>
																		₹
																	</span>
																	<input
																		id={`input-${chargeKey}`}
																		type='number'
																		step='0.01'
																		min='0'
																		className='form-control border-0 p-0 fw-bold text-dark shadow-none'
																		style={{
																			fontSize: '1.4rem',
																			height: 'auto',
																			backgroundColor: 'transparent',
																			lineHeight: 1.2,
																		}}
																		value={editCharges[chargeKey] ?? ''}
																		onWheel={(e) =>
																			(e.target as HTMLElement).blur()
																		}
																		onKeyDown={(e) => {
																			if (
																				e.key === '-' ||
																				e.key === 'e' ||
																				e.key === 'E'
																			) {
																				e.preventDefault();
																			}
																		}}
																		onChange={(e) =>
																			handleChargeChange(
																				chargeKey,
																				e.target.value,
																			)
																		}
																		placeholder='0.00'
																	/>
																</div>
															</div>
														</div>
													))}
												</div>

												<div className='d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top'>
													<Button
														color='secondary'
														isLight
														size='sm'
														isDisable={isSaving}
														onClick={handleCancelEdit}>
														Cancel
													</Button>
													<Button
														color='primary'
														size='sm'
														icon={isSaving ? undefined : 'Save'}
														isDisable={isSaving}
														onClick={() =>
															handleSaveConfig(config.service_slug)
														}>
														{isSaving ? (
															<>
																<Spinner size='sm' isGrow={false} />
																<span className='ms-2'>Saving...</span>
															</>
														) : (
															'Save Changes'
														)}
													</Button>
												</div>
											</div>
										) : chargeEntries.length > 0 ? (
											<div className='row g-3'>
												{chargeEntries.map(([chargeKey, chargeVal]) => (
													<div key={chargeKey} className='col-12 col-md-4'>
														<div className='p-3 rounded-3 border bg-white h-100'>
															<div className='text-muted small mb-1'>
																{formatChargeLabel(chargeKey)}
															</div>
															<div className='h4 fw-bold text-dark mb-0'>
																₹{String(chargeVal ?? '0.00')}
															</div>
														</div>
													</div>
												))}
											</div>
										) : (
											<p className='text-muted small mb-0'>No charges configured.</p>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</ModalBody>

			<ModalFooter className='border-top pt-3'>
				<Button
					color='secondary'
					isLight
					isDisable={isSaving}
					onClick={() => setIsOpen(false)}>
					Close
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ServiceConfigurationModal;
