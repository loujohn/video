import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: [
    '@primevue/nuxt-module',
    '@nuxtjs/tailwindcss',
  ],
  primevue: {
    options: {
      theme: {
        preset: Aura,
      },
    },
  },
  css: ['primeicons/primeicons.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drama_studio',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
})
