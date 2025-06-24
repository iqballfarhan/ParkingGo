import React, { useState, useRef } from 'react';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  PhotoIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { Button } from '../common';

const ChatInput = ({
  onSendMessage,
  onSendFile,
  onSendImage,
  placeholder = "Type a message...",
  disabled = false,
  loading = false,
  showAttachments = true,
  showEmoji = false,
  maxLength = 1000
}) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || loading) return;

    try {
      await onSendMessage({
        type: 'text',
        content: trimmedMessage
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = async (file, type = 'file') => {
    if (!file || uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // You would typically upload to your server here
      // For now, we'll create a local URL
      const fileUrl = URL.createObjectURL(file);
      
      const messageData = {
        type,
        content: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      };

      if (type === 'image') {
        await onSendImage(messageData);
      } else {
        await onSendFile(messageData);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, 'file');
    }
    e.target.value = ''; // Reset input
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, 'image');
    }
    e.target.value = ''; // Reset input
  };

  const isDisabled = disabled || loading || uploading;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Attachment Buttons */}
        {showAttachments && (
          <div className="flex items-center space-x-1">
            {/* File Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>

            {/* Image Upload */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isDisabled}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach image"
            >
              <PhotoIcon className="w-5 h-5" />
            </button>

            {/* Emoji Button (placeholder) */}
            {showEmoji && (
              <button
                type="button"
                disabled={isDisabled}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add emoji"
              >
                <FaceSmileIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isDisabled}
            maxLength={maxLength}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: '40px',
              maxHeight: '120px',
              height: 'auto'
            }}
            onInput={(e) => {
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
          
          {/* Character counter */}
          {message.length > maxLength * 0.8 && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!message.trim() || isDisabled}
          loading={loading}
          size="sm"
          className="px-3 py-2"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </Button>
      </form>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        className="hidden"
      />
      
      <input
        ref={imageInputRef}
        type="file"
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Upload progress indicator */}
      {uploading && (
        <div className="mt-2 text-sm text-gray-500 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Uploading file...
        </div>
      )}
    </div>
  );
};

export default ChatInput;