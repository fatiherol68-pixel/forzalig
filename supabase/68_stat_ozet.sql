-- =====================================================================
--  ForzaLig — PERFORMANS: sunucuda HAZIR kokpit özeti (stat_ozet)
--  ---------------------------------------------------------------------
--  SORUN: Gol kralı / enler için her açılışta ligin TÜM maçlarının olayları
--  indirilip tarayıcıda hesaplanıyordu (276 maç ≈ 5-6 sn). Lig büyüdükçe artar.
--
--  ÇÖZÜM: Hesaplanmış kokpit anlık görüntüsü (puan durumu + oyuncu istatistikleri
--  + skorlar) ligler.stat_ozet (jsonb) içinde saklanır. Kokpit bunu OKUR → 276 maç
--  bir daha indirilmez → her cihazda, İLK açılışta bile ~0.5 sn.
--
--  SAPMA YOK: Yazılan veri, uygulamadaki turnuvaHesapla motorunun KENDİ çıktısıdır
--  (yeni bir SQL hesabı yok). Maç detayıyla birebir aynı.
--
--  GÜNCEL KALIR: Maç kaydedilince + lig sahibi ligi tam açınca stat_ozet yeniden
--  yazılır. Yalnız lig sahibi / süper admin yazabilir (SECURITY DEFINER + kontrol).
--  Supabase → SQL Editor → yapıştır → Run.
-- =====================================================================

alter table public.ligler add column if not exists stat_ozet jsonb;

create or replace function public.stat_ozet_yaz(p_lig uuid, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_lig is null then return; end if;
  -- Yalnız lig sahibi VEYA süper admin yazabilir (deterministik çıktı; kötüye kullanım engeli)
  if not exists (
    select 1 from public.ligler l
     where l.id = p_lig
       and (l.yonetici_id = auth.uid() or public.admin_mi())
  ) then
    raise exception 'Yetki yok: stat_ozet yalnız lig sahibi/admin tarafından yazılır.';
  end if;
  update public.ligler set stat_ozet = p_data where id = p_lig;
end $$;

grant execute on function public.stat_ozet_yaz(uuid, jsonb) to authenticated;

-- Not: stat_ozet OKUMA ayrı bir izin gerektirmez — ligler satırını görebilen onu da görür
-- (RLS mevcut ligler politikasını kullanır: herkese açık ligler herkese, özel ligler üyelerine).
