# Deploy Rekindle on Vercel

I can’t log into your accounts for you, but this is the full checklist. Total time: about 10 minutes.

## 1. Database URL (Postgres)

You need a real `DATABASE_URL` before the first Vercel build (the build runs `prisma migrate deploy`).

**Option A — from Vercel (recommended)**  
1. [vercel.com](https://vercel.com) → your project (or create it after step 2).  
2. **Storage** → **Create** → **Postgres** (or **Neon** from the marketplace).  
3. Connect it to the project and **copy the connection string** (often added as `DATABASE_URL` automatically).

**Option B — Neon directly**  
1. [neon.tech](https://neon.tech) → new project → copy the connection string.

Format looks like:

`postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`

Put that in **Vercel → Project → Settings → Environment Variables** as `DATABASE_URL` (Production + Preview).

## 2. Push this repo to GitHub

If you haven’t yet:

```bash
cd /path/to/rekindle_prototype1
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

## 3. Import into Vercel

1. **Vercel** → **Add New** → **Project** → import the GitHub repo.  
2. **Framework Preset:** Next.js (default).  
3. **Build Command:** leave default (`npm run build` — already runs Prisma migrate + Next build).  
4. **Root directory:** repo root (where `package.json` is).

## 4. Environment variables (Vercel) — required before build succeeds

The build runs `prisma migrate deploy`, which **must** have a real `DATABASE_URL`. If it is missing, the build stops with a short message pointing here.


In **Project → Settings → Environment Variables**, add:

| Name | Value | Required |
|------|--------|----------|
| `DATABASE_URL` | Postgres URL from step 1 | Yes |
| `OPENAI_API_KEY` | `sk-...` from OpenAI | Yes (clustering) |
| `HOST_SECRET` | Long random string (facilitator creates boards) | Yes |
| `BLOB_READ_WRITE_TOKEN` | From Vercel Blob (optional) | No — omit to store images in DB (max ~2MB) |

Apply to **Production** (and **Preview** if you want preview deploys to work).

## 5. Deploy

Click **Deploy**. The build must see `DATABASE_URL` so `prisma migrate deploy` succeeds.

## 6. After the first deploy

Open your production URL, go to `/`, enter `HOST_SECRET`, create a board, share the QR or `/b/your-slug` link.

## Troubleshooting

- **Build fails on Prisma / P1001:** `DATABASE_URL` is missing, wrong, or the DB isn’t reachable from Vercel (check SSL, IP allowlist — Neon usually “allow all” by default).  
- **Runtime errors:** Confirm all variables above are set for the **same** environment (Production vs Preview).
