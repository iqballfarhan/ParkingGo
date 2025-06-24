import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
} from "react-native";
import { gql, useMutation } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { GOOGLE_CLIENT_ID, ANDROID_CLIENT_ID, IOS_CLIENT_ID } from "@env";
import { useAuth } from "../context/authContext";

WebBrowser.maybeCompleteAuthSession();

const LOGIN_USER = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        _id
        email
        name
        role
        saldo
      }
    }
  }
`;

const GOOGLE_LOGIN = gql`
  mutation GoogleAuth($token: String!) {
    googleAuth(token: $token) {
      token
      user {
        email
        name
        role
        saldo
      }
    }
  }
`;

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { setIsSignIn, setRole, setUser } = useAuth();
  const [loginGoogle] = useMutation(GOOGLE_LOGIN);
  const [loginUser] = useMutation(LOGIN_USER);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      GOOGLE_CLIENT_ID ||
      "132929957462-uedvdulqobgt6udfef3r2giqf4m4bs04.apps.googleusercontent.com",
    iosClientId:
      IOS_CLIENT_ID ||
      "132929957462-pkc9dom1jafpdsdb63bsv46gb46g882e.apps.googleusercontent.com",
    androidClientId:
      ANDROID_CLIENT_ID ||
      "132929957462-rmqcee7th3kpa2btiln909qk21b66gbo.apps.googleusercontent.com",
    webClientId:
      GOOGLE_CLIENT_ID ||
      "132929957462-uedvdulqobgt6udfef3r2giqf4m4bs04.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      useProxy: true,
      scheme: "app",
    }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      handleGoogleResponse(authentication.access_token);
    } else if (response?.type === "error") {
      Alert.alert(
        "Authentication Error",
        "Error connecting to Google. Please try again."
      );
    }
  }, [response]);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      return { email: "Email is required" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { email: "Please enter a valid email address" };
    }

    if (!password.trim()) {
      return { password: "Password is required" };
    }

    return newErrors;
  };

  const handleLogin = async () => {
    setErrors({});
    setIsLoading(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await loginUser({
        variables: {
          input: {
            email,
            password,
          },
        },
      });
      await SecureStore.setItemAsync("access_token", data.login.token);
      await SecureStore.setItemAsync("user_role", data.login.user.role);
      await SecureStore.setItemAsync(
        "user_data",
        JSON.stringify(data.login.user)
      );
      setRole(data.login.user.role);
      setUser(data.login.user);
      setIsSignIn(true);

      setEmail("");
      setPassword("");
      setShowPassword(false);
      setErrors({});

      Alert.alert("Success", "Login successful!", [
        {
          text: "OK",
        },
      ]);
    } catch (err) {
      const newErrors = {};
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        const errorMessage = err.graphQLErrors[0].message.toLowerCase();
        if (errorMessage.includes("email")) {
          newErrors.email = err.graphQLErrors[0].message;
        } else if (errorMessage.includes("password")) {
          newErrors.password = err.graphQLErrors[0].message;
        } else {
          newErrors.general = err.graphQLErrors[0].message;
        }
      } else {
        newErrors.general =
          err.message || "An error occurred. Please try again.";
      }

      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleResponse = async (accessToken) => {
    setIsLoading(true);
    setErrors({});

    try {
      const { data } = await loginGoogle({
        variables: {
          token: accessToken,
        },
      });

      await SecureStore.setItemAsync("access_token", data.googleAuth.token);

      Alert.alert("Success", "Google login successful!", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("HomeScreen");
          },
        },
      ]);
    } catch (err) {
      console.error("Google login error:", err);

      const newErrors = {};
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        newErrors.general = err.graphQLErrors[0].message;
      } else {
        newErrors.general =
          "Failed to authenticate with Google. Please try again.";
      }

      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Environment variables check:");
    console.log(
      "GOOGLE_CLIENT_ID:",
      GOOGLE_CLIENT_ID ? "✓ Found" : "✗ Missing"
    );
    console.log("IOS_CLIENT_ID:", IOS_CLIENT_ID ? "✓ Found" : "✗ Missing");
    console.log(
      "ANDROID_CLIENT_ID:",
      ANDROID_CLIENT_ID ? "✓ Found" : "✗ Missing"
    );
    console.log("Redirect URI:", makeRedirectUri({ scheme: "parkircepat" }));
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync({
        useProxy: true,
      });

      if (result.type === "success") {
        const { authentication } = result;
        await handleGoogleResponse(authentication.accessToken);
      } else if (result.type === "error") {
        console.error("Google auth error:", result.error);
        Alert.alert("Error", result.error?.message || "Google sign in failed");
      }
    } catch (error) {
      console.error("Google Sign In Error:", error);
      Alert.alert("Error", error.message || "Failed to connect to Google");
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Forgot Password",
      "Password reset feature will be implemented soon"
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
        enabled
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your parking journey
          </Text>

          {/* General Error */}
          {errors.general ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            {errors.email ? (
              <Text style={styles.fieldErrorText}>{errors.email}</Text>
            ) : null}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={22}
                color="#4B5EAA"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: null }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8A94A6"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            {errors.password ? (
              <Text style={styles.fieldErrorText}>{errors.password}</Text>
            ) : null}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color="#4B5EAA"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: null }));
                }}
                secureTextEntry={!showPassword}
                placeholderTextColor="#8A94A6"
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#4B5EAA"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoogleLogin}
            style={styles.googleButton}
            disabled={isLoading}
          >
            <Ionicons
              name="logo-google"
              size={22}
              color="#DB4437"
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>
              {isLoading ? "Signing in..." : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("RegisterScreen")}
            >
              <Text style={styles.loginLink}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 100,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    justifyContent: "center",
  },
  logo: {
    width: 130,
    height: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 40,
    textAlign: "center",
    fontWeight: "400",
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: "#1E3A8A",
    fontSize: 16,
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: "#D4A017",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 56,
    marginTop: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  loginText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "400",
  },
  loginLink: {
    color: "#D4A017",
    fontWeight: "600",
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#F87171",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  fieldErrorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "600",
  },
});
