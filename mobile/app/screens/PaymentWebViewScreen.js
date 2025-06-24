import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useQuery, useMutation } from "@apollo/client";
import { formatAmountInput } from "../helpers/formatAmount";

const CHECK_TRANSACTION_STATUS = gql`
  query CheckTransactionStatus($transaction_id: String!) {
    checkTransactionStatus(transaction_id: $transaction_id) {
      transaction_id
      status
      amount
      user {
        saldo
      }
    }
  }
`;

const GET_USER_BALANCE = gql`
  query Me {
    me {
      saldo
    }
  }
`;

export default function PaymentWebViewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const webViewRef = useRef(null);

  const { transaction_id, amount, payment_method, payment_url } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const { data: transactionData, refetch: refetchTransaction } = useQuery(
    CHECK_TRANSACTION_STATUS,
    {
      variables: { transaction_id },
      pollInterval: 5000, // Poll every 5 seconds
      skip: false,
    }
  );

  const { refetch: refetchBalance } = useQuery(GET_USER_BALANCE);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Cancel Payment?",
        "Are you sure you want to cancel this payment?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes", onPress: () => navigation.goBack() },
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  // Monitor transaction status
  useEffect(() => {
    if (transactionData?.checkTransactionStatus) {
      const status = transactionData.checkTransactionStatus.status;

      if (status === "success") {
        // Payment successful
        refetchBalance(); // Update balance in cache

        Alert.alert(
          "Payment Successful!",
          `Your top-up of Rp ${formatAmountInput(
            amount
          )} has been completed successfully.`,
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("HomeScreen"),
            },
          ]
        );
      } else if (status === "failed") {
        Alert.alert(
          "Payment Failed",
          "Your payment could not be processed. Please try again.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    }
  }, [transactionData]);

  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState;

    // Check if redirected to success/finish URL
    if (url.includes("finish") || url.includes("success")) {
      setIsCheckingStatus(true);
      // Force check transaction status
      refetchTransaction();
    }
  };

  const handleManualStatusCheck = async () => {
    setIsCheckingStatus(true);
    try {
      await refetchTransaction();
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#FE7A3A", "#FF9A62"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <TouchableOpacity
            onPress={handleManualStatusCheck}
            style={styles.refreshButton}
            disabled={isCheckingStatus}
          >
            {isCheckingStatus ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.paymentInfo}>
          <Text style={styles.paymentAmount}>
            Rp {formatAmountInput(amount)}
          </Text>
          <Text style={styles.paymentMethod}>via {payment_method}</Text>
          <Text style={styles.transactionId}>ID: {transaction_id}</Text>
        </View>
      </LinearGradient>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: payment_url }}
          style={styles.webView}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FE7A3A" />
              <Text style={styles.loadingText}>Loading payment page...</Text>
            </View>
          )}
        />
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusIndicator}>
          <Ionicons
            name={
              transactionData?.checkTransactionStatus?.status === "success"
                ? "checkmark-circle"
                : transactionData?.checkTransactionStatus?.status === "failed"
                ? "close-circle"
                : "time"
            }
            size={20}
            color={
              transactionData?.checkTransactionStatus?.status === "success"
                ? "#10B981"
                : transactionData?.checkTransactionStatus?.status === "failed"
                ? "#EF4444"
                : "#F59E0B"
            }
          />
          <Text style={styles.statusText}>
            Status:{" "}
            {transactionData?.checkTransactionStatus?.status || "pending"}
          </Text>
        </View>

        <Text style={styles.statusNote}>
          Complete payment in the page above
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  refreshButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  paymentInfo: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 15,
  },
  paymentAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  paymentMethod: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 5,
  },
  transactionId: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.7,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
  },
  statusBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    textTransform: "capitalize",
  },
  statusNote: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
