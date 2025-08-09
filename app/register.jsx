import { auth, db } from "@/lib/firebase"; // Ensure you export db from your firebase config
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { Redirect, Stack, useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInLeft,
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

export default function SignUp() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? COLORS.dark : COLORS.light;

  // Form states
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (checkingAuth) return null;
  if (user) return <Redirect href="/(tabs)" />;

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      newErrors.username = "3-20 chars (letters, numbers, _)";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Min 6 characters";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    if (dob > new Date()) newErrors.dob = "Invalid birth date";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUsernameAvailability = async () => {
    try {
      const q = query(
        collection(db, "usernames"),
        where("username", "==", username)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  const checkEmailAvailability = async () => {
    try {
      const q = query(collection(db, "emails"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const handleSignup = async () => {
    Haptics.selectionAsync();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Check username availability
      const isUsernameAvailable = await checkUsernameAvailability();
      if (!isUsernameAvailable) {
        Alert.alert(
          "Username Taken",
          "This username is already in use. Please choose another."
        );
        return;
      }

      // Check email availability
      const isEmailAvailable = await checkEmailAvailability();
      if (!isEmailAvailable) {
        Alert.alert(
          "Email Registered",
          "This email is already registered. Please use another email."
        );
        return;
      }

      // Create auth user
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile with display name
      await updateProfile(userCred.user, { displayName: fullName });

      // Prepare user data for Firestore
      const userData = {
        uid: userCred.user.uid,
        fullName,
        username: username.toLowerCase(),
        email,
        dob: dob.toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        profilePic: "", // default URL or empty until uploaded
        description: "", // can be filled later via edit profile
        listings: [],
        savedListings: [],
        wishlists: [],
      };

      // Create user document
      await setDoc(doc(db, "users", userCred.user.uid), userData);

      // Store username in separate collection
      await setDoc(doc(db, "usernames", userCred.user.uid), {
        uid: userCred.user.uid,
        createdAt: new Date().toISOString(),
        username: username.toLowerCase(),
      });

      // Store email in separate collection
      await setDoc(doc(db, "emails", userCred.user.uid), {
        uid: userCred.user.uid,
        createdAt: new Date().toISOString(),
        email,
      });

      // Success
      Alert.alert(
        "Welcome to SwipeX",
        `Hello ${fullName}, your account is ready!`
      );
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert(
        "Signup Failed",
        error.message || "An error occurred during signup"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack.Screen options={{ headerShown: false }} />

        <Animated.View
          entering={SlideInLeft.duration(500)}
          style={styles.header}
        >
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
            Create Your Account
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
          {/* Full Name */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={[
              styles.inputContainer,
              focusedInput === "fullName" && styles.inputFocused,
              errors.fullName && styles.inputError,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={focusedInput === "fullName" ? COLORS.primary : "#94a3b8"}
              style={styles.icon}
            />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor={colors.subtitle}
              style={[styles.input, { color: "black" }]}
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setFocusedInput("fullName")}
              onBlur={() => setFocusedInput(null)}
            />
            {errors.fullName && (
              <MaterialIcons
                name="error-outline"
                size={20}
                color={COLORS.error}
                style={styles.errorIcon}
              />
            )}
          </Animated.View>
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}

          {/* Username */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(500)}
            style={[
              styles.inputContainer,
              focusedInput === "username" && styles.inputFocused,
              errors.username && styles.inputError,
            ]}
          >
            <Ionicons
              name="at"
              size={20}
              color={focusedInput === "username" ? COLORS.primary : "#94a3b8"}
              style={styles.icon}
            />
            <TextInput
              placeholder="Username"
              placeholderTextColor={colors.subtitle}
              style={[styles.input, { color: "black" }]}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => setFocusedInput("username")}
              onBlur={() => setFocusedInput(null)}
            />
            {errors.username && (
              <MaterialIcons
                name="error-outline"
                size={20}
                color={COLORS.error}
                style={styles.errorIcon}
              />
            )}
          </Animated.View>
          {errors.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}

          {/* Email */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(500)}
            style={[
              styles.inputContainer,
              focusedInput === "email" && styles.inputFocused,
              errors.email && styles.inputError,
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
              style={[styles.input, { color: "black" }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
            />
            {errors.email && (
              <MaterialIcons
                name="error-outline"
                size={20}
                color={COLORS.error}
                style={styles.errorIcon}
              />
            )}
          </Animated.View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password */}
          <Animated.View
            entering={FadeInDown.delay(450).duration(500)}
            style={[
              styles.inputContainer,
              focusedInput === "password" && styles.inputFocused,
              errors.password && styles.inputError,
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
              style={[styles.input, { color: "black" }]}
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
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Confirm Password */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(500)}
            style={[
              styles.inputContainer,
              focusedInput === "confirmPassword" && styles.inputFocused,
              errors.confirmPassword && styles.inputError,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={
                focusedInput === "confirmPassword" ? COLORS.primary : "#94a3b8"
              }
              style={styles.icon}
            />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor={colors.subtitle}
              style={[styles.input, { color: "black" }]}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocusedInput("confirmPassword")}
              onBlur={() => setFocusedInput(null)}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={
                  focusedInput === "confirmPassword"
                    ? COLORS.primary
                    : "#94a3b8"
                }
              />
            </Pressable>
          </Animated.View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          {/* Date of Birth */}
          <Animated.View
            entering={FadeInDown.delay(550).duration(500)}
            style={[styles.inputContainer, errors.dob && styles.inputError]}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#94a3b8"
              style={styles.icon}
            />
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={styles.dateInput}
            >
              <Text
                style={[
                  styles.dateText,
                  { color: dob ? "black" : colors.subtitle },
                ]}
              >
                {dob ? formatDate(dob) : "Date of Birth"}
              </Text>
            </Pressable>
            {errors.dob && (
              <MaterialIcons
                name="error-outline"
                size={20}
                color={COLORS.error}
                style={styles.errorIcon}
              />
            )}
          </Animated.View>
          {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

          {showDatePicker && (
            <DateTimePicker
              value={dob}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDob(selectedDate);
                }
              }}
              maximumDate={new Date()}
            />
          )}

          {/* Sign Up Button */}
          <Animated.View entering={FadeInDown.delay(600).duration(500)}>
            <TouchableOpacity
              style={[styles.signupButton, { backgroundColor: COLORS.primary }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Login Link */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
          style={styles.loginLink}
        >
          <Text style={[styles.loginText, { color: colors.subtitle }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={[styles.loginLinkText, { color: COLORS.primary }]}>
              {" "}
              Sign In
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
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
    color: "#64748b",
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
    marginBottom: 8,
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
  inputError: {
    borderColor: "#ef4444",
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  dateInput: {
    flex: 1,
    paddingVertical: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  icon: {
    marginRight: 12,
  },
  errorIcon: {
    marginLeft: 8,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 12,
  },
  signupButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLinkText: {
    fontWeight: "700",
    fontSize: 14,
  },
});
