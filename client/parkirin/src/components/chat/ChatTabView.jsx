import React, { useEffect } from 'react';
import { ChatBubbleLeftRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks';
import { useChatStore } from '../../store/chatStore';
import ChatList from './ChatList';
import LandownerContactList from './LandownerContactList';

const ChatTabView = ({ onRoomSelect, selectedRoomId }) => {
  const { user } = useAuth();
  const { activeView, setActiveView } = useChatStore();
  
  // Enhanced role check to ensure consistent behavior for OAuth and regular users
  const isRegularUser = user && (user.role === 'user' || user.role === 'USER');
  const showContactsTab = isRegularUser;

  // Reset to chats view if contacts shouldn't be visible
  useEffect(() => {
    if (!showContactsTab && activeView === 'contacts') {
      setActiveView('chats');
    }
  }, [showContactsTab, activeView, setActiveView]);

  const tabs = [
    {
      id: 'chats',
      name: 'Chats',
      icon: ChatBubbleLeftRightIcon,
      count: null
    }
  ];

  if (showContactsTab) {
    tabs.push({
      id: 'contacts',
      name: 'Parking Owners',
      icon: UserGroupIcon,
      count: null
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 px-4 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
                {tab.count !== null && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-blue-200' : 'bg-gray-100'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeView === 'contacts' && showContactsTab ? (
          <LandownerContactList onContactSelect={onRoomSelect} />
        ) : (
          <ChatList onRoomSelect={onRoomSelect} selectedRoomId={selectedRoomId} />
        )}
      </div>
    </div>
  );
};

export default ChatTabView;
