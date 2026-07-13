# 08 — Güvenlik Analizi

> ⚠️ Bu belge **sadece rapordur**. Hiçbir şey düzeltilmedi (senin talimatın). Her bulgu için:
> risk seviyesi, nasıl tespit edildiği, etkisi. Kanıt = ilgili dosya + satır/politika adı.
>
> **Kanıt kaynakları:**
> - RLS/politika/RPC → `supabase/01–20*.sql` (bunları satır satır okudum).
> - İstemci davranışı → `index.html` (satır no'lu).
> - "Emin değilim" dediğim yerler: koddan doğrulayamadığım, canlı Supabase panelinde teyit gerektirenler.

---

## Temel mimari gerçeği (önce bunu anla)

ForzaLig'de **tüm yetki kontrolü sunucudadır (Supabase RLS).** Uygulama arayüzü butonları
gizler ama bu güvenlik değildir — teknik bir kullanıcı `supabase-js` ile doğrudan istek atıp
arayüzü atlayabilir. Kod bunu 10337. satırda açıkça söyler: *"…yetkisi/hakkı yoksa RLS engeller."*

**Bu doğru bir tercihtir.** Ama sonucu şudur: **güvenlik = RLS'in doğruluğu.** Bir tablonun
RLS'i eksik/gevşekse, arayüz ne kadar kısıtlı olursa olsun o tablo korumasızdır. Bu yüzden
aşağıdaki en kritik bulgular "RLS'i görünmeyen/gevşek" tablolarla ilgilidir.

---

## 🔴 YÜKSEK RİSK

### Y1 — Eski (blob) tabloların RLS'i belirsiz
- **Tablolar:** `kullanici_veri`, `paylasilan_ligler`, `sahiplenmeler`, `mac_oylari`, `yetkiler`.
- **Nasıl tespit edildi:** `index.html` bu tablolara doğrudan yazıyor (`Bulut` 337–371, `Paylas`
  388–432, `Oy` 435–451, `Admin` 462–464). Ama bu tabloların **RLS politikaları numaralı SQL
  dosyalarında (01–20) YOK.** Daha önce elle kurulmuşlar.
- **Etki:** Eğer canlıda bu tabloların RLS'i eksik/gevşekse:
  - `kullanici_veri` başka kullanıcının **tüm verisini** okutabilir/bozdurabilir (her kullanıcının
    ligleri tek JSON pakette burada).
  - `yetkiler` yetki yükseltmeye açık olabilir.
  - `sahiplenmeler` başkasının adına sahiplenme yazdırabilir.
- **Durum:** **Emin değilim** — canlı RLS'i koddan göremiyorum. **Supabase panelinde her biri için
  RLS açık mı ve politikalar doğru mu, teyit edilmeli.** (Sadece rapor; düzeltme yok.)

### Y2 — Yetki tablolarına doğrudan istemci yazması (kısmen RLS ile korunuyor)
- **Nerede:** `adminYap` (512 → `adminler`), `hakVer` (546 → `lig_haklari`), `yetkiEkle` (463 → `yetkiler`).
- **İstemci koruması:** Sadece `AdminPanel`'in `adminMi` ile gösterilmesi (arayüz gizleme).
- **Gerçek durum (RLS ile doğruladım):**
  - `adminler` → `p_adminler_all using(admin_mi()) with check(admin_mi())` → **yetkisiz kişi kendini
    admin YAPAMAZ.** ✅ Korunuyor. (`02_guvenlik.sql` 51–53)
  - `lig_haklari` → `p_hak_yaz for all using(admin_mi())` → **korunuyor.** ✅ (58–63)
  - `yetkiler` → **RLS'i belirsiz (Y1).** ⚠️ Burası gerçek risk.
- **Not:** Alt-ajan bunu "kendini admin yapabilir → kritik" olarak işaretledi; ama `adminler`
  RLS'ini okuyunca **engellendiğini** gördüm. Gerçek açık kalan tek nokta `yetkiler` tablosudur.
- **Risk:** `adminler`/`lig_haklari` için DÜŞÜK (korunuyor); `yetkiler` için YÜKSEK (belirsiz).

---

## 🟠 ORTA RİSK

### O1 — `oyuncular` UPDATE her alanı serbest bırakıyor (`with check (true)`)
- **Kanıt:** `02_guvenlik.sql` `p_oyuncu_upd` (137–147): `using(...owner/manager/admin...) with check (true)`.
- **Etki:** Yetkili editör (özellikle **kendi kartını sahiplenmiş oyuncu**) API üzerinden kendi
  `ovr`, `nitelik`, `deger` (piyasa değeri) alanlarını istediği gibi yükseltebilir; hatta
  `sahip_user_id`'yi değiştirebilir. Arayüz bunu sunmaz ama RLS engellemez.
- **Nasıl tespit edildi:** RLS'te `with check (true)` + istemcide foto/bilgi update yolları (5058).

### O2 — Depo (Storage) fotoğraflarında sahiplik kontrolü yok
- **Kanıt:** `11_foto_storage.sql` (25–31): `fotolar_guncelle`/`fotolar_sil` politikaları sadece
  `using(bucket_id='fotolar')` — **kim yüklediğine bakmıyor.**
- **Etki:** Giriş yapmış **herhangi bir üye**, başka birinin oyuncu fotoğrafını veya takım logosunu
  **silebilir/değiştirebilir** (dosya yolunu bilirse). Görsel tahribat/vandalizm riski.
- **Risk:** ORTA.

### O3 — KVKK: Lig yöneticisi tüm ligindeki oyuncuların hassas verisini görebilir
- **Kanıt:** `p_oyuncu_sel` (124–134): lig yöneticisi, ligindeki oyuncuların `oyuncular` ham
  satırını okuyabilir → **telefon, TC, e-posta, kilo, doğum** dahil.
- **Etki:** Tasarım gereği (yönetici oyuncuları yönetir) ama bir KVKK/gizlilik sorumluluğu.
  Kötü niyetli bir lig yöneticisi ligindeki herkesin TC/telefonunu görebilir.
- **Risk:** ORTA (yasal/gizlilik boyutu). Not: Ziyaretçi/başka üye bunları göremez (view ile korunuyor). ✅

### O4 — `transferler` INSERT herkese açık (`with check (true)`)
- **Kanıt:** `p_transfer_ins` (172–173): giriş yapmış herkes, herhangi bir oyuncu/lig için transfer
  **isteği satırı** ekleyebilir.
- **Etki:** Spam/gürültü — biri sahte transfer istekleri üretebilir. **Ancak** transferin
  gerçekleşmesi lig yöneticisi onayına bağlı (Y-düzeltme aşağıda), yani veri taşınmaz; sadece
  bekleyen istek kirliliği + gereksiz bildirim.
- **Risk:** ORTA-DÜŞÜK.

---

## 🟡 DÜŞÜK RİSK

### D1 — `oyuncular` INSERT herkese açık (`with check (true)`)
- **Kanıt:** `p_oyuncu_ins` (135–136). Herhangi bir üye rastgele oyuncu satırı ekleyebilir.
- **Etki:** Veri kirliliği (öksüz oyuncular). Doğrudan zarar yok.

### D2 — `islem_log` sahte kendi-kaydı
- **Kanıt:** `10_panel.sql` `p_islemlog_ins with check(user_id=auth.uid())` (20). Kullanıcı kendi
  adına sahte "işlem yaptı" kaydı yazabilir (başkası adına YAZAMAZ).
- **Etki:** Denetim kaydına gürültü. Düşük.

### D3 — `olay_log` anonim yazma
- **Kanıt:** `10_panel.sql` `p_olay_ins to anon with check(true)` (34). Ziyaretçi bile analitik
  olayı yazabilir → analitik sayıları şişirilebilir.
- **Etki:** Analitik güvenilirliği. Düşük.

### D4 — Şifre kuralı sadece istemcide
- **Kanıt:** `index.html` 9075 (min 6 karakter, yalnız tarayıcıda). Supabase kendi kuralını
  uyguluyor olabilir (**Emin değilim** — panelde teyit edilmeli).

### D5 — Blob sahiplenme "beyan usulü"
- **Kanıt:** `benimMi` mantığı (5036) istemci state'ine güvenir; `sahiplenmeler` upsert (419)
  sunucu doğrulaması yapmaz. Ama gerçek `oyuncular` yazması yine RLS'e (`sahip_user_id`) takılır.
- **Etki:** Kozmetik "benim" iddiası; gerçek zarar `sahiplenmeler` RLS'i gevşekse artar (bkz. Y1).

---

## ✅ DÜZELTİLMİŞ / KORUNUYOR (bilgi amaçlı)

### Düzeltildi — Transfer'i oyuncunun kendi onaylaması (eski açık)
- **Eski hâl:** `02_guvenlik.sql` `p_transfer_upd` (174–180) sahiplenmiş oyuncunun (`sahip_user_id`)
  transferi UPDATE etmesine izin veriyordu → oyuncu `asama='tamam'` yapıp **kendi transferini
  onaylayabilirdi** (trigger oyuncuyu taşırdı).
- **Düzeltme:** `15_transfer_kaptan_rls.sql` (14–19) bu politikayı **sadece admin + lig yöneticisi**
  olacak şekilde daralttı. Artık oyuncu kendi transferini onaylayamaz. ✅
- **Koşul:** Bu güvenlik, `15_*.sql`'in canlıda çalıştırılmış olmasına bağlı (çalıştırıldı — transfer
  akışı çalışıyor).

### Korunuyor — Ziyaretçi hassas oyuncu verisi göremez
- `revoke select on public.oyuncular from anon` (249) + `oyuncular_acik` view sadece güvenli
  alanları açar (doğum→yaş; telefon/TC/e-posta/kilo **yok**). Doğruladım (09/13 view tanımları). ✅

### Korunuyor — Kilitli ligde kural değişmez
- `trg_kilit_koru` (03) maç oynanınca puan/averaj/fikstür değişimini sunucuda engeller. ✅

---

## Yapısal notlar (güvenlik değil ama önemli)

### N1 — "İki dünya" veri tutarlılığı
Aynı bilgi hem belleğdeki "blob" nesnede hem ilişkisel tablolarda tutulur (bkz. `02-Sistem-Haritasi.md`).
İkisi arasında senkron kopması → yanlış istatistik/görünüm riski. Bu bir güvenlik açığı değil ama
veri bütünlüğü riskidir.

### N2 — `HERKESE_ACIK = true`
Beyaz liste kapalı, herkes girebilir (289). Bu bilinçli bir "yayında" kararıdır, açık değildir —
ama "test modu" koruması fiilen devre dışıdır. Not edilmeli.

### N3 — Tek dosya + istemci-ağırlıklı yazma
Yazmaların neredeyse tamamı doğrudan `sb.from(...).insert/update/delete` (RPC değil). Bu, güvenliği
tamamen RLS'e yükler. RPC'ye taşınabilecek riskli işlemler (özellikle yetki/hak) ileride
değerlendirilebilir.

---

## Öncelikli kontrol listesi (senin için, düzeltme DEĞİL — sadece teyit)

Bir sonraki fazda **önce şunlar canlı Supabase panelinde teyit edilmeli:**

1. 🔴 `kullanici_veri`, `sahiplenmeler`, `mac_oylari`, `paylasilan_ligler`, `yetkiler` → RLS açık mı,
   politikalar doğru mu? (Y1)
2. 🔴 `yetkiler` tablosuna yetkisiz yazma engelli mi? (Y2)
3. 🟠 Storage `fotolar` → başkasının fotoğrafını silme/değiştirme engellensin mi? (O2)
4. 🟠 `oyuncular` UPDATE → hangi alanların değişebileceği sınırlandırılsın mı? (O1)
5. 🟠 KVKK: lig yöneticisinin gördüğü hassas alanlar (TC/telefon) daraltılsın mı? (O3)

> Bu belge Faz 1'in çıktısıdır. Faz 2'de bu bulguları birlikte değerlendirip hangilerini
> düzelteceğimize karar vereceğiz. **Şimdilik hiçbir şey değiştirilmedi.**
