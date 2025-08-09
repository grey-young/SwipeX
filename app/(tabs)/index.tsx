import { auth, db } from "@/lib/firebase"; // Assuming these are correctly configured
import { Ionicons } from "@expo/vector-icons";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, { FadeIn, Layout } from "react-native-reanimated";

const { height, width } = Dimensions.get("window");

// Mocking useColorScheme for standalone runnable code
const mockUseColorScheme = () => ({
  isDark: false,
});
const useColorScheme =
  typeof useColorScheme !== "undefined" ? useColorScheme : mockUseColorScheme;

// A simple in-memory cache for user data to avoid redundant Firestore reads.
const userProfileCache = new Map();

// Helper function to fetch user data and use the cache
const fetchUser = async (userId) => {
  if (userProfileCache.has(userId)) {
    return userProfileCache.get(userId);
  }

  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    userProfileCache.set(userId, userData); // Cache the fetched data
    return userData;
  }

  return null;
};

// A component to manage and display a single comment and its replies
const CommentItem = ({ comment, colors, currentUser, onReply, onLike }) => {
  const [hasLiked, setHasLiked] = useState(
    comment.likes?.includes(currentUser?.uid)
  );
  const [likeCount, setLikeCount] = useState(comment.likes?.length || 0);
  const [commenterData, setCommenterData] = useState(null);

  // Fetch the commenter's profile data when the component mounts
  useEffect(() => {
    const loadUserData = async () => {
      const user = await fetchUser(comment.userId);
      if (user) {
        setCommenterData(user);
      }
    };
    loadUserData();
  }, [comment.userId]);

  const handleLike = () => {
    Vibration.vibrate(50);
    setHasLiked((prev) => !prev);
    setLikeCount((prev) => (hasLiked ? prev - 1 : prev + 1));
    onLike(comment.commentId, hasLiked);
  };

  return (
    <View style={styles.commentItem}>
      <Image
        source={{
          uri:
            commenterData?.profilePic ||
            "https://via.placeholder.com/150.png?text=Profile",
        }}
        style={styles.commentProfilePic}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUsername, { color: colors.text }]}>
            @{commenterData?.username || "Anonymous"}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.text }]}>
          {comment.text}
        </Text>
        <View style={styles.commentActions}>
          <TouchableOpacity
            onPress={handleLike}
            style={styles.commentActionButton}
          >
            <Ionicons
              name={hasLiked ? "heart" : "heart-outline"}
              size={16}
              color={hasLiked ? colors.like : colors.subtleText}
            />
            <Text
              style={[styles.commentActionText, { color: colors.subtleText }]}
            >
              {likeCount > 0 ? likeCount : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onReply(comment)}
            style={styles.commentActionButton}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color={colors.subtleText}
            />
            <Text
              style={[styles.commentActionText, { color: colors.subtleText }]}
            >
              Reply
            </Text>
          </TouchableOpacity>
        </View>
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.commentId}
                comment={reply}
                colors={colors}
                currentUser={currentUser}
                onReply={onReply}
                onLike={onLike}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// A component to manage and display comments
const CommentsModal = ({ isVisible, onClose, listingId, colors }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const currentUser = auth.currentUser;
  const keyboardHeight = useRef(0);

  // Effect to fetch comments whenever the modal becomes visible
  useEffect(() => {
    if (!isVisible || !listingId) return;
    const fetchComments = async () => {
      setLoading(true);
      try {
        const listingDocRef = doc(db, "listings", listingId);
        const docSnap = await getDoc(listingDocRef);
        if (docSnap.exists() && docSnap.data().comments) {
          setComments(docSnap.data().comments);
        } else {
          setComments([]); // Handle case where there are no comments
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [isVisible, listingId]);

  // Recursively find and modify a comment or its reply
  const findCommentAndModify = (commentsArray, commentId, modifier) => {
    return commentsArray.map((comment) => {
      if (comment.commentId === commentId) {
        return modifier(comment);
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: findCommentAndModify(comment.replies, commentId, modifier),
        };
      }
      return comment;
    });
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    Vibration.vibrate(50);
    const commentData = {
      commentId: new Date().getTime().toString(),
      text: newComment.trim(),
      userId: currentUser.uid,
      timestamp: new Date().toISOString(),
      likes: [],
      replies: [],
    };

    try {
      const listingDocRef = doc(db, "listings", listingId);
      let updatedComments;

      if (replyTo) {
        // Find the parent comment and add the reply to its replies array
        const newComments = findCommentAndModify(
          comments,
          replyTo.commentId,
          (parentComment) => {
            return {
              ...parentComment,
              replies: [...parentComment.replies, commentData],
            };
          }
        );
        updatedComments = newComments;
        setReplyTo(null);
      } else {
        // Add a new top-level comment
        updatedComments = [commentData, ...comments];
      }

      await updateDoc(listingDocRef, {
        comments: updatedComments,
      });

      setComments(updatedComments);
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleLikeComment = async (commentId, hasLiked) => {
    if (!currentUser) return;

    const newComments = findCommentAndModify(comments, commentId, (comment) => {
      const updatedLikes = hasLiked
        ? comment.likes.filter((uid) => uid !== currentUser.uid)
        : [...comment.likes, currentUser.uid];
      return { ...comment, likes: updatedLikes };
    });

    try {
      const listingDocRef = doc(db, "listings", listingId);
      await updateDoc(listingDocRef, {
        comments: newComments,
      });
      setComments(newComments);
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleReply = useCallback((comment) => {
    setReplyTo(comment);
    Vibration.vibrate(10);
  }, []);

  const clearReply = () => {
    setReplyTo(null);
    setNewComment("");
    Vibration.vibrate(10);
  };

  const onGestureEvent = ({ nativeEvent }) => {
    if (nativeEvent.translationY > 100) {
      onClose();
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      transparent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={
            Platform.OS === "ios" ? 0 : -keyboardHeight.current
          }
        >
          <PanGestureHandler onGestureEvent={onGestureEvent}>
            <Animated.View
              style={[
                styles.commentsBox,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.commentsHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.grabber} />
                <Text style={[styles.commentsTitle, { color: colors.text }]}>
                  Comments
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.subtleText} />
                </TouchableOpacity>
              </View>
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.loading}
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <FlatList
                  data={comments}
                  keyExtractor={(item) => item.commentId}
                  renderItem={({ item }) => (
                    <CommentItem
                      comment={item}
                      colors={colors}
                      currentUser={currentUser}
                      onReply={handleReply}
                      onLike={handleLikeComment}
                    />
                  )}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}
              <View
                style={[
                  styles.commentInputContainer,
                  { borderTopColor: colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  {replyTo && (
                    <View
                      style={[
                        styles.replyingTo,
                        {
                          backgroundColor: colors.card,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.text }}>
                        Replying to @{replyTo.userUsername}
                      </Text>
                      <TouchableOpacity onPress={clearReply}>
                        <Ionicons
                          name="close"
                          size={16}
                          color={colors.subtleText}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  <TextInput
                    style={[
                      styles.commentInput,
                      { color: colors.text, backgroundColor: colors.card },
                    ]}
                    placeholder={
                      replyTo
                        ? `Add a reply to @${replyTo.userUsername}...`
                        : "Add a comment..."
                    }
                    placeholderTextColor={colors.subtleText}
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                  />
                </View>
                <TouchableOpacity
                  onPress={handlePostComment}
                  style={{ paddingLeft: 10 }}
                >
                  <Ionicons name="send" size={24} color={colors.tint} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </PanGestureHandler>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

// Memoized and animated component for each listing
const ListingItem = memo(
  ({ item, isCurrent, colors, onCommentPress, onLikePress, currentUser }) => {
    const [hasLiked, setHasLiked] = useState(
      item.likes?.includes(currentUser?.uid)
    );
    const [likeCount, setLikeCount] = useState(item.likes?.length || 0);
    const [isSaved, setIsSaved] = useState(false);
    const imageListRef = useRef(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Check if the listing is saved by the current user
    useEffect(() => {
      if (!currentUser) return;
      const checkSavedStatus = async () => {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const savedListings = userDoc.data().savedListings || [];
          // Use item.postId to check if the listing is saved
          setIsSaved(savedListings.includes(item.postId));
        }
      };
      checkSavedStatus();
    }, [currentUser, item.postId]);

    useEffect(() => {
      let timer;
      if (isCurrent && item.images && item.images.length > 1) {
        timer = setInterval(() => {
          setActiveImageIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % item.images.length;
            if (imageListRef.current) {
              imageListRef.current.scrollToIndex({
                animated: true,
                index: nextIndex,
              });
            }
            return nextIndex;
          });
        }, 3000);
      }
      return () => {
        if (timer) {
          clearInterval(timer);
        }
      };
    }, [isCurrent, item.images]);

    const handleLike = useCallback(() => {
      Vibration.vibrate(50);
      const isLiking = !hasLiked;
      setHasLiked(isLiking);
      setLikeCount((prev) => (isLiking ? prev + 1 : prev - 1));
      onLikePress(item.id, !isLiking);
    }, [hasLiked, item.id, onLikePress]);

    const handleSave = async () => {
      if (!currentUser) return;
      Vibration.vibrate(50);
      const userDocRef = doc(db, "users", currentUser.uid);
      const listingDocRef = doc(db, "listings", item.id);
      const newSavedStatus = !isSaved;
      setIsSaved(newSavedStatus);
      try {
        // Update the user's savedListings array with the item's postId
        await updateDoc(userDocRef, {
          savedListings: newSavedStatus
            ? arrayUnion(item.postId)
            : arrayRemove(item.postId),
        });

        // Also update the listing's savedBy array with the user's uid
        await updateDoc(listingDocRef, {
          savedBy: newSavedStatus
            ? arrayUnion(currentUser.uid)
            : arrayRemove(currentUser.uid),
        });
      } catch (error) {
        console.error("Error updating saved status:", error);
      }
    };

    const onScroll = (event) => {
      const slideSize = event.nativeEvent.layoutMeasurement.width;
      const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
      setActiveImageIndex(index);
    };

    const renderImage = useCallback(
      ({ item: imageUrl }) => (
        <View style={styles.imageSlide}>
          <Image
            source={{
              uri:
                imageUrl ||
                "https://via.placeholder.com/400x800.png?text=No+Image",
            }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      ),
      []
    );

    const images =
      item.images && item.images.length > 0
        ? item.images
        : ["https://via.placeholder.com/400x800.png?text=No+Image"];

    return (
      <View style={styles.listingContainer}>
        <FlatList
          ref={imageListRef}
          data={images}
          renderItem={renderImage}
          keyExtractor={(_, index) => `image-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ width, height }}
        />
        <View style={styles.overlay} />

        {isCurrent && (
          <Animated.View style={styles.content} layout={Layout.springify()}>
            {/* Left side content */}
            <View style={styles.leftContent}>
              <View style={styles.userHeader}>
                <Image
                  source={{
                    uri:
                      item.ownerProfilePicture ||
                      "https://via.placeholder.com/150.png?text=Profile",
                  }}
                  style={styles.profilePic}
                />
                <View>
                  <Animated.Text
                    entering={FadeIn.delay(200).duration(500)}
                    style={[styles.username, { color: colors.textOnImage }]}
                    numberOfLines={1}
                  >
                    @{item.ownerUsername}
                  </Animated.Text>
                  <Animated.Text
                    entering={FadeIn.delay(300).duration(500)}
                    style={[styles.description, { color: colors.textOnImage }]}
                    numberOfLines={3}
                  >
                    {item.description}
                  </Animated.Text>
                </View>
              </View>
              <View style={styles.detailsRow}>
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color={colors.textOnImage}
                />
                <Text
                  style={[styles.detailText, { color: colors.textOnImage }]}
                >
                  {item.itemCategory}
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.textOnImage}
                />
                <Text
                  style={[styles.detailText, { color: colors.textOnImage }]}
                >
                  {item.location?.city || "Anywhere"}
                </Text>
              </View>
            </View>

            {/* Right side interactions */}
            <View style={styles.rightContent}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLike}
              >
                <Ionicons
                  name={hasLiked ? "heart" : "heart-outline"}
                  size={28}
                  color={hasLiked ? colors.like : colors.textOnImage}
                />
                <Text
                  style={[styles.actionText, { color: colors.textOnImage }]}
                >
                  {likeCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSave}
              >
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={28}
                  color={isSaved ? colors.tint : colors.textOnImage}
                />
                <Text
                  style={[styles.actionText, { color: colors.textOnImage }]}
                >
                  {item.savedBy?.length || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onCommentPress(item.id)}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={28}
                  color={colors.textOnImage}
                />
                <Text
                  style={[styles.actionText, { color: colors.textOnImage }]}
                >
                  {item.comments?.length || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        {images.length > 1 && (
          <View style={styles.paginationContainer}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor:
                      activeImageIndex === index
                        ? colors.textOnImage
                        : "rgba(255, 255, 255, 0.5)",
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  }
);

export default function Index() {
  const { isDark } = useColorScheme();
  const colors = {
    background: isDark ? "#000" : "#f0f2f5",
    textOnImage: "#fff",
    subtleText: isDark ? "#a0a0a0" : "#6b7280",
    overlay: "rgba(0,0,0,0.4)",
    loading: isDark ? "#fff" : "#000",
    like: "#ff4d4d",
    tint: isDark ? "#6366f1" : "#4f46e5",
    text: isDark ? "#f9fafb" : "#1f2937",
    card: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#374151" : "#e5e7eb",
  };

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [currentListingId, setCurrentListingId] = useState(null);
  const currentUser = auth.currentUser;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const fetchListings = useCallback(
    async (isRefresh = false) => {
      if (!hasMore && !isRefresh) return;
      try {
        setLoading(true);
        const listingsRef = collection(db, "listings");
        // NOTE: The `orderBy` clause requires a Firestore index on `datePosted`.
        // If you encounter an error, create this index in your Firebase console.
        let q = query(listingsRef, orderBy("datePosted", "desc"), limit(10));
        if (lastVisible && !isRefresh) {
          q = query(
            listingsRef,
            orderBy("datePosted", "desc"),
            startAfter(lastVisible),
            limit(10)
          );
        }

        const querySnapshot = await getDocs(q);
        const fetchedListings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (isRefresh) {
          setListings(fetchedListings);
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
          setHasMore(true);
        } else if (fetchedListings.length === 0) {
          setHasMore(false);
        } else {
          setListings((prevListings) => [...prevListings, ...fetchedListings]);
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        }
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [hasMore, lastVisible]
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Vibration.vibrate(50);
    fetchListings(true);
  }, [fetchListings]);

  const handleLikePress = useCallback(
    async (listingId, hasLiked) => {
      if (!currentUser) return;
      try {
        const listingDocRef = doc(db, "listings", listingId);
        await updateDoc(listingDocRef, {
          likes: hasLiked
            ? arrayRemove(currentUser.uid)
            : arrayUnion(currentUser.uid),
        });
      } catch (error) {
        console.error("Error updating like:", error);
      }
    },
    [currentUser]
  );

  const handleCommentPress = useCallback((listingId) => {
    setCurrentListingId(listingId);
    setIsCommentsModalVisible(true);
  }, []);

  const renderItem = ({ item, index }) => (
    <ListingItem
      item={item}
      isCurrent={index === currentIndex}
      colors={colors}
      onCommentPress={handleCommentPress}
      onLikePress={handleLikePress}
      currentUser={currentUser}
    />
  );

  const renderFooter = () => {
    if (!loading && !hasMore) {
      return (
        <View style={styles.endOfFeed}>
          <Text style={[styles.endOfFeedText, { color: colors.subtleText }]}>
            You've reached the end! ✨
          </Text>
        </View>
      );
    }
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={colors.loading}
          style={styles.footerLoader}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {loading && listings.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.loading} />
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          pagingEnabled
          onEndReached={fetchListings}
          onEndReachedThreshold={0.5}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
          windowSize={3}
          removeClippedSubviews={true}
        />
      )}
      <CommentsModal
        isVisible={isCommentsModalVisible}
        onClose={() => setIsCommentsModalVisible(false)}
        listingId={currentListingId}
        colors={colors}
      />
    </SafeAreaView>
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
  listingContainer: {
    width: width,
    height: height,
    justifyContent: "flex-end",
  },
  imageSlide: {
    width: width,
    height: height,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  content: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 16,
  },
  leftContent: {
    flex: 1,
    paddingRight: 10,
    paddingBottom: 20,
  },
  rightContent: {
    alignItems: "center",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    marginRight: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  actionText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footerLoader: {
    marginVertical: 20,
  },
  endOfFeed: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endOfFeedText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Modal and Comments Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  commentsBox: {
    width: "100%",
    height: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  grabber: {
    width: 40,
    height: 5,
    backgroundColor: "gray",
    borderRadius: 5,
    position: "absolute",
    top: 8,
    left: "50%",
    marginLeft: -20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  commentItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  commentProfilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  commentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  commentActionText: {
    marginLeft: 4,
    fontSize: 12,
  },
  commentUsername: {
    fontWeight: "bold",
    fontSize: 13,
  },
  commentText: {
    fontSize: 14,
  },
  repliesContainer: {
    marginLeft: 20,
    marginTop: 10,
  },
  replyingTo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 8,
    marginBottom: 5,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    height: 60,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
});
