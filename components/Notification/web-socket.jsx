import React, { useEffect, useState, useRef } from "react";
import useAuth from "../../Hooks/Auths";
import { toast } from "react-toastify";
import NotificationDialog from "./NotificationDialog";
import {
  fetchAndUpdateUserCurrentLocation,
  updateUserPosition
} from "../../utils/helpers";
import { useStateValue } from "../../providers/stateProvider";
import { useWebSocket } from "./WebSocketProvider";

const playAlertTone = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const playBeep = (startTime, frequency, duration) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    playBeep(ctx.currentTime,        880, 0.15);
    playBeep(ctx.currentTime + 0.2,  1100, 0.15);
  } catch (err) {
    console.warn("Audio playback failed:", err);
  }
};

const triggerVibration = () => {
  if ("vibrate" in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
};

const sendPushNotification = async (data) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  if (Notification.permission !== "granted") return;

  const isVendor = data.message_type === "vendor_latest_location";

  const title = data.message_type || "New Transaction";
  const body  = data?.message || "You have a new notification";

  const notification = new Notification(title, {
    body,
    //icon: "/favicon.ico", 
    //badge: "/favicon.ico",
    tag: data.message_type,
    renotify: true,
  });

  setTimeout(() => notification.close(), 6000);
};

const LOCATION_MSG_TYPES = ["New Transaction Interest"];

const EXCLUSIVE_MSGS = [
  "vendor_location_update_ack",
  "client_location_update_ack",
  "vendor_latest_location",
  "client_latest_location",
  "error"
];


const NotificationSocket = () => {
  const socket = useWebSocket();
  const [messages, setMessages] = useState("");
  const { userData } = useAuth();
  const permissionRequested = useRef(false);

  const [
    {
      businessStates: { selectedBusiness }
    }
  ] = Object.values(useStateValue());

  useEffect(() => {
    if (!permissionRequested.current && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
      permissionRequested.current = true;
    }
  }, []);

  useEffect(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    console.log("🔔 NotificationSocket listening for messages...");

    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("🔔 New WS message:", data);

      const { message_type } = data;

      if (typeof data === "string") {
        setMessages(event.data);
      }

      if (LOCATION_MSG_TYPES.includes(message_type)) {
        sendPushNotification(data);
        triggerVibration();
        playAlertTone();
        return;
      }

      if (!EXCLUSIVE_MSGS.includes(message_type)) {
        setMessages(event.data);
        toast.info(event.data, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    };

    const onError = (e) => console.log("WS error in Notification module:", e);
    const onClose = () => console.log("WS closed in Notification module");

    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);

    if (userData) {
      fetchAndUpdateUserCurrentLocation(
        updateUserPosition,
        (err) => console.log("error fetching coordinates:", err),
        { ...userData, selectedBusiness },
        socket
      );
    }

    return () => {
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("close", onClose);
    };
  }, [socket, userData, selectedBusiness]);

  return (
    <div>
      {messages && (
        <NotificationDialog message={messages} setMessage={setMessages} />
      )}
    </div>
  );
};

export default NotificationSocket;