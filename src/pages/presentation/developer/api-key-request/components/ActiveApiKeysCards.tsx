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
	const [copiedKeyType, setCopiedKeyType] = useState<TApiKeyType | null>(null);
	const [isGeneratingType, setIsGeneratingType] = useState<TApiKeyType | null>(null);
	const [maskedStates, setMaskedStates] = useState<{ test: boolean; live: boolean }>({
		test: true,
		live: true,
	});

	const [generatedModalData, setGeneratedModalData] = useState<{
		isOpen: boolean;
		keyType: TApiKeyType;
		apiKey: string;
	}>({
		isOpen: false,
		keyType: 'test',
		apiKey: '',
	});

	// TOGGLE KEY MASKING
	const toggleMask = (type: TApiKeyType) => {
		setMaskedStates((prev) => ({ ...prev, [type]: !prev[type] }));
	};

	// MASK HELPER
	const getDisplayKey = (key: string, isMasked: boolean) => {
		if (!key) return '';
		if (!isMasked || key.length < 16) return key;
		const prefix = key.slice(0, 14);
		const suffix = key.slice(-5);
		return `${prefix}${'•'.repeat(16)}${suffix}`;
	};

	// COPY HANDLER
	const handleCopy = (apiKey: string, type: TApiKeyType) => {
		if (!apiKey) return;
		navigator.clipboard.writeText(apiKey);
		setCopiedKeyType(type);
		showNotification('Copied', `${type.toUpperCase()} API Key copied to clipboard!`, 'info');
		setTimeout(() => setCopiedKeyType(null), 2000);
	};

	// INSTANT GENERATION HANDLER (CALLS POST /api/developer/api-key/generate)
	const handleInstantGenerate = async (type: TApiKeyType) => {
		if (!hasCreatePermission) {
			showNotification('Permission Denied', 'You do not have permission to generate API keys.', 'warning');
			return;
		}

		setIsGeneratingType(type);
		try {
			const res: any = await apiKeyRequestService.generateApiKey({
				key_type: type,
			});

			// If backend returned key details
			const createdKeyData = res?.data?.key || res?.data?.apiKey || res?.data;
			const apiKeyVal =
				createdKeyData?.api_key ||
				res?.data?.api_key ||
				(typeof res?.data === 'string' ? res?.data : '');
			const apiSecretVal = createdKeyData?.api_secret || res?.data?.api_secret;

			if (apiKeyVal) {
				setGeneratedModalData({
					isOpen: true,
					keyType: type,
					apiKey: apiKeyVal,
				});
			} else {
				showNotification(
					'Key Generated',
					res?.message || `Your ${type.toUpperCase()} API Key has been generated successfully!`,
					'success',
				);
			}

			onRefresh();
		} catch (error: any) {
			showNotification(
				'Generation Failed',
				error?.data?.message || error?.message || 'Could not generate API key.',
				'danger',
			);
		} finally {
			setIsGeneratingType(null);
		}
	};

	// RENDER SINGLE ENVIRONMENT CARD
	const renderEnvCard = (type: TApiKeyType, envStatus: IEnvKeyStatus | undefined) => {
		const isLive = type === 'live';
		const envTitle = isLive ? 'Live Production' : 'Test Sandbox';
		const envSub = isLive ? 'Production API Integration' : 'Developer Sandbox & Testing';
		const envIcon = isLive ? 'RocketLaunch' : 'Science';

		if (isLoading || !envStatus) {
			return (
				<div className={`premium-key-card ${isLive ? 'theme-live' : 'theme-test'} loading-shimmer`}>
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
		const isCopied = copiedKeyType === type;
		const isGenerating = isGeneratingType === type;
		const isMasked = maskedStates[type];

		return (
			<div className={`premium-key-card ${isLive ? 'theme-live' : 'theme-test'}`}>
				{/* TOP AMBIENT GLOW BAR */}
				<div className='card-glow-bar' />

				{/* CARD HEADER */}
				<div className='card-header-bar'>
					<div className='d-flex align-items-center gap-3'>
						<div className='env-icon-badge'>
							<Icon icon={envIcon} size='sm' />
						</div>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h6 className='env-name-heading mb-0'>{envTitle}</h6>
								<span className={`env-pill-tag ${isLive ? 'tag-live' : 'tag-test'}`}>
									{isLive ? 'PROD' : 'TEST'}
								</span>
							</div>
							<p className='env-sub-caption mb-0'>{envSub}</p>
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
										onClick={() => toggleMask(type)}>
										<Icon icon={isMasked ? 'Visibility' : 'VisibilityOff'} size='sm' />
									</button>

									{/* COPY BUTTON */}
									<button
										type='button'
										className={`btn-terminal-copy ${isCopied ? 'btn-copied' : ''}`}
										title='Copy API Key'
										onClick={() => handleCopy(key.api_key, type)}>
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
											<>Active Key</>
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
											onClick={() => onRequestKey(type)}>
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
								<span>No API key active. Generate your {isLive ? 'production' : 'sandbox'} credentials instantly.</span>
							</div>

							<button
								type='button'
								className={`btn-instant-trigger ${isLive ? 'trigger-live' : 'trigger-test'}`}
								disabled={isGenerating || !hasCreatePermission}
								onClick={() => handleInstantGenerate(type)}>
								{isGenerating ? (
									<>
										<Spinner isSmall isGrow={false} className='me-2' />
										<span>Generating...</span>
									</>
								) : (
									<>
										<Icon icon='FlashOn' size='sm' />
										<span>Generate {isLive ? 'Live' : 'Test'} Key</span>
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
								<span>No active credentials in this environment</span>
							</div>

							{hasCreatePermission && (
								<button
									type='button'
									className='btn-request-pill'
									onClick={() => onRequestKey(type)}>
									<Icon icon='Add' size='sm' />
									<span>Request Key</span>
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
					{/* TEST ENVIRONMENT CARD */}
					<div className='col-12 col-xl-6'>
						{renderEnvCard('test', myKeysData?.test)}
					</div>

					{/* LIVE ENVIRONMENT CARD */}
					<div className='col-12 col-xl-6'>
						{renderEnvCard('live', myKeysData?.live)}
					</div>
				</div>
			</div>

			{/* MODAL FOR NEWLY GENERATED KEY */}
			<InstantGeneratedKeyModal
				isOpen={generatedModalData.isOpen}
				setIsOpen={(open) =>
					setGeneratedModalData((prev) => ({ ...prev, isOpen: open }))
				}
				keyType={generatedModalData.keyType}
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
