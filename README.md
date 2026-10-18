# Splitequal
1. `npm install`
2. Supabase: create a project (or `npx supabase start`), run the files in `supabase/migrations/` in order (0001, 0002, 0003).
3. Copy `.env.example` to `.env.local`, fill the URL + publishable key (Project Settings → API). Never commit it.
4. Auth → URL config: Site URL `http://localhost:3000`, redirect `http://localhost:3000/**`. For quick local testing, disable "Confirm email".
5. `npm run dev` → http://localhost:3000 · `npm test` · `npm run lint` (tsc).
Vercel: import the GitHub repo, set the 3 env vars (SUPABASE_SECRET_KEY unused so far), add the Vercel URL to Supabase redirect URLs.

## Install as an app (PWA)
`public/manifest.json`, `public/sw.js`, `public/offline.html` and `public/icons/*` make Splitequal installable. The service worker only runs in production builds and caches static assets only (never pages, API or Supabase data).
Test locally: `npm run build && npm start`, open http://localhost:3000 in Chrome → install icon in the address bar (or the in-app "Install app" button). iPhone: Safari → Share → Add to Home Screen. Check DevTools → Application → Manifest / Service Workers. Vercel serves HTTPS automatically, which installs require. Regenerate icons with `python3 scripts/generate-icons.py` or replace the PNGs with designed artwork (keep the sizes).

The install-dialog screenshots in `public/screenshots/` are illustrative (sample data). Replace them with real screenshots of your app at the same sizes (wide 1280x720, narrow 720x1280), or regenerate with `python3 scripts/generate-screenshots.py`.

## Payment deep-links
Add your UPI ID (INR) or Venmo username (USD) under Profile → Payment details (run migration 0008). When someone clicks "Settle up", they get a UPI link (`upi://pay?...`) or a Venmo link (`https://venmo.com/<user>?txn=pay&...`) pre-filled with amount and payee, then record the payment; the receiver still confirms. Handles are visible to members of your groups. Splitequal never processes or verifies payments.

## Guest mode
`/guest` works with no account: groups are stored only in the browser (localStorage key `splitequal.guest.groups`), using the same split/balance code as the main app. On sign-up/sign-in, `GuestMigrationRunner` copies them into the account via `import_guest_group` (migrations 0012–0014): people without accounts become "Guest" shadow members.

## Account deletion & data download
Profile → "Your data": download a JSON copy, or delete the account (password + typing DELETE; blocked while you have unsettled balances, pending payments or sole ownership of a shared group). Deletion anonymizes the profile (shared expense history stays, shown as "Former member") and closes the login. It needs `SUPABASE_SECRET_KEY` as a **server-only** env var (in Vercel: add it WITHOUT the NEXT_PUBLIC_ prefix). Run migration 0015.

## Security checklist (do in the Supabase dashboard before launch)
- Authentication → Rate Limits: keep sign-up/sign-in limits low. Authentication → Policies: minimum password length 10+; enable leaked-password protection if your plan has it.
- Authentication → SMTP: use your own email provider, turn "Confirm email" ON. Add CAPTCHA (Cloudflare Turnstile) on sign-up.
- Advisors → Security: run it and fix every warning. Database → Backups: enable daily backups (PITR if available).
- Security headers/CSP live in `next.config.mjs`. After deploy, open the site with DevTools → Console and look for "Content Security Policy" violations; use `CSP_REPORT_ONLY=1` to test safely.
- Usage limits (per user, per hour) live in migration 0016; adjust the numbers in the triggers if real users hit them.

## Deployment & operations
See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) (environments, release process, backups, email, monitoring) and `.github/workflows/ci.yml` (runs on every push/PR).
