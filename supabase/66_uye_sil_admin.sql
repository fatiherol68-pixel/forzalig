-- =====================================================================
--  ForzaLig — Süper Admin: üye (hesap) silme
--  ---------------------------------------------------------------------
--  auth.users satırı silinince TÜM app tabloları ON DELETE CASCADE ile
--  otomatik temizlenir (profiller, oyuncular, sohbet, bildirim, push…).
--  Bu RPC'ler yalnız admin_mi() çağırabilir; SECURITY DEFINER (postgres)
--  olduğu için auth.users'tan silebilir. Adminler ve çağıran KORUNUR.
--  Supabase → SQL Editor → yapıştır → Run.  02_guvenlik.sql'den SONRA.
-- =====================================================================

-- 1) Tek üye sil
create or replace function public.uye_sil_admin(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_mi() then raise exception 'Yetki yok: yalnızca süper admin.'; end if;
  if p_user = auth.uid() then raise exception 'Kendini silemezsin.'; end if;
  if exists (select 1 from public.adminler a where a.user_id = p_user) then
    raise exception 'Admin silinemez — önce admin yetkisini kaldır.';
  end if;
  delete from auth.users where id = p_user;   -- CASCADE → tüm veri temizlenir
end $$;
grant execute on function public.uye_sil_admin(uuid) to authenticated;

-- 2) Toplu temizlik: tüm anonim + @forzalig.com test hesapları (adminler ve sen hariç)
create or replace function public.uyeler_temizle_admin()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if not public.admin_mi() then raise exception 'Yetki yok: yalnızca süper admin.'; end if;
  with d as (
    delete from auth.users u
     where (coalesce(u.is_anonymous, false) = true or u.email ilike '%@forzalig.com')
       and u.id <> auth.uid()
       and not exists (select 1 from public.adminler a where a.user_id = u.id)
    returning 1
  )
  select count(*) into v_count from d;
  return v_count;
end $$;
grant execute on function public.uyeler_temizle_admin() to authenticated;

-- (İsteğe bağlı, hemen toplu temizlik — SQL Editor service_role ile çalışır):
--   delete from auth.users where is_anonymous = true;
