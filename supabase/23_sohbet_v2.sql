-- =====================================================================
--  ForzaLig — SOHBET v2 (tepki, yanıt, sistem mesajı, okuma, şikâyet)
--  Mevcut sohbet_mesajlari üstüne kurulur. 17 + 21 + 16'dan SONRA çalıştır.
--  Nasıl: Supabase → SQL Editor → yapıştır → Run.
-- =====================================================================

-- ---- sohbet_mesajlari yeni alanlar ----
alter table public.sohbet_mesajlari alter column user_id drop not null;           -- sistem mesajlarında null
alter table public.sohbet_mesajlari add column if not exists yanit_id   uuid references public.sohbet_mesajlari(id) on delete set null;
alter table public.sohbet_mesajlari add column if not exists yanit_ad   text;
alter table public.sohbet_mesajlari add column if not exists yanit_metin text;
alter table public.sohbet_mesajlari add column if not exists sistem     boolean not null default false;
alter table public.sohbet_mesajlari add column if not exists sistem_tip text;     -- mac | transfer | ceza | fikstur | yonetim
alter table public.sohbet_mesajlari add column if not exists kart       jsonb;    -- zengin kart (maç sonucu vb.)
alter table public.sohbet_mesajlari add column if not exists takim_ad   text;     -- gönderenin takımı (lig sohbetinde kimlik)
alter table public.sohbet_mesajlari add column if not exists takim_logo text;
alter table public.sohbet_mesajlari add column if not exists foto       text;     -- gönderenin fotoğrafı
alter table public.sohbet_mesajlari add column if not exists yonetim    boolean not null default false;  -- doğrulanmış yönetim mesajı
create index if not exists ix_sohbet_kanal2 on public.sohbet_mesajlari(lig_id, takim_id, olusma desc);

-- Moderasyon: admin da mesaj güncelleyebilsin (sil)
drop policy if exists p_sohbet_upd on public.sohbet_mesajlari;
create policy p_sohbet_upd on public.sohbet_mesajlari for update to authenticated
  using (user_id = auth.uid() or public.lig_yoneticim(lig_id) or public.admin_mi())
  with check (true);

-- ---- TEPKİLER (emoji reaction) ----
create table if not exists public.sohbet_tepkileri (
  id       uuid primary key default gen_random_uuid(),
  mesaj_id uuid not null references public.sohbet_mesajlari(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  emoji    text not null,
  olusma   timestamptz not null default now(),
  unique(mesaj_id, user_id, emoji)
);
create index if not exists ix_tepki_mesaj on public.sohbet_tepkileri(mesaj_id);
alter table public.sohbet_tepkileri enable row level security;
grant select, insert, delete on public.sohbet_tepkileri to authenticated;
drop policy if exists p_tepki_sel on public.sohbet_tepkileri;
create policy p_tepki_sel on public.sohbet_tepkileri for select to authenticated using (true);
drop policy if exists p_tepki_ins on public.sohbet_tepkileri;
create policy p_tepki_ins on public.sohbet_tepkileri for insert to authenticated with check (user_id = auth.uid());
drop policy if exists p_tepki_del on public.sohbet_tepkileri;
create policy p_tepki_del on public.sohbet_tepkileri for delete to authenticated using (user_id = auth.uid());

-- ---- OKUMA takibi (okunmamış badge) ----
create table if not exists public.sohbet_okuma (
  user_id   uuid not null references auth.users(id) on delete cascade,
  lig_id    uuid not null references public.ligler(id) on delete cascade,
  kanal     text not null,                         -- 'genel' veya takim_id metni
  last_read timestamptz not null default now(),
  primary key (user_id, lig_id, kanal)
);
alter table public.sohbet_okuma enable row level security;
grant select, insert, update, delete on public.sohbet_okuma to authenticated;
drop policy if exists p_okuma_all on public.sohbet_okuma;
create policy p_okuma_all on public.sohbet_okuma for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- ŞİKÂYET ----
create table if not exists public.sohbet_sikayet (
  id           uuid primary key default gen_random_uuid(),
  mesaj_id     uuid references public.sohbet_mesajlari(id) on delete set null,
  lig_id       uuid,
  mesaj_metin  text,
  gonderen_ad  text,
  sikayet_eden uuid references auth.users(id),
  sebep        text,
  durum        text not null default 'yeni',       -- yeni | kapatildi
  olusma       timestamptz not null default now()
);
create index if not exists ix_sikayet_durum on public.sohbet_sikayet(durum, olusma desc);
alter table public.sohbet_sikayet enable row level security;
grant select, insert, update on public.sohbet_sikayet to authenticated;
drop policy if exists p_sikayet_ins on public.sohbet_sikayet;
create policy p_sikayet_ins on public.sohbet_sikayet for insert to authenticated with check (sikayet_eden = auth.uid());
drop policy if exists p_sikayet_sel on public.sohbet_sikayet;
create policy p_sikayet_sel on public.sohbet_sikayet for select to authenticated using (public.admin_mi());
drop policy if exists p_sikayet_upd on public.sohbet_sikayet;
create policy p_sikayet_upd on public.sohbet_sikayet for update to authenticated using (public.admin_mi()) with check (public.admin_mi());

-- ---- Realtime: tepkiler de anlık gelsin ----
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='sohbet_tepkileri') then
    alter publication supabase_realtime add table public.sohbet_tepkileri;
  end if;
end $$;

-- ---- SİSTEM MESAJLARI: transfer tamamlanınca lig sohbetine düşsün ----
create or replace function public.trg_transfer_sohbet()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_oyuncu text; v_takim text;
begin
  if (new.asama='tamam' and old.asama is distinct from 'tamam') then
    select ad_soyad into v_oyuncu from public.oyuncular where player_id=new.player_id;
    select ad into v_takim from public.takimlar where id=new.yeni_takim_id;
    insert into public.sohbet_mesajlari(lig_id, takim_id, user_id, ad, metin, sistem, sistem_tip)
      values (new.lig_id, null, null, 'ForzaLig',
        coalesce(v_oyuncu,'Oyuncu')||', '||coalesce(v_takim,'yeni takım')||' takımına katıldı.', true, 'transfer');
  end if;
  return new;
end $$;
drop trigger if exists t_transfer_sohbet on public.transferler;
create trigger t_transfer_sohbet after update on public.transferler
  for each row execute function public.trg_transfer_sohbet();

-- ---- SİSTEM MESAJLARI: maç sonucu açıklanınca kart olarak lig sohbetine düşsün ----
create or replace function public.trg_mac_sohbet()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_a text; v_b text; v_la text; v_lb text;
begin
  if (new.oynandi and new.ev_skor is not null and (tg_op='INSERT' or not coalesce(old.oynandi,false))) then
    select ad, logo into v_a, v_la from public.takimlar where id=new.ev_takim_id;
    select ad, logo into v_b, v_lb from public.takimlar where id=new.dep_takim_id;
    insert into public.sohbet_mesajlari(lig_id, takim_id, user_id, ad, metin, sistem, sistem_tip, kart)
      values (new.lig_id, null, null, 'ForzaLig',
        coalesce(v_a,'?')||' '||new.ev_skor||'-'||new.dep_skor||' '||coalesce(v_b,'?'), true, 'mac',
        jsonb_build_object('takimA',v_a,'takimB',v_b,'skorA',new.ev_skor,'skorB',new.dep_skor,'logoA',v_la,'logoB',v_lb,'mac_id',new.id::text));
  end if;
  return new;
end $$;
drop trigger if exists t_mac_sohbet on public.maclar;
create trigger t_mac_sohbet after insert or update of oynandi on public.maclar
  for each row execute function public.trg_mac_sohbet();
