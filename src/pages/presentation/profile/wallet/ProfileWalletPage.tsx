import React, { FC } from 'react';
import WalletTransactionListPage from '../../payments/wallet-transaction/WalletTransactionListPage';

export const ProfileWalletPage: FC = () => {
	return <WalletTransactionListPage isSelf />;
};

export default ProfileWalletPage;
