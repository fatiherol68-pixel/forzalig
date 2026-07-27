import { defineConfig } from 'vite';
// ForzaLig — production Vite/ESM build. base '/' (forzalig.com kök).
export default defineConfig({
  base: '/',
  esbuild: { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 4000,
    rollupOptions: { output: { manualChunks: { vendor: ['react', 'react-dom'] } } },
  },
});
