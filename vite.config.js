import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import Icons from 'unplugin-icons/vite'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: [
      'discord.js',
      '@discordjs/voice',
    ],
  },
  base: process.env.DEV_ENV == 'true' ? '/' : './',
  build: {
    outDir: 'electron/build'
  },
  plugins: [
    svelte(),
    Icons({
      compiler: 'svelte',
    }),
  ],
})
