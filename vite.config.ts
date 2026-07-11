import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages 專案頁面掛在 /pokemon-destiny/ 底下；本地開發維持根路徑
  base: command === 'build' ? '/pokemon-destiny/' : '/',
  server: {
    port: Number(process.env.PORT) || 5173,
  },
}))
