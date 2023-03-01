import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  define: { "process.env": {} },
  resolve: {
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  server: {
    open: true,
    cors: true,
  },
  root: "./public",
});
