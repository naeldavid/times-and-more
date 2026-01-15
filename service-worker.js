"use strict";

const CACHE_NAME = 'times-and-more-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/static/style.css',
    '/static/script.js',
    '/static/languagesupport.js',
    '/static/favicon.ico',
    '/static/moon.png',
    '/static/sujud.svg'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Handle notification clicks (focus/open the app)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
            if ('focus' in client) {
                return client.focus();
            }
        }
        if (self.clients.openWindow) {
            return self.clients.openWindow('/');
        }
    })());
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // For API requests, try network first, then cache
    if (request.url.includes('api.aladhan.com') || request.url.includes('nominatim.openstreetmap.org')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone the response and cache it
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // If network fails, try cache
                    return caches.match(request);
                })
        );
    } else {
        // For static assets, try cache first, then network
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    return response || fetch(request).then((fetchResponse) => {
                        // Cache new resources
                        const responseClone = fetchResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                        return fetchResponse;
                    });
                })
                .catch(() => {
                    // Optionally return a custom offline page
                    if (request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                })
        );
    }
});
