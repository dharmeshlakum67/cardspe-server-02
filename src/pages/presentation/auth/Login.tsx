import React, { FC, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Button from '../../../components/bootstrap/Button';
import AuthContext from '../../../contexts/authContext';
import Spinner from '../../../components/bootstrap/Spinner';
import Icon from '../../../components/icon/Icon';
import authService from './services/authService';
import showNotification from '../../../components/extras/showNotification';

const Login: FC = () => {
	const { setUser, setAuthUser } = useContext(AuthContext);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);

	const navigate = useNavigate();

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			loginUsername: '',
			loginPassword: '',
		},
		validate: (values) => {
			const errors: { loginUsername?: string; loginPassword?: string } = {};

			if (!values.loginUsername) {
				errors.loginUsername = 'Username is required';
			}

			if (!values.loginPassword) {
				errors.loginPassword = 'Password is required';
			}

			return errors;
		},
		validateOnChange: false,
		onSubmit: async (values) => {
			setIsLoading(true);
			try {
				const response = await authService.login({
					identifier: values.loginUsername.trim(),
					password: values.loginPassword,
				});

				if (response?.data?.user) {
					if (setAuthUser) {
						setAuthUser(response.data.user);
					}
					if (setUser) {
						setUser(response.data.user.username || response.data.user.name);
					}
				}

				navigate('/');
			} catch (error: any) {
				const msg =
					error?.data?.message ||
					error?.message ||
					'Invalid username or password. Please try again.';
				showNotification('Login Failed', msg, 'danger');
			} finally {
				setIsLoading(false);
			}
		},
	});

	return (
		<PageWrapper isProtected={false} isGuestOnly title='Login' className='bg-dark'>
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
									Welcome Back
								</div>
								<div className='text-center text-muted mb-4'>
									Sign in to your account
								</div>

								<form className='row g-4' onSubmit={formik.handleSubmit}>
									<div className='col-12'>
										<FormGroup
											id='loginUsername'
											isFloating
											label='Username'>
											<Input
												autoComplete='username'
												value={formik.values.loginUsername}
												isTouched={formik.touched.loginUsername}
												invalidFeedback={formik.errors.loginUsername}
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
										<div className='position-relative'>
											<FormGroup id='loginPassword' isFloating label='Password'>
												<Input
													type={showPassword ? 'text' : 'password'}
													autoComplete='current-password'
													value={formik.values.loginPassword}
													isTouched={formik.touched.loginPassword}
													invalidFeedback={formik.errors.loginPassword}
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
												aria-label='Toggle password visibility'
												onClick={() => setShowPassword(!showPassword)}>
												<Icon icon={showPassword ? 'VisibilityOff' : 'Visibility'} />
											</button>
										</div>
									</div>

									<div className='col-12 text-end'>
										<Link
											to='/auth-pages/forgot-password'
											className='text-decoration-none fw-semibold small'
											style={{ color: '#0E5F98' }}>
											Forgot Password?
										</Link>
									</div>

									<div className='col-12'>
										<Button
											type='submit'
											color='primary'
											className='w-100 py-3 fs-5'
											isDisable={
												isLoading ||
												!formik.values.loginUsername ||
												!formik.values.loginPassword
											}>
											{isLoading && <Spinner isSmall inButton isGrow />}
											Sign In
										</Button>
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

export default Login;
