-- =====================================================================
--  ForzaLig — FAZ 3: Sezon serisi + "Yeni Sezon Başlat" (Q21-Q24, Q27)
--  Yeni sezon = aynı serideki yeni lig. Kulüpler + kadrolar otomatik taşınır,
--  puan durumu sıfır (yeni lig = maç yok), eski sezon arşivlenir.
--  Sonraki sezonlar LİG HAKKI YAKMAZ (aynı serinin devamı).
--  53/54'ten SONRA çalıştır. İdempotent. Supabase → Run.
-- =====================================================================

-- 1) Seri bağı: bir ligin hangi seriye (kalıcı yarışma kimliği) ait olduğu.
alter table public.ligler add column if not exists seri_id  uuid;
alter table public.ligler add column if not exists sezon_no int not null default 1;
create index if not exists ix_ligler_seri on public.ligler(seri_id);

-- 2) Hak sayacı: SADECE ilk sezon (yeni seri) hak yakar; devir sezonları bedava.
create or replace function public.trg_hak_say()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    if coalesce(new.sezon_no,1) <= 1 then
      insert into public.lig_haklari(user_id, toplam, kullanilan)
        values (new.yonetici_id, 0, 1)
      on conflict (user_id) do update set kullanilan = public.lig_haklari.kullanilan + 1,
                                          guncelleme = now();
    end if;
  elsif (tg_op = 'DELETE') then
    if coalesce(old.sezon_no,1) <= 1 then
      update public.lig_haklari set kullanilan = greatest(0, kullanilan - 1), guncelleme = now()
        where user_id = old.yonetici_id;
    end if;
  end if;
  return coalesce(new, old);
end $$;
-- (t_hak_say tetikleyicisi 03'te tanımlı; yalnızca fonksiyon güncellendi.)

-- 3) YENİ SEZON BAŞLAT — eski ligi arşivle, aktif kulüpleri + kadroları taşı.
create or replace function public.yeni_sezon_baslat(p_eski uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_seri uuid; v_no int; v_yeni uuid; e record; r record;
begin
  if not public.lig_yoneticim(p_eski) then raise exception 'yetkisiz'; end if;
  select * into e from public.ligler where id = p_eski;
  if e.id is null then raise exception 'lig bulunamadı'; end if;
  v_seri := coalesce(e.seri_id, e.id);
  if e.seri_id is null then update public.ligler set seri_id = v_seri where id = e.id; end if;
  select coalesce(max(sezon_no),1) + 1 into v_no from public.ligler where seri_id = v_seri;

  insert into public.ligler(yonetici_id, ad, ulke, sehir, ilce, logo, puan_sistemi,
      averaj_tipi, fikstur_tipi, format, grup_sayi, kisi, hedef_takim, renk, kurallar,
      seri_id, sezon_no, durum)
    select yonetici_id, ad, ulke, sehir, ilce, logo, puan_sistemi,
      averaj_tipi, fikstur_tipi, format, grup_sayi, kisi, hedef_takim, renk, kurallar,
      v_seri, v_no, 'aktif'
    from public.ligler where id = p_eski
    returning id into v_yeni;

  -- Aktif kulüpleri yeni sezona taşı; kulup_lige_katil ana kadroyu kopyalar.
  for r in
    select id, ad, kulup_id from public.takimlar
     where lig_id = p_eski and kulup_id is not null and coalesce(durum,'aktif') <> 'arsiv'
  loop
    perform public.kulup_lige_katil(r.kulup_id, v_yeni, r.ad);
  end loop;

  update public.ligler set durum = 'arsiv' where id = p_eski;
  return v_yeni;
end $$;
grant execute on function public.yeni_sezon_baslat(uuid) to authenticated;

-- =====================================================================
--  Fikstür (Q27): yeni sezonda takımlar hazır gelir; yönetici mevcut
--  "Fikstür Oluştur" ile tek tıkla üretir. Puan durumu (Q24) maç olmadığı
--  için zaten sıfırdır. Kariyer/tüm-zamanlar korunur (Faz 4 view'leri).
-- =====================================================================
