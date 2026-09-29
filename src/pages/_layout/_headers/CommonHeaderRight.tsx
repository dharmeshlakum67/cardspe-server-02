import React, { FC, ReactNode, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import Button, { IButtonProps } from '../../../components/bootstrap/Button';
import { HeaderRight } from '../../../layout/Header/Header';
import OffCanvas, {
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../components/bootstrap/OffCanvas';
import Alert from '../../../components/bootstrap/Alert';
import ThemeContext from '../../../contexts/themeContext';
import Popovers from '../../../components/bootstrap/Popovers';

interface ICommonHeaderRightProps {
	beforeChildren?: ReactNode;
	afterChildren?: ReactNode;
}
const CommonHeaderRight: FC<ICommonHeaderRightProps> = ({ beforeChildren, afterChildren }) => {
	const { fullScreenStatus, setFullScreenStatus } = useContext(ThemeContext);
	const styledBtn: IButtonProps = {
		color: 'light',
		hoverShadow: 'default',
		isLight: true,
		size: 'lg',
	};

	const [offcanvasStatus, setOffcanvasStatus] = useState(false);

	return (
		<HeaderRight>
			<div className='row g-3'>
				{beforeChildren}

				{/* Full Screen */}
				<div className='col-auto'>
					<Popovers trigger='hover' desc='Fullscreen'>
						<Button
							// eslint-disable-next-line react/jsx-props-no-spreading
							{...styledBtn}
							icon={fullScreenStatus ? 'FullscreenExit' : 'Fullscreen'}
							onClick={() => setFullScreenStatus(!fullScreenStatus)}
							aria-label='Toggle fullscreen'
						/>
					</Popovers>
				</div>

				{/* Notifications */}
				<div className='col-auto'>
					<Button
						// eslint-disable-next-line react/jsx-props-no-spreading
						{...styledBtn}
						icon='Notifications'
						onClick={() => setOffcanvasStatus(true)}
						aria-label='Notifications'
					/>
				</div>
				{afterChildren}
			</div>

			<OffCanvas
				id='notificationCanvas'
				titleId='offcanvasExampleLabel'
				placement='end'
				isOpen={offcanvasStatus}
				setOpen={setOffcanvasStatus}>
				<OffCanvasHeader setOpen={setOffcanvasStatus}>
					<OffCanvasTitle id='offcanvasExampleLabel'>Notifications</OffCanvasTitle>
				</OffCanvasHeader>
				<OffCanvasBody>
					<Alert icon='ViewInAr' isLight color='info' className='flex-nowrap'>
						Welcome to your new project workspace.
					</Alert>
				</OffCanvasBody>
			</OffCanvas>
		</HeaderRight>
	);
};
CommonHeaderRight.propTypes = {
	beforeChildren: PropTypes.node,
	afterChildren: PropTypes.node,
};
CommonHeaderRight.defaultProps = {
	beforeChildren: null,
	afterChildren: null,
};

export default CommonHeaderRight;
