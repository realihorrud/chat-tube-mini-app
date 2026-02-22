import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import tseslint from "typescript-eslint";

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern",
      },
    },
  },
  plugins: [tailwindcss(), react(), tsconfigPaths()],
  build: {
    target: "esnext",
    minify: "terser",
  },
  publicDir: "./public",
  server: {
    proxy: {
      "/api": {
        target: "http://localhost",
        changeOrigin: true,
      },
    },
    // Exposes your dev server and makes it accessible for the devices in the same network.
    // host: true,
    allowedHosts: [
      "8cce-2a02-2378-10af-b63c-30c6-fb99-b200-38d1.ngrok-free.app",
    ],
  },
});
