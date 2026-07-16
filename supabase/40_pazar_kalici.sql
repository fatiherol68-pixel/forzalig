-- =====================================================================
--  ForzaLig — Pazar: Kalıcı / Bu maç ayrımı
--  eksik (takım oyuncu arıyor) ve oyuncu (boştaki oyuncu) ilanlarında:
--    kalici = true  → 🟢 kadroya sürekli oyuncu / kalıcı takım arıyor
--    kalici = false → 🟠 bu maça misafir / boştayım her maça gelirim
--  Bir kez çalıştır. İdempotent.
-- =====================================================================
alter table public.pazar_ilanlari add column if not exists kalici boolean not null default false;
