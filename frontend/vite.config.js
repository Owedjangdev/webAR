import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // Cible navigateur explicite : Chrome >= 80 (Android entry-level).
    // Voir CLAUDE.md section 3. Tester sur un Android ancien avant adoption.
    target: 'chrome80',
  },
})
