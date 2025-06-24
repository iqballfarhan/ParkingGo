import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useMutation } from "@apollo/client";
import * as Linking from "expo-linking";
import { formatAmountInput } from "../helpers/formatAmount";

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

export default function EWalletPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    transaction_id,
    amount,
    payment_method,
    payment_url,
    simulation = true,
  } = route.params;

  const [simulatePayment, { loading: simulateLoading }] =
    useMutation(SIMULATE_PAYMENT);
  const [isProcessing, setIsProcessing] = useState(false);

  const getWalletInfo = () => {
    switch (payment_method) {
      case "GoPay":
        return {
          color: "#00AA5B",
          icon: "card",
          appName: "Gojek",
          steps: [
            "Open Gojek app",
            "Scan QR code or use payment link",
            "Confirm payment with PIN",
            "Payment will be processed automatically",
          ],
        };
      case "DANA":
        return {
          color: "#118EEA",
          icon: "wallet",
          appName: "DANA",
          steps: [
            "Open DANA app",
            "Scan QR code or tap payment link",
            "Enter PIN to confirm",
            "Wait for payment confirmation",
          ],
        };
      case "OVO":
        return {
          color: "#4C3494",
          icon: "card-outline",
          appName: "OVO",
          steps: [
            "Open OVO app",
            "Scan QR code or use payment link",
            "Confirm with security PIN",
            "Payment will be completed automatically",
          ],
        };
      default:
        return {
          color: "#6B7280",
          icon: "card",
          appName: "E-Wallet",
          steps: [
            "Open your e-wallet app",
            "Complete the payment",
            "Wait for confirmation",
          ],
        };
    }
  };

  const walletInfo = getWalletInfo();

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
                `🎯 Starting ${payment_method} payment simulation for ${transaction_id}`
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
                          `💰 ${payment_method} payment simulation completed successfully`
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
              console.error(
                `❌ ${payment_method} simulate payment error:`,
                error
              );
              Alert.alert("Error", `Simulasi gagal: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handleOpenMidtransApp = async () => {
    if (!payment_url) {
      Alert.alert("Error", "Midtrans payment URL not available");
      return;
    }

    Alert.alert(
      `Open Midtrans Payment`,
      `You will be redirected to Midtrans payment page to complete ${payment_method} payment.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: `Open Midtrans`,
          onPress: async () => {
            try {
              setIsProcessing(true);
              const supported = await Linking.canOpenURL(payment_url);
              if (supported) {
                await Linking.openURL(payment_url);
                // Navigate to waiting screen after opening Midtrans
                setTimeout(() => {
                  setIsProcessing(false);
                  navigation.navigate("PaymentWaitingScreen", {
                    transaction_id,
                    amount,
                    payment_method,
                    simulation: false,
                  });
                }, 1000);
              } else {
                setIsProcessing(false);
                Alert.alert("Error", `Cannot open Midtrans payment page`);
              }
            } catch (error) {
              setIsProcessing(false);
              console.error("Error opening Midtrans payment:", error);
              Alert.alert("Error", `Failed to open Midtrans payment page`);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[walletInfo.color, walletInfo.color + "CC"]}
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
          <Text style={styles.headerTitle}>{payment_method} Payment</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.paymentInfo}>
          <Ionicons name={walletInfo.icon} size={48} color="#FFFFFF" />
          <Text style={styles.paymentAmount}>
            Rp {formatAmountInput(amount)}
          </Text>
          <Text style={styles.transactionId}>ID: {transaction_id}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.paymentSection}>
          <View style={styles.simulationContainer}>
            <Ionicons
              name="phone-portrait"
              size={48}
              color={walletInfo.color}
            />
            <Text style={styles.simulationTitle}>
              {payment_method} Payment Simulation
            </Text>
            <Text style={styles.simulationText}>
              Choose how you want to complete this payment:
            </Text>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              {payment_method} Payment Steps:
            </Text>
            {walletInfo.steps.map((step, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text
                  style={[
                    styles.instructionNumber,
                    { color: walletInfo.color },
                  ]}
                >
                  {index + 1}.
                </Text>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.simulateButton,
                { backgroundColor: walletInfo.color },
              ]}
              onPress={handleSimulatePayment}
              disabled={simulateLoading}
            >
              <Ionicons name="flash" size={24} color="#FFFFFF" />
              <Text style={styles.simulateButtonText}>
                {simulateLoading
                  ? "Memproses..."
                  : "🎯 Simulasi Pembayaran Berhasil"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.orText}>atau</Text>

            <TouchableOpacity
              style={[styles.realButton, { borderColor: walletInfo.color }]}
              onPress={handleOpenMidtransApp}
              disabled={isProcessing || !payment_url}
            >
              {isProcessing ? (
                <ActivityIndicator color={walletInfo.color} size="small" />
              ) : (
                <Ionicons
                  name="open-outline"
                  size={24}
                  color={walletInfo.color}
                />
              )}
              <Text
                style={[styles.realButtonText, { color: walletInfo.color }]}
              >
                {isProcessing
                  ? "Opening Midtrans..."
                  : `Buka Midtrans Payment (Real)`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: 20,
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
  paymentInfo: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 20,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 10,
    marginBottom: 5,
  },
  transactionId: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paymentSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  simulationContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    marginBottom: 20,
  },
  simulationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 15,
    marginBottom: 8,
    textAlign: "center",
  },
  simulationText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  instructionsContainer: {
    marginBottom: 25,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 10,
    minWidth: 20,
  },
  instructionText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 15,
  },
  simulateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  simulateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  orText: {
    textAlign: "center",
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  realButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
  },
  realButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});
