-- =====================================================================
--  ForzaLig — Sohbetteki MAÇ KARTLARI otomatik temizlik
--  Maç sonucu kartları (sistem mesajı) 14 günden eskiyse silinir.
--  Sonuçlar maç/fikstür sayfasında KALICI kalır — sadece sohbet kartı gider.
--  Görünürlük: adet + kapladığı yer. Manuel + otomatik (pg_cron).
--  45_bildirim_merkezi.sql'den SONRA. Bir kez çalıştır. İdempotent.
-- =====================================================================

-- Özet: kaç maç kartı var + yaklaşık kapladığı yer (bayt)
create or replace function public.mac_kart_ozet()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'adet',  count(*),
    'bayt',  coalesce(sum(length(coalesce(metin,'')) + length(coalesce(kart::text,''))), 0),
    'eski',  min(olusma)
  )
  from public.sohbet_mesajlari
  where sistem = true and sistem_tip = 'mac' and silindi = false;
$$;
grant execute on function public.mac_kart_ozet() to authenticated;

-- Temizle: p_gun günden eski maç kartlarını KALICI sil (yer boşalsın). Sadece admin.
create or replace function public.mac_kart_temizle(p_gun int default 14)
returns int language plpgsql security definer set search_path = public as $$
declare v_count int := 0;
begin
  if not (public.admin_mi() or current_user in ('postgres','supabase_admin','service_role')) then
    raise exception 'yetkisiz';
  end if;
  delete from public.sohbet_mesajlari
   where sistem = true and sistem_tip = 'mac'
     and olusma < now() - make_interval(days => greatest(1, p_gun));
  get diagnostics v_count = row_count;
  return v_count;
end $$;
grant execute on function public.mac_kart_temizle(int) to authenticated;

-- OTOMATİK (pg_cron varsa) — her Pazar 04:30, 14 günden eski kartları sil. Güvenli/opsiyonel.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('forzalig_mac_kart_temizlik') where exists (
      select 1 from cron.job where jobname = 'forzalig_mac_kart_temizlik');
    perform cron.schedule('forzalig_mac_kart_temizlik', '30 4 * * 0',
      $$select public.mac_kart_temizle(14);$$);
  end if;
exception when others then null;
end $$;
-- =====================================================================
