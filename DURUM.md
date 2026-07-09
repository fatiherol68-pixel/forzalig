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
2. **Sentry hata izleme — AKTİF (deploy edildi)**: `<head>`'de tembel yüklenen Sentry başlatıcı.
   - DSN değişkeni: `window.__FL_SENTRY_DSN` (index.html head'de). DSN girildi (EU bölgesi:
     `...ingest.de.sentry.io/4511704256479312`). Proje: sentry.io "forzalig" (Browser JS).
   - SDK sayfa `load`'undan SONRA `requestIdleCallback` ile yüklenir → açılış hızını ETKİLEMEZ.
   - CDN: browser.sentry-cdn.com/7.120.3/bundle.min.js. `tracesSampleRate:0` + replay kapalı
     (ücretsiz kotayı korur; sadece JS hataları toplanır). Offline harness (gerçek DSN): SDK
     load sonrası tam 1 kez yükleniyor, Sentry.init doğru DSN ile çağrılıyor — doğrulandı.
   - DSN gizli değil (client-side, publishable) — repoda durması normal, service_role gibi değil.

## BU OTURUMDA YAPILANLAR — 4. tur (mobil performans: statik açılış ekranı)
Sorun: mobil Perf 75 — TBT 0 ama FCP 3.8s / LCP 4.5s (ilk boyama çok geç, çünkü `#root` boştu ve
React+CDN yüklenene kadar hiçbir şey görünmüyordu). Çözüm (auth'a DOKUNMADAN, düşük risk):
1. **Statik açılış ekranı**: `#root` içine düz HTML splash (`#fz-onsplash`: saha SVG + ⚽ + yeşil
   "ForzaLig" + yükleniyor çubuğu + forzalig.com). HTML gelir gelmez boyanır; React `createRoot`
   render edince otomatik değişir. → FCP/LCP React'i beklemez.
2. **Google Fonts render-blocking DEĞİL**: `media="print" onload="this.media='all'"` + `<noscript>`
   fallback. Fontlar ilk boyamayı geciktirmez (splash sistem fontuyla anında çıkar).
3. **preconnect**: cdnjs, jsdelivr, fonts.googleapis, fonts.gstatic → bağlantı kurulumu erken.
4. **Beyaz flaş önleme**: body/#root `background: var(--bg0, #070B12)` fallback (JS öncesi de koyu).
Ölçüm (yerel Lighthouse, gzip'li, mobil emülasyon): **Perf 75→94**, FCP 3.8→1.5s, LCP 4.5→2.2s,
Speed Index 1.5s, CLS 0. Erişilebilirlik 100, best-practices 96 korundu (offline harness).
NOT: Kalan darboğaz TBT ~230ms (React parse/boot). 95+ garanti için Supabase'i lazy-load etmek
gerekir ama o AUTH akışını riske atar — lansman öncesi yapılmadı (bilerek). Kullanıcı isterse ayrı tur.
NOT2: İlk açılışta artık "çift splash" olabilir (statik → sonra React'in animasyonlu splash'ı). İkisi de
koyu/ForzaLig, akıcı; kullanıcı beğenmezse React splash'ı ilk açılışta atlatılabilir.
NOT3: Kullanıcı 11:16'da ölçtüğünde mobil hâlâ 75 + filmstrip eski (beyaz→animasyon) çıktı → deploy
YAYILMADAN ölçmüş. origin/main'de splash doğru konumda (satır 188, inline script satır 206'dan önce)
teyit edildi. Sert yenile + 1 dk bekleyip tekrar ölçmesi gerekiyor.

## BU OTURUMDA YAPILANLAR — 5. tur (erişilebilirlik: "Canlı" kontrastı)
PageSpeed kontrast raporunu açtı → başarısız öğe: `<span class="live-dot">` "Canlı" (üst header,
font 11px, bg #070B12). Kök neden: `@keyframes pulse{50%{opacity:.4}}` animasyonu TÜM span'a
(nokta+yazı) uygulanıyordu; Lighthouse sönük anında (opacity .4) yakalayınca yeşil metnin kontrastı
~2.5:1'e düşüyordu. Düzeltme: `live-dot` (pulse) sınıfı artık sadece 7×7 iç NOKTADA; "Canlı" yazısı
tam opak (accent yeşil #34D399 on #070B12 = ~10:1 ✅). Canlı yanıp-sönme efekti korundu. Offline
smoke: 0 hata, live-dot 7×7 noktada, uygulama render ediyor. → mobil+masaüstü Erişilebilirlik 90→95+ beklenir.

## KULLANICI KARARLARI (9 Tem 2026 — bunlara UYULACAK)
Son PageSpeed (yeni sürüm canlı): Mobil Perf **84** / Erişilebilirlik **100** / En İyi 96 / SEO 100.
Masaüstü Perf **99** / Erişilebilirlik **100**. FCP 3.8→1.6s (statik splash tuttu). Erişilebilirlik
90→100 ("Canlı" kontrast fix tuttu). Kalan tek kırmızı: mobil **LCP 4.6s**.
- **AÇILIŞ SPLASH'İ 4 SANİYE KALACAK** ← kullanıcı bilerek seçti. LCP 4.6s'nin sebebi bu (animasyonlu
  splash içeriği geciktiriyor). Mobili 95'e çıkarmak splash'i kısaltmayı/atlamayı gerektirir ama
  kullanıcı animasyonu tercih etti. **SPLASH SÜRESİNE/ANİMASYONUNA DOKUNMA** (aksi istenmedikçe).
- **Güvenlik başlıkları (securityheaders F) şimdilik BIRAKILDI** ← kullanıcı seçti. Fonksiyonel risk yok.
  İleride istenirse çözüm: Cloudflare (ücretsiz) + DNS/nameserver değişikliği (kullanıcı aksiyonu).

## AKTİF GELİŞTİRME — Fotoğraflı takım/oyuncu + davet zinciri (BAŞLANDI, main'e deploy EDİLMEDİ)
Kullanıcı istedi: (1) takım kaptanı linkle takım kurar (ad + 2 renk + logo foto), (2) otomatik oyuncu
linki/QR çıkar, (3) oyuncular Google ile ZORUNLU giriş yapıp kayıt olur (ad soyad, mevki, forma no,
FOTOĞRAF + opsiyonel kg/boy/doğum/uyruk), (4) admin ligden düzeltir. Fotoğraf her yerde (kadro,
istatistik, gazete, kartlar). Google girişi zorunlu — kullanıcı bilerek seçti (kayıp riskini söyledim).

**PARÇA 1 — Fotoğraf altyapısı: BİTTİ (feature dalında, main'de DEĞİL).**
- `svgAvatar(ad,boy,foto)` + `svgAmblem(ad,renk,boy,logo)`: foto/logo varsa `<img object-fit:cover>`,
  yoksa eski çizim. Avatar/Logo bileşenleri güncel. ~28 avatar + ~25 logo çağrısı perl ile bağlandı
  (foto/logo yoksa otomatik çizime düşer — güvenli, geriye dönük uyumlu).
- Veri: oyuncu `foto:null`, takım `logo:null, renk2:null` (yeniOyuncu/yeniTakim + ilişkisel kaydet/yükle
  eşlemesi eklendi). Paylaşımda (paylasimIcinTemizle) foto/logo KORUNUR (doğum/tel/kilo gizli kalır).
- `fotoYukle(dosya,klasor)` + `resimKucult`: telefon fotoğrafını max 512px jpeg'e küçültür → Supabase
  Storage `fotolar` bucket → public URL. sb yoksa/giriş yoksa hata (çağıran avatar'a düşer).
- Offline smoke: 0 hata, avatar/logo render (çizim fallback çalışıyor). Derleme temiz.
- **KULLANICI GÖREVİ (paralel):** `supabase/11_foto_storage.sql` çalıştıracak (fotolar bucket + RLS +
  oyuncular.foto / takimlar.logo,renk2 sütunları). Bu olmadan foto yükleme uçtan uca test edilemez.

**PARÇA 2 (SIRADA) — Davet zinciri UI:** kaptan takım kurulum formu (ad + 2 renkli seçici + logo yükle)
→ otomatik oyuncu davet linki/QR. `DavetKatil` (9142) şu an sadece isim/no alıyor; zenginleştirilecek.
**PARÇA 3 (SIRADA) — Google zorunlu oyuncu kayıt + foto seçici + admin düzenleme ekranları.**
NOT: `oyuncular_acik` (public KVKK view) foto sütununu içermiyor olabilir — public relational okuma için
foto'yu o view'e eklemek gerekebilir (paylaşım JSON blob yolunda foto zaten görünür, o yüzden kritik değil).

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
- [x] **Lansman temizliği YAPILDI (9 Tem 2026)**: Kullanıcı `99_lansman_temizlik.sql`'i Supabase SQL
      Editor'da çalıştırdı. Kontrol sorgusu: ligler/takimlar/oyuncular/maclar=0, uyeler=1, adminler=1 ✅.
      Veritabanı temiz, lansmana hazır. (Demo veri gitti; sadece fatiherol68 hesabı+admin kaldı.)
- [x] Erişilebilirlik: zoom kilidi + renk kontrastı + "Canlı" pulse kontrast → TAMAM (Mobil+Masaüstü 100)
- [x] Chart.js lazy-load + statik açılış ekranı + favicon + Sentry → TAMAM (Mobil Perf 84, Masaüstü 99)
- [ ] Kullanıcı canlı siteyi temiz veritabanıyla test edecek (boş ekran, giriş, yeni lig oluşturma).
- [ ] (Opsiyonel) Mobil Perf 84→95: açılış splash süresini kısaltmak gerekir — kullanıcı 4sn KALSIN dedi.
- [ ] (Opsiyonel, ücretli) Supabase Custom Domain → auth.forzalig.com
- [ ] (Opsiyonel) Cloudflare + güvenlik başlıkları (securityheaders F) — kullanıcı şimdilik BIRAKTI.

## Kullanıcının son tarama raporu (referans — her şey ✅)
20 lig, 136 takım, 1500 oyuncu, 399 maç (hepsi oynanmış), KVKK güvenli, 0 tutarsız maç,
7 üye, 1 admin. (Bunlar demo/test verisi — lansmanda 99 SQL ile silinecek.)
