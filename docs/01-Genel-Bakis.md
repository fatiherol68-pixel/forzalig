# 01 — Genel Bakış

> Bu belge ForzaLig'in bugün geldiği noktayı özetler. Amaç: kod görmeden,
> okuyarak "elimizde ne var?" sorusuna net cevap vermek.

---

## ForzaLig nedir?

ForzaLig, **halı saha (amatör) futbol liglerini yöneten** bir web uygulamasıdır.
Bir lig yöneticisi ligini kurar, takımları ve oyuncuları girer, maçları işler;
oyuncular kendi kariyer kartlarını sahiplenir; herkes puan durumunu, kral listelerini,
oyuncu kartlarını görür. Ayrıca telefona kurulabilen bir uygulama (PWA) gibi çalışır.

**Teknik özet (basitçe):**
- **Tek dosya uygulama:** Bütün arayüz tek bir `index.html` dosyasında (~10.820 satır).
- **Çatı:** React 18 (CDN'den), Babel ile derleniyor.
- **Veritabanı + giriş:** Supabase (PostgreSQL + Google/e-posta girişi + dosya deposu).
- **Yayın:** GitHub Pages, özel alan adı **forzalig.com**.
- **PWA:** Ana ekrana eklenebilir, çevrimdışı çalışır, bildirim altyapısı var.

---

## Bugün hangi seviyede?

**Yayında ve gerçek kullanıma açık bir V1 ürünü.** Çekirdek akış (lig kur → takım/oyuncu →
maç → istatistik → paylaş) uçtan uca çalışıyor. Üstüne sosyal katman (bildirim, sohbet,
transfer pazarı) ve yönetim araçları (admin panel, otomatik test, denetim raporu) eklendi.

Olgunluk: **"çalışan, canlı, ama güvenlik ve mimari açıdan gözden geçirilmesi gereken" bir V1.**
En önemli teknik borç, güvenliğin tamamen sunucu (RLS) kurallarına bağlı olması ve bazı eski
tabloların bu kural setinde net görünmemesi (bkz. `08-Guvenlik.md`).

---

## Modüller — durum tablosu

Durum: ✅ Tamamlandı · 🟡 Kısmen · 🔴 Yok/başlamadı

| Modül | Durum | Not |
|------|:----:|-----|
| **Kimlik & Giriş (Auth)** | ✅ | Google + e-posta girişi. `HERKESE_ACIK=true` → herkes girebilir. |
| **Lig yönetimi** | ✅ | Kur, düzenle, arşivle, sil; format: serbest/tek/çift/gruplu/kupa. |
| **Takım yönetimi** | ✅ | Ad, 2 renk, logo, kaptan; davet linkiyle kaptan kendi takımını kurar. |
| **Oyuncu kartları** | ✅ | FIFA tarzı kart, nitelikler, foto, lisans kartı. |
| **Maç işleme** | ✅ | Skor girişi, sihirbaz, olaylar (gol/asist/kart), MVP, rating, diziliş. |
| **İstatistik & kral listeleri** | ✅ | Gol/asist/kurtarış kralları, "en'ler", ideal 11, kariyer. |
| **Puan durumu / fikstür** | ✅ | Tek/çift devre, gruplu, kupa bracket. |
| **Kariyer sahiplenme** | 🟡 | İki sistem yan yana: eski "blob" (beyan) + yeni ilişkisel (RPC). Kafa karıştırıcı. |
| **Transfer (onaylı)** | ✅ | Kaptan istek → lig yöneticisi onay → oyuncu taşınır (kariyer korunur). |
| **Transfer pazarı** | ✅ | "Takım arıyorum" → müsait oyuncular listesi (şehir filtreli). |
| **App-içi bildirim** | ✅ | Çan + bildirim merkezi; transfer olaylarında otomatik bildirim. |
| **Sohbet (Realtime)** | ✅ | Lig geneli + takım içi kanallar, anlık mesaj. |
| **Push bildirim (telefon)** | 🟡 | Altyapı hazır (SW + tablo + Edge Function); **VAPID anahtarı girilmedi** → kapalı. |
| **Paylaşım / keşfet** | ✅ | Lig `?lig=` linkiyle salt-okunur paylaşılır; skor kartı görseli. |
| **Takip & popülerlik** | ✅ | Lig/takım/oyuncu takip, en popülerler. |
| **Admin panel** | ✅ | Üyeler, lig hakkı, transfer onay, audit log, analitik, sistem sağlığı. |
| **PWA / çevrimdışı** | ✅ | manifest, service worker, ana ekrana ekle, çevrimdışı cache. |
| **Otomatik test (CI)** | ✅ | Her push'ta derle + tarayıcı duman testi (GitHub Actions). |
| **Denetim raporu (Inspector)** | ✅ | Statik analiz raporu (GitHub Actions, elle/haftalık). |
| **Otomatik yedekleme** | 🟡 | CI hazır; **Supabase secret'ları girilmemiş** → çalışmıyor. |
| **Katılım/yoklama (maça geliyorum)** | 🟡 | Tablo (`katilim`) + veri katmanı var; net bir ekran akışı zayıf. |
| **Hakem sistemi** | 🔴 | Yok. (`maclar.hakem` alanı var ama modül yok.) |
| **Teknik direktör sistemi** | 🔴 | Yok. |
| **Reyting/derece sistemi** | 🟡 | Maç bazlı rating var; genel/sıralı reyting sistemi yok. |
| **Ödeme / aidat takibi** | 🔴 | Yok. |
| **Çoklu dil** | 🔴 | Yok (sadece Türkçe). |

---

## En önemli 3 gözlem (CTO notu)

1. **Güvenlik tamamen RLS'e bağlı.** Uygulama arayüzü butonları gizler ama gerçek koruma
   yalnızca Supabase sunucu kurallarıdır (RLS). Bu **doğru bir mimari tercih** — ancak
   RLS'in her tabloda eksiksiz ve doğru olması hayati. Bazı **eski tablolarda** bu doğrulama
   yapılamadı (bkz. `08-Guvenlik.md`).

2. **İki paralel "sahiplenme" sistemi var.** Eski "blob" (kullanıcı beyanı) + yeni ilişkisel
   (RPC ile sunucu doğrulamalı). Bu ikilik hem kafa karıştırıyor hem de tutarsızlık riski taşıyor.
   İleride teke indirilmeli.

3. **Tek dosya, 10.800+ satır.** Hızlı geliştirmeyi sağladı ama büyüdükçe bakım zorlaşıyor.
   Bu bir "acil sorun" değil, ama V2'de modülleştirme düşünülmeli.

---

## Diğer belgeler

| Belge | İçerik |
|------|--------|
| `02-Sistem-Haritasi.md` | Kullanıcıdan admine tüm akış, uçtan uca. |
| `03-Veritabani.md` | Tüm tablolar, ilişkiler, tetikleyiciler, RPC'ler. |
| `04-Ekranlar.md` | Uygulamadaki her ekran, ne yaptığı, eksikleri. |
| `05-Modul-Envanteri.md` | Modül modül durum (✅/🟡/🔴). |
| `06-Yetki-Sistemi.md` | Kim ne yapabiliyor (rol rol). |
| `07-Auth.md` | Giriş, profil, kullanıcı↔oyuncu bağı. |
| `08-Guvenlik.md` | Güvenlik bulguları ve riskler (kanıtlı). |
