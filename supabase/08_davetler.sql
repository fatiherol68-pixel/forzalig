-- =====================================================================
--  ForzaLig — DAVET SİSTEMİ (takım/oyuncu davet linki + kariyer sahiplenme)
--  Güvenli: davetler RPC fonksiyonlarıyla kullanılır → davetsiz kimse
--  takım/oyuncu ekleyemez. 01-07'den SONRA çalıştır.
-- =====================================================================

create table if not exists public.davetler (
  token     text primary key default replace(gen_random_uuid()::text,'-',''),
  lig_id    uuid references public.ligler(id) on delete cascade,
  takim_id  uuid references public.takimlar(id) on delete cascade,
  tip       text not null,               -- 'takim' | 'oyuncu'
  olusturan uuid references auth.users(id),
  aktif     boolean not null default true,
  created   timestamptz not null default now()
);
create index if not exists ix_davet_lig on public.davetler(lig_id);

alter table public.davetler enable row level security;
drop policy if exists p_davet_sel on public.davetler;
create policy p_davet_sel on public.davetler for select using (true);          -- token ile doğrulanır
drop policy if exists p_davet_ins on public.davetler;
create policy p_davet_ins on public.davetler for insert to authenticated
  with check (public.lig_yoneticim(lig_id));                                   -- sadece lig yöneticisi/admin
drop policy if exists p_davet_upd on public.davetler;
create policy p_davet_upd on public.davetler for update to authenticated
  using (public.lig_yoneticim(lig_id)) with check (public.lig_yoneticim(lig_id));
grant select on public.davetler to anon, authenticated;
grant insert, update on public.davetler to authenticated;

-- ---- RPC: takım davetini kullan → yeni takım (kullanan = takım yöneticisi) ----
create or replace function public.takim_daveti_kullan(p_token text, p_ad text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_lig uuid; v_id uuid;
begin
  select lig_id into v_lig from public.davetler where token=p_token and tip='takim' and aktif;
  if v_lig is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.takimlar(lig_id, ad, yonetici_id)
    values (v_lig, coalesce(nullif(trim(p_ad),''),'Yeni Takım'), auth.uid())
    returning id into v_id;
  return v_id;
end $$;

-- ---- RPC: oyuncu davetini kullan → oyuncu + üyelik (kullanan = oyuncu sahibi) ----
create or replace function public.oyuncu_daveti_kullan(p_token text, p_ad text, p_no int)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_takim uuid; v_lig uuid; v_pid uuid;
begin
  select takim_id, lig_id into v_takim, v_lig from public.davetler where token=p_token and tip='oyuncu' and aktif;
  if v_takim is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.oyuncular(ad_soyad, forma_no, sahip_user_id)
    values (coalesce(nullif(trim(p_ad),''),'Yeni Oyuncu'), p_no, auth.uid())
    returning player_id into v_pid;
  insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif) values (v_pid, v_takim, v_lig, true);
  return v_pid;
end $$;

-- ---- RPC: kariyer sahiplenme → mevcut oyuncuyu sahiplen (sadece sahipsizse) ----
create or replace function public.oyuncu_sahiplen(p_player_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.oyuncular set sahip_user_id=auth.uid()
    where player_id=p_player_id and sahip_user_id is null;
  return found;
end $$;

grant execute on function public.takim_daveti_kullan(text,text) to authenticated;
grant execute on function public.oyuncu_daveti_kullan(text,text,int) to authenticated;
grant execute on function public.oyuncu_sahiplen(uuid) to authenticated;
