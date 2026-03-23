import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4010,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true
      }
    }
  },
  build: {
    // Warn on chunks > 600kb (default 500kb is too noisy for this bundle size)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy vendor libs into a separate chunk cached by browsers
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['react-icons'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-http': ['axios']
        }
      }
    }
  }
})
