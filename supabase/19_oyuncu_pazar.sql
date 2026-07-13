-- =====================================================================
--  ForzaLig — OYUNCU TRANSFER PAZARI (müsait/boştaki oyuncular)
--  Bir oyuncu "takım arıyorum" işareti koyabilir; kaptanlar keşfeder.
--  Sadece oyuncuyu sahiplenen kişi kendi müsaitlik durumunu değiştirir.
--  01_sema.sql + 02_guvenlik.sql'den SONRA çalıştır.
-- =====================================================================

-- oyuncular tablosuna pazar alanları
alter table public.oyuncular add column if not exists musait boolean not null default false;
alter table public.oyuncular add column if not exists musait_sehir text;
alter table public.oyuncular add column if not exists musait_not text;
alter table public.oyuncular add column if not exists musait_t timestamptz;

create index if not exists ix_oyuncu_musait on public.oyuncular(musait) where musait;

-- Sahiplenen kişi kendi müsaitlik durumunu ayarlar (SECURITY DEFINER RPC)
create or replace function public.oyuncu_musait_ayar(
  p_player_id uuid, p_musait boolean, p_sehir text default null, p_not text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_sahip uuid;
begin
  select sahip_user_id into v_sahip from public.oyuncular where player_id = p_player_id;
  if v_sahip is null or v_sahip <> auth.uid() then
    return false;   -- sadece kendi kartını
  end if;
  update public.oyuncular
    set musait = p_musait,
        musait_sehir = case when p_musait then p_sehir else null end,
        musait_not   = case when p_musait then p_not   else null end,
        musait_t     = case when p_musait then now()   else null end
    where player_id = p_player_id;
  return true;
end $$;

-- Pazar listesi: müsait oyuncular (KVKK-güvenli alanlar). Herkes okuyabilir.
create or replace function public.pazar_oyuncular(p_sehir text default null)
returns table(
  player_id uuid, ad_soyad text, poz text, forma_no int, foto text,
  musait_sehir text, musait_not text, musait_t timestamptz
) language sql stable security definer set search_path = public as $$
  select o.player_id, o.ad_soyad, o.poz, o.forma_no, o.foto,
         o.musait_sehir, o.musait_not, o.musait_t
  from public.oyuncular o
  where o.musait = true
    and (p_sehir is null or o.musait_sehir ilike '%'||p_sehir||'%')
  order by o.musait_t desc nulls last
  limit 100;
$$;
