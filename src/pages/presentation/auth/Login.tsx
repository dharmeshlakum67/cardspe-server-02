/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/no-autofocus, react/no-array-index-key, jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Input from '../../../components/bootstrap/forms/Input';
import Button from '../../../components/bootstrap/Button';
import AuthContext from '../../../contexts/authContext';
import Spinner from '../../../components/bootstrap/Spinner';
import Icon from '../../../components/icon/Icon';
import authService from './services/authService';
import showNotification from '../../../components/extras/showNotification';
import PAGE_ROUTES from '../../../constants/pageRoutes';

export const Login: FC = () => {
	const { setUser, setAuthUser } = useContext(AuthContext);
	const navigate = useNavigate();

	// STEP: 'login' | 'otp'
	const [step, setStep] = useState<'login' | 'otp'>('login');

	// LOGIN FORM STATES
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);

	// OTP VERIFICATION STATES
	const [pendingMobile, setPendingMobile] = useState<string>('');
	const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
	const [isSubmittingOtp, setIsSubmittingOtp] = useState<boolean>(false);
	const [isResendingOtp, setIsResendingOtp] = useState<boolean>(false);
	const [timer, setTimer] = useState<number>(60);

	const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

	// COUNTDOWN TIMER EFFECT FOR OTP STEP
	useEffect(() => {
		let interval: any = null;
		if (step === 'otp' && timer > 0) {
			interval = setInterval(() => {
				setTimer((prev) => prev - 1);
			}, 1000);
		} else if (timer === 0 && interval) {
			clearInterval(interval);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [step, timer]);

	// FORMIK FOR LOGIN CREDENTIALS
	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			loginUsername: '',
			loginPassword: '',
		},
		validate: (values) => {
			const errors: { loginUsername?: string; loginPassword?: string } = {};

			if (!values.loginUsername.trim()) {
				errors.loginUsername = 'Username, email or mobile is required';
			}

			if (!values.loginPassword) {
				errors.loginPassword = 'Password is required';
			}

			return errors;
		},
		validateOnChange: false,
		onSubmit: async (values) => {
			if (isLoading) return;
			setIsLoading(true);
			try {
				const response = await authService.login({
					identifier: values.loginUsername.trim(),
					password: values.loginPassword,
				});

				// CASE B: MOBILE VERIFICATION PENDING
				if (response?.data?.is_mobile_verification_required) {
					const mobile = response.data.mobile_number || '';
					setPendingMobile(mobile);
					setStep('otp');
					setTimer(60);
					setOtp(['', '', '', '', '', '']);

					showNotification(
						'Verification Required',
						response?.message ||
							'Mobile number verification is pending. An OTP has been sent to your registered mobile number.',
						'info',
					);

					setTimeout(() => {
						otpInputRefs.current[0]?.focus();
					}, 150);
					return;
				}

				// CASE A: STANDARD LOGIN SUCCESS (ALREADY VERIFIED)
				const user = response?.data?.user;
				if (user) {
					if (setAuthUser) {
						setAuthUser(user);
					}
					if (setUser) {
						setUser(user.username || user.name);
					}
				}

				showNotification(
					'Login Successful',
					response?.message || 'Logged in successfully.',
					'success',
				);

				navigate('/');
			} catch (error: any) {
				const msg =
					error?.data?.message ||
					error?.message ||
					'Invalid credentials. Please check and try again.';
				showNotification('Login Failed', msg, 'danger');
			} finally {
				setIsLoading(false);
			}
		},
	});

	// VERIFY OTP SUBMISSION HANDLER
	const executeVerifyOtp = async (codeToVerify: string) => {
		if (isSubmittingOtp) return;
		if (codeToVerify.length < 6) {
			showNotification('Invalid OTP', 'Please enter all 6 digits of the OTP.', 'warning');
			return;
		}

		setIsSubmittingOtp(true);
		try {
			const response = await authService.verifyOTP({
				mobile_number: pendingMobile,
				otp: codeToVerify,
			});

			const user = response?.user || response?.data?.user;
			if (user) {
				if (setAuthUser) setAuthUser(user);
				if (setUser) setUser(user.username || user.name);
			}

			showNotification(
				'Verification Successful',
				response?.message || 'Mobile number verified successfully!',
				'success',
			);

			navigate('/');
		} catch (error: any) {
			const msg =
				error?.data?.message ||
				error?.message ||
				'OTP verification failed. Please try again.';
			showNotification('Verification Failed', msg, 'danger');
		} finally {
			setIsSubmittingOtp(false);
		}
	};

	const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const otpCode = otp.join('');
		await executeVerifyOtp(otpCode);
	};

	// OTP INPUT CHANGE HANDLER (AUTO-FOCUS NEXT & AUTO-SUBMIT ON 6 DIGITS)
	const handleOtpChange = (index: number, value: string) => {
		const digit = value.replace(/\D/g, '').slice(-1);
		const newOtp = [...otp];
		newOtp[index] = digit;
		setOtp(newOtp);

		// Focus next box if digit entered
		if (digit && index < 5) {
			otpInputRefs.current[index + 1]?.focus();
		}

		// Auto-submit when all 6 digits are filled
		const combined = newOtp.join('');
		if (combined.length === 6 && !newOtp.includes('')) {
			executeVerifyOtp(combined);
		}
	};

	// OTP KEYDOWN (BACKSPACE HANDLING)
	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			otpInputRefs.current[index - 1]?.focus();
		}
	};

	// OTP PASTE HANDLER
	const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
		if (pastedData) {
			const newOtp = ['', '', '', '', '', ''];
			for (let i = 0; i < pastedData.length; i += 1) {
				newOtp[i] = pastedData[i];
			}
			setOtp(newOtp);
			const targetIndex = Math.min(pastedData.length, 5);
			otpInputRefs.current[targetIndex]?.focus();

			// Auto-submit if full 6-digit pasted
			if (pastedData.length === 6) {
				executeVerifyOtp(pastedData);
			}
		}
	};

	// RESEND OTP HANDLER
	const handleResendOtp = async () => {
		if (timer > 0 || isResendingOtp) return;
		setIsResendingOtp(true);
		try {
			const response = await authService.resendOTP({
				mobile_number: pendingMobile,
			});

			const newCooldown = response?.data?.cooldown_seconds || response?.cooldown_seconds || 60;
			setTimer(newCooldown);
			setOtp(['', '', '', '', '', '']);

			showNotification(
				'OTP Resent',
				response?.message || 'A new OTP has been sent to your registered mobile number.',
				'info',
			);

			setTimeout(() => {
				otpInputRefs.current[0]?.focus();
			}, 100);
		} catch (error: any) {
			const msg =
				error?.data?.message ||
				error?.message ||
				'Failed to resend OTP. Please try again later.';
			showNotification('Resend Failed', msg, 'danger');
		} finally {
			setIsResendingOtp(false);
		}
	};

	// FORMAT MOBILE DISPLAY
	const formatMobileDisplay = (num: string) => {
		if (!num) return '';
		if (num.length === 10) {
			return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
		}
		return num;
	};

	return (
		<PageWrapper
			isProtected={false}
			isGuestOnly
			title={step === 'login' ? 'Login' : 'Verify OTP'}
			className='bg-dark'>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center py-2 py-sm-4'>
					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container'>
						<div className='cardspe-auth-card-container'>
							<div className='cardspe-auth-card'>
								{/* CARDSPE LOGO */}
								<div className='text-center mb-3 mb-sm-4'>
									<Link to='/' aria-label='Logo'>
										<img
											src={`${process.env.PUBLIC_URL}/logo-dark.png`}
											alt='CARDSPE'
											className='cardspe-auth-logo'
										/>
									</Link>
								</div>

								{step === 'login' ? (
									/* ==================== LOGIN STEP ==================== */
									<>
										<div className='text-center mb-3 mb-sm-4'>
											<h1 className='cardspe-auth-title'>Welcome Back</h1>
											<p className='cardspe-auth-subtitle'>
												Sign in to your account to continue
											</p>
										</div>

										<form className='row g-3' onSubmit={formik.handleSubmit}>
											{/* USERNAME / IDENTIFIER */}
											<div className='col-12'>
												<FormGroup
													id='loginUsername'
													isFloating
													label='Username, Email or Mobile'>
													<Input
														autoComplete='username'
														placeholder='Username, Email or Mobile'
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

											{/* PASSWORD */}
											<div className='col-12'>
												<div className='position-relative'>
													<FormGroup id='loginPassword' isFloating label='Password'>
														<Input
															type={showPassword ? 'text' : 'password'}
															autoComplete='current-password'
															placeholder='Password'
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

											{/* FORGOT PASSWORD LINK */}
											<div className='col-12 text-end'>
												<Link
													to={`/${PAGE_ROUTES.FORGOT_PASSWORD}`}
													className='text-decoration-none fw-semibold small'
													style={{ color: '#0E5F98' }}>
													Forgot Password?
												</Link>
											</div>

											{/* SIGN IN BUTTON */}
											<div className='col-12 mt-3'>
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

											{/* SIGNUP LINK */}
											<div className='col-12 text-center mt-3'>
												<p className='text-decoration-none fw-semibold small mb-0'>
													Don't have an account?
													<Link
														to={`/${PAGE_ROUTES.SIGNUP}`}
														style={{ color: '#0E5F98', marginLeft: '4px' }}>
														Signup
													</Link>
												</p>
											</div>
										</form>
									</>
								) : (
									/* ==================== OTP VERIFICATION STEP ==================== */
									<>
										<div className='text-center mb-3 mb-sm-4'>
											<h1 className='cardspe-auth-title'>Verify OTP</h1>
											<p className='cardspe-auth-subtitle mb-1'>
												Mobile number verification is required to log in
											</p>
											<div className='fw-bold fs-6 text-dark mt-1'>
												{formatMobileDisplay(pendingMobile)}
											</div>
										</div>

										<form onSubmit={handleVerifyOtpSubmit}>
											{/* 6-DIGIT OTP BOXES */}
											<div className='cardspe-otp-grid'>
												{otp.map((digit, idx) => (
													<input
														key={idx}
														ref={(el) => {
															otpInputRefs.current[idx] = el;
														}}
														type='text'
														inputMode='numeric'
														maxLength={1}
														className={`cardspe-otp-box ${digit ? 'has-value' : ''}`}
														value={digit}
														onChange={(e) => handleOtpChange(idx, e.target.value)}
														onKeyDown={(e) => handleOtpKeyDown(idx, e)}
														onPaste={handleOtpPaste}
														autoFocus={idx === 0}
													/>
												))}
											</div>

											{/* RESEND OTP SECTION WITH COUNTDOWN TIMER */}
											<div className='text-center cardspe-resend-text'>
												Didn't receive the OTP?{' '}
												<button
													type='button'
													className='cardspe-resend-btn'
													disabled={timer > 0 || isResendingOtp}
													onClick={handleResendOtp}>
													{isResendingOtp ? 'Sending...' : 'Resend OTP'}
												</button>
												{timer > 0 && (
													<span className='cardspe-timer'>
														({`00:${timer < 10 ? `0${timer}` : timer}`})
													</span>
												)}
											</div>

											{/* VERIFY BUTTON */}
											<div className='mt-3'>
												<button
													type='submit'
													className='cardspe-auth-btn'
													disabled={isSubmittingOtp || otp.join('').length < 6}>
													{isSubmittingOtp ? (
														<>
															<Spinner isSmall inButton isGrow />
															Verifying...
														</>
													) : (
														'Verify OTP'
													)}
												</button>
											</div>

											{/* BACK TO LOGIN LINK */}
											<div className='text-center mt-4'>
												<button
													type='button'
													className='cardspe-back-link border-0 bg-transparent'
													onClick={() => {
														setStep('login');
														setOtp(['', '', '', '', '', '']);
													}}>
													<Icon icon='ChevronLeft' size='md' />
													Back to Login
												</button>
											</div>
										</form>
									</>
								)}
							</div>
							{/* STACKED CARD SHADOW EFFECT */}
							<div className='cardspe-auth-card-stack' />
						</div>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default Login;
