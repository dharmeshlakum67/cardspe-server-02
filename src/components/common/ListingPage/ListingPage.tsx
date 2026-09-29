/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, react/forbid-prop-types, jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import usePermission from '../../../hooks/usePermission';
import Icon from '../../icon/Icon';
import Spinner from '../../bootstrap/Spinner';
import Collapse from '../../bootstrap/Collapse';
import AppBreadcrumbs from '../AppBreadcrumbs/AppBreadcrumbs';
import ListingActionButtons from './ListingActionButtons';
import ListingPagination from './ListingPagination';
import { authPagesMenu } from '../../../menu';
import { IListingPageProps } from './types';
import './ListingPage.scss';

export const ListingPage = <T,>({
	title,
	subTitle,
	breadcrumbs,
	permissionKey,

	// HEADER ACTIONS
	showFilterButton = true,
	isFilterOpenDefault = false,
	onAddNew,
	addNewText = 'Add New',
	addNewIcon,
	headerActions,

	// FILTER SECTION
	filterContent,
	activeFilterCount,

	// DATA & TABLE
	columns,
	data,
	isLoading = false,
	keyExtractor,
	emptyMessage = 'No records found',
	emptyIcon = 'SearchOff',

	// ACTIONS
	actions,

	// PAGINATION
	pagination,

	// CUSTOM SECTIONS
	tableTopContent,
	tableBottomContent,
	className,
}: IListingPageProps<T>): React.ReactElement | null => {
	const navigate = useNavigate();
	const { canCreate, canRead, isLoadingPermissions } = usePermission();
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(isFilterOpenDefault);

	// DETERMINE ADD NEW BUTTON VISIBILITY BASED ON PERMISSION
	const effectivePermKey = actions?.permissionKey || permissionKey;
	let isCreateAllowed = true;
	if (effectivePermKey) {
		isCreateAllowed = canCreate(effectivePermKey);
	}
	const showAddNewButton = Boolean(onAddNew && isCreateAllowed);

	// TOGGLE FILTER VISIBILITY
	const handleToggleFilter = () => {
		setIsFilterOpen((prev) => !prev);
	};

	// REDIRECT TO 404 IF USER HAS NO READ PERMISSION FOR THIS LISTING PAGE
	useEffect(() => {
		if (effectivePermKey && !isLoadingPermissions && !canRead(effectivePermKey)) {
			navigate(`/${authPagesMenu.page404.path}`, { replace: true });
		}
	}, [effectivePermKey, isLoadingPermissions, canRead, navigate]);

	// SHOW SPINNER WHILE PERMISSIONS ARE LOADING
	if (effectivePermKey && isLoadingPermissions) {
		return (
			<div className={classNames('listing-page-wrapper', className)}>
				<div
					className='d-flex flex-column align-items-center justify-content-center w-100 py-5'
					style={{ minHeight: '60vh' }}>
					<Spinner color='primary' size='3rem' isGrow={false} />
				</div>
			</div>
		);
	}

	// PREVENT RENDERING IF PERMISSION CHECK FAILS
	if (effectivePermKey && !isLoadingPermissions && !canRead(effectivePermKey)) {
		return null;
	}

	return (
		<div className={classNames('listing-page-wrapper', className)}>
			{/* TOP SUBHEADER BAR */}
			<div className='listing-top-bar'>
				{/* BREADCRUMB / TITLE */}
				<div>
					{breadcrumbs && breadcrumbs.length > 0 ? (
						<AppBreadcrumbs
							items={breadcrumbs.map((crumb) => ({
								label: crumb.text,
								to: crumb.to,
							}))}
						/>
					) : (
						<div>
							<h4 className='mb-0 fw-bold text-dark'>{title}</h4>
							{subTitle && <p className='text-muted small mb-0'>{subTitle}</p>}
						</div>
					)}
				</div>

				{/* RIGHT ACTIONS */}
				<div className='d-flex align-items-center gap-2 flex-wrap'>
					{/* CUSTOM HEADER ACTIONS */}
					{headerActions}

					{/* FILTER TOGGLE BUTTON (MATCHING PURPLE PILL) */}
					{showFilterButton && filterContent && (
						<button
							type='button'
							className='btn-toggle-filter'
							onClick={handleToggleFilter}>
							{isFilterOpen ? 'Hide Filter' : 'Show Filter'}
							{typeof activeFilterCount === 'number' && activeFilterCount > 0 && (
								<span className='badge bg-white text-dark rounded-pill ms-2'>
									{activeFilterCount}
								</span>
							)}
						</button>
					)}

					{/* ADD NEW BUTTON */}
					{showAddNewButton && (
						<button
							type='button'
							className='btn-add-action d-inline-flex align-items-center gap-2'
							onClick={onAddNew}>
							{addNewIcon ? (
								<Icon icon={addNewIcon} size='sm' />
							) : (
								<Icon icon='Add' size='sm' />
							)}
							<span>{addNewText.replace(/^\+\s*/, '')}</span>
						</button>
					)}
				</div>
			</div>

			{/* MAIN UNIFIED WHITE CARD */}
			<div className='listing-main-card'>
				{/* COLLAPSIBLE FILTER AREA */}
				{filterContent && (
					<Collapse isOpen={isFilterOpen}>
						<div className='listing-filter-area'>{filterContent}</div>
					</Collapse>
				)}

				{/* EXTRA TOP CONTENT */}
				{tableTopContent}

				{/* TABLE CONTAINER */}
				<div className='listing-table-container'>
					<table className='table align-middle'>
						<thead>
							<tr>
								{columns.map((col) => {
									const align = col.headerAlign || col.align || 'start';
									let textAlignment = 'text-start';
									if (align === 'center') {
										textAlignment = 'text-center';
									} else if (align === 'end') {
										textAlignment = 'text-end';
									}

									const headerContent = col.headerRender
										? col.headerRender(col)
										: col.header;

									const dynamicHeaderStyle: React.CSSProperties = {
										width: col.width,
										minWidth: col.minWidth,
										...(col.headerGradient ? { background: col.headerGradient } : {}),
										...(col.headerBackground ? { backgroundColor: col.headerBackground } : {}),
										...col.headerStyle,
									};

									return (
										<th
											key={col.key}
											className={classNames(textAlignment, col.headerClassName)}
											style={dynamicHeaderStyle}>
											{headerContent}
										</th>
									);
								})}

								{/* ACTION COLUMN HEADER */}
								{actions && (
									<th
										className='text-end text-nowrap'
										style={{
											width: actions.actionColumnWidth || 'auto',
											minWidth: actions.actionColumnWidth || '160px',
											whiteSpace: 'nowrap',
											textAlign: 'right',
										}}>
										{actions.actionColumnHeader || 'Action'}
									</th>
								)}
							</tr>
						</thead>
						<tbody>
							{/* LOADING STATE */}
							{isLoading && (
								<tr>
									<td
										colSpan={columns.length + (actions ? 1 : 0)}
										className='text-center py-5'>
										<div className='d-flex flex-column align-items-center justify-content-center gap-2'>
											<Spinner color='primary' size='2rem' isGrow={false} />
											<span className='text-muted small'>Loading data...</span>
										</div>
									</td>
								</tr>
							)}

							{/* EMPTY STATE */}
							{!isLoading && data.length === 0 && (
								<tr>
									<td
										colSpan={columns.length + (actions ? 1 : 0)}
										className='text-center py-5'>
										<div className='d-flex flex-column align-items-center justify-content-center text-muted'>
											<Icon
												icon={emptyIcon}
												size='3x'
												className='mb-2 opacity-50'
											/>
											<p className='mb-0 fw-medium'>{emptyMessage}</p>
										</div>
									</td>
								</tr>
							)}

							{/* DATA ROWS */}
							{!isLoading &&
								data.map((row, index) => {
									const rowKey = keyExtractor
										? keyExtractor(row, index)
										: (row as any).id || index;

									return (
										<tr key={rowKey}>
											{columns.map((col) => {
												let textAlignment = 'text-start';
												if (col.align === 'center') {
													textAlignment = 'text-center';
												} else if (col.align === 'end') {
													textAlignment = 'text-end';
												}

												const cellContent = col.render
													? col.render(row, index)
													: (row as any)[col.key] ?? '-';

												return (
													<td
														key={col.key}
														className={classNames(
															textAlignment,
															col.className,
														)}
														style={{
															width: col.width,
															minWidth: col.minWidth,
															...col.style,
														}}>
														{cellContent}
													</td>
												);
											})}

											{/* ACTION BUTTONS COLUMN (ALWAYS AT THE END) */}
											{actions && (
												<td
													className='text-end text-nowrap'
													style={{
														width: actions.actionColumnWidth || 'auto',
														minWidth: actions.actionColumnWidth || '160px',
														whiteSpace: 'nowrap',
														textAlign: 'right',
													}}>
													<ListingActionButtons
														row={row}
														index={index}
														actions={actions}
														fallbackPermissionKey={permissionKey}
													/>
												</td>
											)}
										</tr>
									);
								})}
						</tbody>
					</table>
				</div>

				{/* PAGINATION SECTION */}
				{pagination && !isLoading && data.length > 0 && (
					<div className='pt-3 mt-2 border-top'>
						<ListingPagination pagination={pagination} />
					</div>
				)}

				{/* EXTRA BOTTOM CONTENT */}
				{tableBottomContent}
			</div>
		</div>
	);
}

export default ListingPage;
