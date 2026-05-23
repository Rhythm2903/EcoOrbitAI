import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forwards localhost:5173/api/* to localhost:8000/api/*
      '/api': 'http://127.0.0.1:8000'
    }
  }
})