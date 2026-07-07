-- =====================================================================
--  ForzaLig — EK ALANLAR (mevcut zengin arayüzü ilişkiselle bağlamak)
--  Çekirdek ilişkisel kalır; maça/oyuncuya özel görsel veriler JSON.
--  01-05'ten SONRA çalıştır. Idempotent (tekrar çalıştırılabilir).
-- =====================================================================

-- ---- LİGLER: format, grup, sponsor, tema ----
alter table public.ligler add column if not exists format        text default 'tek';   -- serbest/tek/cift/gruplu/kupa
alter table public.ligler add column if not exists grup_sayi     int  default 0;
alter table public.ligler add column if not exists renk          text;
alter table public.ligler add column if not exists kisi          int  default 8;       -- saha oyuncu sayısı (formasyon)
alter table public.ligler add column if not exists ilce          text;
alter table public.ligler add column if not exists sponsor_ad    text;
alter table public.ligler add column if not exists sponsor_emoji text;

-- ---- TAKIMLAR: tema rengi, grup, lisans ----
alter table public.takimlar add column if not exists renk   text;
alter table public.takimlar add column if not exists grup   int default 0;
alter table public.takimlar add column if not exists lis_no text;

-- ---- OYUNCULAR: pozisyon, FIFA nitelikleri, değer, sağlık ----
alter table public.oyuncular add column if not exists poz     text;                 -- Kaleci/Defans/OrtaSaha/Forvet
alter table public.oyuncular add column if not exists ovr     int;                  -- genel (55-100)
alter table public.oyuncular add column if not exists nitelik jsonb;                -- {pac,sho,pas,dri,def,phy}
alter table public.oyuncular add column if not exists deger   numeric;              -- piyasa değeri (M€)
alter table public.oyuncular add column if not exists saglik  text default 'Sağlam';
alter table public.oyuncular add column if not exists bolge   text;                 -- Sol Kanat/Merkez...
alter table public.oyuncular add column if not exists renk    text;

-- ---- MAÇLAR: kupa alanları, formasyon, rating, takım istatistiği ----
alter table public.maclar add column if not exists tur          int;      -- kupa turu
alter table public.maclar add column if not exists grup         int;      -- gruplu lig grup no
alter table public.maclar add column if not exists bye          boolean default false;
alter table public.maclar add column if not exists pen_galip    text;     -- penaltı galibi (takım adı)
alter table public.maclar add column if not exists mvp_player   uuid references public.oyuncular(player_id);
alter table public.maclar add column if not exists sure         int default 60;
alter table public.maclar add column if not exists dizilis_ev   text;     -- "3-2-1"
alter table public.maclar add column if not exists dizilis_dep  text;
alter table public.maclar add column if not exists kadro_ev     jsonb;    -- {yerlesim:[player_id...], yedek:[...]}
alter table public.maclar add column if not exists kadro_dep    jsonb;
alter table public.maclar add column if not exists istatistik   jsonb;    -- {sahiplikA,sutA,...}
alter table public.maclar add column if not exists ratingler    jsonb;    -- {oyuncuAd: 7.4}
alter table public.maclar add column if not exists stad         text;
alter table public.maclar add column if not exists hakem        text;
-- Maça özel görsel blob (tam sadakat): olaylar/kaleciler/oduller/mvp
--  (kariyer sorguları mac_olaylari + mac_odulleri'nden; bu alan sadece gösterim)
alter table public.maclar add column if not exists olaylar      jsonb;    -- [{oyuncu,takim,tip,asist,dk}]
alter table public.maclar add column if not exists kaleciler    jsonb;    -- [{ad,kurtaris}]
alter table public.maclar add column if not exists oduller      jsonb;    -- {mvp,forvet,...}
alter table public.maclar add column if not exists mvp          text;     -- oyuncu adı
alter table public.maclar add column if not exists mvp_takim    text;

-- ---- MAÇ OLAYLARI: kurtarış adedi (bir kalecinin maçtaki kurtarış sayısı) ----
--  tip: gol / asist / sari / kirmizi / kurtaris / degisik
alter table public.mac_olaylari add column if not exists adet   int default 1;
alter table public.mac_olaylari add column if not exists ekstra jsonb;   -- {cikan,giren} gibi (değişiklik)

-- ---- MAÇ ÖDÜLLERİ: maçın adamı / altın top / mevki ödülleri (kariyere sayılır) ----
create table if not exists public.mac_odulleri (
  id         uuid primary key default gen_random_uuid(),
  mac_id     uuid not null references public.maclar(id) on delete cascade,
  player_id  uuid not null references public.oyuncular(player_id),
  odul_tip   text not null    -- mvp/altin/gumus/forvet/ortasaha/defans/kaleci/centilmen/enerjik/macinGolu
);
create index if not exists ix_odul_mac on public.mac_odulleri(mac_id);
create index if not exists ix_odul_player on public.mac_odulleri(player_id);

-- ---- GÜVENLİK: mac_odulleri (okuma herkese, yazma lig yöneticisi) ----
alter table public.mac_odulleri enable row level security;
drop policy if exists p_odul_sel on public.mac_odulleri;
create policy p_odul_sel on public.mac_odulleri for select using (true);
drop policy if exists p_odul_yaz on public.mac_odulleri;
create policy p_odul_yaz on public.mac_odulleri for all to authenticated
  using (exists(select 1 from public.maclar m where m.id = mac_odulleri.mac_id and public.lig_yoneticim(m.lig_id)))
  with check (exists(select 1 from public.maclar m where m.id = mac_odulleri.mac_id and public.lig_yoneticim(m.lig_id)));
grant select on public.mac_odulleri to anon, authenticated;
grant select, insert, update, delete on public.mac_odulleri to authenticated;

-- ---- KVKK açık görünümü genişlet: pozisyon, ovr, değer de görünür (hassas değil) ----
--  (önce sil: sütun sırası değiştiği için 'create or replace' hata verir)
drop view if exists public.oyuncular_acik;
create view public.oyuncular_acik as
  select
    player_id,
    coalesce(nullif(takma_ad,''), ad_soyad) as gorunen_ad,
    forma_no, poz, ovr, ayak, boy, bolge, renk, deger, saglik,
    case when dogum is not null then extract(year from age(dogum))::int end as yas,
    durum
  from public.oyuncular;
grant select on public.oyuncular_acik to anon, authenticated;
