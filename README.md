# Hot FM 101.5 — Admin Panel

A full-stack Firebase web application that serves as the back-office administration portal for **Hot FM 101.5**, a radio station. It pairs with a listener-facing mobile app and manages all content, engagement, and broadcasting operations.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Roles & Permissions](#roles--permissions)
- [Firebase Architecture](#firebase-architecture)
- [Cloud Functions](#cloud-functions)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Data Flow](#data-flow)

---

## Project Overview

This is a **monorepo-style Firebase project** consisting of:

- A **React + Vite** single-page admin panel (`admin-panel-source/`)
- **Firebase Cloud Functions** backend (`backend-source/functions/`)
- **Firestore security rules**, storage rules, and indexes (`backend-source/`)

The admin panel allows radio station staff to manage articles, contests, events, shoutouts, ads, live broadcasts, push notifications, and more — all of which are consumed by the Hot FM 101.5 listener mobile app.

---

## Repository Structure

```
hotfm101-admin/
├── firebase.json                    # Root Firebase config (hosting, functions, rules)
├── .firebaserc                      # Firebase project alias
├── admin-panel-source/              # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI components & modals
│   │   ├── contexts/                # React context providers
│   │   │   ├── AuthContext.jsx      # Auth, roles, FCM registration
│   │   │   ├── DataContext.jsx      # Firestore real-time data & CRUD
│   │   │   ├── ToastContext.jsx     # Toast notifications
│   │   │   └── ThemeContext.jsx     # Dark/light mode
│   │   ├── pages/                   # One file per admin page
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Formatters, validators, CSV export, FCM
│   │   ├── data/                    # Seed/reference data
│   │   ├── firebase.js              # Firebase client SDK initialization
│   │   └── main.jsx                 # App entry point + routing
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── backend-source/                  # Firebase backend
    ├── firestore.rules              # Firestore security rules
    ├── firestore.indexes.json       # Composite indexes
    ├── storage.rules                # Firebase Storage rules
    └── functions/
        ├── index.js                 # All Cloud Functions
        ├── .env                     # SMTP credentials (not committed)
        └── package.json
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 8 | Build tool and dev server |
| React Router 7 | Client-side routing |
| Tailwind CSS v4 | Utility-first styling |
| Firebase JS SDK v12 | Auth, Firestore, Storage, FCM |
| lucide-react | Icon library |
| @emailjs/browser | Client-side email fallback |

### Backend

| Technology | Purpose |
|---|---|
| Firebase Cloud Functions v2 | Serverless backend logic |
| firebase-admin v12 | Server-side Firebase access |
| Nodemailer | SMTP email delivery (Gmail) |
| Node.js 18 | Functions runtime |

### Firebase Services

| Service | Use |
|---|---|
| Firebase Auth | Staff authentication |
| Firestore | Primary database |
| Firebase Storage | Media uploads (images, videos) |
| Cloud Messaging (FCM) | Push notifications to listeners |
| Firebase Hosting | Serves the admin SPA |
| Cloud Functions | Automated triggers (push, email) |

---

## Features

| Page | Description |
|---|---|
| **Dashboard** | Overview stats, recent activity |
| **Users** | Manage admin/staff users and roles |
| **Sub-Users** | Super admin user administration |
| **Content** | Create and manage articles |
| **Contests** | Manage radio contests and entries |
| **Events** | Create and manage station events |
| **Shoutouts** | Review and approve listener shoutout videos |
| **Ads / Deals** | Manage promotional advertisements |
| **Ad Analytics** | View ad impression/engagement metrics, export CSV |
| **Broadcasting** | Manage live broadcasts (triggers push notifications) |
| **Notifications** | Send push notifications to all listeners |
| **Privacy Policy** | Edit and version the app's privacy policy |

---

## Roles & Permissions

| Role | Access |
|---|---|
| **Super Admin** | Full access to all pages including Sub-Users |
| **Admin** | Full access except Sub-User management |
| **Editor** | Content, Contests, Events, Privacy Policy |
| **Staff** | Shoutouts, Broadcasting, Privacy Policy |
| **Listener** | No portal access (mobile app only) |

Role data is stored per-user in the Firestore `users/{uid}` document. The `AuthContext` reads this on login and enforces route-level access control.

---

## Firebase Architecture

### Firestore Collections

| Collection | Access |
|---|---|
| `users` | Read self or admin; write admin only |
| `articles`, `contests`, `events`, `shoutouts`, `notifications`, `ads`, `broadcasts` | Public read; admin write |
| `adAnalytics`, `activityLog` | Admin only |
| `contestEntries`, `eventRsvps` | Public read; authenticated create; admin update/delete |
| `shoutoutSubmissions` | Authenticated create; admin read/manage |
| `fcmTokens` | Admin read/write |
| `emailQueue` | Admin create/read; Functions write via Admin SDK |
| `settings` + `versions` subcollection | Public read; admin write |

### Firestore Security

The `isAdmin()` helper in `firestore.rules` checks that the authenticated user's `role` field (lowercased) is one of: `super admin`, `admin`, `editor`, or `staff`.

---

## Cloud Functions

All four functions are **Firestore-triggered** (`onDocumentCreated`):

### `sendPushNotification`
**Trigger:** `notifications/{notifId}`

Sends an FCM multicast to **all registered listener devices**. Processes tokens in batches of 500. Updates the notification doc with send status, count, and timestamp.

### `sendAdNotification`
**Trigger:** `ads/{adId}`

Fires only when `status === "Active"`. Sends a deal/promo push notification with the ad title, body, and location payload (`adId`, `lat`, `lng`).

### `sendBroadcastNotification`
**Trigger:** `broadcasts/{bcId}`

Fires only when `status === "Live"`. Sends a "Live Now on Hot 101.5!" push notification to all listeners.

### `sendApprovalEmail`
**Trigger:** `emailQueue/{emailId}`

Sends an HTML email via **Gmail SMTP** using Nodemailer. Credentials are read from environment variables (`SMTP_USER`, `SMTP_PASS`). On success, updates the queue doc to `status: "sent"` and optionally marks the related shoutout as `emailSent`. On failure, sets `status: "failed"`.

---

## Environment Variables

### Admin Panel (`admin-panel-source/.env`)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=
```

### Cloud Functions (`backend-source/functions/.env`)

```env
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
```

> Use a Gmail **App Password** (not your regular password). Enable 2FA on the Gmail account first.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Firestore, Auth, Storage, Functions, and FCM enabled

### 1. Install Dependencies

```bash
# Admin panel
cd admin-panel-source
npm install

# Cloud Functions
cd ../backend-source/functions
npm install
```

### 2. Configure Environment

Copy the `.env` examples above into:
- `admin-panel-source/.env`
- `backend-source/functions/.env`

Fill in your Firebase project credentials and Gmail SMTP details.

### 3. Run the Admin Panel Locally

```bash
cd admin-panel-source
npm run dev
```

### 4. Run Functions Locally (Emulator)

```bash
firebase emulators:start
```

---

## Deployment

### Deploy Everything

```bash
firebase deploy
```

### Deploy Specific Targets

```bash
# Frontend only
cd admin-panel-source && npm run build
firebase deploy --only hosting

# Functions only
firebase deploy --only functions

# Firestore rules only
firebase deploy --only firestore:rules
```

---

## Data Flow

```
Listener Mobile App
  │  reads public Firestore/Storage (articles, contests, events, ads, policy)
  │  submits shoutouts, contest entries, RSVPs, ad events
  │  registers FCM token → fcmTokens collection
  │
  ▼
Firebase (Firestore + Storage + FCM)
  │
  ├── Admin Panel (this repo)
  │     Staff/Admin writes via UI → Firestore
  │     Triggers emailQueue docs → approval emails to listeners
  │
  └── Cloud Functions (auto-triggered)
        notifications/{id}  → FCM multicast to all listeners
        ads/{id}            → FCM push for new active deals
        broadcasts/{id}     → FCM "Live Now" push
        emailQueue/{id}     → SMTP email via Gmail
```

---

## Notes

- The `activityLog` collection is written on every significant admin action for audit purposes.
- The `settings` collection stores the privacy policy; a `versions` subcollection tracks historical versions.
- Shoutout approvals are handled via the `emailQueue` — the admin panel creates a queue doc, and the Function sends the email and updates the shoutout record.
- FCM foreground messages are handled in `AuthContext` and displayed via `ToastContext`.
