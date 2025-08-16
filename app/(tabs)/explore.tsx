import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Define the listing type based on your data structure
type ListingItem = {
  id: string;
  postId: string;
  ownerId: string;
  ownerUsername: string;
  ownerProfilePicture?: string;
  title: string;
  description: string;
  itemCategory: string;
  condition: string;
  images: string[];
  videos: string[];
  location: {
    region: string;
    city: string;
    coordinates: any;
  };
  exchangeFor: string[];
  tags: string[];
  price: number | null;
  isOpenToAnyOffer: boolean;
  isOpenToCashOffer: boolean;
  postStatus: string;
  datePosted: any;
  lastUpdated: any;
  likes: string[];
  savedBy: string[];
  views: number;
  comments: any[];
};

// Categories based on your data structure
const categories = [
  { id: "all", name: "All" },
  { id: "electronics", name: "Electronics" },
  { id: "furniture", name: "Furniture" },
  { id: "clothing", name: "Clothing" },
  { id: "books", name: "Books" },
  { id: "vehicles", name: "Vehicles" },
  { id: "instruments", name: "Instruments" },
  { id: "collectibles", name: "Collectibles" },
];

export default function Discover() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Define a new dark-themed color palette inspired by the image
  const colors = {
    background: "#121212",
    headerText: "#E0E0E0",
    subtleText: "#888888",
    cardBackground: "#1D1D1D",
    inputBackground: "#242424",
    inputBorder: "#333333",
    primary: "#BB86FC", // A modern, rich purple
    secondary: "#03DAC6", // A vibrant accent color
    cardShadow: "rgba(0,0,0,0.4)",
  };

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [filteredData, setFilteredData] = useState<ListingItem[]>([]);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const listingsRef = collection(db, "listings");
      const querySnapshot = await getDocs(listingsRef);

      const fetchedListings: ListingItem[] = [];
      querySnapshot.forEach((doc) => {
        fetchedListings.push({
          id: doc.id,
          ...doc.data(),
        } as ListingItem);
      });

      // Sort the listings in-memory by datePosted
      fetchedListings.sort((a, b) => b.datePosted - a.datePosted);

      setListings(fetchedListings);
      setFilteredData(fetchedListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    let result = [...listings];

    if (selectedCategory !== "all") {
      result = result.filter(
        (item) =>
          item.itemCategory.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.tags &&
            item.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    setFilteredData(result);
  }, [selectedCategory, searchQuery, listings]);

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const Card = ({ item }: { item: ListingItem }) => {
    const animatedScale = useSharedValue(1);

    const handlePressIn = () => {
      animatedScale.value = withSpring(0.95, { damping: 10, stiffness: 100 });
    };
    const handlePressOut = () => {
      animatedScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    };

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: animatedScale.value }],
      };
    });

    const handleCardPress = () => {
      if (item?.postId) {
        router.push(`/showListings/${item.postId}`);
      }
    };

    const getPriceOrExchangeTag = () => {
      // Priority 1: Check for exchangeFor array
      if (item.exchangeFor && item.exchangeFor.length > 0) {
        return (
          <View style={styles.tradeOverlay}>
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={styles.tradeGradient}
            >
              <Text style={styles.tradeOverlayText} numberOfLines={1}>
                Trade for {item.exchangeFor[0]}
              </Text>
            </LinearGradient>
          </View>
        );
      }
      // Priority 2: Check for price being 0
      if (item.price === 0) {
        return (
          <View style={styles.tradeOverlay}>
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={styles.tradeGradient}
            >
              <Text style={styles.tradeOverlayText}>Free</Text>
            </LinearGradient>
          </View>
        );
      }
      // Priority 3: Check for any other price
      if (item.price !== null) {
        return (
          <View style={styles.tradeOverlay}>
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={styles.tradeGradient}
            >
              <Text style={styles.tradeOverlayText}>${item.price}</Text>
            </LinearGradient>
          </View>
        );
      }
      return null;
    };

    return (
      <Animated.View
        entering={FadeIn.delay(100)}
        exiting={FadeOut}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          onPress={handleCardPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
          style={styles.card}
        >
          <Animated.View
            style={[
              animatedStyle,
              styles.cardInner,
              {
                backgroundColor: colors.cardBackground,
                shadowColor: colors.cardShadow,
              },
            ]}
          >
            <View style={styles.imageContainer}>
              {item.images.length > 0 ? (
                <Image
                  source={{ uri: item.images[0] }}
                  style={styles.cardImage}
                />
              ) : (
                <View style={[styles.cardImage, styles.noImage]}>
                  <Ionicons
                    name="image-outline"
                    size={40}
                    color={colors.subtleText}
                  />
                </View>
              )}
              {getPriceOrExchangeTag()}
            </View>
            <View style={styles.cardContent}>
              <Text
                style={[styles.cardTitle, { color: colors.headerText }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[styles.cardCategory, { color: colors.subtleText }]}>
                {item.itemCategory}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.cardStats}>
                  <View style={styles.statItem}>
                    <Ionicons
                      name="heart-outline"
                      size={16}
                      color={colors.subtleText}
                    />
                    <Text
                      style={[styles.statText, { color: colors.subtleText }]}
                    >
                      {item.likes.length}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons
                      name="eye-outline"
                      size={16}
                      color={colors.subtleText}
                    />
                    <Text
                      style={[styles.statText, { color: colors.subtleText }]}
                    >
                      {item.views}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Text style={[styles.locationText, { color: colors.subtleText }]}>
            Your location
          </Text>
          <View style={styles.locationDetail}>
            <Text style={[styles.locationName, { color: colors.headerText }]}>
              Los Angeles, CA
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.headerText} />
          </View>
        </View>
        <Ionicons
          name="notifications-outline"
          size={28}
          color={colors.headerText}
        />
      </View>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.inputBackground },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.subtleText}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.headerText }]}
          placeholder="Search items..."
          placeholderTextColor={colors.subtleText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={colors.subtleText}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                {
                  backgroundColor:
                    selectedCategory === category.id
                      ? colors.primary
                      : colors.inputBackground,
                },
              ]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  {
                    color:
                      selectedCategory === category.id
                        ? colors.headerText
                        : colors.subtleText,
                  },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtleText }]}>
            Discovering amazing items...
          </Text>
        </View>
      ) : (
        <>
          {filteredData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={60}
                color={colors.subtleText}
              />
              <Text style={[styles.emptyTitle, { color: colors.headerText }]}>
                No items found
              </Text>
              <Text style={[styles.emptyText, { color: colors.subtleText }]}>
                Try a different search term or category.
              </Text>
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={fetchListings}
              >
                <Text style={styles.refreshButtonText}>Refresh Listings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              renderItem={({ item }) => <Card item={item} />}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  locationContainer: {
    flexDirection: "column",
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  locationDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationName: {
    fontSize: 22,
    fontWeight: "700",
    marginRight: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginHorizontal: 24,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  clearButton: {
    padding: 5,
  },
  categoriesContainer: {
    paddingVertical: 15,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  card: {
    width: (width - 48) / 2,
    marginBottom: 20,
  },
  cardInner: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  imageContainer: {
    height: 160,
    position: "relative",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noImage: {
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  tradeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tradeGradient: {
    height: 50,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tradeOverlayText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
