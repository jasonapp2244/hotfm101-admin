const admin = require('firebase-admin')
const path  = require('path')
const fs    = require('fs')

const found = fs.readdirSync(__dirname).find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'))
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, found))) })

const USERS = [
  { email: 'superadmin@hot101.com', password: 'SuperAdmin@101' },
  { email: 'admin@hot101.com',      password: 'Admin@101'      },
  { email: 'editor@hot101.com',     password: 'Editor@101'     },
  { email: 'staff@hot101.com',      password: 'Staff@101'      },
]

async function main() {
  console.log('\n🔑  Resetting passwords for all admin users...\n')
  for (const u of USERS) {
    const fb = await admin.auth().getUserByEmail(u.email)
    await admin.auth().updateUser(fb.uid, { password: u.password })
    console.log(`  ✅  ${u.email}  →  ${u.password}`)
  }
  console.log('\n✅  All passwords reset! Try logging in now.\n')
  console.log('  URL: https://hotfm101-admin.web.app\n')
  process.exit(0)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
