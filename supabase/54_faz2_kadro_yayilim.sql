-- =====================================================================
--  ForzaLig — FAZ 2: Kulüp ana kadrosu senkron + otomatik yayılım (A / Q4)
--  A KARARI: Kulüp ana listedir. Lige oyuncu eklenince kulüp kadrosuna da
--  yazılır; kulübe eklenen oyuncu kulübün AKTİF liglerine otomatik eklenir.
--  Ancak bir ligden çıkarma/ayrılma SADECE o lig sezonunu etkiler (A-guard).
--  53'ten SONRA çalıştır. İdempotent. Supabase → Run.
-- =====================================================================

-- 1) Lige oyuncu eklenince (oyuncu_takim) → takımın KULÜP ana kadrosuna yaz.
--    Böylece lig akışından eklenen oyuncular kalıcı kadroya girer (Q23/Q4).
create or replace function public.trg_ot_kulube_yaz()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not new.aktif then return new; end if;
  insert into public.kulup_oyuncu(kulup_id, player_id, forma_no, mevki, aktif)
    select t.kulup_id, new.player_id, o.forma_no, o.poz, true
      from public.takimlar t
      join public.oyuncular o on o.player_id = new.player_id
     where t.id = new.takim_id and t.kulup_id is not null
    on conflict (kulup_id, player_id) do nothing;
  return new;
end $$;
drop trigger if exists t_ot_kulube_yaz on public.oyuncu_takim;
create trigger t_ot_kulube_yaz after insert on public.oyuncu_takim
  for each row execute function public.trg_ot_kulube_yaz();

-- 2) Kulüp kadrosuna oyuncu eklenince → kulübün AKTİF liglerine yay.
--    A-guard: o ligde oyuncunun HERHANGİ bir üyeliği (aktif/pasif) varsa ATLA
--    → yöneticinin bilerek çıkardığı oyuncu (Q17) geri dirilmez; B kuralı korunur.
create or replace function public.trg_kulup_yayilim()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if not new.aktif then return new; end if;
  for r in
    select t.id as takim_id, t.lig_id
      from public.takimlar t
      join public.ligler l on l.id = t.lig_id
     where t.kulup_id = new.kulup_id
       and coalesce(l.durum,'aktif') <> 'arsiv'
       and coalesce(t.durum,'aktif') <> 'arsiv'
  loop
    if not exists(
      select 1 from public.oyuncu_takim ot
       where ot.player_id = new.player_id and ot.lig_id = r.lig_id
    ) then
      insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif, onay)
        values (new.player_id, r.takim_id, r.lig_id, true, 'onayli');
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists t_kulup_yayilim on public.kulup_oyuncu;
create trigger t_kulup_yayilim after insert on public.kulup_oyuncu
  for each row execute function public.trg_kulup_yayilim();

-- =====================================================================
--  Döngü güvenliği: ot→kulup_oyuncu (conflict do nothing) ve kulup_oyuncu→ot
--  (A-guard: üyelik varsa atla) birbirini tetiklese de yeni satır üretmez;
--  özyineleme kendiliğinden durur. security definer → RLS'i aşarak yazar.
-- =====================================================================
