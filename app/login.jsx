import { auth } from "@/lib/firebase";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInDown,
} from "react-native-reanimated";

// Color constants
const COLORS = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  secondary: "#22d3ee",
  error: "#ef4444",
  light: {
    background: "#f8fafc",
    card: "#ffffff",
    text: "#1e293b",
    inputBg: "#f1f5f9",
    border: "#e2e8f0",
    subtitle: "#64748b",
  },
  dark: {
    background: "#0f172a",
    card: "#1e293b",
    text: "#f8fafc",
    inputBg: "#334155",
    border: "#475569",
    subtitle: "#94a3b8",
  },
};

export default function Login() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleLogin = async () => {
    Haptics.selectionAsync();
    if (!email || !password) {
      Alert.alert("Validation Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)/index");
    } catch (error) {
      Alert.alert("Login Failed", error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View entering={SlideInDown.duration(500)} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Animated.Text
          entering={FadeInUp.duration(600)}
          style={[styles.title, { color: colors.text }]}
        >
          Welcome Back
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(100).duration(500)}
          style={[styles.subtitle, { color: colors.subtitle }]}
        >
          Sign in to continue your swapping journey
        </Animated.Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(200).duration(600)}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            shadowColor: isDark ? "#000" : "#94a3b8",
          },
        ]}
      >
        {/* Email Input */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={[
            styles.inputContainer,
            focusedInput === "email" && styles.inputFocused,
          ]}
        >
          <Ionicons
            name="mail-outline"
            size={20}
            color={focusedInput === "email" ? COLORS.primary : "#94a3b8"}
            style={styles.icon}
          />
          <TextInput
            placeholder="Email Address"
            placeholderTextColor={colors.subtitle}
            style={[styles.input, { color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedInput("email")}
            onBlur={() => setFocusedInput(null)}
          />
        </Animated.View>

        {/* Password Input */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={[
            styles.inputContainer,
            focusedInput === "password" && styles.inputFocused,
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={focusedInput === "password" ? COLORS.primary : "#94a3b8"}
            style={styles.icon}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.subtitle}
            style={[styles.input, { color: colors.text }]}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedInput("password")}
            onBlur={() => setFocusedInput(null)}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={focusedInput === "password" ? COLORS.primary : "#94a3b8"}
            />
          </Pressable>
        </Animated.View>

        {/* Remember/Forgot */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          style={styles.row}
        >
          <View style={styles.rememberMe}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              thumbColor={rememberMe ? COLORS.primary : "#f8fafc"}
              trackColor={{ false: "#cbd5e1", true: COLORS.primary }}
            />
            <Text style={[styles.rememberText, { color: colors.subtitle }]}>
              Remember me
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={[styles.forgotText, { color: COLORS.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Login Button */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: COLORS.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Divider */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
          style={styles.dividerContainer}
        >
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border }]}
          />
          <Text style={[styles.dividerText, { color: colors.subtitle }]}>
            or continue with
          </Text>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border }]}
          />
        </Animated.View>

        {/* Social Logins */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(500)}
          style={styles.socials}
        >
          <TouchableOpacity style={styles.socialBtn}>
            <View style={styles.socialIconContainer}>
              <AntDesign name="google" size={20} color="#DB4437" />
            </View>
            <Text style={[styles.socialText, { color: colors.text }]}>
              Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialBtn}>
            <View style={styles.socialIconContainer}>
              <AntDesign name="apple1" size={20} color={colors.text} />
            </View>
            <Text style={[styles.socialText, { color: colors.text }]}>
              Apple
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Signup */}
      <Animated.View
        entering={FadeInDown.delay(900).duration(500)}
        style={styles.signup}
      >
        <Text style={[styles.signupText, { color: colors.subtitle }]}>
          Don't have an account?
        </Text>
        <TouchableOpacity onPress={() => router.push("/register")}>
          <Text style={[styles.signupLink, { color: COLORS.primary }]}>
            {" "}
            Sign up
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    justifyContent: "space-between",
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "#f1f5f9",
  },
  inputFocused: {
    borderColor: "#6366f1",
    backgroundColor: "transparent",
    shadowColor: "#818cf8",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  icon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 14,
  },
  forgotText: {
    fontWeight: "600",
    fontSize: 14,
  },
  loginButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    marginHorizontal: 10,
  },
  socials: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  socialIconContainer: {
    width: 24,
    alignItems: "center",
  },
  socialText: {
    fontWeight: "600",
    fontSize: 15,
  },
  signup: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 20,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontWeight: "700",
    fontSize: 14,
  },
});
