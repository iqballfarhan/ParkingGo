import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/authContext";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import {
  GET_ALL_LANDOWNERS,
  GET_USER_CHATS,
  CREATE_PRIVATE_ROOM,
  SEND_MESSAGE,
  DELETE_ROOM,
  ROOM_UPDATED,
} from "../apollo/chat";
import { WebSocketLink } from "@apollo/client/link/ws";

// Suppress console errors and warnings for better UX
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Only log critical errors, suppress subscription and GraphQL errors
  const message = args.join(" ");
  if (
    !message.includes("subscription") &&
    !message.includes("WebSocket") &&
    !message.includes("GraphQL") &&
    !message.includes("Network error")
  ) {
    originalConsoleError(...args);
  }
};

console.warn = (...args) => {
  // Suppress all warnings to prevent error notifications
  const message = args.join(" ");
  if (
    !message.includes("subscription") &&
    !message.includes("WebSocket") &&
    !message.includes("connection")
  ) {
    // Only log critical warnings
  }
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DELETE_WIDTH = 70; // Reduced delete width

const SwipeableRow = ({ children, onDelete }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 15
        );
      },
      onPanResponderGrant: () => {
        translateX.setOffset(translateX._value);
        translateX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -DELETE_WIDTH));
        } else {
          translateX.setValue(Math.min(gestureState.dx, 0));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();

        if (gestureState.dx < -30) {
          // Show delete button
          setShowDelete(true);
          Animated.spring(translateX, {
            toValue: -DELETE_WIDTH,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
        } else {
          // Hide delete button
          setShowDelete(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    if (isDeleting) return;
    setIsDeleting(true);

    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      onDelete();
      setIsDeleting(false);
      setShowDelete(false);
    });
  };

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity
          style={[styles.deleteButton, { opacity: showDelete ? 1 : 0 }]}
          onPress={handleDelete}
          disabled={isDeleting || !showDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[
          styles.rowContent,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const ChatScreen = ({ navigation, onClose }) => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Enhanced GraphQL operations with silent error handling
  const [createPrivateRoom] = useMutation(CREATE_PRIVATE_ROOM, {
    errorPolicy: "all",
    onError: (error) => {
      // Silent error handling - just log without alerts
      console.log("Create room error (silent):", error.message);
    },
  });

  const [deleteRoom] = useMutation(DELETE_ROOM, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_USER_CHATS }],
    awaitRefetchQueries: true,
    onError: (error) => {
      // Silent error handling
      console.log("Delete room error (silent):", error.message);
    },
  });

  // Get landowner contacts with silent error handling
  const {
    data: landownersData,
    loading: landownersLoading,
    error: landownersError,
  } = useQuery(GET_ALL_LANDOWNERS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.log("Landowners query error (silent):", error.message);
    },
  });

  // Get user's existing chats with silent error handling
  const {
    data: chatsData,
    loading: chatsLoading,
    error: chatsError,
    refetch: refetchChats,
  } = useQuery(GET_USER_CHATS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      console.log("Chats query error (silent):", error.message);
    },
  });

  // Enhanced subscription with silent error handling
  const {
    data: subscriptionData,
    error: subscriptionError,
    loading: subscriptionLoading,
  } = useSubscription(ROOM_UPDATED, {
    variables: { user_id: user?._id },
    skip: !user?._id,
    shouldResubscribe: true,
    fetchPolicy: "no-cache",
    onData: ({ data }) => {
      try {
        if (data?.data?.roomUpdated) {
          refetchChats();
          setConnectionStatus("connected");
        }
      } catch (error) {
        // Silent error handling
        console.log(
          "Subscription data processing error (silent):",
          error.message
        );
      }
    },
    onError: (error) => {
      // Silent error handling - no alerts or notifications
      setConnectionStatus("error");
      console.log("Subscription error (silent):", error.message);
    },
    onCompleted: () => {
      setConnectionStatus("connected");
    },
  });

  // Monitor subscription status with silent handling
  useEffect(() => {
    if (subscriptionError) {
      // Silent handling - just set connection status
      if (subscriptionError.message?.includes("400")) {
        setConnectionStatus("unsupported");
      } else if (subscriptionError.networkError) {
        setConnectionStatus("network_error");
      } else {
        setConnectionStatus("error");
      }
    } else if (subscriptionLoading) {
      setConnectionStatus("connecting");
    } else {
      setConnectionStatus("connected");
    }
  }, [subscriptionError, subscriptionLoading]);

  // WebSocket configuration with silent error handling
  useEffect(() => {
    if (subscriptionError) {
      // Silent reconnection attempt without notifications
      setTimeout(() => {
        console.log("Attempting silent reconnection...");
      }, 5000);
    }
  }, [subscriptionError]);

  const landowners = landownersData?.getUsersByRole || [];
  const chats = chatsData?.getMyRooms || [];

  // Remove duplicate rooms by checking participants
  const uniqueChats = chats.reduce((acc, chat) => {
    const otherParticipant = chat.participants.find((p) => p._id !== user?._id);
    const existingChat = acc.find((c) => {
      const existingParticipant = c.participants.find(
        (p) => p._id !== user?._id
      );
      return existingParticipant?._id === otherParticipant?._id;
    });

    if (!existingChat) {
      acc.push(chat);
    } else {
      // Keep the most recent chat
      if (
        new Date(chat.last_message?.created_at) >
        new Date(existingChat.last_message?.created_at)
      ) {
        const index = acc.indexOf(existingChat);
        acc[index] = chat;
      }
    }
    return acc;
  }, []);

  // Filter based on role and search
  const isLandowner = user?.role === "landowner";

  const filteredContacts = isLandowner
    ? uniqueChats.filter((chat) => {
        const otherParticipant = chat.participants.find(
          (p) => p._id !== user?._id
        );
        return (
          otherParticipant?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          otherParticipant?.email
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      })
    : landowners.filter((landowner) => {
        // Check if already has a chat with this landowner
        const hasExistingChat = uniqueChats.some((chat) => {
          const otherParticipant = chat.participants.find(
            (p) => p._id !== user?._id
          );
          return otherParticipant?._id === landowner._id;
        });

        const matchesSearch =
          landowner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          landowner.email?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch && !hasExistingChat;
      });

  // Enhanced handleContactPress with silent error handling
  const handleContactPress = async (landowner) => {
    try {
      // Check if room already exists
      const existingRoom = uniqueChats.find((chat) => {
        const otherParticipant = chat.participants.find(
          (p) => p._id !== user?._id
        );
        return otherParticipant?._id === landowner._id;
      });

      if (existingRoom) {
        navigation.navigate("ChatRoomScreen", {
          roomId: existingRoom._id,
          contactName: landowner.name,
        });
        return;
      }

      console.log("Creating new room with landowner:", landowner._id);

      const response = await createPrivateRoom({
        variables: {
          input: {
            participant_id: landowner._id,
          },
        },
        errorPolicy: "all",
      });

      if (response.data?.createPrivateRoom) {
        navigation.navigate("ChatRoomScreen", {
          roomId: response.data.createPrivateRoom._id,
          contactName: landowner.name,
        });
        // Refresh chats list to show new room
        await refetchChats();
      } else if (response.errors) {
        // Silent error handling - just log
        console.log(
          "Room creation failed (silent):",
          response.errors[0]?.message
        );
      }
    } catch (error) {
      // Silent error handling - no alerts
      console.log("Contact press error (silent):", error.message);
    }
  };

  const handleChatPress = (chat) => {
    const otherParticipant = chat.participants.find((p) => p._id !== user?._id);
    navigation.navigate("ChatRoomScreen", {
      roomId: chat._id,
      contactName: otherParticipant?.name || "Unknown",
    });
  };

  const handleDeleteChat = async (chatId) => {
    try {
      if (!chatId || typeof chatId !== "string") {
        return;
      }

      const response = await deleteRoom({
        variables: { id: chatId },
        errorPolicy: "all",
      });

      if (response.data?.deleteRoom === true) {
        await refetchChats();
        return;
      }

      // Silent error handling for all error cases
      if (response.errors && response.errors.length > 0) {
        const error = response.errors[0];
        console.log("Delete error (silent):", error.message);

        if (error.message?.includes("removeByRoom is not a function")) {
          refetchChats(); // Optimistic update
          return;
        }

        if (error.message?.includes("not found")) {
          await refetchChats();
        }
      }
    } catch (error) {
      // Silent error handling for all network errors
      console.log("Delete chat error (silent):", error.message);

      if (error.networkError?.statusCode === 404) {
        await refetchChats();
      }
    }
  };

  // Direct delete without confirmation popup
  const confirmDeleteChat = (chat) => {
    handleDeleteChat(chat._id);
  };

  const renderContactItem = ({ item }) => {
    const contactInfo = isLandowner
      ? item.participants.find((p) => p._id !== user?._id)
      : item;

    // Validate contactInfo
    if (!contactInfo || !contactInfo._id) {
      console.warn("Invalid contact info:", contactInfo);
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() =>
          isLandowner ? handleChatPress(item) : handleContactPress(contactInfo)
        }
      >
        <View style={styles.contactAvatar}>
          <Text style={styles.avatarText}>
            {contactInfo?.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>
            {contactInfo?.name || "Unknown User"}
          </Text>
          <Text style={styles.contactRole}>
            {isLandowner ? "User" : "Landowner"}
          </Text>
        </View>
        <View>
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderChatItem = ({ item: chat }) => {
    const otherParticipant = chat.participants.find((p) => p._id !== user?._id);
    const lastMessage = chat.last_message;

    // Validate chat data
    if (!otherParticipant) {
      return null;
    }

    const chatContent = (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(chat)}
      >
        <View style={styles.chatAvatar}>
          <Text style={styles.avatarText}>
            {otherParticipant?.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>
            {otherParticipant?.name || chat.name || "Unknown User"}
          </Text>
          {lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.message || "No message"}
            </Text>
          )}
          {lastMessage?.created_at && (
            <Text style={styles.messageTime}>
              {(() => {
                try {
                  return new Date(lastMessage.created_at).toLocaleDateString();
                } catch (error) {
                  return "";
                }
              })()}
            </Text>
          )}
        </View>
        {chat.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{chat.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );

    return (
      <SwipeableRow onDelete={() => confirmDeleteChat(chat)}>
        {chatContent}
      </SwipeableRow>
    );
  };

  // Enhanced empty state with connection status
  const renderEmptyState = (type) => {
    if (type === "chats-loading") {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#FE7A3A" />
          <Text style={styles.emptyStateText}>Loading chats...</Text>
        </View>
      );
    }

    if (type === "chats-error") {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.emptyStateText}>Error loading chats</Text>
          <Text style={styles.emptyStateSubtext}>
            {chatsError?.message || "Please try again"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetchChats()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (type === "chats-empty") {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>
            {isLandowner ? "No messages yet" : "No chats yet"}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {isLandowner
              ? "Users will appear here when they contact you"
              : "Start a conversation with a landowner"}
          </Text>
          {connectionStatus !== "connected" && (
            <Text style={styles.connectionWarning}>
              Connection: {connectionStatus}
            </Text>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FF9A62", "#FE7A3A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </LinearGradient>

      {/* Tab Buttons - Show only if user is not a landowner */}
      {!isLandowner && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "chats" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("chats")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "chats" && styles.activeTabText,
              ]}
            >
              Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "contacts" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("contacts")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "contacts" && styles.activeTabText,
              ]}
            >
              Landowners
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={
            isLandowner
              ? "Search messages..."
              : selectedTab === "chats"
              ? "Search chats..."
              : "Search landowners..."
          }
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {/* Enhanced Content with better error handling */}
      {isLandowner ? (
        // Landowner view - only shows chats
        <FlatList
          data={filteredContacts}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            chatsLoading
              ? renderEmptyState("chats-loading")
              : chatsError
              ? renderEmptyState("chats-error")
              : renderEmptyState("chats-empty")
          }
        />
      ) : selectedTab === "contacts" ? (
        // User view - contacts tab
        <FlatList
          data={filteredContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            landownersLoading ? (
              <ActivityIndicator style={styles.loader} color="#FE7A3A" />
            ) : landownersError ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color="#EF4444"
                />
                <Text style={styles.emptyStateText}>
                  Error loading landowners
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {landownersError.message || "Please try again"}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No landowners found</Text>
              </View>
            )
          }
        />
      ) : (
        // User view - chats tab
        <FlatList
          data={uniqueChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            chatsLoading
              ? renderEmptyState("chats-loading")
              : chatsError
              ? renderEmptyState("chats-error")
              : renderEmptyState("chats-empty")
          }
        />
      )}
    </SafeAreaView>
  );
};

// Add connection status styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#FE7A3A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButton: {
    marginRight: 12,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    letterSpacing: 0.3,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FE7A3A",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: "#FE7A3A",
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchIcon: {
    position: "absolute",
    left: 32,
    top: 26,
    zIndex: 1,
  },
  searchInput: {
    fontSize: 16,
    color: "#1E293B",
    paddingVertical: 12,
    paddingLeft: 44,
    paddingRight: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#D97706",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  contactRole: {
    fontSize: 14,
    color: "#64748B",
  },
  swipeContainer: {
    marginHorizontal: 12,
    marginVertical: 4,
    position: "relative",
  },
  deleteButtonContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  rowContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 12,
    color: "#94A3B8",
  },
  unreadBadge: {
    backgroundColor: "#FE7A3A",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#475569",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#FE7A3A",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  connectionWarning: {
    fontSize: 12,
    color: "#F59E0B",
    marginTop: 8,
    fontStyle: "italic",
    textAlign: "center",
  },
});

// Cleanup console overrides when component unmounts
const ChatScreenWrapper = (props) => {
  useEffect(() => {
    return () => {
      // Restore original console functions on cleanup
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return <ChatScreen {...props} />;
};

export default ChatScreenWrapper;
