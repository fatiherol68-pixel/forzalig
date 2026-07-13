-- =====================================================================
--  ForzaLig — PUSH BİLDİRİM abonelikleri (Web Push / VAPID)
--  Tarayıcı push aboneliğini burada saklarız. Gönderme işini
--  supabase/functions/push-gonder Edge Function yapar.
--  01_sema.sql + 02_guvenlik.sql'den SONRA çalıştır.
-- =====================================================================

create table if not exists public.push_abonelikleri (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  endpoint  text not null unique,
  p256dh    text not null,
  auth      text not null,
  cihaz     text,                              -- opsiyonel: tarayıcı/cihaz notu
  olusma    timestamptz not null default now()
);
create index if not exists ix_push_user on public.push_abonelikleri(user_id);

alter table public.push_abonelikleri enable row level security;

-- Kendi aboneliğini ekler / görür / siler
drop policy if exists p_push_sel on public.push_abonelikleri;
create policy p_push_sel on public.push_abonelikleri for select to authenticated
  using (user_id = auth.uid());
drop policy if exists p_push_ins on public.push_abonelikleri;
create policy p_push_ins on public.push_abonelikleri for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists p_push_del on public.push_abonelikleri;
create policy p_push_del on public.push_abonelikleri for delete to authenticated
  using (user_id = auth.uid());

-- Not: Push GÖNDERME (bir bildirim düşünce ilgili kullanıcının tüm
-- aboneliklerine web-push atma) Edge Function + service_role ile yapılır.
-- VAPID anahtarları Edge Function ortam değişkenlerinde durur (client'a girmez).
