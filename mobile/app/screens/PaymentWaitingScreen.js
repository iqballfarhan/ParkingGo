import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
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

const SIMULATE_PAYMENT = gql`
  mutation SimulatePaymentSuccess($transaction_id: String!) {
    simulatePaymentSuccess(transaction_id: $transaction_id) {
      success
      message
      transaction {
        transaction_id
        status
      }
      user {
        saldo
      }
      webhook_data
    }
  }
`;

export default function PaymentWaitingScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { transaction_id, amount, payment_method } = route.params;

  const { data: transactionData, refetch: refetchTransaction } = useQuery(
    CHECK_TRANSACTION_STATUS,
    {
      variables: { transaction_id },
      pollInterval: 5000, // Poll every 5 seconds
      errorPolicy: "all",
    }
  );

  const [simulatePayment, { loading: simulateLoading }] =
    useMutation(SIMULATE_PAYMENT);

  // Monitor transaction status
  useEffect(() => {
    if (transactionData?.checkTransactionStatus) {
      const status = transactionData.checkTransactionStatus.status;

      if (status === "success") {
        Alert.alert(
          "Payment Successful! 🎉",
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

  const handleSimulatePayment = async () => {
    Alert.alert(
      "Simulasi Pembayaran",
      `Simulasikan pembayaran berhasil untuk Rp ${formatAmountInput(amount)}?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Simulasi Berhasil",
          onPress: async () => {
            try {
              console.log(
                `🎯 Starting e-wallet payment simulation for ${transaction_id}`
              );

              const result = await simulatePayment({
                variables: { transaction_id },
              });

              if (result.data?.simulatePaymentSuccess?.success) {
                const { message, user } = result.data.simulatePaymentSuccess;

                Alert.alert(
                  "🎉 Pembayaran Berhasil!",
                  `${message}\n\nSaldo baru: Rp ${formatAmountInput(
                    user.saldo
                  )}\n\n✅ Webhook Midtrans telah diproses`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        console.log(
                          "💰 E-wallet payment simulation completed successfully"
                        );
                        navigation.navigate("HomeScreen");
                      },
                    },
                  ]
                );
              } else {
                Alert.alert("Error", "Gagal memproses simulasi pembayaran");
              }
            } catch (error) {
              console.error("❌ E-wallet simulate payment error:", error);
              Alert.alert("Error", `Simulasi gagal: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const currentStatus =
    transactionData?.checkTransactionStatus?.status || "pending";

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Payment Status</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#FE7A3A" />
          <Text style={styles.statusTitle}>Waiting for Payment</Text>
          <Text style={styles.statusSubtitle}>
            Complete your payment in the {payment_method} app
          </Text>

          <View style={styles.paymentDetails}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>
              Rp {formatAmountInput(amount)}
            </Text>

            <Text style={styles.detailLabel}>Transaction ID:</Text>
            <Text style={styles.detailValue}>{transaction_id}</Text>

            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, styles.statusValue]}>
              {currentStatus.toUpperCase()}
            </Text>
          </View>

          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>Instructions:</Text>
            <Text style={styles.instructionText}>
              1. Complete payment in your {payment_method} app
            </Text>
            <Text style={styles.instructionText}>
              2. This screen will automatically update when payment is confirmed
            </Text>
            <Text style={styles.instructionText}>
              3. Your balance will be updated immediately after confirmation
            </Text>
            <Text style={styles.instructionText}>
              4. Or use simulation button below for demo purposes
            </Text>
          </View>

          <TouchableOpacity
            style={styles.checkButton}
            onPress={() => refetchTransaction()}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.checkButtonText}>Check Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.simulateButton}
            onPress={handleSimulatePayment}
            disabled={simulateLoading}
          >
            <Ionicons name="flash" size={20} color="#FFFFFF" />
            <Text style={styles.simulateButtonText}>
              {simulateLoading
                ? "Memproses..."
                : "🎯 Simulasi Pembayaran Berhasil"}
            </Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  statusContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    marginTop: 20,
    marginBottom: 10,
  },
  statusSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  paymentDetails: {
    width: "100%",
    marginBottom: 30,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 10,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 2,
  },
  statusValue: {
    color: "#F59E0B",
  },
  instructionContainer: {
    width: "100%",
    marginBottom: 30,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 5,
    lineHeight: 20,
  },
  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FE7A3A",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  checkButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  simulateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  simulateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
