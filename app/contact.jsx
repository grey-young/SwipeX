// Contact.js
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { getStatusBarHeight } from "react-native-status-bar-height";

// Assuming Firebase is already set up and configured
// In a real app, you would import 'auth' and 'db' from your own Firebase setup file.
// For this example, we'll use placeholder functions and objects.
const auth = { currentUser: { uid: "test-user-123" } };
const db = {}; // Placeholder for firestore database

// Placeholder for Firebase Firestore functions
const addDoc = async (collectionRef, data) => {
  console.log("Adding contact message to mock Firestore:", data);
  return { id: "mock-doc-id" };
};
const collection = (db, collectionName) => ({
  path: collectionName,
});
const serverTimestamp = () => new Date();

// Custom Modal for success/error messages
const ModalMessage = ({ visible, title, message, onClose, isSuccess }) => {
  if (!visible) return null;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const modalColors = {
    background: isDark ? "#2C3E50" : "#FFFFFF",
    text: isDark ? "#E0E8F0" : "#2C3E50",
    button: isSuccess ? "#2ECC71" : "#E74C3C",
    buttonText: "#FFFFFF",
    titleColor: isSuccess ? "#27AE60" : "#C0392B",
  };

  return (
    <View style={styles.modalOverlay}>
      <View
        style={[
          styles.modalContent,
          { backgroundColor: modalColors.background },
        ]}
      >
        <Text style={[styles.modalTitle, { color: modalColors.titleColor }]}>
          {title}
        </Text>
        <Text style={[styles.modalMessage, { color: modalColors.text }]}>
          {message}
        </Text>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: modalColors.button }]}
          onPress={onClose}
        >
          <Text
            style={[styles.modalButtonText, { color: modalColors.buttonText }]}
          >
            OK
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    isSuccess: false,
  });

  const theme = useColorScheme();
  const isDark = theme === "dark";

  const colors = useMemo(
    () => ({
      background: isDark ? "#0D1117" : "#F8F9FA",
      card: isDark ? "#161B22" : "#FFFFFF",
      text: isDark ? "#E0E8F0" : "#2C3E50",
      dim: isDark ? "#A0A7B5" : "#6E7A8A",
      accent: isDark ? "#58A6FF" : "#007AFF",
      border: isDark ? "#30363D" : "#E0E0E0",
      inputBg: isDark ? "#21262D" : "#F1F5F9",
      buttonPrimary: isDark ? "#58A6FF" : "#007AFF", // Blue for contact form
    }),
    [isDark]
  );

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setModal({
        visible: true,
        title: "Missing Information",
        message: "Please fill in all fields to send a message.",
        isSuccess: false,
      });
      return;
    }

    // Simple email validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email.trim())) {
      setModal({
        visible: true,
        title: "Invalid Email",
        message: "Please enter a valid email address.",
        isSuccess: false,
      });
      return;
    }

    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) {
        setModal({
          visible: true,
          title: "Login Required",
          message: "You must be logged in to send a message.",
          isSuccess: false,
        });
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "contactMessages"), {
        uid: user.uid,
        name,
        email,
        message,
        createdAt: serverTimestamp(),
      });

      setModal({
        visible: true,
        title: "Success",
        message: "Your message has been sent! We'll get back to you soon.",
        isSuccess: true,
      });

      // Clear form fields
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
      setModal({
        visible: true,
        title: "Error",
        message: "Failed to send message. Please try again later.",
        isSuccess: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ ...modal, visible: false });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={[
          styles.safe,
          {
            backgroundColor: colors.background,
            paddingTop: getStatusBarHeight(true),
          },
        ]}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={[styles.header, { color: colors.text }]}>
              Contact SwipeX
            </Text>
            <Text style={[styles.lead, { color: colors.dim }]}>
              Got a question, suggestion, or just want to say hi? We'd love to
              hear from you.
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>
              Your Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Full name"
              placeholderTextColor={colors.dim}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Your email address"
              placeholderTextColor={colors.dim}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Your Message
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Enter your message here"
              placeholderTextColor={colors.dim}
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: loading ? colors.dim : colors.buttonPrimary,
                },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.buttonText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
        <ModalMessage
          visible={modal.visible}
          title={modal.title}
          message={modal.message}
          onClose={closeModal}
          isSuccess={modal.isSuccess}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  lead: {
    fontSize: 14,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 48,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    width: "85%",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
