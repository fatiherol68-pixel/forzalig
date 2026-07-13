# 04 — Ekranlar

> Uygulamadaki tüm ekranlar. Her ekran için: ne yapar, kim kullanır, hangi tabloları
> kullanır, eksikleri. Yönlendirme `App` bileşenindeki `switch(nav.sayfa)` bloğundadır
> (`index.html` satır 10642–10671). Ekranlar arası geçiş `git({sayfa:"..."})` ile olur.

---

## Ana gezinme ekranları

| Ekran (rota) | Bileşen | Ne yapar | Kim kullanır | Kullandığı tablolar | Eksik/Not |
|------|---------|----------|--------------|---------------------|-----------|
| **Ana** (`ana`) | `AnaSayfa` (2711) | Aktif liglerin özet kokpiti; hızlı lig geçişi. | Herkes | belleğdeki ligler | — |
| **Keşfet** (`ligler`) | `Kesfet` (2354) | Açık ligleri listeler, lig kurma + transfer pazarı girişi. | Herkes | `paylasilan_ligler` / `ligler` | — |
| **En'ler** (`tumenler`) | `TumEnler` (2530) | Tüm liglerin uç istatistik/rekorları. | Herkes | belleğdeki ligler | — |
| **Profil** (`profil`) | `ProfilSayfa` (2256) | Takipler, sahiplenilen oyuncu, çıkış, admin girişi. | Giriş yapan | `profiller`, `takipler`, `sahiplenmeler` | — |
| **Ayarlar** (`ayar`) | `Ayarlar` (7723) | Tema, yedek, veri üret/sil, rehber, push ayarı. | Giriş yapan (bazısı admin) | — | Yedek/veri araçları sadece admin. |
| **Bildirimler** (`bildirim`) | `BildirimSayfa` (9777) | Bildirim merkezi (oku/sil/tümünü oku). | Giriş yapan | `bildirimler` | — |

---

## Lig / takım / oyuncu ekranları

| Ekran | Bileşen | Ne yapar | Kim | Tablolar | Eksik/Not |
|------|---------|----------|-----|----------|-----------|
| **Lig kur** (`ligkur`) | `LigKur` (7818) | Yeni lig oluşturma sihirbazı. | Hakkı olan üye/admin | `ligler` | Hak (`lig_haklari`) kontrolü RLS'te. |
| **Lig detay** (`turnuva`) | `TurnuvaSayfa` (3250) | Ligin merkezi: genel, puan durumu, fikstür, krallar, en'ler, sohbet, **Yönet**. | Herkes (yönetim: lig yön.) | `ligler`,`takimlar`,`maclar`… | Yönetim aksiyonları `YonetimPaneli`(3583). |
| **Takım yönet** (`takimyonet`) | `TakimYonet` | Kadro yönetimi (oyuncu ekle/düzenle/sil). | Lig yön. / kaptan | `oyuncular`,`oyuncu_takim` | — |
| **Takım profili** (`takim`) | `TakimSayfa` (4591) | Takım kartı, kadro, form, logo yükleme. | Herkes (logo: kaptan) | `takimlar`,`oyuncu_takim` | Logo yazımı doğrudan `sb` (4601). |
| **Oyuncu profili** (`oyuncu`) | `OyuncuSayfa` (4997) | FIFA kartı, kariyer, sahiplenme, transfer isteği, "takım arıyorum", transfer geçmişi. | Herkes (aksiyonlar: sahip/yön.) | `oyuncular`,`transferler` | İki sahiplenme sistemi burada birleşiyor. |

---

## Maç ekranları

| Ekran | Bileşen | Ne yapar | Kim | Tablolar |
|------|---------|----------|-----|----------|
| **Maç detay** (`mac`) | `MacSayfa` (5756) | Maç kadrosu, olayları, MVP oylaması. | Herkes | `maclar`,`mac_olaylari`,`mac_oylari` |
| **Skor gir** (`skorgir`) | `SkorGir` (7953) | Hızlı skor girişi. | Lig yön. | `maclar` |
| **Maç sihirbazı** (`sihirbaz`) | `MacSihirbaz` (8420) | Tek ekranda kadro+skor+olay+ödül. | Lig yön. | `maclar`,`mac_olaylari`,`mac_odulleri` |
| **Kadro/diziliş** (`kurulum`) | `MacKurulum` (6919) | Diziliş ve kadro kurulumu. | Lig yön. | `maclar` |
| **Rating** (`rating`) | `RatingDuzenle` (8372) | Oyunculara maç puanı. | Lig yön. | `maclar` (JSON) |
| **Maç istatistik** (`istatistik`) | `MacIstatistik` (7168) | Topla oynama/şut vb. giriş. | Lig yön. | `maclar` (JSON) |
| **Gazete** (`gazete`) | `MacGazete` (8082) | Maçın gazete formatı özeti. | Herkes | belleğdeki maç |
| **Afiş** (`afis`) | `MacAfis` (8288) | Maç afişi görseli. | Herkes | belleğdeki maç |
| **Skor kartı** (`skorkart`) | `SkorKart` (4325) | Paylaşılabilir 1080×1080 skor kartı PNG. | Herkes | belleğdeki maç |
| **Sezon sonu** (`sezonsonu`) | `SezonSonu` (4410) | Sezon özeti/ödül töreni. | Herkes | belleğdeki lig |
| **Karşılaştır** (`h2h`) | `Karsilastir` (4357) | Oyuncu/takım kafa kafaya. | Herkes | belleğdeki veri |

---

## Sosyal & sistem ekranları

| Ekran | Bileşen | Ne yapar | Kim | Tablolar | Eksik/Not |
|------|---------|----------|-----|----------|-----------|
| **Sohbet** (`sohbet`) | `SohbetSayfa` (9831) | Lig geneli + takım içi realtime sohbet. | Giriş yapan | `sohbet_mesajlari` | Takım kanalı sadece kaptanlara. |
| **Transfer pazarı** (`pazar`) | `PazarSayfa` (9892) | Müsait (takım arayan) oyuncular, şehir filtresi. | Herkes | RPC `pazar_oyuncular` | Kartlar tıklanınca oyuncu sayfasına GİTMİYOR (güvenli seçim). |
| **Takip** (`takip`) | `TakipSayfa` (7234) | Takip edilen lig/oyuncu/takım. | Giriş yapan | `takipler` | — |
| **Admin panel** (`admin`) | `AdminPanel` (9207) | Üyeler, lig hakkı, transfer onay, audit, analitik, sistem sağlığı. | Sadece admin | `adminler`,`lig_haklari`,`islem_log`,`olay_log`,`transferler` | — |
| **Yasal** (`yasal`) | `YasalSayfa` (9162) | KVKK/gizlilik/şartlar metinleri. | Herkes | — | — |

---

## Kapı / overlay ekranları (switch dışında)

Bunlar rota değil; belirli koşulda tüm ekranı kaplar (satır 10680–10689):

| Ekran | Bileşen | Ne zaman |
|------|---------|----------|
| **Splash** | `AcilisSplash` (8954) | İlk açılış (`kapi==="splash"`). |
| **Tanıtım** | `Tanitim` (8985) | Splash sonrası onboarding. |
| **Giriş/Üye ol** | `GirisAuth` (9057) | `kapi==="giris"` / `"uyeol"`. |
| **Davete katıl** | `DavetKatil` (9659) | URL'de `?davet=TOKEN` varsa. |
| **Rehber** | `Rehber` (9019) | İlk girişte bir kez uygulama turu. |
| **Boş durum** | `BosDurum` (8928) | Hiç lig yoksa ana/keşfet'te. |

---

## Genel eksikler (ekran düzeyinde)

- **Katılım/yoklama ("geliyorum")** için net bir ekran akışı zayıf; veri altyapısı (`katilim`) hazır ama UI belirsiz. 🟡
- **Transfer pazarında** oyuncu kartına tıklayınca detay sayfasına gitmiyor (eksik veri riskiyle bilerek kapatıldı). 🟡
- **Push bildirim** ekran/ayarı var ama VAPID anahtarı olmadan pasif. 🟡
- **Hakem / teknik direktör / ödeme** ekranları yok. 🔴

*(Emin değilim: Bazı bileşenlerin (ör. `LisansKarti`, `SkorKart`) tam davranışını isimden/çağrıdan
çıkardım; birebir satır satır gövde doğrulaması her ekran için yapılmadı.)*
