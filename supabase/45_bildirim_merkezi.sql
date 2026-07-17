-- =====================================================================
--  ForzaLig — TEK BİLDİRİM MERKEZİ (fan-out altyapısı)
--  Tek olaydan çok kanal: in-app bildirim (→ webhook ile PUSH) + sohbet
--  (istemci) + e-posta kuyruğu. Kişisel DM yok. ÜCRETSİZ. İdempotent.
--  16_bildirimler + 17_sohbet + 18_push'tan SONRA. Supabase SQL Editor → Run.
-- =====================================================================

-- 1) Maç için tek-sefer bildirim damgası (idempotent — çift bildirim önler)
alter table public.maclar add column if not exists bildirildi boolean not null default false;

-- 2) LİG BİLDİRİMİ — lig yöneticisi (veya admin) ligindeki kişilere in-app
--    bildirim atsın (admin_toplu_bildirim admin-only olduğu için ayrı yol).
--    p_takim verilirse yalnız o takımın oyuncu-sahipleri + kaptanı.
--    Push, bildirimler INSERT'ini dinleyen mevcut webhook ile otomatik gider.
create or replace function public.lig_bildirim(
  p_lig uuid, p_takim uuid, p_baslik text, p_metin text, p_link_id text)
returns int language plpgsql security definer set search_path = public as $$
declare v_count int := 0;
begin
  if not (public.lig_yoneticim(p_lig) or public.admin_mi()) then
    raise exception 'Yetkisiz — sadece lig yöneticisi.';
  end if;
  if p_baslik is null or length(trim(p_baslik)) = 0 then raise exception 'Başlık gerekli.'; end if;

  with hedef as (
    -- oyuncu sahipleri (kariyeri sahiplenmiş üyeler)
    select distinct o.sahip_user_id as uid
      from public.oyuncu_takim ot
      join public.oyuncular o on o.player_id = ot.player_id
     where ot.lig_id = p_lig and o.sahip_user_id is not null
       and (p_takim is null or ot.takim_id = p_takim)
    union
    -- takım kaptanları (p_takim varsa o takım, yoksa ligin tüm takımları)
    select t.yonetici_id from public.takimlar t
     where t.lig_id = p_lig and t.yonetici_id is not null
       and (p_takim is null or t.id = p_takim)
    union
    -- lig sahibi + yardımcılar (yalnız p_takim yokken)
    select l.yonetici_id from public.ligler l where l.id = p_lig and p_takim is null
    union
    select y.user_id from public.lig_yardimci y where y.lig_id = p_lig and p_takim is null
  )
  insert into public.bildirimler(user_id, tip, baslik, metin, link_tip, link_id)
    select uid, 'mac', p_baslik, p_metin, 'turnuva', coalesce(p_link_id, p_lig::text)
      from hedef where uid is not null;
  get diagnostics v_count = row_count;
  return v_count;
end $$;
grant execute on function public.lig_bildirim(uuid, uuid, text, text, text) to authenticated;

-- 3) E-POSTA KUYRUĞU — anlık değil, günlük özet için (ücretsiz kota güvenli).
--    Boşaltma: ileride ücretsiz Edge Function (Brevo/Resend free) drenajı yapar.
create table if not exists public.bildirim_kuyruk (
  id         uuid primary key default gen_random_uuid(),
  hedef_user uuid references auth.users(id) on delete cascade,
  hedef_lig  uuid references public.ligler(id) on delete cascade,
  konu       text,
  govde      text,
  kanal      text not null default 'email',   -- email (ileride sms vb.)
  durum      text not null default 'bekliyor', -- bekliyor / gonderildi / basarisiz
  deneme     int  not null default 0,
  olusturma  timestamptz not null default now(),
  gonderim   timestamptz
);
create index if not exists ix_kuyruk_durum on public.bildirim_kuyruk(durum, olusturma);
alter table public.bildirim_kuyruk enable row level security;
drop policy if exists p_kuyruk_ins on public.bildirim_kuyruk;
create policy p_kuyruk_ins on public.bildirim_kuyruk for insert to authenticated with check (true);
drop policy if exists p_kuyruk_sel on public.bildirim_kuyruk;
create policy p_kuyruk_sel on public.bildirim_kuyruk for select to authenticated
  using (public.admin_mi() or hedef_user = auth.uid());
grant insert, select on public.bildirim_kuyruk to authenticated;

-- =====================================================================
--  BİTTİ. Push için (opsiyonel, ücretsiz): bildirimler INSERT → Database
--  Webhook → push-gonder Edge Function. VAPID private secret'ı ayarlı olmalı.
-- =====================================================================
