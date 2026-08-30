// Firebase Cloud Messaging Client Integration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getMessaging, getToken, deleteToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js';

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

// Cloud Function endpoint to subscribe/unsubscribe web tokens to the 'announcements' topic
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
      body: JSON.stringify({ token: token, topic: 'announcements', action: 'subscribe' })
    });
    if (res.ok) {
      console.log('Successfully subscribed token to announcements topic');
    }
  } catch (err) {
    console.warn('Could not reach subscribe endpoint:', err);
  }
}

/**
 * Send the FCM token to Cloud Function to unsubscribe from 'announcements'
 */
async function unsubscribeTokenFromTopic(token) {
  try {
    const res = await fetch(SUBSCRIBE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, topic: 'announcements', action: 'unsubscribe' })
    });
    if (res.ok) {
      console.log('Successfully unsubscribed token from announcements topic');
    }
  } catch (err) {
    console.warn('Could not reach unsubscribe endpoint:', err);
  }
}

/**
 * Request notification permissions and register token.
 */
export async function requestNotificationPermission() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

  if (!messaging) {
    if (isIOS && !isStandalone) {
      alert('On iOS / iPhone, Apple requires adding the website to your Home Screen first.\n\n1. Tap the Share button in Safari (or Chrome).\n2. Select "Add to Home Screen".\n3. Open amoledwatchfaces from your Home Screen and tap the bell icon to enable notifications.');
    } else {
      alert('Push notifications are not supported on this browser.');
    }
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
        alert('Notifications enabled! You will receive announcements for new watch faces and updates.');
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
 * Unsubscribe from notifications, delete token, and revert UI
 */
export async function unsubscribeFromNotifications() {
  if (!messaging) return;

  const currentToken = localStorage.getItem('fcm_token');
  if (currentToken) {
    await unsubscribeTokenFromTopic(currentToken);
  }

  try {
    await deleteToken(messaging);
    console.log('FCM Token deleted from client');
  } catch (err) {
    console.warn('Error deleting FCM token:', err);
  }

  localStorage.removeItem('fcm_token');
  localStorage.setItem('notifications_enabled', 'false');
  updateNotificationButtonState(false);
  alert('Notifications have been turned off on this device.');
}

/**
 * Update UI state of notification bell button
 */
function updateNotificationButtonState(isSubscribed) {
  const btn = document.getElementById('notif-toggle');
  if (!btn) return;

  if (isSubscribed) {
    btn.classList.add('subscribed');
    btn.setAttribute('title', 'Notifications active (Click to disable)');
    btn.setAttribute('aria-label', 'Notifications active (Click to disable)');
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
    console.log('Foreground message received in active tab:', payload);
  });
}

// Auto-initialize button in header on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('notif-toggle');
  if (!btn) return;

  const isEnabled = localStorage.getItem('notifications_enabled') === 'true';
  if ('Notification' in window && Notification.permission === 'granted' && isEnabled) {
    updateNotificationButtonState(true);
  } else {
    updateNotificationButtonState(false);
  }

  btn.addEventListener('click', async () => {
    const isCurrentlySubscribed = 'Notification' in window &&
      Notification.permission === 'granted' &&
      localStorage.getItem('notifications_enabled') === 'true';

    if (isCurrentlySubscribed) {
      const confirmDisable = confirm('You are currently receiving announcements.\n\nDo you want to turn off notifications on this device?');
      if (confirmDisable) {
        await unsubscribeFromNotifications();
      }
    } else {
      await requestNotificationPermission();
    }
  });

  setupForegroundMessageListener();
});
