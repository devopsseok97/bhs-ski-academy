import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Set it in .env or your shell before running Prisma commands."
  );
}

export default defineConfig({
  datasource: {
    url,
  },
});
