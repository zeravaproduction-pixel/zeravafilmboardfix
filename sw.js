// sw.js - Service Worker Resmi Zerava Filmboard (Support Background Push & Native Sound)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Menangkap sinyal Push dari Server saat aplikasi di-close / di latar belakang
self.addEventListener('push', (event) => {
  let data = {
    title: 'Zerava Filmboard',
    body: 'Ada pesan atau aktivitas baru!',
    page: 'notifications'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // silent: false memastikan HP memakai nada dering notifikasi asli bawaan HP masing-masing
  const options = {
    body: data.body,
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    silent: false,
    vibrate: [200, 100, 200],
    tag: 'zerava-push-' + Date.now(),
    renotify: true,
    data: { page: data.page || 'notifications' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Saat notifikasi di bar atas HP diketuk oleh member
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPage =
    event.notification.data && event.notification.data.page
      ? `/#${event.notification.data.page}`
      : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetPage);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetPage);
      }
    })
  );
});
