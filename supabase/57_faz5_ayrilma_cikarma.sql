-- =====================================================================
--  ForzaLig — FAZ 5 (son): Ayrılma talebi (Q16) + Çıkarma & bildirim (Q17/Q18)
--  Q16: Oyuncu kendi isteğiyle ayrılma talebi oluşturur; yönetici onaylar/reddeder.
--  Q17: Yönetici oyuncuyu çıkarır → üyelik biter (silinmez), istatistik korunur,
--       oyuncuya BİLDİRİM gider. Q18: çıkarma/ayrılma kararı bildirimle iletilir.
--  25 + 45'ten SONRA çalıştır. İdempotent. Supabase → Run.
-- =====================================================================

-- Üyeliğe: ayrılma sebebi + bekleyen ayrılma talebi bayrağı
alter table public.oyuncu_takim add column if not exists ayrilma_sebep text;   -- 'cikarildi' | 'kendi_istegi'
alter table public.oyuncu_takim add column if not exists ayrilma_talep boolean not null default false;
create index if not exists ix_ot_ayrilma_talep on public.oyuncu_takim(lig_id) where ayrilma_talep;

-- 1) Q17/Q18 — Yönetici oyuncuyu çıkarır (üyelik pasifleşir, istatistik korunur, bildirim gider)
create or replace function public.oyuncu_cikar(p_player uuid, p_takim uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_ot uuid; v_lig uuid; v_sahip uuid; v_tk text;
begin
  select id, lig_id into v_ot, v_lig from public.oyuncu_takim
    where player_id=p_player and takim_id=p_takim and aktif;
  if v_ot is null or not public.takim_yoneticim(p_takim) then return false; end if;
  update public.oyuncu_takim
    set aktif=false, ayrilma=now(), ayrilma_sebep='cikarildi', ayrilma_talep=false
    where id=v_ot;
  select sahip_user_id into v_sahip from public.oyuncular where player_id=p_player;
  select ad into v_tk from public.takimlar where id=p_takim;
  if v_sahip is not null then
    perform public.bildirim_yolla(v_sahip, 'cikarildi', 'Takımdan çıkarıldın',
      coalesce(v_tk,'Takım')||' kadrosundan çıkarıldın. Geçmiş istatistiklerin korunur.',
      'turnuva', v_lig::text);
  end if;
  return true;
end $$;
grant execute on function public.oyuncu_cikar(uuid, uuid) to authenticated;

-- 2) Q16 — Oyuncu KENDİ isteğiyle ayrılma talebi (sadece oyuncunun kendisi)
create or replace function public.ayrilma_talep_olustur(p_player uuid, p_lig uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_ot uuid; v_takim uuid; v_sahip uuid; v_oy text; v_tk text; v_yon uuid;
begin
  select id, takim_id into v_ot, v_takim from public.oyuncu_takim
    where player_id=p_player and lig_id=p_lig and aktif;
  if v_ot is null then return false; end if;
  select sahip_user_id, ad_soyad into v_sahip, v_oy from public.oyuncular where player_id=p_player;
  if v_sahip is null or v_sahip <> auth.uid() then return false; end if;  -- yalnızca oyuncunun kendisi
  update public.oyuncu_takim set ayrilma_talep=true where id=v_ot;
  select yonetici_id into v_yon from public.ligler where id=p_lig;
  select ad into v_tk from public.takimlar where id=v_takim;
  if v_yon is not null then
    perform public.bildirim_yolla(v_yon, 'ayrilma', 'Ayrılma talebi',
      coalesce(v_oy,'Bir oyuncu')||' → '||coalesce(v_tk,'takım')||' takımından ayrılmak istiyor.',
      'turnuva', p_lig::text);
  end if;
  return true;
end $$;
grant execute on function public.ayrilma_talep_olustur(uuid, uuid) to authenticated;

-- 3) Yöneticinin gördüğü bekleyen ayrılma talepleri (bekleyen_katilimlar deseni)
create or replace function public.bekleyen_ayrilmalar(p_lig uuid)
returns table(ot_id uuid, player_id uuid, ad_soyad text, foto text, poz text, forma_no int, takim_id uuid, takim_ad text)
language sql stable security definer set search_path=public as $$
  select ot.id, o.player_id, o.ad_soyad, o.foto, o.poz, o.forma_no, ot.takim_id, tk.ad
  from public.oyuncu_takim ot
  join public.oyuncular o on o.player_id = ot.player_id
  join public.takimlar tk on tk.id = ot.takim_id
  where ot.lig_id = p_lig and ot.ayrilma_talep and ot.aktif
    and public.takim_yoneticim(ot.takim_id)
  order by ot.katilma desc;
$$;
grant execute on function public.bekleyen_ayrilmalar(uuid) to authenticated;

-- 4) Ayrılmayı ONAYLA → üyelik pasif, istatistik korunur, oyuncuya bildirim
create or replace function public.ayrilma_onayla(p_ot uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_takim uuid; v_pid uuid; v_lig uuid; v_sahip uuid; v_tk text;
begin
  select takim_id, player_id, lig_id into v_takim, v_pid, v_lig
    from public.oyuncu_takim where id=p_ot and ayrilma_talep and aktif;
  if v_takim is null or not public.takim_yoneticim(v_takim) then return false; end if;
  update public.oyuncu_takim
    set aktif=false, ayrilma=now(), ayrilma_sebep='kendi_istegi', ayrilma_talep=false
    where id=p_ot;
  select sahip_user_id into v_sahip from public.oyuncular where player_id=v_pid;
  select ad into v_tk from public.takimlar where id=v_takim;
  if v_sahip is not null then
    perform public.bildirim_yolla(v_sahip, 'ayrilma', 'Ayrılman onaylandı',
      coalesce(v_tk,'Takım')||' takımından ayrıldın. İstatistiklerin korunur.', 'turnuva', v_lig::text);
  end if;
  return true;
end $$;
grant execute on function public.ayrilma_onayla(uuid) to authenticated;

-- 5) Ayrılmayı REDDET → talep kalkar, oyuncu takımda kalır, oyuncuya bildirim
create or replace function public.ayrilma_reddet(p_ot uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_takim uuid; v_pid uuid; v_lig uuid; v_sahip uuid; v_tk text;
begin
  select takim_id, player_id, lig_id into v_takim, v_pid, v_lig
    from public.oyuncu_takim where id=p_ot and ayrilma_talep;
  if v_takim is null or not public.takim_yoneticim(v_takim) then return false; end if;
  update public.oyuncu_takim set ayrilma_talep=false where id=p_ot;
  select sahip_user_id into v_sahip from public.oyuncular where player_id=v_pid;
  select ad into v_tk from public.takimlar where id=v_takim;
  if v_sahip is not null then
    perform public.bildirim_yolla(v_sahip, 'ayrilma', 'Ayrılma talebin reddedildi',
      coalesce(v_tk,'Takım')||' yöneticisi ayrılma talebini onaylamadı; takımda kalıyorsun.', 'turnuva', v_lig::text);
  end if;
  return true;
end $$;
grant execute on function public.ayrilma_reddet(uuid) to authenticated;
