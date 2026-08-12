-- ============================================================================
-- ForzaLig — DEPOLAMA KOTA İSTATİSTİĞİ (güvenli, service-role sırrı YOK)
-- ----------------------------------------------------------------------------
-- Ne yapar: storage.objects tablosundan TOPLAM boyut + dosya sayısını döner.
-- Güvenlik: SECURITY DEFINER → postgres yetkisiyle storage.objects'i okur,
--   ama fonksiyonun İÇİNDE çağıranın SÜPER ADMIN (adminler tablosunda) olduğu
--   doğrulanır. Admin değilse hata verir. Frontend hiçbir gizli anahtar görmez.
--
-- KURULUM: Supabase → SQL Editor → bu dosyanın tamamını yapıştır → RUN.
--   (Tek seferlik. Sonra Radyo Studio'daki "Depolama & Trafik" kartı çalışır.)
-- ============================================================================

create or replace function public.radyo_depo_stat()
returns json
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_admin boolean;
  v_bytes bigint;
  v_count bigint;
begin
  -- yalnız süper admin
  select exists(select 1 from public.adminler where user_id = auth.uid()) into v_admin;
  if not coalesce(v_admin, false) then
    raise exception 'yetki yok (yalnız süper admin)';
  end if;

  select coalesce(sum((metadata->>'size')::bigint), 0), count(*)
    into v_bytes, v_count
    from storage.objects;

  return json_build_object('bytes', v_bytes, 'objeler', v_count);
end;
$$;

-- normal (giriş yapmış) kullanıcılar çağırabilsin; admin kontrolü fonksiyon içinde
grant execute on function public.radyo_depo_stat() to authenticated;

-- ============================================================================
-- Test (SQL Editor'de admin olarak): select public.radyo_depo_stat();
-- Beklenen: {"bytes": 649531904, "objeler": 1234}
-- ============================================================================
