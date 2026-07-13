-- =====================================================================
--  ForzaLig — TETİKLEYİCİLER (otomatik kurallar)
--  01_sema.sql ve 02_guvenlik.sql'den SONRA çalıştır.
--  Bu kurallar SUNUCUDA işler → uygulama unutsa bile garanti çalışır.
-- =====================================================================

-- ---------------------------------------------------------------------
-- A) Madde 21 — İlk maç oynanınca ligin kuralları KİLİTLENİR.
--    (puan/averaj/fikstür değişmesin; ad/logo/bitiş serbest kalır)
-- ---------------------------------------------------------------------
create or replace function public.trg_lig_kilitle()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.oynandi and not coalesce(old.oynandi,false)) then
    update public.ligler set kurallar_kilit = true
      where id = new.lig_id and not kurallar_kilit;
  end if;
  return new;
end $$;
drop trigger if exists t_lig_kilitle on public.maclar;
create trigger t_lig_kilitle after insert or update of oynandi on public.maclar
  for each row execute function public.trg_lig_kilitle();

-- Kilit korumasi: kilitliyken kritik kurallar DEĞİŞTİRİLEMEZ
create or replace function public.trg_kilit_koru()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.kurallar_kilit and not public.admin_mi() then
    if (new.puan_sistemi is distinct from old.puan_sistemi
        or new.averaj_tipi is distinct from old.averaj_tipi
        or new.fikstur_tipi is distinct from old.fikstur_tipi) then
      raise exception 'Maç oynandıktan sonra puan/averaj/fikstür değiştirilemez (madde 21).';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_kilit_koru on public.ligler;
create trigger t_kilit_koru before update on public.ligler
  for each row execute function public.trg_kilit_koru();

-- ---------------------------------------------------------------------
-- B) Madde 18 — Maç skoru değişince otomatik LOG (kim/ne zaman/eski/yeni)
-- ---------------------------------------------------------------------
create or replace function public.trg_skor_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.ev_skor is distinct from old.ev_skor
      or new.dep_skor is distinct from old.dep_skor) then
    insert into public.mac_sonuc_log(mac_id, eski_ev, eski_dep, yeni_ev, yeni_dep, degistiren)
    values (new.id, old.ev_skor, old.dep_skor, new.ev_skor, new.dep_skor, auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists t_skor_log on public.maclar;
create trigger t_skor_log after update on public.maclar
  for each row execute function public.trg_skor_log();

-- ---------------------------------------------------------------------
-- C) K3 — Lig açılınca kullanıcının "kullanilan" hakkı +1,
--         lig silinince -1. (admin sınırsız açsa da sayaç döner)
-- ---------------------------------------------------------------------
create or replace function public.trg_hak_say()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.lig_haklari(user_id, toplam, kullanilan)
      values (new.yonetici_id, 0, 1)
    on conflict (user_id) do update set kullanilan = public.lig_haklari.kullanilan + 1,
                                        guncelleme = now();
  elsif (tg_op = 'DELETE') then
    update public.lig_haklari set kullanilan = greatest(0, kullanilan - 1), guncelleme = now()
      where user_id = old.yonetici_id;
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists t_hak_say on public.ligler;
create trigger t_hak_say after insert or delete on public.ligler
  for each row execute function public.trg_hak_say();

-- ---------------------------------------------------------------------
-- D) Madde 13/14 — Transfer 'tamam' olunca üyelik otomatik güncellenir:
--    eski takım pasif, yeni takımda aktif üyelik. (geçmiş korunur)
-- ---------------------------------------------------------------------
create or replace function public.trg_transfer_uygula()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.asama = 'tamam' and old.asama is distinct from 'tamam') then
    -- eski aktif üyelikleri pasifle (bu ligde)
    update public.oyuncu_takim
      set aktif = false, ayrilma = now()
      where player_id = new.player_id and lig_id = new.lig_id and aktif;
    -- yeni takımda aktif üyelik aç
    insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif)
      values (new.player_id, new.yeni_takim_id, new.lig_id, true);
    new.tamam_t := now();
  end if;
  return new;
end $$;
drop trigger if exists t_transfer_uygula on public.transferler;
create trigger t_transfer_uygula before update on public.transferler
  for each row execute function public.trg_transfer_uygula();

-- =====================================================================
--  Bitti. Sıra: 04_migrasyon.sql (eski blob → yeni tablolar) — opsiyonel,
--  ben uygulama tarafında da taşıma yapacağım.
-- =====================================================================
