import React from "react";
import { Stack } from "expo-router";
import { ApolloProvider } from "@apollo/client";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { apolloClient } from "../src/api/client";
import { AuthProvider } from "../src/auth/AuthContext";
import { SocketProvider } from "../src/notifications/SocketProvider";

export default function RootLayout() {
  return <ApolloProvider client={apolloClient}><AuthProvider><SocketProvider><SafeAreaProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }} /></SafeAreaProvider></SocketProvider></AuthProvider></ApolloProvider>;
}
