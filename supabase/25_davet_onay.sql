-- =====================================================================
--  ForzaLig — DAVET ONAY AKIŞI
--  Oyuncu daveti kabul edince DOĞRUDAN katılmaz; yöneticinin onayına düşer.
--  Onaylanınca aktif oyuncu olur, reddedilince iz kalmaz.
--  08 + 12 + 16'dan SONRA çalıştır. Nasıl: SQL Editor → yapıştır → Run.
-- =====================================================================

-- Onay durumu: 'onayli' (varsayılan, geriye dönük) | 'bekliyor'
alter table public.oyuncu_takim add column if not exists onay text not null default 'onayli';
create index if not exists ix_ot_bekleyen on public.oyuncu_takim(lig_id, onay) where onay='bekliyor';

-- Oyuncu daveti → artık BEKLEMEDE üyelik açar (aktif=false, onay='bekliyor')
create or replace function public.oyuncu_daveti_kullan(
  p_token text, p_ad text, p_no int, p_poz text, p_foto text,
  p_dogum date, p_boy int, p_kilo int, p_uyruk text, p_ayak text
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_takim uuid; v_lig uuid; v_pid uuid;
begin
  select takim_id, lig_id into v_takim, v_lig from public.davetler where token=p_token and tip='oyuncu' and aktif;
  if v_takim is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.oyuncular(ad_soyad, forma_no, poz, foto, dogum, boy, kilo, uyruk, ayak, sahip_user_id)
    values (coalesce(nullif(trim(p_ad),''),'Yeni Oyuncu'), p_no, p_poz, p_foto, p_dogum, p_boy, p_kilo, p_uyruk, p_ayak, auth.uid())
    returning player_id into v_pid;
  insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif, onay)
    values (v_pid, v_takim, v_lig, false, 'bekliyor');
  return v_pid;
end $$;
grant execute on function public.oyuncu_daveti_kullan(text,text,int,text,text,date,int,int,text,text) to authenticated;

-- Yöneticinin gördüğü bekleyen katılım istekleri
create or replace function public.bekleyen_katilimlar(p_lig uuid)
returns table(ot_id uuid, player_id uuid, ad_soyad text, foto text, poz text, forma_no int, takim_id uuid, takim_ad text, olusma timestamptz)
language sql stable security definer set search_path=public as $$
  select ot.id, o.player_id, o.ad_soyad, o.foto, o.poz, o.forma_no, ot.takim_id, tk.ad, ot.katilma
  from public.oyuncu_takim ot
  join public.oyuncular o on o.player_id = ot.player_id
  join public.takimlar tk on tk.id = ot.takim_id
  where ot.lig_id = p_lig and ot.onay = 'bekliyor'
    and public.takim_yoneticim(ot.takim_id)
  order by ot.katilma desc;
$$;
grant execute on function public.bekleyen_katilimlar(uuid) to authenticated;

-- Onayla → aktif oyuncu olur
create or replace function public.katilim_onayla(p_ot uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_takim uuid;
begin
  select takim_id into v_takim from public.oyuncu_takim where id=p_ot and onay='bekliyor';
  if v_takim is null or not public.takim_yoneticim(v_takim) then return false; end if;
  update public.oyuncu_takim set aktif=true, onay='onayli' where id=p_ot;
  return true;
end $$;
grant execute on function public.katilim_onayla(uuid) to authenticated;

-- Reddet → üyeliği sil; öksüz kalan (davetle yeni açılmış) oyuncuyu da sil
create or replace function public.katilim_reddet(p_ot uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_takim uuid; v_pid uuid;
begin
  select takim_id, player_id into v_takim, v_pid from public.oyuncu_takim where id=p_ot and onay='bekliyor';
  if v_takim is null or not public.takim_yoneticim(v_takim) then return false; end if;
  delete from public.oyuncu_takim where id=p_ot;
  if not exists(select 1 from public.oyuncu_takim where player_id=v_pid) then
    delete from public.oyuncular where player_id=v_pid;
  end if;
  return true;
end $$;
grant execute on function public.katilim_reddet(uuid) to authenticated;

-- Bildirim: katılım isteği gelince lig yöneticisine
create or replace function public.trg_katilim_bildirim()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_yon uuid; v_oy text; v_tk text;
begin
  if (new.onay='bekliyor') then
    select yonetici_id into v_yon from public.ligler where id=new.lig_id;
    select ad_soyad into v_oy from public.oyuncular where player_id=new.player_id;
    select ad into v_tk from public.takimlar where id=new.takim_id;
    if v_yon is not null then
      perform public.bildirim_yolla(v_yon, 'katilim', 'Yeni katılım isteği',
        coalesce(v_oy,'Bir oyuncu')||' → '||coalesce(v_tk,'takım')||' katılmak istiyor.', 'turnuva', new.lig_id::text);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_katilim_bildirim on public.oyuncu_takim;
create trigger t_katilim_bildirim after insert on public.oyuncu_takim
  for each row execute function public.trg_katilim_bildirim();
