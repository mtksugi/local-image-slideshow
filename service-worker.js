const CACHE_NAME = 'slideshow-cache-v1';
const urlsToCache = [
  'index.html',
  'slideshow.js',
  'manifest.json'
  // 必要に応じてキャッシュしたいファイルを追加してください
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュがあればそれを返す
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
}); 