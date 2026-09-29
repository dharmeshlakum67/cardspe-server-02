import React, { FC, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Button from '../../../components/bootstrap/Button';
import Spinner from '../../../components/bootstrap/Spinner';
import Icon from '../../../components/icon/Icon';
import showNotification from '../../../components/extras/showNotification';
import authService from './services/authService';
import { authPagesMenu } from '../../../menu';

const ResetPassword: FC = () => {
	const { token } = useParams<{ token?: string }>();
	const [searchParams] = useSearchParams();
	const resetToken = token || searchParams.get('token') || '';

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
	const navigate = useNavigate();

	const formik = useFormik({
		initialValues: {
			newPassword: '',
			confirmPassword: '',
		},
		validate: (values) => {
			const errors: { newPassword?: string; confirmPassword?: string } = {};

			if (!values.newPassword) {
				errors.newPassword = 'New password is required';
			} else if (values.newPassword.length < 6) {
				errors.newPassword = 'Password must be at least 6 characters';
			}

			if (!values.confirmPassword) {
				errors.confirmPassword = 'Confirm password is required';
			} else if (values.newPassword !== values.confirmPassword) {
				errors.confirmPassword = 'Passwords do not match';
			}

			return errors;
		},
		validateOnChange: false,
		onSubmit: async (values) => {
			if (!resetToken) {
				showNotification('Error', 'Invalid or missing password reset token.', 'danger');
				return;
			}

			setIsLoading(true);
			try {
				const res = await authService.resetPassword(resetToken, {
					password: values.newPassword,
				});
				showNotification(
					'Success',
					res?.message || 'Your password has been reset successfully.',
					'success',
				);
				navigate(`/${authPagesMenu.login.path}`);
			} catch (error: any) {
				const errorMsg =
					error?.message ||
					error?.response?.data?.message ||
					'Failed to reset password. The link may be expired or invalid.';
				showNotification('Error', errorMsg, 'danger');
			} finally {
				setIsLoading(false);
			}
		},
	});

	return (
		<PageWrapper isProtected={false} isGuestOnly title='Reset Password' className='bg-dark'>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center'>
					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container'>
						<Card className='shadow-3d-dark'>
							<CardBody className='p-4 p-md-5'>
								<div className='text-center mb-4'>
									<Link
										to='/'
										className='text-decoration-none text-dark fw-bold display-2'
										aria-label='Logo'>
										<img
											src={`${process.env.PUBLIC_URL}/logo-dark.png`}
											alt='Logo'
											style={{
												maxHeight: '75px',
												maxWidth: '280px',
												width: 'auto',
												objectFit: 'contain',
											}}
										/>
									</Link>
								</div>

								<div className='text-center h2 fw-bold mt-3 text-dark'>
									Reset Password
								</div>
								<div className='text-center text-muted mb-4'>
									Enter your new password below
								</div>

								<form className='row g-4' onSubmit={formik.handleSubmit}>
									<div className='col-12'>
										<div className='position-relative'>
											<FormGroup id='newPassword' isFloating label='New Password'>
												<Input
													type={showNewPassword ? 'text' : 'password'}
													autoComplete='new-password'
													value={formik.values.newPassword}
													isTouched={formik.touched.newPassword}
													invalidFeedback={formik.errors.newPassword}
													isValid={formik.isValid}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													onFocus={() => {
														formik.setErrors({});
													}}
												/>
											</FormGroup>
											<button
												type='button'
												className='btn position-absolute top-50 end-0 translate-middle-y me-2 text-muted border-0 bg-transparent p-2 z-3 d-flex align-items-center'
												tabIndex={-1}
												aria-label='Toggle new password visibility'
												onClick={() => setShowNewPassword(!showNewPassword)}>
												<Icon icon={showNewPassword ? 'VisibilityOff' : 'Visibility'} />
											</button>
										</div>
									</div>

									<div className='col-12'>
										<div className='position-relative'>
											<FormGroup id='confirmPassword' isFloating label='Confirm Password'>
												<Input
													type={showConfirmPassword ? 'text' : 'password'}
													autoComplete='new-password'
													value={formik.values.confirmPassword}
													isTouched={formik.touched.confirmPassword}
													invalidFeedback={formik.errors.confirmPassword}
													isValid={formik.isValid}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													onFocus={() => {
														formik.setErrors({});
													}}
												/>
											</FormGroup>
											<button
												type='button'
												className='btn position-absolute top-50 end-0 translate-middle-y me-2 text-muted border-0 bg-transparent p-2 z-3 d-flex align-items-center'
												tabIndex={-1}
												aria-label='Toggle confirm password visibility'
												onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
												<Icon icon={showConfirmPassword ? 'VisibilityOff' : 'Visibility'} />
											</button>
										</div>
									</div>

									<div className='col-12'>
										<Button
											type='submit'
											color='primary'
											className='w-100 py-3 fs-5'
											isDisable={
												isLoading ||
												!formik.values.newPassword ||
												!formik.values.confirmPassword
											}>
											{isLoading && <Spinner isSmall inButton isGrow />}
											Submit
										</Button>
									</div>

									<div className='col-12 text-end'>
										<Link
											to={`/${authPagesMenu.login.path}`}
											className='text-decoration-none fw-semibold'
											style={{ color: '#0E5F98' }}>
											Login Here
										</Link>
									</div>
								</form>
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default ResetPassword;
