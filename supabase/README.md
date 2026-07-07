# ForzaLig — Veritabanı Kurulumu (Faz 1 · İlişkisel Yapı)

Bu klasör, ForzaLig'in yeni **ilişkisel veritabanını** kurar. Mevcut canlı
tabloları (`kullanici_veri`, `paylasilan_ligler`...) **bozmaz** — yeni tablolar
onların yanına eklenir. Yani uygulama çalışmaya devam eder, arka planda yeni
yapı hazırlanır.

## Nasıl çalıştırılır (senin yapacağın tek şey)

1. **Supabase** → projen (`crkestykdsnmfcmamxav`) → sol menüden **SQL Editor**.
2. Aşağıdaki dosyaları **sırayla** aç, içeriğini kopyala, yapıştır, **Run** de:

   | Sıra | Dosya | Ne yapar |
   |------|-------|----------|
   | 1 | `01_sema.sql` | Tabloları kurar (ligler, takımlar, oyuncular, maçlar, transfer...) |
   | 2 | `02_guvenlik.sql` | Kim ne yapabilir kurallarını (RLS) kurar |
   | 3 | `03_tetikleyiciler.sql` | Otomatik kuralları kurar (kilitleme, log, hak sayacı) |
   | 4 | `04_ilk_admin.sql` | Seni Süper Admin yapar |

3. Her dosyada **"Success. No rows returned"** görürsen o adım tamamdır.

> Sıra önemli: önce 01, sonra 02, 03, 04. Çünkü sonrakiler öncekilere dayanır.

## Ne kuruldu?

- **10 tablo**: kimlik/yetki, lig yapısı, maç, oyuncu hareketi (transfer/kariyer).
- **KVKK (Karar 7)**: `oyuncular` tablosundaki telefon/mail/kilo/doğum **gizli**.
  Ziyaretçi sadece `oyuncular_acik` görünümünü görür → doğum yerine **yaş**.
- **Güvenlik (Karar 8)**: tüm yetki kontrolü sunucuda (RLS), tarayıcıdan atlatılamaz.
- **Çoklu admin (Karar 2)**: admin listesi kodda değil, `adminler` tablosunda.
- **Lig hakkı (Karar 3/4)**: `lig_haklari` — sen hak verirsin, sistem sayar.
- **Ülke (Karar 9)**: her ligde `ulke` alanı (TR/AT/DE...).
- **Otomatik kurallar**: maç oynanınca kilit, skor değişince log, lig açılınca
  hak −1, transfer bitince takım değişimi.

## Sonraki adım

Tablolar kurulduktan sonra ben **uygulama tarafını** (index.html) bu yeni yapıya
bağlayacağım + mevcut verini yeni tablolara taşıyan aracı yazacağım. Sen sadece
yukarıdaki 4 dosyayı çalıştır, gerisi bende.
