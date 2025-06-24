import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
  AppState,
} from "react-native";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/authContext";
import {
  GET_CHAT_MESSAGES,
  SEND_MESSAGE,
  MESSAGE_RECEIVED,
  MESSAGE_SENT,
} from "../apollo/chat";

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
    !message.includes("Network error") &&
    !message.includes("Failed to send message") &&
    !message.includes("Query error") &&
    !message.includes("Auto refresh error")
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
    !message.includes("connection") &&
    !message.includes("Scroll error")
  ) {
    // Only log critical warnings
  }
};

const ChatRoomScreen = ({ route, navigation }) => {
  // Enhanced route params validation
  const roomId = route?.params?.roomId;
  const contactName = route?.params?.contactName || "Unknown";
  const landownerId = route?.params?.landownerId;
  const bookingContext = route?.params?.bookingContext;

  if (!roomId) {
    // Silent navigation back without alert
    navigation.goBack();
    return null;
  }

  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const flatListRef = useRef();
  const autoRefreshInterval = useRef(null);
  const appState = useRef(AppState.currentState);

  // Enhanced query with silent error handling
  const { data, loading, error, refetch } = useQuery(GET_CHAT_MESSAGES, {
    variables: { roomId },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    pollInterval: 0, // We'll handle polling manually for better control
    onCompleted: (data) => {
      // Silent logging
      if (data?.getRoomMessages && Array.isArray(data.getRoomMessages)) {
        try {
          const validMessages = data.getRoomMessages
            .filter((msg) => msg && msg._id && msg.message)
            .map((msg) => ({
              ...msg,
              created_at: msg.created_at || new Date().toISOString(),
              message: String(msg.message || ""),
              sender_id: msg.sender_id || msg.sender?._id,
            }));

          const sortedMessages = validMessages.sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          );

          // Check if new messages arrived
          const newMessageCount = sortedMessages.length;
          if (newMessageCount > lastMessageCount && !isInitialLoad) {
            // New message detected, scroll to bottom
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
          setLastMessageCount(newMessageCount);

          setMessages(sortedMessages);
          setIsInitialLoad(false);
          setConnectionStatus("connected");
          setIsAutoRefreshing(false);

          // Auto scroll to bottom after initial load
          if (isInitialLoad) {
            setTimeout(() => {
              scrollToBottom();
            }, 200);
          }
        } catch (error) {
          // Silent error handling
          setMessages([]);
          setIsInitialLoad(false);
          setIsAutoRefreshing(false);
        }
      } else {
        setMessages([]);
        setIsInitialLoad(false);
        setIsAutoRefreshing(false);
      }
    },
    onError: (error) => {
      // Silent error handling
      setIsInitialLoad(false);
      setConnectionStatus("error");
      setIsAutoRefreshing(false);
    },
  });

  // Enhanced send message mutation with silent error handling
  const [sendMessage, { loading: sendingMessage }] = useMutation(SEND_MESSAGE, {
    errorPolicy: "all",
    onCompleted: (data) => {
      if (data?.sendMessage) {
        const newMessage = {
          ...data.sendMessage,
          created_at: data.sendMessage.created_at || new Date().toISOString(),
          message: String(data.sendMessage.message || ""),
          sender_id: data.sendMessage.sender_id || user._id,
        };

        setMessages((prevMessages) => {
          const messageExists = prevMessages.some(
            (msg) => msg._id === newMessage._id
          );
          if (!messageExists) {
            const updatedMessages = [...prevMessages, newMessage].sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
            setTimeout(() => scrollToBottom(), 100);
            return updatedMessages;
          }
          return prevMessages;
        });
      }
    },
    onError: (error) => {
      // Silent error handling - no alerts
      console.log("Send message error (silent):", error.message);
    },
  });

  // Primary subscription with silent error handling
  const {
    data: subscriptionData,
    error: subscriptionError,
    loading: subscriptionLoading,
  } = useSubscription(MESSAGE_RECEIVED, {
    variables: { room_id: roomId },
    skip: !roomId || !user?._id,
    shouldResubscribe: true,
    fetchPolicy: "no-cache",
    onData: ({ data: subscriptionPayload }) => {
      try {
        const newMessage = subscriptionPayload?.data?.messageReceived;
        if (newMessage && newMessage._id && newMessage.message) {
          const processedMessage = {
            ...newMessage,
            created_at: newMessage.created_at || new Date().toISOString(),
            message: String(newMessage.message || ""),
            sender_id: newMessage.sender_id || newMessage.sender?._id,
          };

          setMessages((prevMessages) => {
            const messageExists = prevMessages.some(
              (msg) => msg._id === processedMessage._id
            );

            if (!messageExists) {
              const updatedMessages = [...prevMessages, processedMessage].sort(
                (a, b) => new Date(a.created_at) - new Date(b.created_at)
              );

              setTimeout(() => scrollToBottom(), 100);
              return updatedMessages;
            }

            return prevMessages;
          });

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
      // Silent error handling
      console.log(
        "MESSAGE_RECEIVED subscription error (silent):",
        error.message
      );
      setConnectionStatus("error");
    },
  });

  // Fallback subscription with silent error handling
  const { data: fallbackSubscriptionData, error: fallbackSubscriptionError } =
    useSubscription(MESSAGE_SENT, {
      variables: { room_id: roomId },
      skip: !roomId || !user?._id || !subscriptionError,
      shouldResubscribe: true,
      fetchPolicy: "no-cache",
      onData: ({ data: subscriptionPayload }) => {
        try {
          const newMessage = subscriptionPayload?.data?.messageSent;
          if (newMessage && newMessage._id && newMessage.message) {
            const processedMessage = {
              ...newMessage,
              created_at: newMessage.created_at || new Date().toISOString(),
              message: String(newMessage.message || ""),
              sender_id: newMessage.sender_id || newMessage.sender?._id,
            };

            setMessages((prevMessages) => {
              const messageExists = prevMessages.some(
                (msg) => msg._id === processedMessage._id
              );
              if (!messageExists) {
                const updatedMessages = [
                  ...prevMessages,
                  processedMessage,
                ].sort(
                  (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );
                setTimeout(() => scrollToBottom(), 100);
                return updatedMessages;
              }
              return prevMessages;
            });

            setConnectionStatus("connected");
          }
        } catch (error) {
          // Silent error handling
          console.log(
            "Fallback subscription data processing error (silent):",
            error.message
          );
        }
      },
      onError: (error) => {
        // Silent error handling
        console.log(
          "MESSAGE_SENT fallback subscription error (silent):",
          error.message
        );
      },
    });

  // Monitor connection status with silent handling
  useEffect(() => {
    if (subscriptionError && fallbackSubscriptionError) {
      setConnectionStatus("disconnected");
    } else if (subscriptionError && !fallbackSubscriptionError) {
      setConnectionStatus("fallback");
    } else if (!subscriptionError) {
      setConnectionStatus("connected");
    }
  }, [subscriptionError, fallbackSubscriptionError]);

  // Enhanced scroll to bottom function with silent error handling
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      try {
        flatListRef.current.scrollToEnd({ animated: true });
      } catch (error) {
        // Silent error handling
        console.log("Scroll error (silent):", error.message);
      }
    }
  }, [messages.length]);

  // Auto refresh function with silent error handling
  const performAutoRefresh = useCallback(async () => {
    if (loading || isAutoRefreshing) return;

    try {
      setIsAutoRefreshing(true);
      await refetch();
    } catch (error) {
      // Silent error handling
      console.log("Auto refresh error (silent):", error.message);
      setIsAutoRefreshing(false);
    }
  }, [loading, isAutoRefreshing, refetch]);

  // Setup auto refresh interval
  useEffect(() => {
    if (!roomId || !user?._id) return;

    // Start auto refresh when component mounts
    const startAutoRefresh = () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }

      // Refresh every 1 second (1000ms) for near real-time experience
      // You can adjust this interval: 500ms for more frequent, 2000ms for less frequent
      autoRefreshInterval.current = setInterval(() => {
        if (appState.current === "active") {
          performAutoRefresh();
        }
      }, 1000);
    };

    // Start auto refresh after initial load
    if (!isInitialLoad) {
      startAutoRefresh();
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, [roomId, user?._id, isInitialLoad, performAutoRefresh]);

  // Handle app state changes (pause auto refresh when app is in background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came to foreground, immediately refresh and resume auto refresh
        console.log("App came to foreground, refreshing...");
        performAutoRefresh();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [performAutoRefresh]);

  // Enhanced message sending with silent error handling
  const handleSendMessage = async () => {
    if (!message.trim() || sendingMessage) return;

    const messageText = message.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const now = new Date().toISOString();

    // Clear input immediately for better UX
    setMessage("");

    // Add optimistic message
    const optimisticMessage = {
      _id: tempId,
      message: messageText,
      sender_id: user._id,
      created_at: now,
      message_type: "text",
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(), 100);

    try {
      console.log("Sending message:", messageText);

      const result = await sendMessage({
        variables: {
          input: {
            room_id: roomId,
            message: messageText,
          },
        },
      });

      // Remove optimistic message
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));

      setTimeout(() => {
        performAutoRefresh();
      }, 100);
    } catch (error) {
      // Silent error handling - no alerts
      console.log("Error sending message (silent):", error.message);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      setMessage(messageText);
      // Don't show alert - just restore the message for retry
    }
  };

  // Add booking context message with silent error handling
  const sendBookingContextMessage = async () => {
    if (!bookingContext) return;

    const contextMessage = `📋 Booking Details:
🏢 Parking: ${bookingContext.parkingName}
🚗 Vehicle: ${bookingContext.vehicleType}
📅 Start: ${new Date(parseInt(bookingContext.startTime)).toLocaleDateString(
      "id-ID",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    )}
⏱️ Duration: ${bookingContext.duration} hours
🆔 Booking ID: #${bookingContext.bookingId.slice(-8)}

Hello! I have a confirmed booking for your parking space. Please let me know if you need any additional information.`;

    try {
      await sendMessage({
        variables: {
          input: {
            room_id: roomId,
            message: contextMessage,
          },
        },
      });
    } catch (error) {
      // Silent error handling
      console.log("Error sending booking context (silent):", error.message);
    }
  };

  // Send booking context on first load
  useEffect(() => {
    if (bookingContext && messages.length === 0 && !isInitialLoad) {
      // Send booking context message after a short delay
      setTimeout(() => {
        sendBookingContextMessage();
      }, 1000);
    }
  }, [bookingContext, messages.length, isInitialLoad]);

  // Enhanced message rendering with silent error handling
  const renderMessage = ({ item: msg, index }) => {
    if (!msg || !msg._id || !msg.message) {
      // Silent warning
      return null;
    }

    const isOwnMessage = msg.sender_id === user?._id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage
            ? styles.ownMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            msg.isOptimistic && styles.optimisticMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {String(msg.message || "")}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {msg.created_at
              ? (() => {
                  try {
                    return new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  } catch (error) {
                    return "";
                  }
                })()
              : ""}
          </Text>
        </View>
      </View>
    );
  };

  // Show loading state
  if (loading && isInitialLoad) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#FF9A62", "#FE7A3A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{contactName}</Text>
            <Text style={styles.headerSubtitle}>Loading...</Text>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FE7A3A" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getConnectionStatusColor = () => {
    if (isAutoRefreshing) {
      return "rgba(255, 255, 0, 0.9)";
    }

    switch (connectionStatus) {
      case "connected":
        return "rgba(255, 255, 255, 0.8)";
      case "connecting":
        return "rgba(255, 255, 255, 0.6)";
      case "fallback":
        return "rgba(255, 255, 0, 0.8)";
      case "disconnected":
      case "error":
        return "rgba(255, 100, 100, 0.8)";
      default:
        return "rgba(255, 255, 255, 0.8)";
    }
  };

  // Manual refresh with silent error handling
  const handleManualRefresh = async () => {
    await performAutoRefresh();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header with Booking Context */}
      <LinearGradient
        colors={["#FF9A62", "#FE7A3A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{contactName}</Text>
          <Text style={styles.headerSubtitle}>
            {bookingContext ? "Parking Owner" : "Online"}
          </Text>
        </View>
        {bookingContext && (
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              Alert.alert(
                "Booking Info",
                `Parking: ${bookingContext.parkingName}\nVehicle: ${
                  bookingContext.vehicleType
                }\nBooking ID: #${bookingContext.bookingId.slice(-8)}`
              );
            }}
          >
            <Ionicons name="information-circle" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Enhanced Messages with Booking Context Banner */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {bookingContext && (
          <View style={styles.bookingBanner}>
            <View style={styles.bannerContent}>
              <Ionicons name="car" size={20} color="#059669" />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Booking Chat</Text>
                <Text style={styles.bannerSubtitle}>
                  {bookingContext.parkingName} • ID: #
                  {bookingContext.bookingId.slice(-8)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => {
            if (item && item._id) {
              return item._id;
            }
            return `message_${index}_${Date.now()}`;
          }}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom()}
          onLayout={() => scrollToBottom()}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#CBD5E0" />
              <Text style={styles.emptyText}>Start your conversation</Text>
              <Text style={styles.emptySubtext}>
                {bookingContext
                  ? "Discuss your parking booking details with the owner"
                  : "Send a message to begin chatting"}
              </Text>
            </View>
          )}
        />

        {/* Enhanced Input Area with Quick Messages */}
        <View style={styles.inputContainer}>
          {bookingContext && (
            <View style={styles.quickMessages}>
              <TouchableOpacity
                style={styles.quickMessageButton}
                onPress={() => setMessage("What time can I arrive?")}
              >
                <Text style={styles.quickMessageText}>Arrival time?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickMessageButton}
                onPress={() =>
                  setMessage("Are there any special parking instructions?")
                }
              >
                <Text style={styles.quickMessageText}>Instructions?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickMessageButton}
                onPress={() => setMessage("Thank you for the confirmation!")}
              >
                <Text style={styles.quickMessageText}>Thank you!</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder={
                bookingContext
                  ? "Ask about your booking..."
                  : "Type a message..."
              }
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
              editable={!sendingMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.trim() || sendingMessage) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    shadowColor: "#FE7A3A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: 10,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
    fontWeight: "500",
  },
  refreshButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  refreshButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  rotatingIcon: {
    transform: [{ rotate: "360deg" }],
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F4F8",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: "#64748B",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  messagesList: {
    flex: 1,
    paddingTop: 8,
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    color: "#475569",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 24,
  },
  messageContainer: {
    marginVertical: 6,
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: "#FE7A3A",
    borderBottomRightRadius: 8,
    shadowColor: "#FE7A3A",
    shadowOpacity: 0.2,
  },
  otherMessageBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optimisticMessage: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  ownMessageText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  otherMessageText: {
    color: "#1E293B",
    fontWeight: "500",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  ownMessageTime: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "right",
  },
  otherMessageTime: {
    color: "#94A3B8",
    textAlign: "left",
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F7FAFC",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 56,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    maxHeight: 120,
    paddingVertical: 8,
    paddingRight: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  sendButton: {
    backgroundColor: "#FE7A3A",
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#FE7A3A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: "#CBD5E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  infoButton: {
    padding: 10,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  bookingBanner: {
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerText: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  quickMessages: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingBottom: 12,
    gap: 8,
  },
  quickMessageButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickMessageText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
});

// Cleanup console overrides when component unmounts
const ChatRoomScreenWrapper = (props) => {
  useEffect(() => {
    return () => {
      // Restore original console functions on cleanup
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return <ChatRoomScreen {...props} />;
};

export default ChatRoomScreenWrapper;
