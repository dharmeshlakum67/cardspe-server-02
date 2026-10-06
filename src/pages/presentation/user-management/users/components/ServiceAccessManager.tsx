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
import { IServiceAccessItem } from '../type/service-access-type';
import { getImageUrl } from '../../../../../helpers/helpers';
import usePermission from '../../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../../constants/permissionKeys';
import '../css/ServiceAccessManagement.scss';

interface IServiceAccessManagerProps {
	userId: number | string;
	userName?: string;
	username?: string;
	isModal?: boolean;
	onCloseModal?: () => void;
	onSaveSuccess?: () => void;
}

export const ServiceAccessManager: FC<IServiceAccessManagerProps> = ({
	userId,
	userName,
	username,
	isModal = false,
	onCloseModal,
	onSaveSuccess,
}) => {
	const { hasPermission } = usePermission();

	// MANAGE SERVICE PERMISSION GUARD (PERMISSION IS REQUIRED FOR UPDATE ONLY; VIEWING IS ALLOWED)
	const canManageService = Boolean(
		hasPermission(PERMISSION_KEYS.MANAGE_SERVICE) ||
		hasPermission('manage_service') ||
		hasPermission('manage_services') ||
		hasPermission(PERMISSION_KEYS.USERS, 'manage_service') ||
		hasPermission(PERMISSION_KEYS.USER_MANAGEMENT, 'manage_service') ||
		hasPermission(PERMISSION_KEYS.SERVICE_MANAGEMENT, 'manage_service'),
	);

	const [services, setServices] = useState<IServiceAccessItem[]>([]);
	const [initialAccessMap, setInitialAccessMap] = useState<Record<number, boolean>>({});
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	// SEARCH
	const [searchTerm, setSearchTerm] = useState<string>('');

	// REF GUARDS TO PREVENT DUPLICATE CALLS
	const fetchedUserIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	const fetchServiceAccess = useCallback(
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
				const res = await userService.getServiceAccess(userId);
				const servicesList = res?.data?.services || [];
				setServices(servicesList);

				const accessMap: Record<number, boolean> = {};
				servicesList.forEach((s) => {
					accessMap[s.id] = !!s.is_accessible;
				});
				setInitialAccessMap(accessMap);
			} catch (err: any) {
				fetchedUserIdRef.current = '';
				setFetchError(
					err?.data?.message || err?.message || 'Failed to load service access settings.',
				);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[userId],
	);

	useEffect(() => {
		fetchServiceAccess();
	}, [fetchServiceAccess]);

	// TOGGLE SINGLE SERVICE ACCESS
	const handleToggleAccess = (serviceId: number, canManage: boolean) => {
		if (!canManageService || !canManage || isSaving) return;
		setServices((prev) =>
			prev.map((s) => (s.id === serviceId ? { ...s, is_accessible: !s.is_accessible } : s)),
		);
	};

	// BULK TOGGLE ACCESSIBLE FOR ALL MANAGEABLE SERVICES
	const handleBulkToggle = (enable: boolean) => {
		if (!canManageService || isSaving) return;
		setServices((prev) =>
			prev.map((s) => (s.can_manage ? { ...s, is_accessible: enable } : s)),
		);
	};

	// RESET / DISCARD CHANGES
	const handleDiscardChanges = () => {
		setServices((prev) =>
			prev.map((s) => ({
				...s,
				is_accessible: initialAccessMap[s.id] ?? s.is_accessible,
			})),
		);
	};

	// DETECT UNSAVED CHANGES
	const unsavedCount = useMemo(() => {
		return services.reduce((count, s) => {
			const initialVal = initialAccessMap[s.id] ?? false;
			return s.is_accessible !== initialVal ? count + 1 : count;
		}, 0);
	}, [services, initialAccessMap]);

	// SAVE SERVICE ACCESS
	const handleSave = async () => {
		if (!canManageService || unsavedCount === 0 || isSaving) return;
		try {
			setIsSaving(true);
			const payload = {
				services: services.map((s) => ({
					service_category_id: s.id,
					status: s.is_accessible ? ('active' as const) : ('inactive' as const),
				})),
			};

			const res = await userService.updateServiceAccess(userId, payload);
			showNotification(
				'Success',
				res?.message || 'Service access updated successfully.',
				'success',
			);

			// UPDATE INITIAL BASELINE
			const updatedMap: Record<number, boolean> = {};
			services.forEach((s) => {
				updatedMap[s.id] = !!s.is_accessible;
			});
			setInitialAccessMap(updatedMap);

			if (onSaveSuccess) onSaveSuccess();
		} catch (err: any) {
			showNotification(
				'Update Failed',
				err?.data?.message || err?.message || 'Failed to update service access.',
				'danger',
			);
		} finally {
			setIsSaving(false);
		}
	};

	// STATS CALCULATIONS
	const stats = useMemo(() => {
		const total = services.length;
		const accessible = services.filter((s) => s.is_accessible).length;
		const restricted = total - accessible;
		const manageable = services.filter((s) => s.can_manage).length;
		return { total, accessible, restricted, manageable };
	}, [services]);

	// FILTERED SERVICES
	const filteredServices = useMemo(() => {
		return services.filter((s) => {
			const name = s.name || s.service_name || '';
			const slug = s.slug || '';
			const matchesSearch =
				!searchTerm.trim() ||
				name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
				slug.toLowerCase().includes(searchTerm.toLowerCase().trim());

			return matchesSearch;
		});
	}, [services, searchTerm]);

	// LOADING STATE
	if (isLoading) {
		return (
			<div className="d-flex flex-column align-items-center justify-content-center py-5">
				<Spinner color="primary" size="3rem" isGrow={false} />
				<span className="text-muted small mt-3">Loading service categories & access...</span>
			</div>
		);
	}

	// ERROR STATE
	if (fetchError) {
		return (
			<div className="p-4">
				<div className="alert alert-danger d-flex align-items-center justify-content-between flex-wrap gap-2 mb-0">
					<div className="d-flex align-items-center gap-2">
						<Icon icon="ErrorOutline" size="md" />
						<span>{fetchError}</span>
					</div>
					<button
						type="button"
						className="btn btn-sm btn-outline-danger"
						onClick={() => fetchServiceAccess(true)}>
						<Icon icon="Refresh" size="sm" className="me-1" />
						Retry
					</button>
				</div>
			</div>
		);
	}

	// EMPTY STATE
	if (services.length === 0) {
		return (
			<div className="p-5 bg-light-subtle text-muted text-center rounded-3 border">
				<div
					className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 mb-2 border"
					style={{ width: '64px', height: '64px' }}>
					<Icon icon="Widgets" size="lg" className="text-secondary" />
				</div>
				<div className="fw-bold text-dark fs-6">No Service Categories Found</div>
				<div className="small text-muted mt-1">
					There are no service categories configured in the system yet.
				</div>
			</div>
		);
	}

	return (
		<div className="service-access-manager">
			{/* STATS OVERVIEW CARDS */}
			<div className="sam-stats-row">
				<div className="sam-stat-card">
					<div className="stat-icon-wrapper icon-total">
						<Icon icon="Category" />
					</div>
					<div className="stat-info">
						<span className="stat-value">{stats.total}</span>
						<span className="stat-label">Total Services</span>
					</div>
				</div>

				<div className="sam-stat-card">
					<div className="stat-icon-wrapper icon-granted">
						<Icon icon="CheckCircle" />
					</div>
					<div className="stat-info">
						<span className="stat-value text-success">{stats.accessible}</span>
						<span className="stat-label">Access Granted</span>
					</div>
				</div>

				<div className="sam-stat-card">
					<div className="stat-icon-wrapper icon-restricted">
						<Icon icon="Block" />
					</div>
					<div className="stat-info">
						<span className="stat-value text-muted">{stats.restricted}</span>
						<span className="stat-label">Restricted</span>
					</div>
				</div>
			</div>

			{/* TOOLBAR: SEARCH + FILTER TABS + BULK TOGGLE */}
			<div className="sam-toolbar-card">
				{/* SEARCH */}
				<div className="toolbar-search">
					<span className="search-icon">
						<Icon icon="Search" size="sm" />
					</span>
					<input
						type="text"
						className="form-control"
						placeholder="Search services by name or slug..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<button
							type="button"
							className="search-clear-btn"
							onClick={() => setSearchTerm('')}
							title="Clear search">
							<Icon icon="Close" size="sm" />
						</button>
					)}
				</div>


				{/* BULK ACTION BUTTONS (SHOWN ONLY IF USER HAS UPDATE PERMISSION) */}
				{canManageService && (
					<div className="toolbar-bulk-actions">
						<button
							type="button"
							className="btn-bulk-toggle btn-enable-all"
							disabled={stats.manageable === 0 || isSaving}
							onClick={() => handleBulkToggle(true)}
							title="Grant access to all manageable services">
							<Icon icon="DoneAll" size="sm" />
							<span>Enable All</span>
						</button>
						<button
							type="button"
							className="btn-bulk-toggle btn-disable-all"
							disabled={stats.manageable === 0 || isSaving}
							onClick={() => handleBulkToggle(false)}
							title="Revoke access to all manageable services">
							<Icon icon="RemoveCircleOutline" size="sm" />
							<span>Disable All</span>
						</button>
					</div>
				)}
			</div>

			{/* SERVICE CARDS GRID */}
			{filteredServices.length === 0 ? (
				<div className="p-4 bg-light text-center text-muted rounded-3 border">
					<Icon icon="SearchOff" size="lg" className="mb-2 text-secondary" />
					<div className="fw-semibold">No services match your search or filter</div>
					<small className="text-muted">Try clearing the search query or switching filters.</small>
				</div>
			) : (
				<div className="sam-services-grid">
					{filteredServices.map((service) => {
						const displayName = service.name || service.service_name || 'Unnamed Service';
						const initials = displayName.slice(0, 2).toUpperCase();

						return (
							<div
								key={service.id}
								className={`sam-service-card ${
									service.is_accessible ? 'accessible' : 'restricted'
								}`}>
								{/* CARD TOP: LOGO + INFO + TOGGLE */}
								<div className="card-main-header">
									<div className="card-logo-and-title">
										<div className="service-logo-box">
											{(() => {
												const iconVal = service.icon || (service as any).logo;
												const isImage =
													iconVal &&
													(iconVal.startsWith('data:') ||
														iconVal.startsWith('http') ||
														iconVal.includes('/') ||
														/\.(png|jpg|jpeg|svg|webp|gif|avif)$/i.test(iconVal));

												if (isImage) {
													const imgSrc = getImageUrl(iconVal);
													return (
														<img
															src={imgSrc}
															alt={displayName}
															onError={(e) => {
																(e.target as HTMLElement).style.display = 'none';
															}}
														/>
													);
												}

												if (iconVal) {
													return (
														<Icon
															icon={iconVal as any}
															size="lg"
															className="text-primary"
														/>
													);
												}

												return <span className="service-logo-fallback">{initials}</span>;
											})()}
										</div>
										<div className="service-title-meta">
											<span className="service-name" title={displayName}>
												{displayName}
											</span>
											<span className="service-slug-tag">#{service.slug || service.id}</span>
										</div>
									</div>

									{/* INTERACTIVE TOGGLE */}
									<div className="card-toggle-wrapper">
										<Tooltips
											title={
												!canManageService
													? 'View only (manage_service permission required to edit)'
													: !service.can_manage
													? 'Locked by parent hierarchy'
													: service.is_accessible
													? 'Click to revoke access'
													: 'Click to grant access'
											}
											placement="top">
											<label className="sam-switch">
												<input
													type="checkbox"
													checked={service.is_accessible}
													disabled={!canManageService || !service.can_manage || isSaving}
													onChange={() => handleToggleAccess(service.id, service.can_manage)}
												/>
												<span className="sam-slider" />
											</label>
										</Tooltips>
									</div>
								</div>

								{/* CARD FOOTER: ACCESS STATUS BADGE + MANAGE PERMISSION */}
								<div className="card-meta-footer">
									<span
										className={`access-badge ${
											service.is_accessible ? 'badge-granted' : 'badge-restricted'
										}`}>
										<span className="dot" />
										<span>{service.is_accessible ? 'Access Granted' : 'No Access'}</span>
									</span>

									{!canManageService ? (
										<span className="manage-status-tag" title="You have read-only access">
											<Icon icon="Visibility" size="sm" />
											<span>View Only</span>
										</span>
									) : !service.can_manage ? (
										<span className="manage-status-tag locked" title="Inherited from parent role">
											<Icon icon="Lock" size="sm" />
											<span>Locked</span>
										</span>
									) : (
										<span className="manage-status-tag" title="You have permission to edit access">
											<Icon icon="Check" size="sm" className="text-primary" />
											<span>Editable</span>
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* FLOATING ACTION BAR FOR UNSAVED CHANGES */}
			{canManageService && unsavedCount > 0 && (
				<div className="sam-floating-bar">
					<div className="floating-info">
						<span className="unsaved-count-badge">
							{unsavedCount} {unsavedCount === 1 ? 'Change' : 'Changes'}
						</span>
						<span className="floating-text">You have unsaved service access updates</span>
					</div>

					<div className="floating-actions">
						<button
							type="button"
							className="btn-sam-discard"
							disabled={isSaving}
							onClick={handleDiscardChanges}>
							Discard
						</button>
						<button
							type="button"
							className="btn-sam-save"
							disabled={isSaving}
							onClick={handleSave}>
							{isSaving ? (
								<>
									<Spinner color="light" size="1rem" isGrow={false} />
									<span>Saving...</span>
								</>
							) : (
								<>
									<Icon icon="Save" size="sm" />
									<span>Save Changes</span>
								</>
							)}
						</button>
					</div>
				</div>
			)}

			{/* MODAL ACTION BUTTONS (IF INSIDE MODAL AND NO UNSAVED BAR VISIBLE) */}
			{isModal && unsavedCount === 0 && (
				<div className="d-flex justify-content-end mt-2 pt-2 border-top">
					<button
						type="button"
						className="btn btn-secondary px-4"
						onClick={onCloseModal}>
						Close
					</button>
				</div>
			)}
		</div>
	);
};

ServiceAccessManager.defaultProps = {
	userName: '',
	username: '',
	isModal: false,
	onCloseModal: undefined,
	onSaveSuccess: undefined,
};

export default ServiceAccessManager;
