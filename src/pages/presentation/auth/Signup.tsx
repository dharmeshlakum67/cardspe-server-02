/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react-hooks/exhaustive-deps, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react/no-array-index-key, no-return-assign, jsx-a11y/no-autofocus */
import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import AuthContext from '../../../contexts/authContext';
import Spinner from '../../../components/bootstrap/Spinner';
import Icon from '../../../components/icon/Icon';
import authService, { ISignupRole } from './services/authService';
import showNotification from '../../../components/extras/showNotification';
import PAGE_ROUTES from '../../../constants/pageRoutes';

const Signup: FC = () => {
	const { setUser, setAuthUser } = useContext(AuthContext);
	const navigate = useNavigate();

	// STEP STATE: 'signup' | 'otp'
	const [step, setStep] = useState<'signup' | 'otp'>('signup');

	// SIGNUP FORM LOADING & PASSWORD VISIBILITY
	const [isSubmittingSignup, setIsSubmittingSignup] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);

	// ROLES STATE WITH PAGINATION
	const [roles, setRoles] = useState<ISignupRole[]>([]);
	const [rolesPage, setRolesPage] = useState<number>(1);
	const [hasMoreRoles, setHasMoreRoles] = useState<boolean>(true);
	const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(false);
	const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);

	// REGISTERED USER DETAILS FOR OTP STEP
	const [registeredMobile, setRegisteredMobile] = useState<string>('');

	// OTP BOXES STATE (6 DIGITS)
	const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
	const [isSubmittingOtp, setIsSubmittingOtp] = useState<boolean>(false);
	const [isResendingOtp, setIsResendingOtp] = useState<boolean>(false);

	// OTP COUNTDOWN TIMER (60 SECONDS)
	const [timer, setTimer] = useState<number>(60);
	const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const hasFetchedRolesRef = useRef<boolean>(false);

	// FORMIK SETUP FOR SIGNUP
	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			name: '',
			username: '',
			mobile_number: '',
			email_address: '',
			company_name: '',
			password: '',
			role_id: 0,
		},
		validate: (values) => {
			const errors: any = {};
			if (!values.name.trim()) errors.name = 'Full Name is required';
			if (!values.username.trim()) errors.username = 'Username is required';

			if (!values.mobile_number.trim()) {
				errors.mobile_number = 'Mobile number is required';
			} else if (!/^\d{10}$/.test(values.mobile_number.trim())) {
				errors.mobile_number = 'Enter a valid 10-digit mobile number';
			}

			if (!values.email_address.trim()) {
				errors.email_address = 'Email is required';
			} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email_address.trim())) {
				errors.email_address = 'Enter a valid email address';
			}

			if (!values.company_name.trim()) errors.company_name = 'Company Name is required';

			if (!values.password) {
				errors.password = 'Password is required';
			} else if (values.password.length < 6) {
				errors.password = 'Password must be at least 6 characters';
			}

			if (!values.role_id) errors.role_id = 'Please select a role';

			return errors;
		},
		validateOnChange: false,
		onSubmit: async (values) => {
			if (isSubmittingSignup) return;
			setIsSubmittingSignup(true);
			try {
				const response = await authService.register({
					name: values.name.trim(),
					username: values.username.trim(),
					mobile_number: values.mobile_number.trim(),
					email_address: values.email_address.trim(),
					company_name: values.company_name.trim(),
					password: values.password,
					role_id: Number(values.role_id),
				});

				const mobile = values.mobile_number.trim();
				setRegisteredMobile(mobile);
				showNotification(
					'Registration Successful',
					response?.message || 'OTP has been sent to your mobile number.',
					'success',
				);

				setStep('otp');
				setTimer(60);
				setOtp(['', '', '', '', '', '']);
			} catch (error: any) {
				const msg =
					error?.data?.message ||
					error?.message ||
					'Registration failed. Please check your details.';
				showNotification('Signup Failed', msg, 'danger');
			} finally {
				setIsSubmittingSignup(false);
			}
		},
	});

	// FETCH ACTIVE SIGNUP ROLES (WITH PAGINATION) & AUTO-SELECT FIRST ROLE
	const fetchRoles = async (pageToFetch: number) => {
		if (isLoadingRoles) return;
		setIsLoadingRoles(true);
		try {
			const res = await authService.getActiveSignupRoles(pageToFetch, 10);
			const newRoles = res?.data || [];
			setRoles((prev) => {
				const existingIds = new Set(prev.map((r) => r.id));
				const filtered = newRoles.filter((r) => !existingIds.has(r.id));
				const combined = [...prev, ...filtered];

				if (combined.length > 0 && (!formik.values.role_id || formik.values.role_id === 0)) {
					formik.setFieldValue('role_id', combined[0].id);
				}

				return combined;
			});

			if (newRoles.length > 0 && (!formik.values.role_id || formik.values.role_id === 0)) {
				formik.setFieldValue('role_id', newRoles[0].id);
			}

			const total = res?.total_document || 0;
			const currentCount = roles.length + newRoles.length;
			if (newRoles.length === 0 || (total > 0 && currentCount >= total)) {
				setHasMoreRoles(false);
			} else {
				setHasMoreRoles(true);
			}
			setRolesPage(pageToFetch);
		} catch (err: any) {
			console.error('Failed to load signup roles:', err);
		} finally {
			setIsLoadingRoles(false);
		}
	};

	// GUARANTEE API CALL EXECUTED EXACTLY ONCE ON MOUNT
	useEffect(() => {
		if (!hasFetchedRolesRef.current) {
			hasFetchedRolesRef.current = true;
			fetchRoles(1);
		}
	}, []);

	// HANDLE DROPDOWN SCROLL FOR PAGINATION
	const handleRolesScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const target = e.currentTarget;
		if (
			target.scrollTop + target.clientHeight >= target.scrollHeight - 20 &&
			hasMoreRoles &&
			!isLoadingRoles
		) {
			fetchRoles(rolesPage + 1);
		}
	};

	// CLOSE DROPDOWN ON OUTSIDE CLICK
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsRoleDropdownOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// TIMER EFFECT FOR OTP STEP
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

	// OTP INPUT HANDLERS
	const handleOtpChange = (index: number, value: string) => {
		const digit = value.replace(/\D/g, '').slice(-1);
		const newOtp = [...otp];
		newOtp[index] = digit;
		setOtp(newOtp);

		if (digit && index < 5) {
			otpInputRefs.current[index + 1]?.focus();
		}
	};

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			otpInputRefs.current[index - 1]?.focus();
		}
	};

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
		}
	};

	// VERIFY OTP SUBMIT
	const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmittingOtp) return;
		const otpCode = otp.join('');
		if (otpCode.length < 6) {
			showNotification('Invalid OTP', 'Please enter all 6 digits of the OTP.', 'warning');
			return;
		}

		setIsSubmittingOtp(true);
		try {
			const response = await authService.verifyOTP({
				mobile_number: registeredMobile,
				otp: otpCode,
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

	// RESEND OTP SUBMIT
	const handleResendOtp = async () => {
		if (timer > 0 || isResendingOtp) return;
		setIsResendingOtp(true);
		try {
			const response = await authService.resendOTP({
				mobile_number: registeredMobile,
			});

			const newCooldown = response?.cooldown_seconds || 60;
			setTimer(newCooldown);
			setOtp(['', '', '', '', '', '']);

			showNotification(
				'OTP Resent',
				response?.message || 'A new OTP has been sent to your mobile number.',
				'info',
			);
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

	// FORMAT MOBILE DISPLAY NUMBER
	const formatMobileDisplay = (num: string) => {
		if (!num) return '';
		if (num.length === 10) {
			return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
		}
		return num;
	};

	// SELECTED ROLE OBJECT
	const selectedRole = roles.find((r) => r.id === Number(formik.values.role_id));

	return (
		<PageWrapper
			isProtected={false}
			isGuestOnly
			title={step === 'signup' ? 'Create Your Account' : 'Verify OTP'}
			className='bg-dark'>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center py-2 py-sm-4'>
					<div className={step === 'otp' ? 'col-xl-4 col-lg-6 col-md-8' : 'col-xl-6 col-lg-8 col-md-10'}>
						<div className='cardspe-auth-card-container'>
							<div className='cardspe-auth-card'>
								{/* LOGO */}
								<div className='text-center mb-3 mb-sm-4'>
									<Link to='/' aria-label='Logo'>
										<img
											src={`${process.env.PUBLIC_URL}/logo-dark.png`}
											alt='CARDSPE'
											className='cardspe-auth-logo'
										/>
									</Link>
								</div>

								{step === 'signup' ? (
									/* ==================== SIGNUP FORM ==================== */
									<>
										<div className='text-center mb-3 mb-sm-4'>
											<h1 className='cardspe-auth-title'>Create Your Account</h1>
											<p className='cardspe-auth-subtitle'>
												Fill in the details below to get started
											</p>
										</div>

										<form onSubmit={formik.handleSubmit} noValidate autoComplete='off'>
											{/* FULL NAME */}
											<div className='mb-2.5 mb-sm-3'>
												<div className={`cardspe-field-group ${formik.touched.name && formik.errors.name ? 'has-error' : ''}`}>
													<div className='cardspe-field-icon'>
														<Icon icon='Person' size='lg' />
													</div>
													<div className='cardspe-field-content'>
														<span className='cardspe-field-label'>Full Name</span>
														<input
															type='text'
															name='name'
															autoComplete='off'
															className='cardspe-field-input'
															placeholder='Enter your full name'
															value={formik.values.name}
															onChange={formik.handleChange}
															onBlur={formik.handleBlur}
														/>
													</div>
												</div>
												{formik.touched.name && formik.errors.name && (
													<div className='text-danger small mt-1 ms-2 font-weight-bold'>
														{formik.errors.name}
													</div>
												)}
											</div>

											{/* USERNAME & MOBILE NUMBER */}
											<div className='row g-2.5 g-sm-3 mb-2.5 mb-sm-3'>
												<div className='col-md-6 col-12'>
													<div className={`cardspe-field-group ${formik.touched.username && formik.errors.username ? 'has-error' : ''}`}>
														<div className='cardspe-field-icon'>
															<Icon icon='PersonOutline' size='lg' />
														</div>
														<div className='cardspe-field-content'>
															<span className='cardspe-field-label'>Username</span>
															<input
																type='text'
																name='username'
																autoComplete='off'
																className='cardspe-field-input'
																placeholder='Enter your username'
																value={formik.values.username}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
															/>
														</div>
													</div>
													{formik.touched.username && formik.errors.username && (
														<div className='text-danger small mt-1 ms-2'>
															{formik.errors.username}
														</div>
													)}
												</div>

												<div className='col-md-6 col-12'>
													<div className={`cardspe-field-group ${formik.touched.mobile_number && formik.errors.mobile_number ? 'has-error' : ''}`}>
														<div className='cardspe-field-icon'>
															<Icon icon='Phone' size='lg' />
														</div>
														<div className='cardspe-field-content'>
															<span className='cardspe-field-label'>Mobile Number</span>
															<input
																type='text'
																name='mobile_number'
																autoComplete='off'
																className='cardspe-field-input'
																placeholder='Enter your mobile number'
																maxLength={10}
																value={formik.values.mobile_number}
																onChange={(e) => {
																	const val = e.target.value.replace(/\D/g, '');
																	formik.setFieldValue('mobile_number', val);
																}}
																onBlur={formik.handleBlur}
															/>
														</div>
													</div>
													{formik.touched.mobile_number && formik.errors.mobile_number && (
														<div className='text-danger small mt-1 ms-2'>
															{formik.errors.mobile_number}
														</div>
													)}
												</div>
											</div>

											{/* EMAIL & COMPANY NAME */}
											<div className='row g-2.5 g-sm-3 mb-2.5 mb-sm-3'>
												<div className='col-md-6 col-12'>
													<div className={`cardspe-field-group ${formik.touched.email_address && formik.errors.email_address ? 'has-error' : ''}`}>
														<div className='cardspe-field-icon'>
															<Icon icon='Email' size='lg' />
														</div>
														<div className='cardspe-field-content'>
															<span className='cardspe-field-label'>Email Address</span>
															<input
																type='email'
																name='email_address'
																autoComplete='off'
																className='cardspe-field-input'
																placeholder='Enter your email address'
																value={formik.values.email_address}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
															/>
														</div>
													</div>
													{formik.touched.email_address && formik.errors.email_address && (
														<div className='text-danger small mt-1 ms-2'>
															{formik.errors.email_address}
														</div>
													)}
												</div>

												<div className='col-md-6 col-12'>
													<div className={`cardspe-field-group ${formik.touched.company_name && formik.errors.company_name ? 'has-error' : ''}`}>
														<div className='cardspe-field-icon'>
															<Icon icon='Business' size='lg' />
														</div>
														<div className='cardspe-field-content'>
															<span className='cardspe-field-label'>Company Name</span>
															<input
																type='text'
																name='company_name'
																autoComplete='off'
																className='cardspe-field-input'
																placeholder='Enter your company name'
																value={formik.values.company_name}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
															/>
														</div>
													</div>
													{formik.touched.company_name && formik.errors.company_name && (
														<div className='text-danger small mt-1 ms-2'>
															{formik.errors.company_name}
														</div>
													)}
												</div>
											</div>

											{/* PASSWORD & ROLE */}
											<div className='row g-2.5 g-sm-3 mb-3 mb-sm-4'>
												<div className='col-md-6 col-12'>
													<div className={`cardspe-field-group ${formik.touched.password && formik.errors.password ? 'has-error' : ''}`}>
														<div className='cardspe-field-icon'>
															<Icon icon='Lock' size='lg' />
														</div>
														<div className='cardspe-field-content'>
															<span className='cardspe-field-label'>Password</span>
															<input
																type={showPassword ? 'text' : 'password'}
																name='password'
																autoComplete='new-password'
																className='cardspe-field-input'
																placeholder='Enter your password'
																value={formik.values.password}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
															/>
														</div>
														<button
															type='button'
															className='cardspe-toggle-btn'
															onClick={() => setShowPassword(!showPassword)}
															aria-label='Toggle password visibility'>
															<Icon icon={showPassword ? 'VisibilityOff' : 'Visibility'} />
														</button>
													</div>
													{formik.touched.password && formik.errors.password && (
														<div className='text-danger small mt-1 ms-2'>
															{formik.errors.password}
														</div>
													)}
												</div>

												<div className='col-md-6 col-12'>
													<div
														ref={dropdownRef}
														className={`cardspe-field-group ${formik.touched.role_id && formik.errors.role_id ? 'has-error' : ''} ${isRoleDropdownOpen ? 'is-open' : ''}`}
														onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}>
														<div className='cardspe-field-icon'>
															<Icon icon='Group' size='lg' />
														</div>
														<div className='cardspe-field-content'>
															<span className='cardspe-field-label'>Role</span>
															<div
																className={`cardspe-select-value ${!selectedRole ? 'placeholder' : ''}`}>
																{selectedRole ? selectedRole.role_name : 'Select Role'}
															</div>
														</div>
														<div className='cardspe-field-icon me-0 ms-1'>
															<Icon
																icon='KeyboardArrowDown'
																size='lg'
																className={`transition-all ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
															/>
														</div>

														{/* CUSTOM SCROLLABLE DROPDOWN MENU WITH PAGINATION */}
														{isRoleDropdownOpen && (
															<div
																className='cardspe-select-dropdown'
																onScroll={handleRolesScroll}
																onClick={(e) => e.stopPropagation()}>
																{roles.length === 0 && !isLoadingRoles ? (
																	<div className='cardspe-select-loader'>No roles available</div>
																) : (
																	roles.map((r) => (
																		<div
																			key={r.id}
																			className={`cardspe-select-option ${formik.values.role_id === r.id ? 'is-selected' : ''}`}
																			onClick={() => {
																				formik.setFieldValue('role_id', r.id);
																				setIsRoleDropdownOpen(false);
																			}}>
																			<span>{r.role_name}</span>
																			{formik.values.role_id === r.id && (
																				<Icon icon='Check' color='primary' size='sm' />
																			)}
																		</div>
																	))
																)}
																{isLoadingRoles && (
																	<div className='cardspe-select-loader'>
																		<Spinner isSmall isGrow /> Loading...
																	</div>
																)}
															</div>
														)}
													</div>
													{formik.touched.role_id && formik.errors.role_id && (
														<div className='text-danger small mt-1 ms-2'>
															{formik.errors.role_id}
														</div>
													)}
												</div>
											</div>

											{/* SUBMIT BUTTON */}
											<div className='mt-3 mt-sm-4'>
												<button
													type='submit'
													className='cardspe-auth-btn'
													disabled={isSubmittingSignup || formik.isSubmitting}>
													{isSubmittingSignup ? (
														<>
															<Spinner isSmall inButton isGrow />
															Creating Account...
														</>
													) : (
														<>
															<Icon icon='PersonAdd' size='lg' />
															Create Account
														</>
													)}
												</button>
											</div>

											{/* FOOTER SIGNIN LINK */}
											<div className='text-center mt-3 mt-sm-4'>
												<span className='text-muted small fw-semibold'>
													Already have an account?{' '}
													<Link
														to={`/${PAGE_ROUTES.LOGIN}`}
														className='text-decoration-none fw-bold'
														style={{ color: '#0E5F98' }}>
														Sign In
													</Link>
												</span>
											</div>
										</form>
									</>
								) : (
									/* ==================== OTP VERIFICATION FORM ==================== */
									<>
										<div className='text-center mb-4'>
											<h1 className='cardspe-auth-title'>Verify OTP</h1>
											<p className='cardspe-auth-subtitle mb-1'>
												We have sent a 6 digit OTP to your mobile number
											</p>
											<div className='fw-bold fs-6 text-dark mt-1'>
												{formatMobileDisplay(registeredMobile)}
											</div>
										</div>

										<form onSubmit={handleVerifyOtpSubmit}>
											{/* 6-DIGIT INPUT BOXES */}
											<div className='cardspe-otp-grid'>
												{otp.map((digit, idx) => (
													<input
														key={idx}
														ref={(el) => (otpInputRefs.current[idx] = el)}
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

											{/* RESEND OTP SECTION */}
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

											{/* BACK TO SIGNUP LINK */}
											<div className='text-center mt-4'>
												<button
													type='button'
													className='cardspe-back-link border-0 bg-transparent'
													onClick={() => setStep('signup')}>
													<Icon icon='ChevronLeft' size='md' />
													Back to Signup
												</button>
											</div>
										</form>
									</>
								)}
							</div>
							{/* STACKED CARD EFFECT */}
							<div className='cardspe-auth-card-stack' />
						</div>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default Signup;
