import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { AVPlaybackStatus, Video } from "expo-av";
import * as Haptics from "expo-haptics";
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
  View,
  useColorScheme,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  Layout,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { height, width } = Dimensions.get("window");

// Types
type VideoRefs = {
  [key: string]: Video | null;
};

type MediaItem = {
  url: string;
  type: "image" | "video";
};

type Comment = {
  commentId: string;
  text: string;
  userId: string;
  timestamp: string;
  likes: string[];
  replies: Comment[];
  userUsername?: string;
};

type ListingItem = {
  id: string;
  postId: string;
  title?: string;
  description?: string;
  ownerUsername: string;
  ownerProfilePicture?: string;
  itemCategory?: string;
  location?: { city?: string };
  videos?: string[];
  images?: string[];
  likes?: string[];
  savedBy?: string[];
  comments?: Comment[];
  datePosted?: any;
};

// Cache
const userProfileCache = new Map<string, any>();

// Helper functions
const fetchUser = async (userId: string) => {
  if (userProfileCache.has(userId)) {
    return userProfileCache.get(userId);
  }

  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    userProfileCache.set(userId, userData);
    return userData;
  }

  return null;
};

// Components
const CommentItem = memo(
  ({
    comment,
    colors,
    currentUser,
    onReply,
    onLike,
  }: {
    comment: Comment;
    colors: any;
    currentUser: any;
    onReply: (comment: Comment) => void;
    onLike: (commentId: string, hasLiked: boolean) => void;
  }) => {
    const [hasLiked, setHasLiked] = useState(
      comment.likes?.includes(currentUser?.uid)
    );
    const [likeCount, setLikeCount] = useState(comment.likes?.length || 0);
    const [commenterData, setCommenterData] = useState<any>(null);

    useEffect(() => {
      const loadUserData = async () => {
        const user = await fetchUser(comment.userId);
        if (user) setCommenterData(user);
      };
      loadUserData();
    }, [comment.userId]);

    const handleLike = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          {comment.replies?.length > 0 && (
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
  }
);

const CommentsModal = memo(
  ({
    isVisible,
    onClose,
    listingId,
    colors,
  }: {
    isVisible: boolean;
    onClose: () => void;
    listingId: string | null;
    colors: any;
  }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const currentUser = auth.currentUser;
    const flatListRef = useRef<FlatList>(null);

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
            setComments([]);
          }
        } catch (error) {
          console.error("Error fetching comments:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchComments();
    }, [isVisible, listingId]);

    const findCommentAndModify = (
      commentsArray: Comment[],
      commentId: string,
      modifier: (comment: Comment) => Comment
    ): Comment[] => {
      return commentsArray.map((comment) => {
        if (comment.commentId === commentId) {
          return modifier(comment);
        }
        if (comment.replies?.length > 0) {
          return {
            ...comment,
            replies: findCommentAndModify(comment.replies, commentId, modifier),
          };
        }
        return comment;
      });
    };

    const handlePostComment = async () => {
      if (!newComment.trim() || !currentUser || !listingId) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const commentData: Comment = {
        commentId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: newComment.trim(),
        userId: currentUser.uid,
        timestamp: new Date().toISOString(),
        likes: [],
        replies: [],
      };

      try {
        const listingDocRef = doc(db, "listings", listingId);
        let updatedComments: Comment[];

        if (replyTo) {
          updatedComments = findCommentAndModify(
            comments,
            replyTo.commentId,
            (parent) => ({
              ...parent,
              replies: [...(parent.replies || []), commentData],
            })
          );
          setReplyTo(null);
        } else {
          updatedComments = [commentData, ...comments];
        }

        await updateDoc(listingDocRef, { comments: updatedComments });
        setComments(updatedComments);
        setNewComment("");

        if (flatListRef.current && !replyTo) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      } catch (error) {
        console.error("Error posting comment:", error);
      }
    };

    const handleLikeComment = async (commentId: string, hasLiked: boolean) => {
      if (!currentUser || !listingId) return;

      const newComments = findCommentAndModify(
        comments,
        commentId,
        (comment) => {
          const updatedLikes = hasLiked
            ? comment.likes.filter((uid) => uid !== currentUser.uid)
            : [...comment.likes, currentUser.uid];
          return { ...comment, likes: updatedLikes };
        }
      );

      try {
        const listingDocRef = doc(db, "listings", listingId);
        await updateDoc(listingDocRef, { comments: newComments });
        setComments(newComments);
      } catch (error) {
        console.error("Error liking comment:", error);
      }
    };

    const handleReply = useCallback(async (comment: Comment) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const user = await fetchUser(comment.userId);
      setReplyTo({ ...comment, userUsername: user?.username || "Anonymous" });
    }, []);

    const clearReply = () => {
      setReplyTo(null);
      setNewComment("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const onGestureEvent = ({ nativeEvent }: { nativeEvent: any }) => {
      if (nativeEvent.translationY > 100) onClose();
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
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.subtleText}
                    />
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
                    ref={flatListRef}
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
                    initialNumToRender={5}
                    maxToRenderPerBatch={5}
                    windowSize={5}
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
                          Replying to @{replyTo.userUsername || "Anonymous"}
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
                          ? `Add a reply to @${
                              replyTo.userUsername || "user"
                            }...`
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
                    disabled={!newComment.trim()}
                    style={{ paddingLeft: 10 }}
                  >
                    <Ionicons
                      name="send"
                      size={24}
                      color={
                        newComment.trim() ? colors.tint : colors.subtleText
                      }
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </PanGestureHandler>
          </KeyboardAvoidingView>
        </GestureHandlerRootView>
      </Modal>
    );
  }
);

const ListingItem = memo(
  ({
    item,
    isCurrent,
    colors,
    onCommentPress,
    onLikePress,
    currentUser,
  }: {
    item: ListingItem;
    isCurrent: boolean;
    colors: any;
    onCommentPress: (listingId: string) => void;
    onLikePress: (listingId: string, hasLiked: boolean) => void;
    currentUser: any;
  }) => {
    const [hasLiked, setHasLiked] = useState(
      item.likes?.includes(currentUser?.uid)
    );
    const [likeCount, setLikeCount] = useState(item.likes?.length || 0);
    const [isSaved, setIsSaved] = useState(false);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const videoRefs = useRef<VideoRefs>({});

    const scale = useSharedValue(0);
    const animatedHeartStyle = useAnimatedStyle(() => ({
      transform: [{ scale: Math.max(scale.value, 0) }],
      opacity: scale.value,
    }));

    const mediaToDisplay: MediaItem[] = [
      ...(item.videos?.map((url) => ({ url, type: "video" } as MediaItem)) ||
        []),
      ...(item.images?.map((url) => ({ url, type: "image" } as MediaItem)) ||
        []),
    ];

    const hasMultipleMedia = mediaToDisplay.length > 1;
    const needsTruncation = item.description && item.description.length > 100;

    useEffect(() => {
      return () => {
        Object.values(videoRefs.current).forEach((video) => {
          if (video) {
            video.stopAsync();
          }
        });
        videoRefs.current = {};
      };
    }, []);

    useEffect(() => {
      if (isCurrent) {
        const activeMedia = mediaToDisplay[activeMediaIndex];
        if (
          activeMedia?.type === "video" &&
          videoRefs.current[activeMedia.url]
        ) {
          videoRefs.current[activeMedia.url]?.playAsync();
        }
      } else {
        Object.values(videoRefs.current).forEach((video) => {
          if (video) {
            video.pauseAsync();
          }
        });
      }
    }, [isCurrent, activeMediaIndex, mediaToDisplay]);

    useEffect(() => {
      if (!currentUser) return;

      const checkSavedStatus = async () => {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const savedListings = userDoc.data().savedListings || [];
          setIsSaved(savedListings.includes(item.postId));
        }
      };
      checkSavedStatus();
    }, [currentUser, item.postId]);

    const handleLike = useCallback(
      (triggerHaptic = true) => {
        if (triggerHaptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const isLiking = !hasLiked;
        setHasLiked(isLiking);
        setLikeCount((prev) => (isLiking ? prev + 1 : prev - 1));
        onLikePress(item.id, !isLiking);
      },
      [hasLiked, item.id, onLikePress]
    );

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .onStart(() => {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withSpring(1, undefined, (finished) => {
          if (finished) scale.value = withSpring(0);
        });

        if (!hasLiked) {
          runOnJS(handleLike)(false);
        }
      });

    const handleSave = async () => {
      if (!currentUser) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const userDocRef = doc(db, "users", currentUser.uid);
      const listingDocRef = doc(db, "listings", item.id);
      const newSavedStatus = !isSaved;

      setIsSaved(newSavedStatus);
      try {
        await updateDoc(userDocRef, {
          savedListings: newSavedStatus
            ? arrayUnion(item.postId)
            : arrayRemove(item.postId),
        });
        await updateDoc(listingDocRef, {
          savedBy: newSavedStatus
            ? arrayUnion(currentUser.uid)
            : arrayRemove(currentUser.uid),
        });
      } catch (error) {
        console.error("Error updating saved status:", error);
      }
    };

    const onMediaScroll = useCallback((event: any) => {
      const slideSize = event.nativeEvent.layoutMeasurement.width;
      const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
      setActiveMediaIndex(index);
    }, []);

    const renderMedia = useCallback(
      ({ item: media, index }: { item: MediaItem; index: number }) => {
        return (
          <GestureDetector gesture={doubleTap}>
            <View style={styles.mediaContainer}>
              {media.type === "video" ? (
                <Video
                  ref={(ref) => {
                    if (ref) {
                      videoRefs.current[media.url] = ref;
                    } else {
                      delete videoRefs.current[media.url];
                    }
                  }}
                  source={{ uri: media.url }}
                  style={styles.media}
                  resizeMode="cover"
                  isLooping
                  shouldPlay={isCurrent && index === activeMediaIndex}
                  useNativeControls={false}
                  onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                    if (
                      status.isLoaded &&
                      !status.isPlaying &&
                      isCurrent &&
                      index === activeMediaIndex
                    ) {
                      videoRefs.current[media.url]?.playAsync();
                    }
                  }}
                />
              ) : (
                <Image
                  source={{
                    uri:
                      media.url ||
                      "https://via.placeholder.com/400x800.png?text=No+Image",
                  }}
                  style={styles.media}
                  resizeMode="cover"
                />
              )}
              <Animated.View style={[styles.heartOverlay, animatedHeartStyle]}>
                <Ionicons name="heart" size={100} color="#fff" />
              </Animated.View>
            </View>
          </GestureDetector>
        );
      },
      [isCurrent, activeMediaIndex, doubleTap]
    );

    return (
      <View style={styles.listingContainer}>
        <FlatList
          data={
            mediaToDisplay.length > 0
              ? mediaToDisplay
              : [{ url: "", type: "image" }]
          }
          renderItem={renderMedia}
          keyExtractor={(_, index) => `media-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onMediaScroll}
          scrollEventThrottle={16}
          style={styles.mediaList}
        />

        <View style={styles.overlay} />

        {isCurrent && (
          <Animated.View style={styles.content} layout={Layout.springify()}>
            <View style={styles.leftContent}>
              <View style={styles.userHeader}>
                <View>
                  <Animated.Text
                    entering={FadeIn.delay(200).duration(500)}
                    style={[styles.username, { color: colors.textOnImage }]}
                    numberOfLines={1}
                  >
                    @{item.ownerUsername}
                  </Animated.Text>
                </View>
              </View>

              <View style={styles.textContainer}>
                {item.title && (
                  <Text style={[styles.title, { color: colors.textOnImage }]}>
                    {item.title}
                  </Text>
                )}

                <Text
                  style={[styles.description, { color: colors.textOnImage }]}
                  numberOfLines={expanded ? undefined : 3}
                >
                  {item.description}
                </Text>

                {needsTruncation && (
                  <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                    <Text style={[styles.readMore, { color: colors.tint }]}>
                      {expanded ? "Show Less" : "Read More"}
                    </Text>
                  </TouchableOpacity>
                )}
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

            <View style={styles.rightContent}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => console.log("Navigate to profile")}
              >
                <Image
                  source={{
                    uri:
                      item.ownerProfilePicture ||
                      "https://via.placeholder.com/150.png?text=Profile",
                  }}
                  style={styles.rightProfilePic}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLike()}
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
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onCommentPress(item.id);
                }}
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

        {hasMultipleMedia && (
          <View style={styles.paginationContainer}>
            {mediaToDisplay.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor:
                      activeMediaIndex === index
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [currentListingId, setCurrentListingId] = useState<string | null>(null);
  const currentUser = auth.currentUser;
  const flatListRef = useRef<FlatList>(null);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const fetchListings = useCallback(
    async (isRefresh = false) => {
      if (!hasMore && !isRefresh) return;

      try {
        setLoading(true);
        const listingsRef = collection(db, "listings");
        let q = query(listingsRef, orderBy("datePosted", "desc"), limit(5));

        if (lastVisible && !isRefresh) {
          q = query(
            listingsRef,
            orderBy("datePosted", "desc"),
            startAfter(lastVisible),
            limit(5)
          );
        }

        const querySnapshot = await getDocs(q);
        const fetchedListings = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as ListingItem)
        );

        if (isRefresh) {
          setListings(fetchedListings);
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
          setHasMore(true);
        } else if (fetchedListings.length === 0) {
          setHasMore(false);
        } else {
          setListings((prev) => [...prev, ...fetchedListings]);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchListings(true);
  }, [fetchListings]);

  const handleLikePress = useCallback(
    async (listingId: string, hasLiked: boolean) => {
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

  const handleCommentPress = useCallback((listingId: string) => {
    setCurrentListingId(listingId);
    setIsCommentsModalVisible(true);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: ListingItem; index: number }) => (
      <ListingItem
        item={item}
        isCurrent={index === currentIndex}
        colors={colors}
        onCommentPress={handleCommentPress}
        onLikePress={handleLikePress}
        currentUser={currentUser}
      />
    ),
    [currentIndex, colors, handleCommentPress, handleLikePress, currentUser]
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />

        {loading && listings.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.loading} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={listings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            snapToInterval={height}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            pagingEnabled
            onEndReached={fetchListings}
            onEndReachedThreshold={0.1}
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
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={5}
            removeClippedSubviews
          />
        )}

        <CommentsModal
          isVisible={isCommentsModalVisible}
          onClose={() => setIsCommentsModalVisible(false)}
          listingId={currentListingId}
          colors={colors}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
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
    width,
    height,
    justifyContent: "flex-end",
  },
  mediaList: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  mediaContainer: {
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 1,
    pointerEvents: "none",
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
    zIndex: 2,
    pointerEvents: "box-none",
  },
  leftContent: {
    flex: 1,
    paddingRight: 10,
    paddingBottom: 20,
    pointerEvents: "none",
  },
  textContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rightContent: {
    alignItems: "center",
    pointerEvents: "auto",
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
  rightProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
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
  },
  readMore: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  commentsBox: {
    width: "100%",
    height: "75%",
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
    zIndex: 3,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
});
