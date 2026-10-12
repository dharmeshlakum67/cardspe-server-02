/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, react/default-props-match-prop-types */
import React, { FC } from 'react';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Button from '../../../../../components/bootstrap/Button';
import Icon from '../../../../../components/icon/Icon';
import { PillBadge } from '../../../../../components/common/PillBadge';
import { getImageUrl } from '../../../../../helpers/helpers';
import { formatDateTime } from '../../../../../helpers/dateUtils';
import { IPaymentGateway, parseGatewayCharges } from '../type/payment-gateway-type';
import '../css/payment-gateway.scss';

const formatLimit = (amount: unknown, emptyText: string) =>
	amount !== null && amount !== undefined && amount !== ''
		? `₹${Number(amount).toLocaleString('en-IN')}`
		: emptyText;

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
	const [imageLoadFailed, setImageLoadFailed] = React.useState<boolean>(false);

	React.useEffect(() => {
		if (isOpen) {
			setImageLoadFailed(false);
		}
	}, [isOpen, gateway]);

	if (!gateway) return null;

	const iconUrl = gateway.icon ? getImageUrl(gateway.icon) : '';
	const isActive = gateway.status === 'active';
	const charges = parseGatewayCharges(gateway.charges);

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
						{iconUrl && !imageLoadFailed ? (
							<img
								src={iconUrl}
								alt={gateway.name}
								onError={() => setImageLoadFailed(true)}
							/>
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
						<span className='hero-code-chip'>{gateway.code}</span>
					</div>
				</div>

				{/* TRANSACTION LIMITS */}
				<div className='gateway-view-stats'>
					<div className='gateway-stat-tile'>
						<div className='stat-icon is-min'>
							<Icon icon='SouthEast' size='md' />
						</div>
						<div className='stat-body'>
							<span className='stat-label'>Minimum Amount</span>
							<span className='stat-value'>
								{formatLimit(gateway.min_amount, 'No minimum limit')}
							</span>
						</div>
					</div>
					<div className='gateway-stat-tile'>
						<div className='stat-icon is-max'>
							<Icon icon='NorthEast' size='md' />
						</div>
						<div className='stat-body'>
							<span className='stat-label'>Maximum Amount</span>
							<span className='stat-value'>
								{formatLimit(gateway.max_amount, 'No maximum limit')}
							</span>
						</div>
					</div>
				</div>

				{/* DESCRIPTION */}
				<div className='gateway-view-section'>
					<span className='section-label'>Description</span>
					<p className={`section-text ${gateway.description ? '' : 'is-empty'}`}>
						{gateway.description || 'No description provided.'}
					</p>
				</div>

				{/* AUDIT TIMESTAMPS */}
				<div className='gateway-view-meta'>
					<div className='meta-item'>
						<Icon icon='EventAvailable' size='sm' />
						<span className='meta-label'>Created</span>
						<span className='meta-value'>{formatDateTime(gateway.created_at).full}</span>
					</div>
					<div className='meta-item'>
						<Icon icon='Update' size='sm' />
						<span className='meta-label'>Last Updated</span>
						<span className='meta-value'>{formatDateTime(gateway.updated_at).full}</span>
					</div>
				</div>

				{/* CONFIGURED CHARGES */}
				<div className='card border rounded-3 p-3 mt-3 bg-white'>
					<div className='d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom'>
						<div className='d-flex align-items-center gap-2'>
							<Icon icon='PriceChange' className='text-primary' size='md' />
							<h6 className='fw-bold mb-0 text-dark' style={{ fontSize: '0.925rem' }}>
								Configured Gateway Charges
							</h6>
						</div>
						<span
							className='badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25'
							style={{ fontSize: '0.75rem', fontWeight: 600 }}>
							{charges.length} {charges.length === 1 ? 'Rule' : 'Rules'} Configured
						</span>
					</div>

					{charges.length === 0 ? (
						<div className='text-center py-4 text-muted bg-light rounded-3'>
							<Icon icon='PriceCheck' size='2x' className='text-muted opacity-50 mb-2' />
							<p className='small mb-0 fst-italic'>No custom gateway charges configured for this gateway.</p>
						</div>
					) : (
						<div className='charges-view-grid'>
							{charges.map((charge) => {
								const isFlat = charge.type === 'FLAT';
								let iconName = 'PriceChange';
								const lowerName = (charge.name || '').toLowerCase();
								if (lowerName.includes('wallet')) iconName = 'AccountBalanceWallet';
								else if (lowerName.includes('card')) iconName = 'CreditCard';
								else if (lowerName.includes('bank') || lowerName.includes('net')) iconName = 'AccountBalance';
								else if (lowerName.includes('upi')) iconName = 'QrCode';

								return (
									<div
										key={`view_charge_${charge.name}_${charge.type}`}
										className='charge-view-card'>
										<div className='charge-view-left'>
											<div className={`charge-view-icon-badge ${isFlat ? 'is-flat' : 'is-pct'}`}>
												<Icon icon={iconName} size='md' />
											</div>
											<div className='charge-view-meta'>
												<span className='charge-name'>{charge.name}</span>
												<span className={`charge-type-tag ${isFlat ? 'type-flat' : 'type-pct'}`}>
													{isFlat ? 'Flat Fee (₹)' : 'Percentage (%)'}
												</span>
											</div>
										</div>
										<div className='charge-view-right'>
											<span className='charge-amount font-monospace'>
												{isFlat
													? `₹${Number(charge.value).toFixed(2)}`
													: `${Number(charge.value).toFixed(2)}%`}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</ModalBody>

			<ModalFooter className='px-4 py-3'>
				<Button type='button' color='light' onClick={() => setIsOpen(false)}>
					Close
				</Button>
			</ModalFooter>
		</Modal>
	);
};

PaymentGatewayViewModal.defaultProps = {
	gateway: null,
};

export default PaymentGatewayViewModal;

