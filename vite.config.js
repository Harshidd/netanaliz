import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. Core Framework (Highest Priority)
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('react-router') || id.includes('/scheduler/') || id.includes('react-is') || id.includes('prop-types')) {
              return 'vendor-react'
            }
            if (id === 'react' || id === 'react-dom') return 'vendor-react'

            // 2. Heavy PDF/Image Libs
            if (id.includes('@react-pdf') || id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg') || id.includes('dompurify')) {
              return 'vendor-pdf'
            }

            // NEW: PDF Dependency Libs (found in vendor-libs previously)
            if (id.includes('yoga-layout') || id.includes('fontkit') || id.includes('linebreak') || id.includes('unicode-properties') || id.includes('unicode-trie')) {
              return 'vendor-pdf-libs'
            }

            // 3. Excel/Data Processing
            if (id.includes('xlsx') || id.includes('exceljs')) {
              return 'vendor-excel'
            }

            // 4. Charts
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
              return 'vendor-charts'
            }

            // 5. UI & Icons
            if (id.includes('lucide') || id.includes('@dnd-kit') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('@radix-ui')) {
              return 'vendor-ui'
            }

            // NEW: QR Code Libs (found in vendor-libs previously)
            if (id.includes('jsqr') || id.includes('qrcode')) {
              return 'vendor-qrcode'
            }

            // 6. App Core (State, DB, Utils)
            if (id.includes('dexie') || id.includes('zustand') || id.includes('zod') || id.includes('uuid') || id.includes('@capacitor') || id.includes('axios')) {
              return 'vendor-core'
            }

            // NEW: Date & i18n
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment') || id.includes('luxon') || id.includes('intl') || id.includes('i18next')) {
              return 'vendor-date-i18n'
            }

            // NEW: Utilities
            if (id.includes('lodash') || id.includes('nanoid') || id.includes('immer') || id.includes('deepmerge') || id.includes('fast-deep-equal') || id.includes('classnames')) {
              return 'vendor-utils'
            }

            // NEW: Polyfills
            if (id.includes('core-js') || id.includes('whatwg') || id.includes('regenerator-runtime') || id.includes('tslib')) {
              return 'vendor-polyfills'
            }

            // 7. Remainder
            return 'vendor-libs'
          }

          // SRC MODULES: Removed manual forcing to allow dynamic imports to handle circular shared code naturally.
        }
      }
    }
  }
})
