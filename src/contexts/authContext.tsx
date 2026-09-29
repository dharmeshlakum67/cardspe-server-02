import React, { createContext, FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import USERS, { getUserDataWithUsername, IUserProps } from '../common/data/userDummyData';
import authService, { IAuthUser } from '../pages/presentation/auth/services/authService';
import { getImageUrl } from '../helpers/helpers';

export interface IAuthContextProps {
	user: string;
	setUser?(...args: unknown[]): unknown;
	userData: Partial<IUserProps>;
	authUser?: IAuthUser | null;
	setAuthUser?(user: IAuthUser | null): void;
	refetchMe?(): Promise<IAuthUser | null>;
	isLoading?: boolean;
}
const AuthContext = createContext<IAuthContextProps>({} as IAuthContextProps);

interface IAuthContextProviderProps {
	children: ReactNode;
}
export const AuthContextProvider: FC<IAuthContextProviderProps> = ({ children }) => {
	// ENSURE NO USER DATA RESIDES IN LOCALSTORAGE / SESSIONSTORAGE
	try {
		localStorage.removeItem('cardspe_user');
		localStorage.removeItem('user');
		localStorage.removeItem('facit_user');
		sessionStorage.removeItem('cardspe_user');
		sessionStorage.removeItem('user');
	} catch (e) {
		// IGNORE
	}

	const [user, setUser] = useState<string>('');
	const [userData, setUserData] = useState<Partial<IUserProps>>({});
	const [authUser, setAuthUser] = useState<IAuthUser | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const applyUserData = useCallback((currentUser: IAuthUser | null, fallbackUsername: string) => {
		if (currentUser) {
			const u = currentUser as any;
			const rawPath =
				u.profile_picture ||
				u.profile_image ||
				u.profileImage ||
				u.profile_image_url ||
				u.profileImageUrl ||
				u.avatar ||
				u.image ||
				u.photo ||
				u.user?.profile_picture ||
				u.user?.profile_image;
			const avatarUrl = getImageUrl(rawPath, USERS.JOHN.src);
			setUserData({
				...USERS.JOHN,
				src: avatarUrl,
				srcSet: avatarUrl,
				username: currentUser.username,
				name: currentUser.name || currentUser.username,
				surname: '',
				position: currentUser.role?.role_name || 'Administrator',
				email: currentUser.email_address || "",
			});
			return;
		}

		if (fallbackUsername) {
			const found = getUserDataWithUsername(fallbackUsername);
			if (found) {
				setUserData(found);
			} else {
				setUserData({
					...USERS.JOHN,
					username: fallbackUsername,
					name: fallbackUsername,
					surname: '',
					position: 'Administrator',
				});
			}
		} else {
			setUserData({});
		}
	}, []);

	// REFETCH ME DETAILS FROM SERVER
	const refetchMe = useCallback(async (): Promise<IAuthUser | null> => {
		const token = authService.getToken();
		if (!token) {
			setIsLoading(false);
			return null;
		}
		try {
			const me = await authService.getMe();
			if (me) {
				setAuthUser(me);
				setUser(me.username || me.name);
				applyUserData(me, me.username || me.name);
				setIsLoading(false);
				return me;
			}
		} catch {
			// ERRORS HANDLED BY APICLIENT INTERCEPTOR
		}
		setIsLoading(false);
		return null;
	}, [applyUserData]);

	// FETCH ME ON INITIAL LOAD IF TOKEN EXISTS
	useEffect(() => {
		const token = authService.getToken();
		if (token) {
			refetchMe();
		} else {
			setIsLoading(false);
		}
	}, [refetchMe]);

	const handleSetUser = useCallback((newUsername: any) => {
		const usernameStr = typeof newUsername === 'string' ? newUsername : '';
		setUser(usernameStr);
		if (!usernameStr) {
			setAuthUser(null);
			setUserData({});
		}
	}, []);

	const handleSetAuthUser = useCallback(
		(userObj: IAuthUser | null) => {
			setAuthUser(userObj);
			if (userObj) {
				const usernameStr = userObj.username || userObj.name;
				setUser(usernameStr);
				applyUserData(userObj, usernameStr);
			} else {
				setUser('');
				setUserData({});
			}
		},
		[applyUserData],
	);

	const value = useMemo(
		() => ({
			user,
			setUser: handleSetUser,
			userData,
			authUser,
			setAuthUser: handleSetAuthUser,
			refetchMe,
			isLoading,
		}),
		[user, handleSetUser, userData, authUser, handleSetAuthUser, refetchMe, isLoading],
	);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
AuthContextProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default AuthContext;
