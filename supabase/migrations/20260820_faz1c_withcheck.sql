-- ForzaLig — FAZ 1 (tamamlama): WITH CHECK(true) → USING ile eşitle
-- Güncelleyebilen kişi artık satıra keyfi değer yazamaz (sahiplik/kapsam
-- kurcalama engellenir). KİMİN güncelleyebileceği DEĞİŞMEZ (USING korunur).
-- oyuncular/transferler/katilim. Yerelde kanıtlandı.
-- NOT: oyuncular/transferler INSERT WITH CHECK(true) BİLİNÇLİ korunuyor:
--   yeni satır henüz takıma bağlı olmadığından RLS ile güvenli kısıtlanamaz
--   (yönetici/toplu oluşturma bozulurdu). Hassas alanlar zaten oyuncular_acik
--   görünümü + SELECT RLS ile korunuyor.
-- Geri dönüş: *_rollback.sql

alter policy "p_oyuncu_upd" on public.oyuncular
  with check ( admin_mi() or (sahip_user_id = auth.uid()) or (exists (
     select 1 from oyuncu_takim ot join ligler g on g.id = ot.lig_id
     where ot.player_id = oyuncular.player_id and g.yonetici_id = auth.uid())) );

alter policy "p_transfer_upd" on public.transferler
  with check ( admin_mi() or lig_yoneticim(lig_id) );

alter policy "p_katilim_yaz" on public.katilim
  with check ( admin_mi() or (exists (
     select 1 from oyuncular o where o.player_id = katilim.player_id and o.sahip_user_id = auth.uid()))
   or (exists ( select 1 from maclar m where m.id = katilim.mac_id and lig_yoneticim(m.lig_id))) );
