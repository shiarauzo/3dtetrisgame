import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production for smaller bundle
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  // Optimize deps
  optimizeDeps: {
    include: ['three'],
  },
});
