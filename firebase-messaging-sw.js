// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Absolute asset URLs for reliable notification rendering
const ORIGIN = self.location.origin;
const DEFAULT_ICON = ORIGIN + '/assets/logo_notification.webp';
const DEFAULT_BADGE = ORIGIN + '/assets/logo_notification_badge.png';

/**
 * Deep search for a case-insensitive key in an object tree
 */
function findNestedValue(obj, targetKey, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 4) return null;
  const targetLower = targetKey.toLowerCase();

  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === targetLower) {
      if (typeof obj[key] === 'string' && obj[key].trim().length > 0) {
        return obj[key].trim();
      }
    }
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = findNestedValue(obj[key], targetKey, depth + 1);
      if (result) return result;
    }
  }
  return null;
}

// Intercept showNotification so that all notifications
// automatically include the custom logo, status bar badge, and Google Play action button if play_url is present.
const nativeShowNotification = self.registration.showNotification.bind(self.registration);
self.registration.showNotification = function (title, options = {}) {
  options = options || {};

  if (!options.icon) {
    options.icon = DEFAULT_ICON;
  }
  if (!options.badge) {
    options.badge = DEFAULT_BADGE;
  }

  // Extract play_url and button_text from any level of the payload data
  const playUrl = findNestedValue(options, 'play_url') || findNestedValue(options, 'playurl');
  const customButtonText = findNestedValue(options, 'button_text') || findNestedValue(options, 'buttontext');
  const buttonTitle = customButtonText || (playUrl ? 'Get it on Google Play' : null);

  if (buttonTitle && playUrl) {
    options.actions = [
      {
        action: 'open_play_store',
        title: buttonTitle
      }
    ];
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
  // (and our showNotification wrapper ensures the icon, badge, and action button are attached).
  if (payload.notification) {
    return;
  }

  const notificationTitle = payload.data?.title || 'amoledwatchfaces';
  const notificationOptions = {
    body: payload.data?.body || '',
    icon: payload.data?.icon || DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    image: payload.data?.image || payload.data?.image_url,
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to focus or open the URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const playUrl = findNestedValue(event.notification, 'play_url') || findNestedValue(event.notification, 'playurl');
  const defaultUrl = findNestedValue(event.notification, 'url') ||
    findNestedValue(event.notification, 'link') ||
    findNestedValue(event.notification, 'click_action') ||
    '/';

  let urlToOpen = defaultUrl;
  if (event.action === 'open_play_store' && playUrl) {
    urlToOpen = playUrl;
  }

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
