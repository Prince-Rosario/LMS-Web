'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

export interface Notification {
  id: string;
  type: 'material' | 'test' | 'grade';
  title: string;
  message: string;
  courseId?: number;
  materialId?: number;
  testId?: number;
  attemptId?: number;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isConnectingRef = useRef(false);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]);
  }, []);

  const connect = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token || isConnectingRef.current || connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    isConnectingRef.current = true;

    try {
      // Stop existing connection if any
      if (connectionRef.current) {
        await connectionRef.current.stop();
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_URL}/hubs/notifications`, {
          accessTokenFactory: () => token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // Register event handlers BEFORE starting connection
      connection.on('MaterialPublished', (data: {
        courseId: number;
        materialId: number;
        title: string;
        type: string;
        uploadedBy: string;
        uploadedAt: string;
      }) => {
        console.log('MaterialPublished received:', data);
        const notification: Notification = {
          id: `material-${data.materialId}-${Date.now()}`,
          type: 'material',
          title: 'New Material Posted',
          message: `${data.uploadedBy} posted "${data.title}"`,
          courseId: data.courseId,
          materialId: data.materialId,
          timestamp: new Date(data.uploadedAt),
          read: false,
        };
        addNotification(notification);
      });

      connection.on('TestPublished', (data: {
        courseId: number;
        testId: number;
        title: string;
        dueDate?: string;
        publishedAt: string;
      }) => {
        console.log('TestPublished received:', data);
        const notification: Notification = {
          id: `test-${data.testId}-${Date.now()}`,
          type: 'test',
          title: 'New Test Available',
          message: `"${data.title}" is now available${data.dueDate ? ` (Due: ${new Date(data.dueDate).toLocaleDateString()})` : ''}`,
          courseId: data.courseId,
          testId: data.testId,
          timestamp: new Date(data.publishedAt),
          read: false,
        };
        addNotification(notification);
      });

      connection.on('TestGraded', (data: {
        testId: number;
        testTitle: string;
        attemptId: number;
        score?: number;
        maxScore?: number;
        percentage?: number;
        passed?: boolean;
        gradedAt: string;
      }) => {
        console.log('TestGraded received:', data);
        const notification: Notification = {
          id: `grade-${data.attemptId}-${Date.now()}`,
          type: 'grade',
          title: 'Test Graded',
          message: `Your "${data.testTitle}" test has been graded${data.percentage !== undefined ? `: ${data.percentage.toFixed(1)}%` : ''}`,
          testId: data.testId,
          attemptId: data.attemptId,
          timestamp: new Date(data.gradedAt),
          read: false,
        };
        addNotification(notification);
      });

      // Connection state handlers
      connection.onclose(() => {
        console.log('Notification hub disconnected');
        setIsConnected(false);
      });

      connection.onreconnecting(() => {
        console.log('Notification hub reconnecting...');
        setIsConnected(false);
      });

      connection.onreconnected(() => {
        console.log('Notification hub reconnected');
        setIsConnected(true);
      });

      connectionRef.current = connection;

      await connection.start();
      console.log('Notification hub connected successfully');
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to connect to notification hub:', err);
      setIsConnected(false);
    } finally {
      isConnectingRef.current = false;
    }
  }, [addNotification]);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.stop();
      connectionRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Connect when component mounts and user is logged in
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      connect();
    }

    // Handle auth changes
    const handleAuthChange = () => {
      const newToken = localStorage.getItem('token');
      if (!newToken) {
        disconnect();
        setNotifications([]);
      } else {
        connect();
      }
    };

    window.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
      disconnect();
    };
  }, [connect, disconnect]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
