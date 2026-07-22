import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin that stamps a unique build version into the copied sw.js after build
function stampServiceWorker() {
  return {
    name: 'stamp-service-worker',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js')
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8')
        const version = Date.now()
        // Replace the cache name version so the SW file byte-changes on every deploy
        content = content.replace(
          /const CACHE_NAME = ['"`][^'"`]+['"`]/,
          `const CACHE_NAME = 'attendance-logger-cache-v${version}'`
        )
        fs.writeFileSync(swPath, content)
        console.log(`✅ sw.js stamped with build version: ${version}`)
      }
    },
  }
}

export default defineConfig({
  base: '/attendance_logger/',
  plugins: [react(), stampServiceWorker()],
})
