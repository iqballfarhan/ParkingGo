import React from 'react';
import ChatTabView from './ChatTabView';

const ChatRoomSelector = ({ onRoomSelect, selectedRoomId }) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <ChatTabView 
        onRoomSelect={onRoomSelect}
        selectedRoomId={selectedRoomId}
      />
    </div>
  );
};

export default ChatRoomSelector; 