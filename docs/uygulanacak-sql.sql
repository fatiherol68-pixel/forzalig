-- ForzaLig — CANLIYA UYGULANACAK TEK SQL (Supabase SQL Editor → yapıştır → RUN)
-- Supabase MCP oturumda kapalı olduğu için otomatik uygulanamadı; hepsi yerelde test edildi.
-- İçerik: davet 30g süre + WITH CHECK sertleştirme + admin kota/bakım RPC'leri.
begin;

-- ===== 1) Davet 30 gün süre =====
-- ForzaLig — FAZ 1 (tamamlama): davet bağlantılarına 30 gün geçerlilik
-- Sızmış/eski davet token'ları sonsuza dek çalışmasın. Mekanik olarak
-- canlı fonksiyon tanımlarına 'created > now()-30 gün' eklendi.
-- Geri dönüş: *_rollback.sql (interval kaldırır).

CREATE OR REPLACE FUNCTION public.kulup_daveti_kullan(p_token text, p_ad text, p_no integer, p_poz text, p_foto text, p_dogum date, p_boy integer, p_kilo integer, p_uyruk text, p_ayak text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_kulup uuid; v_pid uuid;
begin
  select kulup_id into v_kulup from public.davetler where token=p_token and tip='kulup' and aktif and created > now() - interval '30 days';
  if v_kulup is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.oyuncular(ad_soyad, forma_no, poz, foto, dogum, boy, kilo, uyruk, ayak, sahip_user_id)
    values (coalesce(nullif(trim(p_ad),''),'Yeni Oyuncu'), p_no, p_poz, p_foto, p_dogum, p_boy, p_kilo, p_uyruk, p_ayak, auth.uid())
    returning player_id into v_pid;
  insert into public.kulup_oyuncu(kulup_id, player_id, forma_no, mevki, aktif)
    values (v_kulup, v_pid, p_no, p_poz, true) on conflict (kulup_id, player_id) do nothing;
  return v_pid;
end $function$;

CREATE OR REPLACE FUNCTION public.takim_daveti_kullan(p_token text, p_ad text, p_renk text, p_renk2 text, p_logo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_lig uuid; v_id uuid; v_oy_token text;
begin
  select lig_id into v_lig from public.davetler where token=p_token and tip='takim' and aktif and created > now() - interval '30 days';
  if v_lig is null then raise exception 'Geçersiz veya kapalı davet'; end if;
  insert into public.takimlar(lig_id, ad, renk, renk2, logo, yonetici_id)
    values (v_lig, coalesce(nullif(trim(p_ad),''),'Yeni Takım'), p_renk, p_renk2, p_logo, auth.uid())
    returning id into v_id;
  insert into public.davetler(lig_id, takim_id, tip, olusturan)
    values (v_lig, v_id, 'oyuncu', auth.uid())
    returning token into v_oy_token;
  return jsonb_build_object('takim_id', v_id, 'oyuncu_token', v_oy_token);
end $function$;

CREATE OR REPLACE FUNCTION public.oyuncu_daveti_kullan(p_token text, p_ad text, p_no integer, p_poz text, p_foto text, p_dogum date, p_boy integer, p_kilo integer, p_uyruk text, p_ayak text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_takim uuid; v_lig uuid; v_pid uuid;
begin
  select takim_id, lig_id into v_takim, v_lig from public.davetler where token=p_token and tip='oyuncu' and aktif and created > now() - interval '30 days';
  if v_takim is null then raise exception 'Geçersiz veya kapalı davet'; end if;

  -- Kullanıcının mevcut kariyeri (oyuncu kartı) var mı?
  select player_id into v_pid from public.oyuncular where sahip_user_id = auth.uid() order by olusturma asc limit 1;

  if v_pid is null then
    -- Yoksa yeni kariyer aç
    insert into public.oyuncular(ad_soyad, forma_no, poz, foto, dogum, boy, kilo, uyruk, ayak, sahip_user_id)
      values (coalesce(nullif(trim(p_ad),''),'Yeni Oyuncu'), p_no, p_poz, p_foto, p_dogum, p_boy, p_kilo, p_uyruk, p_ayak, auth.uid())
      returning player_id into v_pid;
  else
    -- Var olan kariyere fotoğraf boşsa doldur (bilgiyi ezmeyiz)
    update public.oyuncular set foto = coalesce(foto, p_foto), poz = coalesce(poz, p_poz)
      where player_id = v_pid;
  end if;

  -- Aynı ligde zaten aktif/bekleyen üyelik varsa: katılım değil transfer gerekir
  if exists(select 1 from public.oyuncu_takim where player_id=v_pid and lig_id=v_lig and (aktif or onay='bekliyor')) then
    raise exception 'Bu ligde zaten bir takımdasın. Takım değişikliği için transfer süreci gerekir.';
  end if;

  -- Yeni takım üyeliği (yönetici onayına düşer)
  insert into public.oyuncu_takim(player_id, takim_id, lig_id, aktif, onay)
    values (v_pid, v_takim, v_lig, false, 'bekliyor');
  return v_pid;
end $function$;

-- ===== 2) WITH CHECK sertleştirme =====
-- ForzaLig — FAZ 1 (tamamlama): WITH CHECK(true) → USING ile eşitle
-- Güncelleyebilen kişi artık satıra keyfi değer yazamaz (sahiplik/kapsam
-- kurcalama engellenir). KİMİN güncelleyebileceği DEĞİŞMEZ (USING korunur).
-- oyuncular/transferler/katilim. Yerelde kanıtlandı.
-- NOT: oyuncular/transferler INSERT WITH CHECK(true) BİLİNÇLİ korunuyor:
--   yeni satır henüz takıma bağlı olmadığından RLS ile güvenli kısıtlanamaz
--   (yönetici/toplu oluşturma bozulurdu). Hassas alanlar zaten oyuncular_acik
--   görünümü + SELECT RLS ile korunuyor.
-- Geri dönüş: *_rollback.sql

alter policy "p_oyuncu_upd" on public.oyuncular
  with check ( admin_mi() or (sahip_user_id = auth.uid()) or (exists (
     select 1 from oyuncu_takim ot join ligler g on g.id = ot.lig_id
     where ot.player_id = oyuncular.player_id and g.yonetici_id = auth.uid())) );

alter policy "p_transfer_upd" on public.transferler
  with check ( admin_mi() or lig_yoneticim(lig_id) );

alter policy "p_katilim_yaz" on public.katilim
  with check ( admin_mi() or (exists (
     select 1 from oyuncular o where o.player_id = katilim.player_id and o.sahip_user_id = auth.uid()))
   or (exists ( select 1 from maclar m where m.id = katilim.mac_id and lig_yoneticim(m.lig_id))) );

-- ===== 3) Admin kota + bakım =====
-- Faz 9 — Admin kota + bakım RPC'leri (admin-only, SECURITY DEFINER)
create or replace function public.admin_kota()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when not public.admin_mi() then '{"hata":"yetkisiz"}'::jsonb else jsonb_build_object(
    'db_bayt', pg_database_size(current_database()),
    'db_mb', round(pg_database_size(current_database())/1048576.0,1),
    'tablo_sayisi', (select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'),
    'lig', (select count(*) from public.ligler where coalesce(silindi,false)=false),
    'oyuncu', (select count(*) from public.oyuncular),
    'mac', (select count(*) from public.maclar),
    'kullanici', (select count(*) from auth.users),
    'sohbet_mesaj', (select count(*) from public.sohbet_mesajlari),
    'olay_log', (select count(*) from public.olay_log),
    'hata_log', (select count(*) from public.hata_log),
    'aktif_davet', (select count(*) from public.davetler where aktif),
    'olcum_t', now()
  ) end;
$$;

-- Log retention: N günden eski olay/hata loglarını sil (admin-only)
create or replace function public.log_temizle(p_gun integer default 90)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare n1 int; n2 int;
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  delete from public.olay_log where created < now() - make_interval(days=>p_gun); get diagnostics n1=row_count;
  delete from public.hata_log where olusma < now() - make_interval(days=>p_gun); get diagnostics n2=row_count;
  return jsonb_build_object('olay_silinen',n1,'hata_silinen',n2,'gun',p_gun);
end $$;

-- Stale davet: 30 günden eski davetleri kapat (fonksiyon-içi süreye ek emniyet)
create or replace function public.stale_davet_kapat()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n int;
begin
  if not public.admin_mi() then raise exception 'yetkisiz'; end if;
  update public.davetler set aktif=false where aktif and created < now() - interval '30 days'; get diagnostics n=row_count;
  return n;
end $$;

revoke execute on function public.admin_kota(), public.log_temizle(integer), public.stale_davet_kapat() from public, anon;
grant execute on function public.admin_kota(), public.log_temizle(integer), public.stale_davet_kapat() to authenticated, service_role;

commit;
-- Başarılı ise hata çıkmaz. Doğrulama: select public.admin_kota();
