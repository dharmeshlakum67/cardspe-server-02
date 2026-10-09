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

interface IApproveServiceTransactionModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	transaction: IWalletTransaction | null;
	onSuccess: () => void;
}

export const ApproveServiceTransactionModal: FC<IApproveServiceTransactionModalProps> = ({
	isOpen,
	setIsOpen,
	transaction,
	onSuccess,
}) => {
	const [remark, setRemark] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	useEffect(() => {
		if (isOpen) {
			setRemark('');
			setIsSubmitting(false);
		}
	}, [isOpen]);

	if (!transaction) return null;

	const handleApprove = async () => {
		try {
			setIsSubmitting(true);
			const res = await walletTransactionService.approveServiceTransaction(
				transaction.id,
				remark.trim() || undefined,
			);

			const dataStatus = res.data?.status;
			const message = res.message || 'Transaction processed successfully.';

			if (dataStatus === 'pending' || dataStatus === 'success_pending') {
				showNotification('Processing', message, 'info');
			} else if (dataStatus === 'fail') {
				showNotification('Payment Failed', message, 'danger');
			} else {
				showNotification('Success', message, 'success');
			}

			setIsOpen(false);
			onSuccess();
		} catch (error: any) {
			const errorData = error?.response?.data || error?.data;
			const msg = errorData?.message || error?.message || 'Could not approve service payment.';
			showNotification('Error', msg, 'danger');

			if (
				error?.response?.status === 400 ||
				error?.response?.status === 409 ||
				errorData?.data?.status === 'fail'
			) {
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
				<ModalTitle id='approve-service-tx-modal-title'>
					<div className='d-flex align-items-center gap-2'>
						<div
							className='d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success'
							style={{ width: '36px', height: '36px' }}>
							<Icon icon='CheckCircle' size='lg' />
						</div>
						<div className='d-flex flex-column'>
							<span className='fw-bold text-dark fs-5'>Approve Service Payment</span>
							<span className='text-muted small' style={{ fontSize: '0.78rem' }}>
								Confirm manual/custom service payment request review
							</span>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody className='py-3'>
				<div className='d-flex flex-column gap-3'>
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
								<span className='text-muted small d-block'>Payable Amount</span>
								<span className='fw-bold text-danger fs-6'>
									- {formatINR(transaction.payable_amount || transaction.amount)}
								</span>
							</div>
						</div>
					</div>

					{/* REMARK INPUT */}
					<div>
						<label htmlFor='approveRemarkInput' className='form-label small fw-semibold text-dark mb-1'>
							Remark <span className='text-muted fw-normal'>(Optional)</span>
						</label>
						<input
							id='approveRemarkInput'
							type='text'
							className='form-control'
							placeholder='e.g. Paid manually or Reference #12345'
							value={remark}
							onChange={(e) => setRemark(e.target.value)}
							disabled={isSubmitting}
							style={{
								height: '42px',
								borderRadius: '0.5rem',
								border: '1px solid #cbd5e1',
								fontSize: '0.9rem',
							}}
						/>
						<span className='text-muted small d-block mt-1' style={{ fontSize: '0.75rem' }}>
							Optional note recorded with this approval.
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
					color='success'
					className='d-inline-flex align-items-center gap-2'
					onClick={handleApprove}
					isDisable={isSubmitting}>
					{isSubmitting ? (
						<>
							<Spinner isSmall inButton />
							<span>Approving...</span>
						</>
					) : (
						<>
							<Icon icon='Check' />
							<span>Approve Payment</span>
						</>
					)}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

ApproveServiceTransactionModal.defaultProps = {
	transaction: null,
};

export default ApproveServiceTransactionModal;
