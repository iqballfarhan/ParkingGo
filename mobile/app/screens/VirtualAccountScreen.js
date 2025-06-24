import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Clipboard,
  Linking,
  ActivityIndicator,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useMutation, useQuery } from "@apollo/client";
import { formatAmountInput } from "../helpers/formatAmount";

const CONFIRM_PAYMENT = gql`
  mutation ConfirmPayment($transaction_id: String!) {
    confirmPayment(transaction_id: $transaction_id) {
      transaction_id
      status
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

const GET_TRANSACTION_DETAILS = gql`
  query CheckTransactionStatus($transaction_id: String!) {
    checkTransactionStatus(transaction_id: $transaction_id) {
      _id
      transaction_id
      amount
      payment_method
      status
      va_number
      bank
      qr_code_url
      createdAt
      updatedAt
      user {
        saldo
      }
    }
  }
`;

const GET_USER_BALANCE = gql`
  query Me {
    me {
      email
      name
      role
      saldo
    }
  }
`;

export default function VirtualAccountScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    transaction_id,
    amount,
    payment_method,
    bank: initialBank,
    va_number: initialVaNumber,
    simulation,
    payment_url,
  } = route.params;

  const [transactionData, setTransactionData] = useState({
    bank: initialBank,
    va_number: initialVaNumber,
  });
  const [isLoadingVA, setIsLoadingVA] = useState(!initialVaNumber);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("pending");
  const [pollingInterval, setPollingInterval] = useState(0);
  const [hasOpenedSandbox, setHasOpenedSandbox] = useState(false);

  const [confirmPayment, { loading: confirmLoading }] =
    useMutation(CONFIRM_PAYMENT);
  const [simulatePayment, { loading: simulateLoading }] = useMutation(
    SIMULATE_PAYMENT,
    {
      refetchQueries: [{ query: GET_USER_BALANCE }],
      awaitRefetchQueries: true,
    }
  );

  const { data: transactionDetails, refetch } = useQuery(
    GET_TRANSACTION_DETAILS,
    {
      variables: { transaction_id },
      pollInterval: pollingInterval,
      skip: !transaction_id,
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
      onCompleted: (data) => {
        console.log(
          "📊 Transaction query RAW response:",
          JSON.stringify(data, null, 2)
        );

        const transaction = data.checkTransactionStatus;
        if (transaction) {
          console.log(`🔄 Transaction data from server:`, {
            id: transaction.transaction_id,
            status: transaction.status,
            amount: transaction.amount,
            user_saldo: transaction.user?.saldo,
            va_number: transaction.va_number,
            bank: transaction.bank,
          });

          const newData = {
            bank: transaction.bank || initialBank,
            va_number: transaction.va_number || initialVaNumber,
          };

          console.log("🔄 Updated local transaction data:", newData);
          setTransactionData(newData);

          if (newData.va_number && newData.va_number !== "Generating...") {
            setIsLoadingVA(false);
          }

          // Update current status ONLY if different
          const newStatus = transaction.status;
          console.log(
            `📋 Status check: current=${currentStatus}, new=${newStatus}`
          );

          if (newStatus !== currentStatus) {
            console.log(
              `🔄 Status changed from ${currentStatus} to ${newStatus}`
            );
            setCurrentStatus(newStatus);
          }

          // 🚀 Enhanced success detection - trigger immediately when detected
          if (newStatus === "success" && !isPaymentSuccessful) {
            console.log("🎉 Payment success detected for the first time!");
            console.log(
              `💰 Updated balance from server: ${transaction.user?.saldo}`
            );

            // Immediately stop polling and set success state
            setIsPaymentSuccessful(true);
            setPollingInterval(0);
            setCurrentStatus("success");

            // Show success alert with updated balance - immediate trigger
            const newBalance = transaction.user?.saldo || 0;
            Alert.alert(
              "🎉 Payment Successful!",
              `Your top-up of Rp ${formatAmountInput(
                amount
              )} has been processed successfully!\n\nNew Balance: Rp ${formatAmountInput(
                newBalance
              )}`,
              [
                {
                  text: "Great!",
                  onPress: () => {
                    console.log(
                      "✅ Payment detection completed - navigating home"
                    );
                    navigation.navigate("HomeScreen");
                  },
                },
              ]
            );
          } else if (newStatus === "failed" && currentStatus !== "failed") {
            console.log("❌ Payment failure detected!");
            setCurrentStatus("failed");
            setPollingInterval(0);

            Alert.alert(
              "❌ Payment Failed",
              "Your payment could not be processed. Please try again.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    navigation.goBack();
                  },
                },
              ]
            );
          } else if (newStatus === "success" && isPaymentSuccessful) {
            console.log(
              "🔄 Payment already marked as successful, no action needed"
            );
          }
        }
      },
      onError: (error) => {
        console.error("❌ Transaction query error:", error);
      },
    }
  );

  // Enhanced focus effect - check transaction when returning from sandbox
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔍 Screen focused - checking if returned from sandbox");

      // If user has opened sandbox and screen is focused, check transaction immediately
      if (hasOpenedSandbox && currentStatus === "pending") {
        console.log(
          "🔄 User returned from sandbox - forcing transaction check"
        );
        setPollingInterval(0); // Stop current polling

        // Force immediate check
        setTimeout(async () => {
          try {
            const { data } = await refetch();
            if (data?.checkTransactionStatus?.status === "success") {
              console.log("✅ Success detected on return from sandbox!");
              // The onCompleted handler will take care of the rest
            } else {
              // Resume aggressive polling for a short time
              console.log(
                "⏳ Still pending after sandbox - resuming aggressive polling"
              );
              setPollingInterval(2000); // More frequent polling for 30 seconds

              // Fallback to normal polling after 30 seconds
              setTimeout(() => {
                if (currentStatus === "pending") {
                  console.log("🔄 Switching to normal polling interval");
                  setPollingInterval(5000);
                }
              }, 30000);
            }
          } catch (error) {
            console.error("❌ Error checking transaction on focus:", error);
            // Resume normal polling on error
            setPollingInterval(5000);
          }
        }, 1000);
      }
    }, [hasOpenedSandbox, currentStatus, refetch])
  );

  // App state change listener for detecting return from browser
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log(`📱 App state changed to: ${nextAppState}`);

      if (
        nextAppState === "active" &&
        hasOpenedSandbox &&
        currentStatus === "pending"
      ) {
        console.log(
          "🔄 App became active after sandbox - forcing immediate check"
        );

        // Force immediate transaction check when app becomes active
        setTimeout(async () => {
          try {
            console.log("🔍 Forcing refetch due to app state change");
            await refetch();
          } catch (error) {
            console.error("❌ Error refetching on app state change:", error);
          }
        }, 500);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [hasOpenedSandbox, currentStatus, refetch]);

  // Manual refresh function with balance update
  const handleRefreshStatus = async () => {
    try {
      console.log("🔄 Manual refresh triggered");
      setPollingInterval(0); // Stop polling during manual check

      const { data } = await refetch();

      if (data?.checkTransactionStatus?.status === "success") {
        console.log("✅ Manual refresh detected success");
        setIsPaymentSuccessful(true);
        setCurrentStatus("success");

        // Get updated balance
        const newBalance = data.checkTransactionStatus.user?.saldo || 0;

        Alert.alert(
          "🎉 Payment Confirmed!",
          `Your payment has been successfully processed!\n\nNew Balance: Rp ${formatAmountInput(
            newBalance
          )}`,
          [
            {
              text: "Continue",
              onPress: () => {
                console.log("✅ Manual check completed - navigating home");
                navigation.navigate("HomeScreen");
              },
            },
          ]
        );
      } else if (data?.checkTransactionStatus?.status === "failed") {
        console.log("❌ Manual refresh detected failure");
        setCurrentStatus("failed");
        setPollingInterval(0); // Stop polling

        Alert.alert(
          "❌ Payment Failed",
          "Your payment could not be processed. Please try again.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        // Resume polling if still pending
        if (data?.checkTransactionStatus?.status === "pending") {
          console.log("⏳ Still pending - resuming polling");
          setPollingInterval(5000);
        }
        Alert.alert(
          "Info",
          "Payment is still being processed. Please wait a moment."
        );
      }
    } catch (error) {
      console.error("❌ Manual refresh error:", error);
      Alert.alert("Error", "Failed to refresh status. Please try again.");
      // Resume polling on error
      if (!isPaymentSuccessful && currentStatus === "pending") {
        setPollingInterval(5000);
      }
    }
  };

  // Start smart polling when component mounts - prevent infinite loops
  useEffect(() => {
    console.log(
      `🔄 Polling effect - Success: ${isPaymentSuccessful}, Status: ${currentStatus}, Interval: ${pollingInterval}`
    );

    // Only start polling if not successful and status is pending and not already polling
    if (
      !isPaymentSuccessful &&
      currentStatus === "pending" &&
      pollingInterval === 0
    ) {
      console.log("🔄 Starting smart polling...");
      const initialInterval = hasOpenedSandbox ? 2000 : 5000; // More frequent if sandbox was opened
      setPollingInterval(initialInterval);
    } else if (
      isPaymentSuccessful ||
      currentStatus === "success" ||
      currentStatus === "failed"
    ) {
      console.log("🛑 Stopping polling - payment completed");
      setPollingInterval(0);
    }

    // Cleanup polling when component unmounts
    return () => {
      console.log("🧹 Component unmounting - stopping polling");
      setPollingInterval(0);
    };
  }, [isPaymentSuccessful, currentStatus, hasOpenedSandbox]);

  // Additional effect to handle immediate success/failure state
  useEffect(() => {
    if (
      (currentStatus === "success" || currentStatus === "failed") &&
      !isPaymentSuccessful &&
      currentStatus === "success"
    ) {
      console.log("🎉 Detected success status change - updating local state");
      setIsPaymentSuccessful(true);
      setPollingInterval(0);
    }
  }, [currentStatus, isPaymentSuccessful]);

  // Update local state when transaction details are received
  useEffect(() => {
    if (transactionDetails?.checkTransactionStatus) {
      const transaction = transactionDetails.checkTransactionStatus;
      const newData = {
        bank: transaction.bank || initialBank,
        va_number: transaction.va_number || initialVaNumber,
      };

      console.log("Effect: Updating transaction data:", newData);
      setTransactionData(newData);

      if (newData.va_number && newData.va_number !== "Generating...") {
        setIsLoadingVA(false);
      }
    }
  }, [transactionDetails, initialBank, initialVaNumber]);

  // Add fallback option to open Midtrans if VA number is not available
  const openMidtransPage = () => {
    if (payment_url) {
      Alert.alert(
        "Open Midtrans Page",
        "Open Midtrans page to get your Virtual Account number and complete payment.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Midtrans",
            onPress: () => {
              Linking.openURL(payment_url).catch(() => {
                Alert.alert("Error", "Could not open Midtrans page");
              });
            },
          },
        ]
      );
    } else {
      Alert.alert("Error", "No payment URL available");
    }
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert("Copied! ✅", `${label} copied to clipboard`);
  };

  // Get sandbox URL for testing
  const getSandboxURL = () => {
    switch (transactionData.bank) {
      case "BRI":
        return "https://simulator.sandbox.midtrans.com/bri/va/index";
      case "BCA":
        return "https://simulator.sandbox.midtrans.com/bca/va/index";
      case "MANDIRI":
        return "https://simulator.sandbox.midtrans.com/mandiri/va/index";
      case "BNI":
        return "https://simulator.sandbox.midtrans.com/bni/va/index";
      case "PERMATA":
        return "https://simulator.sandbox.midtrans.com/openapi/va/index?bank=permata";
      default:
        return "https://simulator.sandbox.midtrans.com/";
    }
  };

  const openSandbox = () => {
    const sandboxURL = getSandboxURL();
    Alert.alert(
      "Open Sandbox Simulator",
      `This will open ${transactionData.bank} Virtual Account simulator in your browser for testing payment.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open App",
          onPress: () => {
            console.log("🌐 Opening sandbox - setting flag");
            setHasOpenedSandbox(true); // Set flag when sandbox is opened

            Linking.openURL(sandboxURL).catch(() => {
              Alert.alert("Error", "Could not open simulator URL");
            });
          },
        },
      ]
    );
  };

  // Get bank-specific instructions
  const getBankInstructions = () => {
    const bankName = transactionData.bank || "BANK";
    const vaNumber = transactionData.va_number || "Loading...";

    switch (bankName) {
      case "BRI":
        return {
          appName: "BRImo",
          color: "#003d7a",
          steps: [
            "Open BRImo app and login with your credentials",
            'Select "Transfer" menu from home screen',
            'Choose "Virtual Account BRI"',
            `Enter VA number: ${vaNumber}`,
            `Verify amount: Rp ${formatAmountInput(amount)}`,
            "Review transfer details carefully",
            "Enter your PIN to authorize transfer",
            "Save transfer receipt for your records",
          ],
        };
      case "BCA":
        return {
          appName: "BCA mobile",
          color: "#003d79",
          steps: [
            "Open BCA mobile app and login",
            'Tap "m-Transfer" from main menu',
            'Select "BCA Virtual Account"',
            `Enter VA number: ${vaNumber}`,
            `Confirm amount: Rp ${formatAmountInput(amount)}`,
            "Check all details before proceeding",
            "Enter your 6-digit PIN",
            "Keep transaction receipt safe",
          ],
        };
      case "MANDIRI":
        return {
          appName: "Livin by Mandiri",
          color: "#ff8a00",
          steps: [
            "Open Livin by Mandiri app and login",
            'Navigate to "Transfer" menu',
            'Select "To Mandiri Virtual Account"',
            `Input VA number: ${vaNumber}`,
            `Verify amount: Rp ${formatAmountInput(amount)}`,
            "Double-check transfer information",
            "Enter your MPIN to complete",
            "Screenshot receipt for confirmation",
          ],
        };
      case "BNI":
        return {
          appName: "BNI Mobile Banking",
          color: "#ed8b00",
          steps: [
            "Open BNI Mobile Banking app",
            "Login with your user ID and password",
            'Go to "Transfer" menu',
            'Select "Virtual Account"',
            `Enter VA number: ${vaNumber}`,
            `Confirm amount: Rp ${formatAmountInput(amount)}`,
            "Enter transaction PIN",
            "Save confirmation receipt",
          ],
        };
      case "PERMATA":
        return {
          appName: "PermataMobile X",
          color: "#00a651",
          steps: [
            "Open PermataMobile X app",
            "Login with your credentials",
            'Choose "Transfer" from menu',
            'Select "Virtual Account"',
            `Input VA number: ${vaNumber}`,
            `Verify amount: Rp ${formatAmountInput(amount)}`,
            "Enter your mobile PIN",
            "Keep transaction proof",
          ],
        };
      default:
        return {
          appName: "Mobile Banking",
          color: "#6B7280",
          steps: [
            `Open your ${bankName} mobile banking app`,
            "Login to your account",
            "Find Transfer or Virtual Account menu",
            `Enter VA number: ${vaNumber}`,
            `Enter amount: Rp ${formatAmountInput(amount)}`,
            "Complete the transfer process",
            "Save transaction receipt",
          ],
        };
    }
  };

  const bankInfo = getBankInstructions();
  const displayBank = transactionData.bank || "BANK";
  const displayVaNumber = transactionData.va_number || "Generating...";

  // Get bank theme colors
  const getBankTheme = () => {
    switch (displayBank) {
      case "BRI":
        return {
          primary: "#003d7a",
          secondary: "#4a90e2",
          light: "#e8f3ff",
          gradient: ["#003d7a", "#4a90e2"],
        };
      case "BCA":
        return {
          primary: "#003d79",
          secondary: "#1e5ea8",
          light: "#e6f3ff",
          gradient: ["#003d79", "#1e5ea8"],
        };
      case "MANDIRI":
        return {
          primary: "#ff8a00",
          secondary: "#ffb347",
          light: "#fff3e6",
          gradient: ["#ff8a00", "#ffb347"],
        };
      case "BNI":
        return {
          primary: "#ed8b00",
          secondary: "#ffa726",
          light: "#fff8e1",
          gradient: ["#ed8b00", "#ffa726"],
        };
      case "PERMATA":
        return {
          primary: "#00a651",
          secondary: "#4caf50",
          light: "#e8f5e8",
          gradient: ["#00a651", "#4caf50"],
        };
      default:
        return {
          primary: "#FE7A3A",
          secondary: "#FF9A62",
          light: "#FFF5F0",
          gradient: ["#FE7A3A", "#FF9A62"],
        };
    }
  };

  const bankTheme = getBankTheme();

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
          text: "Payment Successful",
          onPress: async () => {
            try {
              console.log(
                `🎯 Starting VA payment simulation for ${transaction_id}`
              );
              setPollingInterval(0); // Stop polling during simulation

              const result = await simulatePayment({
                variables: { transaction_id },
              });

              if (result.data?.simulatePaymentSuccess?.success) {
                const { message, user } = result.data.simulatePaymentSuccess;

                // Mark as successful and stop polling
                setIsPaymentSuccessful(true);
                setCurrentStatus("success");

                Alert.alert(
                  "🎉 Pembayaran Berhasil!",
                  `${message}\n\nSaldo baru: Rp ${formatAmountInput(
                    user.saldo
                  )}\n\n✅ Saldo telah diperbarui`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        console.log(
                          "💰 Manual VA payment simulation completed successfully"
                        );
                        navigation.navigate("HomeScreen");
                      },
                    },
                  ]
                );
              } else {
                Alert.alert("Error", "Gagal memproses simulasi pembayaran");
                // Resume polling on error
                if (currentStatus === "pending") {
                  setPollingInterval(5000);
                }
              }
            } catch (error) {
              console.error("❌ VA simulate payment error:", error);
              Alert.alert("Error", `Simulasi gagal: ${error.message}`);
              // Resume polling on error
              if (currentStatus === "pending") {
                setPollingInterval(5000);
              }
            }
          },
        },
      ]
    );
  };

  const handleManualConfirm = () => {
    if (simulation) {
      handleSimulatePayment();
    } else {
      // Real payment confirmation
      Alert.alert(
        "Konfirmasi Pembayaran",
        "Apakah Anda sudah menyelesaikan transfer? Ini akan menandai pembayaran sebagai berhasil.",
        [
          {
            text: "Belum",
            style: "cancel",
          },
          {
            text: "Ya, Sudah Transfer",
            onPress: handleSimulatePayment, // Use simulation for now
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={bankTheme.gradient}
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
          <Text style={styles.headerTitle}>{displayBank} Virtual Account</Text>
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
        <View style={styles.vaSection}>
          {simulation ? (
            <View
              style={[
                styles.simulationContainer,
                { backgroundColor: bankTheme.light },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={48}
                color={bankTheme.primary}
              />
              <Text
                style={[styles.simulationTitle, { color: bankTheme.primary }]}
              >
                Demo Mode
              </Text>
              <Text
                style={[styles.simulationText, { color: bankTheme.primary }]}
              >
                This is a simulation. Real {displayBank} Virtual Account
                requires merchant approval.
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.vaTitle, { color: bankTheme.primary }]}>
                Virtual Account Payment
              </Text>
              <Text style={styles.vaSubtitle}>
                Transfer via {bankInfo.appName} or test with sandbox simulator
              </Text>

              {/* Bank Logo/Name Section */}
              <View
                style={[
                  styles.bankHeader,
                  {
                    backgroundColor: bankTheme.light,
                    borderColor: bankTheme.primary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.bankLogo,
                    { backgroundColor: bankTheme.primary },
                  ]}
                >
                  <Text style={styles.bankLogoText}>{displayBank}</Text>
                </View>
                <View style={styles.bankInfo}>
                  <Text style={[styles.bankName, { color: bankTheme.primary }]}>
                    {displayBank}
                  </Text>
                  <Text style={styles.bankSubtitle}>Virtual Account</Text>
                </View>
              </View>

              {/* VA Number Section */}
              <View
                style={[styles.vaContainer, { borderColor: bankTheme.primary }]}
              >
                <View style={styles.vaHeader}>
                  <Text style={[styles.vaLabel, { color: bankTheme.primary }]}>
                    {displayBank} Virtual Account Number
                  </Text>
                  {!isLoadingVA && displayVaNumber !== "Generating..." && (
                    <TouchableOpacity
                      style={[
                        styles.copyButton,
                        { backgroundColor: bankTheme.light },
                      ]}
                      onPress={() =>
                        copyToClipboard(displayVaNumber, "VA Number")
                      }
                    >
                      <Ionicons
                        name="copy-outline"
                        size={20}
                        color={bankTheme.primary}
                      />
                      <Text
                        style={[styles.copyText, { color: bankTheme.primary }]}
                      >
                        Copy
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isLoadingVA || displayVaNumber === "Generating..." ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={bankTheme.primary} />
                    <Text style={styles.loadingText}>
                      Generating VA number...
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.vaNumber, { color: bankTheme.primary }]}>
                    {displayVaNumber}
                  </Text>
                )}
              </View>

              {/* Amount Section */}
              <View
                style={[
                  styles.amountContainer,
                  { borderColor: bankTheme.primary },
                ]}
              >
                <View style={styles.amountHeader}>
                  <Text
                    style={[styles.amountLabel, { color: bankTheme.primary }]}
                  >
                    Transfer Amount
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.copyButton,
                      { backgroundColor: bankTheme.light },
                    ]}
                    onPress={() => copyToClipboard(amount.toString(), "Amount")}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={20}
                      color={bankTheme.primary}
                    />
                    <Text
                      style={[styles.copyText, { color: bankTheme.primary }]}
                    >
                      Copy
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={[styles.amountNumber, { color: bankTheme.primary }]}
                >
                  Rp {formatAmountInput(amount)}
                </Text>
              </View>

              {/* Show sandbox and instructions only when VA number is ready */}
              {!isLoadingVA && displayVaNumber !== "Generating..." && (
                <>
                  {/* Sandbox Testing Section */}
                  <View
                    style={[
                      styles.testingContainer,
                      {
                        backgroundColor: bankTheme.light,
                        borderColor: bankTheme.secondary,
                      },
                    ]}
                  >
                    <View style={styles.testingHeader}>
                      <Ionicons
                        name="flask-outline"
                        size={24}
                        color={bankTheme.primary}
                      />
                      <Text
                        style={[
                          styles.testingTitle,
                          { color: bankTheme.primary },
                        ]}
                      >
                        Test Payment (Sandbox)
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.testingDescription,
                        { color: bankTheme.primary },
                      ]}
                    >
                      For testing purposes, you can simulate the payment using
                      Midtrans sandbox
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.sandboxButton,
                        { backgroundColor: bankTheme.primary },
                      ]}
                      onPress={openSandbox}
                    >
                      <Ionicons
                        name="globe-outline"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.sandboxButtonText}>
                        Open {displayBank} Sandbox Simulator
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Payment Instructions */}
                  <View style={styles.instructionsContainer}>
                    <Text
                      style={[
                        styles.instructionsTitle,
                        { color: bankTheme.primary },
                      ]}
                    >
                      📱 How to Pay via {bankInfo.appName}
                    </Text>
                    {bankInfo.steps.map((step, index) => (
                      <View key={index} style={styles.instructionItem}>
                        <View
                          style={[
                            styles.stepNumber,
                            { backgroundColor: bankTheme.primary },
                          ]}
                        >
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.instructionText}>{step}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Important Notes */}
                  <View
                    style={[
                      styles.notesContainer,
                      {
                        backgroundColor: bankTheme.light,
                        borderLeftColor: bankTheme.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.notesTitle, { color: bankTheme.primary }]}
                    >
                      ⚠️ Important Notes
                    </Text>
                    <View style={styles.noteItem}>
                      <Text
                        style={[styles.noteText, { color: bankTheme.primary }]}
                      >
                        • Transfer amount must be exactly Rp{" "}
                        {formatAmountInput(amount)}
                      </Text>
                    </View>
                    <View style={styles.noteItem}>
                      <Text
                        style={[styles.noteText, { color: bankTheme.primary }]}
                      >
                        • VA number is valid for 24 hours from creation
                      </Text>
                    </View>
                    <View style={styles.noteItem}>
                      <Text
                        style={[styles.noteText, { color: bankTheme.primary }]}
                      >
                        • Payment confirmation is automatic (usually within 5
                        minutes)
                      </Text>
                    </View>
                    <View style={styles.noteItem}>
                      <Text
                        style={[styles.noteText, { color: bankTheme.primary }]}
                      >
                        • Keep your transaction receipt for reference
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {/* Show fallback option if VA number is not generating */}
              {(isLoadingVA || displayVaNumber === "Generating...") &&
                payment_url && (
                  <View
                    style={[
                      styles.fallbackContainer,
                      {
                        backgroundColor: bankTheme.light,
                        borderColor: bankTheme.secondary,
                      },
                    ]}
                  >
                    <Ionicons
                      name="information-circle"
                      size={24}
                      color={bankTheme.primary}
                    />
                    <Text
                      style={[
                        styles.fallbackTitle,
                        { color: bankTheme.primary },
                      ]}
                    >
                      Alternative Option
                    </Text>
                    <Text
                      style={[
                        styles.fallbackText,
                        { color: bankTheme.primary },
                      ]}
                    >
                      If VA number is taking too long to generate, you can open
                      Midtrans page directly.
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.fallbackButton,
                        { backgroundColor: bankTheme.primary },
                      ]}
                      onPress={openMidtransPage}
                    >
                      <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.fallbackButtonText}>
                        Open Midtrans Page
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
            </>
          )}

          {/* Payment Status Indicator */}
          {currentStatus === "pending" && !isPaymentSuccessful && (
            <View
              style={[
                styles.statusContainer,
                { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" },
              ]}
            >
              <View style={styles.statusHeader}>
                <Ionicons name="time-outline" size={24} color="#D97706" />
                <Text style={[styles.statusTitle, { color: "#D97706" }]}>
                  Waiting for Payment
                </Text>
              </View>
              <Text style={[styles.statusText, { color: "#92400E" }]}>
                {pollingInterval > 0
                  ? "Automatically checking payment status every 5 seconds..."
                  : "Click 'Check Now' to verify your payment status."}
              </Text>

              {pollingInterval > 0 && (
                <View style={styles.pollingIndicator}>
                  <ActivityIndicator size="small" color="#D97706" />
                  <Text style={[styles.pollingText, { color: "#D97706" }]}>
                    Checking payment status...
                  </Text>
                </View>
              )}

              {/* Manual Refresh Button */}
              <TouchableOpacity
                style={[styles.refreshButton, { backgroundColor: "#F59E0B" }]}
                onPress={handleRefreshStatus}
              >
                <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                <Text style={styles.refreshButtonText}>Check Now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Payment Success Indicator */}
          {(isPaymentSuccessful || currentStatus === "success") && (
            <View
              style={[
                styles.statusContainer,
                { backgroundColor: "#D1FAE5", borderColor: "#10B981" },
              ]}
            >
              <View style={styles.statusHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#059669" />
                <Text style={[styles.statusTitle, { color: "#059669" }]}>
                  Payment Successful!
                </Text>
              </View>
              <Text style={[styles.statusText, { color: "#065F46" }]}>
                Your payment has been confirmed and your balance has been
                updated.
              </Text>
            </View>
          )}

          {/* Debug Info (remove in production) */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                Status: {currentStatus} | Success:{" "}
                {isPaymentSuccessful.toString()} | Polling: {pollingInterval}ms
              </Text>
              <Text style={styles.debugText}>
                Transaction ID: {transaction_id}
              </Text>
            </View>
          )}

          {/* Confirm Payment Button */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              {
                backgroundColor: simulation
                  ? bankTheme.secondary
                  : isPaymentSuccessful || currentStatus === "success"
                  ? "#10B981"
                  : bankTheme.primary,
              },
              (isLoadingVA ||
                displayVaNumber === "Generating..." ||
                isPaymentSuccessful ||
                currentStatus === "success") &&
                styles.confirmButtonDisabled,
            ]}
            onPress={handleManualConfirm}
            disabled={
              simulateLoading ||
              isLoadingVA ||
              displayVaNumber === "Generating..." ||
              isPaymentSuccessful ||
              currentStatus === "success"
            }
          >
            <Ionicons
              name={
                isPaymentSuccessful || currentStatus === "success"
                  ? "checkmark-circle"
                  : simulation
                  ? "flash"
                  : "checkmark-circle"
              }
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.confirmButtonText}>
              {simulateLoading
                ? "Processing..."
                : isLoadingVA || displayVaNumber === "Generating..."
                ? "Waiting for VA Number..."
                : isPaymentSuccessful || currentStatus === "success"
                ? "Payment Completed ✓"
                : simulation
                ? "Simulate Payment Success"
                : "I Have Completed Transfer"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Having trouble? Contact our support team for assistance
          </Text>
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
  vaSection: {
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
  vaTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 5,
    textAlign: "center",
  },
  vaSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
  },
  bankLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  bankLogoText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  bankSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  vaContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 2,
  },
  vaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vaLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#FE7A3A",
    fontWeight: "600",
  },
  vaNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: 1,
  },
  amountContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
  },
  amountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  amountNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  testingContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  testingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  testingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B46C1",
    marginLeft: 8,
  },
  testingDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 15,
    lineHeight: 18,
  },
  sandboxButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sandboxButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  instructionText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
    lineHeight: 20,
  },
  notesContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 10,
  },
  noteItem: {
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },

  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  helpText: {
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 20,
    fontStyle: "italic",
  },
  simulationContainer: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#EBF8FF",
    borderRadius: 15,
    marginBottom: 20,
  },
  simulationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E40AF",
    marginTop: 15,
    marginBottom: 10,
  },
  simulationText: {
    fontSize: 14,
    color: "#1E40AF",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 10,
  },
  simulationInstructions: {
    fontSize: 13,
    color: "#3B82F6",
    textAlign: "center",
    fontWeight: "600",
  },
  simulationButton: {
    backgroundColor: "#3B82F6",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 10,
    fontStyle: "italic",
  },
  confirmButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  fallbackContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E40AF",
    marginTop: 8,
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: "#3B82F6",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 20,
  },
  fallbackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  fallbackButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  statusContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  pollingIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  pollingText: {
    fontSize: 12,
    marginLeft: 8,
    fontStyle: "italic",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  debugContainer: {
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  debugText: {
    fontSize: 12,
    color: "#374151",
    fontFamily: "monospace",
  },
});
