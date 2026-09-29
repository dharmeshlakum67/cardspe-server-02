import React, { useContext, useMemo, useState } from 'react';
import Brand from '../../../layout/Brand/Brand';
import Navigation from '../../../layout/Navigation/Navigation';
import User from '../../../layout/User/User';
import ThemeContext from '../../../contexts/themeContext';
import Aside, { AsideBody, AsideFoot, AsideHead } from '../../../layout/Aside/Aside';
import Icon from '../../../components/icon/Icon';
import usePermission from '../../../hooks/usePermission';

// RECURSIVELY FILTER MENU ITEMS BY SEARCH QUERY
const filterMenu = (menu: Record<string, any>, query: string): Record<string, any> => {
	if (!query.trim()) return menu;
	const lower = query.toLowerCase().trim();
	const result: Record<string, any> = {};

	Object.entries(menu).forEach(([key, item]) => {
		const textMatch = item.text?.toLowerCase().includes(lower);

		let subMenuMatch: Record<string, any> | null = null;
		if (item.subMenu && typeof item.subMenu === 'object') {
			const filteredSubs = filterMenu(item.subMenu, lower);
			if (Object.keys(filteredSubs).length > 0) {
				subMenuMatch = filteredSubs;
			}
		}

		if (textMatch) {
			result[key] = item;
		} else if (subMenuMatch) {
			result[key] = {
				...item,
				subMenu: subMenuMatch,
			};
		}
	});

	return result;
};

const DefaultAside = () => {
	const { asideStatus, setAsideStatus } = useContext(ThemeContext);
	const { dynamicMenu } = usePermission();
	const [searchTerm, setSearchTerm] = useState('');

	// MEMOIZE FILTERED MENU BASED ON SEARCH QUERY AND DYNAMIC PERMISSIONS
	const filteredMenu = useMemo(() => {
		return filterMenu(dynamicMenu, searchTerm);
	}, [dynamicMenu, searchTerm]);

	const hasResults = Object.keys(filteredMenu).length > 0;

	return (
		<Aside>
			<AsideHead>
				<Brand asideStatus={asideStatus} setAsideStatus={setAsideStatus} />
			</AsideHead>

			{/* SEARCH MENU INPUT */}
			<div className='aside-search'>
				<div className='position-relative d-flex align-items-center'>
					<input
						type='text'
						className='form-control'
						placeholder='Search Menu...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<button
							type='button'
							aria-label='Clear Search'
							className='btn btn-link position-absolute end-0 text-muted p-0 me-2 d-flex align-items-center border-0'
							style={{ textDecoration: 'none' }}
							onClick={() => setSearchTerm('')}>
							<Icon icon='Close' size='sm' />
						</button>
					)}
				</div>
			</div>

			<AsideBody>
				{hasResults ? (
					<Navigation menu={filteredMenu} id='aside-dashboard' />
				) : (
					<div className='px-3 py-3 text-center text-white-50 small'>
						No menu found
					</div>
				)}
			</AsideBody>

			<AsideFoot>
				<User />
			</AsideFoot>
		</Aside>
	);
};

export default DefaultAside;
