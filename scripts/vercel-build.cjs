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
  console.error(
    "\n[Rekindle] DATABASE_URL is not set.\n" +
      "  Vercel → your project → Settings → Environment Variables\n" +
      "  Add DATABASE_URL (your Postgres connection string) for Production, then redeploy.\n",
  );
  process.exit(1);
}

execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
execSync("npx next build", { stdio: "inherit", env: process.env });
