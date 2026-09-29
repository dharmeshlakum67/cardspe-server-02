import React, { FC, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Button from '../../../components/bootstrap/Button';
import Spinner from '../../../components/bootstrap/Spinner';
import showNotification from '../../../components/extras/showNotification';
import authService from './services/authService';
import { authPagesMenu } from '../../../menu';

const ForgotPassword: FC = () => {
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
	const navigate = useNavigate();

	const formik = useFormik({
		initialValues: {
			email: '',
		},
		validate: (values) => {
			const errors: { email?: string } = {};

			if (!values.email) {
				errors.email = 'Email is required';
			} else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
				errors.email = 'Invalid email address';
			}

			return errors;
		},
		validateOnChange: false,
		onSubmit: async (values) => {
			setIsLoading(true);
			try {
				const res = await authService.forgotPassword({
					email_address: values.email.trim(),
				});
				setIsSubmitted(true);
				showNotification(
					'Success',
					res?.message || 'Password reset instructions have been sent to your email!',
					'success',
				);
			} catch (error: any) {
				const errorMsg =
					error?.message ||
					error?.response?.data?.message ||
					'Failed to process forgot password request. Please try again.';
				showNotification('Error', errorMsg, 'danger');
			} finally {
				setIsLoading(false);
			}
		},
	});

	return (
		<PageWrapper isProtected={false} isGuestOnly title='Forgot Password' className='bg-dark'>
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
									Forgot Password
								</div>
								<div className='text-center text-muted mb-4'>
									Enter your email address to reset your password
								</div>

								{isSubmitted ? (
									<div className='text-center py-4'>
										<div className='text-success fw-bold fs-5 mb-3'>
											Check your inbox!
										</div>
										<p className='text-muted mb-4'>
											We sent password reset instructions to{' '}
											<strong>{formik.values.email}</strong>.
										</p>
										<Button
											color='primary'
											className='w-100 py-3 fs-5 mb-3'
											onClick={() => navigate(`/${authPagesMenu.login.path}`)}>
											Back to Login
										</Button>
									</div>
								) : (
									<form className='row g-4' onSubmit={formik.handleSubmit}>
										<div className='col-12'>
											<FormGroup id='email' isFloating label='Your email'>
												<Input
													type='email'
													autoComplete='email'
													placeholder='Your email'
													value={formik.values.email}
													isTouched={formik.touched.email}
													invalidFeedback={formik.errors.email}
													isValid={formik.isValid}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													onFocus={() => {
														formik.setErrors({});
													}}
												/>
											</FormGroup>
										</div>

										<div className='col-12'>
											<Button
												type='submit'
												color='primary'
												className='w-100 py-3 fs-5'
												isDisable={isLoading || !formik.values.email}>
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
								)}
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default ForgotPassword;
