import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../auth/AuthContext";

type SocketContextValue = { send(payload: Record<string, unknown>): void; connected: boolean; opportunity: any; clearOpportunity(): void; latestEvent: any; clearLatestEvent(): void };
const SocketContext = createContext<SocketContextValue>({ send: () => undefined, connected: false, opportunity: null, clearOpportunity: () => undefined, latestEvent: null, clearLatestEvent: () => undefined });
export function SocketProvider({ children }: React.PropsWithChildren) {
  const { user } = useAuth(); const socket = useRef<WebSocket | null>(null); const [connected, setConnected] = useState(false); const [opportunity, setOpportunity] = useState<any>(null); const [latestEvent, setLatestEvent] = useState<any>(null);
  useEffect(() => {
    if (!user?.id) return;
    let disposed = false; let retry: ReturnType<typeof setTimeout> | undefined;
    const connect = async () => {
      const token = await SecureStore.getItemAsync("nearcash_token");
      const base = process.env.EXPO_PUBLIC_SOCKET_URL?.replace(/\/$/, "");
      if (disposed || !base || !token || !user.id) return;
      const ws = new WebSocket(`${base}/notification/${encodeURIComponent(user.id)}/?token=${encodeURIComponent(token)}`);
      socket.current = ws;
      ws.onopen = () => { setConnected(true); };
      ws.onclose = () => { setConnected(false); if (!disposed) retry = setTimeout(connect, 4000); };
      ws.onerror = () => { setConnected(false); };
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data); const type = payload?.message_type;
          if (["Transaction Opportunity!", "New FX Transaction Interest", "Liquidity Request!"].includes(type)) setOpportunity(payload);
          if (type) setLatestEvent(payload);
          if (!type || ["vendor_location_update_ack", "client_location_update_ack", "vendor_latest_location", "client_latest_location", "acceptance_ack", "opportunity_lost", "error"].includes(type)) return;
          if (["Transaction Opportunity!", "New FX Transaction Interest", "Liquidity Request!"].includes(type)) return;
          if (AppState.currentState !== "active") return;
          const title = type === "Transaction Opportunity!" ? "Cash request opportunity" : type === "New FX Transaction Interest" ? "FX request opportunity" : type === "Liquidity Request!" ? "Liquidity request" : type;
          Alert.alert(title, payload?.message || "NearCash has an update for you.");
        } catch { /* Ignore malformed server messages. */ }
      };
    };
    void connect();
    return () => { disposed = true; if (retry) clearTimeout(retry); socket.current?.close(); socket.current = null; setConnected(false); };
  }, [user?.id]);
  const send = useCallback((payload: Record<string, unknown>) => { const ws = socket.current; const json = JSON.stringify(payload); if (!ws) return; if (ws.readyState === WebSocket.OPEN) ws.send(json); else if (ws.readyState === WebSocket.CONNECTING) ws.addEventListener("open", () => ws.send(json), { once: true }); }, []);
  const value = useMemo<SocketContextValue>(() => ({ connected, opportunity, clearOpportunity: () => setOpportunity(null), latestEvent, clearLatestEvent: () => setLatestEvent(null), send }), [connected, opportunity, latestEvent, send]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
export function useNotificationSocket() { return useContext(SocketContext); }
