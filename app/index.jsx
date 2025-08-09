import { auth } from "@/lib/firebase";
import { Redirect, Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Landing() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return null;
  }
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <ImageBackground
      source={require("@/assets/images/kateryna-hliznitsova-eJvFGDBZUSE-unsplash.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <Image
          source={require("@/assets/images/swipexx.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.content}>
          <Text style={styles.title}>Trade Smarter. Swipe to Swap.</Text>
          <Text style={styles.subtitle}>
            Say goodbye to cash deals. SwipeX lets you swap what you have for
            what you want. Fast, easy, and totally cashless.
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Start Swapping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // darkens image for readability
    padding: 24,
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 100,
    marginTop: 60,
  },
  content: {
    width: "100%",
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: "#DDDDDD",
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
});
