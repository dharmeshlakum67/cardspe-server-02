/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-console */
import React, {
	createContext,
	FC,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import PropTypes from 'prop-types';
import { io, Socket } from 'socket.io-client';
import AuthContext from './authContext';
import authService from '../pages/presentation/auth/services/authService';
import { ENV } from '../config/env.config';

export interface ISocketContextProps {
	socket: Socket | null;
	isConnected: boolean;
	isConnecting: boolean;
	socketId: string | null;
	error: string | null;
	emit: (event: string, data?: any, ack?: (res: any) => void) => void;
	on: (event: string, callback: (...args: any[]) => void) => () => void;
	off: (event: string, callback?: (...args: any[]) => void) => void;
	reconnect: () => void;
}

export const SocketContext = createContext<ISocketContextProps>({} as ISocketContextProps);

interface ISocketContextProviderProps {
	children: ReactNode;
}

// RESOLVE SOCKET URL (DEFAULTS TO API_BASE_URL)
const getSocketUrl = (): string => {
	const customUrl = process.env.REACT_APP_SOCKET_URL;
	if (customUrl) return customUrl;

	const baseApi = ENV.API_BASE_URL || 'http://localhost:3001';
	// Strip trailing slashes or sub-paths like /api if present to get origin
	try {
		const parsed = new URL(baseApi);
		return parsed.origin;
	} catch {
		return baseApi;
	}
};

export const SocketContextProvider: FC<ISocketContextProviderProps> = ({ children }) => {
	const { authUser, isLoading: isAuthLoading } = useContext(AuthContext);
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [isConnecting, setIsConnecting] = useState<boolean>(false);
	const [socketId, setSocketId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const socketRef = useRef<Socket | null>(null);

	// CLEANUP SOCKET CONNECTION
	const cleanupSocket = useCallback(() => {
		if (socketRef.current) {
			console.log('🔌 [Socket]: Disconnecting and cleaning up instance...');
			socketRef.current.removeAllListeners();
			socketRef.current.disconnect();
			socketRef.current = null;
		}
		setIsConnected(false);
		setIsConnecting(false);
		setSocketId(null);
		setError(null);
	}, []);

	// ESTABLISH SOCKET CONNECTION
	const connectSocket = useCallback((token: string) => {
		// Clean up existing socket if any
		if (socketRef.current) {
			socketRef.current.removeAllListeners();
			socketRef.current.disconnect();
			socketRef.current = null;
		}

		const socketUrl = getSocketUrl();
		console.log(`🔌 [Socket]: Initiating connection to ${socketUrl}...`);
		setIsConnecting(true);
		setError(null);

		const socketInstance = io(socketUrl, {
			auth: {
				token,
			},
			extraHeaders: {
				Authorization: `Bearer ${token}`,
			},
			query: {
				token,
			},
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			timeout: 20000,
			autoConnect: true,
		});

		// CONNECTION EVENT HANDLERS
		socketInstance.on('connect', () => {
			console.log(`🔌 [Socket Connected]: ID ${socketInstance.id}`);
			setIsConnected(true);
			setIsConnecting(false);
			setSocketId(socketInstance.id || null);
			setError(null);
		});

		socketInstance.on('disconnect', (reason) => {
			console.log(`🔌 [Socket Disconnected]: Reason -> ${reason}`);
			setIsConnected(false);
			setIsConnecting(false);
			setSocketId(null);

			// If disconnected by server due to invalid auth, don't continuously retry
			if (reason === 'io server disconnect') {
				console.warn('🔌 [Socket]: Server forcefully disconnected the socket (likely auth failure).');
			}
		});

		socketInstance.on('connect_error', (err) => {
			console.error(`🔌 [Socket Connect Error]: ${err.message}`);
			setIsConnected(false);
			setIsConnecting(false);
			setError(err.message);
		});

		socketInstance.on('reconnect_attempt', (attemptNumber) => {
			console.log(`🔌 [Socket Reconnecting]: Attempt #${attemptNumber}`);
			setIsConnecting(true);
		});

		socketInstance.on('reconnect', (attemptNumber) => {
			console.log(`🔌 [Socket Reconnected]: After #${attemptNumber} attempts`);
			setIsConnected(true);
			setIsConnecting(false);
			setSocketId(socketInstance.id || null);
			setError(null);
		});

		socketInstance.on('reconnect_error', (err) => {
			console.error(`🔌 [Socket Reconnect Error]: ${err.message}`);
		});

		socketInstance.on('reconnect_failed', () => {
			console.error('🔌 [Socket Reconnection Failed]: Exceeded maximum attempts.');
			setIsConnecting(false);
			setError('Reconnection failed');
		});

		socketRef.current = socketInstance;
	}, []);

	// AUTH LIFECYCLE: CONNECT WHEN LOGGED IN, DISCONNECT ON LOGOUT
	useEffect(() => {
		if (isAuthLoading) return undefined;

		const token = authService.getToken();

		if (token && authUser) {
			connectSocket(token);
		} else {
			cleanupSocket();
		}

		return () => {
			cleanupSocket();
		};
	}, [authUser, isAuthLoading, connectSocket, cleanupSocket]);

	// EMIT HELPER
	const emit = useCallback((event: string, data?: any, ack?: (res: any) => void) => {
		if (socketRef.current && socketRef.current.connected) {
			if (ack) {
				socketRef.current.emit(event, data, ack);
			} else {
				socketRef.current.emit(event, data);
			}
		} else {
			console.warn(`🔌 [Socket Emit Warning]: Socket not connected. Cannot emit "${event}".`);
		}
	}, []);

	// ON LISTENER HELPER (RETURNS CLEANUP FUNCTION)
	const on = useCallback((event: string, callback: (...args: any[]) => void) => {
		if (socketRef.current) {
			socketRef.current.on(event, callback);
		}
		return () => {
			if (socketRef.current) {
				socketRef.current.off(event, callback);
			}
		};
	}, []);

	// OFF LISTENER HELPER
	const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
		if (socketRef.current) {
			if (callback) {
				socketRef.current.off(event, callback);
			} else {
				socketRef.current.off(event);
			}
		}
	}, []);

	// MANUAL RECONNECT
	const reconnect = useCallback(() => {
		const token = authService.getToken();
		if (token) {
			connectSocket(token);
		}
	}, [connectSocket]);

	const value = useMemo(
		() => ({
			socket: socketRef.current,
			isConnected,
			isConnecting,
			socketId,
			error,
			emit,
			on,
			off,
			reconnect,
		}),
		[isConnected, isConnecting, socketId, error, emit, on, off, reconnect],
	);

	return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

SocketContextProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export default SocketContext;
