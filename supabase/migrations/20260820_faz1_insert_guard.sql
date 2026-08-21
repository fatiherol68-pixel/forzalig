-- Faz 1 — güvenli INSERT (server-side trigger). App değişmeden yetkisiz
-- oyuncu/transfer eklemeyi engeller; meşru akışlar (kendi kariyeri, yönetici,
-- davet, admin, sunucu/servis) çalışır. Mirror'da test: self=OK, mgr=OK, yabancı=ENGEL.
create or replace function public.trg_oyuncu_ins_guard() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if current_user in ('postgres','supabase_admin','service_role')
     or public.admin_mi() or new.sahip_user_id = auth.uid()
     or exists(select 1 from public.takimlar t where t.yonetici_id = auth.uid())
     or exists(select 1 from public.ligler g where g.yonetici_id = auth.uid())
     or exists(select 1 from public.kulupler k where k.sahip_user_id = auth.uid())
  then return new; end if;
  raise exception 'yetkisiz oyuncu ekleme' using errcode='42501';
end $$;
drop trigger if exists t_oyuncu_ins_guard on public.oyuncular;
create trigger t_oyuncu_ins_guard before insert on public.oyuncular for each row execute function public.trg_oyuncu_ins_guard();
create or replace function public.trg_transfer_ins_guard() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if current_user in ('postgres','supabase_admin','service_role')
     or public.admin_mi() or public.lig_yoneticim(new.lig_id)
     or (new.eski_takim_id is not null and public.takim_yoneticim(new.eski_takim_id))
     or (new.yeni_takim_id is not null and public.takim_yoneticim(new.yeni_takim_id))
     or new.talep_eden = auth.uid()
  then return new; end if;
  raise exception 'yetkisiz transfer' using errcode='42501';
end $$;
drop trigger if exists t_transfer_ins_guard on public.transferler;
create trigger t_transfer_ins_guard before insert on public.transferler for each row execute function public.trg_transfer_ins_guard();
