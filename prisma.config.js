require("dotenv").config();

const { defineConfig } = require("@prisma/config");

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL environment variable is not set. Set it in .env or your shell before running Prisma commands.");
}

module.exports = defineConfig({
  datasource: {
    url,
  },
});
