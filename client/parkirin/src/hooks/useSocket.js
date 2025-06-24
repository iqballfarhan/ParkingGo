// src/hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import { createClient } from 'graphql-ws';

const useSocket = (url = import.meta.env.VITE_GRAPHQL_WS_URI) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    // Create WebSocket client
    const client = createClient({
      url,
      connectionParams: () => {
        const token = localStorage.getItem('token');
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
      on: {
        connected: () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        },
        closed: () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        },
        error: (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        },
      },
    });

    clientRef.current = client;

    return () => {
      client.dispose();
      clientRef.current = null;
    };
  }, [url]);

  // Subscribe to GraphQL subscription
  const subscribe = (subscription, variables = {}) => {
    if (!clientRef.current) {
      console.warn('WebSocket client not initialized');
      return null;
    }

    return clientRef.current.subscribe(
      {
        query: subscription,
        variables,
      },
      {
        next: (data) => console.log('Subscription data:', data),
        error: (error) => console.error('Subscription error:', error),
        complete: () => console.log('Subscription complete'),
      }
    );
  };

  return {
    isConnected,
    client: clientRef.current,
    subscribe,
  };
};

export default useSocket;
