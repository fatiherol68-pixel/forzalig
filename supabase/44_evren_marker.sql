-- =====================================================================
--  ForzaLig — DEMO EVREN MARKER
--  Demo/Evren ligleri gerçek kullanıcı liglerinden AYIRIR.
--  ligler.evren = evren adı (null = gerçek kullanıcı ligi).
--  Her şey lige bağlı (cascade) → tek marker yeterli.
--  Supabase → SQL Editor → yapıştır → Run. İdempotent.
-- =====================================================================
alter table public.ligler add column if not exists evren text;
create index if not exists ix_ligler_evren on public.ligler(evren);

-- Bir evrenin (veya p_evren null ise TÜM demo evrenlerin) tüm liglerini
-- kalıcı sil — tam cascade (lig_kalici_sil'i kullanır). Sadece admin.
create or replace function public.evren_sil(p_evren text)
returns integer language plpgsql security definer set search_path = public as $$
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
end $$;
grant execute on function public.evren_sil(text) to authenticated;

-- Test:  select public.evren_sil('ForzaLig Evreni');   -- tek evren
--        select public.evren_sil(null);                -- tüm demo evrenler
-- =====================================================================
