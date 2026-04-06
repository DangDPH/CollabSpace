import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Port 5173 is used for local dev. 
    // In production, Nginx serves the build from port 80.
    port: 5173
  }
})
