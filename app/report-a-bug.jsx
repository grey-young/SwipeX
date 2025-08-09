// ReportABug.js
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  SafeAreaView,
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

// Assuming Firebase is already set up and configured
// In a real app, you would import 'auth' and 'db' from your own Firebase setup file.
// For this example, we'll use placeholder functions and objects.
const auth = { currentUser: { uid: "test-user-123" } };
const db = {}; // Placeholder for firestore database
const getStorage = () => ({}); // Placeholder for firebase storage

// Placeholder for Firebase Firestore functions
const addDoc = async (collectionRef, data) => {
  console.log("Adding bug report to mock Firestore:", data);
  return { id: "mock-doc-id" };
};
const collection = (db, collectionName) => ({
  path: collectionName,
});
const serverTimestamp = () => new Date();

// Placeholder for Firebase Storage functions
const ref = (storage, path) => ({ path });
const uploadBytes = async (storageRef, blob) => {
  console.log(`Uploading to mock Firebase Storage at: ${storageRef.path}`);
  return { ref: storageRef };
};
const getDownloadURL = async (storageRef) => {
  return `https://mock-storage.com/${storageRef.path}`;
};

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

export default function ReportABug() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
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
      buttonPrimary: isDark ? "#ff6961" : "#e74c3c", // Red color for bug reports
      buttonSecondary: isDark ? "#343B45" : "#E5E9F0",
    }),
    [isDark]
  );

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setModal({
          visible: true,
          title: "Permission Denied",
          message: "Sorry, we need camera roll permissions to make this work.",
          isSuccess: false,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("ImagePicker Error:", error);
      setModal({
        visible: true,
        title: "Error",
        message: "Failed to open image library.",
        isSuccess: false,
      });
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async (uri) => {
    if (!uri) return null;
    try {
      const storage = getStorage();
      const response = await fetch(uri);
      const blob = await response.blob();
      const userId = auth.currentUser?.uid || `anonymous-${Date.now()}`;
      const filename = `bugReports/${userId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Image upload error:", error);
      setModal({
        visible: true,
        title: "Error",
        message: "Failed to upload image. Please try again.",
        isSuccess: false,
      });
      return null;
    }
  };

  // Submit bug report
  const submitBug = async () => {
    Keyboard.dismiss();
    if (!title.trim() || !description.trim()) {
      setModal({
        visible: true,
        title: "Missing Information",
        message: "Please provide a title and description for the bug.",
        isSuccess: false,
      });
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImage(image);
      const userId = auth.currentUser?.uid || "anonymous";

      await addDoc(collection(db, "bugReports"), {
        uid: userId,
        title,
        description,
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      setModal({
        visible: true,
        title: "Success",
        message:
          "Your bug report has been submitted. Thank you for helping us improve!",
        isSuccess: true,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setImage(null);
    } catch (error) {
      console.error("Submission error:", error);
      setModal({
        visible: true,
        title: "Error",
        message:
          "Failed to submit bug report. Please check your connection and try again.",
        isSuccess: false,
      });
    }
    setLoading(false);
  };

  const closeModal = () => {
    setModal({ ...modal, visible: false });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.header, { color: colors.text }]}>
            Report a Bug
          </Text>
          <Text style={[styles.lead, { color: colors.dim }]}>
            Found an issue? Please let us know so we can fix it! Your feedback
            is invaluable.
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>Bug Title*</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
              },
            ]}
            placeholder="A short, clear title for the issue"
            placeholderTextColor={colors.dim}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { color: colors.text }]}>
            Description*
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
            placeholder="Describe what happened and how we can reproduce it."
            placeholderTextColor={colors.dim}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: colors.text }]}>
            Screenshot (optional)
          </Text>
          {image && <Image source={{ uri: image }} style={styles.image} />}
          <TouchableOpacity
            style={[
              styles.imageBtn,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
            ]}
            onPress={pickImage}
          >
            <Text style={[styles.imageBtnText, { color: colors.text }]}>
              {image ? "Change Screenshot" : "Choose Screenshot"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: loading ? colors.dim : colors.buttonPrimary },
            ]}
            onPress={submitBug}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.submitBtnText}>Submit Bug Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        <ModalMessage
          visible={modal.visible}
          title={modal.title}
          message={modal.message}
          onClose={closeModal}
          isSuccess={modal.isSuccess}
        />
      </SafeAreaView>
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
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
    resizeMode: "cover",
  },
  imageBtn: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  imageBtnText: {
    fontWeight: "600",
    fontSize: 14,
  },
  submitBtn: {
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
