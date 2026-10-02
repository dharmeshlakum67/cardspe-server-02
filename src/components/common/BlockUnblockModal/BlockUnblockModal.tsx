/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, no-nested-ternary */
import React, { FC, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import Spinner from '../../bootstrap/Spinner';
import './BlockUnblockModal.scss';

export interface IBlockUnblockModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	action: 'block' | 'unblock';
	userName?: string;
	isLoading?: boolean;
	onConfirm: (reason: string) => Promise<void> | void;
	onCancel?: () => void;
}

export const BlockUnblockModal: FC<IBlockUnblockModalProps> = ({
	isOpen,
	setIsOpen,
	action,
	userName = '',
	isLoading = false,
	onConfirm,
	onCancel,
}) => {
	const [reason, setReason] = useState<string>('');
	const [error, setError] = useState<string>('');

	const isBlock = action === 'block';

	// RESET STATE ON OPEN / CLOSE
	useEffect(() => {
		if (isOpen) {
			setReason('');
			setError('');
		}
	}, [isOpen]);

	const handleClose = () => {
		if (isLoading) return;
		setReason('');
		setError('');
		if (onCancel) onCancel();
		setIsOpen(false);
	};

	const handleConfirm = async () => {
		if (isBlock && !reason.trim()) {
			setError('Please enter a reason for blocking this account.');
			return;
		}
		setError('');
		await onConfirm(reason.trim());
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			isCentered
			className="block-unblock-modal"
			isStaticBackdrop={isLoading}>
			{/* MODAL HEADER */}
			<ModalHeader className="border-bottom-0 pb-0 pt-4 px-4 d-flex align-items-center justify-content-between" setIsOpen={handleClose}>
				<ModalTitle id="block-unblock-modal-title" className="w-100 pe-3">
					<div className="d-flex align-items-center gap-3">
						<div
							className={`block-modal-icon-badge ${
								isBlock ? 'icon-block' : 'icon-unblock'
							}`}>
							<Icon icon={isBlock ? 'Block' : 'CheckCircle'} size="lg" />
						</div>
						<div>
							<h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.1rem' }}>
								{isBlock ? 'Block Account' : 'Unblock Account'}
							</h5>
							<span className="text-muted small" style={{ fontSize: '0.8125rem' }}>
								{userName
									? `Action for "${userName}"`
									: 'Update account access status'}
							</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			{/* MODAL BODY */}
			<ModalBody className="px-4 py-3">
				<div className="d-flex flex-column gap-3">
					<div
						className={`block-modal-warning-box d-flex align-items-start gap-2 ${
							isBlock ? 'warning-block' : 'warning-unblock'
						}`}>
						<Icon icon={isBlock ? 'Warning' : 'Info'} size="sm" className="mt-1 flex-shrink-0" />
						<div>
							{isBlock
								? 'Blocking this account will immediately revoke active login sessions and restrict access to all services.'
								: 'Unblocking this account will restore full access and allow the user to log in normally.'}
						</div>
					</div>

					<div>
						<label
							htmlFor="blockUnblockReasonInput"
							className="form-label fw-semibold small text-dark mb-1">
							{isBlock ? 'Reason / Remarks' : 'Remarks (Optional)'}{' '}
							{isBlock && <span className="text-danger">*</span>}
						</label>
						<textarea
							id="blockUnblockReasonInput"
							rows={3}
							className={`form-control ${error ? 'is-invalid' : ''}`}
							placeholder={
								isBlock
									? 'e.g. Suspicious login activity / violating terms of service'
									: 'e.g. Identity verified / account restored upon request'
							}
							value={reason}
							disabled={isLoading}
							onChange={(e) => {
								setReason(e.target.value);
								if (error) setError('');
							}}
							style={{ fontSize: '0.875rem' }}
						/>
						{error && <div className="invalid-feedback d-block mt-1">{error}</div>}
					</div>
				</div>
			</ModalBody>

			{/* MODAL FOOTER */}
			<ModalFooter className="px-4 py-3 border-top-0 d-flex justify-content-end gap-2">
				<Button
					type="button"
					color="light"
					className="px-4 py-2"
					isDisable={isLoading}
					onClick={handleClose}>
					Cancel
				</Button>
				<Button
					type="button"
					color={isBlock ? 'danger' : 'success'}
					className="px-4 py-2 d-inline-flex align-items-center gap-2"
					isDisable={isLoading}
					onClick={handleConfirm}>
					{isLoading ? (
						<>
							<Spinner isSmall inButton isGrow={false} className="me-1" />
							<span>{isBlock ? 'Blocking...' : 'Unblocking...'}</span>
						</>
					) : (
						<>
							<Icon icon={isBlock ? 'Block' : 'Check'} />
							<span>{isBlock ? 'Confirm Block' : 'Confirm Unblock'}</span>
						</>
					)}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

(BlockUnblockModal as any).propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	action: PropTypes.oneOf(['block', 'unblock']).isRequired,
	userName: PropTypes.string,
	isLoading: PropTypes.bool,
	onConfirm: PropTypes.func.isRequired,
	onCancel: PropTypes.func,
};

(BlockUnblockModal as any).defaultProps = {
	userName: '',
	isLoading: false,
	onCancel: undefined,
};

export default BlockUnblockModal;
