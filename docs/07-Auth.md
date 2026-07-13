# 07 — Kimlik & Giriş (Auth)

> Giriş sistemi, kullanıcı ↔ oyuncu bağı, profil ve üyelik nasıl çalışıyor?
> Satır numaraları `index.html` içindir.

---

## Giriş yöntemleri

ForzaLig **Supabase Auth** kullanır. İki yol var:

1. **Google ile giriş** — `sb.auth.signInWithOAuth({provider:"google", redirectTo})` (satır 9105).
   Ana yöntem. Google hesabıyla tek tıkla girer.
2. **E-posta + şifre** — Üyelik `sb.auth.signUp` (9082), giriş `sb.auth.signInWithPassword` (9087).
   Şifre en az 6 karakter (bu kontrol **sadece istemcide**, 9075).

Giriş ekranı: `GirisAuth` bileşeni (9057–9159).

---

## Açılış kapısı (kimin ne göreceği)

Uygulama açılınca bir "kapı" (`kapi` state) devreye girer (9972):

```
İlk ziyaret:   Splash → Tanıtım → Giriş/Üye ol → (giriş) → Uygulama
Daha önce girmiş: doğrudan Uygulama (GIRIS_FLAG localStorage'da)
?lig=... linki:  kapı yok → salt-okunur paylaşım görünümü
?davet=... linki: kapı yok → DavetKatil ekranı
```

- `GIRIS_FLAG = "forzalig_giris_v1"` (9971): bir kez girince kapı bir daha gösterilmez.
- Paylaşım (`?lig=`) veya davet (`?davet=`) linkiyle gelen kapıyı atlar (9972).

---

## "Herkese açık" mı, "test modu" mu?

Kodda bir erişim bayrağı var:

- `IZINLI_MAILLER = ["fatiherol68@gmail.com"]` (288)
- `HERKESE_ACIK = true` (289) → yorum: "🌍 YAYINDA — herkes üye olup girebilir"
- `mailIzinli(email) = HERKESE_ACIK || IZINLI_MAILLER.includes(email)` (293)

**Sonuç:** `HERKESE_ACIK` **true** olduğu için beyaz liste **devre dışı** — şu an **herkes**
üye olup girebilir. "Test modu" mesajı (`kapiKontrol`, 10090) sadece `HERKESE_ACIK=false` iken
devreye girerdi. Bu, bilinçli bir "yayında" tercihidir.

---

## Oturum (session) yönetimi

- State: `const [oturum,setOturum]=useState(null)` (9987).
- Açılışta mevcut oturumu okur: `sb.auth.getSession()` (10099) → `setOturum(u)`.
- Her giriş/çıkışta dinler: `sb.auth.onAuthStateChange(...)` (10105).
- Çıkış: `cikisYap` (10182) → `signOut()` + `GIRIS_FLAG` sil + giriş kapısına dön.
- Üye olunca **DB trigger** `trg_yeni_profil` otomatik `profiller` tablosuna satır ekler
  (e-posta ↔ user_id köprüsü — admin, kullanıcıyı e-postadan bulabilsin diye).

---

## Kullanıcı ↔ Oyuncu bağı ("Bu benim profilim")

Bir kullanıcı hesabı ile bir oyuncu kartı **iki yolla** eşleşir. **Bu ForzaLig'in en kafa
karıştırıcı yeri** — iki sistem yan yana yaşıyor:

### Yol 1 — İlişkisel (GÜÇLÜ, önerilen)
- Fonksiyon: `Db.oyuncuSahiplenRel(playerId)` → `oyuncu_sahiplen` RPC (satır 529).
- RPC sunucuda çalışır ve **sadece kart sahipsizse** (`sahip_user_id is null`) sahiplenmeyi yapar
  (`08_davetler.sql`). Yani başkasının kartını çalamazsın.
- Sonuç: `oyuncular.sahip_user_id = kullanıcı`. Bu, gerçek/güvenli bağdır.

### Yol 2 — "Blob" / eski (ZAYIF, beyan usulü)
- Fonksiyon: `Paylas.sahiplen(userId, kayit)` → `sahiplenmeler` tablosuna upsert (satır 419).
- `kayit` istemcinin verdiği `{oyuncu_ad, oyuncu_id, ...}`'dır — **sunucu doğrulaması yok.**
  Kullanıcı teoride herhangi bir ismi "benim" diye işaretleyebilir.
- Kullanıcı başına **tek** sahiplenme tutulur (`sahiplenmem`, 424).

### Arayüzde "benim mi" kararı
`OyuncuSayfa` içinde (5036):
```
benimMi = (oturum && o.sahip_user_id === oturum.id)          // Yol 1: gerçek
        || (sahiplenme && (sahiplenme.oyuncu_id===o.id
                           || sahiplenme.oyuncu_ad===o.ad))    // Yol 2: beyan
```
`benimMi` true olunca: "kariyerin" rozeti, **foto değiştirme** (5058'de `oyuncular` update),
transfer pazarına eklenme açılır. Foto/bilgi yazımı yine **RLS ile** korunur (gerçek DB yazması
için `sahip_user_id` eşleşmesi gerekir).

> **Öneri (V2):** İki sistem teke indirilmeli — tercihen ilişkisel (Yol 1). Blob sahiplenme
> hem tutarsızlık hem güvenlik açısından zayıf (bkz. `08-Guvenlik.md`).

---

## Davet zinciri (kaptan/oyuncu daveti)

Lig yöneticisi 96 oyuncuyu tek tek girmesin diye **davet linki** sistemi var:

1. Lig yöneticisi "Takım Davet Linki" üretir (`Db.davetOlustur` → `davetler` tablosu).
2. Kaptan linki açar, Google ile girer, **kendi takımını kurar** (`takim_daveti_kullan` RPC).
3. Kaptana otomatik "oyuncu davet linki" çıkar; oyuncular linkle girip **kendi kartını** oluşturur
   (`oyuncu_daveti_kullan` RPC — foto, mevki, forma no).
- Tüm bu işlemler RPC (sunucu fonksiyonu) ile yapıldığı için davetsiz kimse takım/oyuncu ekleyemez.
- Ekran: `DavetKatil` (9659). Google girişi zorunlu.

---

## Özet

| Konu | Durum |
|------|-------|
| Google girişi | ✅ Çalışıyor |
| E-posta/şifre girişi | ✅ Çalışıyor (şifre kuralı sadece istemcide) |
| Herkese açık kayıt | ✅ Açık (`HERKESE_ACIK=true`) |
| Profil köprüsü (e-posta↔id) | ✅ Otomatik (trigger) |
| Kullanıcı↔oyuncu bağı | 🟡 İki paralel sistem (biri güçlü, biri zayıf) |
| Davet zinciri | ✅ RPC ile güvenli |

*(Emin değilim: OAuth redirect'in canlıdaki tam davranışını ve Supabase Auth ayarlarını koddan
göremiyorum; Site URL / Redirect URL yapılandırması Supabase panelinde teyit edilmeli.)*
