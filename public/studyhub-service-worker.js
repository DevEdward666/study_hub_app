// Service Worker for Push Notifications
/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'studyhub-v1';

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  // Pre-cache essential resources
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        // Add other essential resources here
      ]).catch((error) => {
        console.error('Failed to cache resources during install:', error);
      });
    })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  let notificationData = {
    title: "Sunny Side Up Notification",
    body: "You have a new notification",
    icon: "/icon.png",
    badge: "/badge.png",
    tag: "studyhub-notification",
    data: {},
  };

  // Parse the push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      console.log("Push data:", data);

      // Extract notification data from the payload
      if (data.notification) {
        notificationData = {
          title: data.notification.title || notificationData.title,
          body: data.notification.body || notificationData.body,
          icon: data.notification.icon || notificationData.icon,
          badge: data.notification.badge || notificationData.badge,
          image: data.notification.image,
          tag: data.notification.tag || notificationData.tag,
          data: data.notification.data || {},
          requireInteraction: data.notification.requireInteraction || false,
          actions: data.notification.actions || [],
        };
      }
    } catch (error) {
      console.error("Failed to parse push data:", error);
      notificationData.body = event.data.text();
    }
  }

  // Show the notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      vibrate: [200, 100, 200], // Vibration pattern
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  // Determine URL to open
  let urlToOpen = "/";
  
  if (event.notification.data && event.notification.data.url) {
    urlToOpen = event.notification.data.url;
  } else if (event.action) {
    // Handle action button clicks
    urlToOpen = event.action;
  }

  // Open or focus the app window
  const promiseChain = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      // Check if there's already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope)) {
          // Focus existing window and navigate
          return client.focus().then((client) => {
            if (client.navigate) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }

      // No window found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

// Notification close event
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);
  
  // You can track notification dismissals here if needed
  // event.waitUntil(
  //   fetch('/api/notifications/dismiss', {
  //     method: 'POST',
  //     body: JSON.stringify({
  //       notificationId: event.notification.tag
  //     })
  //   })
  // );
});

// Message event - for communication with the main app
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

console.log("Service Worker loaded successfully");

