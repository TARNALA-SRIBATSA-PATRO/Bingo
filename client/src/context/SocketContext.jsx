import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const socket = io({
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });
    socketRef.current = socket;

    socket.on('connect', () => { setConnected(true); setReconnecting(false); });
    socket.on('disconnect', () => { setConnected(false); setReconnecting(true); });

    // The manager stops retrying after reconnectionAttempts; a phone that slept
    // for a few minutes would otherwise never reconnect. Kick it when the app
    // comes back to the foreground or the network returns.
    const kick = () => {
      if (!socket.connected) socket.connect();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') kick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', kick);
    window.addEventListener('focus', kick);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', kick);
      window.removeEventListener('focus', kick);
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, reconnecting }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
