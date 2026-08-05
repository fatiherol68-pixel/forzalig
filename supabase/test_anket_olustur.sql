-- =====================================================================
--  TEST ANKETİ — hızlı doğrulama (SQL Editöründe çalışır, admin gerekmez)
--  Kapsam: TÜM SİSTEM → her lig genel sohbetinde kart olarak görünür.
--  Test bitince en alttaki TEMİZLİK bloğuyla sil.
-- =====================================================================
do $$
declare v_id uuid; s1 uuid; s2 uuid; s3 uuid;
begin
  insert into public.anketler(baslik,aciklama,tip,yorum_acik,gizli_oy,sonuc_gorunur,durum,baslar,biter)
    values('TEST — Yeni sezon başlangıç saati?','Test anketi (istediğin an silebilirsin).','tek',true,false,'oydan_sonra','yayin',now(),now()+interval '7 days')
    returning id into v_id;
  insert into public.anket_secenek(anket_id,metin,sira) values(v_id,'19:00',0) returning id into s1;
  insert into public.anket_secenek(anket_id,metin,sira) values(v_id,'20:00',1) returning id into s2;
  insert into public.anket_secenek(anket_id,metin,sira) values(v_id,'21:00',2) returning id into s3;
  insert into public.anket_hedef(anket_id,kapsam) values(v_id,'tum');
  insert into public.anket_oy_sayac(anket_id,secenek_id,adet) values(v_id,s1,0),(v_id,s2,0),(v_id,s3,0);
  raise notice 'TEST anketi oluşturuldu: %', v_id;
end $$;

-- ---- TEMİZLİK (test bitince çalıştır — anket + oy + yorum hepsi silinir) ----
-- delete from public.anketler where baslik like 'TEST — %';
