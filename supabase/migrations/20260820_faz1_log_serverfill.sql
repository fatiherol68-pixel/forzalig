-- Faz 1/6 — log user_id server-fill (istemci spoof edemez)
create or replace function public.trg_log_userfill() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is not null then new.user_id := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists t_olay_userfill on public.olay_log;
create trigger t_olay_userfill before insert on public.olay_log for each row execute function public.trg_log_userfill();
drop trigger if exists t_hata_userfill on public.hata_log;
create trigger t_hata_userfill before insert on public.hata_log for each row execute function public.trg_log_userfill();
