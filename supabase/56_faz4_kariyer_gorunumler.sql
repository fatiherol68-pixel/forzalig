-- =====================================================================
--  ForzaLig — FAZ 4: Kariyer + Tüm-Zamanlar istatistikleri (Q25/Q26/Q6/Q28)
--  Sezon istatistiği = o ligin maçlarından (mevcut, değişmez).
--  Kariyer = kalıcı player_id ile TÜM sezonların toplamı.
--  Tüm-Zamanlar = kalıcı kulup_id ile takımın tüm sezon sonuçları.
--  Tümü mac_olaylari/maclar'dan TÜRETİLİR → maç düzenlenince (Q28) otomatik
--  doğru; hiçbir sayaç saklanmaz. 53/54/55'ten SONRA çalıştır. İdempotent.
-- =====================================================================

-- 1) OYUNCU KARİYER — player_id bazında tüm sezonların gol/asist/kart toplamı.
--    Ad, KVKK-güvenli oyuncular_acik görünümünden alınır (hassas alan sızmaz).
create or replace view public.oyuncu_kariyer as
select
  o.player_id,
  o.gorunen_ad,
  coalesce(sum(mo.adet) filter (where mo.tip = 'gol'),     0)::int as gol,
  coalesce(sum(mo.adet) filter (where mo.tip = 'asist'),   0)::int as asist,
  coalesce(sum(mo.adet) filter (where mo.tip = 'sari'),    0)::int as sari,
  coalesce(sum(mo.adet) filter (where mo.tip = 'kirmizi'), 0)::int as kirmizi,
  count(distinct m.lig_id)::int as sezon_sayisi,
  count(distinct mo.mac_id)::int as etkili_mac
from public.oyuncular_acik o
left join public.mac_olaylari mo on mo.player_id = o.player_id
left join public.maclar m on m.id = mo.mac_id
group by o.player_id, o.gorunen_ad;
grant select on public.oyuncu_kariyer to anon, authenticated;

-- 2) KULÜP TÜM-ZAMANLAR — kulup_id bazında tüm takım örneklerinin maç sonuçları.
create or replace view public.kulup_tum_zamanlar as
with tm as (
  select t.kulup_id,
    m.id as mac_id,
    case when m.ev_takim_id = t.id then m.ev_skor else m.dep_skor end as attig,
    case when m.ev_takim_id = t.id then m.dep_skor else m.ev_skor end as yedig
  from public.takimlar t
  join public.maclar m
    on (m.ev_takim_id = t.id or m.dep_takim_id = t.id)
  where t.kulup_id is not null
    and m.oynandi and m.ev_skor is not null and m.dep_skor is not null
)
select
  kulup_id,
  count(*)::int                              as mac,
  coalesce(sum((attig >  yedig)::int),0)::int as galibiyet,
  coalesce(sum((attig =  yedig)::int),0)::int as beraberlik,
  coalesce(sum((attig <  yedig)::int),0)::int as maglubiyet,
  coalesce(sum(attig),0)::int                 as atilan,
  coalesce(sum(yedig),0)::int                 as yenen
from tm
group by kulup_id;
grant select on public.kulup_tum_zamanlar to anon, authenticated;

-- =====================================================================
--  Not: Bu view'ler her okumada canlı hesaplanır. Bitmiş maç düzenlenince
--  (macKaydet mac_olaylari'ni yeniden yazar) kariyer + tüm-zamanlar da
--  kendiliğinden güncellenir — ekstra tetikleyici gerekmez (Q28).
-- =====================================================================
