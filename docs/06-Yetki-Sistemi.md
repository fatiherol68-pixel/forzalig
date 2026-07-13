# 06 — Yetki Sistemi (Kim ne yapabiliyor?)

> Bu belge rolleri ve her rolün yapabildiklerini anlatır. **Önemli:** Gerçek yetki
> kontrolü sunucudadır (Supabase RLS). Uygulama arayüzü sadece butonları gizler.
> Yani "arayüzde göremiyorum" ≠ "yapamam". Gerçek kural RLS'tir (`supabase/02_guvenlik.sql`).

---

## Roller (en yetkiliden en yetkisize)

| Rol | Nasıl belirlenir | Kanıt |
|-----|------------------|-------|
| **Süper Admin** | `adminler` tablosunda kaydı olan kullanıcı. | `admin_mi()` fonksiyonu (`01_sema.sql`), `Db.adminMi` (478). |
| **Lig Yöneticisi** | `ligler.yonetici_id = kullanıcı`. | `lig_yoneticim(lig)` (`02_guvenlik.sql`). |
| **Takım Yöneticisi (Kaptan)** | `takimlar.yonetici_id = kullanıcı`. | `takim_yoneticim(takim)` (`02_guvenlik.sql`). |
| **Oyuncu (sahiplenmiş)** | `oyuncular.sahip_user_id = kullanıcı`. | RLS `p_oyuncu_upd` (`02_guvenlik.sql`). |
| **Üye (giriş yapmış)** | Google/e-posta ile girmiş herhangi biri. | `oturum` state, `authenticated` rolü. |
| **Ziyaretçi (üye değil)** | Giriş yapmamış. | `anon` rolü. |

> Not: "Admin modu" (`adminMod`, index.html 10004) bir **arayüz anahtarıdır**, gerçek yetki
> değildir — sadece Süper Admin'e (adminMi) düzenleme butonlarını açar. Bir yetkisiz kişi bu
> anahtarı açsa bile veritabanı yazması RLS'te reddedilir.

---

## Rol rol: ne yapabilir?

### 👑 Süper Admin
- **Her şeyi** okur/yazar (RLS'te `admin_mi()` tüm kritik kurallarda kısayoldur).
- Başka kullanıcıyı admin yapar (`adminler`), lig hakkı verir (`lig_haklari`).
- Her transferi onaylar/reddeder; her ligi/takımı/oyuncuyu siler.
- Audit log + analitik görür (`AdminPanel`).
- **RLS kanıtı:** `p_adminler_all`, `p_hak_yaz`, `p_lig_del`, `p_oyuncu_del` → hepsi `admin_mi()`.

### 🏆 Lig Yöneticisi
- **Kendi liginde** her şey: takım/oyuncu/maç ekle-düzenle-sil, fikstür, skor, transfer onayı.
- Davet linki üretir (kaptanları çağırır).
- Kendi ligindeki oyuncuların **hassas bilgilerini görebilir** (telefon/TC dahil — `p_oyuncu_sel`).
- **Yapamaz:** Başka ligi yönetemez; kilitli ligde puan/averaj/fikstür değiştiremez (trigger engeller);
  maç oynanmış ligi/takımı silemez.
- **RLS kanıtı:** `p_lig_upd`, `p_takim_ins`, `p_mac_yaz`, `p_ot_yaz`, `p_transfer_upd` → `lig_yoneticim(...)`.

### 🛡️ Takım Yöneticisi (Kaptan)
- **Kendi takımını** düzenler: ad/renk/logo (`p_takim_upd` → `takim_yoneticim`, `14_kaptan_takim_guncelle.sql`).
- Davet linkiyle takımını kurar, oyuncularını girer.
- Transfer **isteği başlatabilir** (onay lig yöneticisinde).
- **Yapamaz:** Maç skoru giremez (o lig yöneticisinde), başka takıma dokunamaz, transferi kendi onaylayamaz.

### ⚽ Oyuncu (kartını sahiplenmiş)
- **Kendi kartını** düzenler: foto, (ilişkisel) bilgi; transfer pazarında "müsait" olur.
- Kendi katılım (yoklama) durumunu işaretler (`p_katilim_yaz`).
- MVP oyu verir (o maçta oynadıysa).
- **RLS kanıtı:** `p_oyuncu_upd` → `sahip_user_id = auth.uid()`.
- **⚠️ Dikkat (bkz. 08):** `with check (true)` olduğu için kendi kartında OVR/nitelik/değer gibi
  alanları da değiştirebilir (kendini güçlendirebilir).

### 👤 Üye (giriş yapmış, henüz yetkisiz)
- Lig kurabilir (hakkı varsa — `lig_haklari`).
- Sohbete yazar (lig geneli), takip eder, oyuncu sahiplenir, bildirim alır.
- **⚠️ RLS'in gevşek olduğu yerler (bkz. 08):** herhangi bir üye teknik olarak `oyuncular`/
  `transferler` tablolarına satır ekleyebilir (`with check (true)`). Etkisi sınırlı ama not edilmeli.

### 🌍 Ziyaretçi (üye değil / `anon`)
- **Sadece okur:** ligler, takımlar, kadro, maçlar, olaylar, skor logu, `oyuncular_acik` (KVKK view).
- `oyuncular` ham tablosunu **göremez** (`revoke select ... from anon`).
- Analitik olayı yazabilir (`olay_log` — anon insert açık).
- **Yapamaz:** Hiçbir veri değiştiremez, hassas oyuncu bilgisi göremez.

---

## Özet yetki matrisi (kritik işlemler)

| İşlem | Ziyaretçi | Üye | Kaptan | Lig Yön. | Admin |
|------|:--------:|:---:|:------:|:--------:|:-----:|
| Ligleri/maçları görme | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hassas oyuncu bilgisi (tel/TC) | ❌ | sadece kendi kartı | kendi + (lig yön. ise lig) | kendi ligindekiler | ✅ hepsi |
| Lig kurma | ❌ | ✅ (hak varsa) | ✅ | ✅ | ✅ |
| Takım ekleme/düzenleme | ❌ | ❌ | kendi takımı | ✅ ligde | ✅ |
| Maç skoru girme | ❌ | ❌ | ❌ | ✅ | ✅ |
| Transfer **isteği** | ❌ | ❌ | ✅ | ✅ | ✅ |
| Transfer **onayı** | ❌ | ❌ | ❌ | ✅ | ✅ |
| Oyuncu kartını düzenleme | ❌ | kendi (sahip) | kendi | ligindekiler | ✅ |
| Başkasını admin yapma | ❌ | ❌ | ❌ | ❌ | ✅ |
| Lig hakkı verme | ❌ | ❌ | ❌ | ❌ | ✅ |

> Bu matris **RLS politikalarına** dayanır (`02_guvenlik.sql` + 14/15). Arayüz bunları ayrıca
> butonlarla kısıtlar ama nihai söz RLS'indir. İstisnalar/riskler: `08-Guvenlik.md`.
