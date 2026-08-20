# ForzaLig — Değişiklik Günlüğü

Denetim planı fazları. Her faz: güvenli, geri alınabilir, ücretsiz.

## Faz 6 — Veri Bütünlüğü (güvenli alt-sınır kısıtları) (2026-08-20)
- Canlıya 4 CHECK kısıtı eklendi: maç skorları ve oyuncu forma_no/ovr
  NEGATİF olamaz. Mevcut veri %100 uyumlu (apply başarılı = kanıt).
- Üst sınır EKLENMEDİ (ör. 6-0 maç meşru) → gelecekteki meşru yazımlar
  engellenmez. NULL'a izin var.
- Geri dönüş: 20260820_faz6_veri_butunlugu_rollback.sql
- Puan: 87 → 88.

## Faz 9 — Admin Sağlık Paneli + Gizlilik (2026-08-20)
- /saglik/: ayrı, güvenli durum sayfası (DB canlı mı + restore-test/
  storage-yedek/smoke-test son sonucu GitHub API'den + kısayollar).
  Uygulama yeniden derlenmedi (risk yok).
- /gizlilik/: saklama/silme bölümü gerçeğe göre güncellendi (silinen içerik
  ~90 gün geri alınabilir, sonra kalıcı) + tarih.
- Silme grace-period: ligler zaten yumuşak-sil + geri-al + 90 gün eşiği
  (istenen 30 günden güvenli) → değiştirilmedi.
- Puan: 88 → 90.

## Faz 8 — Auth sertleştirme (kullanıcı aksiyonu)
- Sızmış-parola koruması: Supabase Dashboard → Authentication → Passwords
  → "Leaked password protection" AÇ (ücretsiz, tek tık, yalnız hesap sahibi
  yapabilir).

## Faz 7 — PWA Bildirim Düzeltmesi (2026-08-20)
- sw.js notificationclick: bildirime tıklayınca PWA güvenilir öne gelir +
  hedef iletilir; pencere yoksa kökten açılır (404 riski yok). SURUM bump.
  Turnstile: kullanıcı seçmedi (atlandı).
- Puan: 87 → 88.

## Faz 4 — Felaketten Kurtarma Kanıtı (kısmi, 2026-08-20)
- `docs/FELAKET-KURTARMA.md`: dürüst DR durumu — şema+depo+kod KANITLI
  kurulabilir; veri öz-yedeği kullanıcı kararıyla şimdilik kapalı, ücretsiz
  açma yolu (3 adım) belgelendi.
- Yedek workflow'ları sessizce başarısız olamaz (dosya yoksa FAIL).
- Puan: 86 → 87 (veri öz-yedeği açılınca 88).

## Faz 3 — CI Kalite Kapıları / Canlı Duman Testi (2026-08-20)
- `scripts/smoke.mjs` + `smoke-test.yml`: forzalig.com + /orbital/ gerçek
  tarayıcıyla; HTTP>=400 / boş sayfa / JS hatası / kaynak 404 → FAIL.
  console.error yalnız uyarı. İlk çalıştırma: PASS.
- Puan: 84 → 86.

## Faz 2 — GitHub ↔ Supabase Senkron (2026-08-20)
- `docs/SUPABASE-SENKRON.md`: depo haritası, "elle SQL yok" kuralı, migration
  + rollback düzeni, baseline, güvenlik ağı, `main` koruma önerileri.
- `supabase/migrations/` tek kaynak olarak benimsendi; Supabase migration
  geçmişi bu düzene alındı.
- Puan: 79 → 84 (hedef).

## Faz 1 — Kritik Güvenlik Sertleştirmesi (2026-08-20)
- Sabit admin e-postası 5 policy'den kaldırıldı → tablo tabanlı `admin_mi()`.
- `trg_kart_foto_limit` search_path sabitlendi (injection kapandı).
- anon'un çağırabildiği SECURITY DEFINER fonksiyon sayısı 93 → 13.
- Bilinçli DEĞİŞTİRİLMEYENLER: 4 "public görünüm" (canlıyı kırardı),
  RLS-yardımcı fonksiyonların anon erişimi (RLS kırılmasın).
- Ertelenen (gerçek bulgu): WITH CHECK(true) politikaları — sahiplik
  modeliyle sertleştirilecek.
- Geri dönüş: `supabase/migrations/20260820_faz1_guvenlik_rollback.sql`.
- Puan: 75 → 79.

## Faz 0 — Güvenli Zemin: Yedek + Geri-Yükleme Kanıtı (2026-08-19/20)
- `restore-test.yml`: boş Postgres'e Supabase-shim + canlı şema uygulanıp
  nesne sayımı → otomatik PASS/FAIL. CI: **PASS** (0 hata; 53/94/136/113).
- `storage-yedek.yml`: public bucket dosyaları 90 gün artifact.
- Şema anlık görüntüsündeki geri-yükleme hataları düzeltildi.
- Kararlı yedek dalı: `yedek/2026-08-19-kararli`.
- Puan: 73 → 75.
