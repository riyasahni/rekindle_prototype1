# Deploy Rekindle on Vercel

This app **needs a Postgres database** somewhere on the internet (it cannot run without `DATABASE_URL`). You don’t pay for a tiny free tier on Neon or Supabase.

---

## 0. Don’t have a Postgres URL yet? (about 2 minutes)

### Easiest: Neon (free)

1. Open **[neon.tech](https://neon.tech)** → sign up (GitHub is fine).
2. **Create project** → pick a region near you → create.
3. On the dashboard, find **Connection string** (or **Connect**).
4. Choose **URI** / **psql** — copy the string that starts with `postgresql://` or `postgres://`.
5. If it doesn’t include SSL, append: `?sslmode=require` (Neon usually adds this).

Example shape:

`postgresql://neondb_owner:xxxx@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`

6. Put that value in:
   - **Vercel** → your project → **Settings** → **Environment Variables** → `DATABASE_URL` → **Production** (and Preview if you want), **Save**.
   - Your local **`.env`** file as `DATABASE_URL="..."` for `npm run dev` / `npm run build` locally.

Then **redeploy** on Vercel (Deployments → ⋯ → Redeploy).

### Alternative: Supabase (free)

1. **[supabase.com](https://supabase.com)** → New project → wait until ready.
2. **Project Settings** → **Database** → **Connection string** → **URI** (use the **pooler** or **direct** URI Prisma expects; often `?sslmode=require`).
3. Paste into Vercel and `.env` as `DATABASE_URL` the same way.

---

## 1. Database URL (Postgres) — recap

You need a real `DATABASE_URL` before the first Vercel build (the build runs `prisma migrate deploy`).

**Option A — from Vercel**  
1. [vercel.com](https://vercel.com) → your project.  
2. **Storage** → **Create** → **Postgres** / **Neon** (wording varies).  
3. Connect to the project and **copy the connection string** (sometimes Vercel sets `DATABASE_URL` for you).

**Option B — Neon or Supabase directly**  
Use section **0** above.

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
