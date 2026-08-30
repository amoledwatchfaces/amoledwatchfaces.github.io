// Firebase Cloud Messaging Client Integration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js';

const firebaseConfig = {
  apiKey: "AIzaSyCf9OO9QZqjG94SSLunG1i_6jWjmeyxr78",
  authDomain: "awf-catalog.firebaseapp.com",
  projectId: "awf-catalog",
  storageBucket: "awf-catalog.firebasestorage.app",
  messagingSenderId: "66490687416",
  appId: "1:66490687416:web:fd95a0e0cc4a443e5b794d",
  measurementId: "G-67ECX5EWSB"
};

const VAPID_KEY = "BDoBSM37A2p1ng-rN1HC7_eWD7H5HQ5hajujQjC9dOL6uH3mN0z5EN9oJQuxCjBxYN4UJAzkvdEG_qp0T2XXfbs";

// Cloud Function endpoint to subscribe web tokens to the 'announcements' topic
const SUBSCRIBE_ENDPOINT = "https://subscribetoannouncements-66490687416.europe-west1.run.app";

const app = initializeApp(firebaseConfig);
let messaging = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.warn('Firebase Messaging not supported on this browser:', e);
  }
}

/**
 * Send the FCM token to Cloud Function to subscribe to 'announcements'
 */
async function subscribeTokenToTopic(token) {
  try {
    const res = await fetch(SUBSCRIBE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, topic: 'announcements' })
    });
    if (res.ok) {
      console.log('Successfully subscribed token to announcements topic');
    }
  } catch (err) {
    console.warn('Could not reach subscribe endpoint (will succeed once Cloud Function is deployed):', err);
  }
}

/**
 * Request notification permissions and register token.
 */
export async function requestNotificationPermission() {
  if (!messaging) {
    alert('Push notifications are not supported on this browser.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration
      });

      if (currentToken) {
        console.log('FCM Registration Token:', currentToken);
        localStorage.setItem('fcm_token', currentToken);
        localStorage.setItem('notifications_enabled', 'true');
        await subscribeTokenToTopic(currentToken);
        updateNotificationButtonState(true);
        return currentToken;
      }
    } else if (permission === 'denied') {
      alert('Notifications are blocked. Please enable them in your browser site settings if you wish to receive announcements.');
    }
  } catch (error) {
    console.error('Error enabling notifications:', error);
  }
  return null;
}

/**
 * Update UI state of notification bell button
 */
function updateNotificationButtonState(isSubscribed) {
  const btn = document.getElementById('notif-toggle');
  if (!btn) return;

  if (isSubscribed) {
    btn.classList.add('subscribed');
    btn.setAttribute('title', 'Notifications enabled');
    btn.setAttribute('aria-label', 'Notifications enabled');
  } else {
    btn.classList.remove('subscribed');
    btn.setAttribute('title', 'Enable notifications');
    btn.setAttribute('aria-label', 'Enable notifications');
  }
}

/**
 * Setup foreground message handler
 */
export function setupForegroundMessageListener() {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    const title = payload.notification?.title || payload.data?.title || 'amoledwatchfaces';
    const body = payload.notification?.body || payload.data?.body || '';
    const image = payload.notification?.image || payload.data?.image;
    
    if (Notification.permission === 'granted') {
      const options = {
        body: body,
        icon: 'assets/logo_notification.webp',
        badge: 'assets/logo_notification_badge.png',
        data: {
          url: payload.data?.url || payload.fcmOptions?.link || '/'
        }
      };
      if (image) options.image = image;

      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        if (options.data.url) window.location.href = options.data.url;
      };
    }
  });
}

// Auto-initialize button in header on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('notif-toggle');
  if (!btn) return;

  if ('Notification' in window && Notification.permission === 'granted') {
    updateNotificationButtonState(true);
  }

  btn.addEventListener('click', async () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Re-verify token
      await requestNotificationPermission();
      alert('Notifications are active! You will receive announcements for new watch faces and updates.');
    } else {
      await requestNotificationPermission();
    }
  });

  setupForegroundMessageListener();
});
