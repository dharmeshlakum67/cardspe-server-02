import React, { FC, ReactNode, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button, { IButtonProps } from '../../../components/bootstrap/Button';
import { HeaderRight } from '../../../layout/Header/Header';
import OffCanvas, {
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../components/bootstrap/OffCanvas';
import ThemeContext from '../../../contexts/themeContext';
import AuthContext from '../../../contexts/authContext';
import Popovers from '../../../components/bootstrap/Popovers';
import Spinner from '../../../components/bootstrap/Spinner';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/bootstrap/Badge';
import notificationService, {
	INotificationItem,
	extractNotificationResponse,
} from '../../../services/notificationService';
import { getNotificationVisuals } from '../../../constants/notificationConfig';
import { PAGE_ROUTES } from '../../../constants/pageRoutes';
import './CommonHeaderRight.scss';

interface ICommonHeaderRightProps {
	beforeChildren?: ReactNode;
	afterChildren?: ReactNode;
}

const formatTimeAgo = (dateStr?: string): string => {
	if (!dateStr) return '';
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) return '';
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	if (seconds < 60) return 'Just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const CommonHeaderRight: FC<ICommonHeaderRightProps> = ({ beforeChildren, afterChildren }) => {
	const navigate = useNavigate();
	const { fullScreenStatus, setFullScreenStatus } = useContext(ThemeContext);
	const { authUser } = useContext(AuthContext);

	const isSuperUser = Boolean(
		authUser?.is_super_admin ||
		authUser?.role?.role_type?.toLowerCase() === 'super_user' ||
		authUser?.role?.role_type?.toLowerCase() === 'super_admin' ||
		authUser?.role?.role_type?.toLowerCase().includes('super'),
	);

	const styledBtn: IButtonProps = {
		color: 'light',
		hoverShadow: 'default',
		isLight: true,
		size: 'lg',
	};

	const [offcanvasStatus, setOffcanvasStatus] = useState<boolean>(false);
	const [notifications, setNotifications] = useState<INotificationItem[]>([]);
	const [unreadCount, setUnreadCount] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(false);
	const [loadingMore, setLoadingMore] = useState<boolean>(false);
	const [markingAll, setMarkingAll] = useState<boolean>(false);
	const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [totalCount, setTotalCount] = useState<number>(0);

	const listContainerRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);

	// Fetch unread count for bell badge & vibration
	const fetchUnreadCount = useCallback(async () => {
		try {
			const res = await notificationService.getAll({ page: 1, limit: 1, is_read: false });
			const parsed = extractNotificationResponse(res, 1, 1);
			setUnreadCount(parsed.unreadCount || parsed.totalDocument);
		} catch (err) {
			// Silently ignore
		}
	}, []);

	// Fetch notifications (supports initial load and infinite scroll appending)
	const fetchNotifications = useCallback(
		async (page: number = 1, isReadFilter?: boolean, isAppend: boolean = false) => {
			if (isAppend) {
				setLoadingMore(true);
			} else {
				setLoading(true);
			}

			try {
				const res = await notificationService.getAll({
					page,
					limit: 10,
					...(isReadFilter !== undefined && { is_read: isReadFilter }),
				});

				const parsed = extractNotificationResponse(res, page, 10);

				if (isAppend) {
					setNotifications((prev) => {
						const existingIds = new Set(prev.map((n) => n.id));
						const fresh = parsed.items.filter((n) => !existingIds.has(n.id));
						return [...prev, ...fresh];
					});
				} else {
					setNotifications(parsed.items);
				}

				setCurrentPage(page);
				setTotalPages(parsed.totalPages);
				setTotalCount(parsed.totalDocument);

				if (isReadFilter === undefined && parsed.unreadCount !== undefined) {
					setUnreadCount(parsed.unreadCount);
				}
			} catch (err) {
				// Silently ignore
			} finally {
				if (isAppend) {
					setLoadingMore(false);
				} else {
					setLoading(false);
				}
			}
		},
		[],
	);

	// 1. Initial Load: Fetch unread count once
	useEffect(() => {
		fetchUnreadCount();
	}, [fetchUnreadCount]);

	// 2. Real-time Socket Listener
	useEffect(() => {
		const handleSocketNotif = () => {
			fetchUnreadCount();
			if (offcanvasStatus) {
				fetchNotifications(1, activeTab === 'unread' ? false : undefined, false);
			}
		};

		window.addEventListener('SOCKET_NOTIFICATION_RECEIVED', handleSocketNotif);
		return () => {
			window.removeEventListener('SOCKET_NOTIFICATION_RECEIVED', handleSocketNotif);
		};
	}, [fetchUnreadCount, fetchNotifications, offcanvasStatus, activeTab]);

	// 3. Drawer Opened or Tab Changed: Fetch first page
	useEffect(() => {
		if (offcanvasStatus) {
			fetchNotifications(1, activeTab === 'unread' ? false : undefined, false);
		}
	}, [offcanvasStatus, activeTab, fetchNotifications]);

	// 4. IntersectionObserver Sentinel for Automatic Infinite Scroll
	useEffect(() => {
		if (!offcanvasStatus || loading || loadingMore || currentPage >= totalPages) return undefined;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && !loading && !loadingMore && currentPage < totalPages) {
					fetchNotifications(currentPage + 1, activeTab === 'unread' ? false : undefined, true);
				}
			},
			{
				root: listContainerRef.current,
				threshold: 0.1,
			},
		);

		const currentSentinel = sentinelRef.current;
		if (currentSentinel) {
			observer.observe(currentSentinel);
		}

		return () => {
			if (currentSentinel) {
				observer.unobserve(currentSentinel);
			}
		};
	}, [offcanvasStatus, loading, loadingMore, currentPage, totalPages, activeTab, fetchNotifications]);

	// 5. Container Scroll fallback
	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
		if (scrollHeight - scrollTop - clientHeight < 80) {
			if (!loading && !loadingMore && currentPage < totalPages) {
				fetchNotifications(currentPage + 1, activeTab === 'unread' ? false : undefined, true);
			}
		}
	};

	// Handle mark single as read
	const handleMarkAsRead = async (notification: INotificationItem) => {
		if (notification.is_read) return;

		// Optimistic update
		setNotifications((prev) =>
			prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)),
		);
		setUnreadCount((prev) => Math.max(0, prev - 1));

		try {
			await notificationService.markAsRead(notification.id);
		} catch (err) {
			fetchNotifications(1, activeTab === 'unread' ? false : undefined, false);
			fetchUnreadCount();
		}
	};

	// Handle mark all as read
	const handleMarkAllAsRead = async () => {
		if (markingAll || unreadCount === 0) return;
		setMarkingAll(true);
		try {
			await notificationService.markAllAsRead();
			setUnreadCount(0);
			setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
			if (activeTab === 'unread') {
				setNotifications([]);
				setTotalCount(0);
			}
		} catch (err) {
			// Silently ignore
		} finally {
			setMarkingAll(false);
		}
	};

	// Render notification list items cleanly without nested ternaries
	const renderNotificationContent = () => {
		if (loading) {
			return (
				<div className='d-flex justify-content-center align-items-center py-5'>
					<Spinner color='primary' />
				</div>
			);
		}

		if (notifications.length === 0) {
			return (
				<div className='notification-empty-state'>
					<Icon icon='NotificationsNone' className='empty-icon' />
					<p className='fw-semibold text-dark mb-1'>No notifications</p>
					<p className='text-muted small'>
						{activeTab === 'unread'
							? "You've read all your notifications!"
							: 'No notification records available.'}
					</p>
				</div>
			);
		}

		return (
			<>
				{notifications.map((item) => {
					const visuals = getNotificationVisuals(item);

					return (
						<div
							key={item.id}
							className={classNames('notification-card-item', {
								'is-unread': !item.is_read,
							})}
							onClick={() => handleMarkAsRead(item)}
							role='button'
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleMarkAsRead(item);
								}
							}}>
							<div
								className='notification-icon-box'
								style={{
									backgroundColor: visuals.bgColor,
									color: visuals.textColor,
								}}>
								<Icon icon={visuals.icon} />
							</div>
							<div className='notification-content'>
								<div className='notification-msg'>{item.message}</div>
								<div className='notification-time'>
									<Icon icon='AccessTime' size='sm' />
									<span>{formatTimeAgo(item.created_at)}</span>
								</div>
							</div>
							{!item.is_read && <span className='notification-unread-indicator' />}
						</div>
					);
				})}

				{/* Sentinel Element for IntersectionObserver */}
				<div ref={sentinelRef} style={{ height: '20px', width: '100%' }} />

				{/* Loading more spinner on scroll */}
				{loadingMore && (
					<div className='d-flex justify-content-center align-items-center py-3'>
						<Spinner isSmall color='primary' />
						<span className='small text-muted ms-2'>Loading more...</span>
					</div>
				)}

				{/* Load More Fallback Button if needed */}
				{!loadingMore && currentPage < totalPages && (
					<div className='text-center py-2'>
						<Button
							size='sm'
							color='light'
							className='w-100 py-2 text-primary fw-semibold'
							onClick={() =>
								fetchNotifications(
									currentPage + 1,
									activeTab === 'unread' ? false : undefined,
									true,
								)
							}>
							Load more notifications
						</Button>
					</div>
				)}

				{/* End of list reached */}
				{!loadingMore && currentPage >= totalPages && notifications.length > 5 && (
					<div className='text-center py-3 text-muted small'>
						You have reached the end of notifications.
					</div>
				)}
			</>
		);
	};

	return (
		<HeaderRight>
			<div className='row g-3 align-items-center'>
				{beforeChildren}

				{/* Full Screen */}
				<div className='col-auto'>
					<Popovers trigger='hover' desc='Fullscreen'>
						<Button
							// eslint-disable-next-line react/jsx-props-no-spreading
							{...styledBtn}
							icon={fullScreenStatus ? 'FullscreenExit' : 'Fullscreen'}
							onClick={() => setFullScreenStatus(!fullScreenStatus)}
							aria-label='Toggle fullscreen'
						/>
					</Popovers>
				</div>

				{/* Notifications Bell with Vibration & Badge */}
				<div className='col-auto'>
					<Popovers trigger='hover' desc={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}>
						<div className='bell-icon-wrapper'>
							<Button
								// eslint-disable-next-line react/jsx-props-no-spreading
								{...styledBtn}
								icon={unreadCount > 0 ? 'NotificationsActive' : 'Notifications'}
								className={classNames({
									'bell-vibrating': unreadCount > 0,
								})}
								onClick={() => {
									setOffcanvasStatus(true);
								}}
								aria-label='Notifications'
							/>
							{unreadCount > 0 && (
								<span className='bell-count-badge'>
									{unreadCount > 99 ? '99+' : unreadCount}
								</span>
							)}
						</div>
					</Popovers>
				</div>

				{/* User Wallet Icon (Shown only if NOT a super user) */}
				{!isSuperUser && (
					<div className='col-auto'>
						<Popovers trigger='hover' desc='My Wallet'>
							<Button
								// eslint-disable-next-line react/jsx-props-no-spreading
								{...styledBtn}
								icon='AccountBalanceWallet'
								aria-label='My Wallet'
								onClick={() => {
									navigate(`/${PAGE_ROUTES.MY_WALLET}`);
								}}
							/>
						</Popovers>
					</div>
				)}

				{/* User Commission Icon (Shown only if NOT a super user) */}
				{!isSuperUser && (
					<div className='col-auto'>
						<Popovers trigger='hover' desc='My Commission'>
							<Button
								// eslint-disable-next-line react/jsx-props-no-spreading
								{...styledBtn}
								icon='Percent'
								aria-label='My Commission'
								onClick={() => {
									navigate(`/${PAGE_ROUTES.MY_COMMISSION}`);
								}}
							/>
						</Popovers>
					</div>
				)}

				{afterChildren}
			</div>

			{/* Notification OffCanvas Drawer */}
			<OffCanvas
				id='notificationCanvas'
				titleId='offcanvasNotificationLabel'
				placement='end'
				isOpen={offcanvasStatus}
				setOpen={setOffcanvasStatus}>
				<OffCanvasHeader setOpen={setOffcanvasStatus}>
					<div className='d-flex align-items-center gap-2'>
						<OffCanvasTitle id='offcanvasNotificationLabel'>Notifications</OffCanvasTitle>
						{unreadCount > 0 && (
							<Badge color='danger' rounded='pill'>
								{unreadCount} new
							</Badge>
						)}
					</div>
				</OffCanvasHeader>

				<OffCanvasBody className='p-0 d-flex flex-column'>
					{/* Top Action Bar (Tabs & Mark All Read) */}
					<div className='notification-top-bar'>
						<div className='notification-filter-tabs'>
							<button
								type='button'
								className={classNames('filter-btn', { active: activeTab === 'unread' })}
								onClick={() => setActiveTab('unread')}>
								Unread {unreadCount > 0 && `(${unreadCount})`}
							</button>
							<button
								type='button'
								className={classNames('filter-btn', { active: activeTab === 'all' })}
								onClick={() => setActiveTab('all')}>
								All
							</button>
						</div>

						{unreadCount > 0 && (
							<button
								type='button'
								className='mark-all-btn'
								onClick={handleMarkAllAsRead}
								disabled={markingAll}>
								{markingAll ? (
									<>
										<Spinner isSmall inButton isGrow={false} /> Marking...
									</>
								) : (
									'Mark all as read'
								)}
							</button>
						)}
					</div>

					{/* Notification List Container with Scroll Pagination */}
					<div
						ref={listContainerRef}
						className='notification-list-container'
						onScroll={handleScroll}>
						{renderNotificationContent()}
					</div>

					{/* Status Footer */}
					{notifications.length > 0 && (
						<div className='notification-footer-pagination'>
							<span className='small text-muted'>
								Showing {notifications.length} of {totalCount} notifications
							</span>
							{currentPage < totalPages && !loadingMore && (
								<span className='badge bg-light text-muted border'>Scroll for more</span>
							)}
						</div>
					)}
				</OffCanvasBody>
			</OffCanvas>
		</HeaderRight>
	);
};

CommonHeaderRight.propTypes = {
	beforeChildren: PropTypes.node,
	afterChildren: PropTypes.node,
};

CommonHeaderRight.defaultProps = {
	beforeChildren: null,
	afterChildren: null,
};

export default CommonHeaderRight;
