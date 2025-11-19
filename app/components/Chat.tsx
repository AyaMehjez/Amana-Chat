'use client';

import { useState, useEffect, useRef } from 'react';
/**
 * Chat Component - Modern Real-time Chat Interface
 * 
 * Features:
 * - Real-time messaging with Ably
 * - Online users presence
 * - Message history (last 20 messages)
 * - Modern, responsive design with Tailwind CSS
 */

// Message data type
interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

// Presence member data type
interface PresenceMember {
  clientId: string;
  data?: {
    username?: string;
  };
}

export default function Chat() {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [presenceMembers, setPresenceMembers] = useState<PresenceMember[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Note: Using 'any' type to avoid TypeScript import issues with Ably Types
  const ablyClientRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // Generate random username if not provided
  useEffect(() => {
    if (!username) {
      const randomUsername = `User_${Math.random().toString(36).substring(2, 9)}`;
      setUsername(randomUsername);
    }
  }, [username]);

  // Initialize Ably Client
  useEffect(() => {
    if (!username) return;

    const initializeAbly = async () => {
      try {
        const clientId = username || 'anon';
        
        const response = await fetch(`/api/ably-token?clientId=${encodeURIComponent(clientId)}`);
        if (!response.ok) {
          throw new Error('Failed to get Ably token');
        }
        
        const tokenRequest = await response.json();
        const Ably = (await import('ably')).default;
        
        const client = new Ably.Realtime({
          authCallback: (tokenParams, callback) => {
            callback(null, tokenRequest);
          },
          clientId: clientId,
        });

        ablyClientRef.current = client;
        const channel = client.channels.get('chat:general');
        channelRef.current = channel;

        // Connection status listeners
        client.connection.on('connected', () => {
          setIsConnected(true);
          setIsLoading(false);
        });

        client.connection.on('disconnected', () => {
          setIsConnected(false);
        });

        client.connection.on('failed', () => {
          setIsConnected(false);
          setIsLoading(false);
        });

        // Subscribe to messages
        // Note: Using 'any' type for message parameter to avoid TypeScript import issues
        await channel.subscribe('message', (message: any) => {
          const newMessage: Message = {
            id: message.id || `${Date.now()}-${Math.random()}`,
            text: message.data.text,
            sender: message.data.sender || 'Unknown',
            timestamp: message.timestamp || Date.now(),
          };
          
          setMessages((prev) => [...prev, newMessage]);
        });

        // Presence management
        const presence = channel.presence;
        
        const currentMembers = await presence.get();
        setPresenceMembers(currentMembers.map(m => ({
          clientId: m.clientId,
          data: m.data as { username?: string }
        })));

        // Note: Using 'any' type for presence members to avoid TypeScript import issues
        presence.subscribe('enter', (member: any) => {
          setPresenceMembers((prev) => {
            if (!prev.find(m => m.clientId === member.clientId)) {
              return [...prev, {
                clientId: member.clientId,
                data: member.data as { username?: string }
              }];
            }
            return prev;
          });
        });

        presence.subscribe('leave', (member: any) => {
          setPresenceMembers((prev) => 
            prev.filter(m => m.clientId !== member.clientId)
          );
        });

        await presence.enter({ username });

        // Load message history
        try {
          const historyPage = await channel.history({ limit: 20 });
          
          if (historyPage.items && historyPage.items.length > 0) {
            const historyMessages: Message[] = historyPage.items
              .reverse()
              .map((item) => ({
                id: item.id || `${item.timestamp}-${Math.random()}`,
                text: item.data.text,
                sender: item.data.sender || 'Unknown',
                timestamp: item.timestamp || Date.now(),
              }));
            
            setMessages(historyMessages);
          }
        } catch (error) {
          console.error('Error loading history:', error);
        }

      } catch (error) {
        console.error('Error initializing Ably:', error);
        setIsLoading(false);
      }
    };

    initializeAbly();

    return () => {
      if (channelRef.current) {
        channelRef.current.presence.leave();
        channelRef.current.unsubscribe();
      }
      if (ablyClientRef.current) {
        ablyClientRef.current.close();
      }
    };
  }, [username]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    // Use a more stable scrolling method to prevent jitter
    if (messagesContainerRef.current) {
      // Scroll instantly to bottom without animation to prevent jitter
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!messageText.trim() || !channelRef.current || !isConnected) return;

    const userMessage = messageText.trim();
    setMessageText(''); // Clear input immediately

    try {
      // 1. Publish user message to Ably channel
      await channelRef.current.publish('message', {
        text: userMessage,
        sender: username,
        timestamp: Date.now(),
      });

      // 2. Send message to AI API and get reply
      try {
        const aiResponse = await fetch('/api/ai-reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: userMessage }),
        });

        if (aiResponse.ok) {
          const { reply } = await aiResponse.json();
          
          // 3. Publish AI reply to Ably channel so everyone sees it
          if (reply && channelRef.current) {
            await channelRef.current.publish('message', {
              text: reply,
              sender: 'Amana AI Assistant',
              timestamp: Date.now(),
            });
          }
        } else {
          console.error('Failed to get AI reply');
        }
      } catch (aiError) {
        console.error('Error getting AI reply:', aiError);
        // Don't show error to user, just log it
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      // Restore message text if sending failed
      setMessageText(userMessage);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Update presence when username changes
  useEffect(() => {
    const updatePresence = async () => {
      if (channelRef.current && isConnected) {
        try {
          await channelRef.current.presence.update({ username });
        } catch (error) {
          console.error('Error updating presence:', error);
        }
      }
    };

    if (username && isConnected) {
      updatePresence();
    }
  }, [username, isConnected]);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Generate avatar color based on username
  // Uses hash of entire username for better color distribution
  // Supports unlimited users - each gets a unique color based on their username
  const getAvatarColor = (name: string) => {
    // Extended color palette with 16 distinct colors
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-green-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-emerald-500',
      'bg-violet-500',
      'bg-fuchsia-500',
      'bg-rose-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-lime-500',
      'bg-sky-500',
    ];
    
    // Create a simple hash from the entire username for better distribution
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use absolute value and modulo to get index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Get initials from username
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Decorative background for loading */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6 overflow-hidden">
      {/* Decorative Background Elements */}
      
      {/* Large gradient circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Medium decorative circles */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full opacity-10 blur-2xl"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-10 blur-2xl"></div>
      
      {/* Small accent circles */}
      <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-indigo-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
      
      {/* SVG Wave Pattern */}
      <svg className="absolute bottom-0 left-0 w-full h-32 opacity-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#4f46e5" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>
      
      {/* Centered Chat Container - Card Design */}
      <div className="relative z-10 w-full max-w-6xl h-[90vh] flex flex-col bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
        
        {/* Header with Gradient Background */}
        <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-4 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Amana Chat</h1>
                <p className="text-sm text-blue-100 flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300 animate-pulse' : 'bg-red-300'}`}></span>
                  {isConnected ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            
            {/* Username Input */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-100 hidden sm:inline">Username:</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-blue-100"
                placeholder="Your name"
              />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Online Users Sidebar */}
          <aside className="hidden md:flex flex-col w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Online Users
              </h2>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-1 rounded-full">
                {presenceMembers.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {presenceMembers && presenceMembers.length > 0 ? (
                presenceMembers.map((member) => {
                  const displayName = member.data?.username || member.clientId;
                  const isCurrentUser = member.clientId === username;
                  return (
                    <div
                      key={member.clientId}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isCurrentUser 
                          ? 'bg-indigo-100 border border-indigo-200' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {/* Avatar Badge */}
                      <div className={`relative ${getAvatarColor(displayName)} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                        {getInitials(displayName)}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isCurrentUser ? 'text-indigo-900' : 'text-gray-700'
                        }`}>
                          {displayName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-indigo-600">(You)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No users online</p>
              )}
            </div>
          </aside>

          {/* Messages Area */}
          <main className="flex-1 flex flex-col bg-gray-50">
            
            {/* Messages List - Scrollable */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg font-medium">No messages yet</p>
                  <p className="text-gray-400 text-sm mt-2">Be the first to send a message!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.sender === username;
                  const isAIMessage = message.sender === 'Amana AI Assistant';
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar for received messages */}
                      {!isOwnMessage && (
                        <div className={`${isAIMessage ? 'bg-gradient-to-br from-purple-500 to-pink-500' : getAvatarColor(message.sender)} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                          {isAIMessage ? 'AI' : getInitials(message.sender)}
                        </div>
                      )}
                      
                      {/* Message Bubble */}
                      <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-sm'
                              : isAIMessage
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-gray-800 border border-purple-200 rounded-bl-sm'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                          }`}
                        >
                          {/* Sender name (only for received messages) */}
                          {!isOwnMessage && (
                            <p className={`text-xs font-semibold mb-1 ${
                              isOwnMessage 
                                ? 'text-blue-100' 
                                : isAIMessage
                                ? 'text-purple-600'
                                : 'text-indigo-600'
                            }`}>
                              {message.sender}
                            </p>
                          )}
                          
                          {/* Message text */}
                          <p className={`text-sm leading-relaxed break-words ${
                            isOwnMessage ? 'text-white' : 'text-gray-800'
                          }`}>
                            {message.text}
                          </p>
                        </div>
                        
                        {/* Timestamp */}
                        <span className={`text-xs mt-1.5 px-2 ${
                          isOwnMessage ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="border-t border-gray-200 bg-white p-4 md:p-6">
              <div className="flex gap-3 items-end">
                {/* Text Input */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={!isConnected}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 placeholder:text-gray-400 transition-all"
                  />
                </div>
                
                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!isConnected || !messageText.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none font-medium flex items-center gap-2"
                >
                  <span>Send</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
