/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props */
/* eslint-disable no-nested-ternary */
import React, { FC, useState } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../../../../components/bootstrap/Modal';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../components/icon/Icon';
import showNotification from '../../../../../components/extras/showNotification';
import userService from '../service/userService';
import './SendCredentialsModal.scss';

export interface ISendCredentialsModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	user: {
		id: number | string;
		name?: string;
		username?: string;
		email?: string;
		email_address?: string;
		status?: string;
	} | null;
	onSuccess?: () => void;
}

export const SendCredentialsModal: FC<ISendCredentialsModalProps> = ({
	isOpen,
	setIsOpen,
	user,
	onSuccess,
}) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

	if (!user) return null;

	const targetEmail = user.email_address || user.email || '';
	const isInactive = (user.status || '').toLowerCase() === 'inactive';

	const handleClose = () => {
		if (isLoading) return;
		setIsOpen(false);
	};

	const userInitials = (user.name || 'U')
		.split(' ')
		.map((n) => n[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

	const handleSendCredentials = async () => {
		if (!user) return;

		if (!isInactive) {
			showNotification(
				'Invalid Operation',
				'Credentials can only be sent to inactive user accounts.',
				'warning',
			);
			return;
		}

		setIsLoading(true);
		try {
			const res = await userService.sendCredentials(user.id);
			const successMsg =
				res?.message ||
				`Credentials generated and emailed to ${targetEmail || user.name || 'user'} successfully.`;
			showNotification('Success', successMsg, 'success');
			setIsOpen(false);
			if (onSuccess) {
				onSuccess();
			}
		} catch (error: any) {
			const errorMsg =
				error?.data?.message ||
				error?.message ||
				'Failed to generate and send credentials. Please try again.';
			showNotification('Error', errorMsg, 'danger');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			isCentered
			isStaticBackdrop={isLoading}
			className="send-credentials-modal">
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id="send-credentials-modal-title">
					<div className="d-flex align-items-center gap-3">
						<div className="header-mail-badge">
							<Icon icon="Email" size="lg" />
						</div>
						<div>
							<h5 className="fw-bold mb-0 text-dark">Send User Credentials</h5>
							<span className="text-muted small">Auto-generate password & dispatch welcome email</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<div className="p-1">
					<p className="text-secondary mb-3 small" style={{ lineHeight: '1.55' }}>
						The backend will securely generate a new temporary password, update the database record, and
						dispatch an official welcome email directly to the recipient below:
					</p>

					{/* DISPATCH PREVIEW CARD */}
					<div className="dispatch-preview-card mb-3">
						<div className="card-header-bar">
							<span className="tag-title">Email Dispatch Target</span>
							<span
								className={`badge ${
									isInactive ? 'bg-warning text-dark' : 'bg-success text-white'
								} px-2 py-1 text-uppercase`}
								style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
								{user.status || 'unknown'} Account
							</span>
						</div>
						<div className="card-content-body">
							<div className="recipient-row">
								<div className="user-avatar-circle">{userInitials}</div>
								<div className="user-details">
									<div className="user-name">{user.name || 'Unnamed User'}</div>
									<div className="user-email-chip">
										<Icon icon="AlternateEmail" size="sm" />
										<span>{targetEmail || 'No email specified'}</span>
									</div>
								</div>
							</div>

							<div className="security-note">
								<Icon icon="VerifiedUser" className="note-icon" size="sm" />
								<div>
									<strong>Security Notice:</strong> The generated password is encrypted before
									storage. The user will receive secure instructions to change their password on
									first login.
								</div>
							</div>
						</div>
					</div>

					{!isInactive && (
						<div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-0 rounded-3">
							<Icon icon="Warning" />
							<span>
								This account is currently marked as <strong>{user.status}</strong>. Credentials can
								only be dispatched to <strong>inactive</strong> accounts.
							</span>
						</div>
					)}
				</div>
			</ModalBody>
			<ModalFooter>
				<button
					type="button"
					className="btn-cancel"
					disabled={isLoading}
					onClick={handleClose}>
					Cancel
				</button>
				<button
					type="button"
					className="btn-send"
					disabled={isLoading || !isInactive}
					onClick={handleSendCredentials}>
					{isLoading ? (
						<>
							<Spinner isSmall inButton isGrow />
							<span>Dispatching Credentials...</span>
						</>
					) : (
						<>
							<Icon icon="Send" size="sm" />
							<span>Send Credentials Now</span>
						</>
					)}
				</button>
			</ModalFooter>
		</Modal>
	);
};

export default SendCredentialsModal;
