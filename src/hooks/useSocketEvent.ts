import { useEffect, useRef } from 'react';
import useSocket from './useSocket';

/**
 * Custom React Hook to subscribe to a Socket.IO event with automatic cleanup on unmount.
 *
 * @param event The name of the socket event to listen to.
 * @param handler The callback function executed when the event is received.
 * @param enabled Optional boolean flag to conditionally enable or disable the listener (default: true).
 */
export function useSocketEvent<T = any>(
	event: string,
	handler: (data: T) => void,
	enabled: boolean = true,
): void {
	const { socket } = useSocket();
	const savedHandler = useRef(handler);

	// Keep latest reference to handler to avoid recreating listener unnecessarily
	useEffect(() => {
		savedHandler.current = handler;
	}, [handler]);

	useEffect(() => {
		if (!socket || !enabled || !event) return undefined;

		const eventListener = (...args: any[]) => {
			if (savedHandler.current) {
				savedHandler.current(args[0]);
			}
		};

		socket.on(event, eventListener);

		return () => {
			socket.off(event, eventListener);
		};
	}, [socket, event, enabled]);
}

export default useSocketEvent;
