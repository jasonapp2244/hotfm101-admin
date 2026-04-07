/**
 * HOT FM 101.5 — Firestore Seed Script
 *
 * Setup:
 *   1. Download service account key from Firebase Console:
 *      Project Settings → Service Accounts → Generate new private key
 *      Save as: backend-source/serviceAccountKey.json
 *
 * Commands:
 *   node seed.js              → seed all demo data (keeps existing docs)
 *   node seed.js --clear      → wipe then re-seed (fresh demo data)
 *   node seed.js --wipe       → DELETE all demo data only (production ready)
 *   node seed.js --wipe --keep-admin  → wipe demo data but keep admins collection
 */

const admin = require('firebase-admin')
const path = require('path')

// ─── CONFIG ───────────────────────────────────────────────────────────────────

// Accepts serviceAccountKey.json or any *firebase-adminsdk*.json in this folder
const SERVICE_ACCOUNT_PATH = (() => {
  const fs = require('fs')
  const fixed = path.join(__dirname, 'serviceAccountKey.json')
  if (fs.existsSync(fixed)) return fixed
  // auto-detect downloaded service account file
  const found = fs.readdirSync(__dirname).find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'))
  return found ? path.join(__dirname, found) : fixed
})()

// Your admin user UID from Firebase Console → Authentication → Users
const ADMIN_UID = 'RP6YvSCbCgfyjHUK2KDrEEqz'   // ← your Firebase Auth UID (copy full value from Console)
const ADMIN_NAME = 'Admin'
const ADMIN_EMAIL = 'admin@hot101.com'

// ─── INIT ─────────────────────────────────────────────────────────────────────

let serviceAccount
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH)
} catch {
  console.error('\n❌  serviceAccountKey.json not found.')
  console.error('    Download it from Firebase Console → Project Settings → Service Accounts')
  console.error(`    Save it as: ${SERVICE_ACCOUNT_PATH}\n`)
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const now = admin.firestore.Timestamp.now()
const ts = (isoStr) => isoStr ? admin.firestore.Timestamp.fromDate(new Date(isoStr)) : null

const seedData = {
  // ── USERS ──────────────────────────────────────────────────────────────────
  users: [
    { id: 'u1',  name: 'Sarah Connor',     email: 'sarah.c@skynet.com',       joined: '2023-10-12', lastActive: ts('2024-06-15T10:30:00'), status: 'Active',   role: 'Listener', verified: true,  topListener: true,  staff: false },
    { id: 'u2',  name: 'James Miller',     email: 'j.miller@mediahub.org',    joined: '2023-09-28', lastActive: ts('2024-06-14T08:00:00'), status: 'Disabled', role: 'Editor',   verified: true,  topListener: false, staff: true  },
    { id: 'u3',  name: 'Elena Kovic',      email: 'elena.kovic@sonic.io',     joined: '2024-01-05', lastActive: ts('2024-06-15T10:15:00'), status: 'Active',   role: 'Admin',    verified: true,  topListener: false, staff: true  },
    { id: 'u4',  name: 'Brandon Tye',      email: 'b.tye@freelance.fm',       joined: '2023-12-18', lastActive: ts('2024-06-15T06:00:00'), status: 'Pending',  role: 'Listener', verified: false, topListener: false, staff: false },
    { id: 'u5',  name: 'Maya Lopez',       email: 'maya.lopez@onair.com',     joined: '2024-02-22', lastActive: ts('2024-06-15T10:32:00'), status: 'Active',   role: 'Staff',    verified: true,  topListener: true,  staff: true  },
    { id: 'u6',  name: 'DJ Z-Blast',       email: 'zblast@hot1015.com',       joined: '2023-03-10', lastActive: ts('2024-06-15T09:45:00'), status: 'Active',   role: 'Staff',    verified: true,  topListener: false, staff: true  },
    { id: 'u7',  name: 'Marcus Chen',      email: 'marcus.chen@gmail.com',    joined: '2024-06-15', lastActive: ts('2024-06-15T10:27:00'), status: 'Active',   role: 'Listener', verified: false, topListener: false, staff: false },
    { id: 'u8',  name: 'Priya Sharma',     email: 'priya.s@outlook.com',      joined: '2023-07-04', lastActive: ts('2024-06-13T14:22:00'), status: 'Active',   role: 'Listener', verified: true,  topListener: true,  staff: false },
    { id: 'u9',  name: 'Tom Nguyen',       email: 'tom.ng@sonic.io',          joined: '2023-11-15', lastActive: ts('2024-06-10T11:00:00'), status: 'Disabled', role: 'Editor',   verified: true,  topListener: false, staff: true  },
    { id: 'u10', name: 'Ashley Brooks',    email: 'ashley.b@hot1015.com',     joined: '2024-03-01', lastActive: ts('2024-06-15T08:30:00'), status: 'Active',   role: 'Admin',    verified: true,  topListener: false, staff: true  },
    { id: 'u11', name: 'Carlos Rivera',    email: 'carlos.r@fm.com',          joined: '2023-08-20', lastActive: ts('2024-06-14T16:45:00'), status: 'Active',   role: 'Listener', verified: true,  topListener: true,  staff: false },
    { id: 'u12', name: 'Zoe Kim',          email: 'zoe.kim@beats.co',         joined: '2024-01-30', lastActive: ts('2024-06-12T09:10:00'), status: 'Active',   role: 'Listener', verified: false, topListener: false, staff: false },
    { id: 'u13', name: "Liam O'Brien",     email: 'liam.ob@radio.net',        joined: '2023-06-12', lastActive: ts('2024-06-15T07:55:00'), status: 'Active',   role: 'Listener', verified: true,  topListener: false, staff: false },
    { id: 'u14', name: 'Fatima Al-Hassan', email: 'fatima.h@music.org',       joined: '2024-04-08', lastActive: ts('2024-06-11T13:20:00'), status: 'Pending',  role: 'Listener', verified: false, topListener: false, staff: false },
    { id: 'u15', name: 'Derek Washington', email: 'derek.w@station.fm',       joined: '2023-05-22', lastActive: ts('2024-06-14T19:00:00'), status: 'Active',   role: 'Staff',    verified: true,  topListener: false, staff: true  },
    { id: 'u16', name: 'Nina Petrova',     email: 'nina.p@audio.com',         joined: '2023-09-03', lastActive: ts('2024-06-08T10:00:00'), status: 'Disabled', role: 'Listener', verified: true,  topListener: false, staff: false },
    { id: 'u17', name: 'Jake Sullivan',    email: 'jake.s@livefm.co',         joined: '2024-02-14', lastActive: ts('2024-06-15T10:05:00'), status: 'Active',   role: 'Listener', verified: false, topListener: false, staff: false },
    { id: 'u18', name: 'Amara Osei',       email: 'amara.o@groove.fm',        joined: '2023-12-01', lastActive: ts('2024-06-14T22:30:00'), status: 'Active',   role: 'Listener', verified: true,  topListener: true,  staff: false },
    { id: 'u19', name: 'Ryan Park',        email: 'ryan.p@hot1015.com',       joined: '2023-04-18', lastActive: ts('2024-06-15T09:00:00'), status: 'Active',   role: 'Editor',   verified: true,  topListener: false, staff: true  },
    { id: 'u20', name: 'Sophie Turner',    email: 'sophie.t@media.co',        joined: '2024-05-10', lastActive: ts('2024-06-15T10:20:00'), status: 'Active',   role: 'Listener', verified: false, topListener: false, staff: false },
    { id: 'u21', name: 'Marco Diaz',       email: 'marco.d@beats.fm',         joined: '2023-10-30', lastActive: ts('2024-06-13T15:45:00'), status: 'Active',   role: 'Listener', verified: true,  topListener: false, staff: false },
    { id: 'u22', name: 'Hana Yuki',        email: 'hana.y@sonic.io',          joined: '2024-01-18', lastActive: ts('2024-06-09T12:00:00'), status: 'Pending',  role: 'Listener', verified: false, topListener: false, staff: false },
    { id: 'u23', name: 'David Jones',      email: 'david.j@hot1015.com',      joined: '2022-08-01', lastActive: ts('2024-06-15T10:30:00'), status: 'Active',   role: 'Editor',   verified: true,  topListener: false, staff: true  },
    { id: 'u24', name: 'Sarah Miller',     email: 'sarah.m@sonic.io',         joined: '2023-02-15', lastActive: ts('2024-06-15T09:30:00'), status: 'Active',   role: 'Editor',   verified: true,  topListener: false, staff: true  },
    { id: 'u25', name: 'Alex Rivera',      email: 'alex.r@hot1015.com',       joined: '2022-01-10', lastActive: ts('2024-06-15T10:32:00'), status: 'Active',   role: 'Admin',    verified: true,  topListener: false, staff: true  },
  ],

  // ── ARTICLES ───────────────────────────────────────────────────────────────
  articles: [
    { id: 'a1',  title: 'Top 10 Indie Artists to Watch This Summer',       body: 'Discover the hottest indie artists making waves this summer season.',      tag: 'MUSIC',           views: 4200,  author: 'David Jones',  date: '2023-10-24T10:30:00', featured: true,  live: true,  draft: false },
    { id: 'a2',  title: 'The Future of Digital Radio: Trends for 2025',    body: 'Exploring the digital transformation reshaping the radio industry.',       tag: 'INDUSTRY',        views: 1800,  author: 'Sarah Miller', date: null,                  featured: false, live: false, draft: true  },
    { id: 'a3',  title: 'Exclusive Interview: Behind the Booth with MC Sonic', body: "An intimate look at the life of one of radio's most iconic voices.",   tag: 'ARTIST SPOTLIGHT',views: 12500, author: 'David Jones',  date: '2023-10-21T21:15:00', featured: false, live: true,  draft: false },
    { id: 'a4',  title: 'Summer Festival Guide 2024',                       body: 'Your complete guide to the hottest music festivals this summer.',          tag: 'MUSIC',           views: 8900,  author: 'Sarah Miller', date: '2024-05-15T08:00:00', featured: true,  live: true,  draft: false },
    { id: 'a5',  title: 'How Podcasting is Changing Radio',                 body: 'The rise of podcasting and what it means for traditional radio.',          tag: 'INDUSTRY',        views: 3400,  author: 'David Jones',  date: '2024-04-10T14:30:00', featured: false, live: true,  draft: false },
    { id: 'a6',  title: 'DJ Z-Blast: From Underground to Mainstream',       body: 'The incredible journey of our morning show host.',                        tag: 'ARTIST SPOTLIGHT',views: 7600,  author: 'Sarah Miller', date: '2024-03-20T09:00:00', featured: true,  live: true,  draft: false },
    { id: 'a7',  title: 'Best Headphones for Music Lovers 2024',            body: 'Our top picks for audiophile-grade headphones.',                          tag: 'TECH',            views: 2100,  author: 'David Jones',  date: null,                  featured: false, live: false, draft: true  },
    { id: 'a8',  title: 'Live Concert Photography Tips',                    body: 'How to capture the perfect shot at your next concert.',                   tag: 'LIFESTYLE',       views: 1500,  author: 'Sarah Miller', date: '2024-06-01T11:00:00', featured: false, live: true,  draft: false },
    { id: 'a9',  title: 'The Evolution of Hip-Hop in Florida',              body: 'Tracing the roots and rise of Florida hip-hop.',                          tag: 'MUSIC',           views: 5800,  author: 'David Jones',  date: '2024-05-28T16:00:00', featured: false, live: true,  draft: false },
    { id: 'a10', title: 'Radio Advertising in the Digital Age',             body: 'How brands are leveraging radio in 2024.',                                tag: 'INDUSTRY',        views: 920,   author: 'Sarah Miller', date: null,                  featured: false, live: false, draft: true  },
    { id: 'a11', title: 'Listener Spotlight: Top Fan Stories',              body: 'Heartwarming stories from our most dedicated listeners.',                 tag: 'COMMUNITY',       views: 4100,  author: 'David Jones',  date: '2024-06-10T13:00:00', featured: false, live: true,  draft: false },
    { id: 'a12', title: 'Morning Show Behind the Scenes',                   body: 'A day in the life of our morning show crew.',                             tag: 'LIFESTYLE',       views: 6200,  author: 'Sarah Miller', date: '2024-06-05T07:30:00', featured: true,  live: true,  draft: false },
  ],

  // ── CONTESTS ───────────────────────────────────────────────────────────────
  contests: [
    { id: 'CNST-2024-001', name: 'Summer Festival Pass Giveaway', prize: 'VIP Access for 2 + Hotel',       value: 2500, start: '2024-06-12', end: '2024-07-01', status: 'Active',  entries: ['Marcus Chen','Sarah Connor','Maya Lopez','Priya Sharma','Ashley Brooks','Carlos Rivera','Sophie Turner','Amara Osei','Jake Sullivan',"Liam O'Brien"] },
    { id: 'CNST-2024-042', name: 'Hot FM Studio Tour VIP',        prize: 'Studio Tour + Live Shoutout',    value: 500,  start: '2024-06-20', end: '2024-06-30', status: 'Active',  entries: ['Elena Kovic','Zoe Kim','Marco Diaz'] },
    { id: 'CNST-2024-009', name: 'Morning Show Watch Prize',      prize: 'Designer Watch Collection',      value: 1200, start: '2024-06-25', end: '2024-07-15', status: 'Active',  entries: ['Derek Washington','Hana Yuki'] },
    { id: 'CNST-2024-015', name: 'Concert Ticket Bundle',         prize: '10 Concert Tickets Package',     value: 800,  start: '2024-05-01', end: '2024-05-31', status: 'Expired', entries: ['Sarah Connor','Maya Lopez','Carlos Rivera','Tom Nguyen','Nina Petrova'] },
    { id: 'CNST-2024-020', name: 'DJ for a Day Experience',       prize: 'Full Studio Session',            value: 1500, start: '2024-04-15', end: '2024-05-15', status: 'Expired', entries: ['Brandon Tye','Jake Sullivan'] },
    { id: 'CNST-2024-025', name: 'Vinyl Record Collection',       prize: 'Rare Vinyl Collection',          value: 350,  start: '2024-07-01', end: '2024-07-31', status: 'Draft',   entries: [] },
    { id: 'CNST-2024-030', name: 'Beach Party VIP Package',       prize: 'VIP Beach Party Access',         value: 600,  start: '2024-06-01', end: '2024-06-15', status: 'Active',  entries: ['Amara Osei','Ryan Park','Sophie Turner','Fatima Al-Hassan'] },
    { id: 'CNST-2024-035', name: 'Music Gear Giveaway',           prize: 'Professional Headphones + Speaker', value: 400, start: '2024-03-01', end: '2024-03-31', status: 'Expired', entries: ["Priya Sharma","Liam O'Brien",'Marco Diaz'] },
  ],

  // ── EVENTS ─────────────────────────────────────────────────────────────────
  events: [
    { id: 'e1', name: 'Summer Soundwaves 2024',   type: 'MUSIC FESTIVAL',   date: '2024-08-15', time: '07:00 PM EST', location: 'Central Beach Arena',     rsvp: 2450, capacity: 3000, status: 'Selling Fast'  },
    { id: 'e2', name: 'Live Morning Talk Show',   type: 'LIVE REMOTE',      date: '2024-08-18', time: '08:00 AM EST', location: 'Coffee House Downtown',   rsvp: 128,  capacity: 200,  status: 'Scheduled'     },
    { id: 'e3', name: 'Hot FM Artist Awards',     type: 'GALA NIGHT',       date: '2024-09-05', time: '08:00 PM EST', location: 'Grand Plaza Theater',     rsvp: 1200, capacity: 1200, status: 'Waitlist Only' },
    { id: 'e4', name: 'Midnight Rooftop Sessions',type: 'LIVE PERFORMANCE', date: '2024-06-15', time: '10:00 PM EST', location: 'Sky Lounge',              rsvp: 420,  capacity: 500,  status: 'Selling Fast'  },
    { id: 'e5', name: 'Jazz & Blues Evening',     type: 'CONCERT',          date: '2024-07-20', time: '07:30 PM EST', location: 'Riverside Amphitheater',  rsvp: 340,  capacity: 600,  status: 'Scheduled'     },
    { id: 'e6', name: 'Community Outreach Day',   type: 'COMMUNITY EVENT',  date: '2024-07-04', time: '10:00 AM EST', location: 'City Park Pavilion',      rsvp: 800,  capacity: 1000, status: 'Scheduled'     },
    { id: 'e7', name: 'Spring Music Fest',        type: 'MUSIC FESTIVAL',   date: '2024-04-20', time: '02:00 PM EST', location: 'Downtown Arena',          rsvp: 3500, capacity: 3500, status: 'Sold Out'      },
    { id: 'e8', name: 'DJ Masterclass Workshop',  type: 'WORKSHOP',         date: '2024-05-10', time: '01:00 PM EST', location: 'Hot FM Studio',           rsvp: 45,   capacity: 50,   status: 'Sold Out'      },
  ],

  // ── SHOUTOUTS ──────────────────────────────────────────────────────────────
  shoutouts: [
    { id: 's1',  name: 'Sarah Jenkins',  time: '2024-06-15T10:28:00', location: 'Clearwater, FL',    priority: 'high',   status: 'pending',  gradient: 'from-pink-400 to-rose-500'     },
    { id: 's2',  name: 'Marcus V.',      time: '2024-06-15T10:15:00', location: 'Tampa, FL',         priority: 'normal', status: 'pending',  gradient: 'from-cyan-400 to-blue-500'     },
    { id: 's3',  name: 'Elena Rodriguez',time: '2024-06-15T10:02:00', location: 'Miami, FL',         priority: 'normal', status: 'pending',  gradient: 'from-purple-400 to-pink-500'   },
    { id: 's4',  name: 'DJ K-Flow',      time: '2024-06-15T09:48:00', location: 'Orlando, FL',       priority: 'normal', status: 'pending',  gradient: 'from-indigo-400 to-violet-500' },
    { id: 's5',  name: 'Largo Crew',     time: '2024-06-15T09:30:00', location: 'Largo, FL',         priority: 'normal', status: 'pending',  gradient: 'from-amber-400 to-orange-500'  },
    { id: 's6',  name: 'Audio Addict',   time: '2024-06-15T09:30:00', location: 'St. Petersburg, FL',priority: 'normal', status: 'pending',  gradient: 'from-emerald-400 to-teal-500'  },
    { id: 's7',  name: 'Tommy Bass',     time: '2024-06-15T08:50:00', location: 'Jacksonville, FL',  priority: 'normal', status: 'approved', gradient: 'from-rose-400 to-red-500'      },
    { id: 's8',  name: 'Luna Wave',      time: '2024-06-15T08:30:00', location: 'Sarasota, FL',      priority: 'normal', status: 'approved', gradient: 'from-blue-400 to-indigo-500'   },
    { id: 's9',  name: 'Neon Nights',    time: '2024-06-15T08:10:00', location: 'Fort Lauderdale, FL',priority: 'normal', status: 'approved', gradient: 'from-violet-400 to-purple-500' },
    { id: 's10', name: 'Beach Vibes',    time: '2024-06-15T07:45:00', location: 'Naples, FL',        priority: 'normal', status: 'rejected', gradient: 'from-orange-400 to-red-500'    },
    { id: 's11', name: 'Static Fred',    time: '2024-06-15T07:20:00', location: 'Gainesville, FL',   priority: 'normal', status: 'rejected', gradient: 'from-gray-400 to-slate-500'    },
    { id: 's12', name: 'Melody Maker',   time: '2024-06-15T09:55:00', location: 'Tallahassee, FL',   priority: 'normal', status: 'pending',  gradient: 'from-teal-400 to-cyan-500'     },
    { id: 's13', name: 'Sonic Youth',    time: '2024-06-15T09:40:00', location: 'Pensacola, FL',     priority: 'normal', status: 'pending',  gradient: 'from-pink-400 to-fuchsia-500'  },
    { id: 's14', name: 'Vinyl Queen',    time: '2024-06-15T09:20:00', location: 'Daytona Beach, FL', priority: 'high',   status: 'pending',  gradient: 'from-yellow-400 to-amber-500'  },
    { id: 's15', name: 'Bass Drop Mike', time: '2024-06-15T09:00:00', location: 'Key West, FL',      priority: 'normal', status: 'approved', gradient: 'from-lime-400 to-green-500'    },
  ],

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
  notifications: [
    { id: 'n1', title: 'Weekly Chart Reveal',    message: 'The Top 40 songs of the week are out! See who made the list.',           target: 'Live Stream',   date: '2023-10-22T14:30:00', sentBy: 'Marcus J.',  reach: 12400, time: '2023-10-22T14:30:00' },
    { id: 'n2', title: 'Emergency Traffic Alert',message: 'Major delay on I-95 North. Switch to alternate routes.',                  target: 'News Article',  date: '2023-10-21T08:12:00', sentBy: 'Sarah K.',   reach: 45800, time: '2023-10-21T08:12:00' },
    { id: 'n3', title: 'Ticket Giveaway: Neon Pulse', message: "We're giving away 5 pairs of VIP passes in 1 hour!",               target: 'Contest Page',  date: '2023-10-20T19:00:00', sentBy: 'Admin User', reach: 31200, time: '2023-10-20T19:00:00' },
    { id: 'n4', title: 'New Morning Show Host',  message: 'Welcome DJ Z-Blast to the Morning Mix! Tune in at 6 AM.',                target: 'Live Stream',   date: '2023-10-18T06:00:00', sentBy: 'Admin User', reach: 28500, time: '2023-10-18T06:00:00' },
    { id: 'n5', title: 'Summer Jam Contest Open',message: 'Enter to win VIP passes to Summer Jams 2024!',                          target: 'Contest Page',  date: '2023-10-15T12:00:00', sentBy: 'Marcus J.',  reach: 19800, time: '2023-10-15T12:00:00' },
  ],

  // ── ADS ────────────────────────────────────────────────────────────────────
  ads: [
    { id: 'ad1', title: 'Grand Opening: Bayshore Bistro',    description: 'Enjoy 25% off your first visit at our new waterfront restaurant. Live music every Friday!',                               images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'], businessName: 'Bayshore Bistro',         address: '2901 Bayshore Blvd, Tampa, FL 33629',        latitude: 27.9254, longitude: -82.4875, radiusKm: 2,   startDate: '2024-06-01', endDate: '2024-08-31', status: 'Active'  },
    { id: 'ad2', title: 'Summer Beats Music Store Sale',     description: 'Up to 40% off all guitars, keyboards, and DJ equipment. Hot 101.5 listeners get an extra 10% with code HOT10.',          images: ['https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600'], businessName: 'Summer Beats Music',      address: '1600 E 8th Ave, Tampa, FL 33605',            latitude: 27.9595, longitude: -82.4367, radiusKm: 3,   startDate: '2024-06-15', endDate: '2024-07-31', status: 'Active'  },
    { id: 'ad3', title: 'Clearwater Beach Festival Tickets', description: 'Get early-bird tickets to the biggest beach festival of the year. VIP packages available!',                              images: ['https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600'], businessName: 'Clearwater Events Co.',   address: '69 Baymont St, Clearwater, FL 33767',        latitude: 27.9659, longitude: -82.8001, radiusKm: 5,   startDate: '2024-07-01', endDate: '2024-07-20', status: 'Active'  },
    { id: 'ad4', title: 'DJ Workshop at Sonic Academy',      description: 'Learn mixing, scratching, and beat production from pro DJs. Weekend classes now enrolling.',                              images: ['https://images.unsplash.com/photo-1571266028243-d220c6a14154?w=600'], businessName: 'Sonic Academy',           address: '401 E Jackson St, Tampa, FL 33602',          latitude: 27.9478, longitude: -82.4543, radiusKm: 1.5, startDate: '2024-08-01', endDate: '2024-09-30', status: 'Draft'   },
    { id: 'ad5', title: 'Coffee & Vinyl Pop-Up',             description: 'Rare vinyl records + artisan coffee. Limited 3-day pop-up event for music lovers.',                                      images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600'], businessName: 'Vinyl & Brew',            address: '1910 N Ola Ave, Tampa, FL 33602',            latitude: 27.9558, longitude: -82.4611, radiusKm: 2,   startDate: '2024-05-01', endDate: '2024-05-03', status: 'Expired' },
  ],

  // ── BROADCASTS ─────────────────────────────────────────────────────────────
  broadcasts: [
    { id: 'bc1', title: 'Morning Vibes with DJ Nova',                    description: 'Start your day with the best hits and positive energy. Live every weekday morning!',                        youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600', type: 'live',      viewerCount: 1842,  startTime: '2024-06-15T06:00:00', endTime: null,                status: 'Live'      },
    { id: 'bc2', title: 'Hot 101.5 Podcast: Artist Spotlight - Neon Waves', description: 'Exclusive interview with rising star Neon Waves about their debut album and upcoming tour.',         youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600', type: 'recorded',  viewerCount: 8420,  startTime: '2024-06-10T14:00:00', endTime: '2024-06-10T15:30:00', status: 'Published' },
    { id: 'bc3', title: 'Summer Jams Countdown Special',                  description: 'Counting down the top 50 summer anthems of all time. Vote for your favorite!',                           youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A', thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', type: 'recorded',  viewerCount: 12300, startTime: '2024-06-08T20:00:00', endTime: '2024-06-08T23:00:00', status: 'Published' },
    { id: 'bc4', title: 'Friday Night Live: Beach Party Edition',          description: 'Live DJ set from Clearwater Beach. Join us for the ultimate Friday night party!',                         youtubeUrl: '',                                             thumbnailUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600', type: 'scheduled', viewerCount: 0,     startTime: '2024-07-05T21:00:00', endTime: '2024-07-06T01:00:00', status: 'Scheduled' },
  ],

  // ── AD ANALYTICS ───────────────────────────────────────────────────────────
  adAnalytics: [
    { id: 'ad1', impressions: 12480, clicks: 1842, geofenceEntries: 634, notificationOpens: 287, directionRequests: 156, daily: [{ date:'2024-06-09',impressions:1120,clicks:178,geofenceEntries:52,notificationOpens:24 },{ date:'2024-06-10',impressions:1340,clicks:215,geofenceEntries:68,notificationOpens:31 },{ date:'2024-06-11',impressions:1580,clicks:248,geofenceEntries:74,notificationOpens:38 },{ date:'2024-06-12',impressions:1890,clicks:287,geofenceEntries:92,notificationOpens:45 },{ date:'2024-06-13',impressions:2100,clicks:312,geofenceEntries:108,notificationOpens:52 },{ date:'2024-06-14',impressions:2250,clicks:328,geofenceEntries:120,notificationOpens:51 },{ date:'2024-06-15',impressions:2200,clicks:274,geofenceEntries:120,notificationOpens:46 }] },
    { id: 'ad2', impressions: 8920,  clicks: 1204, geofenceEntries: 412, notificationOpens: 198, directionRequests: 89,  daily: [{ date:'2024-06-09',impressions:680,clicks:92,geofenceEntries:28,notificationOpens:14 },{ date:'2024-06-10',impressions:920,clicks:134,geofenceEntries:42,notificationOpens:22 },{ date:'2024-06-11',impressions:1140,clicks:168,geofenceEntries:56,notificationOpens:28 },{ date:'2024-06-12',impressions:1380,clicks:198,geofenceEntries:72,notificationOpens:34 },{ date:'2024-06-13',impressions:1520,clicks:212,geofenceEntries:78,notificationOpens:38 },{ date:'2024-06-14',impressions:1640,clicks:208,geofenceEntries:74,notificationOpens:32 },{ date:'2024-06-15',impressions:1640,clicks:192,geofenceEntries:62,notificationOpens:30 }] },
    { id: 'ad3', impressions: 15200, clicks: 2680, geofenceEntries: 890, notificationOpens: 412, directionRequests: 234, daily: [{ date:'2024-06-09',impressions:1420,clicks:268,geofenceEntries:82,notificationOpens:38 },{ date:'2024-06-10',impressions:1680,clicks:312,geofenceEntries:98,notificationOpens:46 },{ date:'2024-06-11',impressions:2040,clicks:378,geofenceEntries:118,notificationOpens:56 },{ date:'2024-06-12',impressions:2380,clicks:428,geofenceEntries:142,notificationOpens:68 },{ date:'2024-06-13',impressions:2560,clicks:456,geofenceEntries:156,notificationOpens:72 },{ date:'2024-06-14',impressions:2720,clicks:438,geofenceEntries:152,notificationOpens:68 },{ date:'2024-06-15',impressions:2400,clicks:400,geofenceEntries:142,notificationOpens:64 }] },
    { id: 'ad4', impressions: 0,     clicks: 0,    geofenceEntries: 0,   notificationOpens: 0,   directionRequests: 0,   daily: [] },
    { id: 'ad5', impressions: 4200,  clicks: 520,  geofenceEntries: 180, notificationOpens: 78,  directionRequests: 42,  daily: [{ date:'2024-04-28',impressions:580,clicks:72,geofenceEntries:24,notificationOpens:10 },{ date:'2024-04-29',impressions:640,clicks:84,geofenceEntries:28,notificationOpens:12 },{ date:'2024-04-30',impressions:720,clicks:92,geofenceEntries:32,notificationOpens:14 },{ date:'2024-05-01',impressions:780,clicks:98,geofenceEntries:34,notificationOpens:15 },{ date:'2024-05-02',impressions:760,clicks:90,geofenceEntries:32,notificationOpens:14 },{ date:'2024-05-03',impressions:720,clicks:84,geofenceEntries:30,notificationOpens:13 }] },
  ],

  // ── ACTIVITY LOG ───────────────────────────────────────────────────────────
  activityLog: [
    { id: 'act1', type: 'user',         text: 'Marcus Chen joined the Sonic Elite loyalty program.',        time: '2024-06-15T10:27:00', badge: 'NEW USER',  badgeColor: 'bg-emerald-50 text-emerald-700' },
    { id: 'act2', type: 'contest',      text: 'Sarah Miller entered the "Golden Ticket" contest.',          time: '2024-06-15T10:18:00', badge: 'CONTEST',   badgeColor: 'bg-blue-50 text-blue-700'       },
    { id: 'act3', type: 'shoutout',     text: 'DJ Z-Blast recorded a new shoutout for the Morning Mix.',    time: '2024-06-15T09:45:00', badge: 'SHOUTOUT',  badgeColor: 'bg-purple-50 text-purple-700'   },
    { id: 'act4', type: 'event',        text: "42 listeners RSVP'd for the Beach Bash Concert.",            time: '2024-06-15T09:30:00', badge: 'EVENT',     badgeColor: 'bg-gray-100 text-gray-600'      },
    { id: 'act5', type: 'notification', text: 'Push notification sent to 14,293 listeners.',                time: '2024-06-15T09:00:00', badge: 'PUSH',      badgeColor: 'bg-amber-50 text-amber-700'     },
  ],
}

// Collections that are demo/seed data only — safe to wipe before production
const DEMO_COLLECTIONS = [
  'users',
  'articles',
  'contests',
  'events',
  'shoutouts',
  'notifications',
  'ads',
  'broadcasts',
  'adAnalytics',
  'activityLog',
]

// Collections that must NEVER be wiped automatically
const PROTECTED_COLLECTIONS = ['admins', 'fcmTokens']

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function clearCollection(collectionName) {
  const snap = await db.collection(collectionName).get()
  if (snap.empty) {
    console.log(`  ⏭  "${collectionName}" already empty`)
    return
  }
  // Firestore batch max is 500 — chunk if needed
  const chunks = []
  for (let i = 0; i < snap.docs.length; i += 500) {
    chunks.push(snap.docs.slice(i, i + 500))
  }
  for (const chunk of chunks) {
    const batch = db.batch()
    chunk.forEach(d => batch.delete(d.ref))
    await batch.commit()
  }
  console.log(`  🗑  Deleted ${snap.size} docs from "${collectionName}"`)
}

async function seedCollection(collectionName, items) {
  const chunks = []
  for (let i = 0; i < items.length; i += 500) {
    chunks.push(items.slice(i, i + 500))
  }
  for (const chunk of chunks) {
    const batch = db.batch()
    chunk.forEach(item => {
      const { id, ...data } = item
      const ref = id
        ? db.collection(collectionName).doc(id)
        : db.collection(collectionName).doc()
      batch.set(ref, { ...data, createdAt: now })
    })
    await batch.commit()
  }
  console.log(`  ✅  Seeded ${items.length} docs → "${collectionName}"`)
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const shouldWipe      = args.includes('--wipe')
  const shouldClear     = args.includes('--clear')
  const keepAdmin       = args.includes('--keep-admin')

  console.log('\n🎙  Hot FM 101.5 — Firestore Manager\n')

  // ── MODE: --wipe (production cleanup — delete demo data, keep real collections)
  if (shouldWipe) {
    console.log('⚠️   WIPE MODE — Deleting all demo/seed data from Firestore...\n')

    const collectionsToWipe = keepAdmin
      ? DEMO_COLLECTIONS
      : DEMO_COLLECTIONS  // admins is always protected — never wiped

    for (const col of collectionsToWipe) {
      await clearCollection(col)
    }

    // Always keep admins safe
    console.log(`\n🔒  Protected (not wiped): ${PROTECTED_COLLECTIONS.join(', ')}`)
    console.log('\n✅  Wipe complete! Firestore is clean and ready for real data.\n')
    console.log('   Your admin login still works. Real users can now register.\n')
    process.exit(0)
  }

  // ── MODE: --clear then seed (fresh demo reset)
  if (shouldClear) {
    console.log('🗑  Clearing existing demo data before re-seeding...')
    for (const col of DEMO_COLLECTIONS) {
      await clearCollection(col)
    }
    console.log()
  }

  // ── MODE: seed (default)
  console.log('📦  Seeding demo data into Firestore...')
  for (const [col, items] of Object.entries(seedData)) {
    await seedCollection(col, items)
  }

  // Always ensure admin doc exists
  console.log('\n👤  Ensuring admin user doc...')
  await db.collection('admins').doc(ADMIN_UID).set({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: 'Super Admin',
    createdAt: now,
  }, { merge: true })
  console.log(`  ✅  Admin doc ready for UID: ${ADMIN_UID}`)

  console.log('\n🎉  Done! Open https://hotfm101-admin.web.app to test.\n')
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌  Seed failed:', err.message)
  process.exit(1)
})
