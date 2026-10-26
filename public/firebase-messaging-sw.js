/* Firebase Messaging service worker. The app passes its public Firebase web
 * config in the registration URL; no private server credentials belong here. */
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

const firebaseConfigParam = new URL(self.location.href).searchParams.get("firebaseConfig");

if (firebaseConfigParam) {
  try {
    firebase.initializeApp(JSON.parse(firebaseConfigParam));
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      // FCM automatically displays notification payloads in the background.
      // For data-only pushes, this worker builds the notification itself.
      if (payload.notification) return;

      const data = payload.data || {};
      const title = data.title || "NearCash notification";
      self.registration.showNotification(title, {
        body: data.body || "",
        data: { url: data.url || "/" },
      });
    });
  } catch (error) {
    console.error("Could not initialize Firebase Messaging in the service worker.", error);
  }
}

self.addEventListener("notificationclick", (event) => {
  const requestedUrl = event.notification?.data?.url;
  // Leave Firebase's default click handling alone for automatically displayed
  // notification payloads that do not include a NearCash route.
  if (!requestedUrl) return;

  const parsedUrl = new URL(requestedUrl, self.location.origin);
  const targetUrl = parsedUrl.origin === self.location.origin ? parsedUrl.href : `${self.location.origin}/`;

  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => "focus" in client);
      if (existingClient) {
        if ("navigate" in existingClient) existingClient.navigate(targetUrl);
        return existingClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
