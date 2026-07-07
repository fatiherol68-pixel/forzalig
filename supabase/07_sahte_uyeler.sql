-- =====================================================================
--  ForzaLig — SAHTE DEMO ÜYELER (sadece test/görüntüleme için)
--  auth.users'a demo hesaplar ekler; profiller trigger'ı otomatik
--  profil oluşturur. Bazılarına lig yetkisi verilir, bazıları normal.
--  01-06'dan SONRA çalıştır. İstediğin zaman en alttaki blokla silersin.
-- =====================================================================

-- 6 demo üye (şifre hepsinde: Demo12345! — istersen bu hesaplarla giriş yapıp test edebilirsin)
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   created_at, updated_at, confirmation_token, email_change, email_change_token_new,
   recovery_token, raw_app_meta_data, raw_user_meta_data)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   t.e, crypt('Demo12345!', gen_salt('bf')), now(), now(), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}', jsonb_build_object('name', t.n)
from (values
  ('ahmet.demo@forzalig.test','Ahmet Yılmaz'),
  ('mehmet.demo@forzalig.test','Mehmet Demir'),
  ('ayse.demo@forzalig.test','Ayşe Kaya'),
  ('fatma.demo@forzalig.test','Fatma Şahin'),
  ('can.demo@forzalig.test','Can Öztürk'),
  ('zeynep.demo@forzalig.test','Zeynep Arslan')
) as t(e,n)
where not exists (select 1 from auth.users u where u.email = t.e);

-- 2 kişiye lig açma yetkisi (yetkili), 4 kişi normal kalır
insert into public.lig_haklari (user_id, toplam, kullanilan, not_)
select id, 3, 0, 'demo yetkili (test)' from auth.users where email='ahmet.demo@forzalig.test'
on conflict (user_id) do update set toplam=3, not_='demo yetkili (test)';
insert into public.lig_haklari (user_id, toplam, kullanilan, not_)
select id, 1, 0, 'demo yetkili (test)' from auth.users where email='ayse.demo@forzalig.test'
on conflict (user_id) do update set toplam=1, not_='demo yetkili (test)';

-- Kontrol: üyeler
-- select p.email, p.ad, h.toplam from public.profiller p
--   left join public.lig_haklari h on h.user_id=p.user_id order by p.created desc;

-- =====================================================================
--  SİLMEK İSTERSEN (demo üyeleri temizle):
--  delete from auth.users where email like '%@forzalig.test';
--  (profiller + lig_haklari otomatik silinir — cascade)
-- =====================================================================
