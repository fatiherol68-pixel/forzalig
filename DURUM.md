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

**PARÇA 1.5 — "Her takımda 2 renk zorunlu" + admin logo/renk UI: BİTTİ (feature dalında).**
- `ikinciRenk(renk)` helper: 2. renk seçilmezse ana renkten türet (koyu ton / renk koyuysa açık).
- `yeniTakim` renk2=ikinciRenk(renk) varsayılan. `svgAmblem(ad,renk,boy,logo,renk2)` 2. rengi kullanır
  (yoksa türetir → amblem HER ZAMAN 2 renkli). ~25 Logo çağrısına renk2 perl ile eklendi.
- `takimDuzenle` + `Db.takimGuncelle` artık renk2 + logo kaydeder (yerel + ilişkisel).
- Admin lig Yönet sekmesi takım satırı: ana renk + **2. renk seçici** + **logo yükle (📷)** eklendi.
- Offline smoke: 0 hata, derleme temiz.

**PARÇA 2 — Davet zinciri (kullanıcı SQL çalıştıracak + ben client yazacağım):**
- SQL hazır: `supabase/12_davet_foto_renk.sql` — RPC'ler genişletildi:
  `takim_daveti_kullan(token,ad,renk,renk2,logo)` → jsonb {takim_id, oyuncu_token} (otomatik oyuncu
  linki üretir!). `oyuncu_daveti_kullan(token,ad,no,poz,foto,dogum,boy,kilo,uyruk,ayak)`.
  Eski imzalar drop edildi. auth.uid() gerekli → davet kullanan GİRİŞ YAPMIŞ olmalı (Google zorunlu ✓).
- CLIENT: `DavetKatil` yeniden yazıldı: Google giriş kapısı + kaptan formu (ad + logo yükle +
  2 renk seçici zorunlu) + oyuncu formu (foto yükle + mevki seçici + forma no + açılır profil:
  doğum/boy/kilo/uyruk/ayak). Kaptan kurunca otomatik oyuncu davet linki/QR ekranı (kopyala).
  Db.takimDavetiKullan/oyuncuDavetiKullan yeni imzalara güncellendi. `fotoYukle` ile foto/logo.
  DOĞRULANDI: sahte-supabase harness'te iki form da 0 hata render (ekran görüntüsü kullanıcıya gitti).
**PARÇA 2: BİTTİ (feature dalında). Kalan: PARÇA 3 + uçtan uca canlı test + main deploy.**

**PARÇA 3 — admin oyuncu foto/bilgi düzenleme: BİTTİ (feature dalında).**
- Mevcut `BilgiDuzeltModal`'a (adminMod ile açılan) **fotoğraf bölümü** eklendi: yükle/değiştir/kaldır
  (fotoYukle ile) + canlı avatar önizleme. `acBilgi` bd'ye foto ekler, `kaydetBilgi` o.foto kaydeder.
  Derleme temiz, 0 boot hatası. (Not: relational persist mevcut modal davranışıyla aynı — isim edit
  nasıl kalıcı oluyorsa foto da öyle; ayrı bir relational sync gerekmiyorsa sonra bakılır.)

**TÜM PARÇALAR (1, 1.5, 2, 3) BİTTİ + DEPLOY EDİLDİ (main e16ed04, canlı).**
Client uçtan uca sürülerek test edildi: 9/9 (kaptan takım kur→otomatik oyuncu linki; oyuncu foto+profil→
katıl; admin foto düzenle). SQL 11+12 kullanıcı çalıştırdı. KALAN: sadece CANLI sunucu davranışı
(gerçek Google OAuth redirect, Storage'a gerçek foto yükleme, RLS) — kullanıcı canlıda test edecek.
GERİ ALMA gerekirse: main'i 98bf809'a al (bu deploy öncesi son sağlam commit).
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

## BU OTURUMDA YAPILANLAR — 6. tur (9 Tem 2026, PWA Faz 1+2) ✅ DEPLOY EDİLDİ
Mobil denetim (40 madde) → 4 fazlı yol haritası çıkarıldı. Faz 1+2 birlikte yapıldı ve main'e alındı:
- **İkonlar**: `icons/ikon.svg` (koyu zemin + neon yeşil top + FORZA) → Chromium ile PNG'ye
  çevrildi (192/512/maskable-512/apple-touch-180 + apple-splash-1170x2532). Yeniden üretmek:
  scratchpad `rasterize.js` (playwright-core + /opt/pw-browsers/chromium).
- **manifest.json**: standalone, portrait, #070B12, ikonlar. Ana ekrana ekle artık markalı ikon.
- **sw.js (service worker)**: HTML=önce ağ, CDN+ikonlar=önce önbellek, Supabase'e karışmaz.
  Yeni sürüm bulununca saf-JS "✨ Yeni sürüm hazır — Yenile" toast'ı (index.html head'de kayıt scripti).
  `derle.js` her derlemede `FL_SW_SURUM`'u commit+zaman damgasıyla değiştirir → `build/sw.compiled.js`.
  Deploy'da `sw.compiled.js` → main'de `sw.js` olarak kopyalanır. (İlk seferde .replace tek geçiş
  değiştirdi — .split/join'e çevrildi.)
- **Apple meta**: apple-mobile-web-app-capable, black-translucent status bar, apple-touch-icon, splash.
- **Tarayıcı geçmişi**: `git()` artık `history.pushState({fz:1})` ekliyor; `popstate` → iç yığından
  `geriIc()`. Uygulamanın ← butonu history ile senkron. Telefonun geri tuşu uygulamadan atmıyor
  (offline Playwright testiyle doğrulandı: Keşfet→lig→geri tuşu→Keşfet, uygulama içinde kaldı).
- **Safe-area**: standalone modda `#root{padding-top:env(safe-area-inset-top)}` (çentik).
- **Faz 2 cila**: `.fl-skel` iskelet yükleyici (paylaşılan lig yüklenirken), `titret()` haptik
  (git/menuGit), `touch-action:manipulation`, alt menü butonları ≥48px, 600–819px tablet düzeni.
- **Kaza + temizlik**: deploy sırasında `build/node_modules` yanlışlıkla main'e girdi → hemen
  `git rm -r build` + `.gitignore` ile temizlendi; Pages build success (5aac9a1).
- Analiz artifact'ları: denetim/yol haritası/karne/tasarım (Claude artifacts, linkler sohbette).

## SIRADAKİ: Faz 3 (sosyal/ağ: paylaşım kartları, bildirim, çevrimdışı) ve Faz 4 (büyüme) — kullanıcı isterse.
Kullanıcı canlıda test etmeli: ana ekrana ekle (markalı ikon), tam ekran açılış, geri tuşu, yeni sürüm toast'ı.

## BU OTURUMDA YAPILANLAR — 7. tur (Faz 3: sosyal/paylaşım + çevrimdışı) ✅ DEPLOY EDİLDİ
- **Maç skor kartı → GERÇEK görsel**: `skorKartiCanvas(m,turnuva)` 1080×1080 markalı PNG üretir
  (koyu zemin + neon yeşil, takım amblemleri/logoları, büyük skor, golcüler+dakika, MVP, ForzaLig).
  `skorKartiPaylas()`: Web Share API (files) varsa doğrudan WhatsApp/Instagram'a dosya yollar;
  desteklenmezse PNG indirir. `SkorKart` sayfası artık canvas'tan üretilen gerçek görsel önizleme +
  "📲 Paylaş" / "⬇️ İndir" butonları gösteriyor (eski "ekran görüntüsü al" metni ve FATIHPRO markası kalktı).
  Takım logoları `crossOrigin="anonymous"` ile yüklenir; taint/hata olursa harf amblemine düşer (export kırılmaz).
  Offline Playwright ile doğrulandı: PNG üretiliyor (skorkart_render.png), 0 sayfa hatası.
- **Çevrimdışı lig önbelleği**: paylaşılan lig başarıyla çekilince `localStorage['forzalig_lig_cache_<slug>']`'e
  yazılır; internet gidince Paylas.getir null dönerse önbellekten açılır ("Çevrimdışı — son kayıtlı görünüm").
  Periyodik yenileme (25sn) de önbelleği güncel tutar.
- **Bildirimler** (Faz 3'ün 3. maddesi): iOS PWA push kısıtlı olduğundan bu turda YAPILMADI — ayrı araştırma ister.

## SIRADAKİ: Faz 4 (büyüme: onboarding turu, çoklu lig geçişi, performans rötuşu) — kullanıcı isterse.

## BU OTURUMDA YAPILANLAR — 8. tur (Faz 4: büyüme) ✅ DEPLOY EDİLDİ
- **İlk giriş rehberi (onboarding)**: `Rehber({T,bitir})` — 4 adımlı tur (Ana/Keşfet/Paylaş/Profil),
  alt menüyü yeşil halkayla vurgular, ilk girişte bir kez (`localStorage['forzalig_rehber_v1']`).
  App'te `rehberGoster` state + `useEffect([kapi])` tetikler (kapı null olunca). Ayarlar'a
  "🧭 Uygulama turunu göster" butonu eklendi (`rehberBaslat` prop) → tekrar açılır.
- **Hızlı lig geçişi**: AnaSayfa'da `turnuvalar.length>1` ise üstte yatay chip şeridi (logo+ad),
  aktif lig vurgulu; chip'e dokununca `git({sayfa:"turnuva",turnuva:lg})`.
- **Perf rötuşu**: svgAvatar/svgAmblem `<img>`'lerine `decoding="async"`.
- Offline Playwright ile 7/7 doğrulandı (rehber açıldı/kapandı/flag, şerit render+tıklama, Ayarlar butonu, 0 hata).

## DURUM: Faz 1-2-3-4 TAMAM ve canlıda. Mobil denetimdeki 40 maddenin çoğu kapandı.
Kalan opsiyoneller: iOS PWA push bildirimleri (araştırma ister), securityheaders (Cloudflare), Supabase custom domain.

## YOL HARİTASI KARARI (10 Tem 2026) — kullanıcı önceliklendirdi
Sıra: **1) Transfer  2) Sohbet  3) Bildirim** çekirdek özellikleri bitecek → SONRA Review Tool geliştirilecek.

### PARK EDİLDİ (onaylı, sonra yapılacak): "ForzaLig Inspector / Review Tool"
Kullanıcı mimariyi ONAYLADI, uygulamayı erteledi. Uygulanacak mimari (CTO tasarımı):
- **İki katman**:
  - **Katman A — "ForzaLig Inspector" (ASIL rapor, CI job'ı)**: GitHub Actions "Run workflow"
    butonuyla çalışır (teknik bilgi gerektirmez). Yapar: (1) `index.html` statik parse → route/
    component envanteri + ölü kod/kullanılmayan görsel tespiti, (2) Playwright ile her sayfanın
    iPhone/Android/tablet ekran görüntüsü, (3) Lighthouse mobil + axe-core, (4) build manifesti
    (git commit/tarih/boyut/SW ver — derle.js genişletilir), (5) `supabase/*.sql`'den RLS/RPC/tablo
    envanteri (canlı DB'ye DOKUNMADAN). Çıktı: **ZIP** = `rapor.html` (insan) + `rapor.md` (AI'ya
    verilecek TEK dosya — metin öncelikli, token-verimli) + `rapor.json` + `/ekranlar/`.
  - **Katman B — "Canlı Snapshot" (gizli kısayol, İKİNCİL)**: sadece canlı üretim verisini çeker
    (DB'de kaç lig/takım/oyuncu/maç, o anki rol, PWA/SW durumu, oturum perf). Süper Admin kısayolu →
    sunucu doğrulaması → JSON iner.
- **Güvenlik**: Katman A kodu kullanıcıya HİÇ gitmez (CI'da yaşar = sıfır saldırı yüzeyi). Katman B
  için 3 kapı: (1) yeni `rpc('gelistirici_yetkisi')` SECURITY DEFINER — AYRI `super_admin` allowlist
  (mevcut `adminler` YETMEZ, çünkü "normal admin göremeyecek"), (2) localStorage 'developer mode'
  bayrağı, (3) yetki yoksa SESSİZ (hiçbir tepki yok). Kısayol gizliliği = görünmezlik, güvenlik değil;
  asıl kilit sunucudaki RPC.
- **Puanlama felsefesi**: ÖLÇÜLEN (perf/SEO/a11y/PWA) araçtan gerçek sayı; YARGI (UI/UX, kod kalitesi,
  DB, güvenlik) AI/CTO doldurur — araç subjektif puan UYDURMAZ.
- **Rollout**: MVP = statik rapor.md/json (ekran görüntüsüz, %60 değer) → screenshots+html → Lighthouse/axe → Katman B → Actions butonu.
- Karar bekleyen: süper admin tek kişi mi (muhtemelen sadece kullanıcının user id'i) / Katman B şart mı.

## TRANSFER — KİLİTLENEN SPEC (kullanıcı kararı, 10 Tem 2026)
- **Onay zinciri: LİG YÖNETİCİSİ SON ONAY.** Kaptan transfer isteği başlatabilir → istek "beklemede" →
  lig yöneticisi onaylayınca transfer olur, reddederse OLMAZ. (Kullanıcı gerekçesi: "gittiği takım sorun
  çıkarabilir, ligden çıkarım diye bilir" → kontrol lig yöneticisinde olmalı.) Lig yöneticisi kendi
  başlatırsa anında geçer (zaten son merci).
- **İstatistik: KARİYER TOPLAMI oyuncuyla taşınır** (profil/kart lifetime gol/asist birikir).
  ÖNEMLİ NOT: lig içi tablolar (gol kralı vb.) zaten maç olaylarından (m.olaylar) hesaplandığı için
  bundan ETKİLENMEZ — league standings bozulmaz. Kariyer toplamı sadece oyuncu KARTINDA gösterilir.
- **Geçmiş**: oyuncu kartında "eski takımlar" listesi görünür.
- Mevcut iskelet: `transferEt`, "Transfer et"/"Bu oyuncu benim" butonları var → bu spec'e göre yeniden akış.
- Taslak tasarım artifact: forzalig-cekirdek.html (öncesi/sonrası telefon ekranları).

## ÇEKİRDEK YAPIM SIRASI (kilit): 1) Transfer → 2) App-içi bildirim → 3) Sohbet(Realtime) → 4) Push(iOS 16.4+ PWA)
