-- ForzaLig — FAZ 6: Veri bütünlüğü (yalnız GÜVENLİ, alt-sınır kısıtları)
-- Uygulanma: Supabase apply_migration (canlı) — 2026-08-20
-- İlke: yalnız "negatif olamaz" gibi fiziksel imkânsızlıklar eklenir.
--       Üst sınır EKLENMEZ (ör. 6-0 maç meşrudur). Mevcut veri %100 uyumlu
--       olduğu doğrulandı. NULL'a izin verir (oynanmamış maç vb.).
-- Geri dönüş: 20260820_faz6_veri_butunlugu_rollback.sql

alter table public.maclar
  add constraint mac_ev_skor_negatif_degil  check (ev_skor  is null or ev_skor  >= 0),
  add constraint mac_dep_skor_negatif_degil check (dep_skor is null or dep_skor >= 0);

alter table public.oyuncular
  add constraint oyuncu_forma_negatif_degil check (forma_no is null or forma_no >= 0),
  add constraint oyuncu_ovr_negatif_degil   check (ovr      is null or ovr      >= 0);
