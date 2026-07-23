-- =====================================================================
--  ForzaLig — OYUNCU KARTI · foto sistemi + rarity/konsept override
--  Faz 1+2: kart gerçek oyuncu verisine bağlanır (ovr/nitelik/foto/poz
--  zaten var). Bu migration: (1) oyuncuya en fazla 5 KART fotoğrafı
--  (kendi crop/arka planıyla), (2) rarity + konsept elle override alanı.
--  İdempotent. Supabase SQL Editor → Run.
-- =====================================================================

-- 1) Kart override alanları (null = otomatik: rarity OVR'a göre, konsept varsayılan)
alter table public.oyuncular add column if not exists kart_rarity  text;
alter table public.oyuncular add column if not exists kart_konsept int;

-- Açık görünüme kart alanlarını ekle. NOT: oyuncu_kariyer bu view'e bağlı →
-- drop EDİLEMEZ. create OR REPLACE ile mevcut kolonlar BİREBİR korunur, yenileri SONA eklenir.
create or replace view public.oyuncular_acik as
  select
    player_id,
    coalesce(nullif(takma_ad,''), ad_soyad) as gorunen_ad,
    forma_no, poz, ovr, ayak, boy, bolge, renk, deger, saglik, nitelik,
    foto,
    case when dogum is not null then extract(year from age(dogum))::int end as yas,
    durum,
    kart_rarity, kart_konsept
  from public.oyuncular;
grant select on public.oyuncular_acik to anon, authenticated;

-- 2) KART FOTOĞRAFLARI — oyuncu başına en fazla 5, her biri kendi crop/arka planı
create table if not exists public.oyuncu_kart_foto (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.oyuncular(player_id) on delete cascade,
  url        text not null,
  crop       jsonb,                        -- {fx,fy,zoom}
  arka_plan  text default 'orijinal',
  sira       int  default 0,               -- 0 = varsayılan/ilk kart
  olusma     timestamptz default now()
);
create index if not exists ix_kart_foto_player on public.oyuncu_kart_foto(player_id, sira);

alter table public.oyuncu_kart_foto enable row level security;

-- Okuma: herkes (kartlar herkese açık)
drop policy if exists p_kartfoto_sel on public.oyuncu_kart_foto;
create policy p_kartfoto_sel on public.oyuncu_kart_foto for select using (true);

-- Yazma: oyuncunun sahibi VEYA Süper Admin
drop policy if exists p_kartfoto_ins on public.oyuncu_kart_foto;
create policy p_kartfoto_ins on public.oyuncu_kart_foto for insert to authenticated
  with check ( public.admin_mi()
    or exists(select 1 from public.oyuncular o where o.player_id = oyuncu_kart_foto.player_id and o.sahip_user_id = auth.uid()) );
drop policy if exists p_kartfoto_upd on public.oyuncu_kart_foto;
create policy p_kartfoto_upd on public.oyuncu_kart_foto for update to authenticated
  using ( public.admin_mi()
    or exists(select 1 from public.oyuncular o where o.player_id = oyuncu_kart_foto.player_id and o.sahip_user_id = auth.uid()) );
drop policy if exists p_kartfoto_del on public.oyuncu_kart_foto;
create policy p_kartfoto_del on public.oyuncu_kart_foto for delete to authenticated
  using ( public.admin_mi()
    or exists(select 1 from public.oyuncular o where o.player_id = oyuncu_kart_foto.player_id and o.sahip_user_id = auth.uid()) );

grant select on public.oyuncu_kart_foto to anon, authenticated;
grant insert, update, delete on public.oyuncu_kart_foto to authenticated;

-- 3) En fazla 5 kart fotoğrafı — trigger guard
create or replace function public.trg_kart_foto_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.oyuncu_kart_foto where player_id = new.player_id) >= 5 then
    raise exception 'En fazla 5 kart fotoğrafı eklenebilir.';
  end if;
  return new;
end $$;
drop trigger if exists t_kart_foto_limit on public.oyuncu_kart_foto;
create trigger t_kart_foto_limit before insert on public.oyuncu_kart_foto
  for each row execute function public.trg_kart_foto_limit();

-- =====================================================================
--  Not: OVR + nitelik(pac/sho/pas/dri/def/phy) + poz + foto zaten
--  oyuncular_acik'te; kart bunları okur. kart_rarity/kart_konsept null
--  ise otomatik (rarity ← OVR). Foto yoksa profil fotoğrafı kullanılır.
-- =====================================================================
