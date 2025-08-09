// FAQ.js
import { useMemo, useState } from "react";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

/**
 * FAQ Screen for SwipeX
 * - Mobile-first, accessible FAQ with search + accordion
 * - Replace SUPPORT_EMAIL if needed
 *
 * Usage: <FAQ navigation={navigation} />
 */

const SUPPORT_EMAIL = "support@swipex.app";
const EFFECTIVE_DATE = "August 8, 2025";

const FAQ_DATA = [
  {
    q: "How do I post an item for trade?",
    a: "Tap the center Add button → upload up to 6 photos (or a short video) → add a clear title and honest description → choose a category and condition → specify what you want in return (specific items or 'Open to offers') → Post.",
  },
  {
    q: "Can I add cash to a trade?",
    a: "Yes — you can propose a partial cash top-up in chat if both parties agree. Always state currency, amount, and whether cash is provided at meetup or via a secure service.",
  },
  {
    q: "How do I propose a trade?",
    a: "Open a listing, tap 'Message' (or swipe left on feed) → choose which of your listings to offer in exchange or write an offer → add notes (meeting details/shipping) → send. The owner can accept, counter, or decline.",
  },
  {
    q: "What should I include in my listing photos?",
    a: "Use clear, well-lit photos that show the actual item from multiple angles. Include close-ups of defects, serial numbers (if needed), and any accessories. One photo should show the full item.",
  },
  {
    q: "How do I keep my listing safe and visible?",
    a: "Write honest descriptions, pick correct categories and tags, and use high-quality photos. Consider boosting a listing (paid feature) for increased visibility.",
  },
  {
    q: "How do I arrange pickup or delivery?",
    a: "Decide in chat with your trading partner: meet in a public place, use tracked shipping, or use a partner logistics/escrow service if available. Document the agreement in chat for evidence.",
  },
  {
    q: "What if a trade goes wrong?",
    a: "If you have issues, keep messages and photos as proof, report the user in-app, and contact support. If you used an escrow partner, open a claim through that provider immediately.",
  },
  {
    q: "How do I report a user or listing?",
    a: "Open the profile or listing and tap 'Report'. Provide screenshots, chat messages, and a short description. You can also email support at the contact below.",
  },
  {
    q: "Can I delete my account and data?",
    a: "Yes — go to Settings → Delete Account. Account deletion removes profile and listings within 30 days (some logs may be retained for legal/fraud purposes). Contact privacy if you need expedited removal.",
  },
  {
    q: "Are there items I can't list?",
    a: "Yes — prohibited items include illegal drugs, firearms/ammunition, stolen or counterfeit goods, hazardous chemicals, explicit sexual services, forged documents, and other items restricted by law or platform rules.",
  },
  {
    q: "How does verification work?",
    a: "Verified profiles complete identity checks (e.g., ID photo and selfie). Verification increases trust and may be required for high-value trades or certain features.",
  },
  {
    q: "How do saved items and wishlists work?",
    a: "Swipe right or tap the save icon to add an item to Saved Listings. Use Wishlist to list items you’re actively searching for (you can create private or public wishlists).",
  },
  {
    q: "Do you charge fees?",
    a: "Core barter features are free. Paid features (like boosts, promoted listings, escrow/shipping facilitation) may incur fees. Any fees will be shown before you confirm purchase.",
  },
  {
    q: "Can I chat outside the app?",
    a: "We recommend keeping negotiations in-app where possible — it creates a record for disputes. If you agree to move off-platform, do so cautiously and never share sensitive personal or financial info.",
  },
  {
    q: "How do I change notification preferences?",
    a: "Open Settings → Notifications and toggle push/email/SMS preferences as desired. You can choose which events trigger notifications (messages, trade updates, saves, etc.).",
  },
  {
    q: "Is SwipeX safe for children?",
    a: "SwipeX is not intended for children under 13 (or the local legal minimum). We do not knowingly accept accounts from people below the minimum age.",
  },
];

export default function FAQ({ navigation }) {
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const [openIndex, setOpenIndex] = useState(null);
  const [query, setQuery] = useState("");

  const colors = useMemo(
    () => ({
      background: isDark ? "#0B0F14" : "#FAFAFB",
      card: isDark ? "#0F1720" : "#FFFFFF",
      text: isDark ? "#E6EEF3" : "#0B1320",
      dim: isDark ? "#9AA6B2" : "#6B7280",
      accent: isDark ? "#60A5FA" : "#0A84FF",
      border: isDark ? "#21313E" : "#E6E9EE",
    }),
    [isDark]
  );

  const filtered = FAQ_DATA.filter(
    (item) =>
      item.q.toLowerCase().includes(query.toLowerCase()) ||
      item.a.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);
  const openMail = (email, subject = "") =>
    Linking.openURL(
      `mailto:${email}${
        subject ? `?subject=${encodeURIComponent(subject)}` : ""
      }`
    );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>FAQ</Text>
        <Text style={[styles.subtitle, { color: colors.dim }]}>
          Quick answers to common questions — updated {EFFECTIVE_DATE}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.searchBox, { borderColor: colors.border }]}>
          <TextInput
            placeholder="Search FAQs (e.g., 'post', 'verify', 'payment')"
            placeholderTextColor={isDark ? "#8492A6" : "#9AA3B2"}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
          />
        </View>

        {filtered.length === 0 ? (
          <View style={[styles.noResult, { borderColor: colors.border }]}>
            <Text style={[styles.noResultText, { color: colors.dim }]}>
              No results. Try different keywords or contact support.
            </Text>
          </View>
        ) : null}

        {filtered.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggle(idx)}
              style={styles.qRow}
              accessibilityRole="button"
              accessibilityState={{ expanded: openIndex === idx }}
            >
              <Text style={[styles.qText, { color: colors.text }]}>
                {item.q}
              </Text>
              <Text style={[styles.toggle, { color: colors.accent }]}>
                {openIndex === idx ? "−" : "+"}
              </Text>
            </TouchableOpacity>

            {openIndex === idx && (
              <View style={styles.answerWrap}>
                <Text style={[styles.aText, { color: colors.dim }]}>
                  {item.a}
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Still need help */}
        <View style={[styles.helpBox, { borderColor: colors.border }]}>
          <Text style={[styles.helpTitle, { color: colors.text }]}>
            Still need help?
          </Text>
          <Text style={[styles.helpText, { color: colors.dim }]}>
            If the FAQs don't answer your question, our support team can help.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() =>
                navigation
                  ? navigation.navigate("ContactSupport")
                  : openMail(SUPPORT_EMAIL)
              }
            >
              <Text style={styles.buttonText}>Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonOutline, { borderColor: colors.accent }]}
              onPress={() => openMail(SUPPORT_EMAIL, "FAQ: Additional help")}
            >
              <Text
                style={[styles.buttonOutlineText, { color: colors.accent }]}
              >
                Email Us
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 6 },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  searchBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 14,
    padding: 0,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  qRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qText: { fontSize: 15, fontWeight: "700", flex: 1, marginRight: 12 },
  toggle: { fontSize: 20, fontWeight: "700" },
  answerWrap: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E6E9EE",
  },
  aText: { fontSize: 14, lineHeight: 20 },
  noResult: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  noResultText: { fontSize: 14 },
  helpBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 8 },
  helpTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  helpText: { fontSize: 14, marginBottom: 12 },
  actionsRow: { flexDirection: "row", justifyContent: "space-between" },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  buttonOutline: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    marginLeft: 8,
  },
  buttonOutlineText: { fontWeight: "700" },
});
