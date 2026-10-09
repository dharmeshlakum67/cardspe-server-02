import React, { FC } from 'react';
import ManageCommissionPage from '../../user-management/manage-commission/ManageCommissionPage';

export const MyCommissionPage: FC = () => {
	return <ManageCommissionPage isSelf />;
};

export default MyCommissionPage;
