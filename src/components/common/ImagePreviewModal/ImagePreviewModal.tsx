import React, { FC, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Icon from '../../icon/Icon';

export interface IImagePreviewModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	imageUrl?: string;
	title?: string;
}

export const ImagePreviewModal: FC<IImagePreviewModalProps> = ({
	isOpen,
	setIsOpen,
	imageUrl = '',
	title = 'Image Preview',
}) => {
	const [cachedUrl, setCachedUrl] = useState<string>(imageUrl);
	const [cachedTitle, setCachedTitle] = useState<string>(title);

	useEffect(() => {
		if (imageUrl) {
			setCachedUrl(imageUrl);
		}
	}, [imageUrl]);

	useEffect(() => {
		if (title) {
			setCachedTitle(title);
		}
	}, [title]);

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg'>
			<ModalHeader setIsOpen={setIsOpen} className='border-bottom-0 pb-2'>
				<ModalTitle id='image-preview-modal-title'>
					<div className='d-flex align-items-center gap-2'>
						<Icon icon='Visibility' color='primary' />
						<span className='fw-bold'>{cachedTitle}</span>
					</div>
				</ModalTitle>
			</ModalHeader>
			<ModalBody className='d-flex align-items-center justify-content-center p-3'>
				<div
					className='d-flex align-items-center justify-content-center rounded-3 bg-light p-2 w-100 overflow-hidden shadow-sm'
					style={{ minHeight: '260px', maxHeight: '70vh' }}>
					{cachedUrl && (
						<img
							src={cachedUrl}
							alt={cachedTitle}
							className='img-fluid rounded-2 object-fit-contain'
							style={{ maxHeight: '65vh', maxWidth: '100%' }}
						/>
					)}
				</div>
			</ModalBody>
		</Modal>
	);
};

ImagePreviewModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setIsOpen: PropTypes.func.isRequired,
	imageUrl: PropTypes.string,
	title: PropTypes.string,
};

ImagePreviewModal.defaultProps = {
	imageUrl: '',
	title: 'Image Preview',
};

export default ImagePreviewModal;
