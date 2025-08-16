import { useColorScheme } from "@/hooks/useColorScheme";
import { auth, db, storage } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import uuid from "react-native-uuid";

// Color constants
const COLORS = {
  light: {
    background: "#f8fafc",
    card: "#ffffff",
    text: "#1e293b",
    inputBg: "#f1f5f9",
    border: "#e2e8f0",
    tint: "#6366f1",
    accent: "#10b981",
    error: "#ef4444",
  },
  dark: {
    background: "#0f172a",
    card: "#1e293b",
    text: "#f8fafc",
    inputBg: "#334155",
    border: "#475569",
    tint: "#818cf8",
    accent: "#34d399",
    error: "#f87171",
  },
};

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Furniture",
  "Books",
  "Home & Garden",
  "Sports",
  "Toys & Games",
  "Collectibles",
  "Other",
];

const CONDITIONS = [
  "Brand New",
  "Like New",
  "Good",
  "Fair",
  "Poor",
  "For Parts",
];

// Reusable Modal Picker Component
const ModalPicker = ({
  isVisible,
  title,
  items,
  selectedItem,
  onSelect,
  onClose,
  isDark,
}) => {
  const colors = COLORS[isDark ? "dark" : "light"];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={30}
        tint={isDark ? "dark" : "light"}
        style={styles.modalContainer}
      >
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.modalContent, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {title}
          </Text>

          {items.map((item) => (
            <Pressable
              key={item}
              style={styles.modalItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.modalItemText,
                  {
                    color: selectedItem === item ? colors.tint : colors.text,
                  },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

// Custom Message Box component to replace Alert
const MessageBox = ({ isVisible, title, message, onClose, isDark }) => {
  const colors = COLORS[isDark ? "dark" : "light"];
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={30}
        tint={isDark ? "dark" : "light"}
        style={styles.modalContainer}
      >
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.modalContent, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.modalMessage, { color: colors.text }]}>
            {message}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.messageBoxButton, { backgroundColor: colors.tint }]}
          >
            <Text style={styles.messageBoxButtonText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

export default function AddPostPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = COLORS[isDark ? "dark" : "light"];

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    exchangeFor: "",
    price: "",
    tags: "",
    openToAnyOffer: false,
    openToCashOffer: false,
    location: {
      lat: 5.56,
      lng: -0.205,
    },
  });

  // UI state
  const [media, setMedia] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [messageBox, setMessageBox] = useState({
    isVisible: false,
    title: "",
    message: "",
  });

  const mapRef = useRef(null);

  const handleInputChange = (key, value) => {
    setForm((prevForm) => ({ ...prevForm, [key]: value }));
  };

  const showMessage = (title, message) => {
    setMessageBox({ isVisible: true, title, message });
  };

  const hideMessage = () => {
    setMessageBox({ ...messageBox, isVisible: false });
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - media.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newMedia = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type,
      }));
      setMedia([...media, ...newMedia]);
    }
  };

  const removeMedia = (index) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    handleInputChange("location", { lat: latitude, lng: longitude });

    mapRef.current.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      500
    );
  };

  const uploadMedia = async () => {
    const urls = [];
    const totalFiles = media.length;
    let completedUploads = 0;

    for (const item of media) {
      try {
        const response = await fetch(item.uri);
        const blob = await response.blob();
        const filename = item.uri.substring(item.uri.lastIndexOf("/") + 1);
        const storageRef = ref(storage, `postMedia/${Date.now()}-${filename}`);
        const uploadTask = uploadBytesResumable(storageRef, blob);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(
                Math.round(
                  ((completedUploads + progress / 100) / totalFiles) * 100
                )
              );
            },
            (error) => {
              console.error("Upload error:", error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              urls.push({ url: downloadURL, type: item.type });
              completedUploads++;
              resolve();
            }
          );
        });
      } catch (error) {
        console.error("Error uploading media:", error);
        showMessage("Error", "Failed to upload one or more files.");
        setSaving(false);
        setUploadProgress(0);
        return null;
      }
    }
    setUploadProgress(100);
    return urls;
  };

  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.description ||
      !form.category ||
      !form.condition ||
      media.length === 0
    ) {
      showMessage(
        "Missing Information",
        "Please fill all required fields and add at least one image or video."
      );
      return;
    }

    setSaving(true);
    setUploadProgress(0);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const mediaUrls = await uploadMedia();
      if (!mediaUrls) {
        setSaving(false);
        setUploadProgress(0);
        return;
      }

      const postId = uuid.v4();
      const postData = {
        postId,
        ownerId: user.uid,
        ownerUsername: userData.username,
        ownerProfilePicture: userData.profilePic || "",
        title: form.title,
        description: form.description,
        itemCategory: form.category,
        condition: form.condition,
        images: mediaUrls.filter((m) => m.type === "image").map((m) => m.url),
        videos: mediaUrls.filter((m) => m.type === "video").map((m) => m.url),
        location: {
          region: "Auto-detect",
          city: "Auto-detect",
          coordinates: form.location,
        },
        exchangeFor: form.exchangeFor
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        price: form.price ? parseFloat(form.price) : null,
        isOpenToAnyOffer: form.openToAnyOffer,
        isOpenToCashOffer: form.openToCashOffer,
        postStatus: "active",
        datePosted: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        likes: [],
        savedBy: [],
        views: 0,
        comments: [],
      };

      await addDoc(collection(db, "listings"), postData);
      await updateDoc(doc(db, "users", user.uid), {
        listings: arrayUnion(postId),
      });

      showMessage("Success", "Your post has been created!");
      // Reset form
      setForm({
        title: "",
        description: "",
        category: "",
        condition: "",
        exchangeFor: "",
        price: "",
        tags: "",
        openToAnyOffer: false,
        openToCashOffer: false,
        location: {
          lat: 5.56,
          lng: -0.205,
        },
      });
      setMedia([]);
    } catch (error) {
      console.error("Error creating post:", error);
      showMessage("Error", "Failed to create post. Please try again.");
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const mapDarkStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.duration(500)}>
            <Text style={[styles.heading, { color: colors.text }]}>
              Create New Listing
            </Text>
            <Text style={[styles.subheading, { color: colors.tint }]}>
              Share items you want to trade
            </Text>
          </Animated.View>

          {/* Title & Description */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(500)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Basic Information
            </Text>

            <TextInput
              placeholder="Item Title*"
              placeholderTextColor={colors.border}
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.inputBg },
              ]}
              value={form.title}
              onChangeText={(text) => handleInputChange("title", text)}
            />

            <TextInput
              placeholder="Description*"
              placeholderTextColor={colors.border}
              style={[
                styles.textArea,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  height: 120,
                },
              ]}
              multiline
              numberOfLines={4}
              value={form.description}
              onChangeText={(text) => handleInputChange("description", text)}
            />
          </Animated.View>

          {/* Category & Condition */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Item Details
            </Text>

            <Pressable
              style={[styles.selectButton, { backgroundColor: colors.inputBg }]}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  { color: form.category ? colors.text : colors.border },
                ]}
              >
                {form.category || "Select Category*"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.border} />
            </Pressable>

            <Pressable
              style={[
                styles.selectButton,
                { backgroundColor: colors.inputBg, marginTop: 12 },
              ]}
              onPress={() => setShowConditionModal(true)}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  { color: form.condition ? colors.text : colors.border },
                ]}
              >
                {form.condition || "Select Condition*"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.border} />
            </Pressable>
          </Animated.View>

          {/* Images/Videos */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Media*
              </Text>
              <Text style={[styles.imageCount, { color: colors.border }]}>
                {media.length}/5
              </Text>
            </View>

            <Text style={[styles.hint, { color: colors.border }]}>
              Add clear photos or a short video of your item
            </Text>

            <View style={styles.imageContainer}>
              {media.map((item, index) => (
                <View key={index} style={styles.imageWrapper}>
                  {item.type === "image" ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.imagePreview}
                    />
                  ) : (
                    <View
                      style={[
                        styles.videoPreview,
                        { backgroundColor: colors.inputBg },
                      ]}
                    >
                      <Ionicons name="videocam" size={40} color={colors.text} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.removeImageButton,
                      { backgroundColor: colors.error },
                    ]}
                    onPress={() => removeMedia(index)}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}

              {media.length < 5 && (
                <TouchableOpacity
                  style={[
                    styles.addImageButton,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={pickMedia}
                  disabled={saving}
                >
                  <Ionicons name="add" size={24} color={colors.tint} />
                  <Text style={[styles.addImageText, { color: colors.tint }]}>
                    Add Media
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Exchange Details */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(500)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Exchange Details
            </Text>

            {/* New Price Input Field */}
            <TextInput
              placeholder="Estimated Value/Price (optional)"
              placeholderTextColor={colors.border}
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.inputBg },
              ]}
              keyboardType="numeric"
              value={form.price}
              onChangeText={(text) => handleInputChange("price", text)}
            />

            <TextInput
              placeholder="What would you like in exchange? (comma separated)"
              placeholderTextColor={colors.border}
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.inputBg },
              ]}
              value={form.exchangeFor}
              onChangeText={(text) => handleInputChange("exchangeFor", text)}
            />

            <View style={styles.anyOfferContainer}>
              <Text style={[styles.anyOfferText, { color: colors.text }]}>
                Open to any offer
              </Text>
              <TouchableOpacity
                onPress={() =>
                  handleInputChange("openToAnyOffer", !form.openToAnyOffer)
                }
              >
                <View
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: form.openToAnyOffer
                        ? colors.accent
                        : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      form.openToAnyOffer && {
                        transform: [{ translateX: 20 }],
                      },
                      { backgroundColor: colors.card },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.anyOfferContainer}>
              <Text style={[styles.anyOfferText, { color: colors.text }]}>
                Open to cash offers
              </Text>
              <TouchableOpacity
                onPress={() =>
                  handleInputChange("openToCashOffer", !form.openToCashOffer)
                }
              >
                <View
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: form.openToCashOffer
                        ? colors.accent
                        : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      form.openToCashOffer && {
                        transform: [{ translateX: 20 }],
                      },
                      { backgroundColor: colors.card },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Tags (comma separated)"
              placeholderTextColor={colors.border}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  marginTop: 12,
                },
              ]}
              value={form.tags}
              onChangeText={(text) => handleInputChange("tags", text)}
            />
          </Animated.View>

          {/* Location */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(500)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Location
            </Text>

            <Text
              style={[styles.hint, { color: colors.border, marginBottom: 12 }]}
            >
              Tap on the map to set your location
            </Text>

            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: form.location.lat,
                longitude: form.location.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={handleMapPress}
              customMapStyle={isDark ? mapDarkStyle : []}
            >
              <Marker
                coordinate={{
                  latitude: form.location.lat,
                  longitude: form.location.lng,
                }}
              >
                <View style={styles.marker}>
                  <View
                    style={[
                      styles.markerDot,
                      {
                        backgroundColor: colors.accent,
                        borderColor: colors.card,
                      },
                    ]}
                  />
                </View>
              </Marker>
            </MapView>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)}>
            <Pressable
              style={[styles.submitBtn, { backgroundColor: colors.tint }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${uploadProgress}%`,
                          backgroundColor: colors.accent,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.submitText}>
                    {uploadProgress}% Uploading...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.submitText}>Publish Listing</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Modals */}
        <ModalPicker
          isVisible={showCategoryModal}
          title="Select Category"
          items={CATEGORIES}
          selectedItem={form.category}
          onSelect={(item) => handleInputChange("category", item)}
          onClose={() => setShowCategoryModal(false)}
          isDark={isDark}
        />

        <ModalPicker
          isVisible={showConditionModal}
          title="Select Condition"
          items={CONDITIONS}
          selectedItem={form.condition}
          onSelect={(item) => handleInputChange("condition", item)}
          onClose={() => setShowConditionModal(false)}
          isDark={isDark}
        />

        {/* Custom Alert */}
        <MessageBox
          isVisible={messageBox.isVisible}
          title={messageBox.title}
          message={messageBox.message}
          onClose={hideMessage}
          isDark={isDark}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  hint: {
    fontSize: 14,
    marginBottom: 16,
  },
  imageCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 16,
  },
  selectButtonText: {
    fontSize: 16,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageWrapper: {
    position: "relative",
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  videoPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addImageText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  anyOfferContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingVertical: 8,
  },
  anyOfferText: {
    fontSize: 16,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    padding: 2,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  marker: {
    alignItems: "center",
  },
  markerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    overflow: "hidden", // Required for the progress bar
    position: "relative", // Required for the progress bar
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    zIndex: 1, // Ensure text is on top of progress bar
  },
  progressBarContainer: {
    ...StyleSheet.absoluteFillObject, // Fill the entire button
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  progressBar: {
    height: "100%",
    borderRadius: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  modalItem: {
    paddingVertical: 14,
  },
  modalItemText: {
    fontSize: 16,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  messageBoxButton: {
    borderRadius: 12,
    padding: 12,
    alignSelf: "stretch",
    alignItems: "center",
  },
  messageBoxButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
