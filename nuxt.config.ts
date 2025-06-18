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
    'nuxt-auth-utils',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
  ],

  googleFonts: {
    families: {
      // Add existing families here, if any
      Comfortaa: [400,500, 600, 700], // Example weights, adjust as needed
      'Roboto Mono': [400, 500, 600, 700], // Example weights, adjust as needed
      Montserrat: [400, 500, 600, 700] // Assuming Montserrat was already needed or is the base
    },
    display: 'swap', // Recommended for performance
  },

  // Nitro configuration for better serverless deployment
  nitro: {
    // Disable route rules caching for API routes in production to avoid stale data
    routeRules: {
      '/api/**': {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    },
    // Enable compression
    compressPublicAssets: true,
    // Add experimental features for better serverless support
    experimental: {
      wasm: true
    }
  },

  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (only available on server-side)
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    
    // Public keys (exposed to client-side)
    public: {
      // Add any public runtime config if needed
    }
  }
})