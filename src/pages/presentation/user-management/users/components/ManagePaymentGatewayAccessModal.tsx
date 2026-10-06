/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props */
import React, { FC } from 'react';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../../../../components/bootstrap/Modal';
import Icon from '../../../../../components/icon/Icon';
import PaymentGatewayAccessManager from './PaymentGatewayAccessManager';

export interface IManagePaymentGatewayAccessModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	user: {
		id: number | string;
		name: string;
		username: string;
	} | null;
	onSuccess?: () => void;
}

export const ManagePaymentGatewayAccessModal: FC<IManagePaymentGatewayAccessModalProps> = ({
	isOpen,
	setIsOpen,
	user,
	onSuccess,
}) => {
	if (!isOpen || !user) return null;

	const modalTitle = `Payment Gateway Access - ${user.name} (@${user.username})`;

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			size="xl"
			isCentered
			isScrollable
			isStaticBackdrop>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id="manage-gateway-access-title">
					<div className="d-flex align-items-center gap-2">
						<Icon icon="AccountBalanceWallet" color="primary" />
						<span className="fw-bold">{modalTitle}</span>
					</div>
				</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<div className="p-1">
					<PaymentGatewayAccessManager
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

export default ManagePaymentGatewayAccessModal;
