/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jsx-a11y/label-has-associated-control, @typescript-eslint/naming-convention, no-nested-ternary, react/require-default-props, react/default-props-match-prop-types */
import React, { FC, useState } from 'react';
import Icon from '../../../../../components/icon/Icon';
import Spinner from '../../../../../components/bootstrap/Spinner';
import showNotification from '../../../../../components/extras/showNotification';
import { formatDateTime } from '../../../../../helpers/dateUtils';
import {
	TApiKeyType,
	IEnvKeyStatus,
	IMyApiKeysData,
} from '../../../../../type/api-key-request.type';
import apiKeyRequestService from '../service/apiKeyRequestService';
import InstantGeneratedKeyModal from './InstantGeneratedKeyModal';
import '../css/ApiKeyRequestPage.scss';

interface IActiveApiKeysCardsProps {
	myKeysData?: IMyApiKeysData | null;
	isLoading: boolean;
	onRefresh: () => void;
	onRequestKey: (type: TApiKeyType) => void;
	hasCreatePermission?: boolean;
}

export const ActiveApiKeysCards: FC<IActiveApiKeysCardsProps> = ({
	myKeysData,
	isLoading,
	onRefresh,
	onRequestKey,
	hasCreatePermission = true,
}) => {
	const [isCopied, setIsCopied] = useState<boolean>(false);
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const [isMasked, setIsMasked] = useState<boolean>(true);

	const [generatedModalData, setGeneratedModalData] = useState<{
		isOpen: boolean;
		keyType: TApiKeyType;
		apiKey: string;
	}>({
		isOpen: false,
		keyType: 'live',
		apiKey: '',
	});

	// TOGGLE KEY MASKING
	const toggleMask = () => {
		setIsMasked((prev) => !prev);
	};

	// MASK HELPER
	const getDisplayKey = (key: string, masked: boolean) => {
		if (!key) return '';
		if (!masked || key.length < 16) return key;
		const prefix = key.slice(0, 14);
		const suffix = key.slice(-5);
		return `${prefix}${'•'.repeat(16)}${suffix}`;
	};

	// COPY HANDLER
	const handleCopy = (apiKey: string) => {
		if (!apiKey) return;
		navigator.clipboard.writeText(apiKey);
		setIsCopied(true);
		showNotification('Copied', 'Production API Key copied to clipboard!', 'info');
		setTimeout(() => setIsCopied(false), 2000);
	};

	// INSTANT GENERATION HANDLER (CALLS POST /api/developer/api-key/generate FOR LIVE KEY)
	const handleInstantGenerate = async () => {
		if (!hasCreatePermission) {
			showNotification('Permission Denied', 'You do not have permission to generate API keys.', 'warning');
			return;
		}

		setIsGenerating(true);
		try {
			const res: any = await apiKeyRequestService.generateApiKey({
				key_type: 'live',
			});

			// If backend returned key details
			const createdKeyData = res?.data?.key || res?.data?.apiKey || res?.data;
			const apiKeyVal =
				createdKeyData?.api_key ||
				res?.data?.api_key ||
				(typeof res?.data === 'string' ? res?.data : '');

			if (apiKeyVal) {
				setGeneratedModalData({
					isOpen: true,
					keyType: 'live',
					apiKey: apiKeyVal,
				});
			} else {
				showNotification(
					'Key Generated',
					res?.message || 'Your Production API Key has been generated successfully!',
					'success',
				);
			}

			onRefresh();
		} catch (error: any) {
			showNotification(
				'Generation Failed',
				error?.data?.message || error?.message || 'Could not generate Production API key.',
				'danger',
			);
		} finally {
			setIsGenerating(false);
		}
	};

	// RENDER PRODUCTION ENVIRONMENT CARD
	const renderProductionCard = (envStatus: IEnvKeyStatus | undefined) => {
		if (isLoading || !envStatus) {
			return (
				<div className='premium-key-card theme-live loading-shimmer'>
					<div className='card-header-bar'>
						<div className='d-flex align-items-center gap-2'>
							<div className='shimmer-box shimmer-icon' />
							<div>
								<div className='shimmer-box shimmer-title' />
								<div className='shimmer-box shimmer-sub' />
							</div>
						</div>
						<div className='shimmer-box shimmer-badge' />
					</div>
					<div className='shimmer-box shimmer-box-body mt-3' />
				</div>
			);
		}

		const { key, has_active_key, has_pending_request, can_generate } = envStatus;

		return (
			<div className='premium-key-card theme-live'>
				{/* TOP AMBIENT GLOW BAR */}
				<div className='card-glow-bar' />

				{/* CARD HEADER */}
				<div className='card-header-bar'>
					<div className='d-flex align-items-center gap-3'>
						<div className='env-icon-badge'>
							<Icon icon='RocketLaunch' size='sm' />
						</div>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h6 className='env-name-heading mb-0'>Live Production</h6>
								<span className='env-pill-tag tag-live'>PROD</span>
							</div>
							<p className='env-sub-caption mb-0'>Production API Integration & Live Transactions</p>
						</div>
					</div>

					{/* STATUS BADGE */}
					<div>
						{has_active_key ? (
							<div className='status-pill-active'>
								<span className='pulse-circle' />
								<span>ACTIVE</span>
							</div>
						) : has_pending_request ? (
							<div className='status-pill-pending'>
								<Icon icon='HourglassTop' size='sm' />
								<span>IN REVIEW</span>
							</div>
						) : can_generate ? (
							<div className='status-pill-ready'>
								<Icon icon='AutoAwesome' size='sm' />
								<span>READY</span>
							</div>
						) : (
							<div className='status-pill-inactive'>
								<span>INACTIVE</span>
							</div>
						)}
					</div>
				</div>

				{/* CARD BODY */}
				<div className='card-body-section'>
					{has_active_key && key ? (
						<div className='active-key-view'>
							{/* KEY CODE CONTAINER */}
							<div className='key-terminal-box'>
								<div className='key-string-wrapper'>
									<Icon icon='VpnKey' size='sm' className='key-prefix-icon' />
									<code className='key-text'>
										{getDisplayKey(key.api_key, isMasked)}
									</code>
								</div>

								<div className='d-flex align-items-center gap-1 flex-shrink-0'>
									{/* TOGGLE MASK BUTTON */}
									<button
										type='button'
										className='btn-terminal-action'
										title={isMasked ? 'Reveal Key' : 'Hide Key'}
										onClick={toggleMask}>
										<Icon icon={isMasked ? 'Visibility' : 'VisibilityOff'} size='sm' />
									</button>

									{/* COPY BUTTON */}
									<button
										type='button'
										className={`btn-terminal-copy ${isCopied ? 'btn-copied' : ''}`}
										title='Copy API Key'
										onClick={() => handleCopy(key.api_key)}>
										<Icon icon={isCopied ? 'Check' : 'ContentCopy'} size='sm' />
										<span>{isCopied ? 'Copied' : 'Copy'}</span>
									</button>
								</div>
							</div>

							{/* FOOTER METADATA & ROLL ACTION */}
							<div className='key-footer-bar'>
								<div className='d-flex align-items-center gap-2 text-muted' style={{ fontSize: '0.75rem' }}>
									<Icon icon='Schedule' size='sm' />
									<span>
										{key.created_at ? (
											<>Issued: <strong className='text-dark'>{formatDateTime(key.created_at).date}</strong></>
										) : (
											<>Active Production Key</>
										)}
									</span>
								</div>

								{has_pending_request ? (
									<div className='d-flex align-items-center gap-1 text-warning' style={{ fontSize: '0.75rem', fontWeight: 600 }}>
										<Icon icon='Sync' size='sm' className='spin-animation' />
										<span>Regeneration in progress</span>
									</div>
								) : (
									hasCreatePermission && (
										<button
											type='button'
											className='btn-roll-pill'
											onClick={() => onRequestKey('live')}>
											<Icon icon='Refresh' size='sm' />
											<span>Roll Key</span>
										</button>
									)
								)}
							</div>
						</div>
					) : can_generate ? (
						<div className='instant-ready-view'>
							<div className='instant-info-text'>
								<Icon icon='Bolt' className='text-warning flex-shrink-0' size='sm' />
								<span>No Production API key active. Generate your production credentials instantly.</span>
							</div>

							<button
								type='button'
								className='btn-instant-trigger trigger-live'
								disabled={isGenerating || !hasCreatePermission}
								onClick={handleInstantGenerate}>
								{isGenerating ? (
									<>
										<Spinner isSmall isGrow={false} className='me-2' />
										<span>Generating...</span>
									</>
								) : (
									<>
										<Icon icon='FlashOn' size='sm' />
										<span>Generate Production Key</span>
									</>
								)}
							</button>
						</div>
					) : has_pending_request ? (
						<div className='review-pending-view'>
							<Icon icon='HourglassTop' className='text-warning flex-shrink-0' size='sm' />
							<div className='flex-grow-1'>
								<span className='fw-bold text-dark d-block' style={{ fontSize: '0.8rem' }}>
									Regeneration Request Pending
								</span>
								<span className='text-muted' style={{ fontSize: '0.74rem' }}>
									An administrator is reviewing your key generation request.
								</span>
							</div>
						</div>
					) : (
						<div className='inactive-empty-view'>
							<div className='d-flex align-items-center gap-2 text-muted' style={{ fontSize: '0.78rem' }}>
								<Icon icon='KeyOff' size='sm' />
								<span>No active Production API credentials</span>
							</div>

							{hasCreatePermission && (
								<button
									type='button'
									className='btn-request-pill'
									onClick={() => onRequestKey('live')}>
									<Icon icon='Add' size='sm' />
									<span>Request Production Key</span>
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		);
	};

	return (
		<>
			<div className='premium-keys-grid mb-3'>
				<div className='row g-3'>
					{/* LIVE PRODUCTION ENVIRONMENT CARD */}
					<div className='col-12 col-md-10 col-lg-8 col-xl-6'>
						{renderProductionCard(myKeysData?.live)}
					</div>
				</div>
			</div>

			{/* MODAL FOR NEWLY GENERATED KEY */}
			<InstantGeneratedKeyModal
				isOpen={generatedModalData.isOpen}
				setIsOpen={(open) =>
					setGeneratedModalData((prev) => ({ ...prev, isOpen: open }))
				}
				keyType='live'
				apiKey={generatedModalData.apiKey}
			/>
		</>
	);
};

ActiveApiKeysCards.defaultProps = {
	myKeysData: null,
	hasCreatePermission: true,
};

export default ActiveApiKeysCards;

