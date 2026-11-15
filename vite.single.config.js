import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

// Gera UM único arquivo HTML (dist-single/index.html) com tudo embutido — bom para testar/compartilhar rapidamente.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { outDir: 'dist-single', assetsInlineLimit: 100000000, cssCodeSplit: false },
});
