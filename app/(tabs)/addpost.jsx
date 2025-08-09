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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function AddPostPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = COLORS[isDark ? "dark" : "light"];

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [images, setImages] = useState([]);
  const [exchangeFor, setExchangeFor] = useState("");
  const [tags, setTags] = useState("");
  const [openToAnyOffer, setOpenToAnyOffer] = useState(false);
  const [location, setLocation] = useState({
    lat: 5.56,
    lng: -0.205,
  });

  // UI states
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

  const mapRef = useRef(null);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.slice(0, 5 - images.length);
      setImages([...images, ...newImages.map((a) => a.uri)]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLocation({ lat: latitude, lng: longitude });

    // Center map on tapped location
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

  const uploadImages = async () => {
    const urls = [];

    for (const uri of images) {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();

        // Create unique filename
        const filename = uri.substring(uri.lastIndexOf("/") + 1);
        const storageRef = ref(storage, `postImages/${Date.now()}-${filename}`);

        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        urls.push(downloadURL);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    return urls;
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !description ||
      !category ||
      !condition ||
      images.length === 0
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill all required fields and add at least one image"
      );
      return;
    }

    setSaving(true);

    try {
      // Get current user data
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      // Upload images to Firebase Storage
      const imageUrls = await uploadImages();

      // Generate a unique postId
      const postId = uuid.v4();

      // Prepare post data
      const postData = {
        postId,
        ownerId: user.uid,
        ownerUsername: userData.username,
        ownerProfilePicture: userData.profilePic || "",
        title,
        description,
        itemCategory: category,
        condition,
        images: imageUrls,
        location: {
          region: "Auto-detect",
          city: "Auto-detect",
          coordinates: location,
        },
        exchangeFor: exchangeFor
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item),
        isOpenToAnyOffer: openToAnyOffer,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        postStatus: "active",
        datePosted: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        likes: [],
        savedBy: [],
        views: 0,
        comments: [],
      };

      // Save to Firestore with postId as the document ID
      await addDoc(collection(db, "listings"), postData);

      // Add the postId to the user's listings array
      await updateDoc(doc(db, "users", user.uid), {
        listings: arrayUnion(postId),
      });

      Alert.alert("Success", "Your post has been created!");
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setCondition("");
      setImages([]);
      setExchangeFor("");
      setTags("");
      setOpenToAnyOffer(false);
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
              value={title}
              onChangeText={setTitle}
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
              value={description}
              onChangeText={setDescription}
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
                  { color: category ? colors.text : colors.border },
                ]}
              >
                {category || "Select Category*"}
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
                  { color: condition ? colors.text : colors.border },
                ]}
              >
                {condition || "Select Condition*"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.border} />
            </Pressable>
          </Animated.View>

          {/* Images */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Photos*
              </Text>
              <Text style={[styles.imageCount, { color: colors.border }]}>
                {images.length}/5
              </Text>
            </View>

            <Text style={[styles.hint, { color: colors.border }]}>
              Add clear photos of your item
            </Text>

            <View style={styles.imageContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 5 && (
                <TouchableOpacity
                  style={[
                    styles.addImageButton,
                    { backgroundColor: colors.inputBg },
                  ]}
                  onPress={pickImages}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color={colors.tint} />
                  ) : (
                    <>
                      <Ionicons name="add" size={24} color={colors.tint} />
                      <Text
                        style={[styles.addImageText, { color: colors.tint }]}
                      >
                        Add Photo
                      </Text>
                    </>
                  )}
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

            <TextInput
              placeholder="What would you like in exchange? (comma separated)"
              placeholderTextColor={colors.border}
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.inputBg },
              ]}
              value={exchangeFor}
              onChangeText={setExchangeFor}
            />

            <View style={styles.anyOfferContainer}>
              <Text style={[styles.anyOfferText, { color: colors.text }]}>
                Open to any offer
              </Text>
              <TouchableOpacity
                onPress={() => setOpenToAnyOffer(!openToAnyOffer)}
              >
                <View
                  style={[
                    styles.toggle,
                    openToAnyOffer && { backgroundColor: colors.accent },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      openToAnyOffer && { transform: [{ translateX: 20 }] },
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
              value={tags}
              onChangeText={setTags}
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
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={handleMapPress}
              customMapStyle={isDark ? mapDarkStyle : []}
            >
              <Marker
                coordinate={{ latitude: location.lat, longitude: location.lng }}
              >
                <View style={styles.marker}>
                  <View
                    style={[
                      styles.markerDot,
                      { backgroundColor: colors.accent },
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
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.submitText}>Publish Listing</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Category Modal */}
        <Modal
          visible={showCategoryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCategoryModal(false)}
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
                Select Category
              </Text>

              {CATEGORIES.map((item) => (
                <Pressable
                  key={item}
                  style={styles.modalItem}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color: category === item ? colors.tint : colors.text,
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

        {/* Condition Modal */}
        <Modal
          visible={showConditionModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConditionModal(false)}
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
                Select Condition
              </Text>

              {CONDITIONS.map((item) => (
                <Pressable
                  key={item}
                  style={styles.modalItem}
                  onPress={() => {
                    setCondition(item);
                    setShowConditionModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color: condition === item ? colors.tint : colors.text,
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
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
});

const mapDarkStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#242f3e",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#746855",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#242f3e",
      },
    ],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#d59563",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#d59563",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#263c3f",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#6b9a76",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        color: "#38414e",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#212a37",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9ca5b3",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#746855",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#1f2835",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#f3d19c",
      },
    ],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [
      {
        color: "#2f3948",
      },
    ],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#d59563",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#17263c",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#515c6d",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#17263c",
      },
    ],
  },
];
