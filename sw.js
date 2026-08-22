const CACHE_NAME = 'srilanka-trip-20260822';
const BASE = '/sri-lanka-trip';
const ASSETS = [
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  BASE + '/hero.jpg',
  BASE + '/photos/colombo.jpg',
  BASE + '/photos/rekawa.JPG',
  BASE + '/photos/tangalle.jpg',
  BASE + '/photos/galle.jpg',
  BASE + '/photos/galle_1.jpg',
  BASE + '/photos/kandy.jpg',
  BASE + '/photos/kandy_1.jpg',
  BASE + '/photos/Anuradhapura.jpg',
  BASE + '/photos/Anuradhapura_1.jpg',
  BASE + '/photos/Anuradhapura_2.jpg',
  BASE + '/photos/dambulla.jpg',
  BASE + '/photos/dambulla_1.jpg',
  BASE + '/photos/sigiriya.jpg',
  BASE + '/photos/sigiriya_1.jpg',
  BASE + '/photos/sigiriya_2.jpg',
  BASE + '/photos/galle_face_green.jpg',
  BASE + '/photos/galle_museum.jpeg',
  BASE + '/photos/colombo_museum.jpeg',
  BASE + '/photos/pettah.jpg',
  BASE + '/photos/gangaramaya.jpg',
  BASE + '/photos/kandy_lake.jpg',
  BASE + '/photos/kandy_museum.webp',
  BASE + '/photos/kandy_gardens.jpg',
  BASE + '/photos/kandy_temple.jpg',
];

// Install — cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(ASSETS.map(url => cache.add(url))))
      .then(() => {
        console.log('SW installed:', CACHE_NAME);
        // Don't skipWaiting here — wait for message from page
      })
  );
});

// Listen for SKIP_WAITING from the page
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate — delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('Deleting old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - index.html: network first, fall back to cache
// - everything else: cache first, fall back to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip Google APIs
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    return;
  }

  // Network-first for index.html — always get fresh content
  if (url.pathname === BASE + '/' || url.pathname === BASE + '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else (photos, assets)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(BASE + '/index.html');
        }
      });
    })
  );
});
