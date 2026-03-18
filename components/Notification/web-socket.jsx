import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import { useWebSocket } from "./WebSocketProvider";
import { useStateValue } from "../../providers/stateProvider";
import {
  fetchAndUpdateUserCurrentLocation,
  updateUserPosition,
} from "../../utils/helpers";


// ─── Audio / vibration helpers ───────────────────────────────────────────────

/**
 * A single shared AudioContext for the lifetime of the page.
 * Browsers require a user gesture before audio can play; we resume the context
 * on first interaction so that notifications that arrive without a prior
 * gesture (e.g. "Transaction Opportunity!", "New Transaction Interest") can
 * still produce sound.
 */
let _audioCtx = null;

const getAudioContext = () => {
  if (!_audioCtx) {
    const AudioCtx = window.AudioContext || window["webkitAudioContext"];
    if (!AudioCtx) return null;
    _audioCtx = new AudioCtx();
  }
  return _audioCtx;
};

// Unlock audio on first user gesture (click, touch, or keydown).
const unlockAudio = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
};

if (typeof window !== "undefined") {
  ["click", "touchstart", "keydown"].forEach((evt) =>
    window.addEventListener(evt, unlockAudio, { once: false, passive: true })
  );
}

const playAlertTone = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume in case the context is still suspended (e.g. very first message).
    const play = () => {
      const playBeep = (startTime, frequency, duration) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playBeep(ctx.currentTime, 880, 0.15);
      playBeep(ctx.currentTime + 0.2, 1100, 0.15);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(play);
    } else {
      play();
    }
  } catch {
    // audio blocked — silent fallback
  }
};

const triggerVibration = () => {
  if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
};


// ─── Push notification helper ─────────────────────────────────────────────────

const sendPushNotification = async (title, body, onClick) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") await Notification.requestPermission();
  if (Notification.permission !== "granted") return;

  const notif = new Notification(title, { body, tag: title, renotify: true });
  if (onClick) notif.onclick = onClick;
  setTimeout(() => notif.close(), 10000);
};


// ─── Message type constants ───────────────────────────────────────────────────

/**
 * These message types trigger user-visible toast notifications.
 * Keep in sync with the backend's notify_client_of_txn_status and
 * other_vendor_transaction_notif tasks.
 */
export const PUSH_NOTIF_MSG_TYPES = [
  "New Transaction Interest",
  "Transaction Initiated!",
  "Transaction Approved!",
  "Transaction Declined!",
  "Transaction Cancelled!",
  "Vendor Response Delayed",
];

/**
 * These are silent protocol messages — they carry data for UI updates
 * but must not produce any toast.
 */
export const EXCLUSIVE_MSGS = [
  "vendor_location_update_ack",
  "client_location_update_ack",
  "vendor_latest_location",
  "client_latest_location",
  "error",
  "No Available Vendors",
  "Vendor Response Delayed",
  "acceptance_ack",
  "opportunity_lost",
];

const OPPORTUNITY_MSG_TYPE = "Transaction Opportunity!";
const PENDING_OPPORTUNITY_KEY = "pending_transaction_opportunity";


// ─── NotificationSocket component ─────────────────────────────────────────────

/**
 * Mounts once per dashboard page (ClientDashboard or VendorDashboard).
 * Responsibilities:
 *  1. Listen to WebSocket messages and route them.
 *  2. Fire exactly ONE toast per notification message (react-hot-toast only).
 *  3. Call onOpportunity for vendor opportunity messages.
 *  4. Keep the user's live location streaming to the backend.
 *
 * NOT mounted at the app root — each dashboard mounts its own instance.
 */
const NotificationSocket = ({ onOpportunity, onNewInterest }) => {
  const socket    = useWebSocket();
  const { userData } = useAuth();
  const permissionRequested = useRef(false);

  const [{ businessStates: { selectedBusiness } }] = Object.values(useStateValue());

  // ── Request browser notification permission once ─────────────────────────
  useEffect(() => {
    if (
      !permissionRequested.current &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
      permissionRequested.current = true;
    }
  }, []);

  // ── Re-open any opportunity that arrived while the page was backgrounded ─
  useEffect(() => {
    const pending = localStorage.getItem(PENDING_OPPORTUNITY_KEY);
    if (pending && onOpportunity) {
      try {
        onOpportunity(JSON.parse(pending));
      } catch {
        // malformed stored data — discard
      } finally {
        localStorage.removeItem(PENDING_OPPORTUNITY_KEY);
      }
    }
  }, [onOpportunity]);

  // ── Main WebSocket message handler ───────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onMessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      const { message_type } = (
        data && typeof data === "object" && !Array.isArray(data)
          ? data
          : { message_type: data }
      );

      // ── Transaction opportunity (vendor only) ──────────────────────────
      if (message_type === OPPORTUNITY_MSG_TYPE) {
        playAlertTone();
        triggerVibration();

        if (onOpportunity) {
          onOpportunity(data);
        }

        const amount     = Number(data?.txn_info?.amount || 0).toLocaleString();
        const clientName = data?.txn_info?.client_name || "a client";

        sendPushNotification(
          "New Cash Request",
          `₦${amount} from ${clientName}`,
          () => {
            localStorage.setItem(PENDING_OPPORTUNITY_KEY, JSON.stringify(data));
            window.focus();
            if (window.location.pathname !== "/dashboard/vendor") {
              window.location.href = "/dashboard/vendor";
            }
          }
        );

        toast(`New opportunity: ₦${amount} from ${clientName}`, {
          duration: 8000,
          icon: "💰",
        });

        return;
      }

      // ── Delayed-response alert — sound + vibration only, no toast ────────
      if (message_type === "Vendor Response Delayed") {
        playAlertTone();
        triggerVibration();
        return;
      }

      // ── Silent protocol messages — no toast ────────────────────────────
      if (EXCLUSIVE_MSGS.includes(message_type)) return;

      // ── User-facing notification messages — single toast ───────────────
      if (PUSH_NOTIF_MSG_TYPES.includes(message_type)) {
        playAlertTone();
        triggerVibration();
        sendPushNotification(message_type, data?.message || "");

        const txnInfo    = data?.txn_info;
        const amount     = txnInfo?.amount;
        const amountStr  = amount ? `₦${Number(amount).toLocaleString()}` : null;

        let label;
        if (message_type === "New Transaction Interest") {
          const clientName  = txnInfo?.client_name || "A client";
          const bizName     = txnInfo?.vendor_name ? ` → ${txnInfo.vendor_name}` : "";
          label = amountStr
            ? `${clientName} wants to withdraw ${amountStr}${bizName}`
            : `New transaction interest from ${clientName}${bizName}`;
          onNewInterest?.();
        } else {
          label = amountStr ? `${message_type} · ${amountStr}` : message_type;
        }

        toast(label, { duration: 5000 });
      }
    };

    socket.addEventListener("message", onMessage);
    return () => socket.removeEventListener("message", onMessage);
  }, [socket, onOpportunity, onNewInterest]);

  // ── Live location streaming ──────────────────────────────────────────────
  useEffect(() => {
    if (!userData?.id) return;
    return fetchAndUpdateUserCurrentLocation(
      updateUserPosition,
      () => {},
      { ...userData, selectedBusiness },
      socket
    );
  }, [socket, userData?.id, selectedBusiness]);

  return null;
};

export default NotificationSocket;
