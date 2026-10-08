/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, react/require-default-props */
import React, { FC, useState } from 'react';
import Modal, {
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
} from '../../../../../components/bootstrap/Modal';
import Icon from '../../../../../components/icon/Icon';
import { TApiKeyType } from '../../../../../type/api-key-request.type';

interface IInstantGeneratedKeyModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	keyType?: TApiKeyType;
	apiKey: string;
}

export const InstantGeneratedKeyModal: FC<IInstantGeneratedKeyModalProps> = ({
	isOpen,
	setIsOpen,
	keyType = 'live',
	apiKey,
}) => {
	const [isKeyCopied, setIsKeyCopied] = useState<boolean>(false);

	const handleCopyKey = () => {
		if (!apiKey) return;
		navigator.clipboard.writeText(apiKey);
		setIsKeyCopied(true);
		setTimeout(() => setIsKeyCopied(false), 2000);
	};

	const isLive = keyType === 'live';

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			isCentered
			isStaticBackdrop>
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom-0 pb-0 pt-4 px-4'>
				<ModalTitle id='instant-key-modal-title'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-inline-flex align-items-center justify-content-center rounded-3'
							style={{
								width: '42px',
								height: '42px',
								background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
								color: '#ffffff',
								boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
							}}>
							<Icon icon='RocketLaunch' size='md' />
						</div>
						<div>
							<h5 className='mb-0 fw-bold text-dark' style={{ letterSpacing: '-0.01em' }}>
								{isLive ? 'Live Production API Key Generated' : 'API Key Generated'}
							</h5>
							<small className='text-muted' style={{ fontSize: '0.8rem' }}>
								Your production API key is active and ready for live integration
							</small>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody className='px-4 pt-3 pb-3'>
				{/* API KEY FIELD */}
				<div className='mb-2'>
					<label className='form-label fw-bold small text-uppercase text-muted mb-1' style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
						Generated Production API Key
					</label>
					<div className='modal-credential-input-box'>
						<code className='credential-code-text'>{apiKey}</code>
						<button
							type='button'
							className={`btn-credential-copy ${isKeyCopied ? 'copied' : ''}`}
							onClick={handleCopyKey}>
							<Icon icon={isKeyCopied ? 'Check' : 'ContentCopy'} size='sm' />
							<span>{isKeyCopied ? 'Copied!' : 'Copy'}</span>
						</button>
					</div>
				</div>
			</ModalBody>

			<ModalFooter className='border-top-0 pt-0 pb-4 px-4'>
				<button
					type='button'
					className='btn-modal-done w-100'
					onClick={() => setIsOpen(false)}>
					<Icon icon='Done' size='sm' />
					<span>Done</span>
				</button>
			</ModalFooter>
		</Modal>
	);
};

InstantGeneratedKeyModal.defaultProps = {
	keyType: 'live',
};

export default InstantGeneratedKeyModal;

