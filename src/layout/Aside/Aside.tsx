import React, { FC, ReactNode, useContext, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { motion, MotionStyle } from 'framer-motion';
import ThemeContext from '../../contexts/themeContext';
import Tooltips from '../../components/bootstrap/Tooltips';
import useAsideTouch from '../../hooks/useAsideTouch';

interface IAsideHeadProps {
	children: ReactNode;
}
export const AsideHead: FC<IAsideHeadProps> = ({ children }) => {
	return <div className='aside-head'>{children}</div>;
};

interface IAsideBodyProps {
	children: ReactNode;
}
export const AsideBody: FC<IAsideBodyProps> = ({ children }) => {
	return <div className='aside-body'>{children}</div>;
};

interface IAsideFootProps {
	children: ReactNode;
}
export const AsideFoot: FC<IAsideFootProps> = ({ children }) => {
	return <div className='aside-foot'>{children}</div>;
};

interface IAsideProps {
	children: any;
}
const Aside: FC<IAsideProps> = ({ children }) => {
	const { asideStatus } = useContext(ThemeContext);

	const { asideStyle, touchStatus, hasTouchButton, asideWidthWithSpace, x } = useAsideTouch();

	const isModernDesign = process.env.REACT_APP_MODERN_DESGIN === 'true';

	const constraintsRef = useRef(null);
	const asideRef = useRef<HTMLElement>(null);

	// CLEAR INLINE STYLE ON RESPONSIVE SO CSS MEDIA QUERIES FULLY CONTROL POSITION
	useEffect(() => {
		if (!hasTouchButton && asideRef.current) {
			asideRef.current.style.left = '';
		}
	}, [hasTouchButton]);

	return (
		<>
			<motion.aside
				ref={asideRef}
				style={asideStyle as MotionStyle}
				className={classNames(
					'aside',
					{ open: asideStatus },
					{
						'aside-touch-bar': asideStatus && hasTouchButton && isModernDesign,
						'aside-touch-bar-close': asideStatus && !touchStatus && hasTouchButton && isModernDesign,
						'aside-touch-bar-open': asideStatus && touchStatus && hasTouchButton && isModernDesign,
					},
				)}>
				{children}
			</motion.aside>
			{asideStatus && hasTouchButton && isModernDesign && (
				<>
					<motion.div className='aside-drag-area' ref={constraintsRef} />
					<Tooltips title='Toggle Aside' flip={['top', 'right']}>
						<motion.div
							className='aside-touch'
							drag='x'
							whileDrag={{ scale: 1.2 }}
							whileHover={{ scale: 1.1 }}
							dragConstraints={constraintsRef}
							// onDrag={(event, info) => console.log(info.point.x, info.point.y)}
							dragElastic={0.1}
							style={{ x, zIndex: 1039 }}
							onClick={() => x.set(x.get() === 0 ? asideWidthWithSpace : 0)}
						/>
					</Tooltips>
				</>
			)}
		</>
	);
};

export default Aside;
