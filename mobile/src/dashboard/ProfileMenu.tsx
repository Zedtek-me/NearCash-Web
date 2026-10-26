import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../auth/AuthContext";
import { colors } from "../ui";

function getPicture(meta: unknown) {
  if (typeof meta === "string") {
    try { return JSON.parse(meta)?.picture as string | undefined; } catch { return undefined; }
  }
  return meta && typeof meta === "object" ? (meta as { picture?: string }).picture : undefined;
}

export function ProfileMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const name = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Profile";
  const initials = (user?.firstName?.[0] || user?.email?.[0] || "U") + (user?.lastName?.[0] || "");
  const picture = getPicture(user?.meta);

  return <View style={styles.wrap}>
    <Pressable accessibilityRole="button" accessibilityLabel="Open profile menu" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.trigger}>
      {picture ? <Image source={{ uri: picture }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initials}>{initials.toUpperCase()}</Text></View>}
      <Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
    </Pressable>
    {open ? <View style={styles.menu}>
        <View style={styles.identity}><Text numberOfLines={1} style={styles.name}>{name}</Text><Text numberOfLines={1} style={styles.email}>{user?.email}</Text></View>
        <Pressable style={styles.item} onPress={() => { setOpen(false); router.push("/profile"); }}><Text style={styles.itemText}>Profile</Text></Pressable>
        <Pressable style={styles.item} onPress={() => { setOpen(false); void (async () => { await signOut(); router.replace("/"); })(); }}><Text style={styles.itemText}>Sign out</Text></Pressable>
      </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { position: "relative", zIndex: 20, alignItems: "flex-end" },
  trigger: { flexDirection: "row", alignItems: "center", gap: 5, padding: 3 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#E8EAF0", alignItems: "center", justifyContent: "center" },
  initials: { color: colors.ink, fontSize: 12, fontWeight: "800" }, chevron: { color: colors.muted, fontSize: 17 },
  menu: { position: "absolute", zIndex: 2, top: 47, right: 0, width: 230, borderRadius: 13, backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 8, overflow: "hidden" },
  identity: { paddingHorizontal: 14, paddingVertical: 12, borderBottomColor: colors.line, borderBottomWidth: 1, gap: 3 }, name: { color: colors.ink, fontSize: 14, fontWeight: "700" }, email: { color: colors.muted, fontSize: 12 },
  item: { minHeight: 44, justifyContent: "center", paddingHorizontal: 14 }, itemText: { color: colors.ink, fontSize: 14, fontWeight: "500" },
});
