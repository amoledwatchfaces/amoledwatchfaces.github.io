// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Absolute asset URLs for reliable notification rendering
const ORIGIN = self.location.origin;
const DEFAULT_ICON = ORIGIN + '/assets/logo_notification.webp';
const DEFAULT_BADGE = ORIGIN + '/assets/logo_notification_badge.png';

/**
 * Extract custom data object from Firebase Console payload
 */
function getCustomData(dataObj) {
  if (!dataObj || typeof dataObj !== 'object') return {};
  return dataObj.FCM_MSG?.data || dataObj.data || dataObj;
}

// Intercept showNotification so that Firebase Console notifications
// automatically include your custom logo, status bar badge, and Google Play button
const nativeShowNotification = self.registration.showNotification.bind(self.registration);
self.registration.showNotification = function (title, options = {}) {
  options = options || {};

  if (!options.icon) {
    options.icon = DEFAULT_ICON;
  }
  if (!options.badge) {
    options.badge = DEFAULT_BADGE;
  }

  // Read custom data sent from Firebase Console
  const customData = getCustomData(options.data);
  const playUrl = customData.play_url;
  const buttonTitle = customData.button_text || (playUrl ? 'Get it on Google Play' : null);
  const websiteUrl = customData.url || customData.link || '/';

  // Explicitly store resolved URLs in options.data for notificationclick
  if (typeof options.data !== 'object' || options.data === null) {
    options.data = {};
  }
  if (playUrl) {
    options.data.resolved_play_url = playUrl;
  }
  options.data.resolved_website_url = websiteUrl;

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

  const notifData = event.notification.data || {};
  const customData = getCustomData(notifData);

  const playUrl = notifData.resolved_play_url || customData.play_url;
  const websiteUrl = notifData.resolved_website_url || customData.url || '/';

  // Card click opens webpage ('/'), button click opens Google Play (play_url)
  let urlToOpen = websiteUrl;
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
