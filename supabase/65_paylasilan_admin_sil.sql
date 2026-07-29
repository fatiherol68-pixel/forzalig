-- =====================================================================
--  ForzaLig — Süper Admin: paylaşılan ligleri (paylasilan_ligler) silme
--  ---------------------------------------------------------------------
--  SORUN: "Ligi paylaş" butonu ligi AYRI bir tabloya (paylasilan_ligler)
--  yayınlar. Fantom temizliği yalnız 'ligler' tablosuna baktığı için bu
--  yayınlanan kopyalar "hayalet" olarak Keşfet'te kalıyordu.
--
--  ÇÖZÜM (uygulama): Fantom temizliği artık paylasilan_ligler'i de listeler
--  ve siler. Bu RPC, süper admin'in BAŞKASININ paylaşımını da silmesini
--  sağlar (RLS'i by-pass eder, yalnız admin_mi() çağırabilir). İdempotent.
--  Supabase → SQL Editor → yapıştır → Run.  02_guvenlik.sql'den SONRA.
-- =====================================================================

-- (Hemen temizlik) Şu andaki TÜM paylaşılan/hayalet ligleri sil:
--   delete from public.paylasilan_ligler;
-- Not: SQL Editor RLS'i by-pass eder; ligler tablosu zaten boşsa hepsi öksüzdür.

create or replace function public.paylasilan_sil_admin(p_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_mi() then
    raise exception 'Yetki yok: yalnızca süper admin silebilir.';
  end if;
  delete from public.paylasilan_ligler where slug = p_slug;
end $$;

grant execute on function public.paylasilan_sil_admin(text) to authenticated;
