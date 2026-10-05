/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-nested-ternary */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../../../../layout/PageWrapper/PageWrapper';
import Page from '../../../../layout/Page/Page';
import Icon from '../../../../components/icon/Icon';
import Spinner from '../../../../components/bootstrap/Spinner';
import {
	ConfirmationModal,
	BlockUnblockModal,
	AppBreadcrumbs,
	ListingPagination,
} from '../../../../components/common';
import showNotification from '../../../../components/extras/showNotification';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { authPagesMenu } from '../../../../menu';
import { decryptId, encryptId } from '../../../../helpers/routeEncryption';
import { formatDateTime } from '../../../../helpers/dateUtils';
import usePermission from '../../../../hooks/usePermission';
import userService from './service/userService';
import { IUserItem, ISessionItem } from './type/user-type';
import blockHistoryService from '../block-history/service/blockHistoryService';
import { IBlockHistoryItem } from '../block-history/type/block-history-type';
import kycService from '../../profile/kyc/service/kycService';
import { IKycDetailsResponseData } from '../../profile/kyc/type/kyc-type';
import { getImageUrl } from '../../../../helpers/helpers';
import Button from '../../../../components/bootstrap/Button';
import Tooltips from '../../../../components/bootstrap/Tooltips';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../../../components/bootstrap/Modal';
import './css/UserViewPage.scss';

export type TUserDetailTab =
	| 'overview'
	| 'profile'
	| 'kyc'
	| 'wallet'
	| 'sessions'
	| 'block_history'
	| 'activity_log'
	| 'service_management';

// FORMAT KEY LABEL (e.g. pan_number -> Pan Number)
const formatKeyLabel = (key: string): string => {
	if (!key) return '';
	return key
		.replace(/_/g, ' ')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/\b\w/g, (char) => char.toUpperCase());
};

const getKycStatusBadgeClass = (status: string) => {
	const s = (status || '').toLowerCase();
	if (s === 'approved' || s === 'verified') return 'kyc-status-badge-lg status-approved';
	if (s === 'submitted' || s === 'pending') return 'kyc-status-badge-lg status-submitted';
	if (s === 'rejected') return 'kyc-status-badge-lg status-rejected';
	if (s === 'resubmit' || s === 'resubmit_requested') return 'kyc-status-badge-lg status-resubmit';
	return 'kyc-status-badge-lg status-not_submitted';
};

const getKycStatusLabel = (status: string) => {
	const s = (status || '').toLowerCase();
	if (s === 'approved' || s === 'verified') return 'Approved';
	if (s === 'submitted') return 'Submitted';
	if (s === 'pending') return 'Pending Verification';
	if (s === 'rejected') return 'Rejected';
	if (s === 'resubmit' || s === 'resubmit_requested') return 'Resubmit Requested';
	if (s === 'not_submitted') return 'Not Submitted';
	return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Not Submitted';
};

const getDeviceIcon = (deviceType?: string | null) => {
	const type = (deviceType || '').toLowerCase();
	if (type.includes('mobile') || type.includes('phone')) return 'Smartphone';
	if (type.includes('tablet') || type.includes('ipad')) return 'TabletMac';
	return 'Laptop';
};

const getDeviceTheme = (deviceType?: string | null) => {
	const type = (deviceType || '').toLowerCase();
	if (type.includes('mobile') || type.includes('phone')) {
		return { icon: 'Smartphone', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
	}
	if (type.includes('tablet') || type.includes('ipad')) {
		return { icon: 'TabletMac', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
	}
	return { icon: 'Laptop', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' };
};

const getBrowserTheme = (browser?: string | null) => {
	const b = (browser || '').toLowerCase();
	if (b.includes('chrome')) return { icon: 'Public', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
	if (b.includes('safari')) return { icon: 'Explore', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' };
	if (b.includes('firefox')) return { icon: 'Language', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
	if (b.includes('edge')) return { icon: 'Language', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' };
	return { icon: 'Language', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
};

interface IUserDetailTabItem {
	id: TUserDetailTab;
	label: string;
	icon: string;
}

const USER_DETAIL_TABS: IUserDetailTabItem[] = [
	{ id: 'overview', label: 'Overview', icon: 'PersonOutline' },
	{ id: 'profile', label: 'Profile', icon: 'Person' },
	{ id: 'kyc', label: 'KYC', icon: 'Assignment' },
	{ id: 'wallet', label: 'Wallet', icon: 'AccountBalanceWallet' },
	{ id: 'service_management', label: 'Service Management', icon: 'Settings' },
	{ id: 'sessions', label: 'Sessions', icon: 'Schedule' },
	{ id: 'block_history', label: 'Block History', icon: 'Block' },
	{ id: 'activity_log', label: 'Activity Log', icon: 'Article' },
];

export const UserViewPage: FC = () => {
	const { id: rawId } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const {
		canRead,
		canUpdate,
		canDelete,
		canReview,
		hasPermission,
		isLoadingPermissions,
	} = usePermission();

	// DECRYPT ID FROM URL
	const decryptedId = useMemo(() => decryptId(rawId), [rawId]);

	const [user, setUser] = useState<IUserItem | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [activeTab, setActiveTab] = useState<TUserDetailTab>('overview');

	// MODALS & ACTIONS STATE
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);
	const [isStatusChanging, setIsStatusChanging] = useState<boolean>(false);
	const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);

	// KYC TAB LAZY LOADING STATE
	const [kycDetail, setKycDetail] = useState<IKycDetailsResponseData | null>(null);
	const [isKycLoading, setIsKycLoading] = useState<boolean>(false);
	const [kycFetchError, setKycFetchError] = useState<string | null>(null);
	const hasFetchedKycRef = useRef<boolean>(false);

	// SESSIONS TAB LAZY LOADING & PAGINATION STATE
	const [sessions, setSessions] = useState<ISessionItem[]>([]);
	const [sessionsPage, setSessionsPage] = useState<number>(1);
	const [sessionsLimit, setSessionsLimit] = useState<number>(10);
	const [totalSessions, setTotalSessions] = useState<number>(0);
	const [isSessionsLoading, setIsSessionsLoading] = useState<boolean>(false);
	const [sessionsFetchError, setSessionsFetchError] = useState<string | null>(null);
	const hasFetchedSessionsRef = useRef<boolean>(false);

	// BLOCK HISTORY TAB LAZY LOADING & PAGINATION STATE
	const [blockHistories, setBlockHistories] = useState<IBlockHistoryItem[]>([]);
	const [blockHistoryPage, setBlockHistoryPage] = useState<number>(1);
	const [blockHistoryLimit, setBlockHistoryLimit] = useState<number>(10);
	const [totalBlockHistories, setTotalBlockHistories] = useState<number>(0);
	const [isBlockHistoryLoading, setIsBlockHistoryLoading] = useState<boolean>(false);
	const [blockHistoryFetchError, setBlockHistoryFetchError] = useState<string | null>(null);
	const hasFetchedBlockHistoryRef = useRef<boolean>(false);

	// KYC APPROVE & REJECT REVIEW STATE
	const [reviewTarget, setReviewTarget] = useState<{
		type: 'overall' | 'document';
		id: number | string;
		name: string;
	} | null>(null);
	const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
	const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
	const [rejectRemark, setRejectRemark] = useState<string>('');
	const [rejectError, setRejectError] = useState<string>('');
	const [isUpdatingKycStatus, setIsUpdatingKycStatus] = useState<boolean>(false);

	// ATTACHMENT PREVIEW MODAL STATE
	const [previewModal, setPreviewModal] = useState<{
		isOpen: boolean;
		imageUrl: string;
		title: string;
	}>({
		isOpen: false,
		imageUrl: '',
		title: '',
	});

	const fetchedIdRef = useRef<string>('');
	const isFetchingRef = useRef<boolean>(false);

	// REDIRECT TO 404 IF NO PERMISSIONS OR INVALID ID
	useEffect(() => {
		if (
			!isLoadingPermissions &&
			!canRead(PERMISSION_KEYS.USERS) &&
			!canRead(PERMISSION_KEYS.USER) &&
			!canRead(PERMISSION_KEYS.USER_MANAGEMENT)
		) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
			return;
		}

		if (!rawId || (rawId && !decryptedId)) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [isLoadingPermissions, canRead, rawId, decryptedId, navigate]);

	// FETCH USER DETAILS WITH FULL METADATA (detail=true)
	const fetchUserDetails = useCallback(async () => {
		if (!decryptedId || isFetchingRef.current || fetchedIdRef.current === decryptedId) {
			return;
		}

		isFetchingRef.current = true;
		fetchedIdRef.current = decryptedId;
		setIsLoading(true);

		try {
			const res = await userService.getUserById(decryptedId, { detail: true });
			if (res && res.data) {
				setUser(res.data);
			} else {
				showNotification('Error', 'User details not found', 'danger');
				navigate(`/${PAGE_ROUTES.USERS}`, { replace: true });
			}
		} catch (error: any) {
			showNotification(
				'Error loading user',
				error?.data?.message || error?.message || 'Could not fetch user details',
				'danger',
			);
			navigate(`/${PAGE_ROUTES.USERS}`, { replace: true });
		} finally {
			setIsLoading(false);
			isFetchingRef.current = false;
		}
	}, [decryptedId, navigate]);

	useEffect(() => {
		if (
			decryptedId &&
			!isLoadingPermissions &&
			(canRead(PERMISSION_KEYS.USERS) ||
				canRead(PERMISSION_KEYS.USER) ||
				canRead(PERMISSION_KEYS.USER_MANAGEMENT)) &&
			fetchedIdRef.current !== decryptedId
		) {
			fetchUserDetails();
		}
	}, [decryptedId, isLoadingPermissions, canRead, fetchUserDetails]);

	// LAZY FETCH USER KYC DETAILS
	const fetchUserKyc = useCallback(
		async (userId?: number | string) => {
			const targetId = userId || decryptedId || user?.id;
			if (!targetId) return;
			try {
				setIsKycLoading(true);
				setKycFetchError(null);
				const res = await kycService.getUserKycDetails(targetId);
				if (res && res.data) {
					setKycDetail(res.data);
					hasFetchedKycRef.current = true;
				}
			} catch (err: any) {
				setKycFetchError(
					err?.data?.message || err?.message || 'Failed to load user KYC details.',
				);
			} finally {
				setIsKycLoading(false);
			}
		},
		[decryptedId, user?.id],
	);

	useEffect(() => {
		const targetId = decryptedId || user?.id;
		if (activeTab === 'kyc' && !hasFetchedKycRef.current && targetId) {
			fetchUserKyc(targetId);
		}
	}, [activeTab, decryptedId, user?.id, fetchUserKyc]);

	// LAZY FETCH USER LOGIN SESSIONS HISTORY
	const fetchUserSessions = useCallback(
		async (userId?: number | string, page?: number, limit?: number) => {
			const targetId = userId || decryptedId || user?.id;
			if (!targetId) return;
			const targetPage = page ?? sessionsPage;
			const targetLimit = limit ?? sessionsLimit;
			try {
				setIsSessionsLoading(true);
				setSessionsFetchError(null);
				const res = await userService.getUserLoginHistory(targetId, {
					page: targetPage,
					limit: targetLimit,
				});
				if (res) {
					const list = Array.isArray(res.data)
						? res.data
						: (res.data as any)?.data && Array.isArray((res.data as any).data)
							? (res.data as any).data
							: [];
					setSessions(list);
					const total =
						res.total_document ??
						(res as any)?.total ??
						(res as any)?.total_count ??
						(res.data as any)?.total_document ??
						list.length;
					setTotalSessions(Number(total) || list.length);
					hasFetchedSessionsRef.current = true;
				} else {
					setSessions([]);
					setTotalSessions(0);
					hasFetchedSessionsRef.current = true;
				}
			} catch (err: any) {
				const errMsg = err?.data?.message || err?.message || '';
				if (
					errMsg.includes('Unexpected non-whitespace character') ||
					errMsg.includes('JSON') ||
					err?.status === 404
				) {
					setSessions([]);
					setTotalSessions(0);
					setSessionsFetchError(null);
					hasFetchedSessionsRef.current = true;
				} else {
					setSessionsFetchError(errMsg || 'Failed to load user login history.');
				}
			} finally {
				setIsSessionsLoading(false);
			}
		},
		[decryptedId, user?.id, sessionsPage, sessionsLimit],
	);

	useEffect(() => {
		const targetId = decryptedId || user?.id;
		if (activeTab === 'sessions' && targetId) {
			fetchUserSessions(targetId, sessionsPage, sessionsLimit);
		}
	}, [activeTab, decryptedId, user?.id, sessionsPage, sessionsLimit, fetchUserSessions]);

	// LAZY FETCH USER BLOCK HISTORY
	const fetchUserBlockHistory = useCallback(
		async (userId?: number | string, page?: number, limit?: number) => {
			const targetId = userId || decryptedId || user?.id;
			if (!targetId) return;
			const targetPage = page ?? blockHistoryPage;
			const targetLimit = limit ?? blockHistoryLimit;
			try {
				setIsBlockHistoryLoading(true);
				setBlockHistoryFetchError(null);
				const res = await blockHistoryService.getBlockHistoryByUser(targetId, {
					page: targetPage,
					limit: targetLimit,
				});
				if (res) {
					const list = Array.isArray(res.data)
						? res.data
						: (res.data as any)?.data && Array.isArray((res.data as any).data)
							? (res.data as any).data
							: [];
					setBlockHistories(list);
					const total =
						res.total_document ??
						(res as any)?.total ??
						(res as any)?.total_count ??
						(res.data as any)?.total_document ??
						list.length;
					setTotalBlockHistories(Number(total) || list.length);
					hasFetchedBlockHistoryRef.current = true;
				} else {
					setBlockHistories([]);
					setTotalBlockHistories(0);
					hasFetchedBlockHistoryRef.current = true;
				}
			} catch (err: any) {
				const errMsg = err?.data?.message || err?.message || '';
				if (
					errMsg.includes('Unexpected non-whitespace character') ||
					errMsg.includes('JSON') ||
					err?.status === 404
				) {
					setBlockHistories([]);
					setTotalBlockHistories(0);
					setBlockHistoryFetchError(null);
					hasFetchedBlockHistoryRef.current = true;
				} else {
					setBlockHistoryFetchError(errMsg || 'Failed to load user block history.');
				}
			} finally {
				setIsBlockHistoryLoading(false);
			}
		},
		[decryptedId, user?.id, blockHistoryPage, blockHistoryLimit],
	);

	useEffect(() => {
		const targetId = decryptedId || user?.id;
		if (activeTab === 'block_history' && targetId) {
			fetchUserBlockHistory(targetId, blockHistoryPage, blockHistoryLimit);
		}
	}, [activeTab, decryptedId, user?.id, blockHistoryPage, blockHistoryLimit, fetchUserBlockHistory]);

	// CAN REVIEW / APPROVE / REJECT PERMISSION CHECK
	const canReviewPermission =
		Boolean(canReview && canReview(PERMISSION_KEYS.KYC_REQUEST)) ||
		Boolean(canReview && canReview('kyc_requests')) ||
		Boolean(canReview && canReview('kyc')) ||
		Boolean(hasPermission && hasPermission(PERMISSION_KEYS.KYC_REQUEST, 'review')) ||
		Boolean(hasPermission && hasPermission(PERMISSION_KEYS.KYC_REQUEST, 'approve')) ||
		Boolean(hasPermission && hasPermission(PERMISSION_KEYS.KYC_REQUEST, 'update')) ||
		Boolean(hasPermission && hasPermission(PERMISSION_KEYS.KYC_REQUEST, 'edit')) ||
		Boolean(hasPermission && hasPermission('kyc_requests', 'review')) ||
		Boolean(hasPermission && hasPermission('kyc_requests', 'approve')) ||
		Boolean(hasPermission && hasPermission('kyc_requests', 'update')) ||
		Boolean(hasPermission && hasPermission('kyc', 'review')) ||
		Boolean(hasPermission && hasPermission('kyc', 'approve')) ||
		Boolean(hasPermission && hasPermission('kyc', 'update')) ||
		canUpdate(PERMISSION_KEYS.KYC_REQUEST) ||
		canUpdate(PERMISSION_KEYS.USER_MANAGEMENT);

	// HANDLE APPROVE KYC CONFIRM (DOCUMENT OR OVERALL REQUEST)
	const handleApproveKycConfirm = async () => {
		if (!reviewTarget || !reviewTarget.id) return;
		setIsUpdatingKycStatus(true);
		try {
			const res = await kycService.updateKycRequestStatus(reviewTarget.id, {
				status: 'approved',
			});
			showNotification(
				'Approved',
				res?.message || `${reviewTarget.name} approved successfully.`,
				'success',
			);
			setIsApproveModalOpen(false);
			setReviewTarget(null);
			const targetUserId = decryptedId || user?.id;
			if (targetUserId) {
				fetchUserKyc(targetUserId);
			}
		} catch (error: any) {
			showNotification(
				'Approval Failed',
				error?.data?.message || error?.message || 'Could not approve KYC.',
				'danger',
			);
		} finally {
			setIsUpdatingKycStatus(false);
		}
	};

	// HANDLE REJECT KYC SUBMIT (DOCUMENT OR OVERALL REQUEST)
	const handleRejectKycSubmit = async () => {
		if (!rejectRemark.trim()) {
			setRejectError('Please enter a rejection reason.');
			return;
		}
		if (!reviewTarget || !reviewTarget.id) return;
		setIsUpdatingKycStatus(true);
		try {
			const res = await kycService.updateKycRequestStatus(reviewTarget.id, {
				status: 'rejected',
				remark: rejectRemark.trim(),
			});
			showNotification(
				'Rejected',
				res?.message || `${reviewTarget.name} rejected successfully.`,
				'success',
			);
			setIsRejectModalOpen(false);
			setRejectRemark('');
			setRejectError('');
			setReviewTarget(null);
			const targetUserId = decryptedId || user?.id;
			if (targetUserId) {
				fetchUserKyc(targetUserId);
			}
		} catch (error: any) {
			showNotification(
				'Rejection Failed',
				error?.data?.message || error?.message || 'Could not reject KYC.',
				'danger',
			);
		} finally {
			setIsUpdatingKycStatus(false);
		}
	};

	// BLOCK / UNBLOCK CONFIRMATION HANDLER
	const handleBlockUnblockConfirm = async (reason: string) => {
		if (!user || isStatusChanging) return;
		const isCurrentlyActive = user.status === 'active';
		const action: 'block' | 'unblock' = isCurrentlyActive ? 'block' : 'unblock';
		const newStatus = isCurrentlyActive ? 'blocked' : 'active';
		setIsStatusChanging(true);
		try {
			const res = await userService.blockUnblockUser(user.id, {
				action,
				reason: reason.trim() || undefined,
			});
			setUser({ ...user, status: newStatus });
			showNotification(
				'Status Updated',
				res?.message || `User ${action === 'block' ? 'blocked' : 'unblocked'} successfully.`,
				'success',
			);
			setIsBlockModalOpen(false);
			fetchUserBlockHistory(user.id, 1, blockHistoryLimit);
		} catch (error: any) {
			showNotification(
				'Status Update Failed',
				error?.data?.message || error?.message || 'Failed to update user status.',
				'danger',
			);
		} finally {
			setIsStatusChanging(false);
		}
	};

	// DELETE USER HANDLER
	const handleDeleteUser = async () => {
		if (!user || isDeleting) return;
		setIsDeleting(true);
		try {
			const res = await userService.deleteUser(user.id);
			showNotification('Success', res?.message || 'User removed successfully.', 'success');
			setIsDeleteModalOpen(false);
			navigate(`/${PAGE_ROUTES.USERS}`);
		} catch (error: any) {
			showNotification(
				'Delete Failed',
				error?.data?.message || error?.message || 'Failed to delete user.',
				'danger',
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// GET INITIALS
	const getInitials = (name?: string) => {
		if (!name) return 'U';
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	};

	if (isLoading) {
		return (
			<PageWrapper title="User Details" permissionKey={PERMISSION_KEYS.USERS}>
				<Page container="fluid">
					<div
						className="d-flex flex-column align-items-center justify-content-center py-5"
						style={{ minHeight: '60vh' }}>
						<Spinner color="primary" size="3rem" isGrow={false} />
						<span className="text-muted small mt-3">Loading user details...</span>
					</div>
				</Page>
			</PageWrapper>
		);
	}

	if (!user) {
		return null;
	}

	const roleName = user.role?.role_name || (user as any).role_name || 'Retailer';
	const statusLower = (user.status || 'active').toLowerCase();
	const createdFormatted = user.created_at ? formatDateTime(user.created_at) : null;
	const updatedFormatted = user.updated_at ? formatDateTime(user.updated_at) : null;
	const lastLoginFormatted = user.last_login_at ? formatDateTime(user.last_login_at) : null;
	const emailVerifiedFormatted = user.email_verified_at ? formatDateTime(user.email_verified_at) : null;
	const mobileVerifiedFormatted = user.mobile_verified_at ? formatDateTime(user.mobile_verified_at) : null;
	const { parent: parentUser, profile } = user;
	const stateName = profile?.state?.name || '-';

	const isEmailVerified = user.is_email_verified ?? true;
	const isMobileVerified = user.is_mobile_verified ?? true;
	const kycStatus = user.kyc_status || user.kyc?.status || 'not_submitted';

	const numericBalance = Number(user.current_balance || 0);
	const formattedBalance = numericBalance.toLocaleString('en-IN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	return (
		<PageWrapper title={`User Details - ${user.name}`} permissionKey={PERMISSION_KEYS.USERS}>
			<Page container="fluid">
				<div className="user-view-page">
					{/* TOP BREADCRUMBS & TOP HEADER ACTIONS */}
					<div className="user-view-breadcrumbs-bar d-flex align-items-center justify-content-between flex-wrap gap-2">
						<AppBreadcrumbs
							items={[
								{ label: 'User Management' },
								{ label: 'Admins', to: `/${PAGE_ROUTES.USERS}` },
								{ label: 'User Details', current: true },
							]}
						/>
						<div className="d-flex align-items-center gap-2">
							<button
								type="button"
								className="btn-header-back"
								onClick={() => navigate(`/${PAGE_ROUTES.USERS}`)}>
								<Icon icon="ArrowBack" size="sm" />
								<span>Back</span>
							</button>
							<button
								type="button"
								className={statusLower === 'active' ? 'btn-header-block' : 'btn-header-activate'}
								disabled={isStatusChanging}
								onClick={() => setIsBlockModalOpen(true)}>
								<Icon
									icon={statusLower === 'active' ? 'Block' : 'CheckCircle'}
									size="sm"
								/>
								<span>{statusLower === 'active' ? 'Block User' : 'Activate User'}</span>
							</button>
							{canUpdate(PERMISSION_KEYS.USERS) && (
								<button
									type="button"
									className="btn-header-edit"
									onClick={() =>
										navigate(`/${PAGE_ROUTES.USERS_EDIT.replace(':id', encryptId(user.id))}`)
									}>
									<Icon icon="Edit" size="sm" />
									<span>Edit User</span>
								</button>
							)}
						</div>
					</div>

					{/* 1. HERO PROFILE CARD WITH CURRENT BALANCE WIDGET */}
					<div className="user-hero-card">
						<div className="hero-left-section">
							{/* USER AVATAR */}
							<div className="hero-avatar-wrapper">
								{user.profile_picture ? (
									<img
										src={user.profile_picture}
										alt={user.name}
										onError={(e) => {
											(e.target as HTMLElement).style.display = 'none';
										}}
									/>
								) : (
									<span>{getInitials(user.name)}</span>
								)}
							</div>

							{/* USER METADATA */}
							<div className="hero-info-text">
								<div className="name-and-status">
									<h1 className="hero-user-name">{user.name}</h1>
									<span
										className={`status-pill-badge ${statusLower === 'active'
												? 'status-active'
												: statusLower === 'blocked'
													? 'status-blocked'
													: 'status-inactive'
											}`}>
										{statusLower.charAt(0).toUpperCase() + statusLower.slice(1)}
									</span>
								</div>

								<div className="hero-username">@{user.username}</div>

								<div className="hero-metadata-row">
									{user.mobile_number && (
										<span className="meta-item">
											<Icon icon="Phone" size="sm" className="meta-icon" />
											<span>{user.mobile_number}</span>
										</span>
									)}
									{user.email_address && (
										<span className="meta-item">
											<Icon icon="Email" size="sm" className="meta-icon" />
											<span>{user.email_address}</span>
										</span>
									)}
									{user.company_name && (
										<span className="meta-item">
											<Icon icon="Business" size="sm" className="meta-icon" />
											<span>{user.company_name}</span>
										</span>
									)}
								</div>

								<div className="hero-role-row">
									<span className="hero-role-pill">
										<Icon icon="Shield" size="sm" />
										{roleName}
									</span>
								</div>
							</div>
						</div>

						{/* HERO RIGHT AREA: CURRENT BALANCE WIDGET */}
						<div className="hero-right-actions">
							<div className="hero-balance-widget">
								<div className="balance-icon-wrap">
									<Icon icon="AccountBalanceWallet" />
								</div>
								<div className="balance-info-wrap">
									<span className="balance-label">Current Balance</span>
									<span className="balance-amount">₹ {formattedBalance}</span>
								</div>
							</div>
						</div>
					</div>

					{/* 2. HORIZONTAL NAVIGATION TABS */}
					<div className="user-nav-tabs-bar">
						{USER_DETAIL_TABS.map((tab) => (
							<button
								key={tab.id}
								type="button"
								className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
								onClick={() => setActiveTab(tab.id)}>
								<Icon icon={tab.icon} size="sm" className="tab-icon" />
								<span>{tab.label}</span>
							</button>
						))}
					</div>

					{/* 3. TAB CONTENT */}
					{activeTab === 'overview' && (
						<div className="row g-4">
							{/* CARD 1: BASIC INFORMATION */}
							<div className="col-12 col-md-6">
								<div className="user-section-card">
									<div className="card-title-header">
										<div className="title-icon">
											<Icon icon="Person" />
										</div>
										<h3 className="card-main-title">Basic Information</h3>
									</div>
									<div className="field-rows-container">
										<div className="field-two-col-row">
											<div className="field-item">
												<span className="field-label">Name</span>
												<span className="field-value">{user.name}</span>
											</div>
											<div className="field-item">
												<span className="field-label">Username</span>
												<span className="field-value">{user.username}</span>
											</div>
										</div>
										<div className="field-two-col-row">
											<div className="field-item">
												<span className="field-label">Company Name</span>
												<span
													className={`field-value ${!user.company_name ? 'empty-val' : ''
														}`}>
													{user.company_name || '-'}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* CARD 2: CONTACT INFORMATION */}
							<div className="col-12 col-md-6">
								<div className="user-section-card">
									<div className="card-title-header">
										<div className="title-icon">
											<Icon icon="Phone" />
										</div>
										<h3 className="card-main-title">Contact Information</h3>
									</div>
									<div className="field-rows-container">
										<div className="field-item">
											<div className="d-flex align-items-center gap-2">
												<span className="field-label mb-0">Mobile Number</span>
												{isMobileVerified && (
													<span className="verified-tag">
														<Icon icon="Check" size="sm" /> Verified
													</span>
												)}
											</div>
											<div className="field-value">
												<span>
													{user.mobile_number
														? user.mobile_number.startsWith('+')
															? user.mobile_number
															: `+91 ${user.mobile_number}`
														: '-'}
												</span>
											</div>
										</div>
										<div className="field-item">
											<div className="d-flex align-items-center gap-2">
												<span className="field-label mb-0">Email Address</span>
												{isEmailVerified && (
													<span className="verified-tag">
														<Icon icon="Check" size="sm" /> Verified
													</span>
												)}
											</div>
											<div className="field-value">
												<span>{user.email_address || '-'}</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* CARD 3: ACCOUNT & SECURITY */}
							<div className="col-12 col-md-6">
								<div className="user-section-card">
									<div className="card-title-header">
										<div className="title-icon">
											<Icon icon="Shield" />
										</div>
										<h3 className="card-main-title">Account & Security</h3>
									</div>
									<div className="field-rows-container">
										<div className="field-two-col-row">
											<div className="field-item">
												<span className="field-label">Role</span>
												<div className="field-value">
													<span className="hero-role-pill">{roleName}</span>
												</div>
											</div>
											<div className="field-item">
												<span className="field-label">Parent Admin</span>
												<span
													className={`field-value ${!parentUser ? 'empty-val' : ''
														}`}>
													{parentUser
														? `${parentUser.name} (@${parentUser.username})`
														: '-'}
												</span>
											</div>
										</div>
										<div className="field-two-col-row">
											<div className="field-item">
												<span className="field-label">Status</span>
												<div className="field-value">
													<span className="verified-tag">
														<Icon icon="Check" size="sm" />{' '}
														{statusLower.charAt(0).toUpperCase() +
															statusLower.slice(1)}
													</span>
												</div>
											</div>
											<div className="field-item">
												<span className="field-label">Last Login At</span>
												<span className="field-value">
													{lastLoginFormatted
														? `${lastLoginFormatted.date}, ${lastLoginFormatted.time}`
														: createdFormatted
															? `${createdFormatted.date}, ${createdFormatted.time}`
															: '-'}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* CARD 4: VERIFICATION STATUS */}
							<div className="col-12 col-md-6">
								<div className="user-section-card">
									<div className="card-title-header">
										<div className="title-icon text-success">
											<Icon icon="CheckCircle" />
										</div>
										<h3 className="card-main-title">Verification Status</h3>
									</div>
									<div className="field-rows-container">
										<div className="field-item">
											<div className="d-flex align-items-center flex-wrap gap-2">
												<span className="field-label mb-0">Email Verified</span>
												{isEmailVerified ? (
													<span className="verified-tag">
														<Icon icon="Check" size="sm" /> Yes
													</span>
												) : (
													<span className="not-verified-tag">No</span>
												)}
												<small className="text-muted">
													({emailVerifiedFormatted
														? `${emailVerifiedFormatted.date}, ${emailVerifiedFormatted.time}`
														: createdFormatted
															? `${createdFormatted.date}, ${createdFormatted.time}`
															: '-'})
												</small>
											</div>
										</div>
										<div className="field-item">
											<div className="d-flex align-items-center flex-wrap gap-2">
												<span className="field-label mb-0">Mobile Verified</span>
												{isMobileVerified ? (
													<span className="verified-tag">
														<Icon icon="Check" size="sm" /> Yes
													</span>
												) : (
													<span className="not-verified-tag">No</span>
												)}
												<small className="text-muted">
													({mobileVerifiedFormatted
														? `${mobileVerifiedFormatted.date}, ${mobileVerifiedFormatted.time}`
														: createdFormatted
															? `${createdFormatted.date}, ${createdFormatted.time}`
															: '-'})
												</small>
											</div>
										</div>
										<div className="field-item">
											<div className="d-flex align-items-center flex-wrap gap-2">
												<span className="field-label mb-0">KYC Status</span>
												<span
													className={
														kycStatus === 'verified' || kycStatus === 'approved'
															? 'verified-tag'
															: 'not-verified-tag'
													}>
													<Icon icon="Info" size="sm" className="me-1" />
													{kycStatus === 'not_submitted'
														? 'Not Submitted'
														: kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* PROFILE TAB */}
					{activeTab === 'profile' && (
						<div className="row g-4">
							<div className="col-12">
								<div className="user-section-card">
									<div className="card-title-header">
										<div className="title-icon">
											<Icon icon="LocationOn" />
										</div>
										<h3 className="card-main-title">Location & Address Details</h3>
									</div>
									<div className="field-rows-container">
										<div className="field-two-col-row">
											<div className="field-item">
												<span className="field-label">State</span>
												<span
													className={`field-value ${stateName === '-' ? 'empty-val' : ''
														}`}>
													{stateName}
												</span>
											</div>
											<div className="field-item">
												<span className="field-label">City</span>
												<span
													className={`field-value ${!profile?.city ? 'empty-val' : ''
														}`}>
													{profile?.city || '-'}
												</span>
											</div>
										</div>
										<div className="field-two-col-row">
											<div className="field-item">
												<span className="field-label">Postal Code</span>
												<span
													className={`field-value ${!profile?.postal_code ? 'empty-val' : ''
														}`}>
													{profile?.postal_code || '-'}
												</span>
											</div>
											<div className="field-item">
												<span className="field-label">Address</span>
												<span
													className={`field-value ${!profile?.address ? 'empty-val' : ''
														}`}>
													{profile?.address || '-'}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* KYC TAB */}
					{activeTab === 'kyc' && (
						<div className="row g-4">
							{/* TOP KYC SUMMARY CARD */}
							<div className="col-12">
								<div className="user-section-card">
									<div className="card-title-header d-flex align-items-center justify-content-between flex-wrap gap-2">
										<div className="d-flex align-items-center gap-2">
											<div className="title-icon">
												<Icon icon="Assignment" />
											</div>
											<h3 className="card-main-title">KYC Verification Summary</h3>
										</div>
										<div className="d-flex align-items-center gap-2 flex-wrap">
											<span
												className={getKycStatusBadgeClass(
													kycDetail?.kyc_status ||
													user.kyc_status ||
													user.kyc?.status ||
													'not_submitted',
												)}>
												<Icon
													icon={
														(kycDetail?.kyc_status ||
															user.kyc_status ||
															user.kyc?.status) === 'approved' ||
															(kycDetail?.kyc_status ||
																user.kyc_status ||
																user.kyc?.status) === 'verified'
															? 'CheckCircle'
															: (kycDetail?.kyc_status ||
																user.kyc_status ||
																user.kyc?.status) === 'rejected'
																? 'Cancel'
																: 'Info'
													}
													size="sm"
												/>
												{getKycStatusLabel(
													kycDetail?.kyc_status ||
													user.kyc_status ||
													user.kyc?.status ||
													'not_submitted',
												)}
											</span>
										</div>
									</div>

									<div className="field-rows-container">
										<div className="field-two-col-row">
											<div className="field-item">
												<span className="field-label">Submission Date</span>
												<span className="field-value">
													{kycDetail?.submitted_at
														? `${formatDateTime(kycDetail.submitted_at).date}, ${formatDateTime(kycDetail.submitted_at).time
														}`
														: user.kyc?.submitted_at
															? `${formatDateTime(user.kyc.submitted_at).date}, ${formatDateTime(user.kyc.submitted_at).time
															}`
															: '-'}
												</span>
											</div>
											<div className="field-item">
												<span className="field-label">Verification Date</span>
												<span className="field-value">
													{kycDetail?.verified_at
														? `${formatDateTime(kycDetail.verified_at).date}, ${formatDateTime(kycDetail.verified_at).time
														}`
														: '-'}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* KYC LOADING SPINNER */}
							{isKycLoading && (
								<div className="col-12">
									<div className="d-flex flex-column align-items-center justify-content-center py-5 bg-white rounded-3 border">
										<Spinner color="primary" size="2.5rem" isGrow={false} />
										<span className="text-muted small mt-2">
											Loading submitted KYC documents...
										</span>
									</div>
								</div>
							)}

							{/* KYC FETCH ERROR */}
							{!isKycLoading && kycFetchError && (
								<div className="col-12">
									<div className="alert alert-danger d-flex align-items-center justify-content-between flex-wrap gap-2">
										<div className="d-flex align-items-center gap-2">
											<Icon icon="ErrorOutline" size="sm" />
											<span>{kycFetchError}</span>
										</div>
										<button
											type="button"
											className="btn btn-sm btn-outline-danger"
											onClick={() => {
												const targetId = decryptedId || user?.id;
												if (targetId) fetchUserKyc(targetId);
											}}>
											<Icon icon="Refresh" size="sm" className="me-1" />
											Retry
										</button>
									</div>
								</div>
							)}

							{/* SUBMITTED DOCUMENT CARDS */}
							{!isKycLoading &&
								!kycFetchError &&
								(kycDetail?.documents && kycDetail.documents.length > 0 ? (
									kycDetail.documents.map((doc, docIdx) => {
										const docStatus = (doc.status || 'pending').toLowerCase();
										const fieldEntries = doc.field_values
											? Object.entries(doc.field_values).filter(
												([, val]) =>
													val !== null &&
													val !== undefined &&
													val !== '',
											)
											: [];
										const uploadedFiles = Array.isArray(doc.uploaded_files)
											? doc.uploaded_files
											: [];

										return (
											<div
												key={
													doc.document_id ||
													doc.requirement_id ||
													`doc_${docIdx}`
												}
												className={
													kycDetail.documents.length === 1
														? 'col-12'
														: 'col-12 col-lg-6'
												}>
												<div className="kyc-doc-card">
													{/* DOCUMENT HEADER */}
													<div className="kyc-doc-header">
														<div className="kyc-doc-title-wrap">
															<Icon
																icon="Description"
																className="text-primary"
															/>
															<h4 className="kyc-doc-name">
																{doc.document_name}
															</h4>
															{doc.document_code && (
																<span className="kyc-doc-code">
																	{doc.document_code}
																</span>
															)}
															{doc.is_mandatory ? (
																<span className="kyc-mandatory-tag">
																	Mandatory
																</span>
															) : (
																<span className="kyc-optional-tag">
																	Optional
																</span>
															)}
														</div>
														<div className="d-flex align-items-center gap-2 flex-wrap">
															<span
																className={getKycStatusBadgeClass(
																	docStatus,
																)}>
																<Icon
																	icon={
																		docStatus === 'verified' ||
																			docStatus === 'approved'
																			? 'CheckCircle'
																			: docStatus === 'rejected'
																				? 'Cancel'
																				: 'Schedule'
																	}
																	size="sm"
																/>
																{getKycStatusLabel(docStatus)}
															</span>
															{canReviewPermission && (
																<>
																	{docStatus !== 'verified' &&
																		docStatus !== 'approved' && (
																			<button
																				type="button"
																				className="btn-kyc-approve"
																				title="Approve Document"
																				onClick={() => {
																					const targetId = (doc.id ||
																						doc.document_id ||
																						doc.requirement_id ||
																						'') as string | number;
																					if (targetId) {
																						setReviewTarget({
																							type: 'document',
																							id: targetId,
																							name: doc.document_name,
																						});
																						setIsApproveModalOpen(true);
																					}
																				}}>
																				<Icon icon="Check" size="sm" />
																				<span>Approve</span>
																			</button>
																		)}
																	{docStatus !== 'rejected' && (
																		<button
																			type="button"
																			className="btn-kyc-reject"
																			title="Reject Document"
																			onClick={() => {
																				const targetId = (doc.id ||
																					doc.document_id ||
																					doc.requirement_id ||
																					'') as string | number;
																				if (targetId) {
																					setReviewTarget({
																						type: 'document',
																						id: targetId,
																						name: doc.document_name,
																					});
																					setRejectRemark(
																						doc.rejection_reason || '',
																					);
																					setRejectError('');
																					setIsRejectModalOpen(true);
																				}
																			}}>
																			<Icon icon="Close" size="sm" />
																			<span>Reject</span>
																		</button>
																	)}
																</>
															)}
														</div>
													</div>

													{/* DOCUMENT BODY */}
													<div className="kyc-doc-body">
														{/* DOCUMENT REJECTION REASON IF ANY */}
														{doc.rejection_reason && (
															<div className="alert alert-danger d-flex align-items-start gap-2 mb-0">
																<Icon
																	icon="Warning"
																	size="sm"
																	className="mt-1 flex-shrink-0"
																/>
																<div className="small">
																	<strong>
																		Document Rejection Reason:
																	</strong>{' '}
																	{doc.rejection_reason}
																</div>
															</div>
														)}

														{/* SUBMITTED FIELDS */}
														{fieldEntries.length > 0 && (
															<div className="kyc-fields-section">
																<div className="section-sub-title">
																	<Icon icon="Dataset" size="sm" />
																	Submitted Information
																</div>
																<div className="row g-3">
																	{fieldEntries.map(([key, value]) => (
																		<div
																			key={key}
																			className={
																				fieldEntries.length === 1
																					? 'col-12'
																					: 'col-12 col-sm-6'
																			}>
																			<div className="kyc-field-box">
																				<span className="field-label">
																					{formatKeyLabel(key)}
																				</span>
																				<span className="field-value">
																					{typeof value === 'object'
																						? JSON.stringify(value)
																						: String(value)}
																				</span>
																			</div>
																		</div>
																	))}
																</div>
															</div>
														)}

														{/* UPLOADED ATTACHMENTS */}
														{uploadedFiles.length > 0 && (
															<div className="kyc-attachments-section">
																<div className="section-sub-title">
																	<Icon icon="AttachFile" size="sm" />
																	Uploaded Files ({uploadedFiles.length})
																</div>
																<div className="row g-3">
																	{uploadedFiles.map(
																		(fileUrl, fIdx) => {
																			const fullUrl =
																				getImageUrl(fileUrl);
																			const isPdf =
																				/\.pdf$/i.test(fileUrl);

																			const handleFileClick = () => {
																				if (isPdf) {
																					window.open(
																						fullUrl,
																						'_blank',
																					);
																				} else {
																					setPreviewModal({
																						isOpen: true,
																						imageUrl: fullUrl,
																						title: `${doc.document_name} - File #${fIdx + 1
																							}`,
																					});
																				}
																			};

																			return (
																				<div
																					key={
																						fileUrl ||
																						`file_${fIdx}`
																					}
																					className="col-6 col-sm-6 col-md-4 col-lg-6 col-xl-4">
																					<div
																						className="kyc-file-card"
																						role="button"
																						tabIndex={0}
																						onClick={
																							handleFileClick
																						}
																						onKeyDown={(
																							e,
																						) => {
																							if (
																								e.key ===
																								'Enter' ||
																								e.key ===
																								' '
																							) {
																								e.preventDefault();
																								handleFileClick();
																							}
																						}}>
																						{isPdf ? (
																							<Icon
																								icon="PictureAsPdf"
																								size="3x"
																								className="text-danger"
																							/>
																						) : (
																							<img
																								src={fullUrl}
																								alt={`File #${fIdx + 1
																									}`}
																								className="file-thumb"
																							/>
																						)}
																						<span className="file-name">
																							{isPdf
																								? 'Open PDF File'
																								: `View Image #${fIdx + 1
																								}`}
																						</span>
																					</div>
																				</div>
																			);
																		},
																	)}
																</div>
															</div>
														)}

														{fieldEntries.length === 0 &&
															uploadedFiles.length === 0 && (
																<div className="p-3 bg-light rounded text-muted small text-center">
																	No field values or attachments submitted
																	for this document yet.
																</div>
															)}
													</div>
												</div>
											</div>
										);
									})
								) : (
									<div className="col-12">
										<div className="p-4 bg-white rounded-3 border text-center text-muted">
											<Icon
												icon="AssignmentLate"
												size="2x"
												className="text-muted mb-2"
											/>
											<div className="fw-semibold">
												No KYC Documents Submitted
											</div>
											<div className="small">
												This user has not submitted any KYC documents yet.
											</div>
										</div>
									</div>
								))}
						</div>
					)}

					{/* WALLET TAB */}
					{activeTab === 'wallet' && (
						<div className="row g-4">
							<div className="col-12">
								<div className="user-section-card">
									<div className="card-title-header">
										<div className="title-icon">
											<Icon icon="AccountBalanceWallet" />
										</div>
										<h3 className="card-main-title">Wallet & Balance Details</h3>
									</div>
									<div className="field-rows-container">
										<div className="field-two-col-row">
											<div className="field-item">
												<span className="field-label">Current Available Balance</span>
												<span className="field-value fs-3 fw-bold text-success">
													₹ {formattedBalance}
												</span>
											</div>
											<div className="field-item">
												<span className="field-label">Currency</span>
												<span className="field-value">INR (₹) - Indian Rupee</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* SESSIONS TAB */}
					{activeTab === 'sessions' && (
						<div className="row g-4">

							<div className="col-12">
								<div className="user-section-card p-0 overflow-hidden">
									<div className="card-title-header d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 bg-white border-bottom">
										<div className="d-flex align-items-center gap-2">
											<div className="title-icon">
												<Icon icon="Schedule" />
											</div>
											<div>
												<h3 className="card-main-title mb-0">Recent Login Sessions</h3>
												<div className="text-muted small" style={{ fontSize: '0.8rem' }}>
													Device, OS, Browser, and IP access history
												</div>
											</div>
										</div>
										<div className="d-flex align-items-center gap-2 flex-wrap">
											{(totalSessions > 0 || sessions.length > 0) && (
												<span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold">
													{totalSessions || sessions.length} Recorded Session
													{(totalSessions || sessions.length) > 1 ? 's' : ''}
												</span>
											)}
											<button
												type="button"
												className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
												title="Refresh Sessions"
												onClick={() => {
													const targetId = decryptedId || user?.id;
													if (targetId)
														fetchUserSessions(targetId, sessionsPage, sessionsLimit);
												}}>
												<Icon icon="Refresh" size="sm" />
												<span>Refresh</span>
											</button>
										</div>
									</div>

									{isSessionsLoading && (
										<div className="d-flex flex-column align-items-center justify-content-center py-5">
											<Spinner color="primary" size="2.5rem" isGrow={false} />
											<span className="text-muted small mt-2">
												Loading login sessions...
											</span>
										</div>
									)}

									{!isSessionsLoading && sessionsFetchError && (
										<div className="p-4">
											<div className="alert alert-danger d-flex align-items-center justify-content-between flex-wrap gap-2 mb-0">
												<div className="d-flex align-items-center gap-2">
													<Icon icon="ErrorOutline" size="sm" />
													<span>{sessionsFetchError}</span>
												</div>
												<button
													type="button"
													className="btn btn-sm btn-outline-danger"
													onClick={() => {
														const targetId = decryptedId || user?.id;
														if (targetId)
															fetchUserSessions(
																targetId,
																sessionsPage,
																sessionsLimit,
															);
													}}>
													<Icon icon="Refresh" size="sm" className="me-1" />
													Retry
												</button>
											</div>
										</div>
									)}

									{!isSessionsLoading &&
										!sessionsFetchError &&
										(sessions.length > 0 ? (
											<div className="session-table-wrapper border-0 rounded-0">
												<div className="table-responsive">
													<table className="table session-table align-middle">
														<thead>
															<tr>
																<th>Device &amp; OS</th>
																<th>Browser</th>
																<th>IP Address</th>
																<th>User Agent</th>
																<th>Status</th>
																<th>Login Time</th>
															</tr>
														</thead>
														<tbody>
															{sessions.map((sess) => {
																const deviceTheme = getDeviceTheme(sess.device_type);
																const browserTheme = getBrowserTheme(sess.browser);
																const osDisplay = sess.os
																	? `${sess.os}${sess.os_version ? ` ${sess.os_version}` : ''}`
																	: 'Unknown OS';
																const browserDisplay = sess.browser
																	? `${sess.browser}${sess.browser_version ? ` v${sess.browser_version}` : ''
																	}`
																	: 'Unknown Browser';

																return (
																	<tr key={sess.id}>
																		<td>
																			<div className="session-device-box">
																				<div
																					className="device-avatar"
																					style={{
																						backgroundColor: deviceTheme.bg,
																						border: `1px solid ${deviceTheme.border}`,
																						color: deviceTheme.color,
																					}}>
																					<Icon icon={deviceTheme.icon} size="md" />
																				</div>
																				<div className="device-info">
																					<span className="os-title">{osDisplay}</span>
																					<span className="device-type-tag">
																						{sess.device_type || 'Desktop'}
																					</span>
																				</div>
																			</div>
																		</td>
																		<td>
																			<span
																				className="session-browser-badge"
																				style={{
																					backgroundColor: browserTheme.bg,
																					border: `1px solid ${browserTheme.border}`,
																					color: browserTheme.color,
																				}}>
																				<Icon icon={browserTheme.icon} size="sm" />
																				<span>{browserDisplay}</span>
																			</span>
																		</td>
																		<td>
																			<span className="session-ip-badge">
																				<Icon icon="Public" size="sm" className="text-secondary" />
																				<span>{sess.ip_address || '-'}</span>
																			</span>
																		</td>
																		<td>
																			{sess.user_agent ? (
																				<Tooltips
																					title={sess.user_agent}
																					placement="top">
																					<span className="session-ua-pill">
																						<span className="ua-text">
																							{sess.user_agent.length > 22
																								? `${sess.user_agent.substring(0, 22)}...`
																								: sess.user_agent}
																						</span>
																						<Icon
																							icon="Info"
																							size="sm"
																							className="text-primary flex-shrink-0"
																						/>
																					</span>
																				</Tooltips>
																			) : (
																				<span className="text-muted small">-</span>
																			)}
																		</td>
																		<td>
																			{sess.is_logout ? (
																				<span className="session-status-badge status-logout">
																					<span className="logout-dot" />
																					<span>Logged Out</span>
																				</span>
																			) : (
																				<span className="session-status-badge status-active">
																					<span className="pulse-dot" />
																					<span>Active</span>
																				</span>
																			)}
																		</td>
																		<td>
																			{sess.created_at ? (
																				<div className="d-flex flex-column">
																					<span
																						className="fw-medium text-dark"
																						style={{ fontSize: '0.8125rem' }}>
																						{formatDateTime(sess.created_at).date}
																					</span>
																					<span
																						className="text-muted"
																						style={{ fontSize: '0.75rem' }}>
																						{formatDateTime(sess.created_at).time}
																					</span>
																				</div>
																			) : (
																				<span className="text-muted small">-</span>
																			)}
																		</td>
																	</tr>
																);
															})}
														</tbody>
													</table>
												</div>
												{totalSessions > 0 && (
													<div className="p-3 border-top bg-light-subtle">
														<ListingPagination
															pagination={{
																currentPage: sessionsPage,
																totalItems: totalSessions,
																perPage: sessionsLimit,
																perPageOptions: [10, 25, 50, 100],
																onPageChange: (newPage: number) => {
																	setSessionsPage(newPage);
																},
																onPerPageChange: (newLimit: number) => {
																	setSessionsLimit(newLimit);
																	setSessionsPage(1);
																},
															}}
														/>
													</div>
												)}
											</div>
										) : (
											<div className="p-5 bg-light-subtle text-muted text-center">
												<div
													className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 mb-2 border"
													style={{ width: '60px', height: '60px' }}>
													<Icon
														icon="History"
														size="lg"
														className="text-secondary"
													/>
												</div>
												<div className="fw-bold text-dark fs-6">
													No Login Sessions Found
												</div>
												<div className="small text-muted">
													No authentication logs have been recorded for this account yet.
												</div>
											</div>
										))}
								</div>
							</div>
						</div>
					)}

					{/* BLOCK HISTORY TAB */}
					{activeTab === 'block_history' && (
						<div className="row g-4">
							<div className="col-12">
								<div className="user-section-card p-0 overflow-hidden">
									<div className="card-title-header px-4 pt-4 pb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
										<div className="d-flex align-items-center gap-3">
											<div className="title-icon bg-danger-subtle text-danger">
												<Icon icon="Block" />
											</div>
											<div>
												<h3 className="card-main-title mb-0">Block &amp; Unblock Audit History</h3>
												<span className="text-muted small" style={{ fontSize: '0.8125rem' }}>
													Complete record of account status restrictions and restorations
												</span>
											</div>
										</div>
										<button
											type="button"
											className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
											onClick={() => {
												const targetId = decryptedId || user?.id;
												if (targetId) fetchUserBlockHistory(targetId, blockHistoryPage, blockHistoryLimit);
											}}
											disabled={isBlockHistoryLoading}>
											<Icon icon="Refresh" size="sm" />
											<span>Refresh</span>
										</button>
									</div>

									{isBlockHistoryLoading ? (
										<div className="p-5 text-center bg-light-subtle">
											<Spinner size="lg" isGrow className="text-primary mb-2" />
											<div className="fw-medium text-muted">Loading block audit logs...</div>
										</div>
									) : blockHistoryFetchError ? (
										<div className="p-5 text-center bg-light-subtle">
											<div className="text-danger mb-2">
												<Icon icon="Error" size="lg" />
											</div>
											<div className="fw-bold text-dark mb-1">Failed to Load Block History</div>
											<div className="text-muted small mb-3">{blockHistoryFetchError}</div>
											<button
												type="button"
												className="btn btn-sm btn-primary"
												onClick={() => {
													const targetId = decryptedId || user?.id;
													if (targetId) fetchUserBlockHistory(targetId, blockHistoryPage, blockHistoryLimit);
												}}>
												Retry
											</button>
										</div>
									) : blockHistories && blockHistories.length > 0 ? (
										<div className="sessions-table-wrapper">
											<div className="table-responsive">
												<table className="table table-hover align-middle mb-0 custom-user-sessions-table">
													<thead>
														<tr>
															<th style={{ width: '160px' }}>Action</th>
															<th style={{ minWidth: '220px' }}>Reason / Remarks</th>
															<th style={{ minWidth: '220px' }}>Action Taken By</th>
															<th style={{ width: '190px' }}>Date &amp; Time</th>
														</tr>
													</thead>
													<tbody>
														{blockHistories.map((item) => {
															const isBlockAction = item.action === 'block';
															const { date, time } = formatDateTime(item.created_at);
															const actorName =
																item.action_by?.name ||
																(item.action_taken_by ? `Admin #${item.action_taken_by}` : 'System');
															const actorUsername = item.action_by?.username;

															return (
																<tr key={item.id}>
																	<td>
																		<span
																			className={`badge d-inline-flex align-items-center gap-1 px-3 py-2 ${
																				isBlockAction
																					? 'bg-danger-subtle text-danger border border-danger-subtle'
																					: 'bg-success-subtle text-success border border-success-subtle'
																			}`}
																			style={{ borderRadius: '50px', fontSize: '0.8125rem', fontWeight: 600 }}>
																			<Icon icon={isBlockAction ? 'Block' : 'CheckCircle'} size="sm" />
																			<span>{isBlockAction ? 'Blocked' : 'Unblocked'}</span>
																		</span>
																	</td>
																	<td>
																		<span
																			className="text-dark fw-medium"
																			style={{ fontSize: '0.875rem' }}>
																			{item.reason || <span className="text-muted fst-italic">No reason provided</span>}
																		</span>
																	</td>
																	<td>
																		<div className="d-flex align-items-center gap-2">
																			<div
																				className="rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold"
																				style={{
																					width: '34px',
																					height: '34px',
																					backgroundColor: '#eff6ff',
																					fontSize: '0.8rem',
																					border: '1px solid #dbeafe',
																				}}>
																				{actorName.slice(0, 2).toUpperCase()}
																			</div>
																			<div>
																				<div className="fw-semibold text-dark" style={{ fontSize: '0.875rem' }}>
																					{actorName}
																				</div>
																				<div className="d-flex align-items-center gap-1 small text-muted">
																					{actorUsername && <span>@{actorUsername}</span>}

																				</div>
																			</div>
																		</div>
																	</td>
																	<td>
																		{item.created_at ? (
																			<div className="d-flex flex-column">
																				<span
																					className="fw-medium text-dark"
																					style={{ fontSize: '0.8125rem' }}>
																					{date}
																				</span>
																				<span
																					className="text-muted"
																					style={{ fontSize: '0.75rem' }}>
																					{time}
																				</span>
																			</div>
																		) : (
																			<span className="text-muted small">-</span>
																		)}
																	</td>
																</tr>
															);
														})}
													</tbody>
												</table>
											</div>
											{totalBlockHistories > 0 && (
												<div className="p-3 border-top bg-light-subtle">
													<ListingPagination
														pagination={{
															currentPage: blockHistoryPage,
															totalItems: totalBlockHistories,
															perPage: blockHistoryLimit,
															perPageOptions: [10, 25, 50, 100],
															onPageChange: (newPage: number) => {
																setBlockHistoryPage(newPage);
															},
															onPerPageChange: (newLimit: number) => {
																setBlockHistoryLimit(newLimit);
																setBlockHistoryPage(1);
															},
														}}
													/>
												</div>
											)}
										</div>
									) : (
										<div className="p-5 bg-light-subtle text-muted text-center">
											<div
												className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3 mb-2 border"
												style={{ width: '60px', height: '60px' }}>
												<Icon icon="Shield" size="lg" className="text-secondary" />
											</div>
											<div className="fw-bold text-dark fs-6">No Block History Found</div>
											<div className="small text-muted">
												No block or unblock events have been recorded for this user account.
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* ACTIVITY LOG TAB */}
					{activeTab === 'activity_log' && (
						<div className="row g-4">
							<div className="col-12">
								<div className="user-section-card">
									<div className="card-title-header">
										<div className="title-icon">
											<Icon icon="Article" />
										</div>
										<h3 className="card-main-title">Account Event & Activity Log</h3>
									</div>
									<div className="field-rows-container">
										<div className="field-two-col-row">
											<div className="field-item">
												<span className="field-label">Account Created</span>
												<span className="field-value">
													{createdFormatted
														? `${createdFormatted.date}, ${createdFormatted.time}`
														: '-'}
												</span>
											</div>
											<div className="field-item">
												<span className="field-label">Last Profile Update</span>
												<span className="field-value">
													{updatedFormatted
														? `${updatedFormatted.date}, ${updatedFormatted.time}`
														: '-'}
												</span>
											</div>
										</div>
										<div className="field-two-col-row">
											<div className="field-item">
												<span className="field-label">Last Login Timestamp</span>
												<span className="field-value">
													{lastLoginFormatted
														? `${lastLoginFormatted.date}, ${lastLoginFormatted.time}`
														: '-'}
												</span>
											</div>
											<div className="field-item">
												<span className="field-label">Email Verified At</span>
												<span className="field-value">
													{emailVerifiedFormatted
														? `${emailVerifiedFormatted.date}, ${emailVerifiedFormatted.time}`
														: '-'}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* CONFIRMATION MODAL FOR DELETION */}
					<ConfirmationModal
						isOpen={isDeleteModalOpen}
						setIsOpen={setIsDeleteModalOpen}
						title="Confirmation Alert!"
						message={`Are you sure you want to remove user "${user.name}"?`}
						confirmText="Yes, Delete"
						cancelText="No"
						isLoading={isDeleting}
						onConfirm={handleDeleteUser}
						onCancel={() => setIsDeleteModalOpen(false)}
					/>

					{/* ATTACHMENT IMAGE PREVIEW MODAL */}
					<Modal
						isOpen={previewModal.isOpen}
						setIsOpen={(open: boolean) =>
							setPreviewModal((prev) => ({ ...prev, isOpen: open }))
						}
						size="lg"
						isCentered>
						<ModalHeader
							setIsOpen={(open: boolean) =>
								setPreviewModal((prev) => ({ ...prev, isOpen: open }))
							}>
							<ModalTitle id="kycAttachmentPreviewModalTitle">
								{previewModal.title || 'Attachment Preview'}
							</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className="text-center p-2">
								<img
									src={previewModal.imageUrl}
									alt={previewModal.title}
									className="img-fluid rounded"
									style={{ maxHeight: '75vh', objectFit: 'contain' }}
								/>
							</div>
						</ModalBody>
					</Modal>

					{/* KYC APPROVE CONFIRMATION MODAL */}
					<ConfirmationModal
						isOpen={isApproveModalOpen}
						setIsOpen={setIsApproveModalOpen}
						title={`Approve ${reviewTarget?.name || 'KYC'}`}
						message={`Are you sure you want to approve ${reviewTarget?.name ? `"${reviewTarget.name}"` : 'this KYC'
							} and mark the status as approved?`}
						confirmText="Yes, Approve"
						cancelText="Cancel"
						isLoading={isUpdatingKycStatus}
						onConfirm={handleApproveKycConfirm}
						onCancel={() => {
							setIsApproveModalOpen(false);
							setReviewTarget(null);
						}}
					/>

					{/* KYC REJECT WITH REMARK MODAL */}
					<Modal
						isOpen={isRejectModalOpen}
						setIsOpen={setIsRejectModalOpen}
						isCentered>
						<ModalHeader
							setIsOpen={setIsRejectModalOpen}
							className="border-bottom-0 pb-0 pt-4 px-4">
							<ModalTitle id="reject-kyc-modal-title">
								<div className="d-flex align-items-center gap-3">
									<div
										className="d-flex align-items-center justify-content-center rounded-3"
										style={{
											width: '44px',
											height: '44px',
											backgroundColor: '#fee2e2',
											color: '#dc2626',
											flexShrink: 0,
										}}>
										<Icon icon="Cancel" size="lg" />
									</div>
									<div>
										<h5 className="fw-bold mb-0 text-dark">
											Reject {reviewTarget?.name || 'KYC'}
										</h5>
										<span
											className="text-muted small"
											style={{ fontSize: '0.8125rem' }}>
											Specify the reason for rejection so the applicant knows
											what to fix.
										</span>
									</div>
								</div>
							</ModalTitle>
						</ModalHeader>
						<ModalBody className="px-4 py-3">
							<div>
								<label
									htmlFor="kycRejectionRemark"
									className="form-label fw-semibold small text-dark mb-1">
									Rejection Reason / Remark <span className="text-danger">*</span>
								</label>
								<textarea
									id="kycRejectionRemark"
									rows={4}
									className="form-control"
									placeholder="e.g. The uploaded document image is blurry and not clearly readable. Please upload a clear photo."
									value={rejectRemark}
									onChange={(e) => {
										setRejectRemark(e.target.value);
										if (rejectError) setRejectError('');
									}}
									style={{ fontWeight: 400, fontSize: '0.875rem' }}
								/>
								{rejectError && (
									<div className="text-danger small mt-1">{rejectError}</div>
								)}
							</div>
						</ModalBody>
						<ModalFooter className="px-4 py-3 border-top-0">
							<Button
								type="button"
								color="light"
								className="px-4 py-2"
								isDisable={isUpdatingKycStatus}
								onClick={() => {
									setIsRejectModalOpen(false);
									setRejectRemark('');
									setRejectError('');
									setReviewTarget(null);
								}}>
								Cancel
							</Button>
							<Button
								type="button"
								color="danger"
								className="px-4 py-2 d-inline-flex align-items-center gap-2"
								isDisable={isUpdatingKycStatus}
								onClick={handleRejectKycSubmit}>
								{isUpdatingKycStatus ? (
									<>
										<Spinner isSmall inButton isGrow className="me-1" />
										<span>Rejecting...</span>
									</>
								) : (
									<>
										<Icon icon="Close" />
										<span>Confirm Reject</span>
									</>
								)}
							</Button>
						</ModalFooter>
					</Modal>

					{/* BLOCK / UNBLOCK CONFIRMATION & REASON MODAL */}
					{user && (
						<BlockUnblockModal
							isOpen={isBlockModalOpen}
							setIsOpen={setIsBlockModalOpen}
							action={statusLower === 'active' ? 'block' : 'unblock'}
							userName={user.name}
							isLoading={isStatusChanging}
							onConfirm={handleBlockUnblockConfirm}
							onCancel={() => setIsBlockModalOpen(false)}
						/>
					)}
				</div>
			</Page>
		</PageWrapper>
	);
};

export default UserViewPage;
