import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // لا تحذف أي جدول أو عمود تلقائياً عند publish
  // الأعمدة الجديدة تُضاف عبر ALTER TABLE IF NOT EXISTS في server/index.ts
  tablesFilter: ["!session", "!group_push_subscriptions"],
  migrations: {
    table: "__drizzle_migrations",
  },
});
