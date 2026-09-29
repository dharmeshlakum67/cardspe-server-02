import { useContext } from 'react';
import PermissionContext from '../contexts/permissionContext';

export default function usePermission() {
	return useContext(PermissionContext);
}
