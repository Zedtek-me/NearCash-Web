import React, { useState } from "react";
import { router } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { AuthDivider, AuthField, AuthFooter, AuthScreen, AuthSubmit, GoogleButton, authText } from "../src/auth/AuthScreen";
import { colors } from "../src/ui";

export default function Login() {
  const { signIn, startGoogleAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await signIn(email.trim(), password);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const googleSignIn = async () => {
    setGoogleBusy(true);
    setError("");
    try {
      await startGoogleAuth("login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start Google sign-in.");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <AuthScreen mode="login">
      <AuthField label="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="uimasann977@gmail.com" returnKeyType="next" />
      <AuthField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoComplete="password"
        placeholder="••••••••••••"
        onSubmitEditing={() => void submit()}
        accessory={<Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} onPress={() => setShowPassword((value) => !value)} hitSlop={10}><Text style={fieldAction}>{showPassword ? "Hide" : "Show"}</Text></Pressable>}
      />

      <View style={loginOptions}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: rememberMe }} onPress={() => setRememberMe((value) => !value)} style={rememberRow}>
          <View style={[checkbox, rememberMe && checkedBox]}>{rememberMe ? <Text style={checkMark}>✓</Text> : null}</View>
          <Text style={rememberText}>Remember me</Text>
        </Pressable>
        <Pressable onPress={() => Alert.alert("Password reset", "Password reset is not available in the current app yet.")}>
          <Text style={forgotText}>Forgot password?</Text>
        </Pressable>
      </View>

      {error ? <Text accessibilityRole="alert" style={authText.error}>{error}</Text> : null}
      <AuthSubmit title="Login" busy={busy} onPress={() => void submit()} />
      <AuthDivider />
      <GoogleButton busy={googleBusy} onPress={() => void googleSignIn()} />
      <AuthFooter prompt="Don't have an account?" action="Sign Up" mode="login" />
    </AuthScreen>
  );
}

const fieldAction = { color: colors.muted, fontSize: 13, paddingLeft: 8 } as const;
const loginOptions = { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 3 } as const;
const rememberRow = { flexDirection: "row", alignItems: "center", gap: 8 } as const;
const checkbox = { width: 17, height: 17, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 4, alignItems: "center", justifyContent: "center" } as const;
const checkedBox = { backgroundColor: "#2563EB", borderColor: "#2563EB" } as const;
const checkMark = { color: "#FFFFFF", fontSize: 12, lineHeight: 14 } as const;
const rememberText = { color: "#374151", fontSize: 13 } as const;
const forgotText = { color: "#2563EB", fontSize: 13 } as const;
