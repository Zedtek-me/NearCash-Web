import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { Linking } from "react-native";
import * as SecureStore from "expo-secure-store";
import { AUTHORIZE_WITH_SOCIAL_CODE, CURRENT_USER, GOOGLE_LOGIN_URL, GOOGLE_SIGNUP_URL, LOGIN, SIGNUP } from "../api/operations";

export type User = {
  id: string; email: string; firstName?: string; lastName?: string;
  fullName?: string; username?: string; userType?: string; phoneNumber?: string; meta?: string | Record<string, unknown>;
  businesses?: Array<{ id: string; name: string; isPrimary?: boolean }>;
};
type AuthType = "login" | "signup";
const AUTH_TYPE_KEY = "nearcash_auth_type";
type AuthValue = { user: User | null; loading: boolean; signIn(email: string, password: string): Promise<void>; signUp(data: Record<string, unknown>): Promise<void>; startGoogleAuth(authType: AuthType): Promise<void>; completeGoogleAuth(code: string, authType: AuthType): Promise<void>; signOut(): Promise<void>; refresh(): Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const client = useApolloClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasStoredSession, setHasStoredSession] = useState(false);
  const [login] = useMutation(LOGIN);
  const [signup] = useMutation(SIGNUP);
  const [googleLogin] = useMutation(GOOGLE_LOGIN_URL);
  const [googleSignup] = useMutation(GOOGLE_SIGNUP_URL);
  const [authorizeWithSocialCode] = useMutation(AUTHORIZE_WITH_SOCIAL_CODE);
  const current = useQuery(CURRENT_USER, {
    skip: !hasStoredSession,
    fetchPolicy: "network-only",
    onCompleted(data) {
      if (data?.user) setUser(data.user);
      else {
        void SecureStore.deleteItemAsync("nearcash_token");
        setHasStoredSession(false);
        setUser(null);
      }
      setLoading(false);
    },
    onError() {
      void SecureStore.deleteItemAsync("nearcash_token");
      setHasStoredSession(false);
      setUser(null);
      setLoading(false);
      void client.clearStore();
    },
  });

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync("nearcash_token");
    await SecureStore.deleteItemAsync(AUTH_TYPE_KEY);
    setUser(null);
    setHasStoredSession(false);
    await client.clearStore();
  }, [client]);

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync("nearcash_token").then((token) => {
      if (!mounted) return;
      if (token) setHasStoredSession(true);
      else setLoading(false);
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const saveAuth = async (data: any) => {
    const payload = data?.data;
    if (!payload?.token || !payload?.user) throw new Error(data?.message || "Authentication failed");
    await SecureStore.setItemAsync("nearcash_token", payload.token);
    setUser(payload.user);
    setHasStoredSession(true);
    setLoading(false);
    await client.resetStore();
  };
  const signIn = async (email: string, password: string) => {
    const result = await login({ variables: { email, password } });
    await saveAuth(result.data?.login);
  };
  const signUp = async (data: Record<string, unknown>) => {
    const result = await signup({ variables: { data } });
    await saveAuth(result.data?.signup);
  };
  const startGoogleAuth = async (authType: AuthType) => {
    await SecureStore.setItemAsync(AUTH_TYPE_KEY, authType);
    await SecureStore.deleteItemAsync("nearcash_token");
    setUser(null);
    setHasStoredSession(false);
    await client.clearStore();

    const result = authType === "login"
      ? await googleLogin({ variables: { signInWith: "GOOGLE" } })
      : await googleSignup({ variables: { signUpWith: "GOOGLE" } });
    const authUrl = authType === "login"
      ? result.data?.login?.data?.authUrl
      : result.data?.signup?.data?.authUrl;
    if (!authUrl) throw new Error("The server did not return a Google sign-in URL.");
    await Linking.openURL(authUrl);
  };
  const completeGoogleAuth = async (code: string, authType: AuthType) => {
    const result = await authorizeWithSocialCode({
      variables: { code, socialType: "GOOGLE", authType },
    });
    await saveAuth(result.data?.authorizeWithCode);
    await SecureStore.deleteItemAsync(AUTH_TYPE_KEY);
  };
  const signOut = async () => { await clearSession(); };
  const refresh = async () => { if (user) await current.refetch(); };
  const value = useMemo(() => ({ user, loading, signIn, signUp, startGoogleAuth, completeGoogleAuth, signOut, refresh }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
