-- =====================================================================
--  ForzaLig — İLK ADMİN KURULUMU (K2)
--  En son çalıştır. Kendini (ve istersen kardeşini) Süper Admin yap.
--  NOT: Bu kişilerin ÖNCE uygulamaya bir kez üye/giriş yapmış olması
--       gerekir (auth.users'da kayıtlı olmalılar).
-- =====================================================================

-- Kendini admin yap (e-postanı yaz):
insert into public.adminler (user_id)
select id from auth.users where lower(email) = lower('fatiherol68@gmail.com')
on conflict (user_id) do nothing;

-- Kardeşini admin yap (üye olduktan SONRA, e-postasını yazıp çalıştır):
-- insert into public.adminler (user_id)
-- select id from auth.users where lower(email) = lower('KARDES_EPOSTA@gmail.com')
-- on conflict (user_id) do nothing;

-- Kontrol: kimler admin?
-- select a.user_id, u.email, a.eklenme
--   from public.adminler a join auth.users u on u.id = a.user_id;
