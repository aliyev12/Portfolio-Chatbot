import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
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
        // Ensure CSS is injected into JS
        assetFileNames: 'widget.[ext]',
      },
    },
    // Output to backend's public folder
    outDir: '../backend/public',
    emptyOutDir: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
