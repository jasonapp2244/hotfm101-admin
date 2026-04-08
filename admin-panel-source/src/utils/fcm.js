import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, getMessagingInstance } from '../firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

/**
 * Requests notification permission, obtains the FCM token, and saves it to
 * the `fcmTokens` Firestore collection so Cloud Functions can send push
 * notifications to this browser session.
 *
 * @param {string} uid  - Firebase Auth UID of the logged-in admin user
 * @returns {Promise<string|null>} The FCM token, or null if unavailable
 */
export async function registerFCMToken(uid) {
  try {
    if (!('Notification' in window)) {
      console.warn('[FCM] Notifications not supported in this browser.')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied.')
      return null
    }

    const messaging = await getMessagingInstance()
    if (!messaging) {
      console.warn('[FCM] Firebase Messaging not supported in this environment.')
      return null
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })

    if (token) {
      // Store token keyed by token value so duplicates are naturally deduplicated
      await setDoc(doc(db, 'fcmTokens', token), {
        token,
        uid: uid || 'admin',
        platform: 'web',
        updatedAt: serverTimestamp(),
      })
      console.log('[FCM] Token registered successfully.')
    }

    return token || null
  } catch (err) {
    // Silently swallow — FCM failure should never break the admin panel
    console.warn('[FCM] Token registration failed:', err?.message || err)
    return null
  }
}

/**
 * Sets up a foreground message listener that shows a browser notification
 * when the admin panel tab is active (the service worker handles background).
 *
 * @returns {Function} Unsubscribe function
 */
export async function listenForForegroundMessages() {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}

  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title || 'Hot FM 101.5'
    const body  = payload.notification?.body  || ''
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' })
    }
  })
}
