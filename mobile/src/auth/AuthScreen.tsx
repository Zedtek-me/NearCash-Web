import React from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { colors } from "../ui";

export type AuthMode = "login" | "signup";

export function AuthScreen({ mode, children }: React.PropsWithChildren<{ mode: AuthMode }>) {
  const isLogin = mode === "login";
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.welcome}>
          <Text style={styles.heroTitle}>{isLogin ? "Login" : "Sign Up"}</Text>
          <Text style={styles.heroSubtitle}>NearCash - An easy way vendors and clients of POS connect anywhere in Nigeria.</Text>
        </View>
      </View>
      <KeyboardAvoidingView style={styles.panel} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.tabs}>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: isLogin }} onPress={() => router.replace("/login")} style={[styles.tab, isLogin && styles.activeTab]}>
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Login</Text>
          </Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: !isLogin }} onPress={() => router.replace("/signup")} style={[styles.tab, !isLogin && styles.activeTab]}>
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.formInner}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({ label, accessory, ...props }: TextInputProps & { label: string; accessory?: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput placeholderTextColor="#9CA3AF" {...props} style={[styles.input, props.style]} />
        {accessory}
      </View>
    </View>
  );
}

export function AuthSubmit({ title, busy, onPress }: { title: string; busy?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={busy} onPress={onPress} style={[styles.submit, busy && styles.disabled]}>
      {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>{title}</Text>}
    </Pressable>
  );
}

export function GoogleButton({ busy, onPress }: { busy?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={busy} onPress={onPress} style={[styles.google, busy && styles.disabled]}>
      {busy ? <ActivityIndicator color={colors.ink} /> : <><Text style={styles.googleMark}>G</Text><Text style={styles.googleText}>Google</Text></>}
    </Pressable>
  );
}

export function AuthDivider() {
  return <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>Or</Text><View style={styles.dividerLine} /></View>;
}

export function AuthFooter({ prompt, action, mode }: { prompt: string; action: string; mode: AuthMode }) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerPrompt}>{prompt}</Text>
      <Pressable accessibilityRole="link" onPress={() => router.replace(mode === "login" ? "/signup" : "/login")}>
        <Text style={styles.footerAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

export const authText = StyleSheet.create({ error: { color: colors.danger, fontSize: 14, lineHeight: 20 }, helper: { color: colors.muted, fontSize: 13, lineHeight: 19 } });

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F172A" },
  hero: { minHeight: 205, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20, justifyContent: "space-between" },
  back: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: "#374151", alignItems: "center", justifyContent: "center" },
  backText: { color: colors.white, fontSize: 30, lineHeight: 34, marginTop: -3 },
  welcome: { gap: 8, maxWidth: 500 },
  heroTitle: { color: colors.white, fontSize: 25, fontWeight: "600" },
  heroSubtitle: { color: "#9CA3AF", fontSize: 14, lineHeight: 20 },
  panel: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20, paddingHorizontal: 18, overflow: "hidden" },
  tabs: { alignSelf: "center", width: "100%", maxWidth: 460, flexDirection: "row", padding: 4, borderRadius: 12, backgroundColor: "#F1F5F9", marginBottom: 18 },
  tab: { width: "50%", minHeight: 42, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  activeTab: { backgroundColor: colors.white, shadowColor: "#000000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  tabText: { color: "#4B5563", fontSize: 15, fontWeight: "500" },
  activeTabText: { color: colors.ink, fontWeight: "700" },
  form: { flexGrow: 1, paddingBottom: 32 },
  formInner: { width: "100%", maxWidth: 460, alignSelf: "center", gap: 17, paddingTop: 2 },
  field: { minHeight: 60, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 15, paddingVertical: 8, justifyContent: "center" },
  label: { fontSize: 12, color: "#6B7280", marginBottom: 1 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, minHeight: 27, padding: 0, color: "#111827", fontSize: 14 },
  submit: { minHeight: 52, marginTop: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand },
  submitText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  google: { minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 },
  googleMark: { color: "#4285F4", fontWeight: "800", fontSize: 19 },
  googleText: { color: "#374151", fontSize: 14, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 1 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#E5E7EB" },
  dividerText: { color: "#6B7280", fontSize: 14 },
  footer: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 4, paddingTop: 1 },
  footerPrompt: { color: "#4B5563", fontSize: 14 },
  footerAction: { color: colors.link, fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.6 },
});
