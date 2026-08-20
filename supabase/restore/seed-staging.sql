-- Hayali test verisi (staging) — production verisi DEĞİL
insert into auth.users(id,email) values
 ('aaaa0000-0000-0000-0000-000000000001','admin@test.local'),
 ('aaaa0000-0000-0000-0000-000000000002','kaptan@test.local'),
 ('aaaa0000-0000-0000-0000-000000000003','oyuncu@test.local') on conflict do nothing;
insert into public.adminler(user_id) values ('aaaa0000-0000-0000-0000-000000000001') on conflict do nothing;
-- Lig + takım
insert into public.ligler(id,yonetici_id,ad,durum) values
 ('11110000-0000-0000-0000-000000000001','aaaa0000-0000-0000-0000-000000000002','Test Ligi','aktif') on conflict do nothing;
insert into public.takimlar(id,lig_id,ad,yonetici_id) values
 ('22220000-0000-0000-0000-000000000001','11110000-0000-0000-0000-000000000001','Şimşekler','aaaa0000-0000-0000-0000-000000000002'),
 ('22220000-0000-0000-0000-000000000002','11110000-0000-0000-0000-000000000001','Kartallar','aaaa0000-0000-0000-0000-000000000002') on conflict do nothing;
-- Oyuncular (FIFA kart alanları)
insert into public.oyuncular(player_id,ad_soyad,takma_ad,forma_no,poz,ovr,sahip_user_id) values
 ('33330000-0000-0000-0000-000000000001','Ali Yıldız','Ali',10,'ORT',82,'aaaa0000-0000-0000-0000-000000000003'),
 ('33330000-0000-0000-0000-000000000002','Veli Demir','Veli',9,'FOR',79,null),
 ('33330000-0000-0000-0000-000000000003','Can Kaya','Can',1,'KAL',75,null) on conflict do nothing;
insert into public.oyuncu_takim(player_id,takim_id,lig_id,aktif) values
 ('33330000-0000-0000-0000-000000000001','22220000-0000-0000-0000-000000000001','11110000-0000-0000-0000-000000000001',true),
 ('33330000-0000-0000-0000-000000000002','22220000-0000-0000-0000-000000000002','11110000-0000-0000-0000-000000000001',true) on conflict do nothing;
-- Maç + olaylar (gol/asist)
insert into public.maclar(id,lig_id,ev_takim_id,dep_takim_id,ev_skor,dep_skor,oynandi) values
 ('44440000-0000-0000-0000-000000000001','11110000-0000-0000-0000-000000000001','22220000-0000-0000-0000-000000000001','22220000-0000-0000-0000-000000000002',2,1,true) on conflict do nothing;
insert into public.mac_olaylari(mac_id,player_id,tip,adet) values
 ('44440000-0000-0000-0000-000000000001','33330000-0000-0000-0000-000000000001','gol',1),
 ('44440000-0000-0000-0000-000000000001','33330000-0000-0000-0000-000000000001','asist',1) on conflict do nothing;
-- Sohbet
insert into public.sohbet_mesajlari(lig_id,user_id,ad,metin,silindi) values
 ('11110000-0000-0000-0000-000000000001','aaaa0000-0000-0000-0000-000000000002','Kaptan','Maç güzeldi!',false) on conflict do nothing;
