import { useContext } from 'react';
import SocketContext, { ISocketContextProps } from '../contexts/socketContext';

export default function useSocket(): ISocketContextProps {
	return useContext(SocketContext);
}
