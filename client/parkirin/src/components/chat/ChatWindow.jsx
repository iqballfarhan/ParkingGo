import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { 
  XMarkIcon, 
  InformationCircleIcon,
  PhoneIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { GET_CHAT_MESSAGES, GET_ROOM_DETAILS } from '../../graphql/queries';
import { SEND_MESSAGE, MARK_MESSAGES_READ } from '../../graphql/mutations';
import { MESSAGE_RECEIVED, MESSAGE_STATUS_UPDATED } from '../../graphql/subscriptions';
import { useAuth } from '../../hooks';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Button, Alert } from '../common';
import { formatChatTime } from '../../utils/formatters';

const ChatWindow = ({
  roomId,
  onClose,
  showHeader = true,
  showInfo = true,
  height = '600px'
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Queries and Mutations
  const { data: roomData, loading: roomLoading } = useQuery(GET_ROOM_DETAILS, {
    variables: { id: roomId },
    skip: !roomId
  });

  const { data: messagesData, loading: messagesLoading, fetchMore } = useQuery(GET_CHAT_MESSAGES, {
    variables: { roomId, limit: 50 },
    skip: !roomId,
    onCompleted: (data) => {
      if (data?.getChatMessages) {
        setMessages(data.getChatMessages);
        scrollToBottom();
      }
    }
  });

  const [sendMessage] = useMutation(SEND_MESSAGE);
  const [markMessagesRead] = useMutation(MARK_MESSAGES_READ);  // Subscriptions
  useSubscription(MESSAGE_RECEIVED, {
    variables: { roomId },
    skip: !roomId,
    onData: ({ data }) => {
      if (data.data?.messageReceived) {
        const newMessage = data.data.messageReceived;
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
        
        // Mark as read if not own message
        if (newMessage.sender._id !== user?._id) {
          markMessagesRead({ variables: { roomId } });
        }
      }
    }
  });

  useSubscription(MESSAGE_STATUS_UPDATED, {
    variables: { roomId },
    skip: !roomId,
    onData: ({ data }) => {
      if (data.data?.messageStatusUpdated) {
        const { messageId, status } = data.data.messageStatusUpdated;
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId ? { ...msg, status } : msg
          )
        );
      }
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when room opens
    if (roomId && user) {
      markMessagesRead({ variables: { roomId } });
    }
  }, [roomId, user, markMessagesRead]);

  const handleSendMessage = async (messageData) => {
    try {
      await sendMessage({
        variables: {
          input: {
            roomId,
            ...messageData
          }
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const handleSendFile = async (fileData) => {
    return handleSendMessage(fileData);
  };

  const handleSendImage = async (imageData) => {
    return handleSendMessage(imageData);
  };

  const loadMoreMessages = async () => {
    if (messages.length === 0) return;

    try {
      await fetchMore({
        variables: {
          roomId,
          before: messages[0]._id,
          limit: 20
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.getChatMessages) return prev;
          
          const newMessages = fetchMoreResult.getChatMessages;
          setMessages(prev => [...newMessages, ...prev]);
          
          return {
            getChatMessages: [...newMessages, ...prev.getChatMessages]
          };
        }
      });
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  };

  const otherParticipant = roomData?.getRoomDetails?.participants?.find(
    p => p._id !== user?._id
  );

  const isLoading = roomLoading || messagesLoading;

  return (
    <div 
      className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg"
      style={{ height }}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            {/* Participant Avatar */}
            {otherParticipant?.avatar ? (
              <img
                src={otherParticipant.avatar}
                alt={otherParticipant.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-900">
                {otherParticipant?.name || 'Chat'}
              </h3>
              <p className="text-sm text-gray-500">
                {otherParticipant?.role === 'landowner' ? 'Parking Owner' : 'Customer'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Action Buttons */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              title="Voice call"
            >
              <PhoneIcon className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              title="Video call"
            >
              <VideoCameraIcon className="w-5 h-5" />
            </Button>

            {showInfo && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                title="Chat info"
              >
                <InformationCircleIcon className="w-5 h-5" />
              </Button>
            )}

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
                title="Close chat"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={(e) => {
          const { scrollTop } = e.target;
          if (scrollTop === 0 && messages.length > 0) {
            loadMoreMessages();
          }
        }}
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const isOwn = message.sender._id === user?._id;
              const showAvatar = !isOwn && (!prevMessage || prevMessage.sender._id !== message.sender._id);
              const showTime = !prevMessage || 
                              new Date(message.createdAt) - new Date(prevMessage.createdAt) > 5 * 60 * 1000; // 5 minutes

              return (
                <ChatMessage
                  key={message._id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showTime={showTime}
                />
              );
            })}
            
            {/* Typing indicator */}
            {typing && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">{otherParticipant?.name} is typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onSendImage={handleSendImage}
        disabled={!roomId}
        placeholder={`Message ${otherParticipant?.name || ''}...`}
        showAttachments={true}
        showEmoji={false}
      />
    </div>
  );
};

export default ChatWindow;