const CACHE_NAME = 'commontable-v1'
const urlsToCache = [
  '/',
  '/messages',
  '/dashboard',
  '/saved',
  '/offline',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.log('Cache install failed:', error)
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip caching for API routes and dev files
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/_next/') ||
      event.request.url.includes('/__nextjs_') ||
      event.request.url.includes('/webpack-hmr')) {
    // Just fetch normally for API routes and dev files
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone()
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          // Clone the response because it's a stream
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
          
          return response
        }).catch(() => {
          // If both cache and network fail, show offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/offline')
          }
        })
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Background sync for offline message sending
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New message received',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'message-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('CommonTable', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/messages')
    )
  }
})

// Helper function to sync messages when back online
async function syncMessages() {
  try {
    // Get pending messages from IndexedDB
    // This would require implementing IndexedDB storage for offline messages
    console.log('Syncing offline messages...')
    // Implementation would go here
  } catch (error) {
    console.error('Failed to sync messages:', error)
  }
}
