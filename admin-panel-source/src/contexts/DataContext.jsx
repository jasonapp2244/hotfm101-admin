import { createContext, useContext, useState, useEffect } from 'react'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const DataContext = createContext(null)

// Converts Firestore Timestamp, Date, or ISO string → ms for sorting
function toMs(val) {
  if (!val) return 0
  if (typeof val.toMillis === 'function') return val.toMillis()
  if (val instanceof Date) return val.getTime()
  return new Date(val).getTime()
}

function sortDocs(docs, orderField, orderDir) {
  return [...docs].sort((a, b) => {
    const aMs = toMs(a[orderField])
    const bMs = toMs(b[orderField])
    return orderDir === 'desc' ? bMs - aMs : aMs - bMs
  })
}

// Real-time collection listener — sorts client-side so no Firestore index needed.
// Exposes setData so write operations can optimistically update UI instantly.
function useCollection(collectionName, orderField = 'createdAt', orderDir = 'desc') {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, collectionName),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setData(sortDocs(docs, orderField, orderDir))
        setLoading(false)
      },
      (err) => {
        console.error(`[${collectionName}] snapshot error:`, err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [collectionName, orderField, orderDir])

  // Optimistic add — instantly inserts item into local state before Firestore confirms
  const optimisticAdd = (item) => {
    setData(prev => sortDocs([item, ...prev], orderField, orderDir))
  }

  // Optimistic update — instantly updates a single item in local state
  const optimisticUpdate = (id, updates) => {
    setData(prev => sortDocs(prev.map(d => d.id === id ? { ...d, ...updates } : d), orderField, orderDir))
  }

  // Optimistic remove — instantly removes item from local state
  const optimisticRemove = (id) => {
    setData(prev => prev.filter(d => d.id !== id))
  }

  return { data, loading, optimisticAdd, optimisticUpdate, optimisticRemove }
}

export function DataProvider({ children }) {
  const { data: users,         optimisticAdd: addUserOpt,         optimisticUpdate: updateUserOpt,         optimisticRemove: removeUserOpt         } = useCollection('users')
  const { data: articles,      optimisticAdd: addArticleOpt,      optimisticUpdate: updateArticleOpt,      optimisticRemove: removeArticleOpt      } = useCollection('articles')
  const { data: contests,      optimisticAdd: addContestOpt,      optimisticUpdate: updateContestOpt,      optimisticRemove: removeContestOpt      } = useCollection('contests')
  const { data: events,        optimisticAdd: addEventOpt,        optimisticUpdate: updateEventOpt,        optimisticRemove: removeEventOpt        } = useCollection('events')
  const { data: shoutouts,     optimisticUpdate: updateShoutoutOpt                                                                                   } = useCollection('shoutouts')
  const { data: notifications, optimisticAdd: addNotificationOpt                                                                                    } = useCollection('notifications')
  const { data: ads,           optimisticAdd: addAdOpt,           optimisticUpdate: updateAdOpt,           optimisticRemove: removeAdOpt           } = useCollection('ads')
  const { data: broadcasts,    optimisticAdd: addBroadcastOpt,    optimisticUpdate: updateBroadcastOpt,    optimisticRemove: removeBroadcastOpt    } = useCollection('broadcasts')
  const { data: adAnalyticsArray } = useCollection('adAnalytics', 'createdAt', 'desc')
  const { data: activityLog,   optimisticAdd: addActivityOpt                                                                                        } = useCollection('activityLog')

  const addActivity = async (type, text, badge, badgeColor = 'bg-gray-100 text-gray-600') => {
    try {
      const newItem = { type, text, badge, badgeColor, time: new Date().toISOString(), createdAt: Timestamp.now() }
      addActivityOpt({ id: `tmp_${Date.now()}`, ...newItem })
      await addDoc(collection(db, 'activityLog'), newItem)
    } catch (err) {
      console.error('Error adding activity:', err)
    }
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  const addUser = async (user) => {
    const newItem = {
      ...user,
      joined: new Date().toISOString().split('T')[0],
      lastActive: Timestamp.now(),
      verified: false,
      topListener: false,
      staff: ['Staff', 'Admin', 'Editor'].includes(user.role),
      createdAt: Timestamp.now(),
    }
    addUserOpt({ id: `tmp_${Date.now()}`, ...newItem })
    const ref = await addDoc(collection(db, 'users'), newItem)
    await addActivity('user', `${user.name} was added to the system.`, 'NEW USER', 'bg-emerald-50 text-emerald-700')
    return ref
  }

  const updateUser = async (id, updates) => {
    updateUserOpt(id, updates)
    await updateDoc(doc(db, 'users', id), { ...updates, updatedAt: serverTimestamp() })
    await addActivity('user', `User ${updates.name || 'record'} was updated.`, 'UPDATED', 'bg-blue-50 text-blue-700')
  }

  const deleteUser = async (id) => {
    const user = users.find((u) => u.id === id)
    removeUserOpt(id)
    await deleteDoc(doc(db, 'users', id))
    await addActivity('user', `${user?.name || 'A user'} was removed from the system.`, 'DELETED', 'bg-red-50 text-red-700')
  }

  // ── Articles ───────────────────────────────────────────────────────────────
  const addArticle = async (article) => {
    const newItem = { ...article, views: 0, date: article.draft ? null : new Date().toISOString(), createdAt: Timestamp.now() }
    addArticleOpt({ id: `tmp_${Date.now()}`, ...newItem })
    await addDoc(collection(db, 'articles'), newItem)
    await addActivity('content', `Article "${article.title}" was created.`, 'CONTENT', 'bg-blue-50 text-blue-700')
  }

  const updateArticle = async (id, updates) => {
    updateArticleOpt(id, updates)
    await updateDoc(doc(db, 'articles', id), { ...updates, updatedAt: serverTimestamp() })
  }

  const deleteArticle = async (id) => {
    const article = articles.find((a) => a.id === id)
    removeArticleOpt(id)
    await deleteDoc(doc(db, 'articles', id))
    await addActivity('content', `Article "${article?.title || ''}" was deleted.`, 'DELETED', 'bg-red-50 text-red-700')
  }

  // ── Contests ───────────────────────────────────────────────────────────────
  const addContest = async (contest) => {
    const newItem = { ...contest, entries: [], createdAt: Timestamp.now() }
    addContestOpt({ id: `tmp_${Date.now()}`, ...newItem })
    await addDoc(collection(db, 'contests'), newItem)
    await addActivity('contest', `Contest "${contest.name}" was created.`, 'CONTEST', 'bg-blue-50 text-blue-700')
  }

  const updateContest = async (id, updates) => {
    updateContestOpt(id, updates)
    await updateDoc(doc(db, 'contests', id), { ...updates, updatedAt: serverTimestamp() })
  }

  const deleteContest = async (id) => {
    const contest = contests.find((c) => c.id === id)
    removeContestOpt(id)
    await deleteDoc(doc(db, 'contests', id))
    await addActivity('contest', `Contest "${contest?.name || ''}" was deleted.`, 'DELETED', 'bg-red-50 text-red-700')
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  const addEvent = async (event) => {
    const newItem = { ...event, rsvp: 0, createdAt: Timestamp.now() }
    addEventOpt({ id: `tmp_${Date.now()}`, ...newItem })
    await addDoc(collection(db, 'events'), newItem)
    await addActivity('event', `Event "${event.name}" was created.`, 'EVENT', 'bg-amber-50 text-amber-700')
  }

  const updateEvent = async (id, updates) => {
    updateEventOpt(id, updates)
    await updateDoc(doc(db, 'events', id), { ...updates, updatedAt: serverTimestamp() })
  }

  const deleteEvent = async (id) => {
    const event = events.find((e) => e.id === id)
    removeEventOpt(id)
    await deleteDoc(doc(db, 'events', id))
    await addActivity('event', `Event "${event?.name || ''}" was deleted.`, 'DELETED', 'bg-red-50 text-red-700')
  }

  // ── Shoutouts ──────────────────────────────────────────────────────────────
  const approveShoutout = async (id) => {
    const s = shoutouts.find((s) => s.id === id)
    updateShoutoutOpt(id, { status: 'approved' })
    await updateDoc(doc(db, 'shoutouts', id), { status: 'approved', updatedAt: serverTimestamp() })
    await addActivity('shoutout', `Shoutout from ${s?.name || 'user'} was approved.`, 'APPROVED', 'bg-emerald-50 text-emerald-700')
  }

  const rejectShoutout = async (id) => {
    const s = shoutouts.find((s) => s.id === id)
    updateShoutoutOpt(id, { status: 'rejected' })
    await updateDoc(doc(db, 'shoutouts', id), { status: 'rejected', updatedAt: serverTimestamp() })
    await addActivity('shoutout', `Shoutout from ${s?.name || 'user'} was rejected.`, 'REJECTED', 'bg-red-50 text-red-700')
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  const addNotification = async (notification) => {
    const newItem = { ...notification, date: new Date().toISOString(), reach: 0, createdAt: Timestamp.now() }
    addNotificationOpt({ id: `tmp_${Date.now()}`, ...newItem })
    await addDoc(collection(db, 'notifications'), newItem)
    await addActivity('notification', `Push notification "${notification.title}" sent.`, 'PUSH', 'bg-amber-50 text-amber-700')
  }

  // ── Ads ────────────────────────────────────────────────────────────────────
  const addAd = async (ad) => {
    const newItem = { ...ad, createdAt: Timestamp.now() }
    addAdOpt({ id: `tmp_${Date.now()}`, ...newItem })
    await addDoc(collection(db, 'ads'), newItem)
    await addActivity('ad', `Ad "${ad.title}" was created.`, 'AD', 'bg-orange-50 text-orange-700')
  }

  const updateAd = async (id, updates) => {
    updateAdOpt(id, updates)
    await updateDoc(doc(db, 'ads', id), { ...updates, updatedAt: serverTimestamp() })
  }

  const deleteAd = async (id) => {
    const ad = ads.find((a) => a.id === id)
    removeAdOpt(id)
    await deleteDoc(doc(db, 'ads', id))
    await addActivity('ad', `Ad "${ad?.title || ''}" was deleted.`, 'DELETED', 'bg-red-50 text-red-700')
  }

  // ── Broadcasts ─────────────────────────────────────────────────────────────
  const addBroadcast = async (broadcast) => {
    const newItem = { ...broadcast, viewerCount: 0, createdAt: Timestamp.now() }
    addBroadcastOpt({ id: `tmp_${Date.now()}`, ...newItem })
    await addDoc(collection(db, 'broadcasts'), newItem)
    await addActivity('broadcast', `Broadcast "${broadcast.title}" was created.`, 'BROADCAST', 'bg-red-50 text-red-700')
  }

  const updateBroadcast = async (id, updates) => {
    updateBroadcastOpt(id, updates)
    await updateDoc(doc(db, 'broadcasts', id), { ...updates, updatedAt: serverTimestamp() })
  }

  const deleteBroadcast = async (id) => {
    const bc = broadcasts.find((b) => b.id === id)
    removeBroadcastOpt(id)
    await deleteDoc(doc(db, 'broadcasts', id))
    await addActivity('broadcast', `Broadcast "${bc?.title || ''}" was deleted.`, 'DELETED', 'bg-red-50 text-red-700')
  }

  // AdAnalytics page expects an object keyed by ad document id
  const adAnalytics = adAnalyticsArray.reduce((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})

  const value = {
    users, addUser, updateUser, deleteUser,
    articles, addArticle, updateArticle, deleteArticle,
    contests, addContest, updateContest, deleteContest,
    events, addEvent, updateEvent, deleteEvent,
    shoutouts, approveShoutout, rejectShoutout,
    notifications, addNotification,
    ads, addAd, updateAd, deleteAd,
    adAnalytics,
    broadcasts, addBroadcast, updateBroadcast, deleteBroadcast,
    activityLog, addActivity,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
