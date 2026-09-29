import React, { FC, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Icon from '../../icon/Icon';
import Spinner from '../../bootstrap/Spinner';
import './ConfirmationModal.scss';

export interface IConfirmationModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	title?: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => Promise<void> | void;
	onCancel?: () => void;
	isLoading?: boolean;
}

export const ConfirmationModal: FC<IConfirmationModalProps> = ({
	isOpen,
	setIsOpen,
	title = 'Confirmation Alert!',
	message = 'Are you sure to remove this item ?',
	confirmText = 'Yes',
	cancelText = 'No',
	onConfirm,
	onCancel,
	isLoading = false,
}) => {
	const [selectedAction, setSelectedAction] = useState<'confirm' | 'cancel'>('confirm');

	// RESET SELECTED ACTION TO CONFIRM ON MODAL OPEN
	useEffect(() => {
		if (isOpen) {
			setSelectedAction('confirm');
		}
	}, [isOpen]);

	const handleClose = () => {
		if (isLoading) return;
		if (onCancel) onCancel();
		setIsOpen(false);
	};

	const handleConfirm = async () => {
		await onConfirm();
	};

	// KEYBOARD NAVIGATION (TAB / ARROWS TO SWITCH BETWEEN CANCEL AND CONFIRM, ENTER TO SUBMIT)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen || isLoading) return;

			if (
				e.key === 'Tab' ||
				e.key === 'ArrowLeft' ||
				e.key === 'ArrowRight' ||
				e.key === 'ArrowUp' ||
				e.key === 'ArrowDown'
			) {
				e.preventDefault();
				setSelectedAction((prev: 'confirm' | 'cancel') => (prev === 'confirm' ? 'cancel' : 'confirm'));
			} else if (e.key === 'Enter') {
				e.preventDefault();
				if (selectedAction === 'confirm') {
					handleConfirm();
				} else {
					handleClose();
				}
			} else if (e.key === 'Escape') {
				e.preventDefault();
				handleClose();
			}
		};

		if (isOpen) {
			window.addEventListener('keydown', handleKeyDown);
		}
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, isLoading, selectedAction]);

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			isCentered
			className='confirmation-alert-modal'
			isStaticBackdrop={isLoading}>
			{/* MODAL HEADER */}
			<ModalHeader className='confirmation-modal-header'>
				<ModalTitle id='confirmation-modal-title' className='confirmation-modal-title'>
					{title}
				</ModalTitle>
				<button
					type='button'
					className='btn-modal-close'
					aria-label='Close'
					disabled={isLoading}
					onClick={handleClose}>
					<Icon icon='Close' size='sm' />
				</button>
			</ModalHeader>

			{/* MODAL BODY */}
			<ModalBody className='confirmation-modal-body'>
				<p className='confirmation-message-text'>{message}</p>
			</ModalBody>

			{/* MODAL FOOTER */}
			<ModalFooter className='confirmation-modal-footer'>
				{/* CANCEL / NO BUTTON */}
				<button
					type='button'
					className={`btn-confirm-cancel ${selectedAction === 'cancel' ? 'is-focused' : ''}`}
					disabled={isLoading}
					onClick={handleClose}>
					<Icon icon='Close' size='sm' />
					<span>{cancelText}</span>
				</button>

				{/* CONFIRM / YES BUTTON */}
				<button
					type='button'
					className={`btn-confirm-accept ${selectedAction === 'confirm' ? 'is-focused' : ''}`}
					disabled={isLoading}
					onClick={handleConfirm}>
					{isLoading ? (
						<>
							<Spinner size='sm' isGrow={false} />
							<span>Removing...</span>
						</>
					) : (
						<>
							<Icon icon='Check' size='sm' />
							<span>{confirmText}</span>
						</>
					)}
				</button>
			</ModalFooter>
		</Modal>
	);
};

ConfirmationModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	title: PropTypes.string,
	message: PropTypes.string,
	confirmText: PropTypes.string,
	cancelText: PropTypes.string,
	onConfirm: PropTypes.func.isRequired,
	onCancel: PropTypes.func,
	isLoading: PropTypes.bool,
};

ConfirmationModal.defaultProps = {
	title: 'Confirmation Alert!',
	message: 'Are you sure to remove this item ?',
	confirmText: 'Yes',
	cancelText: 'No',
	onCancel: undefined,
	isLoading: false,
};

export default ConfirmationModal;
