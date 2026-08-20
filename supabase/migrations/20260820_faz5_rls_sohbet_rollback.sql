-- ForzaLig — FAZ 5 GERİ DÖNÜŞ (rollback)
-- Supabase → SQL Editor → yapıştır → RUN ile eski haline (WITH CHECK true) döner.
alter policy "p_sohbet_upd" on public.sohbet_mesajlari
  with check ( true );
