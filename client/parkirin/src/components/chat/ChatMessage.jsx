import React from 'react';
import { CheckIcon, CheckCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatChatTime } from '../../utils/formatters';

const ChatMessage = ({
  message,
  isOwn = false,
  showAvatar = true,
  showTime = true,
  compact = false
}) => {
  const renderMessageStatus = () => {
    if (!isOwn) return null;

    switch (message.status) {
      case 'sending':
        return <ClockIcon className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <CheckIcon className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheckIcon className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheckIcon className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            <img
              src={message.content}
              alt="Shared image"
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.content, '_blank')}
            />
            {message.caption && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.caption}
              </p>
            )}
          </div>
        );
      
      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-xs">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.fileName || 'File'}
              </p>
              {message.fileSize && (
                <p className="text-xs text-gray-500">
                  {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            <button
              onClick={() => window.open(message.content, '_blank')}
              className="flex-shrink-0 text-blue-600 hover:text-blue-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        );
      
      case 'system':
        return (
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {message.content}
            </span>
          </div>
        );
      
      default:
        return (
          <p className="text-sm text-gray-500 italic">
            Unsupported message type
          </p>
        );
    }
  };

  // System messages have different styling
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        {renderMessageContent()}
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="flex-shrink-0">
            {message.sender?.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {message.sender?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name (for group chats or when not own message) */}
          {!isOwn && !compact && message.sender?.name && (
            <span className="text-xs text-gray-500 mb-1 px-1">
              {message.sender.name}
            </span>
          )}

          {/* Message bubble */}
          <div
            className={`rounded-lg px-3 py-2 ${
              isOwn
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            }`}
          >
            {renderMessageContent()}
          </div>

          {/* Message time and status */}
          {showTime && (
            <div className={`flex items-center space-x-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              <span className="text-xs text-gray-500">
                {formatChatTime(message.createdAt)}
              </span>
              {renderMessageStatus()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;