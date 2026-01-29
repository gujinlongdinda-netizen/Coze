import type { Config } from "drizzle-kit";

export default {
  schema: "./src/storage/database/shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.PGDATABASE_URL || "",
  },
} satisfies Config;
