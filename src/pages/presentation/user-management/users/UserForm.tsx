/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { FC, useEffect, useState, useCallback } from 'react';
import Icon from '../../../../components/icon/Icon';
import AppBreadcrumbs from '../../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import showNotification from '../../../../components/extras/showNotification';
import { PAGE_ROUTES } from '../../../../constants/pageRoutes';
import { IUserCreatePayload, IUserUpdatePayload, IActiveAdminItem } from './type/user-type';
import { IRoleItem } from '../../role/type/role-type';
import { IActiveStateItem } from '../../master/state/type/state-type';
import { IConstantOption } from '../../../../services/constantService';
import userService from './service/userService';
import './css/UserManagement.scss';

interface IUserFormProps {
	mode?: 'add' | 'edit';
	initialValues?: Partial<IUserCreatePayload & { id?: number }>;
	onSubmit: (values: IUserCreatePayload | IUserUpdatePayload) => Promise<void>;
	isSubmitting: boolean;
	roles: IRoleItem[];
	states: IActiveStateItem[];
	statusOptions: IConstantOption[];
	onCancel: () => void;
	title?: string;
}

// RESOLVE PARENT ROLE SLUG LOOKUP BASED ON SELECTED ROLE
const resolveParentRoleSlug = (roleSlug?: string): string | undefined => {
	if (!roleSlug) return undefined;
	const s = roleSlug.toLowerCase().trim();
	if (s === 'retailer') return 'distributor';
	if (s === 'distributor') return 'super-distributor';
	return undefined;
};

export const UserForm: FC<IUserFormProps> = ({
	mode = 'add',
	initialValues,
	onSubmit,
	isSubmitting,
	roles,
	states,
	statusOptions,
	onCancel,
	title,
}) => {
	const isEditMode = mode === 'edit';
	const pageTitle = title || (isEditMode ? 'Edit User' : 'Create User');

	// BASIC & ACCOUNT INFO STATES
	const [name, setName] = useState<string>(initialValues?.name || '');
	const [username, setUsername] = useState<string>(initialValues?.username || '');
	const [companyName, setCompanyName] = useState<string>(initialValues?.company_name || '');
	const [emailAddress, setEmailAddress] = useState<string>(initialValues?.email_address || '');
	const [mobileNumber, setMobileNumber] = useState<string>(initialValues?.mobile_number || '');
	const [password, setPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');
	const [roleId, setRoleId] = useState<number | string>(initialValues?.role_id || '');
	const [parentId, setParentId] = useState<number | string>(
		initialValues?.parent_id !== undefined && initialValues?.parent_id !== null
			? String(initialValues.parent_id)
			: '',
	);
	const [status, setStatus] = useState<string>(initialValues?.status || 'inactive');

	// LOCATION & ADDRESS STATES
	const [stateId, setStateId] = useState<number | string>(
		initialValues?.state_id !== undefined && initialValues?.state_id !== null
			? String(initialValues.state_id)
			: '',
	);
	const [city, setCity] = useState<string>(initialValues?.city || '');
	const [postalCode, setPostalCode] = useState<string>(initialValues?.postal_code || '');
	const [address, setAddress] = useState<string>(initialValues?.address || '');

	// PARENT ADMINS STATE (FETCHED DYNAMICALLY ON ROLE SELECTION)
	const [parentAdmins, setParentAdmins] = useState<IActiveAdminItem[]>([]);
	const [isLoadingParents, setIsLoadingParents] = useState<boolean>(false);

	// PASSWORD VISIBILITY TOGGLE
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

	// FETCH ACTIVE PARENTS ON DEMAND BASED ON SELECTED ROLE HIERARCHY
	const fetchActiveParents = useCallback(async (roleSlug?: string) => {
		setIsLoadingParents(true);
		try {
			const parentRoleSlug = resolveParentRoleSlug(roleSlug);
			const res = await userService.getActiveAdmins({
				role_slug: parentRoleSlug || undefined,
			});
			if (res?.data && Array.isArray(res.data)) {
				setParentAdmins(res.data);
			} else {
				setParentAdmins([]);
			}
		} catch (err) {
			setParentAdmins([]);
		} finally {
			setIsLoadingParents(false);
		}
	}, []);

	// SYNC FORM WHEN INITIAL VALUES OR ROLES UPDATE
	useEffect(() => {
		if (initialValues) {
			if (initialValues.name !== undefined) setName(initialValues.name || '');
			if (initialValues.username !== undefined) setUsername(initialValues.username || '');
			if (initialValues.company_name !== undefined) setCompanyName(initialValues.company_name || '');
			if (initialValues.email_address !== undefined) setEmailAddress(initialValues.email_address || '');
			if (initialValues.mobile_number !== undefined) setMobileNumber(initialValues.mobile_number || '');
			if (initialValues.role_id !== undefined && initialValues.role_id !== null) {
				setRoleId(String(initialValues.role_id));
			}
			if (initialValues.parent_id !== undefined && initialValues.parent_id !== null) {
				setParentId(String(initialValues.parent_id));
			}
			if (initialValues.status !== undefined) setStatus(initialValues.status || 'inactive');
			if (initialValues.state_id !== undefined && initialValues.state_id !== null) {
				setStateId(String(initialValues.state_id));
			}
			if (initialValues.city !== undefined) setCity(initialValues.city || '');
			if (initialValues.postal_code !== undefined) setPostalCode(initialValues.postal_code || '');
			if (initialValues.address !== undefined) setAddress(initialValues.address || '');

			// Trigger parent candidates fetch if role is present
			if (initialValues.role_id && roles.length > 0) {
				const matchedRole = roles.find((r) => String(r.id) === String(initialValues.role_id));
				if (matchedRole) {
					fetchActiveParents(matchedRole.slug || (matchedRole as any)?.role_key);
				}
			}
		}
	}, [initialValues, roles, fetchActiveParents]);

	// WHEN ROLE CHANGES MANUALLY IN SELECT, RESET PARENT AND FETCH UPDATED CANDIDATES
	const handleRoleChange = (newRoleId: string) => {
		setRoleId(newRoleId);
		setParentId(''); // Reset parent selection on role change

		if (!newRoleId) {
			setParentAdmins([]);
			return;
		}

		const selectedRole = roles.find((r) => String(r.id) === newRoleId);
		fetchActiveParents(selectedRole?.slug || (selectedRole as any)?.role_key);
	};

	// FORM VALIDATION & SUBMIT
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			showNotification('Validation Error', 'Full Name is required', 'warning');
			return;
		}

		if (!username.trim()) {
			showNotification('Validation Error', 'Username is required', 'warning');
			return;
		}

		// USERNAME NO SPACES / ALPHANUMERIC
		const usernameRegex = /^[a-zA-Z0-9._-]+$/;
		if (!usernameRegex.test(username.trim())) {
			showNotification(
				'Validation Error',
				'Username can only contain letters, numbers, dots, underscores, or hyphens (no spaces)',
				'warning',
			);
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailAddress.trim() || !emailRegex.test(emailAddress.trim())) {
			showNotification('Validation Error', 'Please enter a valid Email Address', 'warning');
			return;
		}

		const cleanMobile = mobileNumber.replace(/\D/g, '');
		if (!cleanMobile || cleanMobile.length < 10) {
			showNotification('Validation Error', 'Please enter a valid 10-digit Mobile Number', 'warning');
			return;
		}

		if (!roleId) {
			showNotification('Validation Error', 'Please select a Role', 'warning');
			return;
		}

		// PASSWORD VALIDATION (REQUIRED FOR ADD, OPTIONAL FOR EDIT)
		if (!isEditMode) {
			if (!password) {
				showNotification('Validation Error', 'Password is required', 'warning');
				return;
			}
			if (password.length < 6) {
				showNotification('Validation Error', 'Password must be at least 6 characters long', 'warning');
				return;
			}
			if (confirmPassword && password !== confirmPassword) {
				showNotification('Validation Error', 'Passwords do not match', 'warning');
				return;
			}
		} else if (password) {
			// In edit mode, if user provided a new password, validate it
			if (password.length < 6) {
				showNotification('Validation Error', 'Password must be at least 6 characters long', 'warning');
				return;
			}
			if (confirmPassword && password !== confirmPassword) {
				showNotification('Validation Error', 'Passwords do not match', 'warning');
				return;
			}
		}

		const payload: IUserCreatePayload = {
			name: name.trim(),
			username: username.trim(),
			company_name: companyName.trim() || null,
			email_address: emailAddress.trim().toLowerCase(),
			mobile_number: cleanMobile,
			password: password || '',
			role_id: Number(roleId),
			parent_id: parentId ? Number(parentId) : null,
			status: status || 'inactive',
			state_id: stateId ? Number(stateId) : null,
			city: city.trim() || null,
			address: address.trim() || null,
			postal_code: postalCode.trim() || null,
		};

		await onSubmit(payload);
	};

	return (
		<form onSubmit={handleSubmit} className="user-form-page">
			{/* HEADER & ACTIONS */}
			<div className="user-page-header">
				<div className="user-title-section">
					<AppBreadcrumbs
						items={[
							{ label: 'User Management' },
							{ label: 'Users', to: `/${PAGE_ROUTES.USERS}` },
							{ label: pageTitle, current: true },
						]}
					/>
				</div>
				<div className="user-header-actions">
					<button
						type="button"
						className="btn-cancel-action"
						onClick={onCancel}
						disabled={isSubmitting}>
						<Icon icon="Cancel" size="sm" />
						<span>Cancel</span>
					</button>
					<button
						type="submit"
						className="btn-save-action"
						disabled={isSubmitting}>
						<Icon icon="Save" size="sm" />
						<span>
							{(() => {
								if (isSubmitting) {
									return isEditMode ? 'Updating User...' : 'Creating User...';
								}
								return isEditMode ? 'Update User' : 'Create User';
							})()}
						</span>
					</button>
				</div>
			</div>

			{/* SECTION 1: BASIC & ACCOUNT INFORMATION */}
			<div className="user-card">
				<div className="card-header-bar">
					<div className="header-left">
						<div className="card-header-icon">
							<Icon icon="PersonOutline" />
						</div>
						<div>
							<h5 className="card-header-title">Basic & Account Information</h5>
							<p className="card-header-subtitle">Enter personal, company, contact and authentication details</p>
						</div>
					</div>
				</div>
				<div className="card-body-content">
					<div className="row g-3">
						{/* FULL NAME */}
						<div className="col-12 col-md-4">
							<label htmlFor="userNameInput" className="form-label">
								Full Name <span className="text-danger">*</span>
							</label>
							<input
								id="userNameInput"
								type="text"
								className="form-control"
								placeholder="e.g. Jane Smith"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>

						{/* USERNAME */}
						<div className="col-12 col-md-4">
							<label htmlFor="userUsernameInput" className="form-label">
								Username <span className="text-danger">*</span>
							</label>
							<input
								id="userUsernameInput"
								type="text"
								className="form-control"
								placeholder="e.g. janesmith"
								value={username}
								onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
								required
							/>
						</div>

						{/* COMPANY NAME */}
						<div className="col-12 col-md-4">
							<label htmlFor="userCompanyInput" className="form-label">
								Company Name <span className="text-muted">(Optional)</span>
							</label>
							<input
								id="userCompanyInput"
								type="text"
								className="form-control"
								placeholder="e.g. Smith Tech Ltd"
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
							/>
						</div>

						{/* EMAIL ADDRESS */}
						<div className="col-12 col-md-6">
							<label htmlFor="userEmailInput" className="form-label">
								Email Address <span className="text-danger">*</span>
							</label>
							<input
								id="userEmailInput"
								type="email"
								className="form-control"
								placeholder="e.g. jane@example.com"
								value={emailAddress}
								onChange={(e) => setEmailAddress(e.target.value)}
								required
							/>
						</div>

						{/* MOBILE NUMBER */}
						<div className="col-12 col-md-6">
							<label htmlFor="userMobileInput" className="form-label">
								Mobile Number <span className="text-danger">*</span>
							</label>
							<input
								id="userMobileInput"
								type="tel"
								className="form-control"
								placeholder="e.g. 9876543210"
								maxLength={15}
								value={mobileNumber}
								onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
								required
							/>
						</div>

						{/* ROLE SELECTION */}
						<div className="col-12 col-md-4">
							<label htmlFor="userRoleSelect" className="form-label">
								Assign Role <span className="text-danger">*</span>
							</label>
							<select
								id="userRoleSelect"
								className="form-select"
								value={roleId}
								onChange={(e) => handleRoleChange(e.target.value)}
								required>
								<option value="">-- Select Role --</option>
								{roles.map((r) => (
									<option key={r.id} value={r.id}>
										{r.role_name}
									</option>
								))}
							</select>
						</div>

						{/* PARENT USER (DYNAMICALLY FETCHED ON ROLE SELECTION) */}
						<div className="col-12 col-md-4">
							<label htmlFor="userParentSelect" className="form-label">
								Parent User <span className="text-muted">(Optional)</span>
							</label>
							<select
								id="userParentSelect"
								className="form-select"
								value={parentId}
								disabled={!roleId || isLoadingParents}
								onChange={(e) => setParentId(e.target.value)}>
								<option value="">None (Top Level / Direct)</option>
								{isLoadingParents ? (
									<option disabled value="">Loading parent users...</option>
								) : (
									parentAdmins.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name} (@{p.username})
										</option>
									))
								)}
							</select>
						</div>

						{/* ACCOUNT STATUS (DYNAMIC CONSTANTS) */}
						<div className="col-12 col-md-4">
							<label htmlFor="userStatusSelect" className="form-label">
								Account Status <span className="text-danger">*</span>
							</label>
							<select
								id="userStatusSelect"
								className="form-select"
								value={status}
								onChange={(e) => setStatus(e.target.value)}
								required>
								{statusOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						{/* PASSWORD */}
						<div className="col-12 col-md-6">
							<label htmlFor="userPasswordInput" className="form-label">
								Password {isEditMode ? <span className="text-muted">(Optional)</span> : <span className="text-danger">*</span>}
							</label>
							<div className="input-password-wrapper">
								<input
									id="userPasswordInput"
									type={showPassword ? 'text' : 'password'}
									className="form-control"
									placeholder={
										isEditMode
											? 'Leave blank to keep existing password'
											: 'Enter password (min 6 characters)'
									}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required={!isEditMode}
								/>
								<button
									type="button"
									className="btn-toggle-password"
									aria-label="Toggle password visibility"
									onClick={() => setShowPassword((prev) => !prev)}>
									<Icon icon={showPassword ? 'VisibilityOff' : 'Visibility'} size="sm" />
								</button>
							</div>
						</div>

						{/* CONFIRM PASSWORD */}
						<div className="col-12 col-md-6">
							<label htmlFor="userConfirmPasswordInput" className="form-label">
								Confirm Password {isEditMode && <span className="text-muted">(Optional)</span>}
							</label>
							<div className="input-password-wrapper">
								<input
									id="userConfirmPasswordInput"
									type={showConfirmPassword ? 'text' : 'password'}
									className="form-control"
									placeholder={
										isEditMode
											? 'Leave blank to keep existing password'
											: 'Re-enter password'
									}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
								/>
								<button
									type="button"
									className="btn-toggle-password"
									aria-label="Toggle confirm password visibility"
									onClick={() => setShowConfirmPassword((prev) => !prev)}>
									<Icon icon={showConfirmPassword ? 'VisibilityOff' : 'Visibility'} size="sm" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* SECTION 2: LOCATION & ADDRESS INFORMATION */}
			<div className="user-card">
				<div className="card-header-bar">
					<div className="header-left">
						<div className="card-header-icon">
							<Icon icon="LocationOn" />
						</div>
						<div>
							<h5 className="card-header-title">Location & Address Information</h5>
							<p className="card-header-subtitle">Optional geographic and billing location details</p>
						</div>
					</div>
				</div>
				<div className="card-body-content">
					<div className="row g-3">
						{/* STATE DROPDOWN */}
						<div className="col-12 col-md-4">
							<label htmlFor="userStateSelect" className="form-label">
								State <span className="text-muted">(Optional)</span>
							</label>
							<select
								id="userStateSelect"
								className="form-select"
								value={stateId}
								onChange={(e) => setStateId(e.target.value)}>
								<option value="">-- Select State --</option>
								{states.map((st) => (
									<option key={st.id} value={st.id}>
										{st.name}
									</option>
								))}
							</select>
						</div>

						{/* CITY */}
						<div className="col-12 col-md-4">
							<label htmlFor="userCityInput" className="form-label">
								City <span className="text-muted">(Optional)</span>
							</label>
							<input
								id="userCityInput"
								type="text"
								className="form-control"
								placeholder="e.g. Mumbai"
								value={city}
								onChange={(e) => setCity(e.target.value)}
							/>
						</div>

						{/* POSTAL CODE */}
						<div className="col-12 col-md-4">
							<label htmlFor="userPostalCodeInput" className="form-label">
								Postal Code <span className="text-muted">(Optional)</span>
							</label>
							<input
								id="userPostalCodeInput"
								type="text"
								className="form-control"
								placeholder="e.g. 400001"
								maxLength={10}
								value={postalCode}
								onChange={(e) => setPostalCode(e.target.value)}
							/>
						</div>

						{/* FULL ADDRESS */}
						<div className="col-12">
							<label htmlFor="userAddressInput" className="form-label">
								Address Details <span className="text-muted">(Optional)</span>
							</label>
							<textarea
								id="userAddressInput"
								className="form-control"
								rows={2}
								placeholder="e.g. 402, Business Center"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
							/>
						</div>
					</div>
				</div>
			</div>
		</form>
	);
};

UserForm.defaultProps = {
	mode: 'add',
	initialValues: undefined,
	title: undefined,
};

export default UserForm;
