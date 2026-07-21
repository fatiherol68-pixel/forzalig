-- =====================================================================
--  ForzaLig — FAZ 1: Takım ↔ Kulüp otomatik bağı + "sadece arşiv" (Q1/Q3/Q7/Q8)
--  Her YENİ takım, otomatik olarak kalıcı bir kulübe bağlanır (kulup_id).
--  Böylece "çıplak lig takımı" kalmaz; sezon devri ve kariyer mümkün olur.
--  48/49'dan SONRA çalıştır. İdempotent. Supabase → SQL Editor → Run.
-- =====================================================================

-- 1) BEFORE INSERT: kulup_id boşsa, takımdan bir kulüp üret ve bağla.
--    Kulüp sahibi = takım yöneticisi, yoksa ligin yöneticisi.
create or replace function public.trg_takim_kulup_bagla()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_kulup uuid; v_sahip uuid; v_evren text;
begin
  if new.kulup_id is not null then return new; end if;
  select yonetici_id, evren into v_sahip, v_evren from public.ligler where id = new.lig_id;
  v_sahip := coalesce(new.yonetici_id, v_sahip);
  insert into public.kulupler(ad, logo, renk, renk2, td, sahip_user_id, evren)
    values (new.ad, new.logo, new.renk, new.renk2, new.td, v_sahip, v_evren)
    returning id into v_kulup;
  new.kulup_id := v_kulup;
  return new;
end $$;
drop trigger if exists t_takim_kulup_bagla on public.takimlar;
create trigger t_takim_kulup_bagla before insert on public.takimlar
  for each row execute function public.trg_takim_kulup_bagla();

-- 2) Q8 — Takımlar SİLİNMEZ, arşivlenir. Gerçek silme yalnızca Süper Admin'e.
--    (Uygulama tarafı zaten durum='arsiv' yazacak; RLS sunucuda garanti eder.)
drop policy if exists p_takim_del on public.takimlar;
create policy p_takim_del on public.takimlar for delete to authenticated
  using (public.admin_mi());

-- =====================================================================
--  Sonuç: Bundan sonra eklenen her takım bir kulübe bağlı doğar.
--  Mevcut takımlar 49_backfill ile zaten kulüplere bağlanmıştı.
-- =====================================================================
