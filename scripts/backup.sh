#!/usr/bin/env bash
# Logical backup of your Supabase database. NOT a replacement for Supabase's own daily backups/PITR; an extra copy you control.
# Usage: SUPABASE_DB_URL='postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres' ./scripts/backup.sh
# WARNING: includes the auth schema (password hashes, emails). Encrypt it and store it off-platform. Files in Storage (receipts/avatars) are NOT included.
set -euo pipefail
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL (Supabase → Project Settings → Database → Connection string)}"
mkdir -p backups; out="backups/splitequal-$(date +%Y%m%d-%H%M%S).sql.gz"
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges --schema=public --schema=auth | gzip > "$out"; chmod 600 "$out"
echo "Wrote $out ($(du -h "$out" | cut -f1)). Encrypt before uploading anywhere, e.g.: gpg -c $out"
