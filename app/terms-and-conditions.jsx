// TermsAndConditions.js
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

/**
 * TERMS & CONDITIONS (TERMS OF SERVICE)
 * Replace the placeholders below:
 *  - COMPANY_NAME -> your company / legal entity name
 *  - SUPPORT_EMAIL -> primary support email (for user inquiries)
 *  - LEGAL_EMAIL -> legal/privacy request email
 *  - COMPANY_ADDRESS -> your company's physical address (optional)
 *  - EFFECTIVE_DATE -> date this TOS takes effect
 *
 * IMPORTANT: This document is a template for a barter/trading mobile app.
 * Have a licensed attorney review & adapt for jurisdictions where you operate.
 */

const EFFECTIVE_DATE = "August 8, 2025";
const COMPANY_NAME = "{{YOUR_COMPANY_NAME}}";
const SUPPORT_EMAIL = "support@swipex.app";
const LEGAL_EMAIL = "legal@yourcompany.com";
const COMPANY_ADDRESS = "{{COMPANY_ADDRESS}}";

export default function TermsAndConditions() {
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const colors = useMemo(
    () => ({
      background: isDark ? "#0D1117" : "#FFFFFF",
      text: isDark ? "#E6EEF3" : "#1B2630",
      subtitle: isDark ? "#A9B6C2" : "#49606A",
      link: isDark ? "#7DD3FC" : "#007AFF",
      accent: isDark ? "#A7D6F4" : "#0A84FF",
      boxBg: isDark ? "#16202B" : "#FFF9F1",
      boxBorder: isDark ? "#2B3A44" : "#FFE2B4",
    }),
    [isDark]
  );

  const openMail = (email) => Linking.openURL(`mailto:${email}`);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { borderBottomColor: colors.subtitle }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Terms & Conditions
          </Text>
          <Text style={[styles.effective, { color: colors.subtitle }]}>
            Effective date: {EFFECTIVE_DATE}
          </Text>
        </View>

        <Section title="1. Agreement to Terms" colors={colors}>
          <Paragraph colors={colors}>
            These Terms & Conditions ("Terms") govern your access to and use of
            the mobile application and related services provided by{" "}
            <Text style={styles.bold}>{COMPANY_NAME}</Text>. By accessing or
            using the SwipeX mobile app (the "Service"), you agree to be bound
            by these Terms. If you do not agree, do not use the Service.
          </Paragraph>
        </Section>

        <Section title="2. Eligibility" colors={colors}>
          <Paragraph colors={colors}>
            You must be at least the minimum legal age in your jurisdiction
            (commonly 13 or 16 — check local rules) to create an account. By
            creating an account, you represent and warrant that you meet the age
            requirement and have authority to form a binding contract.
          </Paragraph>
        </Section>

        <Section title="3. Account Registration & Security" colors={colors}>
          <Paragraph colors={colors}>
            You are responsible for creating and maintaining accurate account
            information. You agree not to share your password and to notify us
            immediately of any unauthorized use. We may suspend or terminate
            accounts for suspicious or unlawful activity.
          </Paragraph>
        </Section>

        <Section title="4. User Conduct & Prohibited Acts" colors={colors}>
          <Paragraph colors={colors}>
            You agree not to use the Service to: (a) buy, sell, or trade illegal
            goods or services; (b) post fraudulent listings; (c) harass, abuse
            or threaten others; (d) impersonate any person or entity; (e) upload
            viruses or harmful code; (f) attempt to circumvent security or
            moderation. Violation may result in removal of content, suspension,
            or termination.
          </Paragraph>
        </Section>

        <Section title="5. Listings, Offers & Trades" colors={colors}>
          <Paragraph colors={colors}>
            The Service facilitates barter trades between users. When you create
            a listing you must provide truthful descriptions and accurate
            photos. Listings are offers to negotiate; no binding contract arises
            until both parties expressly agree to trade and complete any
            required confirmation steps.
          </Paragraph>
          <Paragraph colors={colors}>
            You are solely responsible for arranging delivery, collection, or
            shipment as agreed between trading parties. If the Service provides
            optional logistics, escrow, or payment tools, separate terms and
            fees may apply.
          </Paragraph>
        </Section>

        <Section title="6. Fees & Payments" colors={colors}>
          <Paragraph colors={colors}>
            Use of core barter features is free unless otherwise specified. We
            may offer paid services (e.g., promoted listings, featured slots,
            escrow, shipping) subject to separate fees. All fees are
            non-refundable unless required by law. Payment processing is handled
            by third-party processors; we do not directly store full card data.
          </Paragraph>
        </Section>

        <Section title="7. User Content & License" colors={colors}>
          <Paragraph colors={colors}>
            You retain ownership of content you post (images, descriptions). By
            posting you grant
            {` ${COMPANY_NAME}`} a non-exclusive, worldwide, royalty-free
            license to host, use, reproduce, modify, publish and display such
            content in connection with operating, promoting, and improving the
            Service. You represent you have all rights necessary to grant this
            license.
          </Paragraph>
        </Section>

        <Section title="8. Intellectual Property" colors={colors}>
          <Paragraph colors={colors}>
            All rights, title and interest in the Service (including UI, logos,
            trademarks, and software) are owned by {COMPANY_NAME} or our
            licensors. You will not copy, adapt, distribute, create derivative
            works, or reverse engineer the Service.
          </Paragraph>
        </Section>

        <Section title="9. Moderation & Safety" colors={colors}>
          <Paragraph colors={colors}>
            We may review, remove, or restrict content that violates policies.
            We may use automated tools and human moderators. We do not guarantee
            that any user is who they claim to be — exercise ordinary caution
            when trading with others.
          </Paragraph>
        </Section>

        <Section title="10. Disclaimers; No Warranty" colors={colors}>
          <Paragraph colors={colors}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
            WARRANTIES OF ANY KIND.
            {` ${COMPANY_NAME}`} DISCLAIMS WARRANTIES, EXPRESS OR IMPLIED,
            INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
            UNINTERRUPTED OR ERROR-FREE.
          </Paragraph>
        </Section>

        <Section title="11. Limitation of Liability" colors={colors}>
          <Paragraph colors={colors}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY_NAME} AND ITS
            AFFILIATES SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR
            USE OF THE SERVICE. OUR AGGREGATE LIABILITY FOR DIRECT DAMAGES IS
            LIMITED TO THE AMOUNT OF FEES YOU PAID TO US IN THE SIX (6) MONTHS
            PRIOR TO THE CLAIM, OR USD $100, WHICHEVER IS GREATER.
          </Paragraph>
        </Section>

        <Section title="12. Indemnification" colors={colors}>
          <Paragraph colors={colors}>
            You agree to indemnify and hold harmless {COMPANY_NAME} from any
            claims, damages, liabilities, and expenses (including reasonable
            legal fees) arising from your breach of these Terms or your misuse
            of the Service.
          </Paragraph>
        </Section>

        <Section title="13. Termination & Suspension" colors={colors}>
          <Paragraph colors={colors}>
            We may suspend or terminate accounts for violations, suspected
            fraud, or legal reasons. You may delete your account in Settings.
            Termination does not relieve you of obligations incurred prior to
            termination.
          </Paragraph>
        </Section>

        <Section title="14. Governing Law & Dispute Resolution" colors={colors}>
          <Paragraph colors={colors}>
            These Terms are governed by the laws of the jurisdiction in which{" "}
            {COMPANY_NAME} is incorporated, unless otherwise required. For
            consumers, mandatory local protections may apply. For other
            disputes, parties will attempt to resolve informally; if not
            resolved, disputes will be resolved in a competent court or via
            arbitration as specified by local rules.
          </Paragraph>
        </Section>

        <Section title="15. Privacy" colors={colors}>
          <Paragraph colors={colors}>
            Our Privacy Policy explains how we collect and use information. By
            using the Service you consent to our collection and use as described
            in the Privacy Policy.
          </Paragraph>
        </Section>

        <Section title="16. Third-Party Services & Links" colors={colors}>
          <Paragraph colors={colors}>
            The Service may contain links or integrations with third-party
            services. We are not responsible for third-party content or
            practices. Review their terms and privacy policies before use.
          </Paragraph>
        </Section>

        <Section title="17. Changes to Terms" colors={colors}>
          <Paragraph colors={colors}>
            We may modify these Terms. Material changes will be communicated
            (e.g., in-app notice or email) and a revised effective date will be
            posted. Continued use after notice constitutes acceptance of the
            updated Terms.
          </Paragraph>
        </Section>

        <Section title="18. Electronic Communications" colors={colors}>
          <Paragraph colors={colors}>
            By using the Service you consent to receive electronic
            communications and notices (email, push notifications). These
            communications satisfy any legal notice requirement.
          </Paragraph>
        </Section>

        <Section title="19. California & Other Consumer Rights" colors={colors}>
          <Paragraph colors={colors}>
            If you are a California resident, you may have rights under
            CCPA/CPRA. EU/EEA residents have rights under GDPR. Contact us at{" "}
            <Text
              style={[styles.link, { color: colors.link }]}
              onPress={() => openMail(LEGAL_EMAIL)}
            >
              {LEGAL_EMAIL}
            </Text>{" "}
            for privacy-related requests.
          </Paragraph>
        </Section>

        <Section title="20. Entire Agreement; Severability" colors={colors}>
          <Paragraph colors={colors}>
            These Terms, together with our Privacy Policy and any other posted
            policies, constitute the entire agreement. If any provision is held
            invalid, the remaining provisions remain in force.
          </Paragraph>
        </Section>

        <View
          style={[
            styles.contactBox,
            { backgroundColor: colors.boxBg, borderColor: colors.boxBorder },
          ]}
        >
          <Text style={[styles.contactTitle, { color: colors.text }]}>
            Contact & Legal
          </Text>
          <Text style={[styles.contactText, { color: colors.subtitle }]}>
            For support:{" "}
            <Text
              style={[styles.link, { color: colors.link }]}
              onPress={() => openMail(SUPPORT_EMAIL)}
            >
              {SUPPORT_EMAIL}
            </Text>
            {"\n"}
            For legal/privacy requests:{" "}
            <Text
              style={[styles.link, { color: colors.link }]}
              onPress={() => openMail(LEGAL_EMAIL)}
            >
              {LEGAL_EMAIL}
            </Text>
            {"\n"}
            {COMPANY_ADDRESS ? `Address: ${COMPANY_ADDRESS}` : null}
          </Text>
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* Helper components */
function Section({ title, children, colors }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children, colors }) {
  return (
    <Text style={[styles.paragraph, { color: colors.text }]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: "700" },
  effective: { marginTop: 4, fontSize: 13 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  paragraph: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  bold: { fontWeight: "700" },
  link: { textDecorationLine: "underline" },
  contactBox: { marginTop: 14, padding: 12, borderRadius: 8, borderWidth: 1 },
  contactTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  contactText: { fontSize: 14, lineHeight: 20 },
  disclaimer: { marginTop: 16, padding: 12, borderRadius: 8, borderWidth: 1 },
  disclaimerTitle: { fontWeight: "700", marginBottom: 6 },
  disclaimerText: { fontSize: 13 },
});
