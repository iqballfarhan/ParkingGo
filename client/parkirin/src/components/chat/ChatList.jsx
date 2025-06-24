import React, { useState } from 'react';
import { useQuery, useSubscription, useMutation } from '@apollo/client';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { GET_MY_ROOMS } from '../../graphql/queries';
import { ROOM_UPDATED } from '../../graphql/subscriptions';
import { useAuth, useDebounce } from '../../hooks';
import { formatChatTime } from '../../utils/formatters';
import { Badge } from '../common';
import GraphQLErrorBoundary from '../common/GraphQLErrorBoundary';
import { LEAVE_ROOM } from '../../graphql/mutations';
import Swal from 'sweetalert2';

const ChatList = ({
  onRoomSelect,
  selectedRoomId = null,
  onNewChat = null,
  showSearch = true,
  compact = false
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data, loading, error, refetch } = useQuery(GET_MY_ROOMS, {
    variables: {
      search: debouncedSearch || undefined
    },
    fetchPolicy: 'cache-and-network'
  });  // Subscribe to room updates
  useSubscription(ROOM_UPDATED, {
    variables: { userId: user?._id },
    skip: !user?._id,
    onData: ({ data }) => {
      if (data.data?.roomUpdated) {
        refetch();
      }
    }
  });

  const [leaveRoom] = useMutation(LEAVE_ROOM);

  const rooms = data?.getMyRooms || [];

  const handleRoomClick = (room) => {
    if (onRoomSelect) {
      onRoomSelect(room);
    }
  };

  const getOtherParticipant = (room) => {
    return room.participants?.find(p => p._id !== user?._id);
  };
  const getLastMessagePreview = (message) => {
    if (!message) return 'No messages yet';
    
    // Handle the actual message structure from GraphQL
    const messageText = message.message || message.content || '';
    const messageType = message.message_type || message.type || 'text';
    
    switch (messageType) {
      case 'text':
        return messageText.length > 50 
          ? messageText.substring(0, 50) + '...'
          : messageText;
      case 'image':
        return '📷 Image';
      case 'file':
        return '📎 File';
      case 'system':
        return messageText;
      default:
        return messageText || 'Message';
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await leaveRoom({ variables: { roomId } });
      refetch(); // Refresh room list
    } catch (error) {
      await Swal.fire({
        title: 'Failed to delete room',
        text: error?.message || 'Unknown error',
        icon: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Error loading chats</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }
  return (
    <GraphQLErrorBoundary error={error} retry={() => refetch()}>
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
            {onNewChat && (
              <button
                onClick={onNewChat}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Start new chat"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search */}
          {showSearch && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-center">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </p>
              <p className="text-sm text-center mt-1">
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Start a conversation by booking a parking spot'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {rooms.map((room) => {
                const otherParticipant = getOtherParticipant(room);
                const isSelected = selectedRoomId === room._id;
                const hasUnread = room.unreadCount > 0;
                
                return (
                  <div
                    key={room._id}
                    onClick={() => handleRoomClick(room)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        {otherParticipant?.avatar ? (
                          <img
                            src={otherParticipant.avatar}
                            alt={otherParticipant.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        
                        {/* Online indicator */}
                        {otherParticipant?.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-sm truncate ${hasUnread ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                            {otherParticipant?.name || 'Unknown User'}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {room.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {formatChatTime(room.lastMessage.createdAt)}
                              </span>
                            )}
                            {hasUnread && (
                              <Badge size="sm" className="bg-blue-600 text-white min-w-[20px] h-5 flex items-center justify-center">
                                {room.unreadCount > 99 ? '99+' : room.unreadCount}
                              </Badge>
                            )}
                            {/* Tombol hapus room */}
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteRoom(room._id);
                              }}
                              className="ml-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded"
                              title="Delete Room"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${hasUnread ? 'text-gray-900' : 'text-gray-500'}`}>
                            {getLastMessagePreview(room.lastMessage)}
                          </p>
                          
                          {/* Room type indicator */}
                          {room.type === 'booking' && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              Booking
                            </span>
                          )}
                        </div>

                        {/* Additional info */}
                        {!compact && (
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="text-xs text-gray-400">
                              {otherParticipant?.role === 'landowner' ? 'Parking Owner' : 'Customer'}
                            </span>
                            {room.booking && (
                              <span className="text-xs text-gray-400">
                                • {room.booking.parkingName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </GraphQLErrorBoundary>
  );
};

export default ChatList;