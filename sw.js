/* 입주예정자협의회 플랫폼 — 서비스 워커
   화면을 기기에 담아두어, 신호가 약한 곳에서도 즉시 열리게 합니다. */
var CACHE = 'jl-tapseok-prugio-park7-202611181053';
var SHELL = ['./', './index.html', './icon-192.png', './icon-512.png', './manifest.json'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL).catch(function () {}); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* 화면은 새 것을 먼저 받아보고, 안 되면 담아둔 것을 씁니다 */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) { return r || caches.match('./'); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});

/* 임원 휴대폰 알림 (웹 푸시) — 관리자가 「알림 받기」를 켠 기기에만 옴 · 건수만 표시 (개인정보 없음) */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { t: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.t || '새 소식', { body: d.b || '', tag: d.tag || 'jl', renotify: true, icon: './icon-192.png', badge: './icon-192.png', data: { u: d.u || '' } }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var u = new URL('./' + ((e.notification.data && e.notification.data.u) || ''), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (ws) {
    for (var i = 0; i < ws.length; i++) { if (ws[i].url.indexOf(self.registration.scope) === 0 && 'focus' in ws[i]) { try { ws[i].navigate(u); } catch (x) {} return ws[i].focus(); } }
    return self.clients.openWindow(u);
  }));
});
