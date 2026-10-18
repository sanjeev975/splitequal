# Running Splitequal safely: environments, releases, backups, email, monitoring

## 1. Three environments (never test on production data)
| | Supabase project | Vercel | Site URL / redirect URLs |
|---|---|---|---|
| Local | `npx supabase start` (Docker) or a personal dev project | `npm run dev` | http://localhost:3000 |
| Staging | project **splitequal-staging** (Mumbai) | Preview deployments | your preview URL |
| Production | project **splitequal-prod** (Mumbai) | Production | https://your-domain |

In Vercel → Settings → Environment Variables set the **Preview** values from staging and the **Production** values from prod:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (**secret, no NEXT_PUBLIC_ prefix**), optional `SENTRY_INGEST_HOST`. Functions already run in Mumbai (`vercel.json`). In each Supabase project: Authentication → URL Configuration → Site URL + Redirect URLs for that environment only.

## 2. Release process (migrations are forward-only; never paste SQL into production)
1. Open a pull request → GitHub **CI** must be green (types, tests, build, and all migrations + `rls.sql` on a real Supabase stack).
2. Merge → Vercel builds a preview. Apply DB changes to **staging**: `npx supabase link --project-ref <staging-ref>` then `npx supabase db push`.
3. Test the two-account flow on staging (sign up, group, expense, settle, delete account).
4. Production: `npx supabase link --project-ref <prod-ref>`, **take a backup first** (section 3), `npx supabase db push`, then promote the Vercel deployment.
5. Rollback: code → Vercel "Instant Rollback". Database → write a new corrective migration (don't edit old ones); for disasters, restore the backup.

## 3. Backups
- Supabase paid plans include daily backups; add **Point-in-Time Recovery** for a real safety net. Free projects have none, so don't launch on free.
- Extra copy you control: `SUPABASE_DB_URL=... ./scripts/backup.sh` (weekly + before every production migration). It contains password hashes, so encrypt it and keep it off-platform. Receipts/avatars live in Storage and need a separate export.
- **Do a test restore into the staging project once.** An untested backup is a hope, not a backup.

## 4. Email (the built-in sender is rate-limited and lands in spam)
1. Pick a provider (Resend, Postmark, Brevo, Amazon SES) and verify your domain: add the **SPF, DKIM and DMARC** DNS records it gives you.
2. Supabase → Authentication → SMTP Settings: host, port, user, password, sender `no-reply@your-domain`, sender name `Splitequal`.
3. Authentication → Email Templates: paste `supabase/templates/confirm.html` (Confirm signup) and `recovery.html` (Reset password).
4. Turn **Confirm email ON**. Test sign-up and password reset to Gmail and an Indian provider (check spam).

## 5. Monitoring
- **Uptime:** point UptimeRobot/Better Stack at `https://your-domain/api/health` every 1–5 min (200 = app + database up, 503 = database down); alert by email/SMS.
- **Errors:** create a Sentry project (Next.js), run `npx @sentry/wizard@latest -i nextjs`, set `SENTRY_INGEST_HOST` (host from your DSN) so the CSP allows reports. Set an alert for new issues.
- Watch Supabase → Reports (database CPU/connections) and Vercel → Logs for the first weeks.

## 6. Pre-launch checklist
- [ ] CI green on `main`; `rls.sql` prints "RLS tests passed" on staging
- [ ] Supabase Advisors → Security: no warnings left; "Confirm email" on; SMTP working; CAPTCHA on sign-up
- [ ] Backups on + one test restore done; `/api/health` monitored; Sentry receiving a test error
- [ ] Real privacy policy and terms; support email visible in the app
- [ ] Private beta with 5–10 real groups for 1–2 weeks
