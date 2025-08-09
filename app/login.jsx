import { auth, db } from "@/lib/firebase";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function ReportABug() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    if (!uri) return null;
    const storage = getStorage();
    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = `bugReports/${auth.currentUser.uid}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const submitBug = async () => {
    if (!title || !description) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImage(image);

      await addDoc(collection(db, "bugReports"), {
        uid: auth.currentUser?.uid,
        title,
        description,
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
        status: "pending", // could be 'pending', 'in-progress', 'resolved'
      });

      Alert.alert("Success", "Your bug report has been submitted.");
      setTitle("");
      setDescription("");
      setImage(null);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to submit bug report.");
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Report a Bug</Text>

      <Text style={styles.label}>Bug Title*</Text>
      <TextInput
        style={styles.input}
        placeholder="Short title for the bug"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description*</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Describe the issue in detail"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Screenshot (optional)</Text>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
        <Text style={styles.imageBtnText}>Choose Image</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={submitBug}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Bug Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#f9f9f9",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  imageBtn: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  imageBtnText: {
    color: "#333",
    fontWeight: "500",
  },
  submitBtn: {
    backgroundColor: "#ff4d4d",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
