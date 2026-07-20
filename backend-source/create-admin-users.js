/**
 * HOT FM 101.5 — Create Admin Panel Users
 *
 * Creates Firebase Auth accounts + users Firestore docs for all roles.
 *
 * Passwords are read from the environment — never hardcode them here.
 * Set them in backend-source/.env (gitignored):
 *
 *   SUPERADMIN_PASSWORD=...
 *   ADMIN_PASSWORD=...
 *   EDITOR_PASSWORD=...
 *   STAFF_PASSWORD=...
 *
 * Run:
 *   cd backend-source
 *   node --env-file=.env create-admin-users.js
 */

const admin = require('firebase-admin')
const path  = require('path')
const fs    = require('fs')

// ── Password lookup ──────────────────────────────────────────────────────────
// Fails loudly rather than silently creating an account with a default password.
function requirePassword(envVar) {
  const val = process.env[envVar]
  if (!val) {
    console.error(`\n❌  Missing required env var: ${envVar}`)
    console.error('    Set it in backend-source/.env and run with:')
    console.error('    node --env-file=.env create-admin-users.js\n')
    process.exit(1)
  }
  if (val.length < 6) {
    console.error(`\n❌  ${envVar} must be at least 6 characters (Firebase minimum).\n`)
    process.exit(1)
  }
  return val
}

// ── Service account (auto-detect) ────────────────────────────────────────────
const fixed = path.join(__dirname, 'serviceAccountKey.json')
const found = fs.readdirSync(__dirname).find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'))
const SERVICE_ACCOUNT_PATH = fs.existsSync(fixed) ? fixed : path.join(__dirname, found)

admin.initializeApp({ credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)) })

const db  = admin.firestore()
const au  = admin.auth()
const now = admin.firestore.Timestamp.now()

// ── Users to create ──────────────────────────────────────────────────────────
// Passwords come from the environment — see requirePassword() above.
const ADMIN_USERS = [
  {
    name:     'Super Admin',
    email:    'superadmin@hot101.com',
    password: requirePassword('SUPERADMIN_PASSWORD'),
    role:     'Super Admin',
    status:   'Active',
    verified: true,
    staff:    true,
  },
  {
    name:     'Station Admin',
    email:    'admin@hot101.com',
    password: requirePassword('ADMIN_PASSWORD'),
    role:     'Admin',
    status:   'Active',
    verified: true,
    staff:    true,
  },
  {
    name:     'Content Editor',
    email:    'editor@hot101.com',
    password: requirePassword('EDITOR_PASSWORD'),
    role:     'Editor',
    status:   'Active',
    verified: true,
    staff:    true,
  },
  {
    name:     'Station Staff',
    email:    'staff@hot101.com',
    password: requirePassword('STAFF_PASSWORD'),
    role:     'Staff',
    status:   'Active',
    verified: true,
    staff:    true,
  },
]

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🎙  Hot FM 101.5 — Creating Admin Panel Users\n')

  const results = []

  for (const u of ADMIN_USERS) {
    try {
      // Check if Firebase Auth user already exists
      let firebaseUser
      try {
        firebaseUser = await au.getUserByEmail(u.email)
        console.log(`  ⏭  Auth user already exists: ${u.email}`)
      } catch {
        // Create new Firebase Auth account
        firebaseUser = await au.createUser({
          email:         u.email,
          password:      u.password,
          displayName:   u.name,
          emailVerified: true,
        })
        console.log(`  ✅  Created Auth user: ${u.email}`)
      }

      // Add/update in users Firestore collection with UID as doc ID
      await db.collection('users').doc(firebaseUser.uid).set({
        name:        u.name,
        email:       u.email,
        role:        u.role,
        status:      u.status,
        verified:    u.verified,
        staff:       u.staff,
        topListener: false,
        joined:      new Date().toISOString().split('T')[0],
        lastActive:  now,
        createdAt:   now,
      }, { merge: true })

      console.log(`  📄  Firestore users doc set (UID: ${firebaseUser.uid})`)

      results.push({ ...u, uid: firebaseUser.uid })

    } catch (err) {
      console.error(`  ❌  Failed for ${u.email}:`, err.message)
    }

    console.log()
  }

  // Print credentials table
  console.log('─'.repeat(72))
  console.log('  ADMIN PANEL LOGIN CREDENTIALS')
  console.log('  URL: https://hotfm101-admin.web.app')
  console.log('─'.repeat(72))
  console.log(
    '  Role'.padEnd(16),
    'Email'.padEnd(28),
    'Password'
  )
  console.log('─'.repeat(72))
  for (const r of results) {
    // Never echo the actual password — it came from the environment.
    console.log(
      (' ' + r.role).padEnd(16),
      r.email.padEnd(28),
      '(from env)'
    )
  }
  console.log('─'.repeat(72))
  console.log()
  console.log('  Pages each role can access:')
  console.log('  Super Admin  → All pages')
  console.log('  Admin        → All pages')
  console.log('  Editor       → Dashboard, Content, Contests, Events')
  console.log('  Staff        → Dashboard, Shoutouts, Broadcasting')
  console.log('─'.repeat(72))
  console.log()

  process.exit(0)
}

main().catch(err => {
  console.error('\n❌  Script failed:', err.message)
  process.exit(1)
})
