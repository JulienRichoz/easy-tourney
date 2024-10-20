const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})

module.exports = {
  pwa: {
    name: 'Easy Tourney',
    shortName: 'Tourney',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    display: "standalone",
    startUrl: "/",
    workboxOptions: {
      skipWaiting: true,
    },
    icons: [
      {
        src: "img/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "img/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  },
};
