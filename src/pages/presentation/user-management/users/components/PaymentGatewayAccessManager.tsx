/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/require-default-props */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../../../components/icon/Icon';
import Spinner from '../../../../../components/bootstrap/Spinner';
import Tooltips from '../../../../../components/bootstrap/Tooltips';
import showNotification from '../../../../../components/extras/showNotification';
import userService from '../service/userService';
import { IPaymentGatewayAccessItem } from '../type/payment-gateway-access-type';
import { getImageUrl } from '../../../../../helpers/helpers';
import usePermission from '../../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../../constants/permissionKeys';
import '../css/PaymentGatewayAccessManager.scss';

interface IPaymentGatewayAccessManagerProps {
	userId: number | string;
	userName?: string;
	username?: string;
	isModal?: boolean;
	onCloseModal?: () => void;
	onSaveSuccess?: () => void;
}

const SYSTEM_DEFAULT_GATEWAY: IPaymentGatewayAccessItem = {
	id: 0,
	name: 'Custom / System Default',
	code: 'DEFAULT',
	icon: null,
	description: 'Default payment gateway configuration from system environment.',
	status: 'active',
	is_primary: true,
	is_assigned: true,
	is_system_default: true,
	can_manage: false,
};

export const PaymentGatewayAccessManager: FC<IPaymentGatewayAccessManagerProps> = ({
	userId,
	userName,
	username,
	isModal = false,
	onCloseModal,
	onSaveSuccess,
}) => {
	const { hasPermission } = usePermission();

	// PERMISSION TO MANAGE / ASSIGN PAYMENT GATEWAYS
	const canManageGateway = Boolean(
		hasPermission(PERMISSION_KEYS.USERS, 'manage_gateway') ||
		hasPermission(PERMISSION_KEYS.USER, 'manage_gateway') ||
		hasPermission(PERMISSION_KEYS.USER_MANAGEMENT, 'manage_gateway') ||
		hasPermission('users', 'manage_gateway') ||
		hasPermission('user', 'manage_gateway') ||
		hasPermission('manage_gateway') ||
		hasPermission('manage_gateways'),
	);

	const [gateways, setGateways] = useState<IPaymentGatewayAccessItem[]>([]);
	// Single active gateway ID: null means system default / no custom, or number for active custom gateway
	const [activeGatewayId, setActiveGatewayId] = useState<number | null>(null);
	const [initialActiveGatewayId, setInitialActiveGatewayId] = useState<number | null>(null);

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	// REF GUARDS TO PREVENT DUPLICATE CALLS
	const fetchedUserIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// FETCH PAYMENT GATEWAY ACCESS FROM API
	const fetchGatewayAccess = useCallback(
		async (force = false) => {
			const targetIdStr = String(userId || '');
			if (!targetIdStr) return;
			if (!force && (isFetchingRef.current || fetchedUserIdRef.current === targetIdStr)) {
				return;
			}

			isFetchingRef.current = true;
			fetchedUserIdRef.current = targetIdStr;

			try {
				setIsLoading(true);
				setFetchError(null);
				const res = await userService.getPaymentGatewayAccess(userId);
				const data = res?.data;
				const isUsingDefault = data?.is_using_default ?? true;
				const rawGatewaysList = data?.gateways || [];

				const defaultItemInList = rawGatewaysList.find(
					(g: IPaymentGatewayAccessItem) => g.is_system_default || g.id === 0,
				);
				const customList: IPaymentGatewayAccessItem[] = rawGatewaysList.filter(
					(g: IPaymentGatewayAccessItem) => !g.is_system_default && g.id !== 0,
				);

				const systemDefault = defaultItemInList || SYSTEM_DEFAULT_GATEWAY;
				const mergedList = [{ ...systemDefault, can_manage: false }, ...customList];

				setGateways(mergedList);

				// IDENTIFY THE CURRENT ACTIVE GATEWAY
				let currentActiveId: number | null = null;
				if (!isUsingDefault) {
					const activeItem = customList.find(
						(g: IPaymentGatewayAccessItem) =>
							g.status === 'active' || g.is_primary || g.is_assigned,
					);
					if (activeItem) {
						currentActiveId = activeItem.id;
					}
				}

				setActiveGatewayId(currentActiveId);
				setInitialActiveGatewayId(currentActiveId);
			} catch (err: any) {
				fetchedUserIdRef.current = '';
				setFetchError(
					err?.data?.message || err?.message || 'Failed to load payment gateway access settings.',
				);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[userId],
	);

	useEffect(() => {
		fetchGatewayAccess();
	}, [fetchGatewayAccess]);

	// TOGGLE / SELECT SINGLE ACTIVE CUSTOM GATEWAY
	const handleToggleGateway = (gatewayId: number) => {
		if (!canManageGateway || isSaving || gatewayId === 0) return;

		setActiveGatewayId((prev) => (prev === gatewayId ? null : gatewayId));
	};

	// DISCARD / RESET CHANGES
	const handleDiscardChanges = () => {
		setActiveGatewayId(initialActiveGatewayId);
	};

	// DETECT UNSAVED CHANGES
	const hasUnsavedChanges = activeGatewayId !== initialActiveGatewayId;

	// SAVE PAYMENT GATEWAY ACCESS CONFIGURATION
	const handleSave = async () => {
		if (!canManageGateway || !hasUnsavedChanges || isSaving) return;

		try {
			setIsSaving(true);
			const isUsingDefault = activeGatewayId === null || activeGatewayId === 0;
			const payload = {
				is_using_default: isUsingDefault,
				payment_gateway_id: activeGatewayId || 0,
				gateways: gateways
					.filter((g) => g.id !== 0 && !g.is_system_default)
					.map((g) => ({
						payment_gateway_id: g.id,
						status: (g.id === activeGatewayId ? 'active' : 'inactive') as 'active' | 'inactive',
						is_primary: g.id === activeGatewayId,
					})),
			};

			const res = await userService.updatePaymentGatewayAccess(userId, payload);
			showNotification(
				'Success',
				res?.message || 'Payment gateway access updated successfully.',
				'success',
			);

			// UPDATE INITIAL BASELINE
			setInitialActiveGatewayId(activeGatewayId);

			if (onSaveSuccess) onSaveSuccess();
		} catch (err: any) {
			showNotification(
				'Update Failed',
				err?.data?.message || err?.message || 'Failed to update payment gateway access.',
				'danger',
			);
		} finally {
			setIsSaving(false);
		}
	};

	// LOADING STATE
	if (isLoading) {
		return (
			<div className='d-flex flex-column align-items-center justify-content-center py-5'>
				<Spinner color='primary' size='3rem' isGrow={false} />
				<span className='text-muted small mt-3'>Loading payment gateways...</span>
			</div>
		);
	}

	// ERROR STATE
	if (fetchError) {
		return (
			<div className='p-4'>
				<div className='alert alert-danger d-flex align-items-center justify-content-between flex-wrap gap-2 mb-0'>
					<div className='d-flex align-items-center gap-2'>
						<Icon icon='ErrorOutline' size='md' />
						<span>{fetchError}</span>
					</div>
					<button
						type='button'
						className='btn btn-sm btn-outline-danger'
						onClick={() => fetchGatewayAccess(true)}>
						<Icon icon='Refresh' size='sm' className='me-1' />
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className='payment-gateway-access-manager'>
			{/* READ ONLY NOTICE IF ADMIN CANNOT MANAGE */}
			{!canManageGateway && (
				<div className='alert alert-info py-2 px-3 small d-flex align-items-center gap-2 rounded-3 mb-0'>
					<Icon icon='Info' />
					<span>
						<strong>View-Only Mode:</strong> You do not have permission to modify gateway assignments for this user.
					</span>
				</div>
			)}

			{/* GATEWAYS GRID - IDENTICAL STRUCTURE TO SERVICE ACCESS CARDS */}
			{gateways.length > 0 ? (
				<div className='gam-gateways-grid'>
					{gateways.map((item) => {
						const isDefault = Boolean(item.is_system_default || item.id === 0);
						const isActive = isDefault ? true : activeGatewayId === item.id;
						const displayName = item.name || 'Unnamed Gateway';
						const initials = displayName.slice(0, 2).toUpperCase();

						return (
							<div
								key={item.id}
								className={`gam-gateway-card ${isActive ? 'accessible' : 'restricted'}`}>
								{/* CARD TOP: LOGO + INFO + TOGGLE */}
								<div className='card-main-header'>
									<div className='card-logo-and-title'>
										<div className='gateway-logo-box'>
											{isDefault ? (
												<Icon icon='CloudDone' size='lg' className='text-primary' />
											) : item.icon ? (
												<img
													src={getImageUrl(item.icon)}
													alt={displayName}
													onError={(e) => {
														(e.target as HTMLElement).style.display = 'none';
													}}
												/>
											) : (
												<span className='gateway-logo-fallback'>{initials}</span>
											)}
										</div>
										<div className='gateway-title-meta'>
											<span className='gateway-name' title={displayName}>
												{displayName}
											</span>
											<span className='gateway-code-tag'>#{item.code || item.id}</span>
										</div>
									</div>

									{/* INTERACTIVE TOGGLE */}
									<div className='card-toggle-wrapper'>
										<Tooltips
											title={
												isDefault
													? 'System default route (non-editable)'
													: !canManageGateway
													? 'View only (manage_gateway permission required)'
													: isActive
													? 'Active payment gateway for this user'
													: 'Click to activate this gateway'
											}
											placement='top'>
											<label className='gam-switch'>
												<input
													type='checkbox'
													checked={isActive}
													disabled={isDefault || !canManageGateway || isSaving}
													onChange={() => handleToggleGateway(item.id)}
												/>
												<span className='gam-slider' />
											</label>
										</Tooltips>
									</div>
								</div>

								{/* CARD FOOTER: ACCESS STATUS BADGE + MANAGE PERMISSION */}
								<div className='card-meta-footer'>
									<span
										className={`access-badge ${
											isActive ? 'badge-granted' : 'badge-restricted'
										}`}>
										<span className='dot' />
										<span>{isDefault ? 'Active (Fixed)' : isActive ? 'Active Gateway' : 'Inactive'}</span>
									</span>

									{isDefault ? (
										<span className='manage-status-tag locked' title='Custom system default (Fixed)'>
											<Icon icon='Lock' size='sm' />
											<span>Non-editable</span>
										</span>
									) : !canManageGateway ? (
										<span className='manage-status-tag' title='You have read-only access'>
											<Icon icon='Visibility' size='sm' />
											<span>View Only</span>
										</span>
									) : (
										<span className='manage-status-tag' title='You have permission to edit'>
											<Icon icon='Check' size='sm' className='text-primary' />
											<span>Editable</span>
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className='p-5 bg-light-subtle text-muted text-center rounded-3 border'>
					<div
						className='rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 mb-2 border'
						style={{ width: '64px', height: '64px' }}>
						<Icon icon='AccountBalanceWallet' size='lg' className='text-secondary' />
					</div>
					<div className='fw-bold text-dark fs-6'>No Payment Gateways Available</div>
					<div className='small text-muted mt-1'>
						There are no payment gateways configured for this user.
					</div>
				</div>
			)}

			{/* FLOATING ACTION BAR FOR UNSAVED CHANGES */}
			{canManageGateway && hasUnsavedChanges && (
				<div className='gam-floating-bar'>
					<div className='floating-info'>
						<span className='unsaved-count-badge'>1 Change</span>
						<span className='floating-text'>You have unsaved payment gateway assignment updates</span>
					</div>

					<div className='floating-actions'>
						<button
							type='button'
							className='btn-gam-discard'
							disabled={isSaving}
							onClick={handleDiscardChanges}>
							Discard
						</button>
						<button
							type='button'
							className='btn-gam-save'
							disabled={isSaving}
							onClick={handleSave}>
							{isSaving ? (
								<>
									<Spinner color='light' size='1rem' isGrow={false} />
									<span>Saving...</span>
								</>
							) : (
								<>
									<Icon icon='Save' size='sm' />
									<span>Save Changes</span>
								</>
							)}
						</button>
					</div>
				</div>
			)}

			{/* MODAL ACTION BUTTONS (IF INSIDE MODAL AND NO UNSAVED BAR VISIBLE) */}
			{isModal && !hasUnsavedChanges && (
				<div className='d-flex justify-content-end mt-2 pt-2 border-top'>
					<button
						type='button'
						className='btn btn-secondary px-4'
						onClick={onCloseModal}>
						Close
					</button>
				</div>
			)}
		</div>
	);
};

export default PaymentGatewayAccessManager;



