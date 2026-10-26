import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../src/auth/AuthContext";
import { Button, Message, Screen, textStyles } from "../../src/ui";

const AUTH_TYPE_KEY = "nearcash_auth_type";

export default function GoogleAuthCallback() {
  const params = useLocalSearchParams<{ code?: string | string[]; error?: string | string[]; error_description?: string | string[] }>();
  const { completeGoogleAuth } = useAuth();
  const [message, setMessage] = useState("Completing Google sign-in…");
  const [error, setError] = useState(false);
  const handled = useRef(false);
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const providerError = Array.isArray(params.error) ? params.error[0] : params.error;
  const providerErrorDescription = Array.isArray(params.error_description) ? params.error_description[0] : params.error_description;

  useEffect(() => {
    if (handled.current) return;
    if (providerError) {
      handled.current = true;
      setError(true);
      setMessage(providerErrorDescription || "Google sign-in was cancelled or rejected.");
      return;
    }
    if (!code) return;
    handled.current = true;
    let active = true;
    void (async () => {
      try {
        const authType = await SecureStore.getItemAsync(AUTH_TYPE_KEY);
        if (authType !== "login" && authType !== "signup") {
          throw new Error("The sign-in session expired. Please try again.");
        }
        await completeGoogleAuth(code, authType);
        if (active) router.replace(authType === "signup" ? "/role" : "/");
      } catch (cause) {
        if (active) {
          setError(true);
          setMessage(cause instanceof Error ? cause.message : "Could not complete Google sign-in.");
        }
      }
    })();
    return () => { active = false; };
  }, [code, providerError, providerErrorDescription, completeGoogleAuth]);

  return (
    <Screen>
      <View style={{ gap: 16, paddingTop: 30 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#111111" }}>{error ? "Google sign-in failed" : "Signing in"}</Text>
        <Message error={error}>{message}</Message>
        {error ? <Button title="Back to login" onPress={() => router.replace("/login")} /> : null}
        {!code && !providerError ? <Text style={textStyles.muted}>Waiting for the Google callback…</Text> : null}
        {!code && !providerError ? <Button title="Return to login" secondary onPress={() => router.replace("/login")} /> : null}
      </View>
    </Screen>
  );
}
