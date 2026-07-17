/* ForzaLig service worker — kabuk önbelleği + güncelleme bildirimi
   SÜRÜM: her deploy'da derle.js bu numarayı otomatik günceller (1e2b38d-1784287915). */
const SURUM = "1e2b38d-1784287915";
const KABUK = "forzalig-kabuk-" + SURUM;

// Açılış için gereken çekirdek dosyalar (CDN dosyaları ilk kullanımda önbelleğe alınır)
const CEKIRDEK = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(KABUK).then((c) => c.addAll(CEKIRDEK)).catch(() => {})
  );
  // Yeni sürüm hemen "waiting" durumuna geçsin; sayfa toast ile kullanıcıya sorar.
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((adlar) =>
      Promise.all(adlar.filter((a) => a.startsWith("forzalig-kabuk-") && a !== KABUK).map((a) => caches.delete(a)))
    ).then(() => self.clients.claim())
  );
});

// Sayfadan "hemen geç" mesajı gelirse bekleyen sürümü etkinleştir
self.addEventListener("message", (e) => {
  if (e.data === "FL_SKIP_WAITING") self.skipWaiting();
});

// PUSH bildirimi geldi → telefonda göster
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { baslik: "ForzaLig", metin: (e.data && e.data.text()) || "" }; }
  const baslik = d.baslik || "ForzaLig";
  e.waitUntil(
    self.registration.showNotification(baslik, {
      body: d.metin || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { link: d.link || "/" },
      tag: d.tag || "forzalig",
    })
  );
});

// Bildirime tıklanınca uygulamayı aç / öne getir
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const hedef = (e.notification.data && e.notification.data.link) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((liste) => {
      for (const c of liste) { if ("focus" in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(hedef);
    })
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // HTML (gezinme): ÖNCE AĞ — her zaman güncel sürümü dene, çevrimdışıysa önbellek
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const kopya = r.clone();
          caches.open(KABUK).then((c) => c.put("/", kopya)).catch(() => {});
          return r;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // CDN kütüphaneleri + kendi ikon/manifest dosyaları: ÖNCE ÖNBELLEK (değişmezler)
  const cdnMi = /cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  const yerelStatikMi = url.origin === self.location.origin && /^\/(icons\/|manifest\.json)/.test(url.pathname);
  if (cdnMi || yerelStatikMi) {
    e.respondWith(
      caches.match(e.request).then(
        (bulunan) =>
          bulunan ||
          fetch(e.request).then((r) => {
            if (r && r.ok) {
              const kopya = r.clone();
              caches.open(KABUK).then((c) => c.put(e.request, kopya)).catch(() => {});
            }
            return r;
          })
      )
    );
  }
  // Supabase ve diğer API çağrıları: SW karışmaz (her zaman ağ)
});
