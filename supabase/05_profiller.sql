-- =====================================================================
--  ForzaLig — PROFİLLER (email ↔ user_id köprüsü)
--  Neden? Süper Admin birine lig hakkı verirken onu e-postasından
--  bulabilmeli. auth.users doğrudan okunamaz (gizli), bu yüzden üye
--  olurken e-posta buraya kopyalanır. 01-04'ten SONRA çalıştır.
-- =====================================================================

create table if not exists public.profiller (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  email    text,
  ad       text,
  created  timestamptz not null default now()
);

-- Üye olunca otomatik profil oluştur
create or replace function public.trg_yeni_profil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiller(user_id, email, ad)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (user_id) do update set email = excluded.email;
  return new;
end $$;
drop trigger if exists t_yeni_profil on auth.users;
create trigger t_yeni_profil after insert on auth.users
  for each row execute function public.trg_yeni_profil();

-- Mevcut kullanıcıları da doldur (geçmişe dönük)
insert into public.profiller(user_id, email, ad)
select id, email, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name')
from auth.users
on conflict (user_id) do update set email = excluded.email;

-- Güvenlik: admin herkesi görür; kişi kendini görür
alter table public.profiller enable row level security;
drop policy if exists p_profil_sel on public.profiller;
create policy p_profil_sel on public.profiller for select to authenticated
  using (public.admin_mi() or user_id = auth.uid());
drop policy if exists p_profil_upd on public.profiller;
create policy p_profil_upd on public.profiller for update to authenticated
  using (public.admin_mi() or user_id = auth.uid()) with check (public.admin_mi() or user_id = auth.uid());

grant select on public.profiller to authenticated;
grant update on public.profiller to authenticated;
