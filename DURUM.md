# ForzaLig — Proje Durumu & Devir Notu
*(Yeni sohbette bu dosyayı oku, kaldığın yerden devam et.)*

## Proje
ForzaLig = halı saha ligi yönetim platformu. **Tek dosya**: `index.html` (~9900 satır kaynak),
React 18 UMD + `<script type="text/babel">`. Sahibi **Fatih** — teknik değil; her teknik
terimden sonra sade Türkçe açıklama ister. Dürüst CTO görüşü ister, yağcılık/onaylayıcılık
istemez. Gereksiz özellikleri silmeyi sever (Katılım ve başvuru maddeleri çıkarıldı).

## Git & Yayın (ÇOK ÖNEMLİ)
- **Kaynak dal**: `claude/faz7-landing-auth-screens-u0dn99` (okunabilir index.html + build/ + supabase/)
- **Yayın dalı**: `main` = DERLENMİŞ üretim sürümü. GitHub Pages `main`'i yayınlar.
- **Özel alan adı**: forzalig.com — `main`'de `CNAME` dosyasıyla (içi: `forzalig.com`). **Her deploy'da korunmalı!**
- **Deploy adımları**:
  1. Kaynağı düzenle (feature dalında) → commit + push
  2. `node build/derle.js` çalıştır (scratchpad'de değil, repodaki build/derle.js) → `compiled.html`
  3. `git checkout main && git pull origin main`
  4. `cp compiled.html index.html` (CNAME'e dokunma)
  5. commit + `git push -u origin main`
  6. feature dalına geri dön
- Commit mesajı sonuna: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` + `Claude-Session: <link>`
- **Model kimliğini (claude-opus-4-8) commit/PR/kod/artifact'a YAZMA** — sadece sohbette.

## Derleme (build/derle.js)
Babel ile derler + **minify (compact:true)** + CDN kütüphanelerine **`defer`** + uygulamayı
**DOMContentLoaded**'da başlatır (hız optimizasyonu). babel-standalone CDN'i çıkarır.
Gereken: `@babel/core`, `@babel/preset-react`. Çıktı boyutu ~648KB.

## Supabase
- Proje: `crkestykdsnmfcmamxav` (URL: crkestykdsnmfcmamxav.supabase.co)
- Client'ta sadece **publishable/anon key** var. **service_role key ASLA paylaşılmaz.**
- Şema dosyaları: `supabase/01_sema.sql` … `10_panel.sql` (hepsi çalıştırıldı) + `99_lansman_temizlik.sql`
- İlişkisel tablolar: ligler, takimlar, oyuncular(player_id kalıcı kimlik), oyuncu_takim, transferler,
  maclar(ev_skor/dep_skor/oynandi), mac_olaylari, mac_odulleri, ilk11, katilim, adminler,
  lig_haklari, profiller, davetler, islem_log, olay_log, takipler. Eski: paylasilan_ligler.
- **KVKK**: `oyuncular_acik` VIEW → dışarı sadece güvenli alanlar (dogum→yaş; telefon/tc/kilo/email GİZLİ).
- Admin: `adminler` tablosu (DB tabanlı). Sadece `fatiherol68@gmail.com` admin.
- `Db` objesi = veri erişim katmanı; `iliskiselMi(turnuva)` = turnuva.iliskisel && sb.

## Ayar durumu (Supabase/Google — hepsi TAMAM)
- Site URL + Redirect URLs → forzalig.com ✅
- Google ile giriş çalışıyor ✅ (Google Cloud projesi: charged-kiln-262321, "In production")
- E-posta doğrulama: varsayılan açık ✅
- Not: Google account-chooser'da "supabase.co" yazması normal (aracı). forzalig.com yazması için
  ücretli Supabase Custom Domain gerekir — şimdilik dokunma.

## BU OTURUMDA YAPILANLAR (hepsi deploy edildi)
1. Profil "Yedekleme & Veri" → sadece admin (`adminMi` prop)
2. Ayarlar yedek/kart-düzenleme → sadece admin
3. "Süper Admin Paneli" linki → DB admin kontrolüne bağlandı (eskiden koda gömülü e-posta)
4. **Sistem Taraması** butonu (Süper Admin panel, en üst): canlı DB'yi tarar, ✅/⚠️/❌ rapor +
   "Raporu Kopyala". KVKK/veri/yetki/tutarsızlık kontrolü. Son tarama: her şey ✅.
5. **Ayarlanabilir stres testi**: kaç lig / ligde takım / takımda oyuncu / format(tek/çift/gruplu/serbest)
   / % oynanmış + canlı önizleme. `uretVeri(n,tk,oy,{format,grup,kisi,oynanmaOran})` genişletildi;
   **diziliş/kadro üretimi eklendi** (dizilisA/B + kadroA/B). Bazı maçlar "oynanmadı" kalabilir.
6. **BUG FIX (önemli)**: 0 lig varken Profil/Takip/Admin/Yasal sayfaları "Henüz lig yok" ekranına
   takılıyordu. `bosMu` artık sadece `ana`/`tumenler`'de true. (satır ~9722)
7. **Hız optimizasyonu**: minify (907→648KB) + CDN defer + DOMContentLoaded boot.

## BU OTURUMDA YAPILANLAR — 2. tur (9 Tem 2026, PageSpeed düzeltmeleri)
Kullanıcı PageSpeed ölçtü: Mobil Perf 74 / Erişilebilirlik 75 / En İyi Uyg. 96 / SEO 100
(Masaüstü Perf 97). İki iş yapıldı:
1. **Erişilebilirlik — zoom kilidi kaldırıldı**: viewport meta'daki `maximum-scale=1.0, user-scalable=no`
   silindi → kullanıcı sayfayı yakınlaştırabiliyor (WCAG ihlali giderildi). Yeni:
   `width=device-width, initial-scale=1.0, viewport-fit=cover`.
2. **Erişilebilirlik — renk kontrastı**: `textMut` (soluk metin) küçük fontlarda 4.5:1'i geçmiyordu
   (~3.3). 4 temada açıldı (kontrast betiğiyle hesaplandı, ≥4.6:1): Neon Yeşil #5A6B85→#74849B,
   Mavi Beyaz #5E7CA0→#6482A6, Mor Neon #7A5FA0→#8C71B2, Turuncu #A07A5F→#A27C61.
   (Kırmızı Beyaz #B08585 ve Altın Lüks #9A8147 zaten geçiyordu — dokunulmadı.)
3. **Performans — Chart.js artık lazy-load**: `<head>`'ten statik Chart.js `<script>` çıkarıldı.
   Yeni `chartYukle()` + `Grafik` bileşeni grafiği yalnızca gerektiğinde (tek yer: Puan Durumu
   "Şampiyonluk Yarışı", `PuanDurumuTekli`) yükler. Açılışta ~200KB JS tasarrufu. Offline
   harness testi doğruladı: grafik render edilmeden istek YOK, mount olunca tam 1 kez yükleniyor.

## BU OTURUMDA YAPILANLAR — 3. tur (Sentry + favicon)
PageSpeed 2. tur sonrası: Mobil Perf 75 / **Erişilebilirlik 90** (75'ten çıktı ✅) / En İyi 96 / SEO 100.
1. **Favicon eklendi**: `<head>`'e SVG data-URI favicon (koyu kare + beyaz futbol topu). Konsoldaki
   `/favicon.ico 404` giderildi + sekme ikonu geldi. Ekstra dosya/istek YOK (data-URI).
2. **Sentry hata izleme (scaffold, DORMANT)**: `<head>`'e tembel yüklenen Sentry başlatıcı eklendi.
   - DSN değişkeni: `window.__FL_SENTRY_DSN` (index.html head'de, şu an BOŞ = Sentry kapalı).
   - Kullanıcı sentry.io'da ücretsiz proje açıp DSN verince, o satıra yapıştır → derle → main'e deploy.
   - SDK sayfa `load`'undan SONRA `requestIdleCallback` ile yüklenir → açılış hızını ETKİLEMEZ.
   - CDN: browser.sentry-cdn.com/7.120.3/bundle.min.js. `tracesSampleRate:0` + replay kapalı
     (ücretsiz kotayı korur; sadece JS hataları toplanır). Offline harness: boş DSN'de istek yok,
     test DSN'de tam 1 kez yüklenip Sentry.init çağrılıyor — doğrulandı.
   - **BEKLİYOR**: kullanıcının gerçek DSN'i (bir sonraki adım).

## Güvenlik başlıkları notu (securityheaders.com = F)
GitHub Pages özel HTTP yanıt başlığı (HSTS/CSP/X-Frame-Options/X-Content-Type-Options/
Referrer-Policy/Permissions-Policy) EKLETMİYOR — statik hosting sınırı. Meta etiketiyle sadece
CSP/referrer eklenebilir ama securityheaders.com yalnız HTTP başlıklarını okur (meta sayılmaz) +
inline script'ler yüzünden katı CSP siteyi kırar. GERÇEK çözüm: forzalig.com'u Cloudflare (ücretsiz)
arkasına alıp başlıkları orada eklemek. Kullanıcı isterse ileride. Acil değil (fonksiyonel risk yok).

## Doğrulama yöntemi (ÖNEMLİ kısıt)
Canlı siteye (forzalig.com, supabase.co, github.io, cdnjs) **egress engeli yüzünden ULAŞILAMIYOR.**
Test = scratchpad'de Playwright + Chromium (/opt/pw-browsers/chromium) ile `compiled.html`'i
CDN yerine yerel React UMD ile açıp (sb=null → misafir/çevrimdışı mod) offline test.
`node build/derle.js` derleme; smoke/misafir testleri offline. Canlı testi kullanıcı yapar.

## BEKLEYEN İŞLER
- [ ] **Lansman temizliği**: Kullanıcı `supabase/99_lansman_temizlik.sql`'i lansman günü çalıştıracak
      (tüm demo/test verisini siler, fatiherol68 hesabı+admin kalır). GERİ ALINAMAZ, aceleye getirme.
- [ ] Kullanıcı sert yenileyip (Ctrl+Shift+R) PageSpeed'i tekrar çalıştıracak → yeni puan.
      (Son ölçüm: Mobil Perf 74 / Erişilebilirlik 75 / En İyi 96 / SEO 100. Bu turdan sonra
      erişilebilirlik ve mobil performansın yükselmesi beklenir.)
- [x] Erişilebilirlik: zoom kilidi + renk kontrastı düzeltildi (bu tur, 3. tur değil — yukarıya bak)
- [x] Chart.js "gerektiğinde yükle" — TAMAM (lazy-load, bu tur)
- [ ] (Opsiyonel, ücretli) Supabase Custom Domain → auth.forzalig.com

## Kullanıcının son tarama raporu (referans — her şey ✅)
20 lig, 136 takım, 1500 oyuncu, 399 maç (hepsi oynanmış), KVKK güvenli, 0 tutarsız maç,
7 üye, 1 admin. (Bunlar demo/test verisi — lansmanda 99 SQL ile silinecek.)
