-- ForzaLig LIVE şema dökümü (crkestykdsnmfcmamxav)
-- Postgres 17.6 · public şeması

-- ========== TABLES ==========
CREATE TABLE public.adminler (
  user_id uuid NOT NULL,
  ekleyen uuid,
  eklenme timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.anket_hedef (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  anket_id uuid NOT NULL,
  kapsam text NOT NULL,
  kapsam_id uuid,
  rol_filtre text
);

CREATE TABLE public.anket_katilim (
  anket_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.anket_oy (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  anket_id uuid NOT NULL,
  user_id uuid NOT NULL,
  secenek_id uuid NOT NULL,
  lig_id uuid,
  takim_id uuid,
  created timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.anket_oy_sayac (
  anket_id uuid NOT NULL,
  secenek_id uuid NOT NULL,
  adet integer NOT NULL DEFAULT 0
);

CREATE TABLE public.anket_secenek (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  anket_id uuid NOT NULL,
  metin text NOT NULL,
  sira integer NOT NULL DEFAULT 0
);

CREATE TABLE public.anket_yorum (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  anket_id uuid NOT NULL,
  user_id uuid NOT NULL,
  ad text,
  takim_ad text,
  lig_ad text,
  metin text NOT NULL,
  secenek_gorun boolean NOT NULL DEFAULT false,
  silindi boolean NOT NULL DEFAULT false,
  created timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.anketler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  baslik text NOT NULL,
  aciklama text,
  gorsel text,
  tip text NOT NULL DEFAULT 'tek'::text,
  max_secim integer NOT NULL DEFAULT 1,
  yorum_acik boolean NOT NULL DEFAULT true,
  gizli_oy boolean NOT NULL DEFAULT false,
  oy_degistir boolean NOT NULL DEFAULT false,
  sonuc_gorunur text NOT NULL DEFAULT 'oydan_sonra'::text,
  baslar timestamp with time zone,
  biter timestamp with time zone,
  durum text NOT NULL DEFAULT 'taslak'::text,
  olusturan uuid,
  created timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.bildirim_kuyruk (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hedef_user uuid,
  hedef_lig uuid,
  konu text,
  govde text,
  kanal text NOT NULL DEFAULT 'email'::text,
  durum text NOT NULL DEFAULT 'bekliyor'::text,
  deneme integer NOT NULL DEFAULT 0,
  olusturma timestamp with time zone NOT NULL DEFAULT now(),
  gonderim timestamp with time zone,
  hedef_email text
);

CREATE TABLE public.bildirimler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tip text NOT NULL,
  baslik text NOT NULL,
  metin text,
  link_tip text,
  link_id text,
  okundu boolean NOT NULL DEFAULT false,
  olusma timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.davetler (
  token text NOT NULL DEFAULT replace((gen_random_uuid())::text, '-'::text, ''::text),
  lig_id uuid,
  takim_id uuid,
  tip text NOT NULL,
  olusturan uuid,
  aktif boolean NOT NULL DEFAULT true,
  created timestamp with time zone NOT NULL DEFAULT now(),
  kulup_id uuid
);

CREATE TABLE public.deger_gecmisi (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  onceki numeric,
  yeni numeric,
  fark numeric,
  temel numeric,
  kaynak text,
  aciklama text,
  isleyen uuid,
  tarih timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.destek_talep (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  ad text,
  email text,
  sayfa text,
  mesaj text,
  teshis jsonb,
  durum text NOT NULL DEFAULT 'yeni'::text,
  olusma timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.hata_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mesaj text NOT NULL,
  sayfa text,
  user_id uuid,
  cihaz text,
  olusma timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ilan_yanitlari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ilan_id uuid NOT NULL,
  user_id uuid NOT NULL,
  ad text,
  mesaj text,
  durum text NOT NULL DEFAULT 'bekliyor'::text,
  olusma timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ilk11 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mac_id uuid NOT NULL,
  takim_id uuid NOT NULL,
  player_id uuid NOT NULL
);

CREATE TABLE public.islem_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  kim text,
  islem text NOT NULL,
  detay text,
  created timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.katilim (
  mac_id uuid NOT NULL,
  player_id uuid NOT NULL,
  durum text NOT NULL DEFAULT 'belki'::text,
  guncelleme timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.kullanici_veri (
  user_id uuid NOT NULL,
  veri jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.kulup_oyuncu (
  kulup_id uuid NOT NULL,
  player_id uuid NOT NULL,
  aktif boolean NOT NULL DEFAULT true,
  forma_no integer,
  mevki text,
  katilma timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.kulupler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad text NOT NULL,
  logo text,
  renk text,
  renk2 text,
  td jsonb,
  sahip_user_id uuid,
  evren text,
  durum text NOT NULL DEFAULT 'aktif'::text,
  olusturma timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.lig_basvurulari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  ad_soyad text NOT NULL,
  telefon text NOT NULL,
  email text NOT NULL,
  lig_ad text,
  sehir text,
  takim_sayisi integer,
  mesaj text,
  durum text NOT NULL DEFAULT 'bekliyor'::text,
  olusturma timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.lig_haklari (
  user_id uuid NOT NULL,
  toplam integer NOT NULL DEFAULT 0,
  kullanilan integer NOT NULL DEFAULT 0,
  not_ text,
  guncelleme timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.lig_yardimci (
  lig_id uuid NOT NULL,
  user_id uuid NOT NULL,
  ekleyen uuid,
  tarih timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ligler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  yonetici_id uuid NOT NULL,
  ad text NOT NULL,
  ulke text NOT NULL DEFAULT 'TR'::text,
  sehir text,
  logo text,
  puan_sistemi jsonb NOT NULL DEFAULT '{"galibiyet": 3, "beraberlik": 1, "maglubiyet": 0}'::jsonb,
  averaj_tipi text NOT NULL DEFAULT 'averaj'::text,
  fikstur_tipi text NOT NULL DEFAULT 'tek_devre'::text,
  hedef_takim integer NOT NULL DEFAULT 8,
  kurallar_kilit boolean NOT NULL DEFAULT false,
  durum text NOT NULL DEFAULT 'aktif'::text,
  bitis_tarihi date,
  olusturma timestamp with time zone NOT NULL DEFAULT now(),
  format text DEFAULT 'tek'::text,
  grup_sayi integer DEFAULT 0,
  renk text,
  kisi integer DEFAULT 8,
  ilce text,
  sponsor_ad text,
  sponsor_emoji text,
  silindi boolean NOT NULL DEFAULT false,
  silinme_t timestamp with time zone,
  kurallar text,
  evren text,
  seri_id uuid,
  sezon_no integer NOT NULL DEFAULT 1,
  stat_ozet jsonb
);

CREATE TABLE public.mac_odulleri (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mac_id uuid NOT NULL,
  player_id uuid NOT NULL,
  odul_tip text NOT NULL
);

CREATE TABLE public.mac_olaylari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mac_id uuid NOT NULL,
  player_id uuid NOT NULL,
  takim_id uuid,
  tip text NOT NULL,
  dakika integer,
  adet integer DEFAULT 1,
  ekstra jsonb
);

CREATE TABLE public.mac_oylari (
  lig_slug text NOT NULL,
  mac_id bigint NOT NULL,
  oyveren_id uuid NOT NULL,
  secilen_id bigint,
  secilen_ad text,
  created timestamp with time zone DEFAULT now()
);

CREATE TABLE public.mac_sonuc_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mac_id uuid NOT NULL,
  eski_ev integer,
  eski_dep integer,
  yeni_ev integer,
  yeni_dep integer,
  degistiren uuid,
  zaman timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.maclar (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lig_id uuid NOT NULL,
  ev_takim_id uuid NOT NULL,
  dep_takim_id uuid NOT NULL,
  tarih timestamp with time zone,
  hafta integer,
  ev_skor integer,
  dep_skor integer,
  oynandi boolean NOT NULL DEFAULT false,
  olusturma timestamp with time zone NOT NULL DEFAULT now(),
  tur integer,
  grup integer,
  bye boolean DEFAULT false,
  pen_galip text,
  mvp_player uuid,
  sure integer DEFAULT 60,
  dizilis_ev text,
  dizilis_dep text,
  kadro_ev jsonb,
  kadro_dep jsonb,
  istatistik jsonb,
  ratingler jsonb,
  stad text,
  hakem text,
  olaylar jsonb,
  kaleciler jsonb,
  oduller jsonb,
  mvp text,
  mvp_takim text,
  bildirildi boolean NOT NULL DEFAULT false,
  medya jsonb
);

CREATE TABLE public.olay_log (
  id bigint NOT NULL,
  tip text NOT NULL,
  deger text,
  user_id uuid,
  created timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.oyuncu_kart_foto (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  url text NOT NULL,
  crop jsonb,
  arka_plan text DEFAULT 'orijinal'::text,
  sira integer DEFAULT 0,
  olusma timestamp with time zone DEFAULT now()
);

CREATE TABLE public.oyuncu_takim (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  takim_id uuid NOT NULL,
  lig_id uuid NOT NULL,
  aktif boolean NOT NULL DEFAULT true,
  katilma timestamp with time zone NOT NULL DEFAULT now(),
  ayrilma timestamp with time zone,
  onay text NOT NULL DEFAULT 'onayli'::text,
  ayrilma_sebep text,
  ayrilma_talep boolean NOT NULL DEFAULT false
);

CREATE TABLE public.oyuncular (
  player_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad_soyad text NOT NULL,
  takma_ad text,
  forma_no integer,
  dogum date,
  ayak text,
  boy integer,
  kilo integer,
  telefon text,
  email text,
  tc_pasaport text,
  uyruk text,
  sahip_user_id uuid,
  durum text NOT NULL DEFAULT 'aktif'::text,
  olusturma timestamp with time zone NOT NULL DEFAULT now(),
  poz text,
  ovr integer,
  nitelik jsonb,
  deger numeric,
  saglik text DEFAULT 'Sağlam'::text,
  bolge text,
  renk text,
  foto text,
  musait boolean NOT NULL DEFAULT false,
  musait_sehir text,
  musait_not text,
  musait_t timestamp with time zone,
  kart_rarity text,
  kart_konsept integer,
  deger_kilit boolean NOT NULL DEFAULT false
);

CREATE TABLE public.paylasilan_ligler (
  slug text NOT NULL,
  sahip_id uuid,
  ad text,
  sehir text,
  veri jsonb,
  guncelleme timestamp with time zone DEFAULT now()
);

CREATE TABLE public.pazar_ilanlari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tip text NOT NULL,
  user_id uuid NOT NULL,
  takim_id uuid,
  takim_ad text,
  takim_logo text,
  takim_renk text,
  lig_id uuid,
  lig_ad text,
  sehir text,
  tarih_text text,
  saha text,
  seviye text,
  pozisyon text,
  adet integer DEFAULT 1,
  aciklama text,
  durum text NOT NULL DEFAULT 'aktif'::text,
  olusma timestamp with time zone NOT NULL DEFAULT now(),
  kalici boolean NOT NULL DEFAULT false
);

CREATE TABLE public.profiller (
  user_id uuid NOT NULL,
  email text,
  ad text,
  created timestamp with time zone NOT NULL DEFAULT now(),
  son_gorulme timestamp with time zone,
  rol text,
  roller jsonb NOT NULL DEFAULT '{}'::jsonb,
  sehir text,
  foto text,
  dogum date,
  boy integer,
  kilo integer,
  mevki text,
  ayak text
);

CREATE TABLE public.push_abonelikleri (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  cihaz text,
  olusma timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.sahiplenmeler (
  user_id uuid NOT NULL,
  oyuncu_ad text,
  oyuncu_id bigint,
  lig_slug text,
  lig_ad text,
  created timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sistem_ayar (
  anahtar text NOT NULL,
  deger text,
  guncelleme timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.site_ayar (
  id smallint NOT NULL DEFAULT 1,
  stil_key text NOT NULL DEFAULT 'zumrut'::text,
  renk_key text NOT NULL DEFAULT ''::text,
  guncelleyen uuid,
  guncelleme timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.sohbet_ayar (
  kapsam text NOT NULL,
  kapsam_id uuid NOT NULL,
  yavas_sn integer NOT NULL DEFAULT 0,
  sadece_yonetici boolean NOT NULL DEFAULT false,
  guncelleyen uuid
);

CREATE TABLE public.sohbet_cezalari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tur text NOT NULL,
  kapsam text NOT NULL,
  kapsam_id uuid,
  biter timestamp with time zone,
  sebep text,
  aciklama text,
  ic_not text,
  ilgili_mesaj_id uuid,
  veren_id uuid,
  veren_rol text,
  durum text NOT NULL DEFAULT 'aktif'::text,
  kaldiran_id uuid,
  kaldirma_tarih timestamp with time zone,
  kaldirma_not text,
  created timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.sohbet_ihlal (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tur text NOT NULL,
  mesaj_metni text,
  kapsam text,
  kapsam_id uuid,
  sebep text,
  veren_id uuid,
  created timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.sohbet_mesajlari (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lig_id uuid,
  takim_id uuid,
  user_id uuid,
  ad text NOT NULL,
  metin text NOT NULL,
  silindi boolean NOT NULL DEFAULT false,
  olusma timestamp with time zone NOT NULL DEFAULT now(),
  yanit_id uuid,
  yanit_ad text,
  yanit_metin text,
  sistem boolean NOT NULL DEFAULT false,
  sistem_tip text,
  kart jsonb,
  takim_ad text,
  takim_logo text,
  foto text,
  yonetim boolean NOT NULL DEFAULT false,
  arsiv boolean NOT NULL DEFAULT false,
  kulup_id uuid,
  medya_url text,
  medya_tip text,
  etiketler uuid[],
  gizli boolean NOT NULL DEFAULT false,
  gizli_sebep text
);

CREATE TABLE public.sohbet_okuma (
  user_id uuid NOT NULL,
  lig_id uuid NOT NULL,
  kanal text NOT NULL,
  last_read timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.sohbet_sikayet (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mesaj_id uuid,
  lig_id uuid,
  mesaj_metin text,
  gonderen_ad text,
  sikayet_eden uuid,
  sebep text,
  durum text NOT NULL DEFAULT 'yeni'::text,
  olusma timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.sohbet_tepkileri (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mesaj_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  olusma timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.takimlar (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lig_id uuid NOT NULL,
  ad text NOT NULL,
  logo text,
  forma jsonb,
  yonetici_id uuid,
  durum text NOT NULL DEFAULT 'aktif'::text,
  olusturma timestamp with time zone NOT NULL DEFAULT now(),
  renk text,
  grup integer DEFAULT 0,
  lis_no text,
  renk2 text,
  td jsonb,
  kulup_id uuid
);

CREATE TABLE public.takipler (
  user_id uuid NOT NULL,
  tip text NOT NULL,
  hedef_id text NOT NULL,
  hedef_ad text,
  created timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.transferler (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  lig_id uuid NOT NULL,
  eski_takim_id uuid,
  yeni_takim_id uuid NOT NULL,
  asama text NOT NULL DEFAULT 'talep'::text,
  talep_eden uuid,
  talep_tarihi timestamp with time zone NOT NULL DEFAULT now(),
  oyuncu_kabul_t timestamp with time zone,
  yonetici_onay_t timestamp with time zone,
  tamam_t timestamp with time zone
);

CREATE TABLE public.yasaklilar (
  user_id uuid NOT NULL,
  sebep text,
  yasaklayan uuid,
  tarih timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.yetkiler (
  email text NOT NULL,
  tip text DEFAULT 'onayli'::text,
  created timestamp with time zone DEFAULT now()
);

-- ========== CONSTRAINTS (PK/FK/UNIQUE/CHECK) ==========
ALTER TABLE adminler ADD CONSTRAINT adminler_ekleyen_fkey FOREIGN KEY (ekleyen) REFERENCES auth.users(id);
ALTER TABLE adminler ADD CONSTRAINT adminler_pkey PRIMARY KEY (user_id);
ALTER TABLE adminler ADD CONSTRAINT adminler_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE anket_hedef ADD CONSTRAINT anket_hedef_anket_id_fkey FOREIGN KEY (anket_id) REFERENCES anketler(id) ON DELETE CASCADE;
ALTER TABLE anket_hedef ADD CONSTRAINT anket_hedef_pkey PRIMARY KEY (id);
ALTER TABLE anket_katilim ADD CONSTRAINT anket_katilim_anket_id_fkey FOREIGN KEY (anket_id) REFERENCES anketler(id) ON DELETE CASCADE;
ALTER TABLE anket_katilim ADD CONSTRAINT anket_katilim_pkey PRIMARY KEY (anket_id, user_id);
ALTER TABLE anket_oy ADD CONSTRAINT anket_oy_anket_id_fkey FOREIGN KEY (anket_id) REFERENCES anketler(id) ON DELETE CASCADE;
ALTER TABLE anket_oy ADD CONSTRAINT anket_oy_pkey PRIMARY KEY (id);
ALTER TABLE anket_oy ADD CONSTRAINT anket_oy_secenek_id_fkey FOREIGN KEY (secenek_id) REFERENCES anket_secenek(id) ON DELETE CASCADE;
ALTER TABLE anket_oy_sayac ADD CONSTRAINT anket_oy_sayac_anket_id_fkey FOREIGN KEY (anket_id) REFERENCES anketler(id) ON DELETE CASCADE;
ALTER TABLE anket_oy_sayac ADD CONSTRAINT anket_oy_sayac_pkey PRIMARY KEY (anket_id, secenek_id);
ALTER TABLE anket_oy_sayac ADD CONSTRAINT anket_oy_sayac_secenek_id_fkey FOREIGN KEY (secenek_id) REFERENCES anket_secenek(id) ON DELETE CASCADE;
ALTER TABLE anket_secenek ADD CONSTRAINT anket_secenek_anket_id_fkey FOREIGN KEY (anket_id) REFERENCES anketler(id) ON DELETE CASCADE;
ALTER TABLE anket_secenek ADD CONSTRAINT anket_secenek_pkey PRIMARY KEY (id);
ALTER TABLE anket_yorum ADD CONSTRAINT anket_yorum_anket_id_fkey FOREIGN KEY (anket_id) REFERENCES anketler(id) ON DELETE CASCADE;
ALTER TABLE anket_yorum ADD CONSTRAINT anket_yorum_pkey PRIMARY KEY (id);
ALTER TABLE anketler ADD CONSTRAINT anketler_pkey PRIMARY KEY (id);
ALTER TABLE bildirim_kuyruk ADD CONSTRAINT bildirim_kuyruk_hedef_lig_fkey FOREIGN KEY (hedef_lig) REFERENCES ligler(id) ON DELETE CASCADE;
ALTER TABLE bildirim_kuyruk ADD CONSTRAINT bildirim_kuyruk_hedef_user_fkey FOREIGN KEY (hedef_user) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE bildirim_kuyruk ADD CONSTRAINT bildirim_kuyruk_pkey PRIMARY KEY (id);
ALTER TABLE bildirimler ADD CONSTRAINT bildirimler_pkey PRIMARY KEY (id);
ALTER TABLE bildirimler ADD CONSTRAINT bildirimler_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE davetler ADD CONSTRAINT davetler_kulup_id_fkey FOREIGN KEY (kulup_id) REFERENCES kulupler(id) ON DELETE CASCADE;
ALTER TABLE davetler ADD CONSTRAINT davetler_lig_id_fkey FOREIGN KEY (lig_id) REFERENCES ligler(id) ON DELETE CASCADE;
ALTER TABLE davetler ADD CONSTRAINT davetler_olusturan_fkey FOREIGN KEY (olusturan) REFERENCES auth.users(id);
ALTER TABLE davetler ADD CONSTRAINT davetler_pkey PRIMARY KEY (token);
ALTER TABLE davetler ADD CONSTRAINT davetler_takim_id_fkey FOREIGN KEY (takim_id) REFERENCES takimlar(id) ON DELETE CASCADE;
ALTER TABLE deger_gecmisi ADD CONSTRAINT deger_gecmisi_pkey PRIMARY KEY (id);
ALTER TABLE deger_gecmisi ADD CONSTRAINT deger_gecmisi_player_id_fkey FOREIGN KEY (player_id) REFERENCES oyuncular(player_id) ON DELETE CASCADE;
ALTER TABLE destek_talep ADD CONSTRAINT destek_talep_pkey PRIMARY KEY (id);
ALTER TABLE destek_talep ADD CONSTRAINT destek_talep_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE hata_log ADD CONSTRAINT hata_log_pkey PRIMARY KEY (id);
ALTER TABLE ilan_yanitlari ADD CONSTRAINT ilan_yanitlari_ilan_id_fkey FOREIGN KEY (ilan_id) REFERENCES pazar_ilanlari(id) ON DELETE CASCADE;
ALTER TABLE ilan_yanitlari ADD CONSTRAINT ilan_yanitlari_ilan_id_user_id_key UNIQUE (ilan_id, user_id);
ALTER TABLE ilan_yanitlari ADD CONSTRAINT ilan_yanitlari_pkey PRIMARY KEY (id);
ALTER TABLE ilan_yanitlari ADD CONSTRAINT ilan_yanitlari_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ilk11 ADD CONSTRAINT ilk11_mac_id_fkey FOREIGN KEY (mac_id) REFERENCES maclar(id) ON DELETE CASCADE;
ALTER TABLE ilk11 ADD CONSTRAINT ilk11_pkey PRIMARY KEY (id);
ALTER TABLE ilk11 ADD CONSTRAINT ilk11_player_id_fkey FOREIGN KEY (player_id) REFERENCES oyuncular(player_id);
ALTER TABLE ilk11 ADD CONSTRAINT ilk11_takim_id_fkey FOREIGN KEY (takim_id) REFERENCES takimlar(id);
ALTER TABLE islem_log ADD CONSTRAINT islem_log_pkey PRIMARY KEY (id);
ALTER TABLE islem_log ADD CONSTRAINT islem_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE katilim ADD CONSTRAINT katilim_mac_id_fkey FOREIGN KEY (mac_id) REFERENCES maclar(id) ON DELETE CASCADE;
ALTER TABLE katilim ADD CONSTRAINT katilim_pkey PRIMARY KEY (mac_id, player_id);
ALTER TABLE katilim ADD CONSTRAINT katilim_player_id_fkey FOREIGN KEY (player_id) REFERENCES oyuncular(player_id) ON DELETE CASCADE;
ALTER TABLE kullanici_veri ADD CONSTRAINT kullanici_veri_pkey PRIMARY KEY (user_id);
ALTER TABLE kullanici_veri ADD CONSTRAINT kullanici_veri_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE kulup_oyuncu ADD CONSTRAINT kulup_oyuncu_kulup_id_fkey FOREIGN KEY (kulup_id) REFERENCES kulupler(id) ON DELETE CASCADE;
ALTER TABLE kulup_oyuncu ADD CONSTRAINT kulup_oyuncu_pkey PRIMARY KEY (kulup_id, player_id);
ALTER TABLE kulup_oyuncu ADD CONSTRAINT kulup_oyuncu_player_id_fkey FOREIGN KEY (player_id) REFERENCES oyuncular(player_id) ON DELETE CASCADE;
ALTER TABLE kulupler ADD CONSTRAINT kulupler_pkey PRIMARY KEY (id);
ALTER TABLE kulupler ADD CONSTRAINT kulupler_sahip_user_id_fkey FOREIGN KEY (sahip_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE lig_basvurulari ADD CONSTRAINT lig_basvurulari_pkey PRIMARY KEY (id);
ALTER TABLE lig_basvurulari ADD CONSTRAINT lig_basvurulari_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE lig_haklari ADD CONSTRAINT lig_haklari_pkey PRIMARY KEY (user_id);
ALTER TABLE lig_haklari ADD CONSTRAINT lig_haklari_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lig_yardimci ADD CONSTRAINT lig_yardimci_lig_id_fkey FOREIGN KEY (lig_id) REFERENCES ligler(id) ON DELETE CASCADE;
ALTER TABLE lig_yardimci ADD CONSTRAINT lig_yardimci_pkey PRIMARY KEY (lig_id, user_id);
ALTER TABLE ligler ADD CONSTRAINT ligler_pkey PRIMARY KEY (id);
ALTER TABLE ligler ADD CONSTRAINT ligler_yonetici_id_fkey FOREIGN KEY (yonetici_id) REFERENCES auth.users(id);
ALTER TABLE mac_odulleri ADD CONSTRAINT mac_odulleri_mac_id_fkey FOREIGN KEY (mac_id) REFERENCES maclar(id) ON DELETE CASCADE;
ALTER TABLE mac_odulleri ADD CONSTRAINT mac_odulleri_pkey PRIMARY KEY (id);
ALTER TABLE mac_odulleri ADD CONSTRAINT mac_odulleri_player_id_fkey FOREIGN KEY (player_id) REFERENCES oyuncular(player_id);
ALTER TABLE mac_olaylari ADD CONSTRAINT mac_olaylari_mac_id_fkey FOREIGN KEY (mac_id) REFERENCES maclar(id) ON DELETE CASCADE;
ALTER TABLE mac_olaylari ADD CONSTRAINT mac_olaylari_pkey PRIMARY KEY (id);
ALTER TABLE mac_olaylari ADD CONSTRAINT mac_olaylari_player_id_fkey FOREIGN KEY (player_id) REFERENCES oyuncular(player_id);
ALTER TABLE mac_olaylari ADD CONSTRAINT mac_olaylari_takim_id_fkey FOREIGN KEY (takim_id) REFERENCES takimlar(id);
ALTER TABLE mac_oylari ADD CONSTRAINT mac_oylari_oyveren_id_fkey FOREIGN KEY (oyveren_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE mac_oylari ADD CONSTRAINT mac_oylari_pkey PRIMARY KEY (lig_slug, mac_id, oyveren_id);
ALTER TABLE mac_sonuc_log ADD CONSTRAINT mac_sonuc_log_degistiren_fkey FOREIGN KEY (degistiren) REFERENCES auth.users(id);
ALTER TABLE mac_sonuc_log ADD CONSTRAINT mac_sonuc_log_mac_id_fkey FOREIGN KEY (mac_id) REFERENCES maclar(id) ON DELETE CASCADE;
ALTER TABLE mac_sonuc_log ADD CONSTRAINT mac_sonuc_log_pkey PRIMARY KEY (id);
ALTER TABLE maclar ADD CONSTRAINT chk_mac_skor CHECK ((((ev_skor IS NULL) OR (ev_skor >= 0)) AND ((dep_skor IS NULL) OR (dep_skor >= 0)))) NOT VALID;
ALTER TABLE maclar ADD CONSTRAINT maclar_dep_takim_id_fkey FOREIGN KEY (dep_takim_id) REFERENCES takimlar(id);
ALTER TABLE maclar ADD CONSTRAINT maclar_ev_takim_id_fkey FOREIGN KEY (ev_takim_id) REFERENCES takimlar(id);
ALTER TABLE maclar ADD CONSTRAINT maclar_lig_id_fkey FOREIGN KEY (lig_id) REFERENCES ligler(id) ON DELETE CASCADE;
ALTER TABLE maclar ADD CONSTRAINT maclar_mvp_player_fkey FOREIGN KEY (mvp_player) REFERENCES oyuncular(player_id);
ALTER TABLE maclar ADD CONSTRAINT maclar_pkey PRIMARY KEY (id);
ALTER TABLE olay_log ADD CONSTRAINT olay_log_pkey PRIMARY KEY (id);
ALTER TABLE oyuncu_kart_foto ADD CONSTRAINT oyuncu_kart_foto_pkey PRIMARY KEY (id);
ALTER TABLE oyuncu_kart_foto ADD CONSTRAINT oyuncu_kart_foto_player_id_fkey FOREIGN KEY (player_id) REFERENCES oyuncular(player_id) ON DELETE CASCADE;
ALTER TABLE oyuncu_takim ADD CONSTRAINT oyuncu_takim_lig_id_fkey FOREIGN KEY (lig_id) REFERENCES ligler(id) ON DELETE CASCADE;
ALTER TABLE oyuncu_takim ADD CONSTRAINT oyuncu_takim_pkey PRIMARY KEY (id);
ALTER TABLE oyuncu_takim ADD CONSTRAINT oyuncu_takim_player_id_fkey FOREIGN KEY (player_id) REFERENCES oyuncular(player_id) ON DELETE CASCADE;
ALTER TABLE oyuncu_takim ADD CONSTRAINT oyuncu_takim_takim_id_fkey FOREIGN KEY (takim_id) REFERENCES takimlar(id) ON DELETE CASCADE;
ALTER TABLE oyuncular ADD CONSTRAINT chk_oyuncu_boy CHECK (((boy IS NULL) OR ((boy >= 100) AND (boy <= 250)))) NOT VALID;
ALTER TABLE oyuncular ADD CONSTRAINT chk_oyuncu_kilo CHECK (((kilo IS NULL) OR ((kilo >= 30) AND (kilo <= 200)))) NOT VALID;
ALTER TABLE oyuncular ADD CONSTRAINT oyuncular_pkey PRIMARY KEY (player_id);
ALTER TABLE oyuncular ADD CONSTRAINT oyuncular_sahip_user_id_fkey FOREIGN KEY (sahip_user_id) REFERENCES auth.users(id);
ALTER TABLE paylasilan_ligler ADD CONSTRAINT paylasilan_ligler_pkey PRIMARY KEY (slug);
ALTER TABLE paylasilan_ligler ADD CONSTRAINT paylasilan_ligler_sahip_id_fkey FOREIGN KEY (sahip_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pazar_ilanlari ADD CONSTRAINT pazar_ilanlari_lig_id_fkey FOREIGN KEY (lig_id) REFERENCES ligler(id) ON DELETE SET NULL;
ALTER TABLE pazar_ilanlari ADD CONSTRAINT pazar_ilanlari_pkey PRIMARY KEY (id);
ALTER TABLE pazar_ilanlari ADD CONSTRAINT pazar_ilanlari_takim_id_fkey FOREIGN KEY (takim_id) REFERENCES takimlar(id) ON DELETE SET NULL;
ALTER TABLE pazar_ilanlari ADD CONSTRAINT pazar_ilanlari_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE profiller ADD CONSTRAINT chk_profil_boy CHECK (((boy IS NULL) OR ((boy >= 100) AND (boy <= 250)))) NOT VALID;
ALTER TABLE profiller ADD CONSTRAINT chk_profil_kilo CHECK (((kilo IS NULL) OR ((kilo >= 30) AND (kilo <= 200)))) NOT VALID;
ALTER TABLE profiller ADD CONSTRAINT profiller_pkey PRIMARY KEY (user_id);
ALTER TABLE profiller ADD CONSTRAINT profiller_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE push_abonelikleri ADD CONSTRAINT push_abonelikleri_endpoint_key UNIQUE (endpoint);
ALTER TABLE push_abonelikleri ADD CONSTRAINT push_abonelikleri_pkey PRIMARY KEY (id);
ALTER TABLE push_abonelikleri ADD CONSTRAINT push_abonelikleri_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sahiplenmeler ADD CONSTRAINT sahiplenmeler_pkey PRIMARY KEY (user_id);
ALTER TABLE sahiplenmeler ADD CONSTRAINT sahiplenmeler_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sistem_ayar ADD CONSTRAINT sistem_ayar_pkey PRIMARY KEY (anahtar);
ALTER TABLE site_ayar ADD CONSTRAINT site_ayar_pkey PRIMARY KEY (id);
ALTER TABLE site_ayar ADD CONSTRAINT site_ayar_tek_satir CHECK ((id = 1));
ALTER TABLE sohbet_ayar ADD CONSTRAINT sohbet_ayar_pkey PRIMARY KEY (kapsam, kapsam_id);
ALTER TABLE sohbet_cezalari ADD CONSTRAINT sohbet_cezalari_pkey PRIMARY KEY (id);
ALTER TABLE sohbet_ihlal ADD CONSTRAINT sohbet_ihlal_pkey PRIMARY KEY (id);
ALTER TABLE sohbet_mesajlari ADD CONSTRAINT sohbet_mesajlari_kulup_id_fkey FOREIGN KEY (kulup_id) REFERENCES kulupler(id) ON DELETE CASCADE;
ALTER TABLE sohbet_mesajlari ADD CONSTRAINT sohbet_mesajlari_lig_id_fkey FOREIGN KEY (lig_id) REFERENCES ligler(id) ON DELETE CASCADE;
ALTER TABLE sohbet_mesajlari ADD CONSTRAINT sohbet_mesajlari_pkey PRIMARY KEY (id);
ALTER TABLE sohbet_mesajlari ADD CONSTRAINT sohbet_mesajlari_takim_id_fkey FOREIGN KEY (takim_id) REFERENCES takimlar(id) ON DELETE CASCADE;
ALTER TABLE sohbet_mesajlari ADD CONSTRAINT sohbet_mesajlari_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sohbet_mesajlari ADD CONSTRAINT sohbet_mesajlari_yanit_id_fkey FOREIGN KEY (yanit_id) REFERENCES sohbet_mesajlari(id) ON DELETE SET NULL;
ALTER TABLE sohbet_okuma ADD CONSTRAINT sohbet_okuma_lig_id_fkey FOREIGN KEY (lig_id) REFERENCES ligler(id) ON DELETE CASCADE;
ALTER TABLE sohbet_okuma ADD CONSTRAINT sohbet_okuma_pkey PRIMARY KEY (user_id, lig_id, kanal);
ALTER TABLE sohbet_okuma ADD CONSTRAINT sohbet_okuma_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sohbet_sikayet ADD CONSTRAINT sohbet_sikayet_mesaj_id_fkey FOREIGN KEY (mesaj_id) REFERENCES sohbet_mesajlari(id) ON DELETE SET NULL;
ALTER TABLE sohbet_sikayet ADD CONSTRAINT sohbet_sikayet_pkey PRIMARY KEY (id);
ALTER TABLE sohbet_sikayet ADD CONSTRAINT sohbet_sikayet_sikayet_eden_fkey FOREIGN KEY (sikayet_eden) REFERENCES auth.users(id);
ALTER TABLE sohbet_tepkileri ADD CONSTRAINT sohbet_tepkileri_mesaj_id_fkey FOREIGN KEY (mesaj_id) REFERENCES sohbet_mesajlari(id) ON DELETE CASCADE;
ALTER TABLE sohbet_tepkileri ADD CONSTRAINT sohbet_tepkileri_mesaj_id_user_id_emoji_key UNIQUE (mesaj_id, user_id, emoji);
ALTER TABLE sohbet_tepkileri ADD CONSTRAINT sohbet_tepkileri_pkey PRIMARY KEY (id);
ALTER TABLE sohbet_tepkileri ADD CONSTRAINT sohbet_tepkileri_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE takimlar ADD CONSTRAINT takimlar_kulup_id_fkey FOREIGN KEY (kulup_id) REFERENCES kulupler(id) ON DELETE SET NULL;
ALTER TABLE takimlar ADD CONSTRAINT takimlar_lig_id_fkey FOREIGN KEY (lig_id) REFERENCES ligler(id) ON DELETE CASCADE;
ALTER TABLE takimlar ADD CONSTRAINT takimlar_pkey PRIMARY KEY (id);
ALTER TABLE takimlar ADD CONSTRAINT takimlar_yonetici_id_fkey FOREIGN KEY (yonetici_id) REFERENCES auth.users(id);
ALTER TABLE takipler ADD CONSTRAINT takipler_pkey PRIMARY KEY (user_id, tip, hedef_id);
ALTER TABLE takipler ADD CONSTRAINT takipler_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE transferler ADD CONSTRAINT transferler_eski_takim_id_fkey FOREIGN KEY (eski_takim_id) REFERENCES takimlar(id);
ALTER TABLE transferler ADD CONSTRAINT transferler_lig_id_fkey FOREIGN KEY (lig_id) REFERENCES ligler(id);
ALTER TABLE transferler ADD CONSTRAINT transferler_pkey PRIMARY KEY (id);
ALTER TABLE transferler ADD CONSTRAINT transferler_player_id_fkey FOREIGN KEY (player_id) REFERENCES oyuncular(player_id);
ALTER TABLE transferler ADD CONSTRAINT transferler_talep_eden_fkey FOREIGN KEY (talep_eden) REFERENCES auth.users(id);
ALTER TABLE transferler ADD CONSTRAINT transferler_yeni_takim_id_fkey FOREIGN KEY (yeni_takim_id) REFERENCES takimlar(id);
ALTER TABLE yasaklilar ADD CONSTRAINT yasaklilar_pkey PRIMARY KEY (user_id);
ALTER TABLE yetkiler ADD CONSTRAINT yetkiler_pkey PRIMARY KEY (email);

-- ========== INDEXES (kısıt-dışı) ==========
CREATE INDEX ix_anket_hedef ON public.anket_hedef USING btree (anket_id);
CREATE INDEX ix_anket_oy_a ON public.anket_oy USING btree (anket_id);
CREATE UNIQUE INDEX ux_anket_oy ON public.anket_oy USING btree (anket_id, user_id, secenek_id);
CREATE INDEX ix_anket_secenek ON public.anket_secenek USING btree (anket_id, sira);
CREATE INDEX ix_anket_yorum ON public.anket_yorum USING btree (anket_id, created);
CREATE INDEX ix_anket_durum ON public.anketler USING btree (durum);
CREATE INDEX ix_kuyruk_durum ON public.bildirim_kuyruk USING btree (durum, olusturma);
CREATE INDEX ix_bildirim_user ON public.bildirimler USING btree (user_id, okundu, olusma DESC);
CREATE INDEX ix_davet_kulup ON public.davetler USING btree (kulup_id);
CREATE INDEX ix_davet_lig ON public.davetler USING btree (lig_id);
CREATE INDEX ix_deger_gecmisi_player ON public.deger_gecmisi USING btree (player_id);
CREATE INDEX ix_destek_durum ON public.destek_talep USING btree (durum, olusma DESC);
CREATE INDEX ix_yanit_ilan ON public.ilan_yanitlari USING btree (ilan_id);
CREATE INDEX ix_ilk11_mac ON public.ilk11 USING btree (mac_id);
CREATE INDEX ix_log_created ON public.islem_log USING btree (created DESC);
CREATE INDEX ix_kulup_oyuncu_player ON public.kulup_oyuncu USING btree (player_id);
CREATE INDEX ix_kulupler_evren ON public.kulupler USING btree (evren);
CREATE INDEX ix_kulupler_sahip ON public.kulupler USING btree (sahip_user_id);
CREATE INDEX ix_basvuru_durum ON public.lig_basvurulari USING btree (durum, olusturma DESC);
CREATE UNIQUE INDEX ux_basvuru_aktif ON public.lig_basvurulari USING btree (user_id) WHERE ((durum = ANY (ARRAY['bekliyor'::text, 'arandi'::text])) AND (user_id IS NOT NULL));
CREATE INDEX ix_ligler_evren ON public.ligler USING btree (evren);
CREATE INDEX ix_ligler_seri ON public.ligler USING btree (seri_id);
CREATE INDEX ix_ligler_ulke_durum ON public.ligler USING btree (ulke, durum);
CREATE INDEX ix_ligler_yonetici ON public.ligler USING btree (yonetici_id);
CREATE INDEX ix_odul_mac ON public.mac_odulleri USING btree (mac_id);
CREATE INDEX ix_odul_player ON public.mac_odulleri USING btree (player_id);
CREATE INDEX ix_olay_mac ON public.mac_olaylari USING btree (mac_id);
CREATE INDEX ix_olay_player ON public.mac_olaylari USING btree (player_id);
CREATE INDEX ix_log_mac ON public.mac_sonuc_log USING btree (mac_id);
CREATE INDEX ix_maclar_lig ON public.maclar USING btree (lig_id);
CREATE INDEX ix_olay_tip_created ON public.olay_log USING btree (tip, created DESC);
CREATE INDEX ix_kart_foto_player ON public.oyuncu_kart_foto USING btree (player_id, sira);
CREATE INDEX ix_ot_ayrilma_talep ON public.oyuncu_takim USING btree (lig_id) WHERE ayrilma_talep;
CREATE INDEX ix_ot_bekleyen ON public.oyuncu_takim USING btree (lig_id, onay) WHERE (onay = 'bekliyor'::text);
CREATE INDEX ix_ot_player ON public.oyuncu_takim USING btree (player_id);
CREATE INDEX ix_ot_takim ON public.oyuncu_takim USING btree (takim_id);
CREATE UNIQUE INDEX ux_ot_tek_aktif ON public.oyuncu_takim USING btree (player_id, lig_id) WHERE aktif;
CREATE INDEX ix_oyuncu_musait ON public.oyuncular USING btree (musait) WHERE musait;
CREATE INDEX ix_oyuncular_sahip ON public.oyuncular USING btree (sahip_user_id);
CREATE INDEX ix_ilan_tip ON public.pazar_ilanlari USING btree (tip, durum, olusma DESC);
CREATE INDEX ix_ilan_user ON public.pazar_ilanlari USING btree (user_id);
CREATE INDEX ix_profil_songor ON public.profiller USING btree (son_gorulme);
CREATE INDEX ix_push_user ON public.push_abonelikleri USING btree (user_id);
CREATE INDEX ix_sohbet_ceza_kaps ON public.sohbet_cezalari USING btree (kapsam, kapsam_id, durum);
CREATE INDEX ix_sohbet_ceza_user ON public.sohbet_cezalari USING btree (user_id, durum);
CREATE INDEX ix_sohbet_ihlal_user ON public.sohbet_ihlal USING btree (user_id, created);
CREATE INDEX ix_sohbet_arsiv ON public.sohbet_mesajlari USING btree (lig_id, takim_id, arsiv, olusma);
CREATE INDEX ix_sohbet_kanal ON public.sohbet_mesajlari USING btree (lig_id, takim_id, olusma);
CREATE INDEX ix_sohbet_kanal2 ON public.sohbet_mesajlari USING btree (lig_id, takim_id, olusma DESC);
CREATE INDEX ix_sohbet_kulup ON public.sohbet_mesajlari USING btree (kulup_id, olusma);
CREATE INDEX ix_sikayet_durum ON public.sohbet_sikayet USING btree (durum, olusma DESC);
CREATE INDEX ix_tepki_mesaj ON public.sohbet_tepkileri USING btree (mesaj_id);
CREATE INDEX ix_takimlar_kulup ON public.takimlar USING btree (kulup_id);
CREATE INDEX ix_takimlar_lig ON public.takimlar USING btree (lig_id);
CREATE INDEX ix_takip_hedef ON public.takipler USING btree (tip, hedef_id);
CREATE INDEX ix_transfer_lig ON public.transferler USING btree (lig_id, asama);
CREATE INDEX ix_transfer_player ON public.transferler USING btree (player_id);

-- ========== FUNCTIONS / RPC ==========
CREATE OR REPLACE FUNCTION public.admin_duyuru_okunma()
 RETURNS TABLE(baslik text, metin text, toplam bigint, okunan bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- yalnızca süper admin çağırabilir
  if not exists (select 1 from adminler a where a.user_id = auth.uid()) then
    raise exception 'yetki yok';
  end if;

  return query
    select b.baslik,
           b.metin,
           count(*)::bigint                              as toplam,
           count(*) filter (where b.okundu)::bigint      as okunan
    from bildirimler b
    where b.tip = 'duyuru'
    group by b.baslik, b.metin, date_trunc('minute', b.olusma)
    order by max(b.olusma) desc
    limit 50;
end;
$function$


CREATE OR REPLACE FUNCTION public.admin_mi()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists(select 1 from public.adminler a where a.user_id = auth.uid());
$function$


CREATE OR REPLACE FUNCTION public.admin_toplu_bildirim(p_tip text, p_id uuid, p_baslik text, p_metin text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_count int := 0;
begin
  if not public.admin_mi() then raise exception 'Yetkisiz — sadece süper admin.'; end if;
  if p_baslik is null or length(trim(p_baslik)) = 0 then raise exception 'Başlık gerekli.'; end if;
  if p_tip = 'herkes' then
    insert into public.bildirimler(user_id, tip, baslik, metin)
      select user_id, 'duyuru', p_baslik, p_metin from public.profiller;
    get diagnostics v_count = row_count;
  elsif p_tip = 'kisi' then
    if p_id is null then raise exception 'Kişi seçilmedi.'; end if;
    insert into public.bildirimler(user_id, tip, baslik, metin) values (p_id, 'duyuru', p_baslik, p_metin);
    v_count := 1;
  elsif p_tip = 'lig' then
    if p_id is null then raise exception 'Lig seçilmedi.'; end if;
    insert into public.bildirimler(user_id, tip, baslik, metin, link_tip, link_id)
      select distinct o.sahip_user_id, 'duyuru', p_baslik, p_metin, 'turnuva', p_id::text
      from public.oyuncu_takim ot join public.oyuncular o on o.player_id = ot.player_id
      where ot.lig_id = p_id and ot.aktif and o.sahip_user_id is not null;
    get diagnostics v_count = row_count;
    insert into public.bildirimler(user_id, tip, baslik, metin, link_tip, link_id)
      select g.yonetici_id, 'duyuru', p_baslik, p_metin, 'turnuva', p_id::text
      from public.ligler g where g.id = p_id and g.yonetici_id is not null;
  elsif p_tip = 'takim' then
    if p_id is null then raise exception 'Takım seçilmedi.'; end if;
    insert into public.bildirimler(user_id, tip, baslik, metin)
      select distinct o.sahip_user_id, 'duyuru', p_baslik, p_metin
      from public.oyuncu_takim ot join public.oyuncular o on o.player_id = ot.player_id
      where ot.takim_id = p_id and ot.aktif and o.sahip_user_id is not null;
    get diagnostics v_count = row_count;
  else raise exception 'Geçersiz hedef tipi.'; end if;
  return v_count;
end $function$


CREATE OR REPLACE FUNCTION public.anket_durum(p_id uuid, p_durum text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.anketler set durum=p_durum where id=p_id;
end $function$


CREATE OR REPLACE FUNCTION public.anket_guncelle(p_id uuid, p_baslik text, p_aciklama text, p_biter timestamp with time zone, p_yorum boolean, p_sonuc text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.anketler set baslik=coalesce(p_baslik,baslik), aciklama=p_aciklama, biter=p_biter,
    yorum_acik=coalesce(p_yorum,yorum_acik), sonuc_gorunur=coalesce(p_sonuc,sonuc_gorunur) where id=p_id;
end $function$


CREATE OR REPLACE FUNCTION public.anket_hedef_say(p_anket uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select count(*)::int from public.anket_hedef_uid(p_anket);
$function$


CREATE OR REPLACE FUNCTION public.anket_hedef_uid(p_anket uuid)
 RETURNS SETOF uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  return query
  select distinct u from (
    select p.user_id u from public.profiller p
      where exists(select 1 from public.anket_hedef h where h.anket_id=p_anket and h.kapsam='tum')
    union select o.sahip_user_id from public.oyuncu_takim ot join public.oyuncular o on o.player_id=ot.player_id
      where ot.aktif and ot.lig_id in (select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam in ('lig','lig_takimlari'))
    union select t.yonetici_id from public.takimlar t
      where t.lig_id in (select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam in ('lig','lig_takimlari'))
    union select l.yonetici_id from public.ligler l
      where l.id in (select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam in ('lig','lig_takimlari'))
    union select o.sahip_user_id from public.oyuncu_takim ot join public.oyuncular o on o.player_id=ot.player_id
      where ot.aktif and ot.takim_id in (select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam='takim')
    union select t.yonetici_id from public.takimlar t
      where t.id in (select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam='takim')
    union select kapsam_id from public.anket_hedef where anket_id=p_anket and kapsam='kullanici'
    union select t.yonetici_id from public.takimlar t where exists(select 1 from public.anket_hedef h where h.anket_id=p_anket and h.kapsam='rol' and h.rol_filtre='kaptan')
    union select l.yonetici_id from public.ligler l where exists(select 1 from public.anket_hedef h where h.anket_id=p_anket and h.kapsam='rol' and h.rol_filtre='lig_yon')
    union select o.sahip_user_id from public.oyuncu_takim ot join public.oyuncular o on o.player_id=ot.player_id
      where ot.aktif and exists(select 1 from public.anket_hedef h where h.anket_id=p_anket and h.kapsam='rol' and h.rol_filtre='aktif')
  ) q where u is not null;
end $function$


CREATE OR REPLACE FUNCTION public.anket_hedefte_mi(p_anket uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists(
    select 1 from public.anket_hedef h where h.anket_id=p_anket and (
         h.kapsam='tum'
      or (h.kapsam in ('lig','lig_takimlari') and public.lig_uyesi(h.kapsam_id))
      or (h.kapsam='takim' and public.takim_sohbet_erisim(h.kapsam_id))
      or (h.kapsam='kullanici' and h.kapsam_id=auth.uid())
      or (h.kapsam='rol' and (
            (h.rol_filtre='kaptan'  and exists(select 1 from public.takimlar t where t.yonetici_id=auth.uid()))
         or (h.rol_filtre='lig_yon' and exists(select 1 from public.ligler   l where l.yonetici_id=auth.uid()))
         or (h.rol_filtre='aktif'   and exists(select 1 from public.oyuncu_takim ot join public.oyuncular o on o.player_id=ot.player_id where ot.aktif and o.sahip_user_id=auth.uid()))
      ))
    )
  );
$function$


CREATE OR REPLACE FUNCTION public.anket_olustur(p_baslik text, p_aciklama text DEFAULT NULL::text, p_gorsel text DEFAULT NULL::text, p_tip text DEFAULT 'tek'::text, p_max integer DEFAULT 1, p_yorum boolean DEFAULT true, p_gizli boolean DEFAULT false, p_oy_degistir boolean DEFAULT true, p_sonuc text DEFAULT 'oydan_sonra'::text, p_baslar timestamp with time zone DEFAULT NULL::timestamp with time zone, p_biter timestamp with time zone DEFAULT NULL::timestamp with time zone, p_durum text DEFAULT 'taslak'::text, p_secenekler text[] DEFAULT '{}'::text[], p_hedefler jsonb DEFAULT '[]'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; s text; i int:=0; v_sid uuid; h jsonb;
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  if coalesce(array_length(p_secenekler,1),0) < 2 then raise exception 'En az 2 seçenek gerekli'; end if;
  if array_length(p_secenekler,1) > 10 then raise exception 'En fazla 10 seçenek'; end if;
  insert into public.anketler(baslik,aciklama,gorsel,tip,max_secim,yorum_acik,gizli_oy,oy_degistir,sonuc_gorunur,baslar,biter,durum,olusturan)
    values(p_baslik,p_aciklama,p_gorsel,coalesce(p_tip,'tek'),greatest(1,coalesce(p_max,1)),coalesce(p_yorum,true),coalesce(p_gizli,false),coalesce(p_oy_degistir,true),coalesce(p_sonuc,'oydan_sonra'),p_baslar,p_biter,coalesce(p_durum,'taslak'),auth.uid())
    returning id into v_id;
  foreach s in array p_secenekler loop
    insert into public.anket_secenek(anket_id,metin,sira) values(v_id,s,i) returning id into v_sid;
    insert into public.anket_oy_sayac(anket_id,secenek_id,adet) values(v_id,v_sid,0) on conflict do nothing;
    i:=i+1;
  end loop;
  for h in select value from jsonb_array_elements(coalesce(p_hedefler,'[]'::jsonb)) loop
    insert into public.anket_hedef(anket_id,kapsam,kapsam_id,rol_filtre)
      values(v_id, h->>'kapsam', nullif(h->>'kapsam_id','')::uuid, nullif(h->>'rol_filtre',''));
  end loop;
  return v_id;
end $function$


CREATE OR REPLACE FUNCTION public.anket_oy_ver(p_anket uuid, p_secenekler uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare a public.anketler; n int; s uuid; v_lig uuid; v_takim uuid;
begin
  select * into a from public.anketler where id=p_anket;
  if a.id is null then raise exception 'Anket bulunamadı'; end if;
  if a.durum<>'yayin' then raise exception 'Anket oya kapalı'; end if;
  if a.baslar is not null and a.baslar>now() then raise exception 'Anket henüz başlamadı'; end if;
  if a.biter  is not null and a.biter<=now() then raise exception 'Anket süresi doldu'; end if;
  if not public.anket_hedefte_mi(p_anket) then raise exception 'Bu anket size açık değil'; end if;
  n := coalesce(array_length(p_secenekler,1),0);
  if n=0 then raise exception 'Seçenek seçilmedi'; end if;
  if a.tip='tek'  and n>1 then raise exception 'Bu ankette tek seçim yapılır'; end if;
  if a.tip='coklu' and n>a.max_secim then raise exception 'En fazla % seçim yapılabilir', a.max_secim; end if;
  if exists(select 1 from unnest(p_secenekler) x where x not in (select id from public.anket_secenek where anket_id=p_anket)) then
    raise exception 'Geçersiz seçenek'; end if;
  if a.gizli_oy then
    if exists(select 1 from public.anket_katilim where anket_id=p_anket and user_id=auth.uid()) then
      raise exception 'Gizli ankette oy değiştirilemez'; end if;
    insert into public.anket_katilim(anket_id,user_id) values(p_anket,auth.uid());
    foreach s in array p_secenekler loop
      update public.anket_oy_sayac set adet=adet+1 where anket_id=p_anket and secenek_id=s;
    end loop;
  else
    if not a.oy_degistir and exists(select 1 from public.anket_katilim where anket_id=p_anket and user_id=auth.uid()) then
      raise exception 'Bu ankette oy değiştirilemez'; end if;
    select ot.lig_id, ot.takim_id into v_lig, v_takim from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id=ot.player_id where o.sahip_user_id=auth.uid() and ot.aktif limit 1;
    update public.anket_oy_sayac c set adet=greatest(0,adet-1)
      where c.anket_id=p_anket and c.secenek_id in (select secenek_id from public.anket_oy where anket_id=p_anket and user_id=auth.uid());
    delete from public.anket_oy where anket_id=p_anket and user_id=auth.uid();
    insert into public.anket_katilim(anket_id,user_id) values(p_anket,auth.uid()) on conflict do nothing;
    foreach s in array p_secenekler loop
      insert into public.anket_oy(anket_id,user_id,secenek_id,lig_id,takim_id) values(p_anket,auth.uid(),s,v_lig,v_takim) on conflict do nothing;
      update public.anket_oy_sayac set adet=adet+1 where anket_id=p_anket and secenek_id=s;
    end loop;
  end if;
  return jsonb_build_object('ok',true);
end $function$


CREATE OR REPLACE FUNCTION public.anket_oy_vermeyenler(p_anket uuid)
 RETURNS SETOF uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  return query
    select u from public.anket_hedef_uid(p_anket) u
    where u not in (select user_id from public.anket_katilim where anket_id=p_anket)
      and u not in (select user_id from public.anket_oy where anket_id=p_anket);
end $function$


CREATE OR REPLACE FUNCTION public.anket_sonuc(p_anket uuid)
 RETURNS TABLE(secenek_id uuid, metin text, sira integer, adet integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.id, s.metin, s.sira, coalesce(c.adet,0)
  from public.anket_secenek s
  left join public.anket_oy_sayac c on c.anket_id=s.anket_id and c.secenek_id=s.id
  where s.anket_id=p_anket order by s.sira;
$function$


CREATE OR REPLACE FUNCTION public.anket_sonuc_kirilim(p_anket uuid, p_seviye text)
 RETURNS TABLE(grup_id uuid, adet integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  return query
    select case when p_seviye='takim' then o.takim_id else o.lig_id end, count(*)::int
    from public.anket_oy o where o.anket_id=p_anket group by 1;
end $function$


CREATE OR REPLACE FUNCTION public.anket_yorum_sil(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not (public.admin_mi() or exists(select 1 from public.anket_yorum where id=p_id and user_id=auth.uid())) then
    raise exception 'yetkisiz'; end if;
  update public.anket_yorum set silindi=true where id=p_id;
end $function$


CREATE OR REPLACE FUNCTION public.anket_yorum_yaz(p_anket uuid, p_metin text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare a public.anketler; v_ad text; v_takim text; v_lig text; v_id uuid;
begin
  select * into a from public.anketler where id=p_anket;
  if a.id is null then raise exception 'Anket bulunamadı'; end if;
  if not a.yorum_acik then raise exception 'Yorumlar kapalı'; end if;
  if a.durum<>'yayin' then raise exception 'Anket aktif değil'; end if;
  if not public.anket_hedefte_mi(p_anket) then raise exception 'Bu anket size açık değil'; end if;
  if length(coalesce(trim(p_metin),''))=0 then raise exception 'Boş yorum'; end if;
  select coalesce(o.takma_ad,o.ad_soyad), t.ad, l.ad into v_ad, v_takim, v_lig
    from public.oyuncu_takim ot join public.oyuncular o on o.player_id=ot.player_id
    left join public.takimlar t on t.id=ot.takim_id left join public.ligler l on l.id=ot.lig_id
    where o.sahip_user_id=auth.uid() and ot.aktif limit 1;
  if v_ad is null then select ad into v_ad from public.profiller where user_id=auth.uid(); end if;
  insert into public.anket_yorum(anket_id,user_id,ad,takim_ad,lig_ad,metin)
    values(p_anket,auth.uid(),coalesce(v_ad,'Kullanıcı'),v_takim,v_lig,trim(p_metin)) returning id into v_id;
  return v_id;
end $function$


CREATE OR REPLACE FUNCTION public.ayrilma_onayla(p_ot uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_takim uuid; v_pid uuid; v_lig uuid; v_sahip uuid; v_tk text;
begin
  select takim_id, player_id, lig_id into v_takim, v_pid, v_lig from public.oyuncu_takim where id=p_ot and ayrilma_talep and aktif;
  if v_takim is null or not public.takim_yoneticim(v_takim) then return false; end if;
  update public.oyuncu_takim set aktif=false, ayrilma=now(), ayrilma_sebep='kendi_istegi', ayrilma_talep=false where id=p_ot;
  select sahip_user_id into v_sahip from public.oyuncular where player_id=v_pid;
  select ad into v_tk from public.takimlar where id=v_takim;
  if v_sahip is not null then
    perform public.bildirim_yolla(v_sahip, 'ayrilma', 'Ayrılman onaylandı',
      coalesce(v_tk,'Takım')||' takımından ayrıldın. İstatistiklerin korunur.', 'turnuva', v_lig::text);
  end if;
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.ayrilma_reddet(p_ot uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_takim uuid; v_pid uuid; v_lig uuid; v_sahip uuid; v_tk text;
begin
  select takim_id, player_id, lig_id into v_takim, v_pid, v_lig from public.oyuncu_takim where id=p_ot and ayrilma_talep;
  if v_takim is null or not public.takim_yoneticim(v_takim) then return false; end if;
  update public.oyuncu_takim set ayrilma_talep=false where id=p_ot;
  select sahip_user_id into v_sahip from public.oyuncular where player_id=v_pid;
  select ad into v_tk from public.takimlar where id=v_takim;
  if v_sahip is not null then
    perform public.bildirim_yolla(v_sahip, 'ayrilma', 'Ayrılma talebin reddedildi',
      coalesce(v_tk,'Takım')||' yöneticisi ayrılma talebini onaylamadı; takımda kalıyorsun.', 'turnuva', v_lig::text);
  end if;
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.ayrilma_talep_olustur(p_player uuid, p_lig uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_ot uuid; v_takim uuid; v_sahip uuid; v_oy text; v_tk text; v_yon uuid;
begin
  select id, takim_id into v_ot, v_takim from public.oyuncu_takim where player_id=p_player and lig_id=p_lig and aktif;
  if v_ot is null then return false; end if;
  select sahip_user_id, ad_soyad into v_sahip, v_oy from public.oyuncular where player_id=p_player;
  if v_sahip is null or v_sahip <> auth.uid() then return false; end if;
  update public.oyuncu_takim set ayrilma_talep=true where id=v_ot;
  select yonetici_id into v_yon from public.ligler where id=p_lig;
  select ad into v_tk from public.takimlar where id=v_takim;
  if v_yon is not null then
    perform public.bildirim_yolla(v_yon, 'ayrilma', 'Ayrılma talebi',
      coalesce(v_oy,'Bir oyuncu')||' → '||coalesce(v_tk,'takım')||' takımından ayrılmak istiyor.', 'turnuva', p_lig::text);
  end if;
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.bekleyen_ayrilmalar(p_lig uuid)
 RETURNS TABLE(ot_id uuid, player_id uuid, ad_soyad text, foto text, poz text, forma_no integer, takim_id uuid, takim_ad text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select ot.id, o.player_id, o.ad_soyad, o.foto, o.poz, o.forma_no, ot.takim_id, tk.ad
  from public.oyuncu_takim ot
  join public.oyuncular o on o.player_id = ot.player_id
  join public.takimlar tk on tk.id = ot.takim_id
  where ot.lig_id = p_lig and ot.ayrilma_talep and ot.aktif and public.takim_yoneticim(ot.takim_id)
  order by ot.katilma desc;
$function$


CREATE OR REPLACE FUNCTION public.bekleyen_katilimlar(p_lig uuid)
 RETURNS TABLE(ot_id uuid, player_id uuid, ad_soyad text, foto text, poz text, forma_no integer, takim_id uuid, takim_ad text, olusma timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select ot.id, o.player_id, o.ad_soyad, o.foto, o.poz, o.forma_no, ot.takim_id, tk.ad, ot.katilma
  from public.oyuncu_takim ot
  join public.oyuncular o on o.player_id = ot.player_id
  join public.takimlar tk on tk.id = ot.takim_id
  where ot.lig_id = p_lig and ot.onay = 'bekliyor'
    and public.takim_yoneticim(ot.takim_id)
  order by ot.katilma desc;
$function$


CREATE OR REPLACE FUNCTION public.ben_buradayim()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.profiller set son_gorulme = now() where user_id = auth.uid();
end $function$


CREATE OR REPLACE FUNCTION public.bildirim_yolla(p_user uuid, p_tip text, p_baslik text, p_metin text DEFAULT NULL::text, p_link_tip text DEFAULT NULL::text, p_link_id text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  insert into public.bildirimler(user_id, tip, baslik, metin, link_tip, link_id) values (p_user, p_tip, p_baslik, p_metin, p_link_tip, p_link_id) returning id into v_id;
  return v_id;
end $function$


CREATE OR REPLACE FUNCTION public.ceza_aktif(p_lig uuid, p_takim uuid, p_kulup uuid)
 RETURNS TABLE(tur text, biter timestamp with time zone, sebep text, aciklama text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select c.tur, c.biter, c.sebep, c.aciklama
  from public.sohbet_cezalari c
  where c.user_id=auth.uid() and c.durum='aktif' and c.tur in ('mute','ban')
    and (c.biter is null or c.biter>now())
    and ( c.kapsam='global'
       or (c.kapsam='takim' and c.kapsam_id=p_takim)
       or (c.kapsam='lig' and c.kapsam_id=p_lig and p_takim is null)
       or (c.kapsam='kulup' and c.kapsam_id=p_kulup) )
  order by c.biter desc nulls first limit 1;
$function$


CREATE OR REPLACE FUNCTION public.ceza_kaldir(p_id uuid, p_aciklama text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare c public.sohbet_cezalari;
begin
  select * into c from public.sohbet_cezalari where id=p_id;
  if c.id is null then raise exception 'Ceza bulunamadı'; end if;
  if not public.moderator_yetki(
       case when c.kapsam='lig' then c.kapsam_id end,
       case when c.kapsam='takim' then c.kapsam_id end,
       case when c.kapsam='kulup' then c.kapsam_id end) then raise exception 'yetkisiz'; end if;
  update public.sohbet_cezalari set durum='kaldirildi', kaldiran_id=auth.uid(), kaldirma_tarih=now(), kaldirma_not=p_aciklama where id=p_id;
  perform public.bildirim_yolla(c.user_id,'moderasyon','ForzaLig Yönetimi — Kısıtlama kaldırıldı',
    coalesce(p_aciklama,'Sohbet mesajı gönderme kısıtlamanız kaldırıldı.'),'sohbet',c.kapsam_id::text);
end $function$


CREATE OR REPLACE FUNCTION public.ceza_ver(p_user uuid, p_tur text, p_lig uuid, p_takim uuid, p_kulup uuid, p_biter timestamp with time zone, p_sebep text, p_aciklama text, p_ic_not text, p_mesaj_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_kapsam text; v_kid uuid; v_rol text;
begin
  if not public.moderator_yetki(p_lig,p_takim,p_kulup) then raise exception 'Bu sohbette moderasyon yetkiniz yok'; end if;
  v_kapsam := case when p_kulup is not null then 'kulup' when p_takim is not null then 'takim' when p_lig is not null then 'lig' else 'global' end;
  v_kid := coalesce(p_kulup,p_takim,p_lig);
  v_rol := case when public.admin_mi() then 'super_admin' when p_takim is not null then 'takim_yon' else 'lig_yon' end;
  if p_tur='uyari' then
    insert into public.sohbet_ihlal(user_id,tur,mesaj_metni,kapsam,kapsam_id,sebep,veren_id)
      values(p_user,'uyari',null,v_kapsam,v_kid,p_sebep,auth.uid());
    perform public.bildirim_yolla(p_user,'moderasyon','ForzaLig Yönetimi — Uyarı',
      coalesce(p_sebep,'Kurallara uyunuz')||coalesce(' · '||p_aciklama,''),'sohbet',v_kid::text);
    return null;
  else
    insert into public.sohbet_cezalari(user_id,tur,kapsam,kapsam_id,biter,sebep,aciklama,ic_not,ilgili_mesaj_id,veren_id,veren_rol,durum)
      values(p_user,p_tur,v_kapsam,v_kid,p_biter,p_sebep,p_aciklama,p_ic_not,p_mesaj_id,auth.uid(),v_rol,'aktif')
      returning id into v_id;
    perform public.bildirim_yolla(p_user,'moderasyon',
      'ForzaLig Yönetimi — '||case when p_tur='ban' then 'Sohbet engeli' else 'Susturma' end,
      coalesce(p_aciklama,coalesce(p_sebep,'Sohbet kısıtlaması')),'sohbet',v_kid::text);
    return v_id;
  end if;
end $function$


CREATE OR REPLACE FUNCTION public.depo_orphan_bul()
 RETURNS TABLE(yol text, boyut bigint, olusma timestamp with time zone, yas_gun integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  return query
  with ref(u) as (
    select foto        from public.oyuncular        where foto is not null
    union all select logo        from public.takimlar         where logo is not null
    union all select td->>'foto' from public.takimlar         where td ? 'foto'
    union all select logo        from public.ligler           where logo is not null
    union all select foto        from public.profiller        where foto is not null
    union all select logo        from public.kulupler         where logo is not null
    union all select td->>'foto' from public.kulupler         where td ? 'foto'
    union all select url         from public.oyuncu_kart_foto where url is not null
    union all select foto        from public.sohbet_mesajlari where foto is not null
    union all select takim_logo  from public.sohbet_mesajlari where takim_logo is not null
    union all select medya_url   from public.sohbet_mesajlari where medya_url is not null
    union all select takim_logo  from public.pazar_ilanlari   where takim_logo is not null
    union all select deger       from public.sistem_ayar      where deger is not null
  ),
  kullanilan(ad) as (
    select distinct split_part(u, '/fotolar/', 2)
    from ref
    where u like '%/fotolar/%'
  )
  select o.name,
         coalesce((o.metadata->>'size')::bigint, 0),
         o.created_at,
         greatest(0, extract(day from (now() - o.created_at)))::int
  from storage.objects o
  where o.bucket_id = 'fotolar'
    and o.name is not null
    and not exists (select 1 from kullanilan k where k.ad = o.name)
  order by o.created_at asc;
end $function$


CREATE OR REPLACE FUNCTION public.evren_sil(p_evren text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_say integer := 0;
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role')) then
    raise exception 'yetkisiz';
  end if;
  for r in select id from public.ligler
           where evren is not null and (p_evren is null or evren = p_evren) loop
    perform public.lig_kalici_sil(r.id);   -- gerçek kullanıcı liglerine (evren null) ASLA dokunmaz
    v_say := v_say + 1;
  end loop;
  return v_say;
end $function$


CREATE OR REPLACE FUNCTION public.ihlal_ozet(p_user uuid, p_gun integer)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select count(*)::int from (
    select created from public.sohbet_ihlal where user_id=p_user and created > now()-make_interval(days=>coalesce(p_gun,30))
    union all
    select created from public.sohbet_cezalari where user_id=p_user and created > now()-make_interval(days=>coalesce(p_gun,30))
  ) q;
$function$


CREATE OR REPLACE FUNCTION public.ilan_yanit_karar(p_yanit uuid, p_kabul boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_ilan uuid; v_sahip uuid; v_yanitci uuid; v_tip text;
begin
  select ilan_id, user_id into v_ilan, v_yanitci from public.ilan_yanitlari where id=p_yanit;
  if v_ilan is null then return false; end if;
  select user_id, tip into v_sahip, v_tip from public.pazar_ilanlari where id=v_ilan;
  if v_sahip is null or (v_sahip<>auth.uid() and not public.admin_mi()) then return false; end if;
  update public.ilan_yanitlari set durum=case when p_kabul then 'kabul' else 'ret' end where id=p_yanit;
  perform public.bildirim_yolla(v_yanitci,
    case when v_tip='rakip' then 'rakip_karar' else 'eksik_karar' end,
    case when p_kabul then '✅ İsteğin kabul edildi' else 'İsteğin yanıtlandı' end,
    case when p_kabul then 'Karşı taraf kabul etti — iletişime geçip maçı ayarlayın.' else 'İsteğin bu sefer kabul edilmedi.' end,
    'pazar', v_ilan::text);
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.katilim_onayla(p_ot uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_takim uuid;
begin
  select takim_id into v_takim from public.oyuncu_takim where id=p_ot and onay='bekliyor';
  if v_takim is null or not public.takim_yoneticim(v_takim) then return false; end if;
  update public.oyuncu_takim set aktif=true, onay='onayli' where id=p_ot;
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.katilim_reddet(p_ot uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_takim uuid; v_pid uuid;
begin
  select takim_id, player_id into v_takim, v_pid from public.oyuncu_takim where id=p_ot and onay='bekliyor';
  if v_takim is null or not public.takim_yoneticim(v_takim) then return false; end if;
  delete from public.oyuncu_takim where id=p_ot;
  if not exists(select 1 from public.oyuncu_takim where player_id=v_pid) then
    delete from public.oyuncular where player_id=v_pid;
  end if;
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.kulup_daveti_kullan(p_token text, p_ad text, p_no integer, p_poz text, p_foto text, p_dogum date, p_boy integer, p_kilo integer, p_uyruk text, p_ayak text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_kulup uuid; v_pid uuid;
begin
  select kulup_id into v_kulup from public.davetler where token=p_token and tip='kulup' and aktif;
  if v_kulup is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.oyuncular(ad_soyad, forma_no, poz, foto, dogum, boy, kilo, uyruk, ayak, sahip_user_id)
    values (coalesce(nullif(trim(p_ad),''),'Yeni Oyuncu'), p_no, p_poz, p_foto, p_dogum, p_boy, p_kilo, p_uyruk, p_ayak, auth.uid())
    returning player_id into v_pid;
  insert into public.kulup_oyuncu(kulup_id, player_id, forma_no, mevki, aktif)
    values (v_kulup, v_pid, p_no, p_poz, true) on conflict (kulup_id, player_id) do nothing;
  return v_pid;
end $function$


CREATE OR REPLACE FUNCTION public.kulup_kalici_sil(p_kulup uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_admin boolean := public.admin_mi(); v_takimlar uuid[];
begin
  if not (v_admin or public.kulup_yoneticim(p_kulup)) then
    raise exception 'Yetkiniz bulunmuyor.' using errcode='42501';
  end if;
  select array_agg(id) into v_takimlar from public.takimlar where kulup_id = p_kulup;
  if v_takimlar is not null then
    if v_admin then
      delete from public.maclar where ev_takim_id = any(v_takimlar) or dep_takim_id = any(v_takimlar);
      delete from public.transferler where eski_takim_id = any(v_takimlar) or yeni_takim_id = any(v_takimlar);
      delete from public.takimlar where id = any(v_takimlar);
    else
      update public.takimlar set kulup_id = null where kulup_id = p_kulup;
    end if;
  end if;
  delete from public.kulup_oyuncu where kulup_id = p_kulup;
  delete from public.kulupler where id = p_kulup;
end $function$


CREATE OR REPLACE FUNCTION public.kulup_lige_katil(p_kulup uuid, p_lig uuid, p_ad text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_takim uuid; v_ad text; r record;
begin
  if not public.lig_yoneticim(p_lig) then raise exception 'yetkisiz'; end if;
  select ad into v_ad from public.kulupler where id = p_kulup;
  if v_ad is null then raise exception 'kulüp bulunamadı'; end if;
  select id into v_takim from public.takimlar where lig_id = p_lig and kulup_id = p_kulup limit 1;
  if v_takim is null then
    insert into public.takimlar(lig_id, ad, kulup_id, logo, renk, renk2, td, yonetici_id)
      select p_lig, coalesce(nullif(trim(p_ad),''), v_ad), p_kulup, logo, renk, renk2, td, sahip_user_id
        from public.kulupler where id = p_kulup returning id into v_takim;
  end if;
  for r in select ko.player_id from public.kulup_oyuncu ko where ko.kulup_id = p_kulup and ko.aktif loop
    if not exists(select 1 from public.oyuncu_takim ot where ot.player_id = r.player_id and ot.lig_id = p_lig and ot.aktif) then
      insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif, onay) values (r.player_id, v_takim, p_lig, true, 'onayli');
    end if;
  end loop;
  return v_takim;
end $function$


CREATE OR REPLACE FUNCTION public.kulup_oyuncu_ekle(p_kulup uuid, p_ad text, p_mevki text DEFAULT NULL::text, p_forma integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_pid uuid;
begin
  if not public.kulup_yoneticim(p_kulup) then raise exception 'yetkisiz'; end if;
  if p_ad is null or length(trim(p_ad)) = 0 then raise exception 'ad gerekli'; end if;
  insert into public.oyuncular(ad_soyad, poz, forma_no) values (trim(p_ad), p_mevki, p_forma) returning player_id into v_pid;
  insert into public.kulup_oyuncu(kulup_id, player_id, forma_no, mevki, aktif) values (p_kulup, v_pid, p_forma, p_mevki, true) on conflict (kulup_id, player_id) do nothing;
  return v_pid;
end $function$


CREATE OR REPLACE FUNCTION public.kulup_oyuncu_serbest(p_kulup uuid, p_player uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_sahip uuid; v_ad text; r record;
begin
  if not public.kulup_yoneticim(p_kulup) then return false; end if;
  update public.kulup_oyuncu set aktif=false where kulup_id=p_kulup and player_id=p_player;
  for r in select t.id as takim_id from public.takimlar t join public.ligler l on l.id=t.lig_id
             where t.kulup_id=p_kulup and coalesce(l.durum,'aktif')<>'arsiv' loop
    update public.oyuncu_takim set aktif=false, ayrilma=now(), ayrilma_sebep='cikarildi'
      where player_id=p_player and takim_id=r.takim_id and aktif;
  end loop;
  select sahip_user_id into v_sahip from public.oyuncular where player_id=p_player;
  select ad into v_ad from public.kulupler where id=p_kulup;
  if v_sahip is not null then
    perform public.bildirim_yolla(v_sahip, 'cikarildi', 'Takımdan çıkarıldın',
      coalesce(v_ad,'Takım')||' takımından çıkarıldın. Geçmiş istatistiklerin korunur.', 'profil', null);
  end if;
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.kulup_sohbet_erisim(k uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.kulup_yoneticim(k)
    or exists(
      select 1 from public.kulup_oyuncu ko
      join public.oyuncular o on o.player_id = ko.player_id
      where ko.kulup_id = k and ko.aktif and o.sahip_user_id = auth.uid()
    );
$function$


CREATE OR REPLACE FUNCTION public.kulup_toplu_sil(p_kulupler uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare k uuid; n int := 0;
begin
  if not public.admin_mi() then
    raise exception 'Yetkiniz bulunmuyor.' using errcode='42501';
  end if;
  foreach k in array coalesce(p_kulupler, '{}'::uuid[]) loop
    perform public.kulup_kalici_sil(k);
    n := n + 1;
  end loop;
  return n;
end $function$


CREATE OR REPLACE FUNCTION public.kulup_yoneticim(k uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.admin_mi() or exists(select 1 from public.kulupler c where c.id = k and c.sahip_user_id = auth.uid());
$function$


CREATE OR REPLACE FUNCTION public.lig_bildirim(p_lig uuid, p_takim uuid, p_baslik text, p_metin text, p_link_id text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_count int := 0;
begin
  if not (public.lig_yoneticim(p_lig) or public.admin_mi()) then
    raise exception 'Yetkisiz — sadece lig yöneticisi.';
  end if;
  if p_baslik is null or length(trim(p_baslik)) = 0 then raise exception 'Başlık gerekli.'; end if;

  with hedef as (
    -- oyuncu sahipleri (kariyeri sahiplenmiş üyeler)
    select distinct o.sahip_user_id as uid
      from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id = ot.player_id
     where ot.lig_id = p_lig and o.sahip_user_id is not null
       and (p_takim is null or ot.takim_id = p_takim)
    union
    -- takım kaptanları (p_takim varsa o takım, yoksa ligin tüm takımları)
    select t.yonetici_id from public.takimlar t
     where t.lig_id = p_lig and t.yonetici_id is not null
       and (p_takim is null or t.id = p_takim)
    union
    -- lig sahibi + yardımcılar (yalnız p_takim yokken)
    select l.yonetici_id from public.ligler l where l.id = p_lig and p_takim is null
    union
    select y.user_id from public.lig_yardimci y where y.lig_id = p_lig and p_takim is null
  )
  insert into public.bildirimler(user_id, tip, baslik, metin, link_tip, link_id)
    select uid, 'mac', p_baslik, p_metin, 'turnuva', coalesce(p_link_id, p_lig::text)
      from hedef where uid is not null;
  get diagnostics v_count = row_count;
  return v_count;
end $function$


CREATE OR REPLACE FUNCTION public.lig_geri_al(p_lig uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.ligler set silindi = false, silinme_t = null where id = p_lig;
end $function$


CREATE OR REPLACE FUNCTION public.lig_kalici_sil(p_lig uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_players uuid[];
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role')) then
    raise exception 'yetkisiz';
  end if;

  -- Bu lige ÖZEL oyuncular (başka ligde aktif üyeliği olmayanlar) — öksüz kalmasın
  select coalesce(array_agg(distinct ot.player_id), '{}') into v_players
    from public.oyuncu_takim ot
   where ot.lig_id = p_lig
     and not exists (select 1 from public.oyuncu_takim o2
                      where o2.player_id = ot.player_id and o2.lig_id <> p_lig);

  -- Lige bağlı bildirimler (link_tip='turnuva')
  begin
    delete from public.bildirimler where link_tip = 'turnuva' and link_id = p_lig::text;
  exception when others then null; end;

  -- FK cascade'i olmayanları elle sil
  delete from public.maclar      where lig_id = p_lig;   -- cascade: mac_olaylari/mac_odulleri/ilk11/katilim
  delete from public.transferler where lig_id = p_lig;   -- (ligler'e cascade yok)

  -- Ligi sil → cascade: takimlar, oyuncu_takim, sohbet_mesajlari, davetler, lig_yardimci
  delete from public.ligler where id = p_lig;

  -- Öksüz oyuncuları sil
  begin
    if array_length(v_players,1) is not null then
      delete from public.oyuncular where player_id = any(v_players);
    end if;
  exception when others then null; end;
end $function$


CREATE OR REPLACE FUNCTION public.lig_purge_eskiler()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; v_say integer := 0; v_players uuid[];
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role')) then
    raise exception 'yetkisiz'; end if;
  for r in select id from public.ligler
           where silindi = true and silinme_t < now() - interval '90 days' loop
    select coalesce(array_agg(distinct ot.player_id),'{}') into v_players
      from public.oyuncu_takim ot where ot.lig_id = r.id
       and not exists (select 1 from public.oyuncu_takim o2
                        where o2.player_id = ot.player_id and o2.lig_id <> r.id);
    delete from public.maclar where lig_id = r.id;
    delete from public.transferler where lig_id = r.id;
    delete from public.ligler where id = r.id;
    begin
      if array_length(v_players,1) is not null then
        delete from public.oyuncular where player_id = any(v_players);
      end if;
    exception when others then null; end;
    v_say := v_say + 1;
  end loop;
  return v_say;
end $function$


CREATE OR REPLACE FUNCTION public.lig_sil_admin(p_lig uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_players uuid[];
begin
  if not public.admin_mi() then
    raise exception 'yetkisiz: sadece süper admin';
  end if;

  select coalesce(array_agg(distinct ot.player_id), '{}')
    into v_players
    from public.oyuncu_takim ot
   where ot.lig_id = p_lig
     and not exists (select 1 from public.oyuncu_takim o2
                      where o2.player_id = ot.player_id and o2.lig_id <> p_lig);

  delete from public.maclar where lig_id = p_lig;
  delete from public.transferler where lig_id = p_lig;
  delete from public.ligler where id = p_lig;

  begin
    if array_length(v_players, 1) is not null then
      delete from public.oyuncular where player_id = any(v_players);
    end if;
  exception when others then
    null;
  end;
end $function$


CREATE OR REPLACE FUNCTION public.lig_soft_sil(p_lig uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.ligler set silindi = true, silinme_t = now() where id = p_lig;
end $function$


CREATE OR REPLACE FUNCTION public.lig_uyesi(l uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    public.admin_mi()
    or public.lig_yoneticim(l)
    or exists (select 1 from public.takimlar t
                where t.lig_id = l and t.yonetici_id = auth.uid())
    or exists (select 1 from public.oyuncu_takim ot
                 join public.oyuncular o on o.player_id = ot.player_id
                where ot.lig_id = l and ot.aktif and o.sahip_user_id = auth.uid());
$function$


CREATE OR REPLACE FUNCTION public.lig_yoneticim(l uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.admin_mi()
      or exists(select 1 from public.ligler g where g.id = l and g.yonetici_id = auth.uid())
      or exists(select 1 from public.lig_yardimci y where y.lig_id = l and y.user_id = auth.uid());
$function$


CREATE OR REPLACE FUNCTION public.ligler_ozet(p_user uuid)
 RETURNS TABLE(id uuid, ad text, yonetici_id uuid, evren text, durum text, sehir text, ilce text, logo text, renk text, renk2 text, format text, grup_sayi integer, kisi integer, sponsor_ad text, sponsor_emoji text, kurallar text, takim_say bigint, mac_say bigint, oyuncu_say bigint, sahiplik text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with kapsam as (
    select l.* from public.ligler l
    where coalesce(l.silindi, false) = false
      and (
        l.evren is not null                                     -- yayınlanan evren (herkese)
        or (l.durum = 'aktif' and l.evren is null)              -- açık gerçek ligler (herkese)
        or (p_user is not null and l.yonetici_id = p_user)      -- sahibi olduğun ligler
        or (p_user is not null and exists (                     -- kaptan olduğun ligler
              select 1 from public.takimlar t where t.lig_id = l.id and t.yonetici_id = p_user))
        or (p_user is not null and exists (                     -- oyuncu olduğun ligler
              select 1 from public.oyuncu_takim ot
                join public.oyuncular o on o.player_id = ot.player_id
               where ot.lig_id = l.id and o.sahip_user_id = p_user))
      )
    order by l.olusturma desc nulls last
    limit 2000
  )
  select
    k.id, k.ad::text, k.yonetici_id, k.evren::text, k.durum::text,
    k.sehir::text, k.ilce::text, k.logo::text, k.renk::text, null::text,   -- ligler'de renk2 yok
    k.format::text, k.grup_sayi::int, k.kisi::int, k.sponsor_ad::text, k.sponsor_emoji::text, k.kurallar::text,
    (select count(*) from public.takimlar t where t.lig_id = k.id and t.durum is distinct from 'arsiv')::bigint,
    (select count(*) from public.maclar m where m.lig_id = k.id)::bigint,
    (select count(*) from public.oyuncu_takim ot where ot.lig_id = k.id and ot.aktif)::bigint,
    (case when p_user is not null and k.yonetici_id = p_user then 'benim' else 'acik' end)::text
  from kapsam k;
$function$


CREATE OR REPLACE FUNCTION public.mac_kart_ozet()
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select json_build_object(
    'adet',  count(*),
    'bayt',  coalesce(sum(length(coalesce(metin,'')) + length(coalesce(kart::text,''))), 0),
    'eski',  min(olusma)
  )
  from public.sohbet_mesajlari
  where sistem = true and sistem_tip = 'mac' and silindi = false;
$function$


CREATE OR REPLACE FUNCTION public.mac_kart_temizle(p_gun integer DEFAULT 14)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_count int := 0;
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role')) then
    raise exception 'yetkisiz';
  end if;
  delete from public.sohbet_mesajlari
   where sistem = true and sistem_tip = 'mac'
     and olusma < now() - make_interval(days => greatest(1, p_gun));
  get diagnostics v_count = row_count;
  return v_count;
end $function$


CREATE OR REPLACE FUNCTION public.mesaj_moderasyon(p_mesaj_id uuid, p_islem text, p_sebep text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare m public.sohbet_mesajlari;
begin
  select * into m from public.sohbet_mesajlari where id=p_mesaj_id;
  if m.id is null then raise exception 'Mesaj bulunamadı'; end if;
  if not public.moderator_yetki(m.lig_id,m.takim_id,m.kulup_id) then raise exception 'yetkisiz'; end if;
  if p_islem='sil' then
    insert into public.sohbet_ihlal(user_id,tur,mesaj_metni,kapsam,kapsam_id,sebep,veren_id)
      values(m.user_id,'silme',m.metin, case when m.takim_id is not null then 'takim' when m.lig_id is not null then 'lig' else 'kulup' end, coalesce(m.takim_id,m.lig_id,m.kulup_id), p_sebep, auth.uid());
    update public.sohbet_mesajlari set silindi=true where id=p_mesaj_id;
  elsif p_islem='gizle' then
    update public.sohbet_mesajlari set gizli=true, gizli_sebep=coalesce(p_sebep,'yonetim') where id=p_mesaj_id;
  elsif p_islem='goster' then
    update public.sohbet_mesajlari set gizli=false where id=p_mesaj_id;
  end if;
end $function$


CREATE OR REPLACE FUNCTION public.moderasyon_gecmis(p_user uuid, p_tur text, p_durum text)
 RETURNS SETOF sohbet_cezalari
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select * from public.sohbet_cezalari c
  where (public.admin_mi()
      or (c.kapsam='takim' and exists(select 1 from public.takimlar t where t.id=c.kapsam_id and t.yonetici_id=auth.uid()))
      or (c.kapsam='lig' and exists(select 1 from public.ligler l where l.id=c.kapsam_id and l.yonetici_id=auth.uid())))
    and (p_user is null or c.user_id=p_user)
    and (p_tur  is null or c.tur=p_tur)
    and (p_durum is null or c.durum=p_durum)
  order by c.created desc limit 300;
$function$


CREATE OR REPLACE FUNCTION public.moderator_yetki(p_lig uuid, p_takim uuid, p_kulup uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.admin_mi()
    or (p_takim is not null and exists(select 1 from public.takimlar t where t.id=p_takim and t.yonetici_id=auth.uid()))
    or (p_takim is null and p_lig is not null and exists(select 1 from public.ligler l where l.id=p_lig and l.yonetici_id=auth.uid()))
    or (p_kulup is not null and exists(select 1 from public.kulupler k where k.id=p_kulup and k.sahip_user_id=auth.uid()));
$function$


CREATE OR REPLACE FUNCTION public.oyuncu_cikar(p_player uuid, p_takim uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_ot uuid; v_lig uuid; v_sahip uuid; v_tk text;
begin
  select id, lig_id into v_ot, v_lig from public.oyuncu_takim
    where player_id=p_player and takim_id=p_takim and aktif;
  if v_ot is null or not public.takim_yoneticim(p_takim) then return false; end if;
  update public.oyuncu_takim set aktif=false, ayrilma=now(), ayrilma_sebep='cikarildi', ayrilma_talep=false where id=v_ot;
  select sahip_user_id into v_sahip from public.oyuncular where player_id=p_player;
  select ad into v_tk from public.takimlar where id=p_takim;
  if v_sahip is not null then
    perform public.bildirim_yolla(v_sahip, 'cikarildi', 'Takımdan çıkarıldın',
      coalesce(v_tk,'Takım')||' kadrosundan çıkarıldın. Geçmiş istatistiklerin korunur.', 'turnuva', v_lig::text);
  end if;
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.oyuncu_daveti_kullan(p_token text, p_ad text, p_no integer, p_poz text, p_foto text, p_dogum date, p_boy integer, p_kilo integer, p_uyruk text, p_ayak text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_takim uuid; v_lig uuid; v_pid uuid;
begin
  select takim_id, lig_id into v_takim, v_lig from public.davetler where token=p_token and tip='oyuncu' and aktif;
  if v_takim is null then raise exception 'Geçersiz veya kapalı davet'; end if;

  -- Kullanıcının mevcut kariyeri (oyuncu kartı) var mı?
  select player_id into v_pid from public.oyuncular where sahip_user_id = auth.uid() order by olusturma asc limit 1;

  if v_pid is null then
    -- Yoksa yeni kariyer aç
    insert into public.oyuncular(ad_soyad, forma_no, poz, foto, dogum, boy, kilo, uyruk, ayak, sahip_user_id)
      values (coalesce(nullif(trim(p_ad),''),'Yeni Oyuncu'), p_no, p_poz, p_foto, p_dogum, p_boy, p_kilo, p_uyruk, p_ayak, auth.uid())
      returning player_id into v_pid;
  else
    -- Var olan kariyere fotoğraf boşsa doldur (bilgiyi ezmeyiz)
    update public.oyuncular set foto = coalesce(foto, p_foto), poz = coalesce(poz, p_poz)
      where player_id = v_pid;
  end if;

  -- Aynı ligde zaten aktif/bekleyen üyelik varsa: katılım değil transfer gerekir
  if exists(select 1 from public.oyuncu_takim where player_id=v_pid and lig_id=v_lig and (aktif or onay='bekliyor')) then
    raise exception 'Bu ligde zaten bir takımdasın. Takım değişikliği için transfer süreci gerekir.';
  end if;

  -- Yeni takım üyeliği (yönetici onayına düşer)
  insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif, onay)
    values (v_pid, v_takim, v_lig, false, 'bekliyor');
  return v_pid;
end $function$


CREATE OR REPLACE FUNCTION public.oyuncu_musait_ayar(p_player_id uuid, p_musait boolean, p_sehir text DEFAULT NULL::text, p_not text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_sahip uuid; v_yetkili boolean := false;
begin
  select sahip_user_id into v_sahip from public.oyuncular where player_id = p_player_id;
  if v_sahip is not null and v_sahip = auth.uid() then
    v_yetkili := true;
  else
    select exists(
      select 1 from public.oyuncu_takim ot
      join public.ligler g on g.id = ot.lig_id
      where ot.player_id = p_player_id and ot.aktif
        and (public.admin_mi() or g.yonetici_id = auth.uid())
    ) into v_yetkili;
  end if;
  if not v_yetkili then return false; end if;
  update public.oyuncular
    set musait = p_musait,
        musait_sehir = case when p_musait then p_sehir else null end,
        musait_not   = case when p_musait then p_not   else null end,
        musait_t     = case when p_musait then now()   else null end
    where player_id = p_player_id;
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.oyuncu_sahiplen(p_player_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.oyuncular set sahip_user_id=auth.uid() where player_id=p_player_id and sahip_user_id is null;
  return found;
end $function$


CREATE OR REPLACE FUNCTION public.panel_metrikler()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
declare j jsonb;
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  select jsonb_build_object(
    'lig',         (select count(*) from public.ligler where silindi = false),
    'lig_cop',     (select count(*) from public.ligler where silindi = true),
    'takim',       (select count(*) from public.takimlar),
    'oyuncu',      (select count(*) from public.oyuncular),
    'mac',         (select count(*) from public.maclar),
    'uye',         (select count(*) from public.profiller),
    'mau',         (select count(*) from public.profiller where son_gorulme > now() - interval '30 days'),
    'mesaj',       (select count(*) from public.sohbet_mesajlari where arsiv = false),
    'mesaj_arsiv', (select count(*) from public.sohbet_mesajlari where arsiv = true),
    'foto',        (select count(*) from public.oyuncular where foto is not null),
    'logo',        (select count(*) from public.takimlar  where logo is not null),
    'depo_bayt',   coalesce((select sum((metadata->>'size')::bigint) from storage.objects where bucket_id='fotolar'),0),
    'depo_dosya',  (select count(*) from storage.objects where bucket_id='fotolar')
  ) into j;
  return j;
end $function$


CREATE OR REPLACE FUNCTION public.paylasilan_sil_admin(p_slug text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.admin_mi() then
    raise exception 'Yetki yok: yalnızca süper admin silebilir.';
  end if;
  delete from public.paylasilan_ligler where slug = p_slug;
end $function$


CREATE OR REPLACE FUNCTION public.pazar_oyuncular(p_sehir text DEFAULT NULL::text)
 RETURNS TABLE(player_id uuid, ad_soyad text, poz text, forma_no integer, foto text, musait_sehir text, musait_not text, musait_t timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select o.player_id, o.ad_soyad, o.poz, o.forma_no, o.foto, o.musait_sehir, o.musait_not, o.musait_t
  from public.oyuncular o
  where o.musait = true and (p_sehir is null or o.musait_sehir ilike '%'||p_sehir||'%')
  order by o.musait_t desc nulls last limit 100;
$function$


CREATE OR REPLACE FUNCTION public.radyo_depo_stat()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
declare
  v_admin boolean;
  v_bytes bigint;
  v_count bigint;
begin
  -- yalnız süper admin
  select exists(select 1 from public.adminler where user_id = auth.uid()) into v_admin;
  if not coalesce(v_admin, false) then
    raise exception 'yetki yok (yalnız süper admin)';
  end if;

  select coalesce(sum((metadata->>'size')::bigint), 0), count(*)
    into v_bytes, v_count
    from storage.objects;

  return json_build_object('bytes', v_bytes, 'objeler', v_count);
end;
$function$


CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$


CREATE OR REPLACE FUNCTION public.sohbet_anketleri(p_lig uuid, p_takim uuid, p_kulup uuid)
 RETURNS SETOF anketler
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select a.* from public.anketler a
  where a.durum='yayin'
    and (a.baslar is null or a.baslar<=now())
    and (a.biter  is null or a.biter> now())
    and public.anket_hedefte_mi(a.id)
    and exists(select 1 from public.anket_hedef h where h.anket_id=a.id and (
          h.kapsam='tum'
       or (p_takim is not null and h.kapsam='takim' and h.kapsam_id=p_takim)
       or (p_takim is null and h.kapsam in ('lig','lig_takimlari') and h.kapsam_id=p_lig)
       or (p_takim is not null and h.kapsam in ('lig','lig_takimlari') and h.kapsam_id=(select lig_id from public.takimlar where id=p_takim))
       or (p_takim is null and h.kapsam in ('rol','kullanici'))
    ))
  order by a.created desc;
$function$


CREATE OR REPLACE FUNCTION public.sohbet_arsiv_ac(p_lig uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_say integer;
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.sohbet_mesajlari set arsiv = false where lig_id = p_lig and arsiv = true;
  get diagnostics v_say = row_count; return v_say;
end $function$


CREATE OR REPLACE FUNCTION public.sohbet_arsivle()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_say integer;
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role')) then
    raise exception 'yetkisiz'; end if;
  with sirali as (
    select id, row_number() over (
      partition by lig_id, coalesce(takim_id,'00000000-0000-0000-0000-000000000000'::uuid)
      order by olusma desc) as sira
    from public.sohbet_mesajlari where arsiv = false )
  update public.sohbet_mesajlari m set arsiv = true
  from sirali s where m.id = s.id and s.sira > 5000;
  get diagnostics v_say = row_count; return v_say;
end $function$


CREATE OR REPLACE FUNCTION public.sohbet_ayar_guncelle(p_lig uuid, p_takim uuid, p_kulup uuid, p_yavas integer, p_sadece boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_kapsam text; v_kid uuid;
begin
  if not public.moderator_yetki(p_lig,p_takim,p_kulup) then raise exception 'yetkisiz'; end if;
  v_kapsam := case when p_kulup is not null then 'kulup' when p_takim is not null then 'takim' when p_lig is not null then 'lig' else null end;
  v_kid := coalesce(p_kulup,p_takim,p_lig);
  if v_kapsam is null then raise exception 'kapsam yok'; end if;
  insert into public.sohbet_ayar(kapsam,kapsam_id,yavas_sn,sadece_yonetici,guncelleyen)
    values(v_kapsam,v_kid,greatest(0,coalesce(p_yavas,0)),coalesce(p_sadece,false),auth.uid())
    on conflict (kapsam,kapsam_id) do update set yavas_sn=excluded.yavas_sn, sadece_yonetici=excluded.sadece_yonetici, guncelleyen=auth.uid();
end $function$


CREATE OR REPLACE FUNCTION public.sohbet_medya_temizle(p_lig uuid DEFAULT NULL::uuid, p_takim uuid DEFAULT NULL::uuid, p_kulup uuid DEFAULT NULL::uuid, p_hepsi boolean DEFAULT false)
 RETURNS SETOF text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
declare v_yollar text[];
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;

  select coalesce(array_agg(split_part(medya_url,'/fotolar/',2)),'{}'::text[])
    into v_yollar
    from public.sohbet_mesajlari
   where medya_url is not null and medya_url like '%/fotolar/%'
     and ( p_hepsi
        or (p_kulup is not null and kulup_id = p_kulup)
        or (p_kulup is null and p_lig is not null and lig_id = p_lig
             and ( (p_takim is not null and takim_id = p_takim)
                or (p_takim is null and takim_id is null) )) );

  update public.sohbet_mesajlari
     set silindi = true, medya_url = null, medya_tip = null
   where medya_url is not null
     and ( p_hepsi
        or (p_kulup is not null and kulup_id = p_kulup)
        or (p_kulup is null and p_lig is not null and lig_id = p_lig
             and ( (p_takim is not null and takim_id = p_takim)
                or (p_takim is null and takim_id is null) )) );

  return query select unnest(v_yollar);
end $function$


CREATE OR REPLACE FUNCTION public.sohbet_uyeleri(p_lig uuid, p_takim uuid, p_kulup uuid)
 RETURNS TABLE(user_id uuid, player_id uuid, ad text, foto text, takim_ad text, rol text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not (public.admin_mi()
       or (p_takim is not null and public.takim_sohbet_erisim(p_takim))
       or (p_takim is null and p_lig is not null and public.lig_uyesi(p_lig))
       or (p_kulup is not null and public.kulup_sohbet_erisim(p_kulup))) then
    return;
  end if;
  return query
  with uyeler as (
    -- TÜM aktif oyuncular (hesaba bağlı olsun olmasın)
    select o.sahip_user_id uid, o.player_id pid, coalesce(nullif(o.takma_ad,''),o.ad_soyad) ad, o.foto foto, t.ad takim_ad, 'oyuncu'::text rol
      from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id=ot.player_id
      join public.takimlar  t on t.id=ot.takim_id
      where ot.aktif and coalesce(o.durum,'aktif')='aktif'
        and ( (p_takim is not null and ot.takim_id=p_takim)
           or (p_takim is null and p_lig is not null and ot.lig_id=p_lig) )
    union
    select t.yonetici_id, null::uuid, coalesce(nullif(pr.ad,''),'Yönetici'), pr.foto, t.ad, 'kaptan'
      from public.takimlar t left join public.profiller pr on pr.user_id=t.yonetici_id
      where t.yonetici_id is not null
        and ( (p_takim is not null and t.id=p_takim) or (p_takim is null and p_lig is not null and t.lig_id=p_lig) )
    union
    select l.yonetici_id, null::uuid, coalesce(nullif(pr.ad,''),'Lig Yön.'), pr.foto, null, 'lig_yon'
      from public.ligler l left join public.profiller pr on pr.user_id=l.yonetici_id
      where l.yonetici_id is not null
        and ( l.id=p_lig or (p_takim is not null and l.id=(select lig_id from public.takimlar where id=p_takim)) )
    union
    select pr.user_id, null::uuid, coalesce(nullif(pr.ad,''),'Hakem'), pr.foto, null, 'hakem'
      from public.profiller pr
      where p_takim is null and p_lig is not null
        and pr.roller @> '{"hakem":true}'::jsonb
        and coalesce((pr.roller->>'hakem_pasif')::boolean,false)=false
        and ( pr.roller->'hakem_ligler' is null or pr.roller->'hakem_ligler'='[]'::jsonb or (pr.roller->'hakem_ligler') ? p_lig::text )
  )
  select distinct on (coalesce(uid,pid)) uid, pid, ad, foto, takim_ad, rol
  from uyeler where (uid is not null or pid is not null) order by coalesce(uid,pid), rol;
end $function$


CREATE OR REPLACE FUNCTION public.sohbet_yazabilir(p_lig uuid, p_takim uuid, p_kulup uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_mod boolean; v_yavas int; v_sadece boolean; v_son timestamptz;
begin
  v_mod := public.moderator_yetki(p_lig,p_takim,p_kulup);
  -- Aktif susturma/engel bu kapsamı örtüyor mu?
  if exists(select 1 from public.sohbet_cezalari c
      where c.user_id=auth.uid() and c.durum='aktif' and c.tur in ('mute','ban')
        and (c.biter is null or c.biter>now())
        and ( c.kapsam='global'
           or (c.kapsam='takim' and c.kapsam_id=p_takim)
           or (c.kapsam='lig' and c.kapsam_id=p_lig and p_takim is null)
           or (c.kapsam='kulup' and c.kapsam_id=p_kulup) )) then
    return false;
  end if;
  if not v_mod then
    select yavas_sn, sadece_yonetici into v_yavas, v_sadece from public.sohbet_ayar
      where (kapsam='takim' and kapsam_id=p_takim)
         or (kapsam='lig' and kapsam_id=p_lig and p_takim is null)
         or (kapsam='kulup' and kapsam_id=p_kulup) limit 1;
    if coalesce(v_sadece,false) then return false; end if;
    if coalesce(v_yavas,0)>0 then
      select max(olusma) into v_son from public.sohbet_mesajlari
        where user_id=auth.uid() and coalesce(silindi,false)=false
          and ( (p_takim is not null and takim_id=p_takim)
             or (p_takim is null and p_lig is not null and lig_id=p_lig and takim_id is null)
             or (p_kulup is not null and kulup_id=p_kulup) );
      if v_son is not null and (now()-v_son) < make_interval(secs => v_yavas) then return false; end if;
    end if;
  end if;
  return true;
end $function$


CREATE OR REPLACE FUNCTION public.stat_ozet_yaz(p_lig uuid, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_lig is null then return; end if;
  if not exists (
    select 1 from public.ligler l
     where l.id = p_lig
       and (l.yonetici_id = auth.uid() or public.admin_mi())
  ) then
    raise exception 'Yetki yok: stat_ozet yalniz lig sahibi/admin tarafindan yazilir.';
  end if;
  update public.ligler set stat_ozet = p_data where id = p_lig;
end $function$


CREATE OR REPLACE FUNCTION public.takim_daveti_kullan(p_token text, p_ad text, p_renk text, p_renk2 text, p_logo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_lig uuid; v_id uuid; v_oy_token text;
begin
  select lig_id into v_lig from public.davetler where token=p_token and tip='takim' and aktif;
  if v_lig is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.takimlar(lig_id, ad, renk, renk2, logo, yonetici_id)
    values (v_lig, coalesce(nullif(trim(p_ad),''),'Yeni Takım'), p_renk, p_renk2, p_logo, auth.uid())
    returning id into v_id;
  insert into public.davetler(lig_id, takim_id, tip, olusturan)
    values (v_lig, v_id, 'oyuncu', auth.uid())
    returning token into v_oy_token;
  return jsonb_build_object('takim_id', v_id, 'oyuncu_token', v_oy_token);
end $function$


CREATE OR REPLACE FUNCTION public.takim_kurabilir()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    public.admin_mi()
    or exists(select 1 from public.lig_haklari h
                where h.user_id = auth.uid() and h.toplam > h.kullanilan)
    or exists(select 1 from public.ligler l
                where l.yonetici_id = auth.uid());
$function$


CREATE OR REPLACE FUNCTION public.takim_sohbet_erisim(t uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    public.takim_yoneticim(t)
    or exists(
      select 1 from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id = ot.player_id
      where ot.takim_id = t and ot.aktif and o.sahip_user_id = auth.uid()
    );
$function$


CREATE OR REPLACE FUNCTION public.takim_yoneticim(t uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists(
    select 1 from public.takimlar tk
    join public.ligler g on g.id = tk.lig_id
    where tk.id = t
      and (public.admin_mi() or g.yonetici_id = auth.uid() or tk.yonetici_id = auth.uid())
  );
$function$


CREATE OR REPLACE FUNCTION public.trg_etiket_bildir()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid; v_ad text; v_scope uuid[];
begin
  if new.etiketler is null or array_length(new.etiketler,1) is null then return new; end if;
  begin
    v_ad := coalesce(nullif(new.ad,''),'Biri');
    select array_agg(user_id) into v_scope from public.sohbet_uyeleri(new.lig_id, new.takim_id, new.kulup_id);
    for u in select distinct x from unnest(new.etiketler) x loop
      if u is not null and u <> new.user_id and u = any(coalesce(v_scope,'{}'::uuid[])) then
        perform public.bildirim_yolla(u, 'etiket', v_ad||' sizi etiketledi',
          left(coalesce(new.metin,''),120), 'sohbet',
          coalesce(new.takim_id::text, new.lig_id::text, new.kulup_id::text));
      end if;
    end loop;
  exception when others then null;  -- bildirim başarısız olsa da mesaj kalır
  end;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_hak_say()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (tg_op = 'INSERT') then
    if coalesce(new.sezon_no,1) <= 1 then
      insert into public.lig_haklari(user_id, toplam, kullanilan) values (new.yonetici_id, 0, 1)
      on conflict (user_id) do update set kullanilan = public.lig_haklari.kullanilan + 1, guncelleme = now();
    end if;
  elsif (tg_op = 'DELETE') then
    if coalesce(old.sezon_no,1) <= 1 then
      update public.lig_haklari set kullanilan = greatest(0, kullanilan - 1), guncelleme = now() where user_id = old.yonetici_id;
    end if;
  end if;
  return coalesce(new, old);
end $function$


CREATE OR REPLACE FUNCTION public.trg_ilan_yanit_bildirim()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_sahip uuid; v_tip text;
begin
  select user_id, tip into v_sahip, v_tip from public.pazar_ilanlari where id=new.ilan_id;
  if v_sahip is not null and v_sahip<>new.user_id then
    perform public.bildirim_yolla(v_sahip,
      case when v_tip='rakip' then 'rakip_yanit' when v_tip='oyuncu' then 'oyuncu_yanit' else 'eksik_yanit' end,
      case when v_tip='rakip' then '🆚 Maç teklifi geldi' when v_tip='oyuncu' then '🏃 Bir takım seni istiyor' else '🙋 Oyuncu başvurusu' end,
      coalesce(new.ad,'Biri') || case when v_tip='rakip' then ' takımınla maç yapmak istiyor.'
                                      when v_tip='oyuncu' then ' seni takımına çağırıyor.'
                                      else ' ilanına "geliyorum" dedi.' end,
      'pazar', new.ilan_id::text);
  end if; return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_kart_foto_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if (select count(*) from public.oyuncu_kart_foto where player_id = new.player_id) >= 5 then
    raise exception 'En fazla 5 kart fotoğrafı eklenebilir.';
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_katilim_bildirim()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_yon uuid; v_oy text; v_tk text;
begin
  if (new.onay='bekliyor') then
    select yonetici_id into v_yon from public.ligler where id=new.lig_id;
    select ad_soyad into v_oy from public.oyuncular where player_id=new.player_id;
    select ad into v_tk from public.takimlar where id=new.takim_id;
    if v_yon is not null then
      perform public.bildirim_yolla(v_yon, 'katilim', 'Yeni katılım isteği',
        coalesce(v_oy,'Bir oyuncu')||' → '||coalesce(v_tk,'takım')||' katılmak istiyor.', 'turnuva', new.lig_id::text);
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_kilit_koru()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if old.kurallar_kilit and not public.admin_mi() then
    if (new.puan_sistemi is distinct from old.puan_sistemi
        or new.averaj_tipi is distinct from old.averaj_tipi
        or new.fikstur_tipi is distinct from old.fikstur_tipi) then
      raise exception 'Maç oynandıktan sonra puan/averaj/fikstür değiştirilemez (madde 21).';
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_kulup_yayilim()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record;
begin
  if not new.aktif then return new; end if;
  for r in select t.id as takim_id, t.lig_id from public.takimlar t join public.ligler l on l.id = t.lig_id
     where t.kulup_id = new.kulup_id and coalesce(l.durum,'aktif') <> 'arsiv' and coalesce(t.durum,'aktif') <> 'arsiv' loop
    if not exists(select 1 from public.oyuncu_takim ot where ot.player_id = new.player_id and ot.lig_id = r.lig_id) then
      insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif, onay) values (new.player_id, r.takim_id, r.lig_id, true, 'onayli');
    end if;
  end loop;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_lig_kilitle()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (new.oynandi and not coalesce(old.oynandi,false)) then
    update public.ligler set kurallar_kilit = true
      where id = new.lig_id and not kurallar_kilit;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_mac_sohbet()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_a text; v_b text; v_la text; v_lb text;
begin
  if (new.oynandi and new.ev_skor is not null and (tg_op='INSERT' or not coalesce(old.oynandi,false))) then
    select ad, logo into v_a, v_la from public.takimlar where id=new.ev_takim_id;
    select ad, logo into v_b, v_lb from public.takimlar where id=new.dep_takim_id;
    insert into public.sohbet_mesajlari(lig_id, takim_id, user_id, ad, metin, sistem, sistem_tip, kart)
      values (new.lig_id, null, null, 'ForzaLig', coalesce(v_a,'?')||' '||new.ev_skor||'-'||new.dep_skor||' '||coalesce(v_b,'?'), true, 'mac',
        jsonb_build_object('takimA',v_a,'takimB',v_b,'skorA',new.ev_skor,'skorB',new.dep_skor,'logoA',v_la,'logoB',v_lb,'mac_id',new.id::text));
  end if; return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_ot_kulube_yaz()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not new.aktif then return new; end if;
  insert into public.kulup_oyuncu(kulup_id, player_id, forma_no, mevki, aktif)
    select t.kulup_id, new.player_id, o.forma_no, o.poz, true
      from public.takimlar t join public.oyuncular o on o.player_id = new.player_id
     where t.id = new.takim_id and t.kulup_id is not null
    on conflict (kulup_id, player_id) do nothing;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_skor_log()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (new.ev_skor is distinct from old.ev_skor
      or new.dep_skor is distinct from old.dep_skor) then
    insert into public.mac_sonuc_log(mac_id, eski_ev, eski_dep, yeni_ev, yeni_dep, degistiren)
    values (new.id, old.ev_skor, old.dep_skor, new.ev_skor, new.dep_skor, auth.uid());
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_takim_kulup_bagla()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_kulup uuid; v_sahip uuid; v_evren text;
begin
  if new.kulup_id is not null then return new; end if;
  select yonetici_id, evren into v_sahip, v_evren from public.ligler where id = new.lig_id;
  v_sahip := coalesce(new.yonetici_id, v_sahip);
  insert into public.kulupler(ad, logo, renk, renk2, td, sahip_user_id, evren)
    values (new.ad, new.logo, new.renk, new.renk2, new.td, v_sahip, v_evren) returning id into v_kulup;
  new.kulup_id := v_kulup;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_transfer_bildirim()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_yonetici uuid; v_oyuncu text;
begin
  if (new.asama = 'talep') then
    select g.yonetici_id into v_yonetici from public.ligler g where g.id = new.lig_id;
    select ad_soyad into v_oyuncu from public.oyuncular where player_id = new.player_id;
    if v_yonetici is not null then
      perform public.bildirim_yolla(v_yonetici, 'transfer_istek', 'Yeni transfer isteği', coalesce(v_oyuncu,'Bir oyuncu') || ' için transfer isteği bekliyor.', 'turnuva', new.lig_id::text);
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_transfer_sohbet()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_oyuncu text; v_takim text;
begin
  if (new.asama='tamam' and old.asama is distinct from 'tamam') then
    select ad_soyad into v_oyuncu from public.oyuncular where player_id=new.player_id;
    select ad into v_takim from public.takimlar where id=new.yeni_takim_id;
    insert into public.sohbet_mesajlari(lig_id, takim_id, user_id, ad, metin, sistem, sistem_tip)
      values (new.lig_id, null, null, 'ForzaLig', coalesce(v_oyuncu,'Oyuncu')||', '||coalesce(v_takim,'yeni takım')||' takımına katıldı.', true, 'transfer');
  end if; return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_transfer_sonuc_bildirim()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_oyuncu text; v_takim text;
begin
  if (new.talep_eden is not null and old.asama = 'talep' and new.asama in ('tamam','iptal')) then
    select ad_soyad into v_oyuncu from public.oyuncular where player_id = new.player_id;
    select ad into v_takim from public.takimlar where id = new.yeni_takim_id;
    if new.asama = 'tamam' then
      perform public.bildirim_yolla(new.talep_eden, 'transfer_onay', 'Transfer onaylandı', coalesce(v_oyuncu,'Oyuncu') || ' -> ' || coalesce(v_takim,'yeni takim') || ' transferi onaylandi.', 'turnuva', new.lig_id::text);
    else
      perform public.bildirim_yolla(new.talep_eden, 'transfer_ret', 'Transfer reddedildi', coalesce(v_oyuncu,'Oyuncu') || ' transfer istegi reddedildi.', 'turnuva', new.lig_id::text);
    end if;
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_transfer_uygula()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (new.asama = 'tamam' and old.asama is distinct from 'tamam') then
    update public.oyuncu_takim
      set aktif = false, ayrilma = now()
      where player_id = new.player_id and lig_id = new.lig_id and aktif;
    insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif)
      values (new.player_id, new.yeni_takim_id, new.lig_id, true);
    new.tamam_t := now();
  end if;
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.trg_yeni_profil()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiller(user_id, email, ad, foto)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (user_id) do update
    set email = excluded.email,
        foto  = coalesce(public.profiller.foto, excluded.foto);
  return new;
end $function$


CREATE OR REPLACE FUNCTION public.uye_sil_admin(p_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.admin_mi() then raise exception 'Yetki yok: yalnızca süper admin.'; end if;
  if p_user = auth.uid() then raise exception 'Kendini silemezsin.'; end if;
  if exists (select 1 from public.adminler a where a.user_id = p_user) then
    raise exception 'Admin silinemez — önce admin yetkisini kaldır.';
  end if;
  delete from auth.users where id = p_user;   -- CASCADE → tüm veri temizlenir
end $function$


CREATE OR REPLACE FUNCTION public.uyeler_temizle_admin()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_auth integer; v_orphan integer;
begin
  if not public.admin_mi() then raise exception 'Yetki yok: yalnızca süper admin.'; end if;

  -- a) Anonim / test uzantılı GERÇEK hesaplar (adminler ve sen hariç)
  with d as (
    delete from auth.users u
     where ( coalesce(u.is_anonymous, false) = true
             or u.email ilike '%@forzalig.com'
             or u.email ilike '%@forzalig.test' )
       and u.id <> auth.uid()
       and not exists (select 1 from public.adminler a where a.user_id = u.id)
    returning 1
  )
  select count(*) into v_auth from d;

  -- b) Öksüz (hayali) profiller
  with o as (
    delete from public.profiller p
     where not exists (select 1 from auth.users u where u.id = p.user_id)
    returning 1
  )
  select count(*) into v_orphan from o;

  return v_auth + v_orphan;
end $function$


CREATE OR REPLACE FUNCTION public.yeni_sezon_baslat(p_eski uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_seri uuid; v_no int; v_yeni uuid; e record; r record;
begin
  if not public.lig_yoneticim(p_eski) then raise exception 'yetkisiz'; end if;
  select * into e from public.ligler where id = p_eski;
  if e.id is null then raise exception 'lig bulunamadı'; end if;
  v_seri := coalesce(e.seri_id, e.id);
  if e.seri_id is null then update public.ligler set seri_id = v_seri where id = e.id; end if;
  select coalesce(max(sezon_no),1) + 1 into v_no from public.ligler where seri_id = v_seri;
  insert into public.ligler(yonetici_id, ad, ulke, sehir, ilce, logo, puan_sistemi, averaj_tipi, fikstur_tipi,
      format, grup_sayi, kisi, hedef_takim, renk, kurallar, seri_id, sezon_no, durum)
    select yonetici_id, ad, ulke, sehir, ilce, logo, puan_sistemi, averaj_tipi, fikstur_tipi,
      format, grup_sayi, kisi, hedef_takim, renk, kurallar, v_seri, v_no, 'aktif'
    from public.ligler where id = p_eski returning id into v_yeni;
  for r in select id, ad, kulup_id from public.takimlar
     where lig_id = p_eski and kulup_id is not null and coalesce(durum,'aktif') <> 'arsiv' loop
    perform public.kulup_lige_katil(r.kulup_id, v_yeni, r.ad);
  end loop;
  update public.ligler set durum = 'arsiv' where id = p_eski;
  return v_yeni;
end $function$


-- ========== TRIGGERS ==========
CREATE TRIGGER push_bildirim AFTER INSERT ON public.bildirimler FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://crkestykdsnmfcmamxav.supabase.co/functions/v1/push-gonder', 'POST', '{"Content-type":"application/json","x-push-secret":"6d5198408ac3f4527d1255ec74ae0e9f2ee902c066f2092b"}', '{}', '5000');
CREATE TRIGGER t_ilan_yanit_bildirim AFTER INSERT ON public.ilan_yanitlari FOR EACH ROW EXECUTE FUNCTION trg_ilan_yanit_bildirim();
CREATE TRIGGER t_kulup_yayilim AFTER INSERT ON public.kulup_oyuncu FOR EACH ROW EXECUTE FUNCTION trg_kulup_yayilim();
CREATE TRIGGER t_hak_say AFTER INSERT OR DELETE ON public.ligler FOR EACH ROW EXECUTE FUNCTION trg_hak_say();
CREATE TRIGGER t_kilit_koru BEFORE UPDATE ON public.ligler FOR EACH ROW EXECUTE FUNCTION trg_kilit_koru();
CREATE TRIGGER t_lig_kilitle AFTER INSERT OR UPDATE OF oynandi ON public.maclar FOR EACH ROW EXECUTE FUNCTION trg_lig_kilitle();
CREATE TRIGGER t_mac_sohbet AFTER INSERT OR UPDATE OF oynandi ON public.maclar FOR EACH ROW EXECUTE FUNCTION trg_mac_sohbet();
CREATE TRIGGER t_skor_log AFTER UPDATE ON public.maclar FOR EACH ROW EXECUTE FUNCTION trg_skor_log();
CREATE TRIGGER t_kart_foto_limit BEFORE INSERT ON public.oyuncu_kart_foto FOR EACH ROW EXECUTE FUNCTION trg_kart_foto_limit();
CREATE TRIGGER t_katilim_bildirim AFTER INSERT ON public.oyuncu_takim FOR EACH ROW EXECUTE FUNCTION trg_katilim_bildirim();
CREATE TRIGGER t_ot_kulube_yaz AFTER INSERT ON public.oyuncu_takim FOR EACH ROW EXECUTE FUNCTION trg_ot_kulube_yaz();
CREATE TRIGGER t_etiket_bildir AFTER INSERT ON public.sohbet_mesajlari FOR EACH ROW EXECUTE FUNCTION trg_etiket_bildir();
CREATE TRIGGER t_takim_kulup_bagla BEFORE INSERT ON public.takimlar FOR EACH ROW EXECUTE FUNCTION trg_takim_kulup_bagla();
CREATE TRIGGER t_transfer_bildirim AFTER INSERT ON public.transferler FOR EACH ROW EXECUTE FUNCTION trg_transfer_bildirim();
CREATE TRIGGER t_transfer_sohbet AFTER UPDATE ON public.transferler FOR EACH ROW EXECUTE FUNCTION trg_transfer_sohbet();
CREATE TRIGGER t_transfer_sonuc_bildirim AFTER UPDATE ON public.transferler FOR EACH ROW EXECUTE FUNCTION trg_transfer_sonuc_bildirim();
CREATE TRIGGER t_transfer_uygula BEFORE UPDATE ON public.transferler FOR EACH ROW EXECUTE FUNCTION trg_transfer_uygula();

-- ========== RLS ENABLE ==========
ALTER TABLE public.adminler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anket_hedef ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anket_katilim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anket_oy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anket_oy_sayac ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anket_secenek ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anket_yorum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anketler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bildirim_kuyruk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bildirimler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.davetler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deger_gecmisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destek_talep ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hata_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilan_yanitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilk11 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.islem_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.katilim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kullanici_veri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kulup_oyuncu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kulupler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lig_basvurulari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lig_haklari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lig_yardimci ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ligler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mac_odulleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mac_olaylari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mac_oylari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mac_sonuc_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maclar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.olay_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oyuncu_kart_foto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oyuncu_takim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oyuncular ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paylasilan_ligler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pazar_ilanlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiller ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_abonelikleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sahiplenmeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sistem_ayar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_ayar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sohbet_ayar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sohbet_cezalari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sohbet_ihlal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sohbet_mesajlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sohbet_okuma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sohbet_sikayet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sohbet_tepkileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takimlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takipler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yasaklilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yetkiler ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES ==========
CREATE POLICY p_adminler_all ON public.adminler AS PERMISSIVE FOR ALL TO public USING (admin_mi()) WITH CHECK (admin_mi());
CREATE POLICY p_adminler_sel ON public.adminler AS PERMISSIVE FOR SELECT TO public USING ((admin_mi() OR (user_id = auth.uid())));
CREATE POLICY p_anket_hedef_sel ON public.anket_hedef AS PERMISSIVE FOR SELECT TO authenticated USING (admin_mi());
CREATE POLICY p_anket_kat_sel ON public.anket_katilim AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR admin_mi()));
CREATE POLICY p_anket_oy_sel ON public.anket_oy AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR admin_mi()));
CREATE POLICY p_anket_sayac_sel ON public.anket_oy_sayac AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY p_anket_sec_sel ON public.anket_secenek AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY p_anket_yorum_sel ON public.anket_yorum AS PERMISSIVE FOR SELECT TO authenticated USING (((silindi = false) OR admin_mi()));
CREATE POLICY p_anket_sel ON public.anketler AS PERMISSIVE FOR SELECT TO authenticated USING (((durum = ANY (ARRAY['yayin'::text, 'durdu'::text, 'bitti'::text, 'arsiv'::text])) OR admin_mi()));
CREATE POLICY p_kuyruk_ins ON public.bildirim_kuyruk AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY p_kuyruk_sel ON public.bildirim_kuyruk AS PERMISSIVE FOR SELECT TO authenticated USING ((admin_mi() OR (hedef_user = auth.uid())));
CREATE POLICY p_bildirim_del ON public.bildirimler AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY p_bildirim_ins ON public.bildirimler AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY p_bildirim_sel ON public.bildirimler AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY p_bildirim_upd ON public.bildirimler AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY p_davet_ins ON public.davetler AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((((lig_id IS NOT NULL) AND lig_yoneticim(lig_id)) OR ((kulup_id IS NOT NULL) AND kulup_yoneticim(kulup_id))));
CREATE POLICY p_davet_sel ON public.davetler AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_davet_upd ON public.davetler AS PERMISSIVE FOR UPDATE TO authenticated USING ((((lig_id IS NOT NULL) AND lig_yoneticim(lig_id)) OR ((kulup_id IS NOT NULL) AND kulup_yoneticim(kulup_id)))) WITH CHECK ((((lig_id IS NOT NULL) AND lig_yoneticim(lig_id)) OR ((kulup_id IS NOT NULL) AND kulup_yoneticim(kulup_id))));
CREATE POLICY deger_gecmisi_admin ON public.deger_gecmisi AS PERMISSIVE FOR ALL TO public USING (admin_mi()) WITH CHECK (admin_mi());
CREATE POLICY p_destek_ins ON public.destek_talep AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR (user_id IS NULL)));
CREATE POLICY p_destek_sel ON public.destek_talep AS PERMISSIVE FOR SELECT TO authenticated USING ((admin_mi() OR (user_id = auth.uid())));
CREATE POLICY p_destek_upd ON public.destek_talep AS PERMISSIVE FOR UPDATE TO authenticated USING (admin_mi()) WITH CHECK (admin_mi());
CREATE POLICY p_hata_del ON public.hata_log AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM adminler a
  WHERE (a.user_id = auth.uid()))));
CREATE POLICY p_hata_ins ON public.hata_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY p_hata_sel ON public.hata_log AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM adminler a
  WHERE (a.user_id = auth.uid()))));
CREATE POLICY p_yanit_ins ON public.ilan_yanitlari AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY p_yanit_sel ON public.ilan_yanitlari AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR admin_mi() OR (EXISTS ( SELECT 1
   FROM pazar_ilanlari i
  WHERE ((i.id = ilan_yanitlari.ilan_id) AND (i.user_id = auth.uid()))))));
CREATE POLICY p_yanit_upd ON public.ilan_yanitlari AS PERMISSIVE FOR UPDATE TO authenticated USING ((admin_mi() OR (EXISTS ( SELECT 1
   FROM pazar_ilanlari i
  WHERE ((i.id = ilan_yanitlari.ilan_id) AND (i.user_id = auth.uid()))))));
CREATE POLICY p_ilk11_sel ON public.ilk11 AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_ilk11_yaz ON public.ilk11 AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM maclar m
  WHERE ((m.id = ilk11.mac_id) AND lig_yoneticim(m.lig_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM maclar m
  WHERE ((m.id = ilk11.mac_id) AND lig_yoneticim(m.lig_id)))));
CREATE POLICY p_islemlog_ins ON public.islem_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY p_islemlog_sel ON public.islem_log AS PERMISSIVE FOR SELECT TO authenticated USING (admin_mi());
CREATE POLICY p_katilim_sel ON public.katilim AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_katilim_yaz ON public.katilim AS PERMISSIVE FOR ALL TO authenticated USING ((admin_mi() OR (EXISTS ( SELECT 1
   FROM oyuncular o
  WHERE ((o.player_id = katilim.player_id) AND (o.sahip_user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM maclar m
  WHERE ((m.id = katilim.mac_id) AND lig_yoneticim(m.lig_id)))))) WITH CHECK (true);
CREATE POLICY "kendi verisini ekler" ON public.kullanici_veri AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "kendi verisini gorur" ON public.kullanici_veri AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "kendi verisini gunceller" ON public.kullanici_veri AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY p_kulupoy_del ON public.kulup_oyuncu AS PERMISSIVE FOR DELETE TO authenticated USING (kulup_yoneticim(kulup_id));
CREATE POLICY p_kulupoy_ins ON public.kulup_oyuncu AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (kulup_yoneticim(kulup_id));
CREATE POLICY p_kulupoy_sel ON public.kulup_oyuncu AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY p_kulupoy_upd ON public.kulup_oyuncu AS PERMISSIVE FOR UPDATE TO authenticated USING (kulup_yoneticim(kulup_id)) WITH CHECK (kulup_yoneticim(kulup_id));
CREATE POLICY p_kulup_del ON public.kulupler AS PERMISSIVE FOR DELETE TO authenticated USING ((admin_mi() OR (sahip_user_id = auth.uid())));
CREATE POLICY p_kulup_ins ON public.kulupler AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((sahip_user_id = auth.uid()) AND takim_kurabilir()));
CREATE POLICY p_kulup_sel ON public.kulupler AS PERMISSIVE FOR SELECT TO authenticated USING (((evren IS NULL) OR admin_mi()));
CREATE POLICY p_kulup_upd ON public.kulupler AS PERMISSIVE FOR UPDATE TO authenticated USING (kulup_yoneticim(id)) WITH CHECK (kulup_yoneticim(id));
CREATE POLICY p_basvuru_ins ON public.lig_basvurulari AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR (user_id IS NULL)));
CREATE POLICY p_basvuru_sel ON public.lig_basvurulari AS PERMISSIVE FOR SELECT TO authenticated USING ((admin_mi() OR (user_id = auth.uid())));
CREATE POLICY p_basvuru_upd ON public.lig_basvurulari AS PERMISSIVE FOR UPDATE TO authenticated USING (admin_mi()) WITH CHECK (admin_mi());
CREATE POLICY p_hak_sel ON public.lig_haklari AS PERMISSIVE FOR SELECT TO public USING ((admin_mi() OR (user_id = auth.uid())));
CREATE POLICY p_hak_yaz ON public.lig_haklari AS PERMISSIVE FOR ALL TO public USING (admin_mi()) WITH CHECK (admin_mi());
CREATE POLICY p_yrd_del ON public.lig_yardimci AS PERMISSIVE FOR DELETE TO authenticated USING ((admin_mi() OR (EXISTS ( SELECT 1
   FROM ligler g
  WHERE ((g.id = lig_yardimci.lig_id) AND (g.yonetici_id = auth.uid()))))));
CREATE POLICY p_yrd_ins ON public.lig_yardimci AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((admin_mi() OR (EXISTS ( SELECT 1
   FROM ligler g
  WHERE ((g.id = lig_yardimci.lig_id) AND (g.yonetici_id = auth.uid()))))));
CREATE POLICY p_yrd_sel ON public.lig_yardimci AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY p_lig_del ON public.ligler AS PERMISSIVE FOR DELETE TO public USING ((admin_mi() OR ((yonetici_id = auth.uid()) AND (NOT (EXISTS ( SELECT 1
   FROM maclar m
  WHERE ((m.lig_id = ligler.id) AND m.oynandi)))))));
CREATE POLICY p_lig_ins ON public.ligler AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((yonetici_id = auth.uid()) AND (admin_mi() OR (EXISTS ( SELECT 1
   FROM lig_haklari h
  WHERE ((h.user_id = auth.uid()) AND (h.toplam > h.kullanilan)))))));
CREATE POLICY p_lig_sel ON public.ligler AS PERMISSIVE FOR SELECT TO public USING (((silindi = false) OR admin_mi()));
CREATE POLICY p_lig_upd ON public.ligler AS PERMISSIVE FOR UPDATE TO public USING (lig_yoneticim(id)) WITH CHECK (lig_yoneticim(id));
CREATE POLICY p_odul_sel ON public.mac_odulleri AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_odul_yaz ON public.mac_odulleri AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM maclar m
  WHERE ((m.id = mac_odulleri.mac_id) AND lig_yoneticim(m.lig_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM maclar m
  WHERE ((m.id = mac_odulleri.mac_id) AND lig_yoneticim(m.lig_id)))));
CREATE POLICY p_olay_sel ON public.mac_olaylari AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_olay_yaz ON public.mac_olaylari AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM maclar m
  WHERE ((m.id = mac_olaylari.mac_id) AND lig_yoneticim(m.lig_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM maclar m
  WHERE ((m.id = mac_olaylari.mac_id) AND lig_yoneticim(m.lig_id)))));
CREATE POLICY "kendi oyunu degistirir" ON public.mac_oylari AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = oyveren_id)) WITH CHECK ((auth.uid() = oyveren_id));
CREATE POLICY "kendi oyunu siler" ON public.mac_oylari AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = oyveren_id));
CREATE POLICY "kendi oyunu verir" ON public.mac_oylari AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = oyveren_id));
CREATE POLICY "oylari herkes gorur" ON public.mac_oylari AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_log_sel ON public.mac_sonuc_log AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_log_yaz ON public.mac_sonuc_log AS PERMISSIVE FOR ALL TO public USING (admin_mi()) WITH CHECK (admin_mi());
CREATE POLICY p_mac_sel ON public.maclar AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_mac_yaz ON public.maclar AS PERMISSIVE FOR ALL TO authenticated USING (lig_yoneticim(lig_id)) WITH CHECK (lig_yoneticim(lig_id));
CREATE POLICY p_olay_ins ON public.olay_log AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY p_olay_sel ON public.olay_log AS PERMISSIVE FOR SELECT TO authenticated USING (admin_mi());
CREATE POLICY p_kartfoto_del ON public.oyuncu_kart_foto AS PERMISSIVE FOR DELETE TO authenticated USING ((admin_mi() OR (EXISTS ( SELECT 1
   FROM oyuncular o
  WHERE ((o.player_id = oyuncu_kart_foto.player_id) AND (o.sahip_user_id = auth.uid()))))));
CREATE POLICY p_kartfoto_ins ON public.oyuncu_kart_foto AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((admin_mi() OR (EXISTS ( SELECT 1
   FROM oyuncular o
  WHERE ((o.player_id = oyuncu_kart_foto.player_id) AND (o.sahip_user_id = auth.uid()))))));
CREATE POLICY p_kartfoto_sel ON public.oyuncu_kart_foto AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_kartfoto_upd ON public.oyuncu_kart_foto AS PERMISSIVE FOR UPDATE TO authenticated USING ((admin_mi() OR (EXISTS ( SELECT 1
   FROM oyuncular o
  WHERE ((o.player_id = oyuncu_kart_foto.player_id) AND (o.sahip_user_id = auth.uid()))))));
CREATE POLICY p_ot_sel ON public.oyuncu_takim AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_ot_yaz ON public.oyuncu_takim AS PERMISSIVE FOR ALL TO authenticated USING (lig_yoneticim(lig_id)) WITH CHECK (lig_yoneticim(lig_id));
CREATE POLICY p_oyuncu_del ON public.oyuncular AS PERMISSIVE FOR DELETE TO public USING (admin_mi());
CREATE POLICY p_oyuncu_ins ON public.oyuncular AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY p_oyuncu_sel ON public.oyuncular AS PERMISSIVE FOR SELECT TO authenticated USING ((admin_mi() OR (sahip_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (oyuncu_takim ot
     JOIN ligler g ON ((g.id = ot.lig_id)))
  WHERE ((ot.player_id = oyuncular.player_id) AND (g.yonetici_id = auth.uid()))))));
CREATE POLICY p_oyuncu_upd ON public.oyuncular AS PERMISSIVE FOR UPDATE TO authenticated USING ((admin_mi() OR (sahip_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (oyuncu_takim ot
     JOIN ligler g ON ((g.id = ot.lig_id)))
  WHERE ((ot.player_id = oyuncular.player_id) AND (g.yonetici_id = auth.uid())))))) WITH CHECK (true);
CREATE POLICY "acik lig herkes okur" ON public.paylasilan_ligler AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "admin her ligi siler" ON public.paylasilan_ligler AS PERMISSIVE FOR DELETE TO public USING (((auth.jwt() ->> 'email'::text) = 'fatiherol68@gmail.com'::text));
CREATE POLICY "lig sahibi ekler" ON public.paylasilan_ligler AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = sahip_id));
CREATE POLICY "lig sahibi gunceller" ON public.paylasilan_ligler AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = sahip_id)) WITH CHECK ((auth.uid() = sahip_id));
CREATE POLICY "lig sahibi siler" ON public.paylasilan_ligler AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = sahip_id));
CREATE POLICY p_ilan_del ON public.pazar_ilanlari AS PERMISSIVE FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR admin_mi()));
CREATE POLICY p_ilan_ins ON public.pazar_ilanlari AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY p_ilan_sel ON public.pazar_ilanlari AS PERMISSIVE FOR SELECT TO authenticated USING (((durum = 'aktif'::text) OR (user_id = auth.uid()) OR admin_mi()));
CREATE POLICY p_ilan_upd ON public.pazar_ilanlari AS PERMISSIVE FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR admin_mi())) WITH CHECK (((user_id = auth.uid()) OR admin_mi()));
CREATE POLICY p_profil_ins ON public.profiller AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((admin_mi() OR (user_id = auth.uid())));
CREATE POLICY p_profil_sel ON public.profiller AS PERMISSIVE FOR SELECT TO authenticated USING ((admin_mi() OR (user_id = auth.uid())));
CREATE POLICY p_profil_upd ON public.profiller AS PERMISSIVE FOR UPDATE TO authenticated USING ((admin_mi() OR (user_id = auth.uid()))) WITH CHECK ((admin_mi() OR (user_id = auth.uid())));
CREATE POLICY p_push_del ON public.push_abonelikleri AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY p_push_ins ON public.push_abonelikleri AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY p_push_sel ON public.push_abonelikleri AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY p_push_upd ON public.push_abonelikleri AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "kendi sahiplenme gunceller" ON public.sahiplenmeler AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "kendi sahiplenme okur" ON public.sahiplenmeler AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "kendi sahiplenme siler" ON public.sahiplenmeler AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "kendi sahiplenme yazar" ON public.sahiplenmeler AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY p_ayar_ins ON public.sistem_ayar AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (admin_mi());
CREATE POLICY p_ayar_sel ON public.sistem_ayar AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_ayar_upd ON public.sistem_ayar AS PERMISSIVE FOR UPDATE TO authenticated USING (admin_mi()) WITH CHECK (admin_mi());
CREATE POLICY p_site_sel ON public.site_ayar AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_site_upd ON public.site_ayar AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM adminler a
  WHERE (a.user_id = auth.uid())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM adminler a
  WHERE (a.user_id = auth.uid()))));
CREATE POLICY p_ayar_sel ON public.sohbet_ayar AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY p_ceza_sel ON public.sohbet_cezalari AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR moderator_yetki(
CASE
    WHEN (kapsam = 'lig'::text) THEN kapsam_id
    ELSE NULL::uuid
END,
CASE
    WHEN (kapsam = 'takim'::text) THEN kapsam_id
    ELSE NULL::uuid
END,
CASE
    WHEN (kapsam = 'kulup'::text) THEN kapsam_id
    ELSE NULL::uuid
END)));
CREATE POLICY p_ihlal_sel ON public.sohbet_ihlal AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR moderator_yetki(
CASE
    WHEN (kapsam = 'lig'::text) THEN kapsam_id
    ELSE NULL::uuid
END,
CASE
    WHEN (kapsam = 'takim'::text) THEN kapsam_id
    ELSE NULL::uuid
END,
CASE
    WHEN (kapsam = 'kulup'::text) THEN kapsam_id
    ELSE NULL::uuid
END)));
CREATE POLICY p_sohbet_ins ON public.sohbet_mesajlari AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) AND
CASE
    WHEN (kulup_id IS NOT NULL) THEN kulup_sohbet_erisim(kulup_id)
    WHEN (takim_id IS NOT NULL) THEN takim_sohbet_erisim(takim_id)
    ELSE lig_uyesi(lig_id)
END AND ((medya_url IS NULL) OR admin_mi()) AND sohbet_yazabilir(lig_id, takim_id, kulup_id)));
CREATE POLICY p_sohbet_sel ON public.sohbet_mesajlari AS PERMISSIVE FOR SELECT TO authenticated USING (((silindi = false) AND
CASE
    WHEN (kulup_id IS NOT NULL) THEN kulup_sohbet_erisim(kulup_id)
    WHEN (takim_id IS NOT NULL) THEN takim_sohbet_erisim(takim_id)
    ELSE lig_uyesi(lig_id)
END));
CREATE POLICY p_sohbet_upd ON public.sohbet_mesajlari AS PERMISSIVE FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR lig_yoneticim(lig_id) OR admin_mi())) WITH CHECK (true);
CREATE POLICY p_okuma_all ON public.sohbet_okuma AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY p_sikayet_ins ON public.sohbet_sikayet AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((sikayet_eden = auth.uid()));
CREATE POLICY p_sikayet_sel ON public.sohbet_sikayet AS PERMISSIVE FOR SELECT TO authenticated USING (admin_mi());
CREATE POLICY p_sikayet_upd ON public.sohbet_sikayet AS PERMISSIVE FOR UPDATE TO authenticated USING (admin_mi()) WITH CHECK (admin_mi());
CREATE POLICY p_tepki_del ON public.sohbet_tepkileri AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY p_tepki_ins ON public.sohbet_tepkileri AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY p_tepki_sel ON public.sohbet_tepkileri AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY p_takim_del ON public.takimlar AS PERMISSIVE FOR DELETE TO authenticated USING (admin_mi());
CREATE POLICY p_takim_ins ON public.takimlar AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (lig_yoneticim(lig_id));
CREATE POLICY p_takim_sel ON public.takimlar AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_takim_upd ON public.takimlar AS PERMISSIVE FOR UPDATE TO public USING (takim_yoneticim(id)) WITH CHECK (takim_yoneticim(id));
CREATE POLICY p_takip_sel ON public.takipler AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY p_takip_yaz ON public.takipler AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY p_transfer_ins ON public.transferler AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY p_transfer_sel ON public.transferler AS PERMISSIVE FOR SELECT TO authenticated USING ((admin_mi() OR lig_yoneticim(lig_id) OR (EXISTS ( SELECT 1
   FROM takimlar tk
  WHERE (((tk.id = transferler.eski_takim_id) OR (tk.id = transferler.yeni_takim_id)) AND (tk.yonetici_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM oyuncular o
  WHERE ((o.player_id = transferler.player_id) AND (o.sahip_user_id = auth.uid())))) OR (talep_eden = auth.uid())));
CREATE POLICY p_transfer_upd ON public.transferler AS PERMISSIVE FOR UPDATE TO authenticated USING ((admin_mi() OR lig_yoneticim(lig_id))) WITH CHECK (true);
CREATE POLICY p_yasak_del ON public.yasaklilar AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM adminler a
  WHERE (a.user_id = auth.uid()))));
CREATE POLICY p_yasak_ins ON public.yasaklilar AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM adminler a
  WHERE (a.user_id = auth.uid()))));
CREATE POLICY p_yasak_sel ON public.yasaklilar AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM adminler a
  WHERE (a.user_id = auth.uid())))));
CREATE POLICY p_yasak_upd ON public.yasaklilar AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM adminler a
  WHERE (a.user_id = auth.uid())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM adminler a
  WHERE (a.user_id = auth.uid()))));
CREATE POLICY "admin yetki gunceller" ON public.yetkiler AS PERMISSIVE FOR UPDATE TO public USING (((auth.jwt() ->> 'email'::text) = 'fatiherol68@gmail.com'::text));
CREATE POLICY "admin yetki okur" ON public.yetkiler AS PERMISSIVE FOR SELECT TO public USING (((auth.jwt() ->> 'email'::text) = 'fatiherol68@gmail.com'::text));
CREATE POLICY "admin yetki siler" ON public.yetkiler AS PERMISSIVE FOR DELETE TO public USING (((auth.jwt() ->> 'email'::text) = 'fatiherol68@gmail.com'::text));
CREATE POLICY "admin yetki yazar" ON public.yetkiler AS PERMISSIVE FOR INSERT TO public WITH CHECK (((auth.jwt() ->> 'email'::text) = 'fatiherol68@gmail.com'::text));

-- ========== VIEWS ==========
CREATE OR REPLACE VIEW public.hakem_havuzu AS  SELECT user_id,
    ad,
    sehir,
    foto,
    COALESCE(roller -> 'hakem_ligler'::text, '[]'::jsonb) AS ligler
   FROM profiller
  WHERE roller @> '{"hakem": true}'::jsonb AND COALESCE((roller ->> 'hakem_pasif'::text)::boolean, false) = false;

CREATE OR REPLACE VIEW public.kulup_tum_zamanlar AS  WITH tm AS (
         SELECT t.kulup_id,
            m.id AS mac_id,
                CASE
                    WHEN m.ev_takim_id = t.id THEN m.ev_skor
                    ELSE m.dep_skor
                END AS attig,
                CASE
                    WHEN m.ev_takim_id = t.id THEN m.dep_skor
                    ELSE m.ev_skor
                END AS yedig
           FROM takimlar t
             JOIN maclar m ON m.ev_takim_id = t.id OR m.dep_takim_id = t.id
          WHERE t.kulup_id IS NOT NULL AND m.oynandi AND m.ev_skor IS NOT NULL AND m.dep_skor IS NOT NULL
        )
 SELECT kulup_id,
    count(*)::integer AS mac,
    COALESCE(sum((attig > yedig)::integer), 0::bigint)::integer AS galibiyet,
    COALESCE(sum((attig = yedig)::integer), 0::bigint)::integer AS beraberlik,
    COALESCE(sum((attig < yedig)::integer), 0::bigint)::integer AS maglubiyet,
    COALESCE(sum(attig), 0::bigint)::integer AS atilan,
    COALESCE(sum(yedig), 0::bigint)::integer AS yenen
   FROM tm
  GROUP BY kulup_id;

CREATE OR REPLACE VIEW public.oyuncu_kariyer AS  SELECT o.player_id,
    o.gorunen_ad,
    COALESCE(sum(mo.adet) FILTER (WHERE mo.tip = 'gol'::text), 0::bigint)::integer AS gol,
    COALESCE(sum(mo.adet) FILTER (WHERE mo.tip = 'asist'::text), 0::bigint)::integer AS asist,
    COALESCE(sum(mo.adet) FILTER (WHERE mo.tip = 'sari'::text), 0::bigint)::integer AS sari,
    COALESCE(sum(mo.adet) FILTER (WHERE mo.tip = 'kirmizi'::text), 0::bigint)::integer AS kirmizi,
    count(DISTINCT m.lig_id)::integer AS sezon_sayisi,
    count(DISTINCT mo.mac_id)::integer AS etkili_mac
   FROM oyuncular_acik o
     LEFT JOIN mac_olaylari mo ON mo.player_id = o.player_id
     LEFT JOIN maclar m ON m.id = mo.mac_id
  GROUP BY o.player_id, o.gorunen_ad;

CREATE OR REPLACE VIEW public.oyuncular_acik AS  SELECT player_id,
    COALESCE(NULLIF(takma_ad, ''::text), ad_soyad) AS gorunen_ad,
    forma_no,
    poz,
    ovr,
    ayak,
    boy,
    bolge,
    renk,
    deger,
    saglik,
    nitelik,
    foto,
        CASE
            WHEN dogum IS NOT NULL THEN EXTRACT(year FROM age(dogum::timestamp with time zone))::integer
            ELSE NULL::integer
        END AS yas,
    durum,
    kart_rarity,
    kart_konsept
   FROM oyuncular;

-- ========== GRANTS (anon/authenticated/service_role) ==========
GRANT REFERENCES ON public.adminler TO anon;
GRANT TRIGGER ON public.adminler TO anon;
GRANT TRUNCATE ON public.adminler TO anon;
GRANT DELETE ON public.adminler TO authenticated;
GRANT INSERT ON public.adminler TO authenticated;
GRANT REFERENCES ON public.adminler TO authenticated;
GRANT SELECT ON public.adminler TO authenticated;
GRANT TRIGGER ON public.adminler TO authenticated;
GRANT TRUNCATE ON public.adminler TO authenticated;
GRANT UPDATE ON public.adminler TO authenticated;
GRANT REFERENCES ON public.adminler TO service_role;
GRANT TRIGGER ON public.adminler TO service_role;
GRANT TRUNCATE ON public.adminler TO service_role;
GRANT REFERENCES ON public.anket_hedef TO anon;
GRANT TRIGGER ON public.anket_hedef TO anon;
GRANT TRUNCATE ON public.anket_hedef TO anon;
GRANT REFERENCES ON public.anket_hedef TO authenticated;
GRANT SELECT ON public.anket_hedef TO authenticated;
GRANT TRIGGER ON public.anket_hedef TO authenticated;
GRANT TRUNCATE ON public.anket_hedef TO authenticated;
GRANT REFERENCES ON public.anket_hedef TO service_role;
GRANT TRIGGER ON public.anket_hedef TO service_role;
GRANT TRUNCATE ON public.anket_hedef TO service_role;
GRANT REFERENCES ON public.anket_katilim TO anon;
GRANT TRIGGER ON public.anket_katilim TO anon;
GRANT TRUNCATE ON public.anket_katilim TO anon;
GRANT REFERENCES ON public.anket_katilim TO authenticated;
GRANT SELECT ON public.anket_katilim TO authenticated;
GRANT TRIGGER ON public.anket_katilim TO authenticated;
GRANT TRUNCATE ON public.anket_katilim TO authenticated;
GRANT REFERENCES ON public.anket_katilim TO service_role;
GRANT TRIGGER ON public.anket_katilim TO service_role;
GRANT TRUNCATE ON public.anket_katilim TO service_role;
GRANT REFERENCES ON public.anket_oy TO anon;
GRANT TRIGGER ON public.anket_oy TO anon;
GRANT TRUNCATE ON public.anket_oy TO anon;
GRANT REFERENCES ON public.anket_oy TO authenticated;
GRANT SELECT ON public.anket_oy TO authenticated;
GRANT TRIGGER ON public.anket_oy TO authenticated;
GRANT TRUNCATE ON public.anket_oy TO authenticated;
GRANT REFERENCES ON public.anket_oy TO service_role;
GRANT TRIGGER ON public.anket_oy TO service_role;
GRANT TRUNCATE ON public.anket_oy TO service_role;
GRANT REFERENCES ON public.anket_oy_sayac TO anon;
GRANT TRIGGER ON public.anket_oy_sayac TO anon;
GRANT TRUNCATE ON public.anket_oy_sayac TO anon;
GRANT REFERENCES ON public.anket_oy_sayac TO authenticated;
GRANT SELECT ON public.anket_oy_sayac TO authenticated;
GRANT TRIGGER ON public.anket_oy_sayac TO authenticated;
GRANT TRUNCATE ON public.anket_oy_sayac TO authenticated;
GRANT REFERENCES ON public.anket_oy_sayac TO service_role;
GRANT TRIGGER ON public.anket_oy_sayac TO service_role;
GRANT TRUNCATE ON public.anket_oy_sayac TO service_role;
GRANT REFERENCES ON public.anket_secenek TO anon;
GRANT TRIGGER ON public.anket_secenek TO anon;
GRANT TRUNCATE ON public.anket_secenek TO anon;
GRANT REFERENCES ON public.anket_secenek TO authenticated;
GRANT SELECT ON public.anket_secenek TO authenticated;
GRANT TRIGGER ON public.anket_secenek TO authenticated;
GRANT TRUNCATE ON public.anket_secenek TO authenticated;
GRANT REFERENCES ON public.anket_secenek TO service_role;
GRANT TRIGGER ON public.anket_secenek TO service_role;
GRANT TRUNCATE ON public.anket_secenek TO service_role;
GRANT REFERENCES ON public.anket_yorum TO anon;
GRANT TRIGGER ON public.anket_yorum TO anon;
GRANT TRUNCATE ON public.anket_yorum TO anon;
GRANT REFERENCES ON public.anket_yorum TO authenticated;
GRANT SELECT ON public.anket_yorum TO authenticated;
GRANT TRIGGER ON public.anket_yorum TO authenticated;
GRANT TRUNCATE ON public.anket_yorum TO authenticated;
GRANT REFERENCES ON public.anket_yorum TO service_role;
GRANT TRIGGER ON public.anket_yorum TO service_role;
GRANT TRUNCATE ON public.anket_yorum TO service_role;
GRANT REFERENCES ON public.anketler TO anon;
GRANT TRIGGER ON public.anketler TO anon;
GRANT TRUNCATE ON public.anketler TO anon;
GRANT REFERENCES ON public.anketler TO authenticated;
GRANT SELECT ON public.anketler TO authenticated;
GRANT TRIGGER ON public.anketler TO authenticated;
GRANT TRUNCATE ON public.anketler TO authenticated;
GRANT REFERENCES ON public.anketler TO service_role;
GRANT TRIGGER ON public.anketler TO service_role;
GRANT TRUNCATE ON public.anketler TO service_role;
GRANT REFERENCES ON public.bildirim_kuyruk TO anon;
GRANT TRIGGER ON public.bildirim_kuyruk TO anon;
GRANT TRUNCATE ON public.bildirim_kuyruk TO anon;
GRANT INSERT ON public.bildirim_kuyruk TO authenticated;
GRANT REFERENCES ON public.bildirim_kuyruk TO authenticated;
GRANT SELECT ON public.bildirim_kuyruk TO authenticated;
GRANT TRIGGER ON public.bildirim_kuyruk TO authenticated;
GRANT TRUNCATE ON public.bildirim_kuyruk TO authenticated;
GRANT REFERENCES ON public.bildirim_kuyruk TO service_role;
GRANT TRIGGER ON public.bildirim_kuyruk TO service_role;
GRANT TRUNCATE ON public.bildirim_kuyruk TO service_role;
GRANT REFERENCES ON public.bildirimler TO anon;
GRANT TRIGGER ON public.bildirimler TO anon;
GRANT TRUNCATE ON public.bildirimler TO anon;
GRANT DELETE ON public.bildirimler TO authenticated;
GRANT REFERENCES ON public.bildirimler TO authenticated;
GRANT SELECT ON public.bildirimler TO authenticated;
GRANT TRIGGER ON public.bildirimler TO authenticated;
GRANT TRUNCATE ON public.bildirimler TO authenticated;
GRANT UPDATE ON public.bildirimler TO authenticated;
GRANT REFERENCES ON public.bildirimler TO service_role;
GRANT TRIGGER ON public.bildirimler TO service_role;
GRANT TRUNCATE ON public.bildirimler TO service_role;
GRANT REFERENCES ON public.davetler TO anon;
GRANT SELECT ON public.davetler TO anon;
GRANT TRIGGER ON public.davetler TO anon;
GRANT TRUNCATE ON public.davetler TO anon;
GRANT INSERT ON public.davetler TO authenticated;
GRANT REFERENCES ON public.davetler TO authenticated;
GRANT SELECT ON public.davetler TO authenticated;
GRANT TRIGGER ON public.davetler TO authenticated;
GRANT TRUNCATE ON public.davetler TO authenticated;
GRANT UPDATE ON public.davetler TO authenticated;
GRANT REFERENCES ON public.davetler TO service_role;
GRANT TRIGGER ON public.davetler TO service_role;
GRANT TRUNCATE ON public.davetler TO service_role;
GRANT REFERENCES ON public.deger_gecmisi TO anon;
GRANT TRIGGER ON public.deger_gecmisi TO anon;
GRANT TRUNCATE ON public.deger_gecmisi TO anon;
GRANT REFERENCES ON public.deger_gecmisi TO authenticated;
GRANT TRIGGER ON public.deger_gecmisi TO authenticated;
GRANT TRUNCATE ON public.deger_gecmisi TO authenticated;
GRANT REFERENCES ON public.deger_gecmisi TO service_role;
GRANT TRIGGER ON public.deger_gecmisi TO service_role;
GRANT TRUNCATE ON public.deger_gecmisi TO service_role;
GRANT REFERENCES ON public.destek_talep TO anon;
GRANT TRIGGER ON public.destek_talep TO anon;
GRANT TRUNCATE ON public.destek_talep TO anon;
GRANT INSERT ON public.destek_talep TO authenticated;
GRANT REFERENCES ON public.destek_talep TO authenticated;
GRANT SELECT ON public.destek_talep TO authenticated;
GRANT TRIGGER ON public.destek_talep TO authenticated;
GRANT TRUNCATE ON public.destek_talep TO authenticated;
GRANT UPDATE ON public.destek_talep TO authenticated;
GRANT REFERENCES ON public.destek_talep TO service_role;
GRANT TRIGGER ON public.destek_talep TO service_role;
GRANT TRUNCATE ON public.destek_talep TO service_role;
GRANT REFERENCES ON public.hakem_havuzu TO anon;
GRANT TRIGGER ON public.hakem_havuzu TO anon;
GRANT TRUNCATE ON public.hakem_havuzu TO anon;
GRANT REFERENCES ON public.hakem_havuzu TO authenticated;
GRANT SELECT ON public.hakem_havuzu TO authenticated;
GRANT TRIGGER ON public.hakem_havuzu TO authenticated;
GRANT TRUNCATE ON public.hakem_havuzu TO authenticated;
GRANT REFERENCES ON public.hakem_havuzu TO service_role;
GRANT TRIGGER ON public.hakem_havuzu TO service_role;
GRANT TRUNCATE ON public.hakem_havuzu TO service_role;
GRANT REFERENCES ON public.hata_log TO anon;
GRANT TRIGGER ON public.hata_log TO anon;
GRANT TRUNCATE ON public.hata_log TO anon;
GRANT DELETE ON public.hata_log TO authenticated;
GRANT INSERT ON public.hata_log TO authenticated;
GRANT REFERENCES ON public.hata_log TO authenticated;
GRANT SELECT ON public.hata_log TO authenticated;
GRANT TRIGGER ON public.hata_log TO authenticated;
GRANT TRUNCATE ON public.hata_log TO authenticated;
GRANT REFERENCES ON public.hata_log TO service_role;
GRANT TRIGGER ON public.hata_log TO service_role;
GRANT TRUNCATE ON public.hata_log TO service_role;
GRANT REFERENCES ON public.ilan_yanitlari TO anon;
GRANT TRIGGER ON public.ilan_yanitlari TO anon;
GRANT TRUNCATE ON public.ilan_yanitlari TO anon;
GRANT DELETE ON public.ilan_yanitlari TO authenticated;
GRANT INSERT ON public.ilan_yanitlari TO authenticated;
GRANT REFERENCES ON public.ilan_yanitlari TO authenticated;
GRANT SELECT ON public.ilan_yanitlari TO authenticated;
GRANT TRIGGER ON public.ilan_yanitlari TO authenticated;
GRANT TRUNCATE ON public.ilan_yanitlari TO authenticated;
GRANT UPDATE ON public.ilan_yanitlari TO authenticated;
GRANT REFERENCES ON public.ilan_yanitlari TO service_role;
GRANT TRIGGER ON public.ilan_yanitlari TO service_role;
GRANT TRUNCATE ON public.ilan_yanitlari TO service_role;
GRANT REFERENCES ON public.ilk11 TO anon;
GRANT SELECT ON public.ilk11 TO anon;
GRANT TRIGGER ON public.ilk11 TO anon;
GRANT TRUNCATE ON public.ilk11 TO anon;
GRANT DELETE ON public.ilk11 TO authenticated;
GRANT INSERT ON public.ilk11 TO authenticated;
GRANT REFERENCES ON public.ilk11 TO authenticated;
GRANT SELECT ON public.ilk11 TO authenticated;
GRANT TRIGGER ON public.ilk11 TO authenticated;
GRANT TRUNCATE ON public.ilk11 TO authenticated;
GRANT UPDATE ON public.ilk11 TO authenticated;
GRANT REFERENCES ON public.ilk11 TO service_role;
GRANT TRIGGER ON public.ilk11 TO service_role;
GRANT TRUNCATE ON public.ilk11 TO service_role;
GRANT REFERENCES ON public.islem_log TO anon;
GRANT TRIGGER ON public.islem_log TO anon;
GRANT TRUNCATE ON public.islem_log TO anon;
GRANT INSERT ON public.islem_log TO authenticated;
GRANT REFERENCES ON public.islem_log TO authenticated;
GRANT SELECT ON public.islem_log TO authenticated;
GRANT TRIGGER ON public.islem_log TO authenticated;
GRANT TRUNCATE ON public.islem_log TO authenticated;
GRANT REFERENCES ON public.islem_log TO service_role;
GRANT TRIGGER ON public.islem_log TO service_role;
GRANT TRUNCATE ON public.islem_log TO service_role;
GRANT REFERENCES ON public.katilim TO anon;
GRANT SELECT ON public.katilim TO anon;
GRANT TRIGGER ON public.katilim TO anon;
GRANT TRUNCATE ON public.katilim TO anon;
GRANT DELETE ON public.katilim TO authenticated;
GRANT INSERT ON public.katilim TO authenticated;
GRANT REFERENCES ON public.katilim TO authenticated;
GRANT SELECT ON public.katilim TO authenticated;
GRANT TRIGGER ON public.katilim TO authenticated;
GRANT TRUNCATE ON public.katilim TO authenticated;
GRANT UPDATE ON public.katilim TO authenticated;
GRANT REFERENCES ON public.katilim TO service_role;
GRANT TRIGGER ON public.katilim TO service_role;
GRANT TRUNCATE ON public.katilim TO service_role;
GRANT REFERENCES ON public.kullanici_veri TO anon;
GRANT TRIGGER ON public.kullanici_veri TO anon;
GRANT TRUNCATE ON public.kullanici_veri TO anon;
GRANT REFERENCES ON public.kullanici_veri TO authenticated;
GRANT TRIGGER ON public.kullanici_veri TO authenticated;
GRANT TRUNCATE ON public.kullanici_veri TO authenticated;
GRANT REFERENCES ON public.kullanici_veri TO service_role;
GRANT TRIGGER ON public.kullanici_veri TO service_role;
GRANT TRUNCATE ON public.kullanici_veri TO service_role;
GRANT REFERENCES ON public.kulup_oyuncu TO anon;
GRANT TRIGGER ON public.kulup_oyuncu TO anon;
GRANT TRUNCATE ON public.kulup_oyuncu TO anon;
GRANT DELETE ON public.kulup_oyuncu TO authenticated;
GRANT INSERT ON public.kulup_oyuncu TO authenticated;
GRANT REFERENCES ON public.kulup_oyuncu TO authenticated;
GRANT SELECT ON public.kulup_oyuncu TO authenticated;
GRANT TRIGGER ON public.kulup_oyuncu TO authenticated;
GRANT TRUNCATE ON public.kulup_oyuncu TO authenticated;
GRANT UPDATE ON public.kulup_oyuncu TO authenticated;
GRANT REFERENCES ON public.kulup_oyuncu TO service_role;
GRANT TRIGGER ON public.kulup_oyuncu TO service_role;
GRANT TRUNCATE ON public.kulup_oyuncu TO service_role;
GRANT REFERENCES ON public.kulup_tum_zamanlar TO anon;
GRANT SELECT ON public.kulup_tum_zamanlar TO anon;
GRANT TRIGGER ON public.kulup_tum_zamanlar TO anon;
GRANT TRUNCATE ON public.kulup_tum_zamanlar TO anon;
GRANT REFERENCES ON public.kulup_tum_zamanlar TO authenticated;
GRANT SELECT ON public.kulup_tum_zamanlar TO authenticated;
GRANT TRIGGER ON public.kulup_tum_zamanlar TO authenticated;
GRANT TRUNCATE ON public.kulup_tum_zamanlar TO authenticated;
GRANT REFERENCES ON public.kulup_tum_zamanlar TO service_role;
GRANT TRIGGER ON public.kulup_tum_zamanlar TO service_role;
GRANT TRUNCATE ON public.kulup_tum_zamanlar TO service_role;
GRANT REFERENCES ON public.kulupler TO anon;
GRANT TRIGGER ON public.kulupler TO anon;
GRANT TRUNCATE ON public.kulupler TO anon;
GRANT DELETE ON public.kulupler TO authenticated;
GRANT INSERT ON public.kulupler TO authenticated;
GRANT REFERENCES ON public.kulupler TO authenticated;
GRANT SELECT ON public.kulupler TO authenticated;
GRANT TRIGGER ON public.kulupler TO authenticated;
GRANT TRUNCATE ON public.kulupler TO authenticated;
GRANT UPDATE ON public.kulupler TO authenticated;
GRANT REFERENCES ON public.kulupler TO service_role;
GRANT TRIGGER ON public.kulupler TO service_role;
GRANT TRUNCATE ON public.kulupler TO service_role;
GRANT REFERENCES ON public.lig_basvurulari TO anon;
GRANT TRIGGER ON public.lig_basvurulari TO anon;
GRANT TRUNCATE ON public.lig_basvurulari TO anon;
GRANT INSERT ON public.lig_basvurulari TO authenticated;
GRANT REFERENCES ON public.lig_basvurulari TO authenticated;
GRANT SELECT ON public.lig_basvurulari TO authenticated;
GRANT TRIGGER ON public.lig_basvurulari TO authenticated;
GRANT TRUNCATE ON public.lig_basvurulari TO authenticated;
GRANT UPDATE ON public.lig_basvurulari TO authenticated;
GRANT REFERENCES ON public.lig_basvurulari TO service_role;
GRANT TRIGGER ON public.lig_basvurulari TO service_role;
GRANT TRUNCATE ON public.lig_basvurulari TO service_role;
GRANT REFERENCES ON public.lig_haklari TO anon;
GRANT TRIGGER ON public.lig_haklari TO anon;
GRANT TRUNCATE ON public.lig_haklari TO anon;
GRANT DELETE ON public.lig_haklari TO authenticated;
GRANT INSERT ON public.lig_haklari TO authenticated;
GRANT REFERENCES ON public.lig_haklari TO authenticated;
GRANT SELECT ON public.lig_haklari TO authenticated;
GRANT TRIGGER ON public.lig_haklari TO authenticated;
GRANT TRUNCATE ON public.lig_haklari TO authenticated;
GRANT UPDATE ON public.lig_haklari TO authenticated;
GRANT REFERENCES ON public.lig_haklari TO service_role;
GRANT TRIGGER ON public.lig_haklari TO service_role;
GRANT TRUNCATE ON public.lig_haklari TO service_role;
GRANT REFERENCES ON public.lig_yardimci TO anon;
GRANT TRIGGER ON public.lig_yardimci TO anon;
GRANT TRUNCATE ON public.lig_yardimci TO anon;
GRANT DELETE ON public.lig_yardimci TO authenticated;
GRANT INSERT ON public.lig_yardimci TO authenticated;
GRANT REFERENCES ON public.lig_yardimci TO authenticated;
GRANT SELECT ON public.lig_yardimci TO authenticated;
GRANT TRIGGER ON public.lig_yardimci TO authenticated;
GRANT TRUNCATE ON public.lig_yardimci TO authenticated;
GRANT REFERENCES ON public.lig_yardimci TO service_role;
GRANT TRIGGER ON public.lig_yardimci TO service_role;
GRANT TRUNCATE ON public.lig_yardimci TO service_role;
GRANT REFERENCES ON public.ligler TO anon;
GRANT SELECT ON public.ligler TO anon;
GRANT TRIGGER ON public.ligler TO anon;
GRANT TRUNCATE ON public.ligler TO anon;
GRANT DELETE ON public.ligler TO authenticated;
GRANT INSERT ON public.ligler TO authenticated;
GRANT REFERENCES ON public.ligler TO authenticated;
GRANT SELECT ON public.ligler TO authenticated;
GRANT TRIGGER ON public.ligler TO authenticated;
GRANT TRUNCATE ON public.ligler TO authenticated;
GRANT UPDATE ON public.ligler TO authenticated;
GRANT REFERENCES ON public.ligler TO service_role;
GRANT TRIGGER ON public.ligler TO service_role;
GRANT TRUNCATE ON public.ligler TO service_role;
GRANT REFERENCES ON public.mac_odulleri TO anon;
GRANT SELECT ON public.mac_odulleri TO anon;
GRANT TRIGGER ON public.mac_odulleri TO anon;
GRANT TRUNCATE ON public.mac_odulleri TO anon;
GRANT DELETE ON public.mac_odulleri TO authenticated;
GRANT INSERT ON public.mac_odulleri TO authenticated;
GRANT REFERENCES ON public.mac_odulleri TO authenticated;
GRANT SELECT ON public.mac_odulleri TO authenticated;
GRANT TRIGGER ON public.mac_odulleri TO authenticated;
GRANT TRUNCATE ON public.mac_odulleri TO authenticated;
GRANT UPDATE ON public.mac_odulleri TO authenticated;
GRANT REFERENCES ON public.mac_odulleri TO service_role;
GRANT TRIGGER ON public.mac_odulleri TO service_role;
GRANT TRUNCATE ON public.mac_odulleri TO service_role;
GRANT REFERENCES ON public.mac_olaylari TO anon;
GRANT SELECT ON public.mac_olaylari TO anon;
GRANT TRIGGER ON public.mac_olaylari TO anon;
GRANT TRUNCATE ON public.mac_olaylari TO anon;
GRANT DELETE ON public.mac_olaylari TO authenticated;
GRANT INSERT ON public.mac_olaylari TO authenticated;
GRANT REFERENCES ON public.mac_olaylari TO authenticated;
GRANT SELECT ON public.mac_olaylari TO authenticated;
GRANT TRIGGER ON public.mac_olaylari TO authenticated;
GRANT TRUNCATE ON public.mac_olaylari TO authenticated;
GRANT UPDATE ON public.mac_olaylari TO authenticated;
GRANT REFERENCES ON public.mac_olaylari TO service_role;
GRANT TRIGGER ON public.mac_olaylari TO service_role;
GRANT TRUNCATE ON public.mac_olaylari TO service_role;
GRANT REFERENCES ON public.mac_oylari TO anon;
GRANT SELECT ON public.mac_oylari TO anon;
GRANT TRIGGER ON public.mac_oylari TO anon;
GRANT TRUNCATE ON public.mac_oylari TO anon;
GRANT DELETE ON public.mac_oylari TO authenticated;
GRANT INSERT ON public.mac_oylari TO authenticated;
GRANT REFERENCES ON public.mac_oylari TO authenticated;
GRANT SELECT ON public.mac_oylari TO authenticated;
GRANT TRIGGER ON public.mac_oylari TO authenticated;
GRANT TRUNCATE ON public.mac_oylari TO authenticated;
GRANT UPDATE ON public.mac_oylari TO authenticated;
GRANT REFERENCES ON public.mac_oylari TO service_role;
GRANT TRIGGER ON public.mac_oylari TO service_role;
GRANT TRUNCATE ON public.mac_oylari TO service_role;
GRANT REFERENCES ON public.mac_sonuc_log TO anon;
GRANT SELECT ON public.mac_sonuc_log TO anon;
GRANT TRIGGER ON public.mac_sonuc_log TO anon;
GRANT TRUNCATE ON public.mac_sonuc_log TO anon;
GRANT INSERT ON public.mac_sonuc_log TO authenticated;
GRANT REFERENCES ON public.mac_sonuc_log TO authenticated;
GRANT SELECT ON public.mac_sonuc_log TO authenticated;
GRANT TRIGGER ON public.mac_sonuc_log TO authenticated;
GRANT TRUNCATE ON public.mac_sonuc_log TO authenticated;
GRANT UPDATE ON public.mac_sonuc_log TO authenticated;
GRANT REFERENCES ON public.mac_sonuc_log TO service_role;
GRANT TRIGGER ON public.mac_sonuc_log TO service_role;
GRANT TRUNCATE ON public.mac_sonuc_log TO service_role;
GRANT REFERENCES ON public.maclar TO anon;
GRANT SELECT ON public.maclar TO anon;
GRANT TRIGGER ON public.maclar TO anon;
GRANT TRUNCATE ON public.maclar TO anon;
GRANT DELETE ON public.maclar TO authenticated;
GRANT INSERT ON public.maclar TO authenticated;
GRANT REFERENCES ON public.maclar TO authenticated;
GRANT SELECT ON public.maclar TO authenticated;
GRANT TRIGGER ON public.maclar TO authenticated;
GRANT TRUNCATE ON public.maclar TO authenticated;
GRANT UPDATE ON public.maclar TO authenticated;
GRANT REFERENCES ON public.maclar TO service_role;
GRANT TRIGGER ON public.maclar TO service_role;
GRANT TRUNCATE ON public.maclar TO service_role;
GRANT INSERT ON public.olay_log TO anon;
GRANT REFERENCES ON public.olay_log TO anon;
GRANT TRIGGER ON public.olay_log TO anon;
GRANT TRUNCATE ON public.olay_log TO anon;
GRANT INSERT ON public.olay_log TO authenticated;
GRANT REFERENCES ON public.olay_log TO authenticated;
GRANT SELECT ON public.olay_log TO authenticated;
GRANT TRIGGER ON public.olay_log TO authenticated;
GRANT TRUNCATE ON public.olay_log TO authenticated;
GRANT REFERENCES ON public.olay_log TO service_role;
GRANT TRIGGER ON public.olay_log TO service_role;
GRANT TRUNCATE ON public.olay_log TO service_role;
GRANT REFERENCES ON public.oyuncu_kariyer TO anon;
GRANT SELECT ON public.oyuncu_kariyer TO anon;
GRANT TRIGGER ON public.oyuncu_kariyer TO anon;
GRANT TRUNCATE ON public.oyuncu_kariyer TO anon;
GRANT REFERENCES ON public.oyuncu_kariyer TO authenticated;
GRANT SELECT ON public.oyuncu_kariyer TO authenticated;
GRANT TRIGGER ON public.oyuncu_kariyer TO authenticated;
GRANT TRUNCATE ON public.oyuncu_kariyer TO authenticated;
GRANT REFERENCES ON public.oyuncu_kariyer TO service_role;
GRANT TRIGGER ON public.oyuncu_kariyer TO service_role;
GRANT TRUNCATE ON public.oyuncu_kariyer TO service_role;
GRANT REFERENCES ON public.oyuncu_kart_foto TO anon;
GRANT SELECT ON public.oyuncu_kart_foto TO anon;
GRANT TRIGGER ON public.oyuncu_kart_foto TO anon;
GRANT TRUNCATE ON public.oyuncu_kart_foto TO anon;
GRANT DELETE ON public.oyuncu_kart_foto TO authenticated;
GRANT INSERT ON public.oyuncu_kart_foto TO authenticated;
GRANT REFERENCES ON public.oyuncu_kart_foto TO authenticated;
GRANT SELECT ON public.oyuncu_kart_foto TO authenticated;
GRANT TRIGGER ON public.oyuncu_kart_foto TO authenticated;
GRANT TRUNCATE ON public.oyuncu_kart_foto TO authenticated;
GRANT UPDATE ON public.oyuncu_kart_foto TO authenticated;
GRANT REFERENCES ON public.oyuncu_kart_foto TO service_role;
GRANT TRIGGER ON public.oyuncu_kart_foto TO service_role;
GRANT TRUNCATE ON public.oyuncu_kart_foto TO service_role;
GRANT REFERENCES ON public.oyuncu_takim TO anon;
GRANT SELECT ON public.oyuncu_takim TO anon;
GRANT TRIGGER ON public.oyuncu_takim TO anon;
GRANT TRUNCATE ON public.oyuncu_takim TO anon;
GRANT DELETE ON public.oyuncu_takim TO authenticated;
GRANT INSERT ON public.oyuncu_takim TO authenticated;
GRANT REFERENCES ON public.oyuncu_takim TO authenticated;
GRANT SELECT ON public.oyuncu_takim TO authenticated;
GRANT TRIGGER ON public.oyuncu_takim TO authenticated;
GRANT TRUNCATE ON public.oyuncu_takim TO authenticated;
GRANT UPDATE ON public.oyuncu_takim TO authenticated;
GRANT REFERENCES ON public.oyuncu_takim TO service_role;
GRANT TRIGGER ON public.oyuncu_takim TO service_role;
GRANT TRUNCATE ON public.oyuncu_takim TO service_role;
GRANT REFERENCES ON public.oyuncular TO anon;
GRANT TRIGGER ON public.oyuncular TO anon;
GRANT TRUNCATE ON public.oyuncular TO anon;
GRANT DELETE ON public.oyuncular TO authenticated;
GRANT INSERT ON public.oyuncular TO authenticated;
GRANT REFERENCES ON public.oyuncular TO authenticated;
GRANT SELECT ON public.oyuncular TO authenticated;
GRANT TRIGGER ON public.oyuncular TO authenticated;
GRANT TRUNCATE ON public.oyuncular TO authenticated;
GRANT UPDATE ON public.oyuncular TO authenticated;
GRANT REFERENCES ON public.oyuncular TO service_role;
GRANT TRIGGER ON public.oyuncular TO service_role;
GRANT TRUNCATE ON public.oyuncular TO service_role;
GRANT REFERENCES ON public.oyuncular_acik TO anon;
GRANT SELECT ON public.oyuncular_acik TO anon;
GRANT TRIGGER ON public.oyuncular_acik TO anon;
GRANT TRUNCATE ON public.oyuncular_acik TO anon;
GRANT REFERENCES ON public.oyuncular_acik TO authenticated;
GRANT SELECT ON public.oyuncular_acik TO authenticated;
GRANT TRIGGER ON public.oyuncular_acik TO authenticated;
GRANT TRUNCATE ON public.oyuncular_acik TO authenticated;
GRANT REFERENCES ON public.oyuncular_acik TO service_role;
GRANT TRIGGER ON public.oyuncular_acik TO service_role;
GRANT TRUNCATE ON public.oyuncular_acik TO service_role;
GRANT REFERENCES ON public.paylasilan_ligler TO anon;
GRANT SELECT ON public.paylasilan_ligler TO anon;
GRANT TRIGGER ON public.paylasilan_ligler TO anon;
GRANT TRUNCATE ON public.paylasilan_ligler TO anon;
GRANT DELETE ON public.paylasilan_ligler TO authenticated;
GRANT INSERT ON public.paylasilan_ligler TO authenticated;
GRANT REFERENCES ON public.paylasilan_ligler TO authenticated;
GRANT SELECT ON public.paylasilan_ligler TO authenticated;
GRANT TRIGGER ON public.paylasilan_ligler TO authenticated;
GRANT TRUNCATE ON public.paylasilan_ligler TO authenticated;
GRANT UPDATE ON public.paylasilan_ligler TO authenticated;
GRANT REFERENCES ON public.paylasilan_ligler TO service_role;
GRANT TRIGGER ON public.paylasilan_ligler TO service_role;
GRANT TRUNCATE ON public.paylasilan_ligler TO service_role;
GRANT REFERENCES ON public.pazar_ilanlari TO anon;
GRANT TRIGGER ON public.pazar_ilanlari TO anon;
GRANT TRUNCATE ON public.pazar_ilanlari TO anon;
GRANT DELETE ON public.pazar_ilanlari TO authenticated;
GRANT INSERT ON public.pazar_ilanlari TO authenticated;
GRANT REFERENCES ON public.pazar_ilanlari TO authenticated;
GRANT SELECT ON public.pazar_ilanlari TO authenticated;
GRANT TRIGGER ON public.pazar_ilanlari TO authenticated;
GRANT TRUNCATE ON public.pazar_ilanlari TO authenticated;
GRANT UPDATE ON public.pazar_ilanlari TO authenticated;
GRANT REFERENCES ON public.pazar_ilanlari TO service_role;
GRANT TRIGGER ON public.pazar_ilanlari TO service_role;
GRANT TRUNCATE ON public.pazar_ilanlari TO service_role;
GRANT REFERENCES ON public.profiller TO anon;
GRANT TRIGGER ON public.profiller TO anon;
GRANT TRUNCATE ON public.profiller TO anon;
GRANT INSERT ON public.profiller TO authenticated;
GRANT REFERENCES ON public.profiller TO authenticated;
GRANT SELECT ON public.profiller TO authenticated;
GRANT TRIGGER ON public.profiller TO authenticated;
GRANT TRUNCATE ON public.profiller TO authenticated;
GRANT UPDATE ON public.profiller TO authenticated;
GRANT REFERENCES ON public.profiller TO service_role;
GRANT TRIGGER ON public.profiller TO service_role;
GRANT TRUNCATE ON public.profiller TO service_role;
GRANT REFERENCES ON public.push_abonelikleri TO anon;
GRANT TRIGGER ON public.push_abonelikleri TO anon;
GRANT TRUNCATE ON public.push_abonelikleri TO anon;
GRANT DELETE ON public.push_abonelikleri TO authenticated;
GRANT INSERT ON public.push_abonelikleri TO authenticated;
GRANT REFERENCES ON public.push_abonelikleri TO authenticated;
GRANT SELECT ON public.push_abonelikleri TO authenticated;
GRANT TRIGGER ON public.push_abonelikleri TO authenticated;
GRANT TRUNCATE ON public.push_abonelikleri TO authenticated;
GRANT UPDATE ON public.push_abonelikleri TO authenticated;
GRANT DELETE ON public.push_abonelikleri TO service_role;
GRANT INSERT ON public.push_abonelikleri TO service_role;
GRANT REFERENCES ON public.push_abonelikleri TO service_role;
GRANT SELECT ON public.push_abonelikleri TO service_role;
GRANT TRIGGER ON public.push_abonelikleri TO service_role;
GRANT TRUNCATE ON public.push_abonelikleri TO service_role;
GRANT UPDATE ON public.push_abonelikleri TO service_role;
GRANT REFERENCES ON public.sahiplenmeler TO anon;
GRANT TRIGGER ON public.sahiplenmeler TO anon;
GRANT TRUNCATE ON public.sahiplenmeler TO anon;
GRANT DELETE ON public.sahiplenmeler TO authenticated;
GRANT INSERT ON public.sahiplenmeler TO authenticated;
GRANT REFERENCES ON public.sahiplenmeler TO authenticated;
GRANT SELECT ON public.sahiplenmeler TO authenticated;
GRANT TRIGGER ON public.sahiplenmeler TO authenticated;
GRANT TRUNCATE ON public.sahiplenmeler TO authenticated;
GRANT UPDATE ON public.sahiplenmeler TO authenticated;
GRANT REFERENCES ON public.sahiplenmeler TO service_role;
GRANT TRIGGER ON public.sahiplenmeler TO service_role;
GRANT TRUNCATE ON public.sahiplenmeler TO service_role;
GRANT REFERENCES ON public.sistem_ayar TO anon;
GRANT SELECT ON public.sistem_ayar TO anon;
GRANT TRIGGER ON public.sistem_ayar TO anon;
GRANT TRUNCATE ON public.sistem_ayar TO anon;
GRANT INSERT ON public.sistem_ayar TO authenticated;
GRANT REFERENCES ON public.sistem_ayar TO authenticated;
GRANT SELECT ON public.sistem_ayar TO authenticated;
GRANT TRIGGER ON public.sistem_ayar TO authenticated;
GRANT TRUNCATE ON public.sistem_ayar TO authenticated;
GRANT UPDATE ON public.sistem_ayar TO authenticated;
GRANT REFERENCES ON public.sistem_ayar TO service_role;
GRANT TRIGGER ON public.sistem_ayar TO service_role;
GRANT TRUNCATE ON public.sistem_ayar TO service_role;
GRANT REFERENCES ON public.site_ayar TO anon;
GRANT SELECT ON public.site_ayar TO anon;
GRANT TRIGGER ON public.site_ayar TO anon;
GRANT TRUNCATE ON public.site_ayar TO anon;
GRANT REFERENCES ON public.site_ayar TO authenticated;
GRANT SELECT ON public.site_ayar TO authenticated;
GRANT TRIGGER ON public.site_ayar TO authenticated;
GRANT TRUNCATE ON public.site_ayar TO authenticated;
GRANT UPDATE ON public.site_ayar TO authenticated;
GRANT REFERENCES ON public.site_ayar TO service_role;
GRANT TRIGGER ON public.site_ayar TO service_role;
GRANT TRUNCATE ON public.site_ayar TO service_role;
GRANT REFERENCES ON public.sohbet_ayar TO anon;
GRANT TRIGGER ON public.sohbet_ayar TO anon;
GRANT TRUNCATE ON public.sohbet_ayar TO anon;
GRANT REFERENCES ON public.sohbet_ayar TO authenticated;
GRANT SELECT ON public.sohbet_ayar TO authenticated;
GRANT TRIGGER ON public.sohbet_ayar TO authenticated;
GRANT TRUNCATE ON public.sohbet_ayar TO authenticated;
GRANT REFERENCES ON public.sohbet_ayar TO service_role;
GRANT TRIGGER ON public.sohbet_ayar TO service_role;
GRANT TRUNCATE ON public.sohbet_ayar TO service_role;
GRANT REFERENCES ON public.sohbet_cezalari TO anon;
GRANT TRIGGER ON public.sohbet_cezalari TO anon;
GRANT TRUNCATE ON public.sohbet_cezalari TO anon;
GRANT REFERENCES ON public.sohbet_cezalari TO authenticated;
GRANT SELECT ON public.sohbet_cezalari TO authenticated;
GRANT TRIGGER ON public.sohbet_cezalari TO authenticated;
GRANT TRUNCATE ON public.sohbet_cezalari TO authenticated;
GRANT REFERENCES ON public.sohbet_cezalari TO service_role;
GRANT TRIGGER ON public.sohbet_cezalari TO service_role;
GRANT TRUNCATE ON public.sohbet_cezalari TO service_role;
GRANT REFERENCES ON public.sohbet_ihlal TO anon;
GRANT TRIGGER ON public.sohbet_ihlal TO anon;
GRANT TRUNCATE ON public.sohbet_ihlal TO anon;
GRANT REFERENCES ON public.sohbet_ihlal TO authenticated;
GRANT SELECT ON public.sohbet_ihlal TO authenticated;
GRANT TRIGGER ON public.sohbet_ihlal TO authenticated;
GRANT TRUNCATE ON public.sohbet_ihlal TO authenticated;
GRANT REFERENCES ON public.sohbet_ihlal TO service_role;
GRANT TRIGGER ON public.sohbet_ihlal TO service_role;
GRANT TRUNCATE ON public.sohbet_ihlal TO service_role;
GRANT REFERENCES ON public.sohbet_mesajlari TO anon;
GRANT TRIGGER ON public.sohbet_mesajlari TO anon;
GRANT TRUNCATE ON public.sohbet_mesajlari TO anon;
GRANT DELETE ON public.sohbet_mesajlari TO authenticated;
GRANT INSERT ON public.sohbet_mesajlari TO authenticated;
GRANT REFERENCES ON public.sohbet_mesajlari TO authenticated;
GRANT SELECT ON public.sohbet_mesajlari TO authenticated;
GRANT TRIGGER ON public.sohbet_mesajlari TO authenticated;
GRANT TRUNCATE ON public.sohbet_mesajlari TO authenticated;
GRANT UPDATE ON public.sohbet_mesajlari TO authenticated;
GRANT REFERENCES ON public.sohbet_mesajlari TO service_role;
GRANT TRIGGER ON public.sohbet_mesajlari TO service_role;
GRANT TRUNCATE ON public.sohbet_mesajlari TO service_role;
GRANT REFERENCES ON public.sohbet_okuma TO anon;
GRANT TRIGGER ON public.sohbet_okuma TO anon;
GRANT TRUNCATE ON public.sohbet_okuma TO anon;
GRANT DELETE ON public.sohbet_okuma TO authenticated;
GRANT INSERT ON public.sohbet_okuma TO authenticated;
GRANT REFERENCES ON public.sohbet_okuma TO authenticated;
GRANT SELECT ON public.sohbet_okuma TO authenticated;
GRANT TRIGGER ON public.sohbet_okuma TO authenticated;
GRANT TRUNCATE ON public.sohbet_okuma TO authenticated;
GRANT UPDATE ON public.sohbet_okuma TO authenticated;
GRANT REFERENCES ON public.sohbet_okuma TO service_role;
GRANT TRIGGER ON public.sohbet_okuma TO service_role;
GRANT TRUNCATE ON public.sohbet_okuma TO service_role;
GRANT REFERENCES ON public.sohbet_sikayet TO anon;
GRANT TRIGGER ON public.sohbet_sikayet TO anon;
GRANT TRUNCATE ON public.sohbet_sikayet TO anon;
GRANT INSERT ON public.sohbet_sikayet TO authenticated;
GRANT REFERENCES ON public.sohbet_sikayet TO authenticated;
GRANT SELECT ON public.sohbet_sikayet TO authenticated;
GRANT TRIGGER ON public.sohbet_sikayet TO authenticated;
GRANT TRUNCATE ON public.sohbet_sikayet TO authenticated;
GRANT UPDATE ON public.sohbet_sikayet TO authenticated;
GRANT REFERENCES ON public.sohbet_sikayet TO service_role;
GRANT TRIGGER ON public.sohbet_sikayet TO service_role;
GRANT TRUNCATE ON public.sohbet_sikayet TO service_role;
GRANT REFERENCES ON public.sohbet_tepkileri TO anon;
GRANT TRIGGER ON public.sohbet_tepkileri TO anon;
GRANT TRUNCATE ON public.sohbet_tepkileri TO anon;
GRANT DELETE ON public.sohbet_tepkileri TO authenticated;
GRANT INSERT ON public.sohbet_tepkileri TO authenticated;
GRANT REFERENCES ON public.sohbet_tepkileri TO authenticated;
GRANT SELECT ON public.sohbet_tepkileri TO authenticated;
GRANT TRIGGER ON public.sohbet_tepkileri TO authenticated;
GRANT TRUNCATE ON public.sohbet_tepkileri TO authenticated;
GRANT REFERENCES ON public.sohbet_tepkileri TO service_role;
GRANT TRIGGER ON public.sohbet_tepkileri TO service_role;
GRANT TRUNCATE ON public.sohbet_tepkileri TO service_role;
GRANT REFERENCES ON public.takimlar TO anon;
GRANT SELECT ON public.takimlar TO anon;
GRANT TRIGGER ON public.takimlar TO anon;
GRANT TRUNCATE ON public.takimlar TO anon;
GRANT DELETE ON public.takimlar TO authenticated;
GRANT INSERT ON public.takimlar TO authenticated;
GRANT REFERENCES ON public.takimlar TO authenticated;
GRANT SELECT ON public.takimlar TO authenticated;
GRANT TRIGGER ON public.takimlar TO authenticated;
GRANT TRUNCATE ON public.takimlar TO authenticated;
GRANT UPDATE ON public.takimlar TO authenticated;
GRANT REFERENCES ON public.takimlar TO service_role;
GRANT TRIGGER ON public.takimlar TO service_role;
GRANT TRUNCATE ON public.takimlar TO service_role;
GRANT REFERENCES ON public.takipler TO anon;
GRANT SELECT ON public.takipler TO anon;
GRANT TRIGGER ON public.takipler TO anon;
GRANT TRUNCATE ON public.takipler TO anon;
GRANT DELETE ON public.takipler TO authenticated;
GRANT INSERT ON public.takipler TO authenticated;
GRANT REFERENCES ON public.takipler TO authenticated;
GRANT SELECT ON public.takipler TO authenticated;
GRANT TRIGGER ON public.takipler TO authenticated;
GRANT TRUNCATE ON public.takipler TO authenticated;
GRANT REFERENCES ON public.takipler TO service_role;
GRANT TRIGGER ON public.takipler TO service_role;
GRANT TRUNCATE ON public.takipler TO service_role;
GRANT REFERENCES ON public.transferler TO anon;
GRANT TRIGGER ON public.transferler TO anon;
GRANT TRUNCATE ON public.transferler TO anon;
GRANT DELETE ON public.transferler TO authenticated;
GRANT INSERT ON public.transferler TO authenticated;
GRANT REFERENCES ON public.transferler TO authenticated;
GRANT SELECT ON public.transferler TO authenticated;
GRANT TRIGGER ON public.transferler TO authenticated;
GRANT TRUNCATE ON public.transferler TO authenticated;
GRANT UPDATE ON public.transferler TO authenticated;
GRANT REFERENCES ON public.transferler TO service_role;
GRANT TRIGGER ON public.transferler TO service_role;
GRANT TRUNCATE ON public.transferler TO service_role;
GRANT REFERENCES ON public.yasaklilar TO anon;
GRANT TRIGGER ON public.yasaklilar TO anon;
GRANT TRUNCATE ON public.yasaklilar TO anon;
GRANT DELETE ON public.yasaklilar TO authenticated;
GRANT INSERT ON public.yasaklilar TO authenticated;
GRANT REFERENCES ON public.yasaklilar TO authenticated;
GRANT SELECT ON public.yasaklilar TO authenticated;
GRANT TRIGGER ON public.yasaklilar TO authenticated;
GRANT TRUNCATE ON public.yasaklilar TO authenticated;
GRANT UPDATE ON public.yasaklilar TO authenticated;
GRANT REFERENCES ON public.yasaklilar TO service_role;
GRANT TRIGGER ON public.yasaklilar TO service_role;
GRANT TRUNCATE ON public.yasaklilar TO service_role;
GRANT REFERENCES ON public.yetkiler TO anon;
GRANT TRIGGER ON public.yetkiler TO anon;
GRANT TRUNCATE ON public.yetkiler TO anon;
GRANT DELETE ON public.yetkiler TO authenticated;
GRANT INSERT ON public.yetkiler TO authenticated;
GRANT REFERENCES ON public.yetkiler TO authenticated;
GRANT SELECT ON public.yetkiler TO authenticated;
GRANT TRIGGER ON public.yetkiler TO authenticated;
GRANT TRUNCATE ON public.yetkiler TO authenticated;
GRANT UPDATE ON public.yetkiler TO authenticated;
GRANT REFERENCES ON public.yetkiler TO service_role;
GRANT TRIGGER ON public.yetkiler TO service_role;
GRANT TRUNCATE ON public.yetkiler TO service_role;