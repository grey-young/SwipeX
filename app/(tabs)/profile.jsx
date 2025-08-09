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
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";

// Reusable component for the listing cards
const ListingCard = memo(({ item, isDark, backgroundColor, shadowColor }) => {
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

  return (
    <TouchableOpacity onPress={handlePress} style={{ width: "48%" }}>
      <Animated.View
        entering={FadeInDown}
        style={[
          styles.card,
          {
            backgroundColor: backgroundColor,
            shadowColor: shadowColor, // Passed as a prop
            elevation: shadowColor ? 5 : 0, // No elevation if no shadow
          },
        ]}
      >
        <Image
          source={{
            uri: images[0],
          }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        {hasMultipleImages && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={14} color="#fff" />
            <Text style={styles.imageCountText}>{images.length}</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text
            style={[styles.cardTitle, { color: isDark ? "#fff" : "#ffffffff" }]}
            numberOfLines={1}
          >
            {item.title || "No Title"}
          </Text>
          <Text
            style={[styles.cardPrice, { color: isDark ? "#aaa" : "#ffffffff" }]}
            numberOfLines={1}
          >
            {item.views} views
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [listingsData, setListingsData] = useState([]);
  const [savedData, setSavedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const layout = useWindowDimensions();
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === "dark";

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "listings", title: "Your Listings" },
    { key: "saved", title: "Saved" },
    { key: "wishlist", title: "Wishlist" },
  ]);

  // Define color palette based on theme - simplified for a uniform look
  const colors = useMemo(() => {
    const mainBackground = isDark ? "#0D1117" : "#F8F9FA";
    return {
      background: mainBackground,
      text: isDark ? "#E0E0E0" : "#2C3E50",
      subtleText: isDark ? "#A0A7B5" : "#6E7A8A",
      border: isDark ? "#3A4550" : "#E5E5E5",
      tint: isDark ? "#A7D6F4" : "#007AFF",
      shadow: null, // No shadow for a flat design
    };
  }, [isDark]);

  const fetchListings = useCallback(async (listingIds) => {
    if (!listingIds || listingIds.length === 0) return [];

    // Chunking array to avoid Firestore query limitations
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
        allListings.push(doc.data());
      });
    });
    return allListings;
  }, []);

  const fetchUserData = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      setLoadingSaved(false);
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const user = docSnap.data();
        setUserData(user);

        // Fetch user's own listings
        const userListings = await fetchListings(user.listings);
        setListingsData(userListings);

        // Fetch user's saved listings
        const userSavedListings = await fetchListings(user.savedListings);
        setSavedData(userSavedListings);
      } else {
        setUserData(null);
        setListingsData([]);
        setSavedData([]);
      }
    } catch (e) {
      console.error("Error fetching user data or listings:", e);
      setUserData(null);
      setListingsData([]);
      setSavedData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingSaved(false);
    }
  }, [fetchListings]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [fetchUserData]);

  // Render function for the FlatList items
  const renderCard = useCallback(
    ({ item }) => (
      <ListingCard
        item={item}
        isDark={isDark}
        backgroundColor={colors.background}
        shadowColor={colors.shadow}
      />
    ),
    [isDark, colors.background, colors.shadow]
  );

  const ListingsRoute = () =>
    loading ? (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    ) : (
      <FlatList
        data={listingsData}
        renderItem={renderCard}
        keyExtractor={(item) => item.postId}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: colors.subtleText }]}>
              You have no listings yet.
            </Text>
          </View>
        )}
      />
    );

  const SavedRoute = () =>
    loadingSaved ? (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    ) : (
      <FlatList
        data={savedData}
        renderItem={renderCard}
        keyExtractor={(item) => item.postId}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: colors.subtleText }]}>
              You have not saved any listings.
            </Text>
          </View>
        )}
      />
    );

  const WishlistRoute = () => (
    <FlatList
      data={userData?.wishlists || []}
      renderItem={({ item }) => (
        <View style={{ width: "100%" }}>
          <Text style={[styles.wishlistText, { color: colors.subtleText }]}>
            • {item}
          </Text>
        </View>
      )}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
        />
      }
      ListEmptyComponent={() => (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.subtleText }]}>
            Your wishlist is empty.
          </Text>
        </View>
      )}
    />
  );

  const renderScene = SceneMap({
    listings: ListingsRoute,
    saved: SavedRoute,
    wishlist: WishlistRoute,
  });

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: colors.tint,
        height: 2,
      }}
      style={[styles.tabBar, { backgroundColor: colors.background }]}
      labelStyle={{ fontWeight: "600" }}
      activeColor={colors.text}
      inactiveColor={colors.subtleText}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <View
        style={[
          styles.profileSection,
          {
            backgroundColor: colors.background, // Use same background as container
            borderColor: colors.border,
            shadowColor: "transparent", // No shadow
            elevation: 0,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={styles.settingsIcon}
        >
          <Ionicons name="settings-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <Image
          source={{ uri: userData?.profilePic }}
          style={styles.profilePic}
        />
        <Text style={[styles.fullName, { color: colors.text }]}>
          {userData?.fullName}
        </Text>
        <Text style={[styles.username, { color: colors.subtleText }]}>
          @{userData?.username}
        </Text>
        {userData?.description && (
          <Text style={[styles.description, { color: colors.subtleText }]}>
            {userData?.description}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => router.push("/edit-profile")}
          style={[styles.editButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.editButtonText, { color: colors.text }]}>
            Edit Profile
          </Text>
        </TouchableOpacity>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsIcon: {
    position: "absolute",
    top: 15,
    right: 20,
    zIndex: 10,
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomWidth: 0,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  fullName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 8,
  },
  description: {
    textAlign: "center",
    marginHorizontal: 10,
    marginTop: 8,
    fontSize: 14,
  },
  editButton: {
    marginTop: 15,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
  },
  editButtonText: {
    fontWeight: "600",
  },
  tabBar: {
    elevation: 0,
    borderBottomWidth: 1,
  },
  tabContent: {
    padding: 10,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    height: 200,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    borderRadius: 16,
  },
  imageCountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCountText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "bold",
  },
  cardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  cardPrice: {
    fontSize: 14,
    color: "#eee",
  },
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistText: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
