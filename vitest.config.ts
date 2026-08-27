import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    exclude: ["**/node_modules/**", "**/.next/**", "**/.worktrees/**"],
  },
  resolve: { alias: { "@": path.resolve(__dirname) } },
});
