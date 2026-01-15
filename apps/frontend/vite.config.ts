import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces in dev mode (required for Docker)
    host: '0.0.0.0',
    port: 5173,
  },
  define: {
    // Replace process.env.NODE_ENV with string literal for browser compatibility
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'PortfolioChatbot',
      fileName: () => 'widget.js',
      formats: ['iife'], // Immediately Invoked Function Expression - runs automatically
    },
    rollupOptions: {
      output: {
        // All dependencies bundled into one file
        inlineDynamicImports: true,
        // Output CSS as separate file for Shadow DOM injection
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'widget.css';
          return 'widget.[ext]';
        },
      },
    },
    // Output to backend's public folder
    outDir: '../backend/public',
    emptyOutDir: false,
  },
});
