/**
 * HOT FM 101.5 — Reset Admin Panel Passwords
 *
 * Passwords are read from the environment — never hardcode them here.
 * Set them in backend-source/.env (gitignored), then run:
 *
 *   cd backend-source
 *   node --env-file=.env reset-passwords.js
 */

const admin = require('firebase-admin')
const path  = require('path')
const fs    = require('fs')

const found = fs.readdirSync(__dirname).find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'))
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, found))) })

// Fails loudly rather than silently resetting to a default password.
function requirePassword(envVar) {
  const val = process.env[envVar]
  if (!val) {
    console.error(`\n❌  Missing required env var: ${envVar}`)
    console.error('    Set it in backend-source/.env and run with:')
    console.error('    node --env-file=.env reset-passwords.js\n')
    process.exit(1)
  }
  if (val.length < 6) {
    console.error(`\n❌  ${envVar} must be at least 6 characters (Firebase minimum).\n`)
    process.exit(1)
  }
  return val
}

const USERS = [
  { email: 'superadmin@hot101.com', password: requirePassword('SUPERADMIN_PASSWORD') },
  { email: 'admin@hot101.com',      password: requirePassword('ADMIN_PASSWORD')      },
  { email: 'editor@hot101.com',     password: requirePassword('EDITOR_PASSWORD')     },
  { email: 'staff@hot101.com',      password: requirePassword('STAFF_PASSWORD')      },
]

async function main() {
  console.log('\n🔑  Resetting passwords for all admin users...\n')
  for (const u of USERS) {
    const fb = await admin.auth().getUserByEmail(u.email)
    await admin.auth().updateUser(fb.uid, { password: u.password })
    // Never echo the actual password — it came from the environment.
    console.log(`  ✅  ${u.email}  →  (from env)`)
  }
  console.log('\n✅  All passwords reset! Try logging in now.\n')
  console.log('  URL: https://hotfm101-admin.web.app\n')
  process.exit(0)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
