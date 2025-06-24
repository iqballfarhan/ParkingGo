import { useState, useRef } from "react";
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
  StatusBar,
  SafeAreaView,
  Alert,
} from "react-native";
import { gql, useMutation } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const ADD_USER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
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

export default function RegisterScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveUser, { data, loading, error }] = useMutation(ADD_USER);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "",
  });

  const handleChange = (value, key) => {
    setFormData({
      ...formData,
      [key]: value,
    });
  };

  const handleSignUp = async () => {
    setErrors({});
    setIsLoading(true);

    try {
      await saveUser({
        variables: {
          input: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
          },
        },
      });

      Alert.alert("Success", "Account created successfully!");
      setFormData({ email: "", password: "", name: "", role: "" });
      setTimeout(() => {
        navigation.navigate("LoginScreen");
      }, 1500);
    } catch (err) {
      const newErrors = {};
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        const errorMessage = err.graphQLErrors[0].message.toLowerCase();
        if (errorMessage.includes("name")) {
          newErrors.name = err.graphQLErrors[0].message;
        } else if (errorMessage.includes("email")) {
          newErrors.email = err.graphQLErrors[0].message;
        } else if (errorMessage.includes("password")) {
          newErrors.password = err.graphQLErrors[0].message;
        } else if (errorMessage.includes("amount")) {
          newErrors.amount = err.graphQLErrors[0].message;
        } else if (errorMessage.includes("role")) {
          newErrors.role = err.graphQLErrors[0].message;
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
        enabled
      >
        <ScrollView
          ref={scrollViewRef}
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

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register to start your journey with us
          </Text>

          {/* General Error */}
          {errors.general ? (
            <Text style={styles.errorText}>{errors.general}</Text>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={22}
                color="#4B5EAA"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(value) => handleChange(value, "name")}
                placeholderTextColor="#8A94A6"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
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
                value={formData.email}
                onChangeText={(value) => handleChange(value, "email")}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8A94A6"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
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
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(value) => handleChange(value, "password")}
                secureTextEntry={!showPassword}
                placeholderTextColor="#8A94A6"
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

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Select Your Role</Text>
            {errors.role ? (
              <Text style={styles.errorText}>{errors.role}</Text>
            ) : null}
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  formData.role === "user" && styles.roleOptionSelected,
                ]}
                onPress={() => handleChange("user", "role")}
              >
                <View style={styles.radioButton}>
                  {formData.role === "user" && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>User</Text>
                  <Text style={styles.roleDescription}>
                    Looking for parking spaces
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  formData.role === "landowner" && styles.roleOptionSelected,
                ]}
                onPress={() => handleChange("landowner", "role")}
              >
                <View style={styles.radioButton}>
                  {formData.role === "landowner" && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>Landowner</Text>
                  <Text style={styles.roleDescription}>
                    Parking lot manager
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignUp}
            style={styles.registerButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.registerButtonText}>Loading...</Text>
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity>
              <Text
                onPress={() => navigation.navigate("LoginScreen")}
                style={styles.loginLink}
              >
                {" "}
                Log In
              </Text>
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
    paddingTop: 40,
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
    marginBottom: 30,
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
  roleContainer: {
    marginTop: 10,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  roleOptionSelected: {
    borderWidth: 1.5,
    borderColor: "#D4A017",
    backgroundColor: "#F8FAFC",
  },
  radioButton: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioButtonSelected: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#D4A017",
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  registerButton: {
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
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
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
    textAlign: "center",
  },
});
