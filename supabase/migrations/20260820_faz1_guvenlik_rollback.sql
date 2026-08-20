-- ForzaLig — FAZ 1 GERİ DÖNÜŞ (rollback)
-- Bir sorun olursa bu dosyayı Supabase → SQL Editor'de çalıştır → önceki
-- durum birebir geri gelir.

-- 1) Politikaları sabit admin e-postasına geri al
alter policy "admin her ligi siler" on public.paylasilan_ligler
  using ( (auth.jwt() ->> 'email') = 'fatiherol68@gmail.com' );
alter policy "admin yetki gunceller" on public.yetkiler
  using ( (auth.jwt() ->> 'email') = 'fatiherol68@gmail.com' );
alter policy "admin yetki okur" on public.yetkiler
  using ( (auth.jwt() ->> 'email') = 'fatiherol68@gmail.com' );
alter policy "admin yetki siler" on public.yetkiler
  using ( (auth.jwt() ->> 'email') = 'fatiherol68@gmail.com' );
alter policy "admin yetki yazar" on public.yetkiler
  with check ( (auth.jwt() ->> 'email') = 'fatiherol68@gmail.com' );

-- 2) (search_path geri alınmasına gerek yok; zararsızdır. İstenirse:)
-- alter function public.trg_kart_foto_limit() reset search_path;

-- 3) + 4) EXECUTE yetkilerini eski haline getir (Supabase varsayılanı:
--     tüm public fonksiyonlarda anon + authenticated EXECUTE)
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
  loop
    execute format('grant execute on function %s to anon, authenticated', r.sig);
  end loop;
end $$;
