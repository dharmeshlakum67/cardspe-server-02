import React, { FC, useMemo } from 'react';
import PropTypes from 'prop-types';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export interface ICountryData {
	name: string;
	dialCode: string;
	countryCode: string;
	format: string;
}

export interface IContactNumberInputProps {
	id?: string;
	label?: string;
	required?: boolean;
	countryCode?: string;
	onCountryCodeChange?: (code: string) => void;
	value: string;
	onChange: (value: string, fullNumber?: string, countryData?: ICountryData) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export const ContactNumberInput: FC<IContactNumberInputProps> = ({
	id = 'phoneNumber',
	label = 'Mobile Number',
	required = false,
	countryCode = '+91',
	onCountryCodeChange,
	value,
	onChange,
	placeholder = 'Enter mobile number',
	disabled = false,
	className = '',
}) => {
	// SANITIZE COUNTRY DIAL CODE (DEFAULT: 91)
	const cleanDialCode = useMemo(() => {
		return (countryCode || '+91').replace(/\D/g, '') || '91';
	}, [countryCode]);

	// FORMAT VALUE FOR PHONE INPUT (INCLUDE '+' FOR ACCURATE COUNTRY DETECTION)
	const phoneInputValue = useMemo(() => {
		const rawDigits = (value || '').replace(/\D/g, '');
		if (!rawDigits) return cleanDialCode ? `+${cleanDialCode}` : '+91';
		if (rawDigits.startsWith(cleanDialCode)) return `+${rawDigits}`;
		return `+${cleanDialCode}${rawDigits}`;
	}, [value, cleanDialCode]);

	// HANDLE CHANGE FROM REACT-PHONE-INPUT-2
	const handleChange = (
		phoneVal: string,
		countryData: ICountryData | Record<string, any>,
		_event: React.ChangeEvent<HTMLInputElement>,
		_formattedValue: string,
	) => {
		const dial = countryData?.dialCode ? String(countryData.dialCode) : cleanDialCode;
		const fullDigits = (phoneVal || '').replace(/\D/g, '');

		// EXTRACT ONLY THE LOCAL NUMBER (STRIPPING DIAL CODE)
		let localNumber = fullDigits;
		if (dial && fullDigits.startsWith(dial)) {
			localNumber = fullDigits.slice(dial.length);
		}

		if (onCountryCodeChange && countryData?.dialCode) {
			onCountryCodeChange(`+${countryData.dialCode}`);
		}

		onChange(localNumber, `+${fullDigits}`, countryData as ICountryData);
	};

	return (
		<div className={`contact-number-input-container ${className}`}>
			{label && (
				<label
					htmlFor={id}
					className='form-label small fw-semibold text-muted mb-1 d-block'
					style={{ fontSize: '0.875rem' }}>
					{label}
					{required && (
						<span className='ms-1 fw-bold' style={{ color: '#f35421' }}>
							*
						</span>
					)}
				</label>
			)}

			<div className='phone-input-wrapper position-relative'>
				<PhoneInput
					value={phoneInputValue}
					onChange={handleChange}
					autoFormat={false}
					enableSearch
					searchPlaceholder='Search country...'
					searchNotFound='No country found'
					disabled={disabled}
					specialLabel=''
					countryCodeEditable={false}
					inputProps={{
						id,
						name: id,
						required,
						placeholder,
						className: 'form-control rounded-3',
						style: { height: '3.5rem', fontSize: '0.95rem' },
					}}
					containerClass='custom-tel-container'
					inputClass='form-control rounded-3'
					buttonClass='custom-tel-button'
					dropdownClass='custom-tel-dropdown shadow-lg'
					searchClass='custom-tel-search'
				/>
			</div>

			<style>{`
				.phone-input-wrapper {
					position: relative;
					width: 100%;
				}
				.custom-tel-container {
					width: 100% !important;
					height: 3.5rem !important;
					font-family: inherit !important;
					position: relative !important;
				}
				.custom-tel-container .react-tel-input {
					height: 100% !important;
					position: relative !important;
				}

				/* INHERIT EXACT SAME STYLING AS OTHER INPUTS */
				.custom-tel-container .form-control {
					width: 100% !important;
					height: 3.5rem !important;
					font-size: 0.95rem !important;
					padding-left: 48px !important;
				}

				/* FLAG TRIGGER BUTTON (TRANSPARENT, NO DIVIDING LINE) */
				.custom-tel-container .flag-dropdown.custom-tel-button {
					position: absolute !important;
					top: 0 !important;
					bottom: 0 !important;
					left: 0 !important;
					width: 44px !important;
					height: 100% !important;
					background-color: transparent !important;
					border: none !important;
					border-radius: 0.5rem 0 0 0.5rem !important;
					padding: 0 !important;
					margin: 0 !important;
					cursor: pointer !important;
					z-index: 5 !important;
				}
				.custom-tel-container .flag-dropdown.custom-tel-button:hover {
					background-color: transparent !important;
				}
				.custom-tel-container .flag-dropdown.custom-tel-button.open {
					background-color: transparent !important;
					z-index: 1060 !important;
				}
				.custom-tel-container .selected-flag {
					width: 100% !important;
					height: 100% !important;
					padding: 0 !important;
					margin: 0 !important;
					display: flex !important;
					align-items: center !important;
					justify-content: center !important;
					background: transparent !important;
				}
				.custom-tel-container .selected-flag .flag {
					position: static !important;
					margin: 0 !important;
					transform: scale(1.15) !important;
				}
				/* REMOVE DROPDOWN ARROW */
				.custom-tel-container .selected-flag .arrow {
					display: none !important;
				}

				/* DROPDOWN MENU */
				.custom-tel-container .country-list.custom-tel-dropdown {
					padding: 0 !important;
					margin: 4px 0 0 0 !important;
					list-style: none !important;
					position: absolute !important;
					top: 100% !important;
					left: 0 !important;
					width: 320px !important;
					max-height: 280px !important;
					overflow-y: auto !important;
					background-color: #ffffff !important;
					border-radius: 0.75rem !important;
					border: 1px solid rgba(0, 0, 0, 0.12) !important;
					box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
					z-index: 1070 !important;
					text-align: left !important;
				}

				/* SEARCH BAR CONTAINER */
				.custom-tel-container .country-list .search.custom-tel-search {
					position: sticky !important;
					top: 0 !important;
					background-color: #ffffff !important;
					padding: 8px 10px !important;
					margin: 0 !important;
					z-index: 2 !important;
					border-bottom: 1px solid #f1f5f9 !important;
					display: flex !important;
					align-items: center !important;
				}
				.custom-tel-container .country-list .search-box {
					width: 100% !important;
					margin: 0 !important;
					padding: 8px 12px !important;
					border: 1px solid #cbd5e1 !important;
					border-radius: 6px !important;
					font-size: 0.85rem !important;
					outline: none !important;
					box-sizing: border-box !important;
				}
				.custom-tel-container .country-list .search-box:focus {
					border-color: #20a486 !important;
					box-shadow: 0 0 0 2px rgba(32, 164, 134, 0.15) !important;
				}

				/* COUNTRY LIST ITEMS */
				.custom-tel-container .country-list .country {
					padding: 9px 12px !important;
					margin: 0 !important;
					display: flex !important;
					align-items: center !important;
					font-size: 0.875rem !important;
					color: #334155 !important;
					background-color: transparent !important;
					cursor: pointer !important;
					transition: background-color 0.15s ease !important;
				}
				.custom-tel-container .country-list .country:hover,
				.custom-tel-container .country-list .country.highlight {
					background-color: #f0fdf4 !important;
					color: #20a486 !important;
				}
				.custom-tel-container .country-list .country .flag {
					margin-right: 10px !important;
					flex-shrink: 0 !important;
				}
				.custom-tel-container .country-list .country .country-name {
					margin-right: 8px !important;
					flex-grow: 1 !important;
					font-size: 0.85rem !important;
				}
				.custom-tel-container .country-list .country .dial-code {
					font-weight: 600 !important;
					color: #2563eb !important;
					font-size: 0.825rem !important;
					margin-left: auto !important;
				}
			`}</style>
		</div>
	);
};

ContactNumberInput.propTypes = {
	id: PropTypes.string,
	label: PropTypes.string,
	required: PropTypes.bool,
	countryCode: PropTypes.string,
	onCountryCodeChange: PropTypes.func,
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	placeholder: PropTypes.string,
	disabled: PropTypes.bool,
	className: PropTypes.string,
};

ContactNumberInput.defaultProps = {
	id: 'phoneNumber',
	label: 'Mobile Number',
	required: false,
	countryCode: '+91',
	onCountryCodeChange: undefined,
	placeholder: 'Enter mobile number',
	disabled: false,
	className: '',
};

export default ContactNumberInput;
