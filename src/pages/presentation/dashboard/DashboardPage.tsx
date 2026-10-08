/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { FC, useCallback, useContext, useEffect, useRef, useState } from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, {
	SubHeaderLeft,
	SubHeaderRight,
} from '../../../layout/SubHeader/SubHeader';
import AppBreadcrumbs from '../../../components/common/AppBreadcrumbs/AppBreadcrumbs';
import showNotification from '../../../components/extras/showNotification';
import AuthContext from '../../../contexts/authContext';
import {
	DashboardQueryParams,
	DashboardSummaryResponse,
	TDatePreset,
} from './type/dashboard.type';
import dashboardService from './service/dashboardService';
import UserVerificationBanner from './components/UserVerificationBanner';
import UserSummarySection from './components/UserSummarySection';
import AddMoneySummarySection from './components/AddMoneySummarySection';
import RechargeSummarySection from './components/RechargeSummarySection';
import DashboardDateFilter, {
	calculateDatesForPreset,
} from './components/DashboardDateFilter';
import './css/Dashboard.scss';

export const DashboardPage: FC = () => {
	// INITIAL DATE STATE (TODAY'S DATE)
	const initialDates = calculateDatesForPreset('today');
	const [startDate, setStartDate] = useState<string>(initialDates.startDate);
	const [endDate, setEndDate] = useState<string>(initialDates.endDate);

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
	const [dashboardData, setDashboardData] =
		useState<DashboardSummaryResponse | null>(null);

	// REF GUARDS TO PREVENT DUPLICATE OR RACE-CONDITION CALLS
	const isFetchingRef = useRef<boolean>(false);
	const activeRequestKeyRef = useRef<string>('');

	// FETCH DASHBOARD SUMMARY DATA
	const fetchDashboardData = useCallback(
		async (start?: string, end?: string, showRefreshSpinner = false) => {
			const requestKey = `${start || ''}_${end || ''}`;

			if (!showRefreshSpinner && isFetchingRef.current && activeRequestKeyRef.current === requestKey) {
				return;
			}

			isFetchingRef.current = true;
			activeRequestKeyRef.current = requestKey;

			if (showRefreshSpinner) {
				setIsRefreshing(true);
			} else {
				setIsLoading(true);
			}

			try {
				const queryParams: DashboardQueryParams = {};
				if (start && start.trim()) queryParams.start_date = start.trim();
				if (end && end.trim()) queryParams.end_date = end.trim();

				const res = await dashboardService.getDashboardSummary(queryParams);

				if (res && res.data) {
					setDashboardData(res.data);
				} else if (res && (res as any).user_summary) {
					// Fallback if data is at root
					setDashboardData(res as unknown as DashboardSummaryResponse);
				}
			} catch (error: any) {
				const errMsg =
					error?.message ||
					error?.data?.message ||
					'Failed to load dashboard summary.';
				showNotification('Dashboard Error', errMsg, 'danger');
			} finally {
				setIsLoading(false);
				setIsRefreshing(false);
				isFetchingRef.current = false;
			}
		},
		[],
	);

	// INITIAL LOAD (EXACTLY ONCE ON COMPONENT MOUNT)
	useEffect(() => {
		fetchDashboardData(startDate, endDate);
	}, []);

	// HANDLE DATE FILTER CHANGES (TRIGGERED ON PRESET CLICK OR CUSTOM RANGE COMPLETE)
	const handleDateChange = useCallback(
		(range: { startDate: string; endDate: string; preset: TDatePreset }) => {
			setStartDate(range.startDate);
			setEndDate(range.endDate);

			// Only fetch if custom range has both start and end, or if preset is selected
			if (range.preset !== 'custom' || (range.startDate && range.endDate)) {
				fetchDashboardData(range.startDate, range.endDate, true);
			}
		},
		[fetchDashboardData],
	);

	// MANUAL REFRESH BUTTON
	const handleRefresh = useCallback(() => {
		activeRequestKeyRef.current = '';
		fetchDashboardData(startDate, endDate, true);
	}, [fetchDashboardData, startDate, endDate]);

	// AUTH USER CONTEXT & PERMISSION CHECKS
	const { authUser } = useContext(AuthContext);

	const isSuperAdmin = Boolean(
		authUser?.is_super_admin ||
		authUser?.role?.role_type?.toLowerCase() === 'super_user' ||
		authUser?.role?.role_type?.toLowerCase() === 'super_admin' ||
		authUser?.role?.role_type?.toLowerCase().includes('super') ||
		(authUser as any)?.role_type?.toLowerCase() === 'super_user'
	);

	const isMobileVerified =
		dashboardData?.is_mobile_verified !== undefined
			? Boolean(dashboardData.is_mobile_verified)
			: Boolean(authUser?.is_mobile_verified);

	const isEmailVerified =
		dashboardData?.is_email_verified !== undefined
			? Boolean(dashboardData.is_email_verified)
			: Boolean(authUser?.is_email_verified);

	const kycStatus =
		dashboardData?.kyc_status ||
		authUser?.kyc_status ||
		(authUser as any)?.user?.kyc_status ||
		(authUser as any)?.kyc?.status ||
		'not_submitted';

	return (
		<PageWrapper title='Dashboard'>
			{/* SUBHEADER WITH BREADCRUMB & DATE FILTER CONTROLS */}
			<SubHeader>
				<SubHeaderLeft>
					<AppBreadcrumbs items={[{ label: 'Dashboard', current: true }]} />
				</SubHeaderLeft>
				<SubHeaderRight>
					<DashboardDateFilter
						startDate={startDate}
						endDate={endDate}
						onDateChange={handleDateChange}
						onRefresh={handleRefresh}
						isRefreshing={isRefreshing}
					/>
				</SubHeaderRight>
			</SubHeader>

			{/* MAIN DASHBOARD CONTENT */}
			<Page container='fluid'>
				<div className='dashboard-container'>
					{/* 0. USER ACCOUNT VERIFICATION STATUS BANNER */}
					<UserVerificationBanner
						isMobileVerified={isMobileVerified}
						isEmailVerified={isEmailVerified}
						kycStatus={kycStatus}
						isSuperAdmin={isSuperAdmin}
						isLoading={isLoading}
					/>

					{/* 1. USER SUMMARY ROW */}
					<div className='row'>
						<div className='col-12'>
							<UserSummarySection
								userSummary={dashboardData?.user_summary || []}
								isLoading={isLoading}
							/>
						</div>
					</div>

					{/* 2. TRANSACTION SUMMARIES ROW (ADD MONEY & RECHARGE) */}
					<div className='row g-4'>
						{/* LEFT COLUMN: ADD MONEY SUMMARY */}
						<div className='col-12 col-xl-5'>
							<AddMoneySummarySection
								addMoneySummary={dashboardData?.add_money_summary || []}
								isLoading={isLoading}
							/>
						</div>

						{/* RIGHT COLUMN: RECHARGE SUMMARY */}
						<div className='col-12 col-xl-7'>
							<RechargeSummarySection
								rechargeSummary={dashboardData?.recharge_summary || []}
								isLoading={isLoading}
							/>
						</div>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default DashboardPage;
