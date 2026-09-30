import React, { FC, useEffect, useRef, useState, startTransition } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Spinner from '../../../components/bootstrap/Spinner';
import Icon from '../../../components/icon/Icon';
import showNotification from '../../../components/extras/showNotification';
import authService from './services/authService';
import { PAGE_ROUTES } from '../../../constants/pageRoutes';
import { authPagesMenu } from '../../../menu';

export const VerifyEmail: FC = () => {
	const { confirmationToken, token } = useParams<{ confirmationToken?: string; token?: string }>();
	const [searchParams] = useSearchParams();
	const activeToken = confirmationToken || token || searchParams.get('token') || '';

	const [isVerifying, setIsVerifying] = useState<boolean>(true);
	const [isVerifiedSuccess, setIsVerifiedSuccess] = useState<boolean>(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const navigate = useNavigate();
	const hasFetchedRef = useRef<boolean>(false);

	const safeNavigate = (path: string) => {
		startTransition(() => {
			navigate(path, { replace: true });
		});
	};

	// AUTOMATICALLY VERIFY EMAIL ON MOUNT (CALLED ONCE)
	useEffect(() => {
		if (!activeToken) {
			setErrorMsg('Missing email verification token.');
			setIsVerifying(false);
			return;
		}

		if (hasFetchedRef.current) return;
		hasFetchedRef.current = true;

		const autoVerifyEmail = async () => {
			setIsVerifying(true);
			setErrorMsg(null);
			try {
				const res = await authService.verifyEmailToken(activeToken);
				showNotification(
					'Success',
					res?.message || 'Email verified successfully!',
					'success',
				);
				setIsVerifiedSuccess(true);
			} catch (err: any) {
				const msg =
					err?.message ||
					err?.response?.data?.message ||
					'The verification link is invalid or has expired.';
				setErrorMsg(msg);
				showNotification('Verification Error', msg, 'danger');
			} finally {
				setIsVerifying(false);
			}
		};

		autoVerifyEmail();
	}, [activeToken]);

	return (
		<PageWrapper isProtected={false} isGuestOnly={false} title='Verify Email' className='bg-dark'>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center min-vh-100 py-4'>
					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container'>
						<Card className='shadow-3d-dark border-0 rounded-4 overflow-hidden'>
							<CardBody className='p-4 p-md-5 text-center'>
								{/* LOGO HEADER */}
								<div className='text-center mb-4'>
									<Link to='/' className='text-decoration-none' aria-label='Logo'>
										<img
											src={`${process.env.PUBLIC_URL}/logo-dark.png`}
											alt='Logo'
											style={{
												maxHeight: '70px',
												maxWidth: '260px',
												width: 'auto',
												objectFit: 'contain',
											}}
										/>
									</Link>
								</div>

								{/* STATE 1: LOADING / VERIFYING */}
								{isVerifying && (
									<div className='py-4'>
										<div
											className='d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary mb-3'
											style={{ width: '64px', height: '64px' }}>
											<Spinner isGrow color='primary' />
										</div>
										<h4 className='fw-bold text-dark mb-2'>Verifying Your Email...</h4>
										<p className='text-muted small mb-0'>
											Please wait while we confirm your email verification link.
										</p>
									</div>
								)}

								{/* STATE 2: VERIFICATION SUCCESS */}
								{!isVerifying && isVerifiedSuccess && (
									<div className='py-3'>
										<div
											className='d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success mb-3'
											style={{ width: '68px', height: '68px', fontSize: '2.2rem' }}>
											<Icon icon='CheckCircle' />
										</div>
										<h3 className='fw-bold text-dark mb-2'>Email Verified Successfully!</h3>
										<p className='text-muted mb-4 fs-6'>
											Thank you! Your email address has been verified. Click below to continue to the dashboard.
										</p>
										<div className='d-grid gap-2'>
											<Button
												color='primary'
												className='py-3 fs-5 fw-bold shadow-sm'
												onClick={() => safeNavigate(PAGE_ROUTES.DASHBOARD || '/')}>
												<Icon icon='Dashboard' className='me-2' />
												Go to Dashboard
											</Button>
										</div>
									</div>
								)}

								{/* STATE 3: VERIFICATION FAILED / EXPIRED */}
								{!isVerifying && !isVerifiedSuccess && errorMsg && (
									<div className='py-3'>
										<div
											className='d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger mb-3'
											style={{ width: '64px', height: '64px', fontSize: '2rem' }}>
											<Icon icon='ErrorOutline' />
										</div>
										<h3 className='fw-bold text-dark mb-2'>Verification Failed</h3>
										<p className='text-muted mb-4 small fs-6'>{errorMsg}</p>
										<div className='d-grid gap-2'>
											<Button
												color='primary'
												className='py-2.5 fw-bold'
												onClick={() => safeNavigate(`/${authPagesMenu.login.path}`)}>
												<Icon icon='Login' className='me-2' />
												Go to Login
											</Button>
											<Button
												color='light'
												className='py-2.5 text-secondary'
												onClick={() => safeNavigate('/')}>
												Go to Home
											</Button>
										</div>
									</div>
								)}
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default VerifyEmail;
