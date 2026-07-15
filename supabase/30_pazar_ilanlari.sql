-- =====================================================================
--  ForzaLig — PAZAR İLANLARI: Rakip Bul + Eksik Oyuncu (Faz 4)
--  Tek tabloda iki ilan tipi:
--    tip='rakip'  → takım maç arıyor (dostluk). Yanıt = "Meydan Oku".
--    tip='eksik'  → takım maça oyuncu arıyor. Yanıt = "Geliyorum".
--  Yanıt gelince ilan sahibine bildirim (→ push webhook zaten kurulu).
--  01_sema + 02_guvenlik + 16_bildirimler'den SONRA çalıştır. İdempotent.
-- =====================================================================

-- ---------- İLANLAR ----------
create table if not exists public.pazar_ilanlari (
  id         uuid primary key default gen_random_uuid(),
  tip        text not null,                              -- 'rakip' | 'eksik'
  user_id    uuid not null references auth.users(id) on delete cascade,
  takim_id   uuid references public.takimlar(id) on delete set null,
  takim_ad   text,                                       -- denormalize (silinse de görünür)
  takim_logo text,
  takim_renk text,
  lig_id     uuid references public.ligler(id) on delete set null,
  lig_ad     text,
  sehir      text,
  tarih_text text,                                       -- serbest: "Cuma 21:00"
  saha       text,                                       -- rakip: saha
  seviye     text,                                       -- rakip: başlangıç/orta/iyi
  pozisyon   text,                                       -- eksik: "Kaleci" vb.
  adet       int default 1,                              -- eksik: kaç kişi
  aciklama   text,
  durum      text not null default 'aktif',              -- 'aktif' | 'kapandi'
  olusma     timestamptz not null default now()
);
create index if not exists ix_ilan_tip on public.pazar_ilanlari(tip, durum, olusma desc);
create index if not exists ix_ilan_user on public.pazar_ilanlari(user_id);

grant select, insert, update, delete on public.pazar_ilanlari to authenticated;
alter table public.pazar_ilanlari enable row level security;

-- Herkes AKTİF ilanları görür (eksik oyuncu = herkes; rakip = herkes). Kendi ilanını her durumda.
drop policy if exists p_ilan_sel on public.pazar_ilanlari;
create policy p_ilan_sel on public.pazar_ilanlari for select to authenticated
  using (durum = 'aktif' or user_id = auth.uid() or public.admin_mi());
-- Kendi adına ilan açar
drop policy if exists p_ilan_ins on public.pazar_ilanlari;
create policy p_ilan_ins on public.pazar_ilanlari for insert to authenticated
  with check (user_id = auth.uid());
-- Kendi ilanını günceller/kapatır/siler (admin her zaman)
drop policy if exists p_ilan_upd on public.pazar_ilanlari;
create policy p_ilan_upd on public.pazar_ilanlari for update to authenticated
  using (user_id = auth.uid() or public.admin_mi()) with check (user_id = auth.uid() or public.admin_mi());
drop policy if exists p_ilan_del on public.pazar_ilanlari;
create policy p_ilan_del on public.pazar_ilanlari for delete to authenticated
  using (user_id = auth.uid() or public.admin_mi());

-- ---------- YANITLAR ----------
create table if not exists public.ilan_yanitlari (
  id       uuid primary key default gen_random_uuid(),
  ilan_id  uuid not null references public.pazar_ilanlari(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  ad       text,
  mesaj    text,
  durum    text not null default 'bekliyor',             -- 'bekliyor' | 'kabul' | 'ret'
  olusma   timestamptz not null default now(),
  unique(ilan_id, user_id)                               -- bir kişi bir ilana tek yanıt
);
create index if not exists ix_yanit_ilan on public.ilan_yanitlari(ilan_id);

grant select, insert, update, delete on public.ilan_yanitlari to authenticated;
alter table public.ilan_yanitlari enable row level security;

-- Yanıtı: yanıt sahibi VEYA ilan sahibi VEYA admin görür
drop policy if exists p_yanit_sel on public.ilan_yanitlari;
create policy p_yanit_sel on public.ilan_yanitlari for select to authenticated
  using ( user_id = auth.uid()
          or public.admin_mi()
          or exists(select 1 from public.pazar_ilanlari i where i.id = ilan_id and i.user_id = auth.uid()) );
-- Kendi adına yanıt verir
drop policy if exists p_yanit_ins on public.ilan_yanitlari;
create policy p_yanit_ins on public.ilan_yanitlari for insert to authenticated
  with check (user_id = auth.uid());
-- Durum güncelleme (kabul/ret) RPC ile yapılır; yine de ilan sahibine izin
drop policy if exists p_yanit_upd on public.ilan_yanitlari;
create policy p_yanit_upd on public.ilan_yanitlari for update to authenticated
  using ( public.admin_mi() or exists(select 1 from public.pazar_ilanlari i where i.id = ilan_id and i.user_id = auth.uid()) );

-- ---------- BİLDİRİM: yanıt gelince ilan sahibine ----------
create or replace function public.trg_ilan_yanit_bildirim()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_sahip uuid; v_tip text;
begin
  select user_id, tip into v_sahip, v_tip from public.pazar_ilanlari where id = new.ilan_id;
  if v_sahip is not null and v_sahip <> new.user_id then
    perform public.bildirim_yolla(
      v_sahip,
      case when v_tip='rakip' then 'rakip_yanit' when v_tip='oyuncu' then 'oyuncu_yanit' else 'eksik_yanit' end,
      case when v_tip='rakip' then '🆚 Maç teklifi geldi' when v_tip='oyuncu' then '🏃 Bir takım seni istiyor' else '🙋 Oyuncu başvurusu' end,
      coalesce(new.ad,'Biri') || case when v_tip='rakip' then ' takımınla maç yapmak istiyor.'
                                       when v_tip='oyuncu' then ' seni takımına çağırıyor.'
                                       else ' ilanına "geliyorum" dedi.' end,
      'pazar', new.ilan_id::text);
  end if;
  return new;
end $$;
drop trigger if exists t_ilan_yanit_bildirim on public.ilan_yanitlari;
create trigger t_ilan_yanit_bildirim after insert on public.ilan_yanitlari
  for each row execute function public.trg_ilan_yanit_bildirim();

-- ---------- KARAR: ilan sahibi yanıtı kabul/ret eder → yanıtçıya bildirim ----------
create or replace function public.ilan_yanit_karar(p_yanit uuid, p_kabul boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_ilan uuid; v_sahip uuid; v_yanitci uuid; v_tip text;
begin
  select ilan_id, user_id into v_ilan, v_yanitci from public.ilan_yanitlari where id = p_yanit;
  if v_ilan is null then return false; end if;
  select user_id, tip into v_sahip, v_tip from public.pazar_ilanlari where id = v_ilan;
  if v_sahip is null or (v_sahip <> auth.uid() and not public.admin_mi()) then return false; end if;
  update public.ilan_yanitlari set durum = case when p_kabul then 'kabul' else 'ret' end where id = p_yanit;
  perform public.bildirim_yolla(
    v_yanitci,
    case when v_tip='rakip' then 'rakip_karar' else 'eksik_karar' end,
    case when p_kabul then '✅ İsteğin kabul edildi' else 'İsteğin yanıtlandı' end,
    case when p_kabul then 'Karşı taraf kabul etti — iletişime geçip maçı ayarlayın.' else 'İsteğin bu sefer kabul edilmedi.' end,
    'pazar', v_ilan::text);
  return true;
end $$;
grant execute on function public.ilan_yanit_karar(uuid, boolean) to authenticated;
