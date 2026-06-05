// 서비스워커 — 네트워크 우선(온라인이면 항상 최신 코드), 오프라인이면 캐시로 폴백.
// 개발 중 코드 갱신이 폰에 즉시 반영되도록 cache-first가 아닌 network-first로 둔다.
var CACHE = "jamak-v10";
var ASSETS = ["./", "./index.html", "./manifest.json", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // 일부 자산이 없어도 설치 실패하지 않도록 개별 추가.
    return Promise.all(ASSETS.map(function (u) {
      return c.add(u).catch(function () {});
    }));
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  // 같은 출처(앱 파일)만 캐시한다. 구글 애널리틱스 등 외부 요청은 그냥 통과(캐시 안 함).
  var sameOrigin = e.request.url.indexOf(self.location.origin) === 0;
  e.respondWith(
    fetch(e.request).then(function (resp) {
      if (sameOrigin) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      }
      return resp;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
