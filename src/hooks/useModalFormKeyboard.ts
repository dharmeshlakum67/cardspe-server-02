import { useEffect, useCallback } from 'react';

export interface IModalFormKeyboardOptions {
	isOpen: boolean;
	isLoading?: boolean;
	nameInputRef: React.RefObject<HTMLInputElement>;
	statusButtonRef?: React.RefObject<HTMLButtonElement>;
	status: number | string;
	onStatusChange: (newStatus: any) => void;
	statusOptions: Array<{ value: number | string; label: string; [key: string]: any }>;
	onSubmit: () => void | Promise<void>;
	onClose: () => void;
}

// MODEL KEY
export const useModalFormKeyboard = ({
	isOpen,
	isLoading = false,
	nameInputRef,
	status,
	onStatusChange,
	statusOptions,
	onSubmit,
	onClose,
}: IModalFormKeyboardOptions) => {
	// FOCUS STATUS BLOCK
	const focusStatus = useCallback(() => {
		setTimeout(() => {
			const targetPill =
				document.getElementById(`status-pill-${status}`) ||
				document.querySelector<HTMLElement>('.status-binary-pill.is-selected') ||
				document.querySelector<HTMLElement>('.status-binary-pill') ||
				document.querySelector<HTMLElement>('.status-dropdown-control');
			targetPill?.focus();
		}, 20);
	}, [status]);

	// FOCUS NAME INPUT
	const focusNameInput = useCallback(() => {
		setTimeout(() => {
			if (nameInputRef.current) {
				nameInputRef.current.focus();
				nameInputRef.current.select();
			}
		}, 20);
	}, [nameInputRef]);

	// FOCUS SUBMIT / CONFIRM BUTTON
	const focusSubmitButton = useCallback(() => {
		setTimeout(() => {
			const submitBtn =
				document.querySelector<HTMLElement>('.btn-status-accept') ||
				document.querySelector<HTMLElement>('button[type="submit"]');
			submitBtn?.focus();
		}, 20);
	}, []);

	// FOCUS CANCEL BUTTON
	const focusCancelButton = useCallback(() => {
		setTimeout(() => {
			const cancelBtn = document.querySelector<HTMLElement>('.btn-status-cancel');
			cancelBtn?.focus();
		}, 20);
	}, []);

	// KEYDOWN HANDLER ON NAME INPUT
	const handleNameInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'ArrowDown' || e.key === 'Enter') {
				e.preventDefault();
				focusStatus();
			} else if (e.key === 'Tab' && !e.shiftKey) {
				e.preventDefault();
				focusStatus();
			} else if (e.key === 'Tab' && e.shiftKey) {
				e.preventDefault();
				focusCancelButton();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				onClose();
			}
		},
		[focusStatus, focusCancelButton, onClose],
	);

	// GLOBAL MODAL KEYDOWN HANDLER
	useEffect(() => {
		if (!isOpen || isLoading) return undefined;

		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			const activeEl = document.activeElement;
			const isInsideNameInput = activeEl === nameInputRef.current;
			const isSubmitBtn = activeEl?.classList.contains('btn-status-accept') || (activeEl as HTMLButtonElement)?.type === 'submit';
			const isCancelBtn = activeEl?.classList.contains('btn-status-cancel');
			const isStatusControl =
				activeEl?.classList.contains('status-binary-pill') ||
				activeEl?.classList.contains('status-dropdown-control') ||
				activeEl?.closest('.status-binary-toggle-container') !== null ||
				activeEl?.closest('.status-dropdown-wrapper') !== null;

			// TAB NAVIGATION FORWARD & BACKWARD
			if (e.key === 'Tab') {
				if (!e.shiftKey) {
					// FORWARD TAB
					if (isInsideNameInput) {
						e.preventDefault();
						focusStatus();
					} else if (isStatusControl) {
						e.preventDefault();
						focusSubmitButton();
					} else if (isSubmitBtn) {
						e.preventDefault();
						focusCancelButton();
					} else if (isCancelBtn) {
						e.preventDefault();
						focusNameInput();
					}
				} else if (isInsideNameInput) {
					// SHIFT+TAB (BACKWARD)
					e.preventDefault();
					focusCancelButton();
				} else if (isStatusControl) {
					e.preventDefault();
					focusNameInput();
				} else if (isSubmitBtn) {
					e.preventDefault();
					focusStatus();
				} else if (isCancelBtn) {
					e.preventDefault();
					focusSubmitButton();
				}
				return;
			}

			// ARROW AND ENTER KEYS WHEN NOT IN TEXT INPUT
			if (!isInsideNameInput) {
				if (e.key === 'ArrowUp') {
					e.preventDefault();
					focusNameInput();
				} else if (e.key === 'ArrowLeft') {
					e.preventDefault();
					const currIdx = statusOptions.findIndex((opt) => opt.value === status);
					const prevIdx = (currIdx - 1 + statusOptions.length) % statusOptions.length;
					const prevVal = statusOptions[prevIdx].value;
					onStatusChange(prevVal);
					setTimeout(() => {
						document.getElementById(`status-pill-${prevVal}`)?.focus();
					}, 20);
				} else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
					e.preventDefault();
					const currIdx = statusOptions.findIndex((opt) => opt.value === status);
					const nextIdx = (currIdx + 1) % statusOptions.length;
					const nextVal = statusOptions[nextIdx].value;
					onStatusChange(nextVal);
					setTimeout(() => {
						document.getElementById(`status-pill-${nextVal}`)?.focus();
					}, 20);
				} else if (e.key === 'Enter') {
					e.preventDefault();
					if (isCancelBtn) {
						onClose();
					} else {
						onSubmit();
					}
				}
			}

			if (e.key === 'Escape') {
				e.preventDefault();
				onClose();
			}
		};

		window.addEventListener('keydown', handleGlobalKeyDown);
		return () => {
			window.removeEventListener('keydown', handleGlobalKeyDown);
		};
	}, [
		isOpen,
		isLoading,
		nameInputRef,
		status,
		statusOptions,
		onStatusChange,
		focusStatus,
		focusNameInput,
		focusSubmitButton,
		focusCancelButton,
		onSubmit,
		onClose,
	]);

	return {
		handleNameInputKeyDown,
		focusStatus,
		focusNameInput,
		focusSubmitButton,
		focusCancelButton,
	};
};

export default useModalFormKeyboard;
