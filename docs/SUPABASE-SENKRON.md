# ForzaLig — GitHub ↔ Supabase Senkron Düzeni (Faz 2)

Bu belge, veritabanı (Supabase) ve kod (GitHub) değişikliklerinin **tek
kaynaktan, izlenebilir ve geri alınabilir** şekilde yapılmasını sağlar.
Amaç: "Supabase'de elle SQL çalıştırıldı ama GitHub bilmiyor" durumunu bitirmek.

## 1) Depo haritası (hangi dal ne işe yarar)

| Dal | Rolü |
|---|---|
| `main` | **Yayın (production).** forzalig.com buradan yayınlanır (GitHub Pages, `CNAME=forzalig.com`). Derlenmiş Vite çıktısı (`index.html`, `assets/`, `sw.js`) burada durur. |
| `claude/forzalig-durum-karti-uel9ed` | **Uygulama kaynağı.** ~18.000 satırlık React (tek babel bloğu). Vite derlemesi buradan üretilir. |
| `orbital/` (main içinde) | Herkese açık **anasayfa** (`/orbital/`), canlı Supabase okur (yalnız tablo/görünüm). |
| `yedek/2026-08-19-kararli` | **Kararlı yedek** (geri dönüş noktası). |
| `backup/*` | Eski dönüm noktaları. |

Yayın akışı: kaynak dal → Vite derle → `main`'e derlenmiş çıktı → GitHub Pages
otomatik yayınlar.

## 2) Veritabanı değişikliği KURALI — "Elle SQL yok"

> **Kural:** Supabase şemasında (tablo, policy, fonksiyon, index, grant)
> her kalıcı değişiklik, önce `supabase/migrations/` altında bir **migration
> dosyası** olarak yazılır, sonra uygulanır. Dashboard'da/SQL Editor'de
> **elle kalıcı değişiklik yapılmaz.** (Okuma/keşif sorguları serbesttir.)

Neden: aksi halde canlı veritabanı GitHub'daki kayıttan sapar; bir sorun
olduğunda neyin değiştiğini ve nasıl geri alınacağını kimse bilemez.

### Dosya adı düzeni
```
supabase/migrations/YYYYMMDD_kisa_ad.sql            # ileri (değişiklik)
supabase/migrations/YYYYMMDD_kisa_ad_rollback.sql   # geri dönüş (rollback)
```
Her ileri migration'ın bir **rollback** eşi olur.

### Uygulama (Claude yapar)
- Claude, migration'ı Supabase'e `apply_migration` ile uygular; Supabase
  `list_migrations` geçmişine düşer.
- Uygulandıktan sonra migration dosyası `main`'e commit + push edilir.

### Geri dönüş (sen de yapabilirsin — teknik bilgi gerekmez)
Bir sorun olursa: **Supabase → SQL Editor → New Query →** ilgili
`*_rollback.sql` dosyasının içeriğini yapıştır → **RUN.** Eski durum geri gelir.

## 3) Baseline (başlangıç anlık görüntüsü)

- Canlı şemanın tam anlık görüntüsü: `supabase/restore/_canli_schema_2026-08-19.sql`
- Bu dosya "sıfırdan kurulabilir" olarak **restore-test** ile her hafta
  otomatik doğrulanır (bkz. `.github/workflows/restore-test.yml`).
- 2026-08-20'den itibaren tüm değişiklikler `supabase/migrations/` altında.

## 4) Güvenlik ağı (ücretsiz otomasyon)

| Workflow | Ne yapar | Ne zaman |
|---|---|---|
| `restore-test.yml` | Yedeğin gerçekten kurulabildiğini kanıtlar (PASS/FAIL) | Haftalık + elle |
| `storage-yedek.yml` | Foto/depo dosyalarını 90 gün saklanan artifact yapar | Aylık + elle |

## 5) Önerilen `main` koruması (senin ayarlaman için, ücretsiz)

GitHub → Settings → Branches → Add rule (`main`):
- "Require a pull request before merging" — kapalı bırakılabilir (tek kişilik
  yayın akışı Pages'i bozmasın diye), ama açarsan güvenlik artar.
- "Require status checks to pass" → `restore-test` seçilebilir.
- "Do not allow force pushes" — **açık** (geçmişi koru).

> Not: Sıkı koruma yayın akışını (Pages) yavaşlatabilir; bu yüzden zorunlu
> tutulmadı, öneri olarak bırakıldı.
