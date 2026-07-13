-- =====================================================================
--  ForzaLig — Takım kaptanı KENDİ takımını güncelleyebilsin (logo/renk/ad)
--  Şu an takimlar UPDATE sadece LİG yöneticisine açık; kaptan kendi takımının
--  logosunu değiştiremiyor. takim_yoneticim() = lig sahibi VEYA takım kaptanı
--  VEYA admin — bu fonksiyona geçiyoruz.
--  Nasıl: Supabase → SQL Editor → yapıştır → Run.
-- =====================================================================

drop policy if exists p_takim_upd on public.takimlar;
create policy p_takim_upd on public.takimlar for update
  using (public.takim_yoneticim(id))
  with check (public.takim_yoneticim(id));

-- KONTROL — politika oluştu mu (1 dönmeli)
select count(*) as politika_var
from pg_policies
where tablename='takimlar' and policyname='p_takim_upd';
