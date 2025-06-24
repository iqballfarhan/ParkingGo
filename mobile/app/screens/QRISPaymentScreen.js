import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { gql, useMutation } from "@apollo/client";
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

const { width } = Dimensions.get("window");

export default function QRISPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { transaction_id, amount, qr_code, simulation } = route.params;

  const [simulatePayment, { loading: simulateLoading }] =
    useMutation(SIMULATE_PAYMENT);

  // Generate mock QRIS for simulation
  const mockQRIS =
    qr_code ||
    `00020101021126580014COM.MIDTRANS${transaction_id.slice(
      -8
    )}520454005303360540${amount
      .toString()
      .padStart(
        8,
        "0"
      )}5802ID5909PARKIRCPT6007Jakarta61051234562070703A01${Date.now()
      .toString()
      .slice(-8)}63044567`;

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
                `🎯 Starting QRIS payment simulation for ${transaction_id}`
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
                          "💰 QRIS payment simulation completed successfully"
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
              console.error("❌ QRIS simulate payment error:", error);
              Alert.alert("Error", `Simulasi gagal: ${error.message}`);
            }
          },
        },
      ]
    );
  };

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
          <Text style={styles.headerTitle}>QRIS Payment</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.paymentInfo}>
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
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>
            {simulation ? "QRIS Demo - Scan QR Code" : "Scan QR Code to Pay"}
          </Text>
          <Text style={styles.qrSubtitle}>
            {simulation
              ? "This is a demo QR code for testing purposes"
              : "Use any e-wallet or banking app to scan this QR code"}
          </Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={mockQRIS}
              size={width * 0.6}
              backgroundColor="white"
              color="black"
            />
          </View>

          {simulation && (
            <TouchableOpacity
              style={styles.simulateButton}
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
          )}

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              {simulation ? "Demo Instructions:" : "How to pay:"}
            </Text>

            {simulation ? (
              <>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>1.</Text>
                  <Text style={styles.instructionText}>
                    This QR code is for demonstration purposes only
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>2.</Text>
                  <Text style={styles.instructionText}>
                    Click "Simulate Payment Success" to complete the demo
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>3.</Text>
                  <Text style={styles.instructionText}>
                    Your balance will be updated automatically
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>1.</Text>
                  <Text style={styles.instructionText}>
                    Open your e-wallet (GoPay, OVO, DANA, etc.) or mobile
                    banking app
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>2.</Text>
                  <Text style={styles.instructionText}>
                    Find the QR Code scanner feature
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>3.</Text>
                  <Text style={styles.instructionText}>
                    Scan the QR code above
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>4.</Text>
                  <Text style={styles.instructionText}>
                    Confirm payment in your app
                  </Text>
                </View>
              </>
            )}
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
  paymentInfo: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 15,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
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
  qrSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 5,
  },
  qrSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  qrContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  simulateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  simulateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  instructionsContainer: {
    width: "100%",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FE7A3A",
    marginRight: 10,
    minWidth: 20,
  },
  instructionText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
    lineHeight: 20,
  },
});
