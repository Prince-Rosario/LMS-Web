'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChat, ChatMessage, ChatRoom } from '@/contexts/ChatContext';
import { useToast } from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

export default function CourseChatPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  const { toast } = useToast();

  const {
    isConnected,
    isConnecting,
    connectionError,
    currentRoom,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    typingUsers,
    onlineUsers,
    connect,
    joinRoom,
    leaveRoom,
    sendMessage,
    updateMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    loadMoreMessages,
    setCurrentRoom,
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: number; firstName: string; lastName: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get current user
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  // Fetch or create chat room for this course
  useEffect(() => {
    let isMounted = true;
    
    const fetchChatRoom = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/chats/course/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!isMounted) return;

        if (response.ok) {
          const room = await response.json();
          setChatRoom(room);
          setCurrentRoom(room);
        } else if (response.status === 401) {
          router.push('/login');
        } else {
          toast.error('Failed to load chat room');
        }
      } catch (error) {
        console.error('Error fetching chat room:', error);
        if (isMounted) {
          // Don't show toast on every retry - the connection error banner will show
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchChatRoom();
    
    return () => {
      isMounted = false;
    };
  }, [courseId, router, toast, setCurrentRoom]);

  // Connect to SignalR and join room
  useEffect(() => {
    if (!chatRoom) return;

    const initChat = async () => {
      if (!isConnected && !isConnecting) {
        await connect();
      }
    };

    initChat();
  }, [chatRoom, isConnected, isConnecting, connect]);

  // Join room when connected
  useEffect(() => {
    if (isConnected && chatRoom) {
      joinRoom(chatRoom.id);
    }

    return () => {
      if (isConnected && chatRoom) {
        leaveRoom(chatRoom.id);
      }
    };
  }, [isConnected, chatRoom, joinRoom, leaveRoom]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && hasMoreMessages && !isLoadingMessages) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMessages, loadMoreMessages]);

  // Handle message input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    startTyping();
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const content = messageInput.trim();
    if (!content) return;

    if (editingMessage) {
      await updateMessage(editingMessage.id, content);
      setEditingMessage(null);
    } else {
      await sendMessage(content, replyTo?.id);
      setReplyTo(null);
    }

    setMessageInput('');
    stopTyping();
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Cancel reply/edit
  const cancelAction = () => {
    setReplyTo(null);
    setEditingMessage(null);
    setMessageInput('');
  };

  // Start editing a message
  const startEditing = (message: ChatMessage) => {
    setEditingMessage(message);
    setMessageInput(message.content);
    setReplyTo(null);
    inputRef.current?.focus();
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date header
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.createdAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{chatRoom?.name || 'Group Chat'}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              <span>{isConnected ? `${onlineUsers.length} online` : 'Connecting...'}</span>
              {chatRoom && <span>• {chatRoom.memberCount} members</span>}
            </div>
          </div>
        </div>

        {/* Online users indicator */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 5).map((user) => (
              <div
                key={user.userId}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-medium text-white ${
                  user.isTeacher ? 'bg-indigo-600' : 'bg-emerald-500'
                }`}
                title={user.userName}
              >
                {user.userName.split(' ').map((n) => n[0]).join('')}
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-400 text-xs font-medium text-white">
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Connection error banner */}
      {connectionError && (
        <div className="bg-rose-50 px-6 py-3 text-center text-sm text-rose-600">
          Connection error: {connectionError}. <button onClick={connect} className="font-medium underline">Retry</button>
        </div>
      )}

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4"
      >
        {/* Load more indicator */}
        {isLoadingMessages && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        )}

        {/* Messages */}
        {messageGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date header */}
            <div className="my-4 flex items-center justify-center">
              <div className="rounded-full bg-slate-200 px-4 py-1 text-xs font-medium text-slate-600">
                {formatDateHeader(group.date)}
              </div>
            </div>

            {/* Messages in group */}
            {group.messages.map((message, msgIndex) => {
              const isOwn = message.senderId === currentUser?.id;
              const showAvatar = msgIndex === 0 || 
                group.messages[msgIndex - 1].senderId !== message.senderId;

              return (
                <div
                  key={message.id}
                  className={`mb-2 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[70%] gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    {showAvatar && !isOwn ? (
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${
                          message.isTeacher ? 'bg-indigo-600' : 'bg-emerald-500'
                        }`}
                      >
                        {message.senderInitials}
                      </div>
                    ) : (
                      <div className="w-8 flex-shrink-0"></div>
                    )}

                    {/* Message bubble */}
                    <div className="group relative">
                      {/* Sender name */}
                      {showAvatar && !isOwn && (
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">{message.senderName}</span>
                          {message.isTeacher && (
                            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
                              Teacher
                            </span>
                          )}
                        </div>
                      )}

                      {/* Reply reference */}
                      {message.replyToMessage && (
                        <div className={`mb-1 rounded border-l-2 border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-500 ${
                          isOwn ? 'text-right' : ''
                        }`}>
                          <span className="font-medium">{message.replyToMessage.senderName}</span>
                          <p className="truncate">{message.replyToMessage.content}</p>
                        </div>
                      )}

                      {/* Message content */}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-800 shadow-sm'
                        } ${message.isDeleted ? 'italic opacity-60' : ''}`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <div className={`mt-1 flex items-center gap-2 text-xs ${
                          isOwn ? 'text-indigo-200' : 'text-slate-400'
                        }`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {message.isEdited && <span>(edited)</span>}
                        </div>
                      </div>

                      {/* Message actions */}
                      {!message.isDeleted && (
                        <div className={`absolute top-0 hidden gap-1 group-hover:flex ${
                          isOwn ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
                        }`}>
                          <button
                            onClick={() => setReplyTo(message)}
                            className="rounded bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300"
                            title="Reply"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                          {isOwn && (
                            <>
                              <button
                                onClick={() => startEditing(message)}
                                className="rounded bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300"
                                title="Edit"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteMessage(message.id)}
                                className="rounded bg-rose-100 p-1.5 text-rose-600 hover:bg-rose-200"
                                title="Delete"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Empty state */}
        {messages.length === 0 && !isLoadingMessages && (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <svg className="mb-4 h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Be the first to send a message!</p>
          </div>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }}></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }}></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>
              {typingUsers.map((u) => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply/Edit bar */}
      {(replyTo || editingMessage) && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-100 px-6 py-2">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-1 rounded ${editingMessage ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                {editingMessage ? 'Editing message' : `Replying to ${replyTo?.senderName}`}
              </p>
              <p className="truncate text-sm text-slate-700">
                {editingMessage?.content || replyTo?.content}
              </p>
            </div>
          </div>
          <button
            onClick={cancelAction}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white px-6 py-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              style={{ maxHeight: '150px' }}
              disabled={!isConnected}
            />
          </div>
          <button
            type="submit"
            disabled={!messageInput.trim() || !isConnected}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

