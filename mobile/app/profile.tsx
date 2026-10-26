import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/auth/AuthContext";
import { Heading, Screen, colors } from "../src/ui";

export default function ProfileScreen() {
  const { user } = useAuth();
  const details = [
    ["First name", user?.firstName],
    ["Last name", user?.lastName],
    ["Email", user?.email],
    ["Username", user?.username],
    ["Phone number", user?.phoneNumber],
    ["Account type", user?.userType?.toLowerCase()],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return <Screen>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹  Dashboard</Text></Pressable>
    <Heading subtitle="Your NearCash account details">Profile</Heading>
    <View style={styles.card}>
      <View style={styles.avatar}><Text style={styles.initials}>{(user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}{user?.lastName?.[0]?.toUpperCase() || ""}</Text></View>
      <Text style={styles.fullName}>{user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email}</Text>
      {details.map(([label, value]) => <View key={label} style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>)}
    </View>
    <Text style={styles.note}>To update your identity or settlement details, use Identity verification from your dashboard.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  back: { color: colors.link, fontSize: 15, fontWeight: "600", paddingVertical: 4 },
  card: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 16, padding: 18, gap: 15 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#E8EAF0", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  initials: { color: colors.ink, fontSize: 20, fontWeight: "800" }, fullName: { color: colors.ink, fontSize: 19, textAlign: "center", fontWeight: "700", paddingBottom: 5 },
  row: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 4 }, label: { color: colors.muted, fontSize: 12 }, value: { color: colors.ink, fontSize: 15, fontWeight: "600", textTransform: "capitalize" },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});
