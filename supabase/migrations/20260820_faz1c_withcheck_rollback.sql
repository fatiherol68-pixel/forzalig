-- FAZ 1c GERİ DÖNÜŞ
alter policy "p_oyuncu_upd" on public.oyuncular with check (true);
alter policy "p_transfer_upd" on public.transferler with check (true);
alter policy "p_katilim_yaz" on public.katilim with check (true);
