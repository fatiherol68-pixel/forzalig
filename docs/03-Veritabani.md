# 03 — Veritabanı (Supabase / PostgreSQL)

> Bu belge ForzaLig'in **veritabanını** anlatır. Kod bilmene gerek yok.
> Veritabanı = uygulamanın "hafızası". Bütün ligler, takımlar, oyuncular,
> maçlar, mesajlar burada saklanır. Sağlayıcı: **Supabase** (proje: `crkestykdsnmfcmamxav`).

Kaynak dosyalar: `supabase/01_sema.sql` … `supabase/20_izinler_duzeltme.sql`
(Her tablo ve kural bu SQL dosyalarında tanımlıdır — "Emin değilim" dediğim yerler hariç, her şey bu dosyalardan kanıtlıdır.)

---

## Kısa sözlük (önce bunu oku)

| Terim | Basit anlamı |
|------|--------------|
| **Tablo** | Excel sayfası gibi. Satırlar = kayıtlar (ör. bir oyuncu), sütunlar = alanlar (ör. ad, forma no). |
| **RLS** | "Row Level Security" = satır güvenliği. Sunucuda "kim hangi satırı görebilir/değiştirebilir" kuralı. Tarayıcıdan atlatılamaz. |
| **RPC** | Sunucuda çalışan hazır fonksiyon. Karmaşık/riskli işi güvenli yapar (ör. transfer isteği oluştur). |
| **Trigger (tetikleyici)** | Otomatik kural. "Şu olunca şunu yap." (ör. maç oynanınca ligi kilitle.) |
| **View (görünüm)** | Bir tablonun "filtrelenmiş" hâli. ForzaLig'de KVKK için hassas alanları gizlemekte kullanılır. |
| **auth.uid()** | O an giriş yapmış kullanıcının kimliği. |

---

## Tabloların tam listesi (21 tablo + 1 view)

Aşağıda **her tablo** var. "API/Katman" sütunu, uygulamanın o tabloya hangi
`Db.*` fonksiyonuyla eriştiğini gösterir (detay: `docs/02-Sistem-Haritasi.md`).

### 1) Kimlik & Yetki

| Tablo | Ne işe yarar | Kim kullanır | İlişki |
|------|--------------|--------------|--------|
| **adminler** | Süper Admin listesi. Kim bu listedeyse tüm sisteme yetkili. | Sadece adminler | `auth.users` |
| **lig_haklari** | Kim kaç lig açabilir (toplam / kullanılan hak). | Admin verir, kullanıcı görür | `auth.users` |
| **profiller** | Kullanıcının e-postası ↔ kimliği köprüsü (admin birini e-postadan bulabilsin). Üye olunca **otomatik** dolar (trigger). | Admin panel | `auth.users` |

### 2) Lig Yapısı

| Tablo | Ne işe yarar | Kim yazar | İlişki |
|------|--------------|-----------|--------|
| **ligler** | Ligin kendisi: ad, ülke, şehir, puan sistemi, format (tek/çift/gruplu/kupa), durum (aktif/arşiv), kurallar kilidi. | Lig yöneticisi / admin | `auth.users` (yonetici_id) |
| **takimlar** | Takımlar: ad, renk, 2. renk, logo, grup, lisans no, takım yöneticisi (kaptan). | Lig yön. / kaptan / admin | `ligler` |
| **oyuncular** | Oyuncu kartı. 🔑 `player_id` = **asla değişmeyen kalıcı kimlik**. Ad/telefon değişse bile id sabit. FIFA nitelikleri (ovr, nitelik), foto, piyasa değeri, **hassas alanlar** (dogum, telefon, tc, email, kilo, uyruk) burada. Pazar alanları (musait, musait_sehir). | Kart sahibi / lig yön. / admin | `auth.users` (sahip_user_id) |

### 3) Oyuncu ↔ Takım & Transfer

| Tablo | Ne işe yarar | Kim yazar | İlişki |
|------|--------------|-----------|--------|
| **oyuncu_takim** | Hangi oyuncu, hangi ligde, hangi takımda, aktif mi? (Bir ligde aynı anda **tek aktif** üyelik — veritabanı bunu zorluyor.) | Lig yön. / admin | `oyuncular`, `takimlar`, `ligler` |
| **transferler** | Transfer zinciri: talep → (kabul) → yönetici onayı → tamam/iptal. `asama` alanı hangi aşamada olduğunu tutar. | Kaptan istek açar, lig yön. onaylar | `oyuncular`, `takimlar`, `ligler` |

### 4) Maç

| Tablo | Ne işe yarar | Kim yazar | İlişki |
|------|--------------|-----------|--------|
| **maclar** | Maçlar: ev/deplasman takım, skor, hafta, oynandı mı, ayrıca formasyon/kadro/rating/istatistik/MVP gibi zengin veriler (JSON). | Lig yön. / admin | `ligler`, `takimlar` |
| **mac_olaylari** | Maçtaki tekil olaylar: gol / asist / sarı / kırmızı / kurtarış. **Kariyer istatistiği buradan toplanır.** | Lig yön. / admin | `maclar`, `oyuncular` |
| **mac_odulleri** | Maçın adamı (MVP), forvet ödülü vb. Kariyere sayılır. | Lig yön. / admin | `maclar`, `oyuncular` |
| **mac_sonuc_log** | Skor değişikliği kaydı (kim/ne zaman/eski/yeni). **Otomatik** yazılır (trigger). Şeffaflık için herkes okuyabilir. | Trigger (otomatik) | `maclar`, `auth.users` |
| **ilk11** | Maç ilk 11'i (opsiyonel). | Lig yön. / admin | `maclar`, `takimlar`, `oyuncular` |
| **katilim** | "Geliyorum / gelemiyorum / belki" yoklaması. | Oyuncu (kendi) / lig yön. | `maclar`, `oyuncular` |

### 5) Sosyal & Bildirim (yeni modüller)

| Tablo | Ne işe yarar | Kim yazar | İlişki |
|------|--------------|-----------|--------|
| **bildirimler** | Kullanıcıya düşen app-içi bildirimler (transfer isteği/onayı vb.). İçeriği **sadece RPC** üretir (güvenlik). | Trigger/RPC üretir, kullanıcı okur | `auth.users` |
| **sohbet_mesajlari** | Lig geneli + takım içi sohbet mesajları. Supabase **Realtime** ile anlık gelir. | Giriş yapmış üye | `ligler`, `takimlar`, `auth.users` |
| **push_abonelikleri** | Telefon push bildirimi için tarayıcı aboneliği (endpoint + anahtarlar). | Kullanıcı (kendi) | `auth.users` |

### 6) Admin Panel & Analitik

| Tablo | Ne işe yarar | Kim yazar | İlişki |
|------|--------------|-----------|--------|
| **islem_log** | Kritik işlem geçmişi (audit): "hak verdi", "transfer onayladı" vb. | Üye kendi adına yazar, admin okur | `auth.users` |
| **olay_log** | Analitik: sayfa görüntüleme + arama olayları. | Herkes (ziyaretçi dahil) yazar | `auth.users` (opsiyonel) |
| **takipler** | Kullanıcının takip ettiği lig/takım/oyuncular (popülerlik hesabı da buradan). | Kullanıcı (kendi) | `auth.users` |
| **davetler** | Takım/oyuncu davet linkleri (token). Kaptana link yolla → kendi takımını kursun. | Lig yön. oluşturur, davetli kullanır | `ligler`, `takimlar` |

### View (görünüm)

| View | Ne işe yarar |
|------|--------------|
| **oyuncular_acik** | **KVKK kalkanı.** Ziyaretçi/başka kullanıcı oyuncuyu buradan görür. Sadece güvenli alanlar (görünen ad, forma no, pozisyon, ovr, nitelik, foto, **doğum→yaş**). Telefon/TC/e-posta/kilo/tam doğum tarihi **asla çıkmaz.** |

---

## Tablolar birbirine nasıl bağlı? (ASCII harita)

```
auth.users (Supabase kimlik — Google/e-posta girişi)
   │
   ├── adminler            (bu kullanıcı süper admin mi?)
   ├── lig_haklari         (kaç lig açabilir?)
   ├── profiller           (e-posta köprüsü)
   │
   └── ligler (yonetici_id) ─── bir kullanıcı lig kurar
         │
         ├── takimlar (lig_id) ─── takım (kaptan = yonetici_id)
         │      │
         │      └── oyuncu_takim (takim_id, lig_id) ── kadro üyeliği
         │                │
         │                └── oyuncular (player_id) 🔑 kalıcı kimlik
         │                        │        └── sahip_user_id → auth.users
         │                        └── oyuncular_acik (KVKK view)
         │
         ├── maclar (lig_id, ev/dep takim_id)
         │      ├── mac_olaylari  (gol/asist/kart → kariyer)
         │      ├── mac_odulleri  (MVP vb.)
         │      ├── mac_sonuc_log (skor değişim kaydı)
         │      ├── ilk11
         │      └── katilim
         │
         ├── transferler (player_id, eski/yeni takim, lig_id)
         └── sohbet_mesajlari (lig_id, takim_id)

Kullanıcıya bağlı sosyal:  bildirimler · push_abonelikleri · takipler · davetler
Analitik/denetim:          olay_log · islem_log
```

---

## Otomatik kurallar (Tetikleyiciler / Triggers)

Bunlar **sunucuda** işler → uygulama unutsa bile garanti çalışır. Kaynak: `03_tetikleyiciler.sql` + `16_bildirimler.sql`.

| Tetikleyici | Ne zaman | Ne yapar |
|-------------|----------|----------|
| `trg_lig_kilitle` | İlk maç oynanınca | Ligin puan/averaj/fikstür kurallarını **kilitler** (sonradan değişmesin). |
| `trg_kilit_koru` | Lig güncellenirken | Kilitliyken puan/averaj/fikstür değiştirmeyi **engeller** (admin hariç). |
| `trg_skor_log` | Maç skoru değişince | `mac_sonuc_log`'a otomatik kayıt (kim/ne zaman/eski/yeni). |
| `trg_hak_say` | Lig açılınca/silinince | `lig_haklari.kullanilan` sayacını +1 / −1 yapar. |
| `trg_transfer_uygula` | Transfer `asama='tamam'` olunca | Eski üyeliği pasifler, yeni takımda aktif üyelik açar. |
| `trg_transfer_bildirim` | Transfer isteği açılınca | Lig yöneticisine "yeni transfer isteği" bildirimi üretir. |
| `trg_transfer_sonuc_bildirim` | Transfer onay/ret olunca | İsteği açana sonuç bildirimi üretir. |
| `trg_yeni_profil` | Yeni üye kaydında | `profiller` tablosuna otomatik satır ekler. |

---

## Sunucu fonksiyonları (RPC)

İstemcinin doğrudan tabloya yazması riskli olan işler bu güvenli fonksiyonlarla yapılır. Kaynak: `08_davetler.sql`, `16`, `19`.

| RPC | Ne yapar | Kim çağırabilir |
|-----|----------|-----------------|
| `admin_mi()` | Giriş yapan admin mi? (RLS kurallarında kullanılır) | Sistem |
| `lig_yoneticim(lig)` | Bu ligin yöneticisi/admin miyim? | Sistem |
| `takim_yoneticim(takim)` | Bu takımın kaptanı/lig yön./admin miyim? | Sistem |
| `takim_daveti_kullan` | Davet linkiyle yeni takım kur (kuran = kaptan). | Giriş yapmış üye |
| `oyuncu_daveti_kullan` | Davet linkiyle oyuncu + üyelik oluştur. | Giriş yapmış üye |
| `oyuncu_sahiplen` | Sahipsiz oyuncu kartını sahiplen. | Giriş yapmış üye |
| `bildirim_yolla` | Bir kullanıcıya bildirim üret (tetikleyiciler çağırır). | Sistem (SECURITY DEFINER) |
| `oyuncu_musait_ayar` | Oyuncuyu transfer pazarında "müsait" yap/kaldır. | Kart sahibi veya lig yön. |
| `pazar_oyuncular` | Müsait (takım arayan) oyuncu listesi (KVKK-güvenli). | Herkes |

---

## Önemli notlar / bilinmesi gerekenler

1. **`player_id` asla değişmez.** Bir oyuncunun adı, telefonu, takımı değişse bile
   kimliği (player_id) sabit kalır. Kariyer istatistiği bu id'ye bağlıdır.

2. **Kariyer istatistiği tablolardan HESAPLANIR**, ayrı bir "toplam" alanında durmaz.
   Goller `mac_olaylari`'ndan, ödüller `mac_odulleri`'nden sayılır. Bu yüzden bir maç
   düzeltildiğinde kariyer otomatik güncellenir.

3. **Zengin görsel veriler `maclar` tablosunda JSON olarak da tutulur** (kadro, diziliş,
   rating, olaylar). Kariyer sorguları `mac_olaylari`/`mac_odulleri`'nden gelir; JSON alanlar
   sadece o maçın ekranını birebir göstermek içindir. (İki kaynak → tutarlılık riski, bkz. `08-Guvenlik.md`.)

4. **KVKK:** Hassas alanlar (`dogum` tam tarih, `telefon`, `tc_pasaport`, `email`, `kilo`, `uyruk`)
   sadece `oyuncular` tablosunda; dışarıya `oyuncular_acik` view'i ile SADECE güvenli alanlar çıkar.

5. **SQL dosyaları ≠ canlı veritabanının tam kopyası olabilir.** Şema zamanla eklerle
   büyüdü (06, 11, 13, 19 dosyaları sütun ekledi). Canlı durumu Supabase panelinden görülür.
   *(Emin değilim: canlı DB ile SQL dosyalarının birebir aynı olduğunu kod üzerinden doğrulayamam;
   dosyalar niyeti gösterir, canlı hâli Supabase panelinde teyit edilmeli.)*

---

## ⚠️ ESKİ SİSTEM (blob) tabloları — numaralı SQL dosyalarında YOK

İlişkisel sisteme (Faz 14) geçmeden önce kurulan **eski tablolar** hâlâ canlıda ve
uygulama tarafından kullanılıyor. Bunlar `supabase/01–20` dosyalarında **tanımlı değil**
(daha önce elle kurulmuşlar). Kanıt: `index.html` içindeki `Bulut`, `Paylas`, `Oy`, `Admin`
veri objeleri bu tablolara yazıyor.

| Eski tablo | Ne işe yarar | Kullanan katman (index.html) |
|-----------|--------------|------------------------------|
| **kullanici_veri** | Kullanıcının tüm yerel verisinin bulut yedeği (tek JSON paket). | `Bulut.yukle/kaydet` (satır 337–371) |
| **paylasilan_ligler** | Herkese açık paylaşılan lig (salt-okunur `?lig=` linki). | `Paylas.yayinla/getir/liste` (388–417), `Admin.ligler/ligSil` (455–461) |
| **sahiplenmeler** | Eski usul "bu oyuncu benim" kaydı (kullanıcı beyanı). | `Paylas.sahiplen/sahiplenmem` (419–432) |
| **mac_oylari** | Paylaşılan ligde maçın adamı (MVP) oylaması. | `Oy.oyla/oylar` (435–451) |
| **yetkiler** | Eski yetki/onay listesi (e-posta bazlı). | `Admin.yetkiListe/yetkiEkle/yetkiSil` (462–464) |

> **ÖNEMLİ (güvenlik):** Bu tabloların **RLS politikaları numaralı SQL dosyalarında görünmüyor.**
> Canlıda RLS'lerinin doğru kurulu olup olmadığı **Supabase panelinden teyit edilmeli.**
> Detay ve risk: `docs/08-Guvenlik.md` → "Eski tablolar" bölümü. *(Emin değilim: bu tabloların
> canlı RLS durumunu koddan göremiyorum.)*
