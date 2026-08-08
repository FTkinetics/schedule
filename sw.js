/*
 * 周日程 PWA 离线缓存脚本
 * 策略：HTML 导航请求 network-first（永远拿最新页面），静态资源 stale-while-revalidate
 * 每次发布新版本请 bump CACHE_NAME，旧缓存会在 activate 阶段自动清理。
 */
const CACHE_NAME = "weekly-schedule-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon.svg",
];

// 安装：预缓存核心资源，并跳过等待立即激活
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
});

// 激活：清理旧版本缓存，并立即接管所有已打开的页面
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  // 仅处理同源请求，避免拦截第三方资源
  if (url.origin !== self.location.origin) return;

  // 导航请求（HTML 页面）：network-first，保证每次都拿到最新页面
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match("./"))
        )
    );
    return;
  }

  // 其他静态资源：stale-while-revalidate
  // 先返回缓存（秒开），同时后台拉取最新并刷新缓存
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
