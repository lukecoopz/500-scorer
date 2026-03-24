import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import path from 'path'
import { defineConfig } from 'vite'

function githubPagesSpa() {
  return {
    name: 'github-pages-spa',
    closeBundle() {
      copyFileSync(
        path.resolve(__dirname, 'dist/index.html'),
        path.resolve(__dirname, 'dist/404.html')
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), githubPagesSpa()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});