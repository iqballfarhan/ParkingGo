import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { MagnifyingGlassIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { GET_ALL_LANDOWNERS } from '../../graphql/queries';
import { CREATE_PRIVATE_ROOM } from '../../graphql/mutations';
import { useAuth, useDebounce } from '../../hooks';
import { useChatStore } from '../../store/chatStore';

const LandownerContactList = ({ onContactSelect, compact = false }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { setSelectedRoom, landownerContacts, setLandownerContacts } = useChatStore();

  // Ensure user is properly authenticated and has necessary role
  useEffect(() => {
    if (!user || !user._id) {
      console.error('User not properly authenticated');
      return;
    }
  }, [user]);

  const { data: landownersData, loading, error } = useQuery(GET_ALL_LANDOWNERS, {
    onCompleted: (data) => {
      if (data?.getUsersByRole) {
        // Filter out any invalid landowner data
        const validLandowners = data.getUsersByRole.filter(owner => 
          owner && owner._id && owner.role === 'landowner'
        );
        setLandownerContacts(validLandowners);
      }
    },
    // Add fetchPolicy to ensure fresh data
    fetchPolicy: "network-only"
  });

  const [createPrivateRoom] = useMutation(CREATE_PRIVATE_ROOM);

  // Filter landowners based on search query
  const filteredLandowners = landownerContacts.filter(landowner =>
    landowner.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    landowner.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  const handleContactClick = async (landowner) => {
    if (!user?._id) {
      console.error('User ID not available');
      return;
    }

    if (!landowner?._id) {
      console.error('Landowner ID not available');
      return;
    }

    try {
      const roomResponse = await createPrivateRoom({
        variables: {
          input: {
            participant_id: landowner._id
          }
        }
      });

      if (roomResponse.data?.createPrivateRoom) {
        const room = roomResponse.data.createPrivateRoom;
        setSelectedRoom(room);
        if (onContactSelect) {
          onContactSelect(room);
        }
      }
    } catch (error) {
      console.error('Error creating/finding private room:', error);
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
        <p>Error loading contacts</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Parking Owners</h2>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search owners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {filteredLandowners.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-center">
              {searchQuery ? 'No owners found' : 'No parking owners available'}
            </p>
            <p className="text-sm text-center mt-1">
              {searchQuery 
                ? 'Try a different search term'
                : 'Parking owners will appear here'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLandowners.map((landowner) => (
              <div
                key={landowner._id}
                onClick={() => handleContactClick(landowner)}
                className="p-4 cursor-pointer transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    {landowner.avatar ? (
                      <img
                        src={landowner.avatar}
                        alt={landowner.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-orange-600">
                          {landowner.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {landowner.name}
                      </h3>
                      <ChatBubbleLeftIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    <p className="text-sm text-gray-500 truncate">
                      {landowner.email}
                    </p>
                    
                    {!compact && (
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          Parking Owner
                        </span>
                        {landowner.location && (
                          <span className="text-xs text-gray-400 ml-2">
                            • {landowner.location}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandownerContactList;
