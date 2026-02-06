import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React vendor chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts library (used by Dashboard, Controls, Risks, Monitoring)
          'vendor-charts': ['recharts'],
          // PDF export libraries (used by AI Writer, Controls, SSP)
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          // Markdown rendering (used by AI Writer)
          'vendor-markdown': ['react-markdown'],
          // Redux state management
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
