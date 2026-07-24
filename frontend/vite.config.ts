import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import { visualizer } from "rollup-plugin-visualizer"
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),  visualizer({ open: true, gzipSize: true, brotliSize: true }),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    } 
  },
  server: {
    proxy: {
      // Redirects local requests starting with /api to your Render backend
      '/api': {
        target: 'https://synap-circle-onrender.com',
        changeOrigin: true,
        secure: true,
      }
    }
  }
  

})
