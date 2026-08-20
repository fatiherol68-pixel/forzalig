-- ForzaLig — FAZ 6 GERİ DÖNÜŞ (rollback)
-- Supabase → SQL Editor → yapıştır → RUN ile kısıtlar kalkar.
alter table public.maclar
  drop constraint if exists mac_ev_skor_negatif_degil,
  drop constraint if exists mac_dep_skor_negatif_degil;
alter table public.oyuncular
  drop constraint if exists oyuncu_forma_negatif_degil,
  drop constraint if exists oyuncu_ovr_negatif_degil;
