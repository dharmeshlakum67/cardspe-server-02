/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props */
import React, { FC } from 'react';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../../../../components/bootstrap/Modal';
import ServiceAccessManager from './ServiceAccessManager';

export interface IManageServiceAccessModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	user: {
		id: number | string;
		name: string;
		username: string;
	} | null;
	onSuccess?: () => void;
}

export const ManageServiceAccessModal: FC<IManageServiceAccessModalProps> = ({
	isOpen,
	setIsOpen,
	user,
	onSuccess,
}) => {
	if (!isOpen || !user) return null;

	const modalTitle = `Manage Service Access - ${user.name} (@${user.username})`;

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			size="xl"
			isScrollable
			isStaticBackdrop>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id="manage-service-access-title">
					<div className="d-flex align-items-center gap-2">
						<span className="fw-bold">{modalTitle}</span>
					</div>
				</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<div className="p-1">
					<ServiceAccessManager
						userId={user.id}
						userName={user.name}
						username={user.username}
						isModal
						onCloseModal={() => setIsOpen(false)}
						onSaveSuccess={() => {
							if (onSuccess) onSuccess();
						}}
					/>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default ManageServiceAccessModal;
