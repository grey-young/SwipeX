import { useColorScheme } from "@/hooks/useColorScheme";
import { auth, db } from "@/lib/firebase";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";
import MapView, { Marker } from "react-native-maps";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

// Color constants
const COLORS = {
  light: {
    background: "#f0f2f5",
    card: "#ffffff",
    text: "#1f2937",
    border: "#e5e7eb",
    tint: "#4f46e5",
    accent: "#14b8a6",
    danger: "#ef4444",
    success: "#22c55e",
  },
  dark: {
    background: "#0f172a",
    card: "#1e293b",
    text: "#f9fafb",
    border: "#374151",
    tint: "#6366f1",
    accent: "#2dd4bf",
    danger: "#f87171",
    success: "#4ade80",
  },
};

// Memoized carousel item for performance
const CarouselItem = memo(({ item, width, styles, onImagePress }) => {
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <TouchableOpacity
      style={[styles.carouselItem, { width }]}
      activeOpacity={0.9}
      onPress={() => onImagePress(item)}
    >
      {imageLoading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      <Image
        source={{ uri: item }}
        style={styles.carouselImage}
        resizeMode="cover"
        onLoadStart={() => setImageLoading(true)}
        onLoadEnd={() => setImageLoading(false)}
      />
    </TouchableOpacity>
  );
});

export default function ListingDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = COLORS[isDark ? "dark" : "light"];
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [listing, setListing] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();

  const { id: listingId } = useLocalSearchParams();

  const fetchData = useCallback(async () => {
    if (!listingId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, where("postId", "==", listingId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Listing not found");
      }

      const listingDoc = querySnapshot.docs[0];
      const listingData = listingDoc.data();
      setListing(listingData);

      const ownerDoc = await getDoc(doc(db, "users", listingData.ownerId));
      if (ownerDoc.exists()) {
        setOwner(ownerDoc.data());
      }

      const currentUser = auth.currentUser;
      if (currentUser) {
        setLiked(listingData.likes?.includes(currentUser.uid) || false);
        setSaved(listingData.savedBy?.includes(currentUser.uid) || false);
      }

      await updateDoc(listingDoc.ref, {
        views: (listingData.views || 0) + 1,
      });
    } catch (error) {
      console.error("Error fetching listing:", error);
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLike = useCallback(async () => {
    if (!auth.currentUser || !listingId) return;
    try {
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, where("postId", "==", listingId));
      const querySnapshot = await getDocs(q);
      const listingDocRef = querySnapshot.docs[0]?.ref;
      if (!listingDocRef) return;
      const newLikedState = !liked;
      setLiked(newLikedState);
      await updateDoc(listingDocRef, {
        likes: newLikedState
          ? arrayUnion(auth.currentUser.uid)
          : arrayRemove(auth.currentUser.uid),
      });
    } catch (error) {
      console.error("Error updating like:", error);
      setLiked(!liked); // Revert on error
    }
  }, [liked, listingId]);

  const handleSave = useCallback(async () => {
    if (!auth.currentUser || !listingId) return;
    try {
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, where("postId", "==", listingId));
      const querySnapshot = await getDocs(q);
      const listingDocRef = querySnapshot.docs[0]?.ref;
      if (!listingDocRef) return;
      const newSavedState = !saved;
      setSaved(newSavedState);
      await updateDoc(listingDocRef, {
        savedBy: newSavedState
          ? arrayUnion(auth.currentUser.uid)
          : arrayRemove(auth.currentUser.uid),
      });
    } catch (error) {
      console.error("Error updating save:", error);
      setSaved(!saved); // Revert on error
    }
  }, [saved, listingId]);

  const handleShare = async () => {
    if (!listing) return;
    try {
      await Share.share({
        message: `Check out this listing: ${listing.title}\n\n${listing.description}\n\nAvailable on SwipeX!`,
        url: "https://swipex.app",
        title: listing.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleMessage = useCallback(() => {
    if (!listing?.ownerId) return;
    router.push({
      pathname: "/chat/[userId]",
      params: {
        userId: listing.ownerId,
        username: owner?.username,
        userPhoto: listing.ownerProfilePicture,
      },
    });
  }, [listing, owner]);

  const openImageModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const renderCarouselItem = useCallback(
    ({ item }) => (
      <CarouselItem
        item={item}
        width={width}
        styles={styles}
        onImagePress={openImageModal}
      />
    ),
    [width, openImageModal, styles]
  );

  const renderConditionTag = () => {
    if (!listing?.condition) return null;
    const conditionColors = {
      New: colors.success,
      "Like New": "#38bdf8",
      Good: "#a3e635",
      Fair: "#fbbf24",
      Poor: colors.danger,
      "For Parts": "#a1a1aa",
    };
    return (
      <View
        style={[
          styles.conditionTag,
          {
            backgroundColor: conditionColors[listing.condition],
          },
        ]}
      >
        <Text style={styles.conditionText}>{listing.condition}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Listing not found.
        </Text>
      </View>
    );
  }

  const imageUrls = listing.images?.map((uri) => ({ url: uri })) || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false, title: listing.title }} />

      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Ionicons
              name="share-social-outline"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={saved ? colors.tint : colors.text}
            />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInUp.duration(500)}>
          <View style={styles.carouselContainer}>
            <FlatList
              data={listing.images || []}
              renderItem={renderCarouselItem}
              keyExtractor={(_, idx) => idx.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const slide = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveSlide(slide);
              }}
              style={{ width }}
              ListEmptyComponent={() => (
                <View style={[styles.carouselItem, { width }]}>
                  <Image
                    source={{
                      uri: "https://via.placeholder.com/400x300.png?text=No+Images+Available",
                    }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                </View>
              )}
            />
            {listing.images && listing.images.length > 1 && (
              <View style={styles.pagination}>
                {listing.images?.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor:
                          index === activeSlide ? colors.card : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        <View style={styles.content}>
          <Animated.View
            entering={FadeInDown.duration(500)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>
                {listing.title}
              </Text>
              <Text style={[styles.price, { color: colors.text }]}>
                Trade Only
              </Text>
            </View>
            <View style={styles.metaRow}>
              <View
                style={[styles.tag, { backgroundColor: colors.tint + "20" }]}
              >
                <Text style={[styles.categoryText, { color: colors.tint }]}>
                  {listing.itemCategory}
                </Text>
              </View>
              {renderConditionTag()}
            </View>
            <Text style={[styles.description, { color: colors.text }]}>
              {listing.description}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                flexDirection: "row",
                alignItems: "center",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.ownerRow}
              onPress={() =>
                router.push({
                  pathname: "/profile/[userId]",
                  params: { userId: listing.ownerId },
                })
              }
            >
              <Image
                source={{
                  uri:
                    listing.ownerProfilePicture ||
                    "https://via.placeholder.com/100",
                }}
                style={styles.ownerImage}
              />
              <View style={styles.ownerInfo}>
                <Text style={[styles.ownerName, { color: colors.text }]}>
                  {listing.ownerUsername}
                </Text>
                <Text style={[styles.ownerMeta, { color: colors.border }]}>
                  Active today • {listing.views} views
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.messageButton, { backgroundColor: colors.tint }]}
              onPress={handleMessage}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Looking For
            </Text>
            {listing.isOpenToAnyOffer ? (
              <View style={styles.anyOfferTag}>
                <Ionicons name="infinite" size={18} color={colors.success} />
                <Text style={[styles.anyOfferText, { color: colors.success }]}>
                  Open to any offers
                </Text>
              </View>
            ) : (
              <View style={styles.exchangeContainer}>
                {listing.exchangeFor?.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.exchangeTag,
                      { backgroundColor: colors.tint + "20" },
                    ]}
                  >
                    <Text style={[styles.exchangeText, { color: colors.tint }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {listing.tags?.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(500)}
              style={[styles.card, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Tags
              </Text>
              <View style={styles.tagsContainer}>
                {listing.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      { backgroundColor: colors.border + "30" },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.text }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInDown.delay(400).duration(500)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Location
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={18} color={colors.tint} />
              <Text style={[styles.locationText, { color: colors.text }]}>
                {listing.location?.city || "Auto-detect"}
              </Text>
            </View>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: listing.location?.coordinates?.lat || 5.56,
                longitude: listing.location?.coordinates?.lng || -0.205,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: listing.location?.coordinates?.lat || 5.56,
                  longitude: listing.location?.coordinates?.lng || -0.205,
                }}
              >
                <View style={[styles.marker, { backgroundColor: colors.tint }]}>
                  <Ionicons name="pricetag" size={16} color="#fff" />
                </View>
              </Marker>
            </MapView>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(500).duration(500)}
            style={[
              styles.card,
              styles.detailsSection,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.border }]}>
                Posted
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {listing.datePosted?.toDate?.().toLocaleDateString() ||
                  "Recently"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.border }]}>
                Status
              </Text>
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor:
                      listing.postStatus === "active"
                        ? colors.success + "20"
                        : colors.danger + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        listing.postStatus === "active"
                          ? colors.success
                          : colors.danger,
                    },
                  ]}
                >
                  {listing.postStatus}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <Modal visible={isModalVisible} transparent={true}>
        <StatusBar hidden />
        <ImageViewer
          imageUrls={imageUrls}
          index={activeSlide}
          enableSwipeDown={true}
          onSwipeDown={closeImageModal}
          renderIndicator={(currentIndex, allSize) => (
            <View style={styles.imageViewerIndicator}>
              <Text style={styles.imageViewerIndicatorText}>
                {`${currentIndex} / ${allSize}`}
              </Text>
            </View>
          )}
          renderHeader={() => (
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity onPress={closeImageModal}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          loadingRender={() => (
            <View style={styles.imageViewerLoading}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        />
      </Modal>

      <BlurView
        intensity={60}
        tint={isDark ? "dark" : "light"}
        style={[styles.actionBar, { borderTopColor: colors.border }]}
      >
        <TouchableOpacity
          onPress={handleLike}
          style={[
            styles.likeButton,
            { backgroundColor: isDark ? "#374151" : "#f3f4f6" },
          ]}
        >
          <AntDesign
            name={liked ? "heart" : "hearto"}
            size={24}
            color={liked ? colors.danger : colors.text}
          />
          <Text
            style={[
              styles.likeCount,
              { color: liked ? colors.danger : colors.text },
            ]}
          >
            {listing.likes?.length || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.offerButton, { backgroundColor: colors.tint }]}
          onPress={handleMessage}
        >
          <Text style={styles.offerButtonText}>Make an Offer</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  carouselContainer: {
    height: 350,
    marginBottom: -24,
  },
  carouselItem: {
    height: "100%",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 1,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    marginHorizontal: 16,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  content: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 16,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    flex: 1,
    paddingRight: 10,
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  conditionTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 0,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ownerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "700",
  },
  ownerMeta: {
    fontSize: 14,
    fontWeight: "400",
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  messageButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  anyOfferTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  anyOfferText: {
    fontSize: 16,
    fontWeight: "600",
  },
  exchangeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  exchangeTag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  exchangeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginTop: 8,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  detailsSection: {
    marginTop: 0,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginRight: 12,
  },
  likeCount: {
    marginLeft: 8,
    fontWeight: "700",
    minWidth: 20,
  },
  offerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  offerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  imageViewerHeader: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  imageViewerIndicator: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  imageViewerIndicatorText: {
    color: "#fff",
    fontSize: 16,
  },
  imageViewerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
