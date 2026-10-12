import React, { useState, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { useWindowSize } from 'react-use';
import { authPagesMenu } from '../../menu';
import { DropdownItem, DropdownMenu } from '../../components/bootstrap/Dropdown';
import Button from '../../components/bootstrap/Button';
import Collapse from '../../components/bootstrap/Collapse';
import { NavigationLine } from '../Navigation/Navigation';
import Icon from '../../components/icon/Icon';
import useNavigationItemHandle from '../../hooks/useNavigationItemHandle';
import AuthContext from '../../contexts/authContext';
import ThemeContext from '../../contexts/themeContext';
import USERS from '../../common/data/userDummyData';
import authService from '../../pages/presentation/auth/services/authService';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

import { getImageUrl } from '../../helpers/helpers';

const User = () => {
	const { width } = useWindowSize();
	const { setAsideStatus } = useContext(ThemeContext);
	const { userData, authUser, setUser } = useContext(AuthContext);

	const navigate = useNavigate();
	const handleItem = useNavigationItemHandle();

	const [collapseStatus, setCollapseStatus] = useState<boolean>(false);

	const { t } = useTranslation(['translation', 'menu']);

	const displayName = authUser?.name || userData?.name || 'Super Admin';
	const displayRole = authUser?.role?.role_name || userData?.position || 'Super Admin';

	const rawImage =
		(authUser as any)?.profile_picture ||
		authUser?.profile_image ||
		(authUser as any)?.profileImage ||
		(authUser as any)?.profile_image_url ||
		(authUser as any)?.profileImageUrl ||
		(authUser as any)?.avatar ||
		(authUser as any)?.image;

	const avatarSrc = getImageUrl(rawImage, userData?.src || USERS.JOHN.src);
	const avatarSrcSet = avatarSrc;

	const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
	const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await authService.logout();
		} finally {
			setIsLoggingOut(false);
			setIsLogoutModalOpen(false);
		}
		if (setUser) {
			setUser('');
		}
		const asideMinimizeBreakpoint =
			Number(process.env.REACT_APP_ASIDE_MINIMIZE_BREAKPOINT_SIZE) || 1024;
		if (width < asideMinimizeBreakpoint) {
			setAsideStatus(false);
		}
		navigate(`/${authPagesMenu.login.path}`);
	};

	return (
		<>
			<div
				className={classNames('user', { open: collapseStatus })}
				role='presentation'
				onClick={() => setCollapseStatus(!collapseStatus)}>
				<div className='user-avatar'>
					<img
						srcSet={avatarSrcSet || avatarSrc}
						src={avatarSrc}
						alt={`${displayName} Avatar`}
						width={128}
						height={128}
					/>
				</div>
				<div className='user-info'>
					<div className='user-name d-flex align-items-center'>
						{displayName}
						<Icon icon='Verified' className='ms-1' color='info' />
					</div>
					<div className='user-sub-title'>{displayRole}</div>
				</div>
			</div>
			<DropdownMenu>
				<DropdownItem>
					<Button icon='Person' onClick={() => navigate('/admin/profile')}>
						Profile
					</Button>
				</DropdownItem>
			</DropdownMenu>

			<Collapse isOpen={collapseStatus} className='user-menu'>
				<nav aria-label='aside-bottom-user-menu'>
					<div className='navigation'>
						<div
							role='presentation'
							className='navigation-item cursor-pointer'
							onClick={() => {
								navigate('/admin/profile');
								// @ts-ignore
								handleItem();
							}}>
							<span className='navigation-link navigation-link-pill'>
								<span className='navigation-link-info'>
									<Icon icon='Person' className='navigation-icon' />
									<span className='navigation-text'>Profile</span>
								</span>
							</span>
						</div>
					</div>
				</nav>
				<NavigationLine />
				<nav aria-label='aside-bottom-user-menu-2'>
					<div className='navigation'>
						<div
							role='presentation'
							className='navigation-item cursor-pointer'
							onClick={() => setIsLogoutModalOpen(true)}>
							<span className='navigation-link navigation-link-pill'>
								<span className='navigation-link-info'>
									<Icon icon='Logout' className='navigation-icon' />
									<span className='navigation-text'>
										{t('menu:Logout') as ReactNode}
									</span>
								</span>
							</span>
						</div>
					</div>
				</nav>
			</Collapse>

			<ConfirmationModal
				isOpen={isLogoutModalOpen}
				setIsOpen={setIsLogoutModalOpen}
				title='Logout Confirmation'
				message='Are you sure you want to logout?'
				confirmText='Yes, Logout'
				cancelText='Cancel'
				loadingText='Logging out...'
				isLoading={isLoggingOut}
				onConfirm={handleLogout}
			/>
		</>
	);
};

export default User;
