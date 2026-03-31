/**
 * Vercel build: generate client (placeholder OK), then require real DATABASE_URL for migrate + Next.
 * Loads .env locally; on Vercel use Project → Environment Variables.
 */
require("dotenv").config();

const { execSync } = require("child_process");

const placeholder =
  "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder";
const realUrl = process.env.DATABASE_URL?.trim();

execSync("npx prisma generate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: realUrl || placeholder },
});

if (!realUrl) {
  console.error(`
[Rekindle] DATABASE_URL is not set.

This app needs a hosted Postgres database (free tier is fine).

  1) Create a free DB: https://neon.tech → Sign up → Create project → copy "Connection string"
     (or https://supabase.com → New project → Settings → Database → URI)

  2) Vercel → your project → Settings → Environment Variables
     Name: DATABASE_URL
     Value: (paste the postgresql://... string)
     Environment: Production (and Preview if you use it)

  3) Redeploy the project.

See DEPLOY.md in the repo for screenshots-level detail.
`);
  process.exit(1);
}

execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
execSync("npx next build", { stdio: "inherit", env: process.env });
