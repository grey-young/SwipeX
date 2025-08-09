import { useColorScheme } from "@/hooks/useColorScheme";
import { auth, db, storage } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  useColorScheme as rnUseColorScheme,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { useEffect, useMemo, useState } from "react";

export default function EditProfile() {
  const router = useRouter();

  // Theme logic
  const colorScheme = useColorScheme();
  const systemColor = rnUseColorScheme();
  const theme = colorScheme || systemColor;
  const isDark = theme === "dark";

  // State for user data and form inputs
  const [userData, setUserData] = useState(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [customPronouns, setCustomPronouns] = useState("");

  // UI state
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Define professional color palette
  const colors = {
    background: isDark ? "#0d1117" : "#F4F4F9",
    card: isDark ? "#1A222B" : "#FFFFFF",
    text: isDark ? "#E0E0E0" : "#2C3E50",
    subtleText: isDark ? "#A0A7B5" : "#6E7A8A",
    inputBackground: isDark ? "#1E2A3A" : "#FFFFFF",
    inputBorder: isDark ? "#3A4550" : "#EBEBEB",
    primary: isDark ? "#66C0F4" : "#4A90E2",
    destructive: "#FF6347",
  };

  // Memoized styles for dynamic colors
  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollViewContent: {
        padding: 20,
        alignItems: "center",
      },
      header: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
      },
      headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: colors.text,
        flex: 1,
        textAlign: "center",
      },
      profilePicContainer: {
        marginBottom: 30,
        alignItems: "center",
      },
      profilePic: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.inputBackground,
        borderWidth: 3,
        borderColor: colors.primary,
      },
      changePicButton: {
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      },
      changePicText: {
        color: colors.primary,
        fontWeight: "600",
        fontSize: 16,
      },
      inputContainer: {
        width: "100%",
        marginBottom: 20,
      },
      inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
        marginBottom: 8,
      },
      input: {
        width: "100%",
        borderWidth: 1,
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: colors.inputBackground,
        color: colors.text,
        borderColor: colors.inputBorder,
      },
      descriptionInput: {
        height: 100,
        textAlignVertical: "top",
      },
      pickerContainer: {
        width: "100%",
        marginBottom: 20,
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.inputBorder,
      },
      picker: {
        color: colors.text,
      },
      saveButton: {
        width: "100%",
        backgroundColor: colors.primary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 10,
      },
      saveButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 18,
      },
      // Modal styles
      centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
      },
      modalView: {
        margin: 20,
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 15,
      },
      modalText: {
        fontSize: 16,
        color: colors.subtleText,
        marginBottom: 20,
        textAlign: "center",
      },
    });
  }, [colors]);

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      setIsFetchingData(true);
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setFullName(data.fullName || "");
          setUsername(data.username || "");
          setDescription(data.description || "");
          setProfilePic(data.profilePic || "");

          if (
            data.pronouns &&
            ["he/him", "she/her", "they/them"].includes(data.pronouns)
          ) {
            setPronouns(data.pronouns);
          } else if (data.pronouns) {
            setPronouns("custom");
            setCustomPronouns(data.pronouns);
          } else {
            setPronouns("");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchData();
  }, []);

  // Show a custom modal instead of Alert.alert
  const showAlert = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      setIsUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const uid = auth.currentUser.uid;
      const fileRef = ref(storage, `profilePics/${uid}`);
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);
      setProfilePic(downloadURL);
      await updateDoc(doc(db, "users", uid), {
        profilePic: downloadURL,
      });
      setIsUploading(false);
    } catch (error) {
      console.error("Upload Error:", error);
      showAlert(
        "Upload Failed",
        "There was an error uploading your profile picture."
      );
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || !username.trim()) {
      showAlert("Missing Info", "Full name and username are required.");
      return;
    }

    try {
      setIsSaving(true);
      const uid = auth.currentUser.uid;
      const userRef = doc(db, "users", uid);
      const pronounsToSave = pronouns === "custom" ? customPronouns : pronouns;

      await updateDoc(userRef, {
        fullName: fullName.trim(),
        username: username.toLowerCase().trim(),
        description: description.trim(),
        pronouns: pronounsToSave,
      });

      showAlert("Success", "Your profile has been successfully updated!");
      router.back();
    } catch (error) {
      console.error("Save error:", error);
      showAlert(
        "Error",
        "There was a problem updating your profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetchingData) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.subtleText }}>
          Fetching profile data...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Profile Picture Section */}
          <View style={styles.profilePicContainer}>
            <Image
              source={
                profilePic
                  ? { uri: profilePic }
                  : require("@/assets/images/default-profile.png")
              }
              style={styles.profilePic}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={handleImagePick}
              style={styles.changePicButton}
              disabled={isUploading}
            >
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={styles.changePicText}>
                {isUploading ? "Uploading..." : "Change Photo"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Inputs */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.subtleText}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a unique username"
              placeholderTextColor={colors.subtleText}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Tell us a little about yourself"
              placeholderTextColor={colors.subtleText}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Pronouns Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Pronouns</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={pronouns}
                onValueChange={(itemValue) => setPronouns(itemValue)}
                style={styles.picker}
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="Select Pronouns" value="" />
                <Picker.Item label="He/Him" value="he/him" />
                <Picker.Item label="She/Her" value="she/her" />
                <Picker.Item label="They/Them" value="they/them" />
                <Picker.Item label="Other..." value="custom" />
              </Picker>
            </View>
            {pronouns === "custom" && (
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Enter your pronouns"
                placeholderTextColor={colors.subtleText}
                value={customPronouns}
                onChangeText={setCustomPronouns}
                autoCapitalize="none"
              />
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
