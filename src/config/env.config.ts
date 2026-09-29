// STORAGE KEYS
export const STORAGE_KEYS = {
	TOKEN: process.env.REACT_APP_TOKEN_KEY || 'cardspe_token',
} as const;

// ENVIRONMENT VARIABLES
export const ENV = {
	API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
	SITE_NAME: process.env.REACT_APP_SITE_NAME || 'cardspe',
	PRIMARY_COLOR: process.env.REACT_APP_PRIMARY_COLOR || '#0E5F98',
	MODERN_DESIGN: process.env.REACT_APP_MODERN_DESGIN === 'true',
	ASIDE_WIDTH_PX: Number(process.env.REACT_APP_ASIDE_WIDTH_PX) || 195,
	SPACER_PX: Number(process.env.REACT_APP_SPACER_PX) || 13,
	MOBILE_BREAKPOINT_SIZE: Number(process.env.REACT_APP_MOBILE_BREAKPOINT_SIZE) || 768,
	ASIDE_MINIMIZE_BREAKPOINT_SIZE:
		Number(process.env.REACT_APP_ASIDE_MINIMIZE_BREAKPOINT_SIZE) || 1024,
	TOKEN_KEY: STORAGE_KEYS.TOKEN,
	ENCRYPTION_KEY: process.env.REACT_APP_ENCRYPTION_KEY || 'cardspe#SecureKey@2026_Secret!',
	IS_DEV: process.env.NODE_ENV === 'development',
	IS_PROD: process.env.NODE_ENV === 'production',
} as const;

export default ENV;

