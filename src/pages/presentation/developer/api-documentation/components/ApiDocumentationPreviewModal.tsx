import React, { FC } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../../../../components/bootstrap/Modal';
import Button from '../../../../../components/bootstrap/Button';
import { IApiDocumentation } from '../type/api-documentation.type';
import ApiDocumentationViewContent from './ApiDocumentationViewContent';

interface IApiDocumentationPreviewModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	doc: IApiDocumentation | null;
	onEdit?: (doc: IApiDocumentation) => void;
	canEdit?: boolean;
}

export const ApiDocumentationPreviewModal: FC<IApiDocumentationPreviewModalProps> = ({
	isOpen,
	setIsOpen,
	doc,
	onEdit,
	canEdit = false,
}) => {
	if (!doc) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl' isStaticBackdrop isScrollable>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id='api-doc-preview-modal-title'>Documentation Preview</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<ApiDocumentationViewContent
					doc={doc}
					onEdit={(d) => {
						setIsOpen(false);
						if (onEdit) onEdit(d);
					}}
					canEdit={canEdit}
				/>
			</ModalBody>
			<ModalFooter>
				<Button color='light' isLight onClick={() => setIsOpen(false)}>
					Close Preview
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ApiDocumentationPreviewModal;
