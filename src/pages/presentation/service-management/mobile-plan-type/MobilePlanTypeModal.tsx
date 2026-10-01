/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useEffect, useState } from 'react';
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
import showNotification from '../../../../components/extras/showNotification';
import {
	IMobilePlanType,
	MobilePlanTypeStatusType,
	CreateMobilePlanTypePayload,
	UpdateMobilePlanTypePayload,
} from './type/mobile-plan-type';
import mobilePlanTypeService from './service/mobilePlanTypeService';
import constantService, { IConstantOption } from '../../../../services/constantService';

interface IMobilePlanTypeModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	planTypeData?: IMobilePlanType | null;
	onSubmit: (payload: CreateMobilePlanTypePayload | UpdateMobilePlanTypePayload) => Promise<void>;
	isSubmitting: boolean;
}

export const MobilePlanTypeModal: FC<IMobilePlanTypeModalProps> = ({
	isOpen,
	setIsOpen,
	planTypeData,
	onSubmit,
	isSubmitting,
}) => {
	const isEdit = Boolean(planTypeData);
	const [name, setName] = useState<string>('');
	const [planTypeId, setPlanTypeId] = useState<string>('');
	const [status, setStatus] = useState<MobilePlanTypeStatusType>('active');
	const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

	// DYNAMIC CONSTANTS (STATUS)
	const [statusOptions, setStatusOptions] = useState<IConstantOption[]>([
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
	]);

	useEffect(() => {
		let isMounted = true;
		const loadConstants = async () => {
			try {
				const sOpts = await constantService.getStatusConstants();
				if (isMounted && sOpts && sOpts.length > 0) {
					setStatusOptions(sOpts);
				}
			} catch (err) {
				// Keep default options
			}
		};
		loadConstants();
		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		let isMounted = true;

		if (planTypeData && isOpen) {
			// Populate immediately from list row
			setName(planTypeData.name || '');
			setPlanTypeId(
				planTypeData.plan_type_id !== null && planTypeData.plan_type_id !== undefined
					? String(planTypeData.plan_type_id)
					: '',
			);
			setStatus(planTypeData.status || 'active');

			// Fetch fresh record from backend to avoid stale data
			if (planTypeData.id) {
				setIsLoadingDetail(true);
				mobilePlanTypeService
					.getMobilePlanTypeById(planTypeData.id)
					.then((res) => {
						if (!isMounted) return;
						const fresh = res?.data;
						if (fresh) {
							setName(fresh.name || '');
							setPlanTypeId(
								fresh.plan_type_id !== null && fresh.plan_type_id !== undefined
									? String(fresh.plan_type_id)
									: '',
							);
							setStatus(fresh.status || 'active');
						}
					})
					.catch(() => {
						// Keep optimistic list data on error
					})
					.finally(() => {
						if (isMounted) {
							setIsLoadingDetail(false);
						}
					});
			}
		} else if (isOpen) {
			setName('');
			setPlanTypeId('');
			setStatus('active');
			setIsLoadingDetail(false);
		}

		return () => {
			isMounted = false;
		};
	}, [planTypeData, isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			showNotification('Validation Error', 'Plan type name is required', 'warning');
			return;
		}

		const parsedPlanTypeId = planTypeId.trim() !== '' ? Number(planTypeId.trim()) : null;
		if (parsedPlanTypeId !== null && Number.isNaN(parsedPlanTypeId)) {
			showNotification('Validation Error', 'Plan type ID must be a valid number', 'warning');
			return;
		}

		await onSubmit({
			name: name.trim(),
			plan_type_id: parsedPlanTypeId,
			status,
		});
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg'>
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='mobile-plan-type-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-flex align-items-center justify-content-center rounded-3'
							style={{
								width: '44px',
								height: '44px',
								backgroundColor: '#e0f2fe',
								color: '#0284c7',
								flexShrink: 0,
							}}>
							<Icon icon={isEdit ? 'Edit' : 'PhoneAndroid'} size='lg' />
						</div>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h5 className='fw-bold mb-0 text-dark'>
									{isEdit ? 'Edit Mobile Plan Type' : 'Create Mobile Plan Type'}
								</h5>
								{isLoadingDetail && <Spinner isSmall className='text-primary' />}
							</div>
							<span className='text-muted small' style={{ fontSize: '0.8125rem' }}>
								{isEdit
									? 'Update plan type details and activation status.'
									: 'Add a new mobile recharge plan type to organize service plans.'}
							</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody className='px-4 py-3'>
					<div className='row g-3'>
						{/* PLAN TYPE NAME (FULL WIDTH) */}
						<div className='col-12'>
							<label htmlFor='planTypeNameInput' className='form-label fw-semibold small mb-1'>
								Plan Type Name <span className='text-danger'>*</span>
							</label>
							<input
								id='planTypeNameInput'
								type='text'
								maxLength={100}
								className='form-control role-name-input'
								placeholder='e.g. Prepaid, Full TT, Topup, Special Recharge'
								value={name}
								onChange={(e) => setName(e.target.value)}
								style={{
									height: '42px',
									borderRadius: '0.5rem',
									border: '1px solid #cbd5e1',
									fontSize: '0.9rem',
								}}
								required
							/>
							<div className='text-end text-muted mt-1' style={{ fontSize: '0.75rem' }}>
								{name.length}/100
							</div>
						</div>

						{/* PLAN TYPE ID (OPTIONAL) */}
						<div className='col-12 col-md-6'>
							<label htmlFor='planTypeIdInput' className='form-label fw-semibold small mb-1'>
								Plan Type ID <span className='text-muted fw-normal'>(Optional)</span>
							</label>
							<input
								id='planTypeIdInput'
								type='number'
								min='0'
								className='form-control role-name-input'
								placeholder='e.g. 1, 2, 10'
								value={planTypeId}
								onChange={(e) => setPlanTypeId(e.target.value)}
								style={{
									height: '42px',
									borderRadius: '0.5rem',
									border: '1px solid #cbd5e1',
									fontSize: '0.9rem',
								}}
							/>
						</div>

						{/* STATUS DROPDOWN */}
						<div className='col-12 col-md-6'>
							<label htmlFor='planTypeStatusSelect' className='form-label fw-semibold small mb-1'>
								Status <span className='text-danger'>*</span>
							</label>
							<select
								id='planTypeStatusSelect'
								className='form-select role-name-input'
								value={status}
								onChange={(e) => setStatus(e.target.value as MobilePlanTypeStatusType)}
								style={{
									height: '42px',
									borderRadius: '0.5rem',
									border: '1px solid #cbd5e1',
									fontSize: '0.9rem',
								}}>
								{statusOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</ModalBody>
				<ModalFooter className='px-4 py-3 border-top-0'>
					<Button
						type='button'
						color='light'
						className='px-4 py-2'
						onClick={() => setIsOpen(false)}
						isDisable={isSubmitting}>
						Cancel
					</Button>
					<Button
						type='submit'
						color='primary'
						className='px-4 py-2 d-inline-flex align-items-center gap-2'
						isDisable={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner isSmall inButton isGrow className='me-1' />
								{isEdit ? 'Saving Changes...' : 'Creating Plan Type...'}
							</>
						) : (
							<>
								<Icon icon='Save' />
								{isEdit ? 'Save Changes' : 'Create Plan Type'}
							</>
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

MobilePlanTypeModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	// eslint-disable-next-line react/forbid-prop-types
	planTypeData: PropTypes.any,
	onSubmit: PropTypes.func.isRequired,
	isSubmitting: PropTypes.bool.isRequired,
};

MobilePlanTypeModal.defaultProps = {
	planTypeData: null,
};

export default MobilePlanTypeModal;
