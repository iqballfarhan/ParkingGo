import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  // UI State
  activeView: 'chats', // 'chats' | 'contacts'
  selectedRoom: null,
  isTyping: false,
  
  // Data State
  rooms: [],
  messages: {},
  unreadCounts: {},
  landownerContacts: [],
  
  // Actions
  setActiveView: (view) => set({ activeView: view }),
  
  setSelectedRoom: (room) => set({ 
    selectedRoom: room,
    unreadCounts: {
      ...get().unreadCounts,
      [room?._id]: 0
    }
  }),
  
  setRooms: (rooms) => set({ rooms }),
  
  addMessage: (roomId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [roomId]: [...(state.messages[roomId] || []), message]
    }
  })),
  
  setMessages: (roomId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [roomId]: messages
    }
  })),
  
  incrementUnreadCount: (roomId) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [roomId]: (state.unreadCounts[roomId] || 0) + 1
    }
  })),
  
  setLandownerContacts: (contacts) => set({ landownerContacts: contacts }),
  
  // Helper functions
  getRoomMessages: (roomId) => get().messages[roomId] || [],
  getUnreadCount: (roomId) => get().unreadCounts[roomId] || 0,
  
  // Get other participant in private room
  getOtherParticipant: (room, currentUserId) => {
    if (!room?.participants) return null;
    return room.participants.find(p => p._id !== currentUserId);
  },
  
  // Reset store
  reset: () => set({
    activeView: 'chats',
    selectedRoom: null,
    isTyping: false,
    rooms: [],
    messages: {},
    unreadCounts: {},
    landownerContacts: []
  })
}));
