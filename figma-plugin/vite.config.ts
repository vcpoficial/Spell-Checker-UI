import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  plugins: [viteSingleFile()],
  build: {
    outDir: '../dist',
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    brotliSize: false,
    emptyOutDir: false, 
    rollupOptions: {
      input: {
        ui: resolve(__dirname, 'src/ui.html'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
