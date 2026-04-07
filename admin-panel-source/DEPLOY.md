# Hostinger VPS + cPanel Deployment Guide
## Admin Panel - Sonic Command Hot 101.5

---

## REQUIREMENTS (Your Local Machine)
- Node.js v18+ installed → https://nodejs.org
- A code editor (VS Code etc.)
- WinSCP or FileZilla (for FTP upload) → https://winscp.net

---

## STEP 1 — BUILD THE PROJECT LOCALLY

Open terminal/PowerShell in the project folder and run:

```bash
npm install
npm run build
```

After this, a `dist/` folder will be created. This is what you upload to the server.

---

## STEP 2 — VERIFY DIST FOLDER

Make sure `dist/` contains:
```
dist/
├── index.html          ← main entry
├── .htaccess           ← SPA routing (auto-copied from public/)
└── assets/
    ├── index-xxxx.js
    ├── vendor-xxxx.js
    ├── router-xxxx.js
    └── index-xxxx.css
```

If `.htaccess` is NOT in dist/, manually copy `public/.htaccess` into `dist/`.

---

## STEP 3 — LOGIN TO HOSTINGER VPS / cPANEL

1. Go to → https://hpanel.hostinger.com
2. Click your VPS → Open **cPanel**
3. Login with your cPanel username & password

---

## STEP 4 — UPLOAD FILES VIA cPANEL FILE MANAGER

### Option A: File Manager (Easiest)

1. In cPanel → click **File Manager**
2. Navigate to `public_html/`
3. Click **Upload** (top menu)
4. Upload ALL files from inside your local `dist/` folder:
   - `index.html`
   - `.htaccess`
   - `assets/` folder (all files inside)
5. Make sure files are directly inside `public_html/` — NOT in a subfolder called `dist`

### Option B: FTP with FileZilla

1. Open **FileZilla**
2. In cPanel → **FTP Accounts** → get/create FTP credentials
3. Connect:
   - Host: `ftp.yourdomain.com`
   - Username: your FTP username
   - Password: your FTP password
   - Port: `21`
4. Left panel = your local `dist/` folder
5. Right panel = navigate to `public_html/`
6. Drag all files from `dist/` to `public_html/`

---

## STEP 5 — VERIFY .HTACCESS IS UPLOADED

This is the most critical file. Without it, page refresh will return 404.

In **File Manager** → `public_html/`:
- Look for `.htaccess` file
- If hidden files are not visible: click **Settings** (top right) → check **Show Hidden Files** → Save

If `.htaccess` is missing, create it manually:
1. Click **+ File** → name it `.htaccess`
2. Right-click it → **Edit**
3. Paste the following and Save:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

---

## STEP 6 — POINT DOMAIN TO PUBLIC_HTML

In cPanel:
1. Go to **Domains** → **Addon Domains** or use your primary domain
2. Make sure document root is set to `public_html/`
3. DNS should already point to your VPS IP address

To check VPS IP: cPanel → **Server Information** → note the IP

---

## STEP 7 — ENABLE FREE SSL (HTTPS)

In cPanel:
1. Go to **SSL/TLS** section
2. Click **Let's Encrypt SSL** (or **AutoSSL**)
3. Select your domain → click **Issue Certificate**
4. Wait 1-2 minutes → Done!

The `.htaccess` already redirects HTTP → HTTPS automatically.

---

## STEP 8 — TEST YOUR DEPLOYMENT

Open your browser and test:

| URL | Expected Result |
|-----|----------------|
| `https://yourdomain.com` | Redirects to `/login` |
| `https://yourdomain.com/login` | Shows Login page |
| `https://yourdomain.com/dashboard` | Shows Dashboard (if logged in) |
| Refresh any page | Should NOT give 404 |

---

## TROUBLESHOOTING

### Problem: 404 on page refresh
**Fix:** `.htaccess` is missing or mod_rewrite is not enabled.
- Re-upload `.htaccess` from `public/` folder
- Contact Hostinger support to enable `mod_rewrite`

### Problem: Blank white page
**Fix:** Open browser DevTools (F12) → Console tab → check errors
- Usually means assets path is wrong
- Make sure you uploaded contents OF `dist/`, not the `dist/` folder itself

### Problem: Styles not loading / broken layout
**Fix:** CSS file not uploaded
- Check `public_html/assets/` folder has `.css` files

### Problem: Site loads but shows old version
**Fix:** Clear browser cache → Ctrl+Shift+R (hard refresh)

---

## QUICK REFERENCE — FILE STRUCTURE ON SERVER

```
public_html/               ← root of your website
├── index.html             ← uploaded from dist/
├── .htaccess              ← uploaded from dist/ (or public/)
└── assets/
    ├── index-[hash].js
    ├── vendor-[hash].js
    ├── router-[hash].js
    └── index-[hash].css
```

---

## NEED TO UPDATE THE SITE?

Just repeat from Step 1:
```bash
npm run build
```
Then re-upload contents of `dist/` to `public_html/` (overwrite existing files).

---

*Deployment guide for Admin Panel v0.0.0 — React 19 + Vite 8 + Tailwind CSS 4*
