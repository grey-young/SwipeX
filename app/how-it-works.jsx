// HowItWorks.js
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

/**
 * HowItWorks Screen for SwipeX
 * - A friendly, accessible, and production-ready guide for new users.
 * - Uses SafeAreaView and a dynamic color palette for light/dark mode.
 * - Contains a step-by-step flow, essential safety tips, and call-to-action buttons.
 *
 * Props:
 * - navigation (optional) - if provided, the CTA button will navigate to the CreateListing screen.
 *
 * NOTE: Customize the `COMPANY_NAME` and `SUPPORT_EMAIL` constants below.
 */

// Customization constants
const COMPANY_NAME = "SwipeX"; // Or [Your Company Name]
const SUPPORT_EMAIL = "support@swipex.app";
const EFFECTIVE_DATE = "August 8, 2025";

export default function HowItWorks({ navigation }) {
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const router = useRouter();

  // Dynamic color palette based on system theme
  const colors = useMemo(
    () => ({
      background: isDark ? "#0D1117" : "#F8F9FA",
      card: isDark ? "#161B22" : "#FFFFFF",
      text: isDark ? "#E0E8F0" : "#2C3E50",
      dim: isDark ? "#A0A7B5" : "#6E7A8A",
      accent: isDark ? "#58A6FF" : "#007AFF",
      tipBg: isDark ? "#142026" : "#FFF8E6",
      tipBorder: isDark ? "#1E3146" : "#FFE6B3",
      safeBg: isDark ? "#1E3146" : "#E2F0F9",
      safeBorder: isDark ? "#284A65" : "#CCE0EF",
      ctaPrimary: isDark ? "#58A6FF" : "#007AFF",
      ctaSecondary: isDark ? "#343B45" : "#E5E9F0",
    }),
    [isDark]
  );

  const openMail = (email) => Linking.openURL(`mailto:${email}`);

  // Handle CTA button presses
  const handleCreateListingPress = () => {
    router.push("/addpost");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.h1, { color: colors.text }]}>
          How {COMPANY_NAME} Works
        </Text>
        <Text style={[styles.lead, { color: colors.dim }]}>
          Your quick guide to hassle-free bartering. Start trading in minutes!
        </Text>

        {/* Step 1: Create your listing */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.stepRow}>
            <View style={[styles.stepCircle, { borderColor: colors.accent }]}>
              <Text style={[styles.stepNumber, { color: colors.accent }]}>
                1
              </Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                List what you have
              </Text>
              <Text style={[styles.stepText, { color: colors.dim }]}>
                Upload clear photos or a short video of the item you want to
                trade. Give it a catchy title, an honest description, and let
                others know what you’re looking for in return.
              </Text>
              <Text style={[styles.mini, { color: colors.dim }]}>
                Example: "Vintage vinyl collection for a great pair of
                headphones."
              </Text>
            </View>
          </View>
        </View>

        {/* Step 2: Discover and connect */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.stepRow}>
            <View style={[styles.stepCircle, { borderColor: colors.accent }]}>
              <Text style={[styles.stepNumber, { color: colors.accent }]}>
                2
              </Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Find new items
              </Text>
              <Text style={[styles.stepText, { color: colors.dim }]}>
                Dive into a feed of local listings. Swipe left on an item to
                open a chat and propose a trade. Swipe right to save it to your
                Wishlist for later.
              </Text>
              <Text style={[styles.mini, { color: colors.dim }]}>
                Use filters to browse by distance, category, and desired items.
              </Text>
            </View>
          </View>
        </View>

        {/* Step 3: Propose your trade */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.stepRow}>
            <View style={[styles.stepCircle, { borderColor: colors.accent }]}>
              <Text style={[styles.stepNumber, { color: colors.accent }]}>
                3
              </Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Negotiate the terms
              </Text>
              <Text style={[styles.stepText, { color: colors.dim }]}>
                Once in the chat, select the item you're offering from your
                listings. Discuss the terms of the trade, whether it's a direct
                swap, a partial cash top-up, or a shipping arrangement.
              </Text>
            </View>
          </View>
        </View>

        {/* Step 4: Finalize the deal */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.stepRow}>
            <View style={[styles.stepCircle, { borderColor: colors.accent }]}>
              <Text style={[styles.stepNumber, { color: colors.accent }]}>
                4
              </Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Confirm and review
              </Text>
              <Text style={[styles.stepText, { color: colors.dim }]}>
                When both parties are happy, mark the trade as complete. Don't
                forget to leave a review for the other user to help build a
                trustworthy community!
              </Text>
            </View>
          </View>
        </View>

        {/* Safety tips section */}
        <View
          style={[
            styles.tipBox,
            { backgroundColor: colors.tipBg, borderColor: colors.tipBorder },
          ]}
        >
          <Text style={[styles.tipTitle, { color: colors.text }]}>
            Stay safe!
          </Text>
          <Text style={[styles.tipText, { color: colors.dim }]}>
            Always meet in a public place. Bring a friend if you can, and
            thoroughly inspect the item before you trade. Never share personal
            financial information. If you ever feel unsafe, you can report the
            user and block them instantly.
          </Text>
          <View
            style={[
              styles.safeRow,
              {
                backgroundColor: colors.safeBg,
                borderColor: colors.safeBorder,
              },
            ]}
          >
            <Text style={[styles.safeTitle, { color: colors.text }]}>
              Did you know?
            </Text>
            <Text style={[styles.safeText, { color: colors.dim }]}>
              Users with a Verified profile have completed a secure ID check.
              Trading with them adds an extra layer of trust for high-value
              items.
            </Text>
          </View>
        </View>

        {/* Call-to-action buttons */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.ctaPrimary }]}
            onPress={handleCreateListingPress}
          >
            <Text style={styles.ctaText}>Create My First Listing</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  h1: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  lead: {
    fontSize: 14,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumber: {
    fontWeight: "800",
    fontSize: 16,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  stepText: {
    fontSize: 14,
    marginBottom: 6,
  },
  mini: {
    fontSize: 12,
  },
  tipBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  tipTitle: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    marginBottom: 8,
  },
  safeRow: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  safeTitle: {
    fontWeight: "700",
  },
  safeText: {
    fontSize: 13,
  },
  ctaRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  cta: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
