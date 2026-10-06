/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, react/default-props-match-prop-types */
import React, { FC } from 'react';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Icon from '../../../../../components/icon/Icon';
import { PillBadge } from '../../../../../components/common/PillBadge';
import { getImageUrl } from '../../../../../helpers/helpers';
import { formatDateTime } from '../../../../../helpers/dateUtils';
import { IPaymentGateway } from '../type/payment-gateway-type';
import '../css/payment-gateway.scss';

interface IPaymentGatewayViewModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	gateway?: IPaymentGateway | null;
}

export const PaymentGatewayViewModal: FC<IPaymentGatewayViewModalProps> = ({
	isOpen,
	setIsOpen,
	gateway,
}) => {
	if (!gateway) return null;

	const iconUrl = gateway.icon ? getImageUrl(gateway.icon) : '';
	const isActive = gateway.status === 'active';

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered>
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='payment-gateway-view-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-flex align-items-center justify-content-center rounded-3'
							style={{
								width: '44px',
								height: '44px',
								backgroundColor: '#fdf2f8',
								color: '#db2777',
								flexShrink: 0,
							}}>
							<Icon icon='AccountBalanceWallet' size='lg' />
						</div>
						<div>
							<h5 className='mb-0 fw-bold text-dark'>Payment Gateway Details</h5>
							<small className='text-muted'>
								Complete information and configuration summary
							</small>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody className='px-4 pt-3 pb-3'>
				{/* HERO BANNER */}
				<div className='gateway-view-hero mb-3'>
					<div className='view-hero-icon-box'>
						{iconUrl ? (
							<img src={iconUrl} alt={gateway.name} />
						) : (
							<Icon icon='AccountBalanceWallet' size='2x' className='text-primary' />
						)}
					</div>
					<div className='view-hero-content'>
						<div className='hero-title-row'>
							<h4>{gateway.name}</h4>
							<PillBadge color={isActive ? 'success' : 'danger'}>
								{gateway.status?.toUpperCase()}
							</PillBadge>
						</div>
						<span className='text-muted small'>
							Code: {gateway.code}
						</span>
					</div>
				</div>

				{/* DETAIL METADATA */}
				<div className='card border rounded-3 p-3 bg-light'>
					<div className='gateway-detail-list'>
						<div className='detail-item'>
							<span className='detail-label'>Gateway Name</span>
							<span className='detail-value'>{gateway.name}</span>
						</div>

						<div className='detail-item'>
							<span className='detail-label'>Identifier Code</span>
							<span className='detail-value font-monospace'>{gateway.code}</span>
						</div>

						<div className='detail-item'>
							<span className='detail-label'>Status</span>
							<span className='detail-value'>
								<PillBadge color={isActive ? 'success' : 'danger'} size='sm'>
									{gateway.status.toUpperCase()}
								</PillBadge>
							</span>
						</div>

						<div className='detail-item'>
							<span className='detail-label'>Description</span>
							<span className='detail-value text-muted font-normal'>
								{gateway.description || 'No description provided.'}
							</span>
						</div>

						<div className='detail-item'>
							<span className='detail-label'>Created At</span>
							<span className='detail-value'>
								{formatDateTime(gateway.created_at).full}
							</span>
						</div>

						<div className='detail-item'>
							<span className='detail-label'>Last Updated</span>
							<span className='detail-value'>
								{formatDateTime(gateway.updated_at).full}
							</span>
						</div>
					</div>
				</div>
			</ModalBody>

			<ModalFooter className='border-top-0 pt-0 pb-4 px-4'>
				<button
					type='button'
					className='btn btn-secondary px-4 fw-semibold rounded-3'
					onClick={() => setIsOpen(false)}>
					Close
				</button>
			</ModalFooter>
		</Modal>
	);
};

PaymentGatewayViewModal.defaultProps = {
	gateway: null,
};

export default PaymentGatewayViewModal;
