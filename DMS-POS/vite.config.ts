import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '127.0.0.1',
    // 5174 matches live CORS allow-list (remote API currently allows :5174, not :5173)
    port: 5174,
    strictPort: true,
  },
})
