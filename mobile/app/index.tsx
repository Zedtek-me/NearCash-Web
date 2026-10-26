import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/auth/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <View style={styles.loading}><ActivityIndicator color="#FFFFFF" /></View>;
  if (user) return <Redirect href={user.userType?.toUpperCase() === "VENDOR" ? "/vendor" : "/client"} />;

  return <SafeAreaView style={styles.page}>
    <View style={styles.intro}>
      <Text style={styles.title}>Get Started!</Text>
      <Text style={styles.subtitle}>An easy way vendors and clients of POS connect anywhere in Nigeria.</Text>
    </View>
    <View style={styles.art}>
      {[0, 1, 2, 3, 4].map((ring) => <View key={ring} style={[styles.ring, { width: 100 + ring * 48, height: 100 + ring * 48, opacity: 0.7 - ring * 0.1 }]} />)}
      <View style={styles.center}><Text style={styles.centerMark}>N</Text></View>
    </View>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" onPress={() => router.push("/login")} style={styles.login}><Text style={styles.loginText}>Login</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/signup")} style={styles.signup}><Text style={styles.signupText}>Sign up</Text></Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050505" },
  page: { flex: 1, backgroundColor: "#050505", paddingHorizontal: 24, paddingTop: 22, paddingBottom: 18, justifyContent: "space-between" },
  intro: { gap: 8 }, title: { color: "#FFFFFF", fontSize: 34, fontWeight: "800" }, subtitle: { color: "#D1D5DB", fontSize: 15, lineHeight: 23, maxWidth: 340 },
  art: { flex: 1, minHeight: 280, alignItems: "center", justifyContent: "center" }, ring: { position: "absolute", borderWidth: 1, borderColor: "#6B7280", borderRadius: 999 }, center: { width: 66, height: 66, borderRadius: 33, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, centerMark: { color: "#111111", fontSize: 28, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 14, justifyContent: "center", paddingBottom: 10 }, login: { flex: 1, maxWidth: 160, alignItems: "center", justifyContent: "center", minHeight: 50, borderRadius: 28, borderWidth: 1.5, borderColor: "#FFFFFF" }, loginText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 }, signup: { flex: 1, maxWidth: 160, alignItems: "center", justifyContent: "center", minHeight: 50, borderRadius: 28, backgroundColor: "#FFFFFF" }, signupText: { color: "#111111", fontWeight: "700", fontSize: 16 },
});
