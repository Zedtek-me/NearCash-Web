import React, { useState } from "react";
import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { AuthDivider, AuthField, AuthFooter, AuthScreen, AuthSubmit, GoogleButton, authText } from "../src/auth/AuthScreen";

export default function Signup() {
  const { signUp, startGoogleAuth } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await signUp({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password });
      router.replace("/role");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create account.");
    } finally {
      setBusy(false);
    }
  };

  const googleSignUp = async () => {
    setGoogleBusy(true);
    setError("");
    try {
      await startGoogleAuth("signup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start Google sign-up.");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <AuthScreen mode="signup">
      <AuthField label="First Name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoComplete="given-name" placeholder="John" returnKeyType="next" />
      <AuthField label="Last Name" value={lastName} onChangeText={setLastName} autoCapitalize="words" autoComplete="family-name" placeholder="Doe" returnKeyType="next" />
      <AuthField label="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="uimasann977@gmail.com" returnKeyType="next" />
      <AuthField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        placeholder="••••••••••••"
        returnKeyType="next"
        accessory={<Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} onPress={() => setShowPassword((value) => !value)} hitSlop={10}><Text style={fieldAction}>{showPassword ? "Hide" : "Show"}</Text></Pressable>}
      />
      <AuthField
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        autoComplete="new-password"
        placeholder="••••••••••••"
        onSubmitEditing={() => void submit()}
        accessory={<Pressable accessibilityRole="button" accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"} onPress={() => setShowConfirmPassword((value) => !value)} hitSlop={10}><Text style={fieldAction}>{showConfirmPassword ? "Hide" : "Show"}</Text></Pressable>}
      />
      {error ? <Text accessibilityRole="alert" style={authText.error}>{error}</Text> : null}
      <AuthSubmit title="Signup" busy={busy} onPress={() => void submit()} />
      <AuthDivider />
      <GoogleButton busy={googleBusy} onPress={() => void googleSignUp()} />
      <AuthFooter prompt="Already have an account?" action="Login" mode="signup" />
    </AuthScreen>
  );
}

const fieldAction = { color: "#6B7280", fontSize: 13, paddingLeft: 8 } as const;
