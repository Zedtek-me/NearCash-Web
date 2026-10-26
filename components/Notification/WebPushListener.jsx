import { useEffect } from "react";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import { useWebSocket } from "./WebSocketProvider";
import { listenForWebPushMessages, showForegroundWebPush } from "../../utils/webPush";

/** Handles foreground FCM only when the live WebSocket is unavailable. */
export default function WebPushListener() {
  const { userData } = useAuth();
  const socket = useWebSocket();

  useEffect(() => {
    if (!userData?.id) return undefined;

    let cancelled = false;
    let unsubscribe;

    listenForWebPushMessages((payload) => {
      // The socket already handles active-session events and UI updates.
      // Ignore the FCM copy while it is connected to avoid double alerts.
      if (socket?.readyState === WebSocket.OPEN) return;

      const title = payload?.notification?.title || payload?.data?.title;
      const body = payload?.notification?.body || payload?.data?.body || "";
      if (!title) return;

      toast(body ? `${title}: ${body}` : title, { duration: 8000 });
      void showForegroundWebPush(payload);
    }).then((stopListening) => {
      if (cancelled) stopListening();
      else unsubscribe = stopListening;
    }).catch((error) => {
      console.warn("Firebase foreground messaging could not start.", error);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [userData?.id, socket]);

  return null;
}
