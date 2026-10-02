/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, react/forbid-prop-types */
import React, { FC, useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from '../../icon/Icon';
import { IListingPaginationConfig } from './types';
import './ListingPage.scss';

interface IListingPaginationProps {
	pagination: IListingPaginationConfig;
}

export const ListingPagination: FC<IListingPaginationProps> = ({ pagination }) => {
	const {
		currentPage,
		totalItems,
		perPage,
		perPageOptions = [10, 25, 50, 100],
		onPageChange,
		onPerPageChange,
	} = pagination;

	const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

	// CALCULATE RANGE FOR CURRENT PAGE
	const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
	const endItem = Math.min(currentPage * perPage, totalItems);

	// GENERATE PAGE NUMBERS (UP TO 5 VISIBLE WINDOW)
	const pageNumbers = useMemo(() => {
		const pages: number[] = [];
		const maxVisible = 4;
		let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
		let endPage = startPage + maxVisible - 1;

		if (endPage > totalPages) {
			endPage = totalPages;
			startPage = Math.max(1, endPage - maxVisible + 1);
		}

		for (let i = startPage; i <= endPage; i += 1) {
			pages.push(i);
		}
		return pages;
	}, [currentPage, totalPages]);

	return (
		<div className='listing-pagination-container d-flex align-items-center justify-content-between flex-wrap gap-3 py-2'>
			{/* LEFT: SHOWING SUMMARY */}
			<div className='text-muted' style={{ fontSize: '0.8125rem' }}>
				Showing {startItem} to {endItem} of {totalItems} items
			</div>

			{/* RIGHT: PAGINATION PILL BAR & PER-PAGE SELECT */}
			<div className='d-flex align-items-center gap-2'>
				{/* PILL BAR WITH ARROWS & PAGES */}
				<div className='pagination-pill-bar'>
					{/* FIRST PAGE BUTTON */}
					<button
						type='button'
						className='page-pill-btn nav-btn'
						disabled={currentPage <= 1}
						title='First Page'
						aria-label='First Page'
						onClick={() => onPageChange(1)}>
						<Icon icon='FirstPage' size='sm' />
					</button>

					{/* PREV PAGE BUTTON */}
					<button
						type='button'
						className='page-pill-btn nav-btn'
						disabled={currentPage <= 1}
						title='Previous Page'
						aria-label='Previous Page'
						onClick={() => onPageChange(currentPage - 1)}>
						<Icon icon='ChevronLeft' size='sm' />
					</button>

					{/* FIRST PAGE NUMBER IF OUT OF WINDOW */}
					{pageNumbers[0] > 1 && (
						<>
							<button
								type='button'
								className={classNames('page-pill-btn', {
									'is-active': currentPage === 1,
								})}
								onClick={() => onPageChange(1)}>
								1
							</button>
							{pageNumbers[0] > 2 && <span className='page-pill-dots'>...</span>}
						</>
					)}

					{/* WINDOW PAGE NUMBERS */}
					{pageNumbers.map((page) => (
						<button
							key={page}
							type='button'
							className={classNames('page-pill-btn', {
								'is-active': currentPage === page,
							})}
							onClick={() => onPageChange(page)}>
							{page}
						</button>
					))}

					{/* LAST PAGE NUMBER IF OUT OF WINDOW */}
					{pageNumbers[pageNumbers.length - 1] < totalPages && (
						<>
							{pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
								<span className='page-pill-dots'>...</span>
							)}
							<button
								type='button'
								className={classNames('page-pill-btn', {
									'is-active': currentPage === totalPages,
								})}
								onClick={() => onPageChange(totalPages)}>
								{totalPages}
							</button>
						</>
					)}

					{/* NEXT PAGE BUTTON */}
					<button
						type='button'
						className='page-pill-btn nav-btn'
						disabled={currentPage >= totalPages}
						title='Next Page'
						aria-label='Next Page'
						onClick={() => onPageChange(currentPage + 1)}>
						<Icon icon='ChevronRight' size='sm' />
					</button>

					{/* LAST PAGE BUTTON */}
					<button
						type='button'
						className='page-pill-btn nav-btn'
						disabled={currentPage >= totalPages}
						title='Last Page'
						aria-label='Last Page'
						onClick={() => onPageChange(totalPages)}>
						<Icon icon='LastPage' size='sm' />
					</button>
				</div>

				{/* PER-PAGE SELECT BOX */}
				{onPerPageChange && (
					<div className='per-page-selector'>
						<select
							className='form-select form-select-sm'
							aria-label='Items per page'
							value={perPage}
							onChange={(e) => onPerPageChange(Number(e.target.value))}>
							{perPageOptions.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					</div>
				)}
			</div>
		</div>
	);
};

(ListingPagination as any).propTypes = {
	pagination: PropTypes.shape({}).isRequired,
};

export default ListingPagination;
