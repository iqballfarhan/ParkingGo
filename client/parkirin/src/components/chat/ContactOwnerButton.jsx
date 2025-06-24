import React from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { CREATE_PRIVATE_ROOM } from '../../graphql/mutations';
import { useAuth } from '../../hooks';

const ContactOwnerButton = ({ parking, className = "", size = "default" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [createPrivateRoom, { loading }] = useMutation(CREATE_PRIVATE_ROOM);

  const handleContactOwner = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    if (user.role !== 'user') {
      // Only regular users can contact landowners
      return;
    }

    if (!parking?.owner?._id) {
      console.error('No owner found for this parking');
      return;
    }    try {
      const response = await createPrivateRoom({
        variables: {
          input: {
            participant_id: parking.owner._id,
            parking_id: parking._id
          }
        }
      });

      if (response.data?.createPrivateRoom) {
        const room = response.data.createPrivateRoom;
        // Navigate to chat with the created/found room
        navigate(`/chat?room=${room._id}`);
      }
    } catch (error) {
      console.error('Error creating private room:', error);
    }
  };

  // Don't show button if user is the owner or user is not a regular user
  if (!user || user.role !== 'user' || user._id === parking?.owner?._id) {
    return null;
  }

  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    default: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base"
  };

  const iconSizes = {
    small: "w-4 h-4",
    default: "w-5 h-5", 
    large: "w-5 h-5"
  };

  return (
    <button
      onClick={handleContactOwner}
      disabled={loading}
      className={`
        inline-flex items-center justify-center space-x-2 
        bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
        text-white font-medium rounded-lg 
        transition-colors duration-200
        disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <ChatBubbleLeftIcon className={iconSizes[size]} />
      <span>{loading ? 'Connecting...' : 'Contact Owner'}</span>
    </button>
  );
};

export default ContactOwnerButton;
