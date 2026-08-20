# ForzaLig — Felaket Kurtarma (DR) Durumu

Soru: **"Supabase silinse / bozulsa her şeyi geri kurabilir miyiz?"**
Bu belge, bugün elimizde NE olduğunu ve NE eksik olduğunu dürüstçe söyler.
(Hepsi ücretsiz katmanda geçerlidir.)

## Bugün KANITLI olan (ücretsiz)

| Parça | Durum | Kanıt |
|---|---|---|
| **Şema** (tablo, policy, fonksiyon, index, trigger) | ✅ Geri kurulabilir | `restore-test` her hafta boş Postgres'e kurar → PASS (0 hata; 53/94/136/113) |
| **Depo/Fotoğraflar** (public `fotolar` bucket) | ✅ Yedekleniyor | `storage-yedek` tüm dosyaları 90 gün artifact yapar; dosya yoksa **FAIL** verir |
| **Kod** (site + uygulama) | ✅ GitHub'da | `main` (yayın) + kaynak dal + `yedek/2026-08-19-kararli` |
| **Migration geçmişi** | ✅ Tek kaynak | `supabase/migrations/` + baseline anlık görüntü |

Yani: **yapı + dosyalar + kod** bugün güvende ve kurulabilir olduğu KANITLANDI.

## Bugün EKSİK olan (bilinçli, kullanıcı kararı)

| Parça | Durum | Neden |
|---|---|---|
| **Veri satırları** (ligler, oyuncular, maçlar, mesajlar…) | ⚠️ Otomatik öz-yedek YOK | Korumalı veriyi okumak için bir servis anahtarı (gizli) gerekir; kullanıcı şimdilik eklememeyi seçti (2026-08-20) |

Şu an veri için Supabase'in kendi altyapısına güveniliyor. Ücretsiz katmanda
kendi elinle noktadan-geri-yükleme (PITR) sınırlıdır.

### Ücretsiz tam-veri yedeğini AÇMAK (ileride, tek seferlik 3 adım)
1. Supabase → **Settings → API** → `service_role` anahtarını kopyala.
2. GitHub → repo **Settings → Secrets and variables → Actions → New secret**
   → ad: `SB_SERVICE_KEY`, değer: kopyaladığın anahtar → Save.
3. Bana "ekledim" de → gece yarısı tüm tabloları JSON olarak yedekleyen
   ücretsiz bir workflow kurarım (90 gün artifact). O an DR kanıtı TAM olur.

> Not: `service_role` anahtarı güçlüdür; yalnız GitHub **Secret** olarak
> saklanır, koda/siteye ASLA yazılmaz.

## Kurtarma senaryosu (bugün, elle)
1. Yeni Supabase projesi aç (ücretsiz).
2. `supabase/restore/supabase-shim.sql` + `_canli_schema_2026-08-19.sql` +
   `supabase/migrations/*.sql` (rollback hariç) uygula → şema hazır.
3. `storage-yedek` artifact'ından fotoğrafları yeni bucket'a yükle.
4. (Veri yedeği açıksa) veri JSON'larını içeri al.
5. Site anahtarlarını (URL + publishable key) yeni projeye göre güncelle.

## RPO / RTO (ücretsiz, bugünkü gerçek)
- **Şema/kod:** RPO ~0 (her değişiklik commit) — RTO dakikalar.
- **Fotoğraf:** RPO ≤ 30 gün (aylık) — istenirse sıklaştırılır (ücretsiz).
- **Veri:** öz-yedek kapalı → RPO Supabase'e bağlı. (Yukarıdaki 3 adımla ücretsiz kapatılır.)
