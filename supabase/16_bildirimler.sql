-- =====================================================================
--  ForzaLig — APP-İÇİ BİLDİRİM sistemi
--  Kullanıcıya düşen bildirimler (transfer isteği, onay, maç, sohbet vb.)
--  01_sema.sql + 02_guvenlik.sql'den SONRA çalıştır.
-- =====================================================================

create table if not exists public.bildirimler (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tip         text not null,                    -- transfer_istek | transfer_onay | transfer_ret | mac | sohbet | duyuru
  baslik      text not null,
  metin       text,
  link_tip    text,                             -- 'turnuva' | 'oyuncu' | 'sohbet' ... (tıklayınca nereye gider)
  link_id     text,                             -- ilgili kaydın id'si
  okundu      boolean not null default false,
  olusma      timestamptz not null default now()
);
create index if not exists ix_bildirim_user on public.bildirimler(user_id, okundu, olusma desc);

alter table public.bildirimler enable row level security;

-- Sadece kendi bildirimlerini görür / okundu işaretler / siler
drop policy if exists p_bildirim_sel on public.bildirimler;
create policy p_bildirim_sel on public.bildirimler for select to authenticated
  using (user_id = auth.uid());
drop policy if exists p_bildirim_upd on public.bildirimler;
create policy p_bildirim_upd on public.bildirimler for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_bildirim_del on public.bildirimler;
create policy p_bildirim_del on public.bildirimler for delete to authenticated
  using (user_id = auth.uid());

-- INSERT: doğrudan client'tan DEĞİL, RPC ile (SECURITY DEFINER). Böylece
-- başka kullanıcıya bildirim yollamak kontrollü olur.
drop policy if exists p_bildirim_ins on public.bildirimler;
create policy p_bildirim_ins on public.bildirimler for insert to authenticated
  with check (false);

-- Bildirim üret (herhangi bir kullanıcıya). Güvenli: server tarafında çalışır.
create or replace function public.bildirim_yolla(
  p_user uuid, p_tip text, p_baslik text, p_metin text default null,
  p_link_tip text default null, p_link_id text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.bildirimler(user_id, tip, baslik, metin, link_tip, link_id)
    values (p_user, p_tip, p_baslik, p_metin, p_link_tip, p_link_id)
    returning id into v_id;
  return v_id;
end $$;

-- Lig yöneticisine "yeni transfer isteği" bildirimi (transfer INSERT tetikleyicisi)
create or replace function public.trg_transfer_bildirim()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_yonetici uuid; v_oyuncu text;
begin
  if (new.asama = 'talep') then
    select g.yonetici_id into v_yonetici from public.ligler g where g.id = new.lig_id;
    select ad_soyad into v_oyuncu from public.oyuncular where player_id = new.player_id;
    if v_yonetici is not null then
      perform public.bildirim_yolla(v_yonetici, 'transfer_istek',
        'Yeni transfer isteği',
        coalesce(v_oyuncu,'Bir oyuncu') || ' için transfer isteği bekliyor.',
        'turnuva', new.lig_id::text);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_transfer_bildirim on public.transferler;
create trigger t_transfer_bildirim after insert on public.transferler
  for each row execute function public.trg_transfer_bildirim();

-- Transfer sonucu (onay/ret) → isteği başlatan kaptana bildirim
create or replace function public.trg_transfer_sonuc_bildirim()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_oyuncu text; v_takim text;
begin
  if (new.talep_eden is not null and old.asama = 'talep' and new.asama in ('tamam','iptal')) then
    select ad_soyad into v_oyuncu from public.oyuncular where player_id = new.player_id;
    select ad into v_takim from public.takimlar where id = new.yeni_takim_id;
    if new.asama = 'tamam' then
      perform public.bildirim_yolla(new.talep_eden, 'transfer_onay',
        'Transfer onaylandı ✅',
        coalesce(v_oyuncu,'Oyuncu') || ' → ' || coalesce(v_takim,'yeni takım') || ' transferi onaylandı.',
        'turnuva', new.lig_id::text);
    else
      perform public.bildirim_yolla(new.talep_eden, 'transfer_ret',
        'Transfer reddedildi',
        coalesce(v_oyuncu,'Oyuncu') || ' transfer isteği reddedildi.',
        'turnuva', new.lig_id::text);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_transfer_sonuc_bildirim on public.transferler;
create trigger t_transfer_sonuc_bildirim after update on public.transferler
  for each row execute function public.trg_transfer_sonuc_bildirim();
