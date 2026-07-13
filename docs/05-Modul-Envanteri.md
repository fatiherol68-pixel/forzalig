# 05 — Modül Envanteri

> ForzaLig'in tüm modülleri ve durumu. Durum: ✅ Tamamlandı · 🟡 Kısmen · 🔴 Yok.
> Her modül için "kanıt" = ilgili bileşen / tablo / fonksiyon.

---

## Çekirdek modüller

### ✅ Oyuncu
- **Durum:** Tamamlandı.
- **Ne var:** FIFA tarzı kart (`FifaKart` 1876), nitelik radarı (`Radar` 1911), lisans kartı
  (`LisansKarti` 4933), foto yükleme, kariyer istatistiği (maç olaylarından hesaplanır).
- **Tablolar:** `oyuncular`, `oyuncular_acik` (KVKK view), `mac_olaylari`, `mac_odulleri`.
- **Not:** Sahiplenme iki sistemli (🟡, aşağıda).

### ✅ Takım
- **Durum:** Tamamlandı.
- **Ne var:** Ad, 2 renk, logo, grup, lisans no, kaptan; takım profili (`TakimSayfa` 4591),
  kadro yönetimi (`TakimYonet`).
- **Tablolar:** `takimlar`, `oyuncu_takim`.

### ✅ Lig
- **Durum:** Tamamlandı.
- **Ne var:** Kur/düzenle/arşivle/sil, format (serbest/tek/çift/gruplu/kupa), puan sistemi,
  şehir/ülke, sponsor. `LigKur`(7818), `TurnuvaSayfa`(3250), `YonetimPaneli`(3583).
- **Tablolar:** `ligler`, `lig_haklari` (açma hakkı).
- **DB kuralı:** İlk maç oynanınca kurallar kilitlenir (trigger).

### ✅ Maç
- **Durum:** Tamamlandı.
- **Ne var:** Skor girişi (`SkorGir`), sihirbaz (`MacSihirbaz`), diziliş/kadro (`MacKurulum`),
  olaylar (gol/asist/kart/kurtarış), MVP, rating, istatistik, gazete/afiş/skor kartı.
- **Tablolar:** `maclar`, `mac_olaylari`, `mac_odulleri`, `mac_sonuc_log`, `ilk11`.

### ✅ İstatistik & Puan Durumu
- **Durum:** Tamamlandı.
- **Ne var:** Puan durumu (`PuanDurumu` 3888, `GrupTablo` 3922), kral listeleri (`KrallarSayfa`
  4140), en'ler (`TumEnler` 2530), ideal 11, kariyer.
- **Kaynak:** Tümü maç verisinden hesaplanır.

### 🟡 Playoff / Gruplar / Kupa
- **Durum:** Kısmen–Tamam.
- **Ne var:** Gruplu format + kupa bracket (`KupaBracket` 3194), penaltı galibi alanı.
- **Not:** Çalışıyor; playoff'un tüm uç senaryoları (Emin değilim: birebir test edilmedi).

---

## Transfer & pazar

### ✅ Transfer (onay zinciri)
- **Durum:** Tamamlandı.
- **Ne var:** Kaptan istek gönderir → lig yöneticisi onay/ret → oyuncu taşınır (kariyer korunur,
  eski takımlar görünür). Bekleyen istekler `YonetimPaneli`'nde.
- **Tablolar/RPC:** `transferler`, trigger `trg_transfer_uygula`, `Db.transfer*` (581–587).

### ✅ Transfer Pazarı (borsa)
- **Durum:** Tamamlandı.
- **Ne var:** Oyuncu "🔁 takım arıyorum" der → müsait listesine düşer; `PazarSayfa`(9892) şehir
  filtreli listeler.
- **Tablolar/RPC:** `oyuncular.musait*`, RPC `oyuncu_musait_ayar` / `pazar_oyuncular`.

---

## Sosyal & iletişim

### ✅ Bildirim (app-içi)
- **Durum:** Tamamlandı.
- **Ne var:** Çan + `BildirimSayfa`(9777); transfer olaylarında **DB trigger** otomatik bildirim.
- **Tablolar/RPC:** `bildirimler`, `bildirim_yolla`, `trg_transfer_bildirim`.

### ✅ Sohbet (Realtime)
- **Durum:** Tamamlandı.
- **Ne var:** Lig geneli + takım içi kanallar, anlık mesaj (`SohbetSayfa` 9831).
- **Tablo:** `sohbet_mesajlari` (Supabase Realtime yayınına ekli).

### 🟡 Push Bildirim (telefon)
- **Durum:** Altyapı hazır, KAPALI.
- **Ne var:** Service worker push/notificationclick, `push_abonelikleri` tablosu, `PushAyar`(7681),
  `supabase/functions/push-gonder` Edge Function.
- **Eksik:** `window.__FL_VAPID_PUBLIC` boş → VAPID anahtarı üretilip Edge Function deploy edilmeli.

### ✅ Arama & Keşfet
- **Durum:** Tamamlandı.
- **Ne var:** Üstte arama overlay (oyuncu/takım/lig), `Kesfet`(2354) açık ligler.

### ✅ Takip & Popülerlik
- **Durum:** Tamamlandı.
- **Tablo:** `takipler`, `Db.populer` (523).

### ✅ Paylaşım
- **Durum:** Tamamlandı.
- **Ne var:** Lig `?lig=` linkiyle salt-okunur paylaşım, skor kartı görseli, çevrimdışı cache.
- **Tablo:** `paylasilan_ligler` (eski sistem).

---

## Kimlik & yönetim

### ✅ Profil / Auth
- **Durum:** Tamamlandı (Google + e-posta). Detay: `07-Auth.md`.

### 🟡 Kariyer Sahiplenme
- **Durum:** Çalışıyor ama **iki paralel sistem** (kafa karıştırıcı).
  - Eski "blob": `sahiplenmeler` tablosu, kullanıcı beyanı (zayıf).
  - Yeni ilişkisel: `oyuncu_sahiplen` RPC, sunucu doğrulamalı (güçlü).
- **Öneri:** Teke indirilmeli (V2).

### ✅ Admin Panel
- **Durum:** Tamamlandı.
- **Ne var:** Üyeler, lig hakkı verme, tüm transferler, audit log, 7 günlük aktif kullanıcı grafiği,
  sistem sağlığı. `AdminPanel`(9207).
- **Tablolar:** `adminler`, `lig_haklari`, `islem_log`, `olay_log`.

---

## Altyapı / DevOps

| Modül | Durum | Not |
|------|:----:|-----|
| PWA (ana ekrana ekle, çevrimdışı) | ✅ | manifest.json + sw.js. |
| Otomatik test (CI) | ✅ | `.github/workflows/test.yml` + `build/smoke.mjs`. |
| Denetim raporu (Inspector) | ✅ | `build/inspector.js` + `inspector.yml` (statik). |
| Otomatik yedekleme | 🟡 | `yedek.yml` var; Supabase secret'ları girilmeli. |
| Hata izleme (Sentry) | ✅ | Tembel yüklenir, sadece JS hataları. |

---

## Henüz OLMAYAN modüller (🔴)

| Modül | Durum | Not |
|------|:----:|-----|
| Hakem sistemi | 🔴 | `maclar.hakem` alanı var, modül yok. |
| Teknik direktör sistemi | 🔴 | — |
| Genel reyting/derece sistemi | 🟡/🔴 | Maç bazlı rating var; kümülatif reyting yok. |
| Ödeme / aidat takibi | 🔴 | — |
| Maça katılım/yoklama ekranı | 🟡 | `katilim` tablosu var, UI zayıf. |
| Çoklu dil | 🔴 | Sadece Türkçe. |
| Sakatlık/ceza takibi | 🔴 | `oyuncular.saglik` alanı var, modül yok. |

*(Bu belge, `docs/01-Genel-Bakis.md`'deki özet tablonun modül-modül detaylandırılmış hâlidir.)*
