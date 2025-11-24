'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

interface UseSignalROptions {
  hubUrl: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
}

export function useSignalR({ hubUrl, onConnected, onDisconnected, onReconnecting, onReconnected }: UseSignalROptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [connectionState, setConnectionState] = useState<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected
  );
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }, []);

  const connect = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('No authentication token found');
      return;
    }

    // Don't create a new connection if one already exists
    if (connectionRef.current && connectionRef.current.state !== signalR.HubConnectionState.Disconnected) {
      return;
    }

    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_URL}${hubUrl}`, {
          accessTokenFactory: () => token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry intervals
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Connection state handlers
      connection.onclose((error) => {
        setConnectionState(signalR.HubConnectionState.Disconnected);
        setError(error?.message || null);
        onDisconnected?.();
      });

      connection.onreconnecting((error) => {
        setConnectionState(signalR.HubConnectionState.Reconnecting);
        setError(error?.message || null);
        onReconnecting?.();
      });

      connection.onreconnected((connectionId) => {
        setConnectionState(signalR.HubConnectionState.Connected);
        setError(null);
        onReconnected?.();
      });

      connectionRef.current = connection;

      await connection.start();
      setConnectionState(signalR.HubConnectionState.Connected);
      setError(null);
      onConnected?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionState(signalR.HubConnectionState.Disconnected);
    }
  }, [hubUrl, getToken, onConnected, onDisconnected, onReconnecting, onReconnected]);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.stop();
      connectionRef.current = null;
    }
  }, []);

  const invoke = useCallback(async <T = void>(methodName: string, ...args: unknown[]): Promise<T | undefined> => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
      console.warn('SignalR not connected. Cannot invoke method:', methodName);
      return undefined;
    }

    try {
      return await connectionRef.current.invoke<T>(methodName, ...args);
    } catch (err) {
      console.error(`Error invoking ${methodName}:`, err);
      throw err;
    }
  }, []);

  const send = useCallback(async (methodName: string, ...args: unknown[]): Promise<void> => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
      console.warn('SignalR not connected. Cannot send:', methodName);
      return;
    }

    try {
      await connectionRef.current.send(methodName, ...args);
    } catch (err) {
      console.error(`Error sending ${methodName}:`, err);
      throw err;
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const on = useCallback((methodName: string, callback: (...args: any[]) => void) => {
    if (connectionRef.current) {
      connectionRef.current.on(methodName, callback);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const off = useCallback((methodName: string, callback?: (...args: any[]) => void) => {
    if (connectionRef.current) {
      if (callback) {
        connectionRef.current.off(methodName, callback);
      } else {
        connectionRef.current.off(methodName);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connection: connectionRef.current,
    connectionState,
    isConnected: connectionState === signalR.HubConnectionState.Connected,
    isConnecting: connectionState === signalR.HubConnectionState.Connecting,
    isReconnecting: connectionState === signalR.HubConnectionState.Reconnecting,
    error,
    connect,
    disconnect,
    invoke,
    send,
    on,
    off,
  };
}

