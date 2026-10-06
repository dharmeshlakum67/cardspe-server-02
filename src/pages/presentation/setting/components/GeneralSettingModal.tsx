/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, no-nested-ternary */
import React, { FC, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../components/bootstrap/Modal';
import Button from '../../../../components/bootstrap/Button';
import Spinner from '../../../../components/bootstrap/Spinner';
import Icon from '../../../../components/icon/Icon';
import settingService from '../service/settingService';
import { IUpdateCompanySettingPayload } from '../type/setting-type';
import showNotification from '../../../../components/extras/showNotification';
import usePermission from '../../../../hooks/usePermission';
import { PERMISSION_KEYS } from '../../../../constants/permissionKeys';

interface IGeneralSettingModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}

export const GeneralSettingModal: FC<IGeneralSettingModalProps> = ({
	isOpen,
	setIsOpen,
}) => {
	const { canUpdate } = usePermission();
	const isUpdateAllowed =
		canUpdate(PERMISSION_KEYS.BASIC_SETTING) ||
		canUpdate('basic_setting') ||
		canUpdate(PERMISSION_KEYS.SETTING);

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	// FORM STATE
	const [formData, setFormData] = useState<IUpdateCompanySettingPayload>({
		company_name: '',
		customer_care_number: '',
		whatsapp_number: '',
		support_email_address: '',
		support_time: '',
		address: '',
		about_company: '',
	});

	// FETCH COMPANY SETTINGS ON MODAL OPEN
	const fetchCompanySettings = useCallback(async () => {
		setIsLoading(true);
		setFetchError(null);
		try {
			const res = await settingService.getCompanySetting();
			if (res && res.data) {
				const d = res.data;
				setFormData({
					company_name: d.company_name || '',
					customer_care_number: d.customer_care_number || '',
					whatsapp_number: d.whatsapp_number || '',
					support_email_address: d.support_email_address || '',
					support_time: d.support_time || '',
					address: d.address || '',
					about_company: d.about_company || '',
				});
			}
		} catch (error: any) {
			const errMsg =
				error?.data?.message || error?.message || 'Failed to fetch company settings';
			setFetchError(errMsg);
			showNotification('Error', errMsg, 'danger');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			fetchCompanySettings();
		}
	}, [isOpen, fetchCompanySettings]);

	const handleClose = () => {
		if (isSaving) return;
		setIsOpen(false);
	};

	const handleChange = (field: keyof IUpdateCompanySettingPayload, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// SUBMIT UPDATE TO API
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.company_name?.trim()) {
			showNotification('Validation Error', 'Company Name is required', 'warning');
			return;
		}

		setIsSaving(true);
		try {
			const payload: IUpdateCompanySettingPayload = {
				company_name: formData.company_name?.trim() || undefined,
				customer_care_number: formData.customer_care_number?.trim() || undefined,
				whatsapp_number: formData.whatsapp_number?.trim() || undefined,
				support_email_address: formData.support_email_address?.trim() || undefined,
				support_time: formData.support_time?.trim() || undefined,
				address: formData.address?.trim() || undefined,
				about_company: formData.about_company?.trim() || undefined,
			};

			const res = await settingService.updateCompanySetting(payload);
			showNotification(
				'Success',
				res?.message || 'Company settings updated successfully.',
				'success',
			);
			setIsOpen(false);
		} catch (error: any) {
			const errMsg =
				error?.data?.message || error?.message || 'Failed to update company settings';
			showNotification('Update Failed', errMsg, 'danger');
		} finally {
			setIsSaving(false);
		}
	};

	const inputStyle: React.CSSProperties = {
		height: '38px',
		borderRadius: '0.5rem',
		border: '1px solid #cbd5e1',
		fontSize: '0.9rem',
	};

	const textareaStyle: React.CSSProperties = {
		borderRadius: '0.5rem',
		border: '1px solid #cbd5e1',
		fontSize: '0.9rem',
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} isCentered size="lg">
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id="general-setting-modal-title">
					<div className="d-flex align-items-center gap-2">
						<Icon icon="Settings" color="primary" />
						<span className="fw-bold">General Company Settings</span>
					</div>
				</ModalTitle>
			</ModalHeader>

			{isLoading ? (
				<ModalBody className="p-5 text-center">
					<Spinner size="lg" isGrow className="text-primary mb-2" />
					<div className="fw-medium text-muted">Loading company settings...</div>
				</ModalBody>
			) : fetchError ? (
				<ModalBody className="p-5 text-center">
					<div className="text-danger mb-2">
						<Icon icon="Error" size="2x" />
					</div>
					<div className="fw-bold text-dark mb-1">Failed to Load Settings</div>
					<div className="text-muted small mb-3">{fetchError}</div>
					<Button type="button" color="primary" onClick={fetchCompanySettings}>
						Retry
					</Button>
				</ModalBody>
			) : (
				<form onSubmit={handleSubmit}>
					<ModalBody className="p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
						<div className="row g-3">
							{/* COMPANY NAME */}
							<div className="col-12 col-md-6">
								<label htmlFor="companyNameInput" className="form-label fw-bold small mb-1">
									Company Name <span className="text-danger">*</span>
								</label>
								<input
									id="companyNameInput"
									type="text"
									className="form-control role-name-input"
									placeholder="e.g. Cardspe Solutions Pvt. Ltd."
									value={formData.company_name || ''}
									onChange={(e) => handleChange('company_name', e.target.value)}
									style={inputStyle}
									disabled={!isUpdateAllowed || isSaving}
									required
								/>
							</div>

							{/* SUPPORT EMAIL ADDRESS */}
							<div className="col-12 col-md-6">
								<label htmlFor="supportEmailInput" className="form-label fw-bold small mb-1">
									Support Email Address
								</label>
								<input
									id="supportEmailInput"
									type="email"
									className="form-control role-name-input"
									placeholder="e.g. support@cardspe.com"
									value={formData.support_email_address || ''}
									onChange={(e) => handleChange('support_email_address', e.target.value)}
									style={inputStyle}
									disabled={!isUpdateAllowed || isSaving}
								/>
							</div>

							{/* CUSTOMER CARE NUMBER */}
							<div className="col-12 col-md-6">
								<label htmlFor="customerCareInput" className="form-label fw-bold small mb-1">
									Customer Care Number
								</label>
								<input
									id="customerCareInput"
									type="text"
									className="form-control role-name-input"
									placeholder="e.g. 1234567890"
									value={formData.customer_care_number || ''}
									onChange={(e) => handleChange('customer_care_number', e.target.value)}
									style={inputStyle}
									disabled={!isUpdateAllowed || isSaving}
								/>
							</div>

							{/* WHATSAPP SUPPORT NUMBER */}
							<div className="col-12 col-md-6">
								<label htmlFor="whatsappNumberInput" className="form-label fw-bold small mb-1">
									WhatsApp Support Number
								</label>
								<input
									id="whatsappNumberInput"
									type="text"
									className="form-control role-name-input"
									placeholder="e.g. 1234567890"
									value={formData.whatsapp_number || ''}
									onChange={(e) => handleChange('whatsapp_number', e.target.value)}
									style={inputStyle}
									disabled={!isUpdateAllowed || isSaving}
								/>
							</div>

							{/* SUPPORT WORKING TIME */}
							<div className="col-12">
								<label htmlFor="supportTimeInput" className="form-label fw-bold small mb-1">
									Support Hours / Availability
								</label>
								<input
									id="supportTimeInput"
									type="text"
									className="form-control role-name-input"
									placeholder="e.g. 10:00 AM - 07:00 PM (Mon - Sat)"
									value={formData.support_time || ''}
									onChange={(e) => handleChange('support_time', e.target.value)}
									style={inputStyle}
									disabled={!isUpdateAllowed || isSaving}
								/>
							</div>

							{/* OFFICE ADDRESS */}
							<div className="col-12">
								<label htmlFor="addressInput" className="form-label fw-bold small mb-1">
									Office / Registered Address
								</label>
								<textarea
									id="addressInput"
									rows={2}
									className="form-control role-name-input"
									placeholder="e.g. 123 Tech Park, 4th Floor, Sector 5..."
									value={formData.address || ''}
									onChange={(e) => handleChange('address', e.target.value)}
									style={textareaStyle}
									disabled={!isUpdateAllowed || isSaving}
								/>
							</div>

							{/* ABOUT COMPANY */}
							<div className="col-12">
								<label htmlFor="aboutCompanyInput" className="form-label fw-bold small mb-1">
									About Company / Overview
								</label>
								<textarea
									id="aboutCompanyInput"
									rows={3}
									className="form-control role-name-input"
									placeholder="e.g. Leading B2B Fintech & Card Management Platform."
									value={formData.about_company || ''}
									onChange={(e) => handleChange('about_company', e.target.value)}
									style={textareaStyle}
									disabled={!isUpdateAllowed || isSaving}
								/>
							</div>
						</div>
					</ModalBody>

					<ModalFooter className="px-4 py-3">
						<Button
							type="button"
							color="light"
							onClick={handleClose}
							isDisable={isSaving}>
							{isUpdateAllowed ? 'Cancel' : 'Close'}
						</Button>
						{isUpdateAllowed && (
							<Button type="submit" color="primary" isDisable={isSaving}>
								{isSaving ? (
									<>
										<Spinner isSmall inButton isGrow className="me-2" />
										Saving...
									</>
								) : (
									<>
										<Icon icon="Save" className="me-1" />
										Save Changes
									</>
								)}
							</Button>
						)}
					</ModalFooter>
				</form>
			)}
		</Modal>
	);
};

(GeneralSettingModal as any).propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
};

export default GeneralSettingModal;
