self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'Zerava Filmboard',
    body: 'Ada pesan atau aktivitas baru!',
    page: 'all|notifications'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    silent: false,
    vibrate: [200, 100, 200],
    tag: 'zerava-push-' + Date.now(),
    renotify: true,
    data: { page: data.page || 'all|notifications' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawRoute = (event.notification.data && event.notification.data.page) ? event.notification.data.page : 'all|home';
  const targetUrl = `/?notif_route=${encodeURIComponent(rawRoute)}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
