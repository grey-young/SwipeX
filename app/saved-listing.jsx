import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// A list of modern, pastel-like colors for the card backgrounds
const cardColors = [
  "#FFD700", // Yellow
  "#90EE90", // Green
  "#ADD8E6", // Blue
  "#F08080", // Light Coral
  "#DDA0DD", // Plum
];

// Reusable component for the listing cards
const ListingCard = memo(({ item, isDark, colors, index }) => {
  const router = useRouter();
  const images = Array.isArray(item.images)
    ? item.images
    : item.image
    ? [item.image]
    : [];
  const hasMultipleImages = images.length > 1;

  const handlePress = () => {
    if (item?.postId) {
      router.push(`/showListings/${item.postId}`);
    }
  };

  // Select a color from the predefined list
  const cardBackgroundColor = cardColors[index % cardColors.length];
  const placeholderImage = `https://placehold.co/100x100/${cardBackgroundColor.substring(
    1
  )}/000?text=${item.title.split(" ").slice(0, 2).join("%20")}`;

  return (
    <TouchableOpacity onPress={handlePress} style={styles.cardContainer}>
      <Animated.View
        entering={FadeInDown}
        style={[
          styles.card,
          {
            shadowColor: isDark ? "#0D1117" : "#000",
          },
        ]}
      >
        <Image
          source={{
            uri: images[0] || placeholderImage,
          }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title || "No Title"}
            </Text>

            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{item.views} views</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshIcon}>
          <Ionicons
            name="arrow-up-outline"
            size={24}
            color="black"
            style={{ transform: [{ rotateZ: "45deg" }] }}
          />
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
});

// Utility function to fetch multiple listings by their IDs
const fetchListings = async (listingIds) => {
  if (!listingIds || listingIds.length === 0) return [];

  const chunkArray = (arr, size) => {
    const res = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  };

  let allListings = [];
  const chunks = chunkArray(listingIds, 10);
  const fetchPromises = chunks.map((chunk) => {
    const listingsRef = collection(db, "listings");
    const q = query(listingsRef, where("postId", "in", chunk));
    return getDocs(q);
  });

  const querySnapshots = await Promise.all(fetchPromises);
  querySnapshots.forEach((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      allListings.push({
        ...doc.data(),
        price: Math.floor(Math.random() * 500) + 50,
        rating: Math.floor(Math.random() * 3) + 3,
      });
    });
  });
  return allListings;
};

export default function SavedListingScreen() {
  const [savedData, setSavedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const theme = useColorScheme();
  const isDark = theme === "dark";

  const colors = useMemo(() => {
    return {
      background: isDark ? "#0D1117" : "#F8F9FA",
      headerBackground: isDark ? "#0D1117" : "#FFFFFF",
      cardBackground: isDark ? "#1E2B3E" : "#FFFFFF",
      text: isDark ? "#E0E0E0" : "#2C3E50",
      subtleText: isDark ? "#A0A7B5" : "#6E7A8A",
      textOnImage: "#FFFFFF",
      subtleTextOnImage: "#EEEEEE",
      border: isDark ? "#3A4550" : "#E5E5E5",
      tint: isDark ? "#81c4e6" : "#007AFF",
    };
  }, [isDark]);

  const fetchSavedListings = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const user = docSnap.data();
        const savedListings = await fetchListings(user.savedListings);
        setSavedData(savedListings);
      } else {
        setSavedData([]);
      }
    } catch (e) {
      console.error("Error fetching saved listings:", e);
      setSavedData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedListings();
  }, [fetchSavedListings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSavedListings();
  }, [fetchSavedListings]);

  const renderCard = useCallback(
    ({ item, index }) => (
      <ListingCard item={item} isDark={isDark} colors={colors} index={index} />
    ),
    [isDark, colors]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.headerBackground}
      />
      <View
        style={[styles.header, { backgroundColor: colors.headerBackground }]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Saved Listings
        </Text>
      </View>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <FlatList
          key={savedData.length}
          data={savedData}
          renderItem={renderCard}
          keyExtractor={(item) => item.postId}
          contentContainerStyle={styles.tabContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="heart-dislike-outline"
                size={80}
                color={colors.subtleText}
              />
              <Text style={[styles.emptyText, { color: colors.subtleText }]}>
                You have not saved any listings yet.
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    // textAlign: "center",
    //   flex: 2,
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5733",
  },
  tabContent: {
    padding: 15,
  },
  cardContainer: {
    marginBottom: 20,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  card: {
    height: 200,
    borderRadius: 24,
    overflow: "hidden", // Crucial for the image to respect the border radius
    position: "relative",
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardTextContent: {
    flex: 1,
    marginRight: 10,
    justifyContent: "flex-end",
  },
  specialOfferText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF", // Changed text color to white for better contrast
  },
  starRating: {
    flexDirection: "row",
    marginVertical: 8,
  },
  priceContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  cardImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  refreshIcon: {
    position: "absolute",
    top: 10, // Adjusted position to be inside padding
    right: 10, // Adjusted position to be inside padding
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1, // Ensure the icon is on top of the image and content
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
