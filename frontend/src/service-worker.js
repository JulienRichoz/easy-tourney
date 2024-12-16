/* eslint-disable no-console */

self.addEventListener('install', (event) => {
    console.log('Service Worker: Install');
    event.waitUntil(
        caches.open('easy-tourney-v1').then((cache) => {
            console.log('Caching app shell');
            return cache.addAll([
                '/',
                '/index.html',
                '/css/app.css',
                '/js/app.js',
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    console.log('Fetching:', event.request.url);
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activate');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== 'easy-tourney-v1') {
                        console.log('Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});
