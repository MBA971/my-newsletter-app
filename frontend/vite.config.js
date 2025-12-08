import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Needed for Docker
    port: 5173,
  },
  // Ensure the build outputs to the correct directory
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})