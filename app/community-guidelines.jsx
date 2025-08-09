// CommunityGuidelines.js
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
 * CommunityGuidelines screen for SwipeX
 * - Mobile-first, production-ready
 * - Comprehensive rules, safety tips, reporting & moderation flow
 * - Replace SUPPORT_EMAIL and LEGAL_EMAIL with your real contact addresses
 *
 * IMPORTANT: This content is recommended copy. Adjust to local laws and have legal review if needed.
 */

const SUPPORT_EMAIL = "support@swipex.app";
const LEGAL_EMAIL = "legal@yourcompany.com";
const EFFECTIVE_DATE = "August 8, 2025";

export default function CommunityGuidelines() {
  const theme = useColorScheme();
  const isDark = theme === "dark";

  const colors = useMemo(
    () => ({
      background: isDark ? "#0B0F14" : "#FAFBFC",
      card: isDark ? "#0F1720" : "#FFFFFF",
      text: isDark ? "#E6EEF3" : "#0B1320",
      dim: isDark ? "#9AA6B2" : "#6B7280",
      title: isDark ? "#FFFFFF" : "#0B1320",
      accent: isDark ? "#60A5FA" : "#0A84FF",
      safeBg: isDark ? "#112026" : "#EDFFF7",
      warnBg: isDark ? "#2A1820" : "#FFF6F6",
    }),
    [isDark]
  );

  const openMail = (email, subject = "") =>
    Linking.openURL(
      `mailto:${email}${
        subject ? `?subject=${encodeURIComponent(subject)}` : ""
      }`
    );

  const mailSupport = () =>
    openMail(SUPPORT_EMAIL, "Report: Community guideline issue");
  const mailLegal = () =>
    openMail(LEGAL_EMAIL, "Legal: Community guideline inquiry");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.h1, { color: colors.title }]}>
          Community Guidelines
        </Text>
        <Text style={[styles.lead, { color: colors.dim }]}>
          Effective date: {EFFECTIVE_DATE} — These rules keep SwipeX safe, fair,
          and useful for everyone. Please follow them.
        </Text>

        {/* TL;DR */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            TL;DR — What we expect
          </Text>
          <View style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: colors.text }]}>
              • Be honest & respectful.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: colors.text }]}>
              • List accurate descriptions & photos; don’t mislead buyers.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: colors.text }]}>
              • No illegal, unsafe, counterfeit, or stolen items.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: colors.text }]}>
              • Meet safely; report abuse.
            </Text>
          </View>
        </View>

        {/* Principles */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            Core principles
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            SwipeX is a community for swapping goods and services. To keep it
            healthy:
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            • Act in good faith. Be honest about condition, ownership, and
            intent.{"\n"}• Be civil. Harassment, threats, or hateful content are
            not allowed.{"\n"}• Put safety first. Prefer public meetups and
            verified users for high-value trades.
          </Text>
        </View>

        {/* Listing rules */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            Listing rules (must follow)
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            All listings must follow these minimum rules:
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Accurate Title & Description — state condition, faults, and any
            missing parts.
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Clear Photos — include at least one clear, well-lit image showing
            the actual item.
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Ownership & Legality — only list items you own and have the right
            to trade.
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • No Misleading Pricing — if adding a cash top-up option, state
            currency and amount.
          </Text>
        </View>

        {/* Prohibited items */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            Prohibited items & services
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            You may **not** list, offer, trade, or attempt to facilitate:
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Illegal drugs, controlled substances, or paraphernalia.
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Firearms, ammunition, explosives, or restricted weapons.
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Stolen goods, or items suspected to be stolen.
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Counterfeit, pirated, or trademark-infringing goods.
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Hazardous chemicals, poisons, or items requiring special permits.
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Adult sexual services, explicit sexual materials, or escort
            services.
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Illicit services (hacking, fraud, forged documents).
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Items restricted by local law or platform rules.
          </Text>
        </View>

        {/* Safety & meeting */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            Safety & meeting tips
          </Text>

          <Text style={[styles.paragraph, { color: colors.text }]}>
            • Meet in public, well-lit places (cafés, malls, police stations)
            during daytime when possible.{"\n"}• Bring a friend for high-value
            swaps.{"\n"}• Inspect the item thoroughly before handing anything
            over.{"\n"}• Avoid sharing sensitive personal information (bank
            details, national ID numbers).{"\n"}• If shipping, use tracked
            services and agree on terms in chat; consider escrow partners if
            available.
          </Text>

          <View style={[styles.smallBox, { backgroundColor: colors.safeBg }]}>
            <Text style={[styles.smallBoxTitle, { color: colors.title }]}>
              If you feel unsafe
            </Text>
            <Text style={[styles.smallBoxText, { color: colors.dim }]}>
              Immediately decline the trade and report the user via the app or
              email support.
            </Text>
          </View>
        </View>

        {/* Messaging & negotiation */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            Messaging & negotiation
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            • Keep negotiations in-app where possible — it creates a record for
            disputes.{"\n"}• Be respectful and explicit about what you offer.
            Use clear photos and pick the listings you want to offer for trade
            when proposing.{"\n"}• If agreeing to cash top-ups, specify
            currency, amount, and whether it is paid at meetup or via a service.
          </Text>
        </View>

        {/* Reporting & moderation */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            Reporting & moderation
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            If you see a rule violation or feel harassed/suspected fraud:
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Use the in-app "Report" button on any profile or listing.
          </Text>
          <Text style={[styles.bulletItem, { color: colors.text }]}>
            • Provide screenshots, messages, and details to help our review
            team.
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Our moderation actions may include content removal, warnings,
            temporary suspension, or permanent bans. We may also share
            information with law enforcement when required by law.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.accent }]}
              onPress={mailSupport}
            >
              <Text style={[styles.actionText, { color: colors.accent }]}>
                Email Support
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.accent }]}
              onPress={mailLegal}
            >
              <Text style={[styles.actionText, { color: colors.accent }]}>
                Legal Contact
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Intellectual property & privacy */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            Intellectual property & privacy
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            • Only post content you own or are licensed to share. Respect
            copyrights and trademarks.{"\n"}• Do not post private personal data
            (identifiers, bank details, private documents).{"\n"}• Our Privacy
            Policy explains how we collect and use information — obey it and
            contact privacy for requests.
          </Text>
        </View>

        {/* Enforcement & appeals */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            Enforcement & appeals
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            • Moderation decisions are taken to protect the community. If you
            disagree, use the in-app appeal form or email legal contact with
            supporting information.{"\n"}• Repeated or severe violations may
            result in permanent bans and referral to authorities.
          </Text>
        </View>

        {/* Final notes */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            Final notes
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            By using SwipeX you agree to follow these guidelines and our Terms &
            Privacy Policy. We update these rules from time to time — we'll
            notify you of significant changes.
          </Text>
          <Text style={[styles.paragraph, { color: colors.dim }]}>
            Contact support:{" "}
            <Text
              style={[styles.link, { color: colors.accent }]}
              onPress={mailSupport}
            >
              {SUPPORT_EMAIL}
            </Text>
            {" • "}
            Legal:{" "}
            <Text
              style={[styles.link, { color: colors.accent }]}
              onPress={mailLegal}
            >
              {LEGAL_EMAIL}
            </Text>
          </Text>
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
    color: "#6B7280",
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletRow: { flexDirection: "row", marginBottom: 6 },
  bullet: { fontSize: 14, marginRight: 8 },
  bulletItem: { fontSize: 14, marginBottom: 6, marginLeft: 6 },
  smallBox: {
    marginTop: 10,
    borderRadius: 10,
    padding: 10,
  },
  smallBoxTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },
  smallBoxText: {
    fontSize: 13,
  },
  safeRow: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginHorizontal: 6,
  },
  actionText: { fontWeight: "700" },
  link: { textDecorationLine: "underline" },
});
