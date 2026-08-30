// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Absolute asset URLs for reliable notification rendering
const ORIGIN = self.location.origin;
const DEFAULT_ICON = ORIGIN + '/assets/logo_notification.webp';
const DEFAULT_BADGE = ORIGIN + '/assets/logo_notification_badge.png';

// Intercept showNotification so that Firebase SDK automatic notifications
// always include your custom logo and status bar badge even when omitted in Firebase Console.
const nativeShowNotification = self.registration.showNotification.bind(self.registration);
self.registration.showNotification = function (title, options = {}) {
  options = options || {};
  if (!options.icon) {
    options.icon = DEFAULT_ICON;
  }
  if (!options.badge) {
    options.badge = DEFAULT_BADGE;
  }
  return nativeShowNotification(title, options);
};

firebase.initializeApp({
  apiKey: "AIzaSyCf9OO9QZqjG94SSLunG1i_6jWjmeyxr78",
  authDomain: "awf-catalog.firebaseapp.com",
  projectId: "awf-catalog",
  storageBucket: "awf-catalog.firebasestorage.app",
  messagingSenderId: "66490687416",
  appId: "1:66490687416:web:fd95a0e0cc4a443e5b794d"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  // If the push already contains a notification payload, Firebase SDK displays it automatically
  // (and our showNotification wrapper ensures the icon and badge are attached).
  if (payload.notification) {
    return;
  }

  const notificationTitle = payload.data?.title || 'amoledwatchfaces';
  const notificationOptions = {
    body: payload.data?.body || '',
    icon: payload.data?.icon || DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    image: payload.data?.image || payload.data?.image_url,
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || '/'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to focus or open the URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification?.data?.url ||
    event.notification?.data?.FCM_MSG?.notification?.click_action ||
    event.notification?.data?.link ||
    '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
