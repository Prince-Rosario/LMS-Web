'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSignalR } from '@/hooks/useSignalR';

// Types
export interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  senderInitials: string;
  isTeacher: boolean;
  createdAt: string;
  isEdited: boolean;
  isDeleted: boolean;
  replyToMessageId?: number;
  replyToMessage?: ChatMessage;
  isOwnMessage: boolean;
}

export interface ChatRoom {
  id: number;
  name: string;
  courseId: number;
  courseName: string;
  createdAt: string;
  memberCount: number;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface TypingUser {
  userId: number;
  userName: string;
}

interface ChatContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Chat rooms
  chatRooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  
  // Messages
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  
  // Typing indicators
  typingUsers: TypingUser[];
  
  // Online users
  onlineUsers: { userId: number; userName: string; isTeacher: boolean }[];
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinRoom: (chatRoomId: number) => Promise<void>;
  leaveRoom: (chatRoomId: number) => Promise<void>;
  sendMessage: (content: string, replyToMessageId?: number) => Promise<void>;
  updateMessage: (messageId: number, newContent: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  loadMoreMessages: () => Promise<void>;
  setCurrentRoom: (room: ChatRoom | null) => void;
  fetchChatRooms: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ userId: number; userName: string; isTeacher: boolean }[]>([]);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const {
    isConnected,
    isConnecting,
    error: connectionError,
    connect: signalRConnect,
    disconnect: signalRDisconnect,
    invoke,
    send,
    on,
    off,
  } = useSignalR({
    hubUrl: '/hubs/chat',
    onConnected: () => {
      console.log('✅ Connected to chat hub');
    },
    onDisconnected: () => {
      console.log('❌ Disconnected from chat hub');
    },
    onReconnecting: () => {
      console.log('🔄 Reconnecting to chat hub...');
    },
    onReconnected: () => {
      console.log('✅ Reconnected to chat hub');
      // Rejoin current room if any
      if (currentRoom) {
        invoke('JoinRoom', currentRoom.id);
      }
    },
  });

  // Set up SignalR event handlers
  useEffect(() => {
    if (!isConnected) return;

    // Handle new messages
    const handleReceiveMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      
      // Update last message in chat rooms
      setChatRooms((prev) =>
        prev.map((room) =>
          room.id === currentRoom?.id
            ? { ...room, lastMessage: message }
            : room
        )
      );
    };

    // Handle message updates
    const handleMessageUpdated = (message: ChatMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
    };

    // Handle message deletions
    const handleMessageDeleted = ({ messageId }: { messageId: number }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: '[Message deleted]' }
            : m
        )
      );
    };

    // Handle typing indicators
    const handleUserTyping = ({ userId, userName, chatRoomId }: { userId: number; userName: string; chatRoomId: number }) => {
      if (chatRoomId === currentRoom?.id) {
        setTypingUsers((prev) => {
          if (prev.find((u) => u.userId === userId)) return prev;
          return [...prev, { userId, userName }];
        });
      }
    };

    const handleUserStoppedTyping = ({ userId }: { userId: number }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    // Handle online users
    const handleOnlineUsers = (users: { userId: number; userName: string; isTeacher: boolean }[]) => {
      setOnlineUsers(users);
    };

    // Handle user join/leave
    const handleUserJoined = ({ userId, userName }: { userId: number; userName: string }) => {
      console.log(`${userName} joined the chat`);
    };

    const handleUserLeft = ({ userId, userName }: { userId: number; userName: string }) => {
      console.log(`${userName} left the chat`);
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    // Handle errors
    const handleError = (errorMessage: string) => {
      console.error('Chat error:', errorMessage);
    };

    // Register handlers
    on('ReceiveMessage', handleReceiveMessage);
    on('MessageUpdated', handleMessageUpdated);
    on('MessageDeleted', handleMessageDeleted);
    on('UserTyping', handleUserTyping);
    on('UserStoppedTyping', handleUserStoppedTyping);
    on('OnlineUsers', handleOnlineUsers);
    on('UserJoined', handleUserJoined);
    on('UserLeft', handleUserLeft);
    on('Error', handleError);

    // Cleanup
    return () => {
      off('ReceiveMessage');
      off('MessageUpdated');
      off('MessageDeleted');
      off('UserTyping');
      off('UserStoppedTyping');
      off('OnlineUsers');
      off('UserJoined');
      off('UserLeft');
      off('Error');
    };
  }, [isConnected, currentRoom, on, off]);

  const connect = useCallback(async () => {
    await signalRConnect();
  }, [signalRConnect]);

  const disconnect = useCallback(async () => {
    await signalRDisconnect();
  }, [signalRDisconnect]);

  const fetchChatRooms = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/chats/my-chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const rooms = await response.json();
        setChatRooms(rooms);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    }
  }, []);

  const joinRoom = useCallback(async (chatRoomId: number) => {
    if (!isConnected) return;
    
    await invoke('JoinRoom', chatRoomId);
    await invoke('GetOnlineUsers', chatRoomId);
    
    // Fetch initial messages via REST API
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoadingMessages(true);
    try {
      const response = await fetch(`${API_URL}/api/chats/${chatRoomId}/messages?pageSize=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setHasMoreMessages(data.hasMore || false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [isConnected, invoke]);

  const leaveRoom = useCallback(async (chatRoomId: number) => {
    if (!isConnected) return;
    await invoke('LeaveRoom', chatRoomId);
    setMessages([]);
    setTypingUsers([]);
    setOnlineUsers([]);
  }, [isConnected, invoke]);

  const sendMessage = useCallback(async (content: string, replyToMessageId?: number) => {
    if (!isConnected || !currentRoom) return;

    await invoke('SendMessage', {
      chatRoomId: currentRoom.id,
      content,
      replyToMessageId,
    });

    // Stop typing indicator
    if (isTypingRef.current) {
      await invoke('StopTyping', currentRoom.id);
      isTypingRef.current = false;
    }
  }, [isConnected, currentRoom, invoke]);

  const updateMessage = useCallback(async (messageId: number, newContent: string) => {
    if (!isConnected) return;
    await invoke('UpdateMessage', messageId, newContent);
  }, [isConnected, invoke]);

  const deleteMessage = useCallback(async (messageId: number) => {
    if (!isConnected) return;
    await invoke('DeleteMessage', messageId);
  }, [isConnected, invoke]);

  const startTyping = useCallback(() => {
    if (!isConnected || !currentRoom || isTypingRef.current) return;

    isTypingRef.current = true;
    invoke('StartTyping', currentRoom.id);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && currentRoom) {
        invoke('StopTyping', currentRoom.id);
        isTypingRef.current = false;
      }
    }, 3000);
  }, [isConnected, currentRoom, invoke]);

  const stopTyping = useCallback(() => {
    if (!isConnected || !currentRoom || !isTypingRef.current) return;

    isTypingRef.current = false;
    invoke('StopTyping', currentRoom.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isConnected, currentRoom, invoke]);

  const loadMoreMessages = useCallback(async () => {
    if (!currentRoom || isLoadingMessages || !hasMoreMessages) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setIsLoadingMessages(true);
    try {
      const response = await fetch(
        `${API_URL}/api/chats/${currentRoom.id}/messages?pageSize=50&beforeMessageId=${oldestMessage.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...(data.messages || []), ...prev]);
        setHasMoreMessages(data.hasMore || false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentRoom, isLoadingMessages, hasMoreMessages, messages]);

  const value: ChatContextType = {
    isConnected,
    isConnecting,
    connectionError,
    chatRooms,
    currentRoom,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    typingUsers,
    onlineUsers,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendMessage,
    updateMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    loadMoreMessages,
    setCurrentRoom,
    fetchChatRooms,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

