import { Ionicons } from "@expo/vector-icons";
import { deleteUser, onAuthStateChanged, signOut } from "firebase/auth";
import { deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Appearance,
  Button,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { auth, db } from "@/lib/firebase";
import { useRouter } from "expo-router";

export default function Settings() {
  const router = useRouter();
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());
  const isDark = colorScheme === "dark";

  // State for user data and settings
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    savedListings: [],
    wishlists: [],
    appAnnouncementAndUpdates: false,
    allowUsersToContactMeDirectly: true,
    showMyLocationOnPost: false,
  });

  // State for user profile information
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("Guest User");
  const [email, setEmail] = useState("not-signed-in@example.com");

  const [isDeleteAccountModalVisible, setDeleteAccountModalVisible] =
    useState(false);

  // Define colors based on the current theme for a professional look
  const colors = {
    background: isDark ? "#0d1117" : "#F4F4F9", // Lighter, modern off-white
    text: isDark ? "#E0E0E0" : "#2C3E50", // Soft white and a deep navy
    subtleText: isDark ? "#A0A7B5" : "#6E7A8A", // A muted gray for secondary text
    card: isDark ? "#1A222B" : "#FFFFFF", // Darker card for contrast, pure white for light
    border: isDark ? "#3A4550" : "#EBEBEB", // Subtle borders
    tint: isDark ? "#66C0F4" : "#4A90E2", // A vibrant blue for accents
    destructive: "#FF6347", // A clear, but not harsh, red
  };

  // Structured data for the settings page content
  const settingsData = [
    {
      title: "Account Settings",
      items: [
        {
          name: "Change Password",
          icon: "lock-closed-outline",
          onPress: () => {
            /* Navigate to password change screen */
          },
        },
        {
          name: "Change Email",
          icon: "mail-outline",
          onPress: () => {
            /* Navigate to email change screen */
          },
        },
        {
          name: "Two-Factor Authentication",
          icon: "shield-checkmark-outline",
          onPress: () => {
            /* Navigate to 2FA screen */
          },
        },
      ],
    },
    {
      title: "Personal Information",
      items: [
        {
          name: "Edit Profile",
          icon: "person-circle-outline",
          onPress: () => {
            router.push("/edit-profile");
          },
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          name: "App updates",
          icon: "megaphone-outline",
          onPress: () => toggleUserSetting("appAnnouncementAndUpdates"),
          isToggle: true,
          settingKey: "appAnnouncementAndUpdates",
        },
      ],
    },
    {
      title: "Privacy & Visibility",
      items: [
        {
          name: "Allow direct contact",
          icon: "chatbubbles-outline",
          onPress: () => toggleUserSetting("allowUsersToContactMeDirectly"),
          isToggle: true,
          settingKey: "allowUsersToContactMeDirectly",
        },
        {
          name: "Show location on posts",
          icon: "location-outline",
          onPress: () => toggleUserSetting("showMyLocationOnPost"),
          isToggle: true,
          settingKey: "showMyLocationOnPost",
        },
        {
          name: "Profile visibility",
          icon: "eye-outline",
          onPress: () => {
            /* Open a modal or navigate to visibility settings */
          },
        },
      ],
    },
    {
      title: "Saved Posts & History",
      items: [
        {
          name: "Saved Listings",
          icon: "bookmark-outline",
          rightText: `${userData.savedListings.length} items`,
          onPress: () => {
            /* Navigate to saved listings screen */
            router.push("/saved-listing");
          },
        },
        {
          name: "Wishlists",
          icon: "gift-outline",
          rightText: `${userData.wishlists.length} items`,
          onPress: () => {
            /* Navigate to wishlists screen */
          },
        },
        {
          name: "Trade History",
          icon: "time-outline",
          onPress: () => {
            /* Navigate to trade history screen */
          },
        },
      ],
    },
    {
      title: "App Preferences",
      items: [
        {
          name: "Language Selection",
          icon: "language-outline",
          onPress: () => {
            /* Navigate to language selection screen */
          },
        },

        {
          name: "Theme",
          icon: isDark ? "moon-outline" : "sunny-outline",
          rightText: isDark ? "Dark" : "Light",
        },
      ],
    },
    {
      title: "Help & Support",
      items: [
        {
          name: "Report a bug",
          icon: "bug-outline",
          onPress: () => {
            /* Open a support form or email client */
            router.push("/report-a-bug");
          },
        },
        {
          name: "Contact support",
          icon: "headset-outline",
          onPress: () => {
            /* Open a chat or contact form */
            router.push("/contact");
          },
        },
        {
          name: "FAQs",
          icon: "help-circle-outline",
          onPress: () => {
            /* Navigate to FAQ page */
            router.push("/faq");
          },
        },
        {
          name: "Community guidelines",
          icon: "document-text-outline",
          onPress: () => {
            /* Navigate to guidelines page */
            router.push("/community-guidelines");
          },
        },
        {
          name: "How it works",
          icon: "book-outline",
          onPress: () => {
            /* Navigate to educational page */
            router.push("/how-it-works");
          },
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          name: "Terms & Conditions",
          icon: "document-lock-outline",
          onPress: () => {
            /* Navigate to terms page */
            router.push("/terms-and-conditions");
          },
        },
        {
          name: "Privacy Policy",
          icon: "shield-checkmark-outline",
          onPress: () => {
            /* Navigate to privacy policy page */
            router.push("/privacy-and-policy");
          },
        },
      ],
    },
    {
      title: "Security & Account Management",
      items: [
        {
          name: "Logout",
          icon: "log-out-outline",
          onPress: () => handleLogout(),
        },
        {
          name: "Delete account",
          icon: "trash-outline",
          onPress: () => setDeleteAccountModalVisible(true),
          isDestructive: true,
        },
      ],
    },
  ];

  // A new function to handle toggles and update Firestore
  const toggleUserSetting = async (key) => {
    if (!userId) return; // Guard clause if the user is not logged in

    const userDocRef = doc(db, "users", userId);
    const currentValue = userData[key];

    try {
      // Update the state immediately for a responsive UI
      setUserData((prevData) => ({
        ...prevData,
        [key]: !currentValue,
      }));

      // Update the Firestore document with the new value
      await updateDoc(userDocRef, {
        [key]: !currentValue,
      });
    } catch (error) {
      // Revert the state if the update fails
      setUserData((prevData) => ({
        ...prevData,
        [key]: currentValue,
      }));
    }
  };

  // Set up auth state and Firestore listener
  useEffect(() => {
    // Listen for color scheme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);

        const userDocRef = doc(db, "users", user.uid);

        // Subscribe to real-time updates for user's main document
        const unsubscribeUser = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserData({
                savedListings: data.savedListings || [],
                wishlists: data.wishlists || [],
                appAnnouncementAndUpdates:
                  data.appAnnouncementAndUpdates || false,
                allowUsersToContactMeDirectly:
                  data.allowUsersToContactMeDirectly || false,
                showMyLocationOnPost: data.showMyLocationOnPost || false,
              });
              // Update the new profile information states
              setProfilePic(data.profilePic || null);
              setFullName(data.fullName || "Guest User");
              setEmail(data.email || "no-email@example.com");
            }
            setIsLoading(false); // Stop loading after initial fetch
          },
          (error) => {
            setIsLoading(false);
          }
        );

        // Clean up listener on unmount
        return () => {
          unsubscribeUser();
        };
      } else {
        setUserId(null);
        setProfilePic(null);
        setFullName("Guest User");
        setEmail("not-signed-in@example.com");
        setIsLoading(false);
      }
    });

    return () => {
      subscription.remove();
      unsubscribeAuth();
    };
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login"); // Ensure redirection even if logout fails
    } catch (error) {
    } finally {
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    try {
      if (userId) {
        const userDocRef = doc(db, "users", userId);
        const userSettingsRef = doc(
          db,
          "users",
          userId,
          "settings",
          "userSettings"
        );

        // Delete user documents and then the user itself
        await deleteDoc(userSettingsRef);
        await deleteDoc(userDocRef);
        await deleteUser(auth.currentUser);
      }
    } catch (error) {
    } finally {
      setDeleteAccountModalVisible(false);
    }
  };

  // Render settings sections
  const renderSection = useCallback(
    (section) => (
      <View key={section.title} style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.subtleText }]}>
          {section.title}
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {section.items.map((item, index) => (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.itemContainer,
                {
                  borderBottomWidth: index === section.items.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={item.isToggle ? undefined : item.onPress}
              disabled={item.isToggle}
            >
              <View style={styles.itemLeft}>
                {item.icon && (
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={
                      item.isDestructive ? colors.destructive : colors.tint
                    }
                  />
                )}
                <Text
                  style={[
                    styles.itemName,
                    {
                      color: item.isDestructive
                        ? colors.destructive
                        : colors.text,
                    },
                  ]}
                >
                  {item.name}
                </Text>
              </View>
              <View style={styles.itemRight}>
                {/* Conditionally render a Switch or a right arrow */}
                {item.isToggle ? (
                  <Switch
                    trackColor={{ false: colors.border, true: colors.tint }}
                    thumbColor={isDark ? "#f4f3f4" : "#f4f3f4"}
                    onValueChange={() => toggleUserSetting(item.settingKey)}
                    value={userData[item.settingKey]}
                  />
                ) : (
                  <>
                    {item.rightText && (
                      <Text
                        style={[
                          styles.itemRightText,
                          { color: colors.subtleText },
                        ]}
                      >
                        {item.rightText}
                      </Text>
                    )}
                    {item.onPress && (
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={colors.subtleText}
                      />
                    )}
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [isDark, colors, userData, toggleUserSetting]
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={{ marginTop: 10, color: colors.subtleText }}>
          Loading settings...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <View
            style={[
              styles.profileContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: isDark ? "#0d1117" : "#d1d5db",
              },
            ]}
          >
            <Image
              style={styles.profileImage}
              source={
                profilePic
                  ? { uri: profilePic }
                  : require("@/assets/images/default-profile.png")
              }
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {fullName}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.subtleText }]}>
                {email}
              </Text>
            </View>
          </View>
        </View>

        {settingsData.map(renderSection)}
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteAccountModalVisible}
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View
            style={[
              styles.modalView,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Are you sure?
            </Text>
            <Text style={[styles.modalText, { color: colors.subtleText }]}>
              This action cannot be undone. All your data will be permanently
              deleted.
            </Text>
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setDeleteAccountModalVisible(false)}
                color={colors.tint}
              />
              <Button
                title="Delete My Account"
                onPress={handleDeleteAccount}
                color={colors.destructive}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingTop: 30, // Extra padding for a cleaner header
  },
  title: {
    fontSize: 34, // Larger title
    fontWeight: "bold",
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 20, // More padding
    borderRadius: 16, // Softer corners
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 }, // Deeper shadow for a more "card" feel
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: 65, // Slightly larger profile pic
    height: 65,
    borderRadius: 35,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20, // Larger name
    fontWeight: "600",
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  userIdText: {
    marginTop: 5,
    fontSize: 12,
  },
  sectionContainer: {
    marginBottom: 24, // Increased spacing between sections
    paddingHorizontal: 20, // More horizontal padding
  },
  sectionTitle: {
    fontSize: 16, // Larger section title
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5, // Subtle letter spacing
  },
  card: {
    borderRadius: 16, // Softer corners
    borderWidth: 1,
    overflow: "hidden",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, // Increased horizontal padding
    paddingVertical: 16, // Increased vertical padding
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20, // More space between icon and text
  },
  itemName: {
    fontSize: 18, // Larger item name font
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 10,
  },
  itemRightText: {
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)", // Darker overlay
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    gap: 15,
  },
});
