/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react/require-default-props, react/forbid-prop-types */
import React, { FC } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import usePermission from '../../../hooks/usePermission';
import Icon from '../../icon/Icon';
import { IListingActionConfig } from './types';

interface IListingActionButtonsProps<T = any> {
	row: T;
	index: number;
	actions?: IListingActionConfig<T>;
	fallbackPermissionKey?: string;
}

export const ListingActionButtons: FC<IListingActionButtonsProps> = ({
	row,
	index,
	actions,
	fallbackPermissionKey,
}) => {
	const { canRead, canUpdate, canDelete } = usePermission();

	if (!actions) {
		return null;
	}

	const permissionKey = actions.permissionKey || fallbackPermissionKey;
	const isCircleVariant = actions.buttonVariant === 'circle';

	// DETERMINE VIEW PERMISSION AND VISIBILITY
	let isViewAllowed = true;
	if (permissionKey) {
		isViewAllowed = canRead(permissionKey);
	}
	if (typeof actions.showView === 'function') {
		isViewAllowed = isViewAllowed && actions.showView(row);
	} else if (typeof actions.showView === 'boolean') {
		isViewAllowed = isViewAllowed && actions.showView;
	} else if (!actions.onView) {
		isViewAllowed = false;
	}

	// DETERMINE EDIT PERMISSION AND VISIBILITY
	let isEditAllowed = true;
	if (permissionKey) {
		isEditAllowed = canUpdate(permissionKey);
	}
	if (typeof actions.showEdit === 'function') {
		isEditAllowed = isEditAllowed && actions.showEdit(row);
	} else if (typeof actions.showEdit === 'boolean') {
		isEditAllowed = isEditAllowed && actions.showEdit;
	} else if (!actions.onEdit) {
		isEditAllowed = false;
	}

	// DETERMINE DELETE PERMISSION AND VISIBILITY
	let isDeleteAllowed = true;
	if (permissionKey) {
		isDeleteAllowed = canDelete(permissionKey);
	}
	if (typeof actions.showDelete === 'function') {
		isDeleteAllowed = isDeleteAllowed && actions.showDelete(row);
	} else if (typeof actions.showDelete === 'boolean') {
		isDeleteAllowed = isDeleteAllowed && actions.showDelete;
	} else if (!actions.onDelete) {
		isDeleteAllowed = false;
	}

	const hasAnyAction =
		isViewAllowed || isEditAllowed || isDeleteAllowed || !!actions.customActions;

	if (!hasAnyAction) {
		return <span className='text-muted'>-</span>;
	}

	return (
		<div
			className='listing-action-buttons-group d-inline-flex align-items-center justify-content-end gap-2 flex-nowrap text-nowrap'
			style={{ display: 'inline-flex', flexWrap: 'nowrap', whiteSpace: 'nowrap', justifyContent: 'flex-end' }}>
			{/* CUSTOM ROW ACTIONS */}
			{actions.customActions && actions.customActions(row)}

			{/* VIEW ACTION BUTTON */}
			{isViewAllowed && (
				<button
					type='button'
					className={classNames(
						isCircleVariant
							? 'btn-action-circle btn-action-view'
							: 'btn-action-pill btn-action-view',
					)}
					title='View Details'
					aria-label='View'
					onClick={() => actions.onView && actions.onView(row)}>
					<Icon icon='Visibility' size='sm' />
					{!isCircleVariant && <span>{actions.viewText || 'View'}</span>}
				</button>
			)}

			{/* EDIT ACTION BUTTON */}
			{isEditAllowed && (
				<button
					type='button'
					className={classNames(
						isCircleVariant
							? 'btn-action-circle btn-action-edit'
							: 'btn-action-pill btn-action-edit',
					)}
					title='Edit Item'
					aria-label='Edit'
					onClick={() => actions.onEdit && actions.onEdit(row)}>
					<Icon icon='Edit' size='sm' />
					{!isCircleVariant && <span>{actions.editText || 'Edit'}</span>}
				</button>
			)}

			{/* DELETE ACTION BUTTON */}
			{isDeleteAllowed && (
				<button
					type='button'
					className={classNames(
						isCircleVariant
							? 'btn-action-circle btn-action-delete'
							: 'btn-action-pill btn-action-delete',
					)}
					title='Delete Item'
					aria-label='Delete'
					onClick={() => actions.onDelete && actions.onDelete(row)}>
					<Icon icon='DeleteOutline' size='sm' />
					{!isCircleVariant && <span>{actions.deleteText || 'Delete'}</span>}
				</button>
			)}
		</div>
	);
};

(ListingActionButtons as any).propTypes = {
	row: PropTypes.any.isRequired,
	index: PropTypes.number.isRequired,
	actions: PropTypes.shape({}),
	fallbackPermissionKey: PropTypes.string,
};

ListingActionButtons.defaultProps = {
	actions: undefined,
	fallbackPermissionKey: undefined,
};

export default ListingActionButtons;
