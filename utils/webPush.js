import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  isSupported,
  onMessage,
  onRegistered,
  register,
} from "firebase/messaging";
import firebaseWebConfig, {
  firebaseWebVapidKey,
  isFirebaseWebConfigured,
} from "../configs/firebaseWeb";

let messagingPromise;

const getWebMessaging = async () => {
  if (typeof window === "undefined" || !isFirebaseWebConfigured) return null;
  if (!(await isSupported())) return null;

  if (!messagingPromise) {
    const app = getApps().length ? getApp() : initializeApp(firebaseWebConfig);
    messagingPromise = Promise.resolve(getMessaging(app));
  }

  return messagingPromise;
};

const getServiceWorkerRegistration = async () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  // Firebase web config is public client configuration. Passing it in the
  // worker URL lets the static worker initialize without a generated config file.
  const workerUrl = new URL("/firebase-messaging-sw.js", window.location.origin);
  workerUrl.searchParams.set("firebaseConfig", JSON.stringify(firebaseWebConfig));

  return navigator.serviceWorker.register(workerUrl.toString(), { scope: "/" });
};

export const isWebPushSupported = async () => {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !isFirebaseWebConfigured
  ) {
    return false;
  }

  try {
    return await isSupported();
  } catch {
    return false;
  }
};

/** Call this only from a user gesture, such as clicking Enable notifications. */
export const enableWebPush = async () => {
  if (!isFirebaseWebConfigured) {
    throw new Error("Firebase web config and the VAPID key are not configured.");
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("This browser does not support web notifications.");
  }

  if (!window.isSecureContext && window.location.hostname !== "localhost") {
    throw new Error("Web push requires HTTPS (localhost is supported for development).");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked in this browser's site settings."
        : "Notification permission was not granted."
    );
  }

  const messaging = await getWebMessaging();
  if (!messaging) {
    throw new Error("Firebase Messaging is not supported in this browser.");
  }

  const serviceWorkerRegistration = await getServiceWorkerRegistration();
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    let settled = false;
    let timeoutId;

    const cleanup = () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };

    timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Firebase did not return an installation ID."));
    }, 15000);

    unsubscribe = onRegistered(messaging, (installationId) => {
      if (settled || !installationId) return;
      settled = true;
      cleanup();
      resolve(installationId);
    });

    register(messaging, {
      vapidKey: firebaseWebVapidKey,
      serviceWorkerRegistration,
    }).catch((error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    });
  });
};

export const listenForWebPushMessages = async (callback) => {
  const messaging = await getWebMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

export const showForegroundWebPush = async (payload) => {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) return;

  const title = payload?.notification?.title || payload?.data?.title;
  if (!title) return;

  const body = payload?.notification?.body || payload?.data?.body || "";
  const url = payload?.data?.url || "/";
  const options = { body, data: { url } };

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    } catch {
      // Fall back to the page Notification API if the worker is unavailable.
    }
  }

  const notification = new Notification(title, options);
  notification.onclick = () => {
    window.focus();
    if (url.startsWith("/")) window.location.assign(url);
    notification.close();
  };
};
