import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { CREATE_PRIVATE_ROOM } from '../../graphql/mutations';
import { GET_PRIVATE_ROOM_WITH_USER } from '../../graphql/queries';
import useAuthStore from '../../store/authStore';
import Swal from 'sweetalert2';

const StartChatButton = ({ landowner, parkingId, variant = 'primary' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Check if private room already exists
  const { data: existingRoomData } = useQuery(GET_PRIVATE_ROOM_WITH_USER, {
    variables: { userId: landowner._id, parkingId },
    skip: !landowner._id
  });

  const [createPrivateRoom] = useMutation(CREATE_PRIVATE_ROOM);

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user._id === landowner._id) {
      Swal.fire({
        title: 'Tidak Diperbolehkan',
        text: 'Anda tidak bisa chat dengan diri sendiri',
        icon: 'warning',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      let roomId;
      
      // Check if room already exists
      if (existingRoomData?.getPrivateRoomWithUser) {
        roomId = existingRoomData.getPrivateRoomWithUser._id;
      } else {
        // Create new private room
        const { data } = await createPrivateRoom({
          variables: {
            input: {
              participant_id: landowner._id,
              parking_id: parkingId
            }
          }
        });
        roomId = data?.createPrivateRoom?._id;
      }

      if (roomId) {
        // Navigate to chat page with room pre-selected
        navigate(`/dashboard/chat?room=${roomId}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      Swal.fire({
        title: 'Gagal',
        text: 'Gagal memulai chat. Silakan coba lagi.',
        icon: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClasses = {
    primary: "w-full bg-[#f16634] text-white hover:bg-[#d45528]",
    secondary: "w-full bg-white text-[#f16634] border border-[#f16634] hover:bg-orange-50",
    compact: "bg-[#f16634] text-white hover:bg-[#d45528] px-3 py-2 text-sm"
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={isLoading}
      className={`
        ${buttonClasses[variant]}
        flex items-center justify-center space-x-2 
        px-4 py-2 rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <ChatBubbleLeftRightIcon className="w-5 h-5" />
      <span>
        {isLoading 
          ? 'Memuat...' 
          : existingRoomData?.getPrivateRoomWithUser 
            ? 'Lanjutkan Chat' 
            : `Chat dengan ${landowner.name}`
        }
      </span>
    </button>
  );
};

export default StartChatButton; 