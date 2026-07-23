-- =====================================================================
--  ForzaLig — TAKIM (KULÜP) KALICI SİLME · Süper Admin tam yetki
--  Süper Admin: ligde OLAN veya OLMAYAN her takımı tek tek veya toplu siler.
--  - Admin silerse: kulüp + tüm lig örnekleri (takimlar) + o takımların
--    maçları (ve maç olayları/medyası cascade) + transfer kayıtları silinir.
--  - Sahip (admin değil) silerse: lig geçmişine DOKUNULMAZ, yalnız kulüp
--    kaldırılır ve lig bağı kopar (eski davranış korunur).
--  Yetkisiz istek RLS/exception ile reddedilir. İdempotent. Supabase → Run.
-- =====================================================================

create or replace function public.kulup_kalici_sil(p_kulup uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_admin boolean := public.admin_mi(); v_takimlar uuid[];
begin
  if not (v_admin or public.kulup_yoneticim(p_kulup)) then
    raise exception 'Yetkiniz bulunmuyor.' using errcode='42501';
  end if;
  select array_agg(id) into v_takimlar from public.takimlar where kulup_id = p_kulup;
  if v_takimlar is not null then
    if v_admin then
      -- ADMIN → tam sil: önce maçlar (mac_olaylari/medya/kadro cascade), sonra transfer, sonra takımlar (oyuncu_takim cascade)
      delete from public.maclar where ev_takim_id = any(v_takimlar) or dep_takim_id = any(v_takimlar);
      delete from public.transferler where eski_takim_id = any(v_takimlar) or yeni_takim_id = any(v_takimlar);
      delete from public.takimlar where id = any(v_takimlar);
    else
      -- Sahip (admin değil) → lig geçmişi kalsın, bağ kopsun
      update public.takimlar set kulup_id = null where kulup_id = p_kulup;
    end if;
  end if;
  delete from public.kulup_oyuncu where kulup_id = p_kulup;
  delete from public.kulupler where id = p_kulup;
end $$;
grant execute on function public.kulup_kalici_sil(uuid) to authenticated;

-- TOPLU SİLME — yalnız Süper Admin. Verilen kulüp id'lerini sırayla siler.
create or replace function public.kulup_toplu_sil(p_kulupler uuid[])
returns int language plpgsql security definer set search_path = public as $$
declare k uuid; n int := 0;
begin
  if not public.admin_mi() then
    raise exception 'Yetkiniz bulunmuyor.' using errcode='42501';
  end if;
  foreach k in array coalesce(p_kulupler, '{}'::uuid[]) loop
    perform public.kulup_kalici_sil(k);
    n := n + 1;
  end loop;
  return n;
end $$;
grant execute on function public.kulup_toplu_sil(uuid[]) to authenticated;
