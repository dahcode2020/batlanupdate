// Service Worker for Banque Atlantique
const CACHE_NAME = 'banque-atlantique-v1.0.0';
const STATIC_CACHE = 'banque-atlantique-static-v1.0.0';
const DYNAMIC_CACHE = 'banque-atlantique-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/BACI-Logo-slogan.png',
  // Add other static assets
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/users',
  '/api/accounts',
  '/api/transactions'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (STATIC_FILES.includes(url.pathname)) {
    // Static files - cache first
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    // API requests - network first with cache fallback
    event.respondWith(networkFirst(request));
  } else if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg')) {
    // Assets - cache first
    event.respondWith(cacheFirst(request));
  } else {
    // HTML pages - network first
    event.respondWith(networkFirst(request));
  }
});

// Cache first strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached new resource:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Offline - Resource not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Updated cache from network:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving stale content from cache:', request.url);
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Banque Atlantique - Hors ligne</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #ea580c; }
          </style>
        </head>
        <body>
          <h1 class="offline">🔌 Mode Hors Ligne</h1>
          <p>Vous êtes actuellement hors ligne.</p>
          <p>Veuillez vérifier votre connexion internet et réessayer.</p>
          <button onclick="window.location.reload()">Réessayer</button>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Process any queued offline actions
    console.log('[SW] Processing background sync');
    
    // This would typically sync offline data when connection is restored
    // For now, just log that sync is working
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification de la Banque Atlantique',
    icon: '/BACI-Logo-slogan.png',
    badge: '/BACI-Logo-slogan.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Voir',
        icon: '/BACI-Logo-slogan.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/BACI-Logo-slogan.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Banque Atlantique', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service worker loaded successfully');