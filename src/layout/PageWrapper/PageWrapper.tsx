import React, { useLayoutEffect, forwardRef, ReactElement, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { ISubHeaderProps } from '../SubHeader/SubHeader';
import { IPageProps } from '../Page/Page';
import AuthContext from '../../contexts/authContext';
import usePermission from '../../hooks/usePermission';
import { authPagesMenu } from '../../menu';
import { ENV } from '../../config/env.config';
import Spinner from '../../components/bootstrap/Spinner';
import authService from '../../pages/presentation/auth/services/authService';

interface IPageWrapperProps {
	isProtected?: boolean;
	isGuestOnly?: boolean;
	title?: string;
	description?: string;
	permissionKey?: string;
	children:
	| ReactElement<ISubHeaderProps>[]
	| ReactElement<IPageProps>
	| ReactElement<IPageProps>[];
	className?: string;
}

const PageWrapper = forwardRef<HTMLDivElement, IPageWrapperProps>(
	(
		{
			isProtected = true,
			isGuestOnly = false,
			title,
			description,
			permissionKey,
			className,
			children,
		},
		ref,
	) => {
		useLayoutEffect(() => {
			const siteName = process.env.REACT_APP_SITE_NAME || ENV.SITE_NAME || 'cardspe';
			// @ts-ignore
			document.getElementsByTagName('TITLE')[0].text = title
				? `${title} | ${siteName}`
				: siteName;
			// @ts-ignore
			document
				?.querySelector('meta[name="description"]')
				.setAttribute('content', description || process.env.REACT_APP_META_DESC || '');
		});

		const { isLoading: isAuthLoading } = useContext(AuthContext);
		const { canRead, isLoadingPermissions } = usePermission();
		const navigate = useNavigate();

		const isChecking = Boolean(isAuthLoading || isLoadingPermissions);

		useEffect(() => {
			const token = authService.getToken();

			// REDIRECT TO LOGIN IF NOT AUTHENTICATED
			if (isProtected && !token) {
				navigate(`/${authPagesMenu.login.path}`, { replace: true });
				return;
			}

			// REDIRECT TO DASHBOARD IF ALREADY AUTHENTICATED GUEST
			if (isGuestOnly && token) {
				navigate('/', { replace: true });
				return;
			}

			// PERMISSION CHECK: REDIRECT TO 404/ACCESS DENIED IF USER LACKS VIEW PERMISSION
			if (isProtected && token && permissionKey && !isChecking) {
				if (!canRead(permissionKey)) {
					navigate(`/${authPagesMenu.page404.path}`, { replace: true });
				}
			}
		}, [isProtected, isGuestOnly, permissionKey, isChecking, canRead, navigate]);

		// SHOW LOADING SPINNER WHILE INITIAL PERMISSIONS LOAD
		if (isProtected && permissionKey && isChecking) {
			return (
				<div ref={ref} className={classNames('page-wrapper', 'container-fluid', className)}>
					<div
						className='d-flex flex-column align-items-center justify-content-center w-100 py-5'
						style={{ minHeight: '70vh' }}>
						<Spinner color='primary' size='3rem' isGrow={false} />
					</div>
				</div>
			);
		}

		// PREVENT RENDERING CHILDREN IF PERMISSION CHECK FAILS
		if (isProtected && permissionKey && !isChecking && !canRead(permissionKey)) {
			return null;
		}

		return (
			<div ref={ref} className={classNames('page-wrapper', 'container-fluid', className)}>
				{children}
			</div>
		);
	},
);

PageWrapper.displayName = 'PageWrapper';
PageWrapper.propTypes = {
	isProtected: PropTypes.bool,
	isGuestOnly: PropTypes.bool,
	title: PropTypes.string,
	description: PropTypes.string,
	permissionKey: PropTypes.string,
	// @ts-ignore
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
};
PageWrapper.defaultProps = {
	isProtected: true,
	isGuestOnly: false,
	title: undefined,
	description: undefined,
	permissionKey: undefined,
	className: undefined,
};

export default PageWrapper;
