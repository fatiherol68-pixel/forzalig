-- =====================================================================
--  ForzaLig — Faz 3: SOHBET ARŞİVİ + LİG SOFT-DELETE (çöp kutusu)
--  17_sohbet.sql + 02_guvenlik.sql + 29_lig_sil_admin.sql'den SONRA.
--  Bir kez çalıştır. İdempotent.
-- =====================================================================

-- ---------- A) SOHBET ARŞİVİ (mesajı SİLMEZ/TAŞIMAZ, sadece bayrak) ----------
alter table public.sohbet_mesajlari add column if not exists arsiv boolean not null default false;
create index if not exists ix_sohbet_arsiv on public.sohbet_mesajlari(lig_id, takim_id, arsiv, olusma);

-- Okuma: normal kullanıcı arşivlenmişi GÖRMEZ; süper admin görebilir.
drop policy if exists p_sohbet_sel on public.sohbet_mesajlari;
create policy p_sohbet_sel on public.sohbet_mesajlari for select to authenticated
  using (
    silindi = false
    and (arsiv = false or public.admin_mi())
    and ( takim_id is null or public.takim_yoneticim(takim_id) )
  );

-- Kanal (lig+takım) başına en yeni 5.000 aktif kalır, gerisi arsiv=true.
-- Cron VEYA süper admin çalıştırır. Reply/tepki bağları korunur (aynı tablo).
create or replace function public.sohbet_arsivle()
returns integer language plpgsql security definer set search_path = public as $$
declare v_say integer;
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role')) then
    raise exception 'yetkisiz';
  end if;
  with sirali as (
    select id, row_number() over (
      partition by lig_id, coalesce(takim_id,'00000000-0000-0000-0000-000000000000'::uuid)
      order by olusma desc) as sira
    from public.sohbet_mesajlari where arsiv = false
  )
  update public.sohbet_mesajlari m set arsiv = true
  from sirali s where m.id = s.id and s.sira > 5000;
  get diagnostics v_say = row_count;
  return v_say;   -- kaç mesaj arşive alındı
end $$;
grant execute on function public.sohbet_arsivle() to authenticated;

-- Süper admin: bir ligin arşivini geri açar (tekrar görünür yapar).
create or replace function public.sohbet_arsiv_ac(p_lig uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_say integer;
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.sohbet_mesajlari set arsiv = false where lig_id = p_lig and arsiv = true;
  get diagnostics v_say = row_count; return v_say;
end $$;
grant execute on function public.sohbet_arsiv_ac(uuid) to authenticated;

-- ---------- B) LİG SOFT-DELETE (çöp kutusu + 90 gün sonra kalıcı) ----------
alter table public.ligler add column if not exists silindi   boolean not null default false;
alter table public.ligler add column if not exists silinme_t timestamptz;

-- Silinmiş ligler normal kullanıcıdan gizli; süper admin çöp kutusunda görür.
drop policy if exists p_lig_sel on public.ligler;
create policy p_lig_sel on public.ligler for select
  using (silindi = false or public.admin_mi());

-- Çöp kutusuna at (KALICI silmez — geri alınabilir). Süper admin.
create or replace function public.lig_soft_sil(p_lig uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.ligler set silindi = true, silinme_t = now() where id = p_lig;
end $$;
grant execute on function public.lig_soft_sil(uuid) to authenticated;

-- Çöp kutusundan geri getir. Süper admin.
create or replace function public.lig_geri_al(p_lig uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.ligler set silindi = false, silinme_t = null where id = p_lig;
end $$;
grant execute on function public.lig_geri_al(uuid) to authenticated;

-- Çöp kutusundaki 90 GÜNDEN eski ligleri KALICI sil (cron veya admin "boşalt").
create or replace function public.lig_purge_eskiler()
returns integer language plpgsql security definer set search_path = public as $$
declare r record; v_say integer := 0; v_players uuid[];
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role')) then
    raise exception 'yetkisiz';
  end if;
  for r in select id from public.ligler
           where silindi = true and silinme_t < now() - interval '90 days' loop
    -- 29_lig_sil_admin ile aynı cascade sırası:
    select coalesce(array_agg(distinct ot.player_id),'{}') into v_players
      from public.oyuncu_takim ot
     where ot.lig_id = r.id
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
  return v_say;   -- kaç lig kalıcı silindi
end $$;
grant execute on function public.lig_purge_eskiler() to authenticated;

-- ---------- C) OTOMATİK ZAMANLAMA (pg_cron varsa) — güvenli, opsiyonel ----------
do $$
begin
  perform 1 from pg_extension where extname = 'pg_cron';
  if found then
    perform cron.schedule('forzalig_sohbet_arsivle', '0 4 * * 0',   $$select public.sohbet_arsivle();$$);
    perform cron.schedule('forzalig_lig_purge',      '30 4 * * 0',  $$select public.lig_purge_eskiler();$$);
  end if;
exception when others then null;  -- pg_cron yoksa / yetki yoksa sessiz geç (panelden elle de çalışır)
end $$;
