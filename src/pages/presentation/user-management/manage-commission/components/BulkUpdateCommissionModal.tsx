/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useState } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../../../../components/bootstrap/Modal';
import Button from '../../../../../components/bootstrap/Button';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../components/icon/Icon';
import showNotification from '../../../../../components/extras/showNotification';
import operatorCommissionService from '../service/operatorCommissionService';
import { ICategorySummaryItem, TCommissionType } from '../type/operator-commission-type';

interface IBulkUpdateCommissionModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	adminId: number | string;
	categories: ICategorySummaryItem[];
	onSuccess: () => void;
}

export const BulkUpdateCommissionModal: FC<IBulkUpdateCommissionModalProps> = ({
	isOpen,
	setIsOpen,
	adminId,
	categories,
	onSuccess,
}) => {
	const validCategories = categories.filter((c) => c.id !== null);

	const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
		validCategories.length > 0 && validCategories[0].id !== null
			? String(validCategories[0].id)
			: '',
	);
	const [commissionType, setCommissionType] = useState<TCommissionType>('FLAT');
	const [commissionValue, setCommissionValue] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [error, setError] = useState<string>('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!selectedCategoryId) {
			setError('Please select a service category.');
			return;
		}

		const numVal = parseFloat(commissionValue);
		if (isNaN(numVal) || numVal < 0) {
			setError('Please enter a valid commission value (0 or greater).');
			return;
		}

		if (commissionType === 'PERCENTAGE' && numVal > 100) {
			setError('Percentage commission cannot exceed 100%.');
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await operatorCommissionService.bulkCategoryUpdate({
				admin_id: Number(adminId),
				service_category_id: Number(selectedCategoryId),
				commission_type: commissionType,
				commission_value: numVal,
			});

			showNotification(
				'Bulk Update Successful',
				res?.message || 'Category commission updated successfully.',
				'success',
			);
			setIsOpen(false);
			setCommissionValue('');
			onSuccess();
		} catch (err: any) {
			setError(err?.data?.message || err?.message || 'Failed to update category commission.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id='bulkUpdateCommissionModalTitle'>
					<div className='d-flex align-items-center gap-2'>
						<div
							className='rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center'
							style={{ width: '36px', height: '36px' }}>
							<Icon icon='Tune' size='sm' />
						</div>
						<div>
							<div className='fw-bold text-dark fs-6'>Bulk Update Category Commission</div>
							<div className='text-muted small fw-normal' style={{ fontSize: '0.75rem' }}>
								Apply uniform commission rates to all operators in a selected category
							</div>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<form onSubmit={handleSubmit}>
				<ModalBody>
					{error && (
						<div className='alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3'>
							<Icon icon='ErrorOutline' size='sm' />
							<span>{error}</span>
						</div>
					)}

					<div className='row g-3'>
						{/* SERVICE CATEGORY */}
						<div className='col-12'>
							<label htmlFor='bulkCategorySelect' className='form-label fw-semibold small mb-1'>
								Select Service Category <span className='text-danger'>*</span>
							</label>
							<select
								id='bulkCategorySelect'
								className='form-select'
								value={selectedCategoryId}
								onChange={(e) => setSelectedCategoryId(e.target.value)}
								required>
								<option value=''>-- Select Category --</option>
								{validCategories.map((cat) => (
									<option key={cat.id} value={String(cat.id)}>
										{cat.name} ({cat.count} Operators)
									</option>
								))}
							</select>
						</div>

						{/* COMMISSION TYPE */}
						<div className='col-12 col-md-6'>
							<label className='form-label fw-semibold small mb-1'>
								Commission Type <span className='text-danger'>*</span>
							</label>
							<div className='btn-group w-100' role='group'>
								<button
									type='button'
									className={`btn ${
										commissionType === 'PERCENTAGE'
											? 'btn-primary text-white shadow-none'
											: 'btn-outline-light text-dark'
									}`}
									style={{
										border: '1px solid #cbd5e1',
										fontWeight: 600,
										fontSize: '0.85rem',
									}}
									onClick={() => setCommissionType('PERCENTAGE')}>
									<Icon icon='Percent' size='sm' className='me-1' />
									Percentage (%)
								</button>
								<button
									type='button'
									className={`btn ${
										commissionType === 'FLAT'
											? 'btn-primary text-white shadow-none'
											: 'btn-outline-light text-dark'
									}`}
									style={{
										border: '1px solid #cbd5e1',
										fontWeight: 600,
										fontSize: '0.85rem',
									}}
									onClick={() => setCommissionType('FLAT')}>
									<span className='me-1 fw-bold'>₹</span>
									Flat Amount (₹)
								</button>
							</div>
						</div>

						{/* COMMISSION VALUE */}
						<div className='col-12 col-md-6'>
							<label htmlFor='bulkCommissionValueInput' className='form-label fw-semibold small mb-1'>
								Commission Rate ({commissionType === 'PERCENTAGE' ? '%' : '₹'}){' '}
								<span className='text-danger'>*</span>
							</label>
							<div className='input-group'>
								{commissionType === 'FLAT' && (
									<span className='input-group-text bg-light text-muted fw-bold'>₹</span>
								)}
								<input
									id='bulkCommissionValueInput'
									type='number'
									step='0.01'
									min='0'
									max={commissionType === 'PERCENTAGE' ? 100 : undefined}
									className='form-control'
									placeholder={commissionType === 'PERCENTAGE' ? 'e.g. 2.50' : 'e.g. 3.00'}
									value={commissionValue}
									onChange={(e) => setCommissionValue(e.target.value)}
									required
								/>
								{commissionType === 'PERCENTAGE' && (
									<span className='input-group-text bg-light text-muted fw-bold'>%</span>
								)}
							</div>
						</div>

						{/* PREVIEW BANNER */}
						{commissionValue && !isNaN(parseFloat(commissionValue)) && (
							<div className='col-12'>
								<div
									className='p-3 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2'
									style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
									<div className='d-flex align-items-center gap-2'>
										<Icon icon='Visibility' size='sm' className='text-primary' />
										<span className='small fw-semibold text-dark'>Estimated Earning Example:</span>
									</div>
									<div className='small font-monospace fw-bold text-success'>
										₹100 txn →{' '}
										{commissionType === 'PERCENTAGE'
											? `₹${((100 * parseFloat(commissionValue)) / 100).toFixed(2)}`
											: `₹${parseFloat(commissionValue).toFixed(2)}`}
									</div>
								</div>
							</div>
						)}
					</div>
				</ModalBody>

				<ModalFooter>
					<Button
						type='button'
						color='light'
						className='border'
						onClick={() => setIsOpen(false)}
						isDisable={isSubmitting}>
						Cancel
					</Button>
					<Button
						type='submit'
						color='primary'
						className='d-inline-flex align-items-center gap-2'
						isDisable={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner size='sm' isGrow={false} />
								<span>Updating...</span>
							</>
						) : (
							<>
								<Icon icon='Check' size='sm' />
								<span>Apply to All Operators</span>
							</>
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default BulkUpdateCommissionModal;
