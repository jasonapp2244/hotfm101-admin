// Firebase Cloud Messaging Service Worker
// Must be served from the root path so it can intercept push events.
// Uses the Firebase compat (CDN) scripts — Vite env vars are NOT available here.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCodX8uSad5CbyR7ZeVYwAOnVO5U-L3WR8',
  authDomain: 'hotfm101-admin.firebaseapp.com',
  projectId: 'hotfm101-admin',
  storageBucket: 'hotfm101-admin.firebasestorage.app',
  messagingSenderId: '3440769248',
  appId: '1:3440769248:web:8c4635656ae65652ceb885',
});

const messaging = firebase.messaging();

// Handle background messages (app is closed or in background tab)
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Hot FM 101.5';
  const body  = payload.notification?.body  || '';

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data || {},
  });
});

// Open or focus the app window when user clicks the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
