/**
 * prisma generate only validates the datasource URL format — it does not connect.
 * Use a placeholder when DATABASE_URL is unset so npm install / CI can succeed.
 */
require("dotenv").config();

const { execSync } = require("child_process");

const placeholder =
  "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder";
const url = process.env.DATABASE_URL?.trim() || placeholder;

execSync("npx prisma generate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});
