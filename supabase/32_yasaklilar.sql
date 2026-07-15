-- =====================================================================
--  ForzaLig — KULLANICI YASAKLAMA (Faz 3)
--  Süper admin bir kullanıcıyı yasaklar/askıya alır. Yasaklı kullanıcı
--  giriş yapınca "hesabın askıya alındı" ekranı görür.
--  Sadece adminler yazar; kullanıcı kendi durumunu okuyabilir.
--  Bir kez çalıştır. Idempotent.
-- =====================================================================

create table if not exists public.yasaklilar (
  user_id     uuid primary key,
  sebep       text,
  yasaklayan  uuid,
  tarih       timestamptz not null default now()
);

alter table public.yasaklilar enable row level security;

drop policy if exists p_yasak_sel on public.yasaklilar;
create policy p_yasak_sel on public.yasaklilar for select to authenticated
  using (user_id = auth.uid() or exists(select 1 from public.adminler a where a.user_id = auth.uid()));

drop policy if exists p_yasak_ins on public.yasaklilar;
create policy p_yasak_ins on public.yasaklilar for insert to authenticated
  with check (exists(select 1 from public.adminler a where a.user_id = auth.uid()));

drop policy if exists p_yasak_upd on public.yasaklilar;
create policy p_yasak_upd on public.yasaklilar for update to authenticated
  using (exists(select 1 from public.adminler a where a.user_id = auth.uid()))
  with check (exists(select 1 from public.adminler a where a.user_id = auth.uid()));

drop policy if exists p_yasak_del on public.yasaklilar;
create policy p_yasak_del on public.yasaklilar for delete to authenticated
  using (exists(select 1 from public.adminler a where a.user_id = auth.uid()));

grant select, insert, update, delete on public.yasaklilar to authenticated;
