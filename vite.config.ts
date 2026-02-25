import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/chat-tube-mini-app',
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
});
