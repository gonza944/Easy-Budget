// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    'shadcn-nuxt',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],

  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_KEY,
    },
  },

  googleFonts: {
    families: {
      // Add existing families here, if any
      Comfortaa: [400,500, 600, 700], // Example weights, adjust as needed
      'Roboto Mono': [400, 500, 600, 700], // Example weights, adjust as needed
      Montserrat: [400, 500, 600, 700] // Assuming Montserrat was already needed or is the base
    },
    display: 'swap', // Recommended for performance
  },
})
