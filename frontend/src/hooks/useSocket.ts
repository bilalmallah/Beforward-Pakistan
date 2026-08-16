import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../lib/api';
import useAuth from './useAuth';

/**
 * Connects to the Socket.IO server for real-time inbox events
 * (message:new, conversation:updated — spec section 26) once a user is
 * authenticated, and disconnects on unmount / logout.
 */
export default function useSocket(): Socket | null {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const instance = io('/', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket'],
    });
    setSocket(instance);

    return () => {
      instance.disconnect();
      setSocket(null);
    };
  }, [user]);

  return socket;
}
