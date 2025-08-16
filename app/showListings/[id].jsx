import { useColorScheme } from "@/hooks/useColorScheme";
import { auth, db } from "@/lib/firebase";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
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
import { memo, useCallback, useEffect, useRef, useState } from "react";
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
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// === Dribbble-Inspired Design Enhancements ===
// A more refined color palette with soft pastels and rich darks.
const COLORS = {
  light: {
    background: "#f8f9fa",
    card: "#ffffff",
    text: "#212529",
    secondaryText: "#6c757d",
    border: "#dee2e6",
    primary: "#5c79e6",
    primaryLight: "#e9ecef",
    accent: "#10b981",
    danger: "#ef4444",
    success: "#22c55e",
  },
  dark: {
    background: "#121212",
    card: "#1e1e1e",
    text: "#f8f9fa",
    secondaryText: "#adb5bd",
    border: "#343a40",
    primary: "#7f98f5",
    primaryLight: "#343a40",
    accent: "#34d399",
    danger: "#f87171",
    success: "#4ade80",
  },
};

// Memoized carousel item for performance.
const CarouselItem = memo(({ item, width, onImagePress }) => {
  const [loading, setLoading] = useState(true);
  const video = useRef(null);
  const [status, setStatus] = useState({});

  const handlePress = () => {
    if (item.type === "image") {
      onImagePress(item.uri);
    } else {
      if (video.current) {
        status.isPlaying
          ? video.current.pauseAsync()
          : video.current.playAsync();
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.carouselItem, { width }]}
      activeOpacity={0.9}
      onPress={handlePress}
    >
      {loading && (
        <View style={styles.mediaLoadingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      {item.type === "image" ? (
        <Image
          source={{ uri: item.uri }}
          style={styles.carouselMedia}
          resizeMode="cover"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
      ) : (
        <Video
          ref={video}
          style={styles.carouselMedia}
          source={{ uri: item.uri }}
          useNativeControls={false}
          resizeMode={ResizeMode.COVER}
          isLooping
          onPlaybackStatusUpdate={(status) => {
            setStatus(status);
            if (status.isLoaded && loading) setLoading(false);
          }}
        />
      )}
      {item.type === "video" && !loading && (
        <View style={styles.videoOverlay}>
          <Ionicons
            name={status.isPlaying ? "pause" : "play"}
            size={36}
            color="#fff"
          />
        </View>
      )}
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

  // Reanimated shared values for animations
  const likeScale = useSharedValue(1);

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

      // Increment the view count
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

  // Handler for liking/unliking a listing with a spring animation
  const handleLike = useCallback(async () => {
    if (!auth.currentUser || !listingId) return;
    try {
      // Animate the button on press
      likeScale.value = withSpring(1.2, {}, () => {
        likeScale.value = withSpring(1);
      });

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

  // Define the animated style for the like button
  const animatedLikeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: likeScale.value }],
    };
  });

  // Handler for saving/unsaving a listing
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

  // Share functionality
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

  // Navigate to the chat screen with the owner
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

  // Handlers for the image viewer modal
  const openImageModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // Renders both image and video items in the carousel
  const renderCarouselItem = useCallback(
    ({ item }) => (
      <CarouselItem item={item} width={width} onImagePress={openImageModal} />
    ),
    [width, openImageModal]
  );

  // Renders the condition tag with dynamic colors
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

  // Renders the price or trade information
  const renderPrice = () => {
    if (!listing) return "Trade Only";
    if (listing.isOpenToAnyOffer) {
      return "Open to Offers";
    }
    if (listing.isOpenToCashOffer && listing.price) {
      return `$${listing.price.toFixed(2)}`;
    }
    return "Trade Only";
  };

  // Loading state UI
  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Error state UI
  if (!listing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Listing not found.
        </Text>
      </View>
    );
  }

  // Combines images and videos into a single list for the carousel
  const combinedMedia = [
    ...(listing?.images || []).map((uri) => ({ uri, type: "image" })),
    ...(listing?.videos || []).map((uri) => ({ uri, type: "video" })),
  ];
  const imageUrls = listing.images?.map((uri) => ({ url: uri })) || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false, title: listing.title }} />

      {/* Floating Header Actions */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerButton, { backgroundColor: colors.card + "50" }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={[
              styles.headerButton,
              { backgroundColor: colors.card + "50" },
            ]}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.headerButton,
              { backgroundColor: colors.card + "50" },
            ]}
          >
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={saved ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Carousel Section */}
        <Animated.View entering={FadeInUp.duration(600).springify()}>
          <View style={styles.carouselContainer}>
            <FlatList
              data={combinedMedia}
              renderItem={renderCarouselItem}
              keyExtractor={(item, idx) => `${item.uri}-${idx}`}
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
                      uri: "https://via.placeholder.com/400x300.png?text=No+Media+Available",
                    }}
                    style={styles.carouselMedia}
                    resizeMode="cover"
                  />
                </View>
              )}
            />
            {combinedMedia.length > 1 && (
              <View style={styles.pagination}>
                {combinedMedia?.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor:
                          index === activeSlide
                            ? colors.text
                            : colors.text + "50",
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Listing Details Card */}
          <Animated.View
            entering={FadeInDown.duration(600).springify()}
            style={[
              styles.listingDetailsCard,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>
                {listing.title}
              </Text>
              <Text style={[styles.price, { color: colors.text }]}>
                {renderPrice()}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <View
                style={[styles.tag, { backgroundColor: colors.primaryLight }]}
              >
                <Text style={[styles.categoryText, { color: colors.primary }]}>
                  {listing.itemCategory}
                </Text>
              </View>
              {renderConditionTag()}
            </View>
            <Text style={[styles.description, { color: colors.secondaryText }]}>
              {listing.description}
            </Text>
          </Animated.View>

          {/* Owner Info Card */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600).springify()}
            style={[
              styles.ownerCard,
              {
                backgroundColor: colors.card,
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
                <Text
                  style={[styles.ownerMeta, { color: colors.secondaryText }]}
                >
                  Active today • {listing.views} views
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.messageButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleMessage}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          {/* Looking For Card */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600).springify()}
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
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text
                      style={[styles.exchangeText, { color: colors.primary }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Tags Card */}
          {listing.tags?.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(600).springify()}
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
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Location Card */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600).springify()}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Location
            </Text>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-sharp"
                size={18}
                color={colors.primary}
              />
              <Text
                style={[styles.locationText, { color: colors.secondaryText }]}
              >
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
                <View
                  style={[styles.marker, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="pricetag" size={16} color="#fff" />
                </View>
              </Marker>
            </MapView>
          </Animated.View>

          {/* Details Card */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(600).springify()}
            style={[
              styles.card,
              styles.detailsSection,
              { backgroundColor: colors.card },
            ]}
          >
            <View
              style={[styles.detailRow, { borderBottomColor: colors.border }]}
            >
              <Text
                style={[styles.detailLabel, { color: colors.secondaryText }]}
              >
                Posted
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {listing.datePosted?.toDate?.().toLocaleDateString() ||
                  "Recently"}
              </Text>
            </View>
            <View
              style={[styles.detailRow, { borderBottomColor: colors.border }]}
            >
              <Text
                style={[styles.detailLabel, { color: colors.secondaryText }]}
              >
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

          {/* Comments Section */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(600).springify()}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Comments
            </Text>
            {listing.comments && listing.comments.length > 0 ? (
              // This is where you would map through and render comments
              <Text style={{ color: colors.text }}>
                Comments will be displayed here.
              </Text>
            ) : (
              <Text style={{ color: colors.secondaryText }}>
                No comments yet. Be the first to comment!
              </Text>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Image Viewer Modal */}
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

      {/* Bottom Action Bar */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[styles.actionBar, { borderTopColor: colors.border }]}
      >
        <Animated.View style={animatedLikeStyle}>
          <TouchableOpacity
            onPress={handleLike}
            style={[
              styles.likeButton,
              { backgroundColor: isDark ? "#343a40" : "#e9ecef" },
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
        </Animated.View>
        <TouchableOpacity
          style={[styles.offerButton, { backgroundColor: colors.primary }]}
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
  headerContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    padding: 10,
    borderRadius: 99,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  carouselContainer: {
    height: 400, // Increased height for more visual impact
  },
  carouselItem: {
    height: "100%",
  },
  carouselMedia: {
    width: "100%",
    height: "100%",
  },
  mediaLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 1,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    padding: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  content: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 24,
    backgroundColor: "transparent",
  },
  card: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  listingDetailsCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
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
    fontSize: 24,
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
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
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
    borderWidth: 2,
    borderColor: "white",
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: "700",
  },
  ownerMeta: {
    fontSize: 14,
    fontWeight: "400",
  },
  messageButton: {
    padding: 12,
    borderRadius: 14,
  },
  sectionTitle: {
    fontSize: 22,
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
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
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
