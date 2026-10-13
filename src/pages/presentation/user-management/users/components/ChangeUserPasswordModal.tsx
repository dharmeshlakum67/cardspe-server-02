/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props */
/* eslint-disable no-nested-ternary */
import React, { FC, useEffect, useState, useMemo } from 'react';
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
import './ChangeUserPasswordModal.scss';

export interface IChangeUserPasswordModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	user: {
		id: number | string;
		name?: string;
		username?: string;
		email?: string;
		email_address?: string;
	} | null;
	onSuccess?: () => void;
}

export const ChangeUserPasswordModal: FC<IChangeUserPasswordModalProps> = ({
	isOpen,
	setIsOpen,
	user,
	onSuccess,
}) => {
	const [password, setPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [errorText, setErrorText] = useState<string>('');
	const [copiedKey, setCopiedKey] = useState<boolean>(false);

	// RESET STATE ON OPEN
	useEffect(() => {
		if (isOpen) {
			setPassword('');
			setConfirmPassword('');
			setShowPassword(false);
			setShowConfirmPassword(false);
			setIsLoading(false);
			setErrorText('');
			setCopiedKey(false);
		}
	}, [isOpen]);

	// PASSWORD STRENGTH CALCULATION
	const strength = useMemo(() => {
		if (!password) return { level: 0, text: '', colorClass: '', textColorClass: '' };
		if (password.length < 6) {
			return {
				level: 1,
				text: 'Too short (min 6)',
				colorClass: 'weak',
				textColorClass: 'text-danger',
			};
		}

		let score = 0;
		if (password.length >= 8) score += 1;
		if (/[A-Z]/.test(password)) score += 1;
		if (/[0-9]/.test(password)) score += 1;
		if (/[^A-Za-z0-9]/.test(password)) score += 1;

		if (score >= 3) {
			return {
				level: 3,
				text: 'Strong password',
				colorClass: 'strong',
				textColorClass: 'text-success',
			};
		}
		if (score >= 1) {
			return {
				level: 2,
				text: 'Medium strength',
				colorClass: 'medium',
				textColorClass: 'text-warning',
			};
		}
		return {
			level: 1,
			text: 'Weak password',
			colorClass: 'weak',
			textColorClass: 'text-danger',
		};
	}, [password]);

	// PASSWORDS MATCH STATUS
	const matchStatus = useMemo(() => {
		if (!confirmPassword) return null;
		if (password === confirmPassword) return { match: true, text: 'Passwords match' };
		return { match: false, text: 'Passwords do not match' };
	}, [password, confirmPassword]);

	// FAST RANDOM PASSWORD GENERATOR
	const handleGeneratePassword = () => {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
		let generated = '';
		for (let i = 0; i < 12; i += 1) {
			generated += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		setPassword(generated);
		setConfirmPassword(generated);
		setShowPassword(true);
		setShowConfirmPassword(true);
		setErrorText('');
		setCopiedKey(false);

		// Copy to clipboard
		if (navigator?.clipboard?.writeText) {
			navigator.clipboard.writeText(generated);
			setCopiedKey(true);
			setTimeout(() => setCopiedKey(false), 2500);
			showNotification('Generated & Copied', 'Random secure password copied to clipboard!', 'info');
		}
	};

	if (!user) return null;

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

	const handleSubmit = async () => {
		if (!user) return;

		setErrorText('');

		if (!password.trim()) {
			setErrorText('Password is required.');
			showNotification('Validation Error', 'Password is required.', 'warning');
			return;
		}

		if (password.length < 6) {
			setErrorText('Password must be at least 6 characters long.');
			showNotification(
				'Validation Error',
				'Password must be at least 6 characters long.',
				'warning',
			);
			return;
		}

		if (password !== confirmPassword) {
			setErrorText('Passwords do not match.');
			showNotification('Validation Error', 'Passwords do not match.', 'warning');
			return;
		}

		setIsLoading(true);
		try {
			const res = await userService.changeUserPassword(user.id, {
				password: password.trim(),
				confirm_password: confirmPassword.trim(),
			});

			const successMessage = res?.message || 'User password changed successfully.';
			showNotification('Success', successMessage, 'success');
			setIsOpen(false);
			if (onSuccess) {
				onSuccess();
			}
		} catch (error: any) {
			const errMsg =
				error?.data?.message ||
				error?.message ||
				'Failed to change user password. Please try again.';
			setErrorText(errMsg);
			showNotification('Error', errMsg, 'danger');
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
			className="change-password-modal">
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id="change-password-modal-title">
					<div className="d-flex align-items-center gap-3">
						<div className="header-icon-badge">
							<Icon icon="VpnKey" size="lg" />
						</div>
						<div>
							<h5 className="fw-bold mb-0 text-dark">Change User Password</h5>
							<span className="text-muted small">Update administrative login credentials</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<div className="p-1">
					{/* TARGET USER INFORMATION CARD */}
					<div className="user-target-card mb-3">
						<div className="d-flex align-items-center gap-3">
							<div className="user-avatar-initials">{userInitials}</div>
							<div>
								<div className="user-meta-name">{user.name || 'User'}</div>
								<div className="user-meta-sub">
									{user.username && <span className="font-monospace">@{user.username}</span>}
									{user.username && (user.email_address || user.email) && ' • '}
									<span>{user.email_address || user.email}</span>
								</div>
							</div>
						</div>
						<button
							type="button"
							className="generator-btn"
							title="Generate and auto-fill a secure random password"
							onClick={handleGeneratePassword}>
							<Icon icon="AutoFixHigh" size="sm" />
							<span>{copiedKey ? 'Copied!' : 'Suggest Password'}</span>
						</button>
					</div>

					{errorText && (
						<div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3">
							<Icon icon="Error" />
							<span>{errorText}</span>
						</div>
					)}

					{/* NEW PASSWORD INPUT */}
					<div className="mb-3">
						<div className="d-flex align-items-center justify-content-between mb-1">
							<label htmlFor="changeUserNewPassword" className="form-label fw-semibold text-dark mb-0 small">
								New Password <span className="text-danger">*</span>
							</label>
							{strength.text && (
								<span className={`small fw-semibold ${strength.textColorClass}`}>
									{strength.text}
								</span>
							)}
						</div>
						<div className="modern-password-field">
							<span className="input-prefix-icon">
								<Icon icon="Lock" size="sm" />
							</span>
							<input
								id="changeUserNewPassword"
								type={showPassword ? 'text' : 'password'}
								className={`custom-password-input form-control ${
									strength.level === 1 && password.length > 0 ? 'input-error' : ''
								} ${strength.level === 3 ? 'input-success' : ''}`}
								placeholder="Enter new password (min. 6 characters)"
								value={password}
								onChange={(e) => {
									setPassword(e.target.value);
									if (errorText) setErrorText('');
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleSubmit();
								}}
								autoComplete="new-password"
								required
							/>
							<button
								type="button"
								tabIndex={-1}
								className="input-toggle-btn"
								aria-label="Toggle password visibility"
								onClick={() => setShowPassword((prev) => !prev)}>
								<Icon icon={showPassword ? 'VisibilityOff' : 'Visibility'} size="sm" />
							</button>
						</div>

						{/* DYNAMIC STRENGTH METER BAR */}
						{password.length > 0 && (
							<div className="strength-meter-wrapper">
								<div className="strength-track">
									<div className={`strength-bar ${strength.colorClass}`} />
								</div>
							</div>
						)}
					</div>

					{/* CONFIRM PASSWORD INPUT */}
					<div className="mb-2">
						<div className="d-flex align-items-center justify-content-between mb-1">
							<label
								htmlFor="changeUserConfirmPassword"
								className="form-label fw-semibold text-dark mb-0 small">
								Confirm New Password <span className="text-danger">*</span>
							</label>
							{matchStatus && (
								<span
									className={`small fw-semibold ${
										matchStatus.match ? 'text-success' : 'text-danger'
									}`}>
									<Icon icon={matchStatus.match ? 'Check' : 'Close'} size="sm" />
									<span className="ms-1">{matchStatus.text}</span>
								</span>
							)}
						</div>
						<div className="modern-password-field">
							<span className="input-prefix-icon">
								<Icon icon="Key" size="sm" />
							</span>
							<input
								id="changeUserConfirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								className={`custom-password-input form-control ${
									matchStatus && !matchStatus.match ? 'input-error' : ''
								} ${matchStatus && matchStatus.match ? 'input-success' : ''}`}
								placeholder="Re-enter password to confirm"
								value={confirmPassword}
								onChange={(e) => {
									setConfirmPassword(e.target.value);
									if (errorText) setErrorText('');
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleSubmit();
								}}
								autoComplete="new-password"
								required
							/>
							<button
								type="button"
								tabIndex={-1}
								className="input-toggle-btn"
								aria-label="Toggle confirm password visibility"
								onClick={() => setShowConfirmPassword((prev) => !prev)}>
								<Icon icon={showConfirmPassword ? 'VisibilityOff' : 'Visibility'} size="sm" />
							</button>
						</div>
					</div>
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
					className="btn-submit"
					disabled={
						isLoading ||
						password.length < 6 ||
						!confirmPassword.trim() ||
						password !== confirmPassword
					}
					onClick={handleSubmit}>
					{isLoading ? (
						<>
							<Spinner isSmall inButton isGrow />
							<span>Updating Password...</span>
						</>
					) : (
						<>
							<Icon icon="CheckCircle" size="sm" />
							<span>Save New Password</span>
						</>
					)}
				</button>
			</ModalFooter>
		</Modal>
	);
};

export default ChangeUserPasswordModal;
