const CACHE_NAME = 'srilanka-trip-v4';
const BASE = '/sri-lanka-trip';
const ASSETS = [
  BASE + '/',
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
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Inter:wght@300;400;500;600&display=swap',
];

// Install — cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache what we can, ignore failures for external resources
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first for app assets, network first for Maps API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go to network for Google Maps
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and not cached, return the main page
        if (event.request.mode === 'navigate') {
          return caches.match(BASE + '/index.html');
        }
      });
    })
  );
});
