import React from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Page from '../../../layout/Page/Page';
import SubHeader, {
	SubHeaderLeft,
	SubHeaderRight,
} from '../../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardHeader, CardTitle } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import AppBreadcrumbs from '../../../components/common/AppBreadcrumbs/AppBreadcrumbs';

const DashboardPage = () => {
	return (
		<PageWrapper title='Dashboard'>
			<SubHeader>
				<SubHeaderLeft>
					<AppBreadcrumbs items={[{ label: 'Dashboard', current: true }]} />
				</SubHeaderLeft>
				<SubHeaderRight>
					<Button color='primary' isLight icon='Add'>
						Action
					</Button>
				</SubHeaderRight>
			</SubHeader>
			<Page>
				<div className='row'>
					<div className='col-12 shadow-3d-container'>
						<Card className='shadow-3d-dark'>
							<CardHeader>
								<CardTitle>Dashboard</CardTitle>
							</CardHeader>
							<CardBody>
								<p className='text-muted mb-0'>
									Welcome to your dashboard. Start building your project
									components here.
								</p>
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default DashboardPage;
