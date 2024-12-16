module.exports = {
  pwa: {
    name: 'Easy Tourney',
    themeColor: '#4CAF50', // Couleur principale
    msTileColor: '#FFFFFF', // Couleur pour Windows
    manifestOptions: {
      short_name: 'Tourney',
      start_url: '/',
      display: 'standalone',
      background_color: '#FFFFFF',
      icons: [
        {
          src: 'img/icons/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'img/icons/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      navigateFallback: '/index.html',
      runtimeCaching: [
        {
          urlPattern: new RegExp('^https://your-api-domain.com/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 10,
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
  },
};
