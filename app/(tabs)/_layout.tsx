import { Ionicons } from "@expo/vector-icons";

import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// Custom tab bar with animated SVG blob indicator (liquid effect)
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Animated values for each tab
  const [animations] = useState(() =>
    state.routes.map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      color: new Animated.Value(0), // 0: inactive, 1: active
    }))
  );

  useEffect(() => {
    state.routes.forEach((route: any, idx: number) => {
      const isFocused = state.index === idx;
      Animated.parallel([
        Animated.spring(animations[idx].scale, {
          toValue: isFocused ? 1.2 : 1,
          useNativeDriver: true,
          friction: 5,
          tension: 120,
        }),
        Animated.timing(animations[idx].opacity, {
          toValue: isFocused ? 1 : 0.7,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(animations[idx].color, {
          toValue: isFocused ? 1 : 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  return (
    <View
      style={[styles.tabBarContainer, { backgroundColor: colors.background }]}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 30 : 90}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={styles.blurContainer}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Icon logic
          let iconName = "home-outline";
          let iconSize = 24;
          let iconStyle = {};
          switch (route.name) {
            case "index":
              iconName = "home-outline";
              break;
            case "explore":
              iconName = "compass-outline";
              break;
            case "addpost":
              iconName = "add-circle";
              iconSize = 38;
              iconStyle = { marginBottom: -8 };
              break;
            case "inbox":
              iconName = "mail-unread-outline";
              break;
            case "profile":
              iconName = "person-circle-outline";
              break;
          }

          // Animated styles
          const animatedIconStyle = {
            transform: [{ scale: animations[index].scale }],
            opacity: animations[index].opacity,
          };
          const animatedLabelColor = animations[index].color.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.icon, colors.tint],
          });
          const animatedLabelFont = isFocused
            ? "InterSemiBold"
            : "InterRegular";

          return (
            <TouchableWithoutFeedback
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
            >
              <View style={styles.tabItem}>
                <Animated.View style={animatedIconStyle}>
                  <Ionicons
                    name={iconName as any}
                    size={iconSize}
                    color={isFocused ? colors.tint : colors.icon}
                    style={iconStyle}
                  />
                </Animated.View>
                <Animated.Text
                  style={[
                    styles.tabLabel,
                    {
                      color: animatedLabelColor,
                      fontFamily: animatedLabelFont,
                    },
                  ]}
                >
                  {options.title}
                </Animated.Text>
              </View>
            </TouchableWithoutFeedback>
          );
        })}
      </BlurView>
    </View>
  );
};

import { ActivityIndicator } from "react-native";
const LoadingSpinner = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  return (
    <LinearGradient
      colors={[colors.background, colors.background]}
      style={styles.loadingContainer}
    >
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size={48} color={colors.tint} />
      </View>
      <Text style={[styles.loadingText, { color: colors.text }]}>
        Setting up your experience...
      </Text>
    </LinearGradient>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={({ route }) => {
        let iconName: any = "home-outline";
        let title = "";
        switch (route.name) {
          case "index":
            iconName = "home-outline";
            title = "Home";
            break;
          case "explore":
            iconName = "compass-outline";
            title = "Explore";
            break;
          case "addpost":
            iconName = "add-circle";
            title = "";
            break;
          case "inbox":
            iconName = "mail-unread-outline";
            title = "Inbox";
            break;
          case "profile":
            iconName = "person-circle-outline";
            title = "Profile";
            break;
        }
        return {
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={iconName} size={size ?? 24} color={color} />
          ),
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          tabBarInactiveTintColor: Colors[colorScheme ?? "light"].icon,
          title,
        };
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="addpost" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  // spinner: removed invalid web animation styles
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: "InterMedium",
  },
  tabBarContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  blurContainer: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    width: 100,
    height: 3,
    borderRadius: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 12,
  },
});
