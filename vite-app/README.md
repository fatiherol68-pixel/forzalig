# ForzaLig — Vite/ESM (Faz 5, PARALEL — deploy edilmez)

Mevcut byte-identical sistem (`../index.html` + `../src/` + `build/derle.js` → `main`)
DEĞİŞMEDEN durur. Bu klasör, aynı uygulamanın **Vite/ESM + kod bölme + lazy** ile
paketlenmiş bir ADAYIDIR. Canlıya alınması SENİN onayın + gerçek backend testinden sonradır.

## Çalıştırma
```
cd vite-app
node uret.mjs          # ../index.html babel bloğundan src/ üretir
npm install --legacy-peer-deps
npm run build          # dist/ üretir
npm run preview        # yerelde önizleme
```

## Mimari
- `src/main.jsx` — minik giriş: splash + `import('./app-body.jsx')` (dinamik → lazy chunk).
- `src/app-body.jsx` — React'i ESM olarak alır (`window.React`'e de koyar, klasik-global kod için),
  rarity global yardımcıları + tüm uygulama kodu (index.html babel bloğu). `createRoot` içinde.
- `vite.config.js` — klasik JSX (`React.createElement`), `manualChunks: { vendor:['react','react-dom'] }`.
- CDN globalleri (supabase, qrcode) `index.html`'de script tag ile (eskisi gibi external).

## Üretilen chunk'lar (doğrulandı)
- `index-*.js` ~2 KB (giriş/splash) · `vendor-*.js` ~141 KB (React, ayrı önbellek) ·
  `app-body-*.js` ~924 KB (LAZY — ilk boyadan sonra).

## DOĞRULANAN
- `vite build` başarılı; ESM strict-mode altında 6/6 ekran boot+render (Ana/Keşfet/Profil/Bildirim/Takip/Sohbet).
- Vendor kod bölme + app-body lazy chunk çalışıyor.

## DOĞRULANAMAYAN (senin ortamında gerekli)
- Backend/Auth gerektiren akışlar (Supabase yazma, giriş, Admin Paneli, Maç Sihirbazı, formlar)
  bu başsız/backend'siz ortamda çalıştırılamadı. Strict-mode (ESM) yalnız yüklenen 6 rotada doğrulandı;
  nadir kod yollarındaki olası sloppy-mode kalıntıları ancak o ekranlar gerçek backend ile gezilince görülür.
- Ekran-bazlı `React.lazy` (admin/sihirbaz/gazete ayrı lazy chunk) için her modülün
  serbest değişkenleri (T, git, Db, Motor, ~100 bileşen) import'a bağlanmalı → gerçek backend ile test şart.
