# 02 — Sistem Haritası (uçtan uca)

> Bu belge sistemi baştan sona anlatır: bir kullanıcı geldiğinde ne olur, veri nereden
> nereye gider. Amaç: sistemi kafanda canlandırabilmen.

---

## Büyük resim (ASCII)

```
        TARAYICI (forzalig.com)                         SUPABASE (sunucu)
 ┌────────────────────────────────┐            ┌──────────────────────────────┐
 │  index.html (React app)        │            │  Auth (Google / e-posta)     │
 │   - Ekranlar (sayfalar)        │◄──giriş───►│  PostgreSQL (tablolar)       │
 │   - Db / Paylas / Bulut / Oy   │◄──veri────►│  RLS (satır güvenliği)       │
 │   - Service Worker (PWA)       │            │  RPC (güvenli fonksiyonlar)  │
 └────────────────────────────────┘            │  Storage (fotolar bucket)    │
             ▲                                  │  Realtime (sohbet)           │
             │ statik dosyalar                  └──────────────────────────────┘
      GitHub Pages (yayın)
```

**Özet kural:** Tarayıcı hiçbir zaman "güvenlik makamı" değildir. Butonları gizleyebilir
ama her yazma/okuma isteğini **Supabase RLS** onaylar. Gerçek koruma sunucudadır.

---

## Zincir: Kullanıcıdan Admine

Aşağıdaki her adımı, "veri hangi tabloya gider / hangi ekran / hangi fonksiyon" ile anlatıyorum.
Satır numaraları `index.html` içindir.

### 1. Kullanıcı → Auth (Giriş)

```
Ziyaretçi → Splash → Tanıtım → Giriş/Üye ol → oturum
```

- Ekranlar: `AcilisSplash`(8954) → `Tanitim`(8985) → `GirisAuth`(9057).
- Giriş: `sb.auth.signInWithPassword` (9087) veya Google `signInWithOAuth` (9105).
- Sonuç: `oturum` state'i dolar (`onAuthStateChange`, 10105). Üye olunca **trigger**
  otomatik `profiller` tablosuna satır ekler.
- Detay: `07-Auth.md`.

### 2. Auth → Profil

- Ekran: `ProfilSayfa`(2256). Kullanıcı kendini görür: takipleri, sahiplendiği oyuncu,
  admin ise "Süper Admin Paneli" girişi.
- Tablo: `profiller` (kimlik köprüsü), `takipler`.

### 3. Profil → Oyuncu (kariyer sahiplenme)

```
Kullanıcı  ──"⭐ bu oyuncu benim"──►  oyuncular.sahip_user_id = kullanıcı
```

- Ekran: `OyuncuSayfa`(4997).
- Yeni yol (güvenli): `oyuncu_sahiplen` RPC (`Db.oyuncuSahiplenRel`, 529) → sunucu "sahipsizse sahiplen" der.
- Eski yol (beyan): `sahiplenmeler` tablosuna upsert (`Paylas.sahiplen`, 419).
- Bu bağ sayesinde kullanıcı kendi kartının fotoğrafını değiştirebilir, transfer pazarına eklenebilir.

### 4. Oyuncu → Takım

```
oyuncu  ──oyuncu_takim (aktif)──►  takım   (bir ligde tek aktif üyelik)
```

- Tablo: `oyuncu_takim` (kadro üyeliği). Ekleme: lig yöneticisi (`Db.kadroEkle`, 576).
- Kural (DB): bir oyuncu bir ligde **aynı anda tek aktif takımda** (benzersiz index).

### 5. Takım → Lig

```
takım  ──lig_id──►  lig  (yonetici_id = lig yöneticisi)
```

- Ekranlar: `TakimSayfa`(4591), `TakimYonet`(6... kadro yönetimi).
- Takım kurma: lig yöneticisi elle, ya da **davet linki** ile kaptan kendi kurar
  (`takim_daveti_kullan` RPC).

### 6. Lig → Maç

```
lig  ──maclar──►  maç (ev/dep takım, hafta, skor)
```

- Ekranlar: `TurnuvaSayfa`(3250) → `YonetimPaneli`(3583) fikstür üretir; `SkorGir`(7953) /
  `MacSihirbaz`(8420) skor işler.
- Tablo: `maclar`. İlk maç oynanınca **trigger** ligin kurallarını kilitler.

### 7. Maç → İstatistik

```
maç  ──mac_olaylari (gol/asist/kart)──►  kariyer istatistiği
maç  ──mac_odulleri (MVP vb.)────────►  ödül istatistiği
```

- Skor değişince **trigger** `mac_sonuc_log`'a otomatik kayıt atar (kim değiştirdi).
- Kariyer, bu tablolardan **hesaplanır** (ayrı "toplam" alanı yok).

### 8. İstatistik → Puan Durumu

- Ekranlar: `PuanDurumu`(3888), `GrupTablo`(3922), `KrallarSayfa`(4140), `TumEnler`(2530).
- Puan/averaj, ligin ayarına göre uygulama tarafında hesaplanır; sıralamalar ekranlara dökülür.

### 9. Puan Durumu → Bildirim

- Transfer isteği/onayı olduğunda **DB trigger** `bildirimler` tablosuna kayıt üretir
  (`trg_transfer_bildirim`).
- Ekran: `BildirimSayfa`(9777). Çan, okunmamış sayısını gösterir; 30 sn'de bir yenilenir.

### 10. Bildirim → Sohbet

- Ekran: `SohbetSayfa`(9831). Lig sayfasındaki "💬 Sohbet" butonundan açılır.
- Tablo: `sohbet_mesajlari`. Yeni mesajlar **Supabase Realtime** ile anında düşer
  (`Db.sohbetDinle`, 598).

### 11. Sohbet → Transfer

- Ekran: oyuncu kartındaki "🔄 Transfer İsteği Gönder" → `TurnuvaSayfa` Yönet sekmesindeki
  "Bekleyen Transfer İstekleri".
- Zincir (tablo `transferler.asama`): `talep` → (lig yöneticisi onayı) → `tamam` → **trigger**
  oyuncuyu yeni takıma taşır (eski üyelik pasif, yeni aktif; kariyer korunur).

### 12. Transfer → Admin

- Ekran: `AdminPanel`(9207). Süper admin: üyeler, lig hakkı verme, tüm bekleyen transferler,
  audit log, analitik (7 günlük aktif kullanıcı), sistem sağlığı.
- Tablolar: `adminler`, `lig_haklari`, `islem_log`, `olay_log`, `transferler`.

---

## Veri iki "dünyada" yaşıyor (önemli mimari not)

ForzaLig'de veri **iki biçimde** tutulur — bunu bilmek kafa karışıklığını önler:

1. **Yerel "turnuva" nesnesi (blob):** Uygulama çalışırken tüm lig belleğinde tek büyük JS
   nesnesi olarak durur (takımlar → oyuncular → maçlar iç içe). Bu, hızlı ekran çizimi içindir.
   Giriş yapan kullanıcıda `kullanici_veri` tablosuna bulut yedeği alınır (`Bulut`, 337).

2. **İlişkisel tablolar (Faz 14):** Aynı bilgi, düzgün tablolara da yazılır (`ligler`, `takimlar`,
   `oyuncular`, `maclar`…). Paylaşım, çoklu cihaz, transfer, KVKK bunun üzerinden çalışır.

`Db.ligKaydet`(649) yerel nesneyi ilişkisele **yazar**; `Db.ligYukle`(715) ilişkiselden yerel
nesneye **çevirir**. Bu köprü sistemin kalbidir.

> **Sonuç:** Aynı maç iki yerde olabilir (maclar tablosu + belleğdeki blob). İkisinin senkron
> kalması uygulamanın sorumluluğunda → tutarlılık riski (bkz. `08-Guvenlik.md`).
