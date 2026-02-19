import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    tsconfigPaths(),
  ],
  build: {
    target: 'esnext',
    minify: 'terser'
  },
  publicDir: './public',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
    // Exposes your dev server and makes it accessible for the devices in the same network.
    // host: true,
	allowedHosts: [
		"6e1f-2a02-2378-10aa-4ea4-b10a-e310-a0e5-4edb.ngrok-free.app",
	]
  },
});
