// PrivacyAndPolicy.js
import { useMemo } from "react";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const EFFECTIVE_DATE = "August 8, 2025";
const COMPANY_NAME_PLACEHOLDER = "[Your Company Name]";
const SUPPORT_EMAIL_PLACEHOLDER = "support@yourcompany.com";
const PRIVACY_EMAIL_PLACEHOLDER = "privacy@yourcompany.com";

export default function PrivacyAndPolicy() {
  const theme = useColorScheme();
  const isDark = theme === "dark";

  // Use a dynamic color palette based on the system theme
  const colors = useMemo(() => {
    return {
      background: isDark ? "#0D1117" : "#F8F9FA",
      text: isDark ? "#E0E0E0" : "#2C3E50",
      subtleText: isDark ? "#A0A7B5" : "#6E7A8A",
      link: isDark ? "#A7D6F4" : "#007AFF",
      bold: isDark ? "#FFFFFF" : "#1A222B",
      disclaimerBackground: isDark ? "#2C1E0A" : "#fff6e6",
      disclaimerBorder: isDark ? "#4B3213" : "#ffd8a8",
      disclaimerText: isDark ? "#FADDA0" : "#5a4a00",
    };
  }, [isDark]);

  const openMail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Privacy Policy
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtleText }]}>
          Effective date: {EFFECTIVE_DATE}
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          1. Introduction
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          This Privacy Policy describes how your information is collected, used,
          shared, and protected by{" "}
          <Text style={[styles.bold, { color: colors.bold }]}>SwipeX</Text>{" "}
          (operated by{" "}
          <Text style={[styles.bold, { color: colors.bold }]}>
            {COMPANY_NAME_PLACEHOLDER}
          </Text>
          ). We are committed to protecting your privacy. Please review this
          policy carefully.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          2. Data Controller & Contact
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          <Text style={[styles.bold, { color: colors.bold }]}>
            Data Controller:
          </Text>{" "}
          {COMPANY_NAME_PLACEHOLDER}
          {"\n"}
          <Text style={[styles.bold, { color: colors.bold }]}>
            Support Email:
          </Text>{" "}
          <Text
            style={[styles.link, { color: colors.link }]}
            onPress={() => openMail(SUPPORT_EMAIL_PLACEHOLDER)}
          >
            {SUPPORT_EMAIL_PLACEHOLDER}
          </Text>
          {"\n"}
          <Text style={[styles.bold, { color: colors.bold }]}>
            Privacy Inquiries:
          </Text>{" "}
          <Text
            style={[styles.link, { color: colors.link }]}
            onPress={() => openMail(PRIVACY_EMAIL_PLACEHOLDER)}
          >
            {PRIVACY_EMAIL_PLACEHOLDER}
          </Text>
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          3. Information We Collect
        </Text>
        <Text style={[styles.subTitle, { color: colors.text }]}>
          A. Information You Provide Directly
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          This includes data you provide when you register an account, set up
          your profile (e.g., name, username, email, phone number, profile
          picture), create listings (e.g., photos, descriptions, videos), and
          communicate with other users or our support team.
        </Text>

        <Text style={[styles.subTitle, { color: colors.text }]}>
          B. Information We Collect Automatically
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          When you use our services, we may automatically collect certain
          information about your device and usage, such as IP address, device
          ID, operating system, pages visited, and crash reports. With your
          permission, we may also collect precise location data.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          4. How We Use Your Data
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We use your data to operate, maintain, and improve the SwipeX service;
          to facilitate trades between users; to send you important
          communications and notifications; to ensure the safety and security of
          our platform; to personalize your user experience; and to comply with
          our legal obligations.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          5. Legal Basis for Processing (EU/EEA Users)
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          If you are in the European Economic Area (EEA), we process your
          personal data based on contractual necessity, our legitimate interests
          (such as security and fraud prevention), your consent (for marketing
          purposes), and legal obligations.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          6. Sharing and Disclosure of Information
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may share your information with third-party service providers
          (e.g., for hosting, analytics, and payment processing), with other
          users (via your public profile and listings), and with legal
          authorities as required by law. We may also disclose data in
          connection with a business transfer or merger.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          7. Third-Party Services
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We use various third-party services, including Firebase for
          authentication and database services, and Google for analytics. Please
          be aware that your use of these third-party services is subject to
          their own privacy policies.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          8. Your Rights and Choices
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Depending on your jurisdiction, you may have rights to access,
          correct, delete, or port your personal data. You can exercise these
          rights by contacting our privacy team at:{" "}
          <Text
            style={[styles.link, { color: colors.link }]}
            onPress={() => openMail(PRIVACY_EMAIL_PLACEHOLDER)}
          >
            {PRIVACY_EMAIL_PLACEHOLDER}
          </Text>
          .
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          9. Children's Privacy
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Our services are not intended for children under the age of 13. We do
          not knowingly collect personal information from children under this
          age. If we become aware that a child has provided us with personal
          information, we will take steps to delete such information.
        </Text>

        {/* This is a placeholder section. Add additional legal information as required by your business and legal counsel. */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          10. Data Retention, Security, and Other Provisions
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We retain your data for as long as your account is active and as
          necessary for legal or business purposes. We use reasonable security
          measures to protect your data. This policy may be updated, and we will
          notify you of any material changes. For full details on these and
          other topics, please refer to the complete policy.
        </Text>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: "700",
  },
  link: {
    textDecorationLine: "underline",
  },
  disclaimerBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },
  disclaimerText: {
    fontSize: 13,
  },
});
