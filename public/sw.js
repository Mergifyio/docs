// This file is intentionally kept even if not loaded anymore
// to unregister the service worker of the previous versions of the documentation

self.addEventListener('install', function () {
    self.skipWaiting();
});
self.addEventListener('activate', function () {
    console.log(`Unregistering service worker`)
    self.registration.unregister()
        .then(function () {
            return self.clients.matchAll();
        })
        .then(function (clients) {
            clients.forEach(client => {
                console.log(`Navigating ${client.url}`)
                client.navigate(client.url)
            })
        });
});
