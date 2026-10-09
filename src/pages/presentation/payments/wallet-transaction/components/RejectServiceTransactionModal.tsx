/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props */
import React, { FC, useState, useEffect } from 'react';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Button from '../../../../../components/bootstrap/Button';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../components/icon/Icon';
import showNotification from '../../../../../components/extras/showNotification';
import walletTransactionService from '../service/walletTransactionService';
import { IWalletTransaction } from '../type/wallet-transaction.type';

interface IRejectServiceTransactionModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	transaction: IWalletTransaction | null;
	onSuccess: () => void;
}

export const RejectServiceTransactionModal: FC<IRejectServiceTransactionModalProps> = ({
	isOpen,
	setIsOpen,
	transaction,
	onSuccess,
}) => {
	const [rejectionReason, setRejectionReason] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	useEffect(() => {
		if (isOpen) {
			setRejectionReason('');
			setIsSubmitting(false);
		}
	}, [isOpen]);

	if (!transaction) return null;

	const handleReject = async () => {
		try {
			setIsSubmitting(true);
			const res = await walletTransactionService.rejectServiceTransaction(
				transaction.id,
				rejectionReason.trim() || undefined,
			);

			const message = res.message || 'Transaction rejected successfully. Amount has been refunded.';
			showNotification('Rejected', message, 'danger');

			setIsOpen(false);
			onSuccess();
		} catch (error: any) {
			const errorData = error?.response?.data || error?.data;
			const msg = errorData?.message || error?.message || 'Could not reject service payment.';
			showNotification('Error', msg, 'danger');

			if (error?.response?.status === 400 || error?.response?.status === 409) {
				onSuccess();
			}
			setIsOpen(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatINR = (val: string | number | undefined) => {
		if (val === undefined || val === null) return '₹0.00';
		const num = Number(val);
		return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const merchantName =
		transaction.admin?.name ||
		transaction.user?.name ||
		transaction.admin?.username ||
		`User #${transaction.admin_id}`;

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg'>
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom pb-3'>
				<ModalTitle id='reject-service-tx-modal-title'>
					<div className='d-flex align-items-center gap-2'>
						<div
							className='d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger'
							style={{ width: '36px', height: '36px' }}>
							<Icon icon='Cancel' size='lg' />
						</div>
						<div className='d-flex flex-column'>
							<span className='fw-bold text-dark fs-5'>Reject Service Payment</span>
							<span className='text-muted small' style={{ fontSize: '0.78rem' }}>
								Decline service payment request & refund amount to user wallet
							</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody className='py-3'>
				<div className='d-flex flex-column gap-3'>
					{/* ALERT BANNER */}
					<div className='alert alert-danger py-2 px-3 mb-0 d-flex align-items-center gap-2 rounded-3'>
						<Icon icon='Warning' size='lg' className='flex-shrink-0' />
						<span className='small'>
							Rejecting this transaction will mark it as failed and return the debited amount of{' '}
							<strong>{formatINR(transaction.payable_amount || transaction.amount)}</strong> back to the user&apos;s wallet.
						</span>
					</div>

					{/* SUMMARY CARD */}
					<div className='p-3 bg-light rounded-3 border'>
						<div className='row g-3'>
							<div className='col-12 col-sm-6'>
								<span className='text-muted small d-block'>Order ID</span>
								<span className='fw-bold text-dark font-monospace'>
									{transaction.order_id || '-'}
								</span>
							</div>
							<div className='col-12 col-sm-6'>
								<span className='text-muted small d-block'>Transaction ID</span>
								<span className='fw-semibold text-dark font-monospace'>
									{transaction.transaction_id}
								</span>
							</div>
							<div className='col-12 col-sm-6'>
								<span className='text-muted small d-block'>Merchant / User</span>
								<span className='fw-semibold text-dark'>{merchantName}</span>
							</div>
							<div className='col-12 col-sm-6'>
								<span className='text-muted small d-block'>Refund Amount</span>
								<span className='fw-bold text-danger fs-6'>
									{formatINR(transaction.payable_amount || transaction.amount)}
								</span>
							</div>
						</div>
					</div>

					{/* REJECTION REASON INPUT */}
					<div>
						<label htmlFor='rejectReasonInput' className='form-label small fw-semibold text-dark mb-1'>
							Rejection Reason <span className='text-muted fw-normal'>(Optional)</span>
						</label>
						<input
							id='rejectReasonInput'
							type='text'
							className='form-control'
							placeholder='e.g. Wrong connection number or biller unavailable'
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							disabled={isSubmitting}
							style={{
								height: '42px',
								borderRadius: '0.5rem',
								border: '1px solid #cbd5e1',
								fontSize: '0.9rem',
							}}
						/>
						<span className='text-muted small d-block mt-1' style={{ fontSize: '0.75rem' }}>
							Optional reason explaining why this payment was declined.
						</span>
					</div>
				</div>
			</ModalBody>

			<ModalFooter className='border-top pt-3'>
				<Button
					type='button'
					color='light'
					className='border'
					onClick={() => setIsOpen(false)}
					isDisable={isSubmitting}>
					Cancel
				</Button>
				<Button
					type='button'
					color='danger'
					className='d-inline-flex align-items-center gap-2'
					onClick={handleReject}
					isDisable={isSubmitting}>
					{isSubmitting ? (
						<>
							<Spinner isSmall inButton />
							<span>Rejecting...</span>
						</>
					) : (
						<>
							<Icon icon='Close' />
							<span>Reject Payment</span>
						</>
					)}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

RejectServiceTransactionModal.defaultProps = {
	transaction: null,
};

export default RejectServiceTransactionModal;
