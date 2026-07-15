-- =====================================================================
--  ForzaLig — YARDIMCI (YEDEK) LİG YÖNETİCİSİ
--  Bir ligin ASIL yöneticisi (yonetici_id), o lige yardımcı yönetici
--  ekleyebilir. Yardımcı, o ligi yönetir (takım/maç/oyuncu düzenler) ama
--  KENDİNE ayrı lig hakkı ALMAZ (yeni lig kuramaz). İstenince çıkarılır.
--
--  Merkezi yetki fonksiyonu lig_yoneticim() güncellenir → tüm yazma
--  izinleri (takımlar/maçlar/oyuncular…) otomatik yardımcıyı da kapsar.
--  Bir kez çalıştır. Idempotent.
-- =====================================================================

create table if not exists public.lig_yardimci (
  lig_id  uuid not null references public.ligler(id) on delete cascade,
  user_id uuid not null,
  ekleyen uuid,
  tarih   timestamptz not null default now(),
  primary key (lig_id, user_id)
);

alter table public.lig_yardimci enable row level security;

-- Okuma: giriş yapan herkes (yönet paneli listesi + istemci yetki kontrolü)
drop policy if exists p_yrd_sel on public.lig_yardimci;
create policy p_yrd_sel on public.lig_yardimci for select to authenticated using (true);

-- Ekleme/çıkarma: SADECE ligin asıl yöneticisi veya süper admin
drop policy if exists p_yrd_ins on public.lig_yardimci;
create policy p_yrd_ins on public.lig_yardimci for insert to authenticated
  with check (public.admin_mi() or exists(select 1 from public.ligler g where g.id = lig_id and g.yonetici_id = auth.uid()));

drop policy if exists p_yrd_del on public.lig_yardimci;
create policy p_yrd_del on public.lig_yardimci for delete to authenticated
  using (public.admin_mi() or exists(select 1 from public.ligler g where g.id = lig_id and g.yonetici_id = auth.uid()));

grant select, insert, delete on public.lig_yardimci to authenticated;

-- MERKEZİ YETKİ FONKSİYONU — yardımcı yöneticiyi de "lig yöneticisi" say
create or replace function public.lig_yoneticim(l uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.admin_mi()
      or exists(select 1 from public.ligler g where g.id = l and g.yonetici_id = auth.uid())
      or exists(select 1 from public.lig_yardimci y where y.lig_id = l and y.user_id = auth.uid());
$$;
