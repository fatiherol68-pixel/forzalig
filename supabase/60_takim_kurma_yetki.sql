-- =====================================================================
--  ForzaLig — TAKIM (KULÜP) KURMA YETKİSİ · backend zorunlu kontrol
--  Sorun: p_kulup_ins yalnız sahip_user_id=auth.uid() istiyordu →
--         her giriş yapan kullanıcı takım kurabiliyordu.
--  Çözüm: Merkezî takim_kurabilir() → SADECE Süper Admin VEYA lig hakkı
--         olan VEYA bir lig yöneticisi kulüp oluşturabilir. Frontend ile
--         birebir aynı kural. Yetkisiz manuel API isteği RLS ile reddedilir.
--  İdempotent. Supabase SQL Editor → Run.
-- =====================================================================

-- Merkezî yetki fonksiyonu (lig oluşturma yetkisiyle aynı mantık + lig yöneticiliği)
create or replace function public.takim_kurabilir()
returns boolean language sql stable security definer set search_path=public as $$
  select
    public.admin_mi()
    or exists(select 1 from public.lig_haklari h
                where h.user_id = auth.uid() and h.toplam > h.kullanilan)
    or exists(select 1 from public.ligler l
                where l.yonetici_id = auth.uid());
$$;
grant execute on function public.takim_kurabilir() to authenticated;

-- KULÜP EKLEME: kendi adına (sahip=self) + yetkili olmalı
drop policy if exists p_kulup_ins on public.kulupler;
create policy p_kulup_ins on public.kulupler for insert to authenticated
  with check ( sahip_user_id = auth.uid() and public.takim_kurabilir() );

-- =====================================================================
--  Not: Lig akışından takım ekleme (takimlar insert → trg_takim_kulup_bagla)
--  ve kulup_lige_katil RPC'si SECURITY DEFINER olduğundan bu politikadan
--  etkilenmez; yalnız kullanıcının DOĞRUDAN kulüp oluşturması kısıtlanır.
--  Lig oluşturma (p_lig_ins) zaten admin VEYA lig hakkı ister — değişmedi.
-- =====================================================================
