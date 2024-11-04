import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: [
      'discord.js',
    ],
  },
  base: process.env.DEV_ENV == 'true' ? '/' : './',
  build: {
    outDir: 'electron/build'
  },
  plugins: [
    svelte(),
  ],
})
