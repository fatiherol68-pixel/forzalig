import { defineConfig } from 'vite';
export default defineConfig({
  esbuild: { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 4000,
    rollupOptions: { output: { manualChunks: { vendor: ['react', 'react-dom'] } } },
  },
});
