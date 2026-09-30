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
import { IState, StateStatusType } from './type/state-type';
import constantService, { IConstantOption } from '../../../../services/constantService';

interface IStateModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	stateData?: IState | null;
	onSubmit: (values: { name: string; circle_id: number | null; status: StateStatusType }) => Promise<void>;
	isSubmitting: boolean;
}

export const StateModal: FC<IStateModalProps> = ({
	isOpen,
	setIsOpen,
	stateData,
	onSubmit,
	isSubmitting,
}) => {
	const isEdit = Boolean(stateData);
	const [name, setName] = useState<string>('');
	const [circleId, setCircleId] = useState<string>('');
	const [status, setStatus] = useState<StateStatusType>('active');

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
		if (stateData) {
			setName(stateData.name || '');
			setCircleId(
				stateData.circle_id !== null && stateData.circle_id !== undefined
					? String(stateData.circle_id)
					: '',
			);
			setStatus(stateData.status || 'active');
		} else {
			setName('');
			setCircleId('');
			setStatus('active');
		}
	}, [stateData, isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			showNotification('Validation Error', 'State name is required', 'warning');
			return;
		}

		const parsedCircleId = circleId.trim() !== '' ? Number(circleId) : null;
		if (parsedCircleId !== null && (Number.isNaN(parsedCircleId) || parsedCircleId < 0)) {
			showNotification('Validation Error', 'Circle ID must be a valid positive number', 'warning');
			return;
		}

		await onSubmit({
			name: name.trim(),
			circle_id: parsedCircleId,
			status,
		});
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size="lg">
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id="state-modal-title">
					<div className="d-flex align-items-center gap-2">
						<Icon icon={isEdit ? 'Edit' : 'AddLocation'} color="primary" />
						<span className="fw-bold">{isEdit ? 'Edit State' : 'Add New State'}</span>
					</div>
				</ModalTitle>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody className="p-4">
					<div className="row g-3">
						{/* STATE NAME */}
						<div className="col-12">
							<label htmlFor="stateNameInput" className="form-label fw-bold small mb-1">
								State Name <span className="text-danger">*</span>
							</label>
							<input
								id="stateNameInput"
								type="text"
								className="form-control role-name-input"
								placeholder="e.g. Maharashtra, Gujarat"
								value={name}
								onChange={(e) => setName(e.target.value)}
								style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
								required
							/>
						</div>

						{/* CIRCLE ID */}
						<div className="col-12 col-md-6">
							<label htmlFor="circleIdInput" className="form-label fw-bold small mb-1">
								Circle ID <span className="text-muted fw-normal">(Optional)</span>
							</label>
							<input
								id="circleIdInput"
								type="number"
								min="0"
								className="form-control role-name-input"
								placeholder="e.g. 10, 12"
								value={circleId}
								onChange={(e) => setCircleId(e.target.value)}
								style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
							/>
						</div>

						{/* DYNAMIC STATUS SELECT */}
						<div className="col-12 col-md-6">
							<label htmlFor="stateStatusSelect" className="form-label fw-bold small mb-1">
								Status
							</label>
							<select
								id="stateStatusSelect"
								className="form-select role-name-input"
								value={status}
								onChange={(e) => setStatus(e.target.value as StateStatusType)}
								style={{ height: '38px', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
								{statusOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</ModalBody>
				<ModalFooter className="px-4 py-3">
					<Button
						type="button"
						color="light"
						onClick={() => setIsOpen(false)}
						isDisable={isSubmitting}>
						Cancel
					</Button>
					<Button type="submit" color="primary" isDisable={isSubmitting}>
						{isSubmitting ? (
							<>
								<Spinner isSmall inButton isGrow className="me-2" />
								Saving...
							</>
						) : (
							<>
								<Icon icon="Save" className="me-1" />
								{isEdit ? 'Save Changes' : 'Create State'}
							</>
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

StateModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	// eslint-disable-next-line react/forbid-prop-types
	stateData: PropTypes.any,
	onSubmit: PropTypes.func.isRequired,
	isSubmitting: PropTypes.bool.isRequired,
};

StateModal.defaultProps = {
	stateData: null,
};

export default StateModal;
