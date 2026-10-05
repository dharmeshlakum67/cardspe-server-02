/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/control-has-associated-label, no-nested-ternary, react/require-default-props */
import React, { FC, useEffect, useState } from 'react';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Button from '../../../../../components/bootstrap/Button';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Icon from '../../../../../components/icon/Icon';
import { PillBadge } from '../../../../../components/common';
import {
	IBankDetail,
	getAccountTypeLabel,
	getAccountTypeBadgeColor,
} from '../type/bank-detail-type';
import { formatDateTime } from '../../../../../helpers/dateUtils';
import bankDetailService from '../service/bankDetailService';

interface IBankDetailViewModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	bankDetail: IBankDetail | null;
}

export const BankDetailViewModal: FC<IBankDetailViewModalProps> = ({
	isOpen,
	setIsOpen,
	bankDetail,
}) => {
	const [detail, setDetail] = useState<IBankDetail | null>(bankDetail);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	// FETCH FRESH DATA VIA GET-ONE API ON OPEN
	useEffect(() => {
		let isMounted = true;
		if (isOpen && bankDetail) {
			setDetail(bankDetail);
			if (bankDetail.id) {
				setIsLoading(true);
				bankDetailService
					.getBankDetailById(bankDetail.id)
					.then((res) => {
						if (isMounted && res?.data) {
							setDetail(res.data);
						}
					})
					.catch((err) => {
						console.error('Error fetching updated bank detail:', err);
					})
					.finally(() => {
						if (isMounted) setIsLoading(false);
					});
			}
		}
		return () => {
			isMounted = false;
		};
	}, [isOpen, bankDetail]);

	if (!detail) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size="lg" isScrollable isCentered>
			<ModalHeader setIsOpen={setIsOpen} className="px-4 py-3 border-bottom bg-white">
				<ModalTitle id="bank-detail-view-modal-title">
					<div className="d-flex align-items-center gap-3">
						<div
							className="rounded-3 d-flex align-items-center justify-content-center bg-primary text-white shadow-sm flex-shrink-0"
							style={{ width: '40px', height: '40px' }}>
							<Icon icon="AccountBalance" size="lg" />
						</div>
						<div>
							<div className="d-flex align-items-center flex-wrap gap-2">
								<span className="fw-bold text-dark fs-6">Bank Account Details</span>
								{isLoading && (
									<span
										className="badge bg-light text-muted border d-inline-flex align-items-center gap-1"
										style={{ fontSize: '0.72rem' }}>
										<Spinner isSmall isGrow className="text-primary" />
										<span>Updating...</span>
									</span>
								)}
							</div>
							<div className="text-muted" style={{ fontSize: '0.75rem' }}>
								Complete verified banking profile
							</div>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody className="p-3 p-md-4" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
				{/* 1. TOP SUMMARY BANNER */}
				<div
					className="card shadow-none border mb-4 rounded-4"
					style={{
						background:
							'linear-gradient(135deg, rgba(13, 110, 253, 0.04) 0%, rgba(248, 249, 250, 0.8) 100%)',
						borderColor: 'rgba(13, 110, 253, 0.15)',
					}}>
					<div className="card-body p-3 p-md-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
						<div className="d-flex align-items-center gap-3">
							<div
								className="rounded-3 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
								style={{
									width: '56px',
									height: '56px',
									background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
									color: '#ffffff',
								}}>
								<Icon icon="AccountBalance" size="2x" />
							</div>
							<div>
								<div className="d-flex align-items-center gap-2 flex-wrap mb-1">
									<h5 className="fw-bold text-dark mb-0 fs-5" style={{ whiteSpace: 'nowrap' }}>
										{detail.bank_name}
									</h5>
								</div>
								<div className="text-muted small">
									<span>Account Holder: </span>
									<strong className="text-dark">{detail.account_holder_name}</strong>
								</div>
							</div>
						</div>

						{detail.created_at && (
							<div className="text-end text-muted small border-start ps-3 d-none d-sm-block flex-shrink-0">
								<div
									className="text-muted fw-semibold"
									style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
									CREATED AT
								</div>
								<div className="fw-bold text-dark">{formatDateTime(detail.created_at).date}</div>
								<div className="text-muted" style={{ fontSize: '0.75rem' }}>
									{formatDateTime(detail.created_at).time}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* 2. TWO DISTINCT SPECIFICATION CARDS */}
				<div className="row g-3 g-md-4 mb-2">
					{/* CARD 1: ACCOUNT DETAILS */}
					<div className="col-12 col-md-6">
						<div className="card shadow-none border h-100 rounded-4 overflow-hidden mb-0">
							<div className="card-header bg-white border-bottom py-2.5 px-3 px-md-4">
								<div className="card-label d-flex align-items-center gap-3">
									<div
										className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
										style={{
											width: '32px',
											height: '32px',
											backgroundColor: 'rgba(13, 110, 253, 0.1)',
											color: '#0d6efd',
										}}>
										<Icon icon="Badge" size="sm" />
									</div>
									<div>
										<div
											className="fw-bold text-dark text-uppercase"
											style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}>
											Account Details
										</div>
										<div className="text-muted" style={{ fontSize: '0.7rem' }}>
											Primary account credentials
										</div>
									</div>
								</div>
							</div>
							<div className="card-body p-3 p-md-4">
								{/* ACCOUNT NUMBER */}
								<div className="pb-3 border-bottom d-flex align-items-center justify-content-between gap-3">
									<span className="text-muted small fw-medium flex-shrink-0">Account Number</span>
									<span className="font-monospace fw-bold text-dark small text-end text-break">
										{detail.account_number}
									</span>
								</div>

								{/* HOLDER NAME */}
								<div className="py-3 border-bottom d-flex align-items-center justify-content-between gap-3">
									<span className="text-muted small fw-medium flex-shrink-0">Holder Name</span>
									<span className="fw-bold text-dark small text-end text-break">
										{detail.account_holder_name}
									</span>
								</div>

								{/* ACCOUNT TYPE */}
								<div className="py-3 border-bottom d-flex align-items-center justify-content-between gap-3">
									<span className="text-muted small fw-medium flex-shrink-0">Account Type</span>
									<PillBadge color={getAccountTypeBadgeColor(detail.account_type)} size="sm">
										{getAccountTypeLabel(detail.account_type)}
									</PillBadge>
								</div>

								{/* STATUS */}
								<div className="pt-3 d-flex align-items-center justify-content-between gap-3">
									<span className="text-muted small fw-medium flex-shrink-0">Account Status</span>
									<PillBadge
										color={detail.status === 'active' ? 'success' : 'secondary'}
										size="sm">
										{detail.status === 'active' ? 'Active' : 'Inactive'}
									</PillBadge>
								</div>
							</div>
						</div>
					</div>

					{/* CARD 2: BRANCH & ROUTING */}
					<div className="col-12 col-md-6">
						<div className="card shadow-none border h-100 rounded-4 overflow-hidden mb-0">
							<div className="card-header bg-white border-bottom py-2.5 px-3 px-md-4">
								<div className="card-label d-flex align-items-center gap-3">
									<div
										className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
										style={{
											width: '32px',
											height: '32px',
											backgroundColor: 'rgba(13, 202, 240, 0.12)',
											color: '#0dcaf0',
										}}>
										<Icon icon="LocationOn" size="sm" />
									</div>
									<div>
										<div
											className="fw-bold text-dark text-uppercase"
											style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}>
											Branch & Routing
										</div>
										<div className="text-muted" style={{ fontSize: '0.7rem' }}>
											Routing code & bank location
										</div>
									</div>
								</div>
							</div>
							<div className="card-body p-3 p-md-4">
								{/* IFSC CODE */}
								<div className="pb-3 border-bottom d-flex align-items-center justify-content-between gap-3">
									<span className="text-muted small fw-medium flex-shrink-0">IFSC Code</span>
									<span className="font-monospace fw-bold text-dark small text-end text-break">
										{detail.ifsc_code}
									</span>
								</div>

								{/* BRANCH NAME */}
								<div className="py-3 border-bottom d-flex align-items-center justify-content-between gap-3">
									<span className="text-muted small fw-medium flex-shrink-0">Branch Name</span>
									<span className="fw-semibold text-dark small text-end text-break">
										{detail.branch_name || '-'}
									</span>
								</div>

								{/* BRANCH CODE */}
								<div className="py-3 border-bottom d-flex align-items-center justify-content-between gap-3">
									<span className="text-muted small fw-medium flex-shrink-0">Branch Code</span>
									{detail.branch_code ? (
										<span className="badge bg-light text-dark border font-monospace px-2 py-0.5 small">
											{detail.branch_code}
										</span>
									) : (
										<span className="text-muted small">-</span>
									)}
								</div>

								{/* BANK ADDRESS */}
								<div className="pt-3 d-flex align-items-start justify-content-between gap-3">
									<span className="text-muted small fw-medium flex-shrink-0">Bank Address</span>
									<span className="text-dark small text-end text-break" style={{ lineHeight: '1.5' }}>
										{detail.bank_address || '-'}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</ModalBody>

			<ModalFooter className="px-4 py-3 bg-white border-top">
				<Button color="light" className="border px-4 py-2 rounded-2 fw-semibold" onClick={() => setIsOpen(false)}>
					Close
				</Button>
			</ModalFooter>
		</Modal>
	);
};

BankDetailViewModal.defaultProps = {
	bankDetail: null,
};

export default BankDetailViewModal;
