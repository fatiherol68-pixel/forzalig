-- =====================================================================
--  ForzaLig — GÜVENLİK (RLS · Row Level Security)  · Karar 8
--  Her tabloda "kim ne yapabilir" kuralı SUNUCUDA. Tarayıcıdan
--  atlatılamaz. 01_sema.sql'den SONRA çalıştır.
--
--  Roller:
--   anon           → üye olmayan ziyaretçi (sadece okuma, KVKK view'leri)
--   authenticated  → üye (oyuncu/taraftar/yönetici)
--   admin_mi()     → Süper Admin (her şeye yetkili)
--  "lig yöneticisi" = ligler.yonetici_id = auth.uid()
-- =====================================================================

-- Yardımcı: bu ligin yöneticisi ben miyim? (admin de sayılır)
create or replace function public.lig_yoneticim(l uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.admin_mi()
      or exists(select 1 from public.ligler g where g.id = l and g.yonetici_id = auth.uid());
$$;

-- Yardımcı: bu takımın yöneticisi/lig yöneticisi/admin miyim?
create or replace function public.takim_yoneticim(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.takimlar tk
    join public.ligler g on g.id = tk.lig_id
    where tk.id = t
      and (public.admin_mi() or g.yonetici_id = auth.uid() or tk.yonetici_id = auth.uid())
  );
$$;

-- ---- RLS'i tüm tablolarda AÇ ----
alter table public.adminler      enable row level security;
alter table public.lig_haklari   enable row level security;
alter table public.ligler        enable row level security;
alter table public.takimlar      enable row level security;
alter table public.oyuncular     enable row level security;
alter table public.oyuncu_takim  enable row level security;
alter table public.transferler   enable row level security;
alter table public.maclar        enable row level security;
alter table public.mac_sonuc_log enable row level security;
alter table public.mac_olaylari  enable row level security;
alter table public.ilk11         enable row level security;
alter table public.katilim       enable row level security;

-- =====================================================================
-- ADMINLER — sadece adminler görür/yönetir
-- =====================================================================
drop policy if exists p_adminler_sel on public.adminler;
create policy p_adminler_sel on public.adminler for select
  using (public.admin_mi() or user_id = auth.uid());
drop policy if exists p_adminler_all on public.adminler;
create policy p_adminler_all on public.adminler for all
  using (public.admin_mi()) with check (public.admin_mi());

-- =====================================================================
-- LİG HAKLARI — kişi kendi hakkını görür; sadece admin değiştirir
-- =====================================================================
drop policy if exists p_hak_sel on public.lig_haklari;
create policy p_hak_sel on public.lig_haklari for select
  using (public.admin_mi() or user_id = auth.uid());
drop policy if exists p_hak_yaz on public.lig_haklari;
create policy p_hak_yaz on public.lig_haklari for all
  using (public.admin_mi()) with check (public.admin_mi());

-- =====================================================================
-- LİGLER — herkes okur (madde 1). Oluşturma: hakkı olan üye (K3).
--          Güncelleme/silme: lig yöneticisi veya admin.
-- =====================================================================
drop policy if exists p_lig_sel on public.ligler;
create policy p_lig_sel on public.ligler for select using (true);   -- ziyaretçi de görür

drop policy if exists p_lig_ins on public.ligler;
create policy p_lig_ins on public.ligler for insert to authenticated
  with check (
    yonetici_id = auth.uid()
    and (
      public.admin_mi()
      or exists(  -- K3: kalan hakkı olmalı
        select 1 from public.lig_haklari h
        where h.user_id = auth.uid() and h.toplam > h.kullanilan
      )
    )
  );

drop policy if exists p_lig_upd on public.ligler;
create policy p_lig_upd on public.ligler for update
  using (public.lig_yoneticim(id)) with check (public.lig_yoneticim(id));

-- Silme: madde 22 — hiç maç yoksa yönetici; admin her zaman.
drop policy if exists p_lig_del on public.ligler;
create policy p_lig_del on public.ligler for delete
  using (
    public.admin_mi()
    or ( ligler.yonetici_id = auth.uid()
         and not exists(select 1 from public.maclar m where m.lig_id = ligler.id and m.oynandi) )
  );

-- =====================================================================
-- TAKIMLAR — herkes okur. Yazma: lig yöneticisi/admin.
-- =====================================================================
drop policy if exists p_takim_sel on public.takimlar;
create policy p_takim_sel on public.takimlar for select using (true);
drop policy if exists p_takim_ins on public.takimlar;
create policy p_takim_ins on public.takimlar for insert to authenticated
  with check (public.lig_yoneticim(lig_id));
drop policy if exists p_takim_upd on public.takimlar;
create policy p_takim_upd on public.takimlar for update
  using (public.lig_yoneticim(lig_id)) with check (public.lig_yoneticim(lig_id));
-- Silme: madde 23 — maç yapılmamışsa; admin her zaman.
drop policy if exists p_takim_del on public.takimlar;
create policy p_takim_del on public.takimlar for delete
  using (
    public.admin_mi()
    or ( public.lig_yoneticim(lig_id)
         and not exists(select 1 from public.maclar m
                where m.oynandi and (m.ev_takim_id = takimlar.id or m.dep_takim_id = takimlar.id)) )
  );

-- =====================================================================
-- OYUNCULAR — HASSAS. Ziyaretçi burayı GÖREMEZ (oyuncular_acik view'i var).
--  Görebilen: kendi kariyerini sahiplenen üye + o oyuncunun bir takımının
--  lig yöneticisi + admin. Yazma da aynı yetkililer.
-- =====================================================================
drop policy if exists p_oyuncu_sel on public.oyuncular;
create policy p_oyuncu_sel on public.oyuncular for select to authenticated
  using (
    public.admin_mi()
    or sahip_user_id = auth.uid()
    or exists(
      select 1 from public.oyuncu_takim ot
      join public.ligler g on g.id = ot.lig_id
      where ot.player_id = oyuncular.player_id and g.yonetici_id = auth.uid()
    )
  );
drop policy if exists p_oyuncu_ins on public.oyuncular;
create policy p_oyuncu_ins on public.oyuncular for insert to authenticated with check (true);
drop policy if exists p_oyuncu_upd on public.oyuncular;
create policy p_oyuncu_upd on public.oyuncular for update to authenticated
  using (
    public.admin_mi()
    or sahip_user_id = auth.uid()
    or exists(
      select 1 from public.oyuncu_takim ot
      join public.ligler g on g.id = ot.lig_id
      where ot.player_id = oyuncular.player_id and g.yonetici_id = auth.uid()
    )
  ) with check (true);
-- Silme YOK (madde 24: oyuncu silinmez, pasif yapılır) — sadece admin acil durum.
drop policy if exists p_oyuncu_del on public.oyuncular;
create policy p_oyuncu_del on public.oyuncular for delete using (public.admin_mi());

-- =====================================================================
-- OYUNCU_TAKIM — herkes okur (kadro görünür). Yazma: lig yöneticisi/admin.
-- =====================================================================
drop policy if exists p_ot_sel on public.oyuncu_takim;
create policy p_ot_sel on public.oyuncu_takim for select using (true);
drop policy if exists p_ot_yaz on public.oyuncu_takim;
create policy p_ot_yaz on public.oyuncu_takim for all to authenticated
  using (public.lig_yoneticim(lig_id)) with check (public.lig_yoneticim(lig_id));

-- =====================================================================
-- TRANSFERLER — madde 13 zinciri. Okuma: ilgili lig yöneticisi/admin/
--  sahiplenmiş oyuncu. Yazma akışı uygulamada; RLS kaba kapıyı tutar.
-- =====================================================================
drop policy if exists p_transfer_sel on public.transferler;
create policy p_transfer_sel on public.transferler for select to authenticated
  using (
    public.admin_mi()
    or public.lig_yoneticim(lig_id)
    or exists(select 1 from public.oyuncular o where o.player_id = transferler.player_id and o.sahip_user_id = auth.uid())
  );
drop policy if exists p_transfer_ins on public.transferler;
create policy p_transfer_ins on public.transferler for insert to authenticated with check (true);
drop policy if exists p_transfer_upd on public.transferler;
create policy p_transfer_upd on public.transferler for update to authenticated
  using (
    public.admin_mi()
    or public.lig_yoneticim(lig_id)
    or exists(select 1 from public.oyuncular o where o.player_id = transferler.player_id and o.sahip_user_id = auth.uid())
  ) with check (true);

-- =====================================================================
-- MAÇLAR — herkes okur (madde 1). Yazma: lig yöneticisi/admin (madde 16/17).
-- =====================================================================
drop policy if exists p_mac_sel on public.maclar;
create policy p_mac_sel on public.maclar for select using (true);
drop policy if exists p_mac_yaz on public.maclar;
create policy p_mac_yaz on public.maclar for all to authenticated
  using (public.lig_yoneticim(lig_id)) with check (public.lig_yoneticim(lig_id));

-- =====================================================================
-- MAÇ OLAYLARI / İLK 11 / SONUÇ LOGU — okuma herkese, yazma yetkiliye
-- =====================================================================
drop policy if exists p_olay_sel on public.mac_olaylari;
create policy p_olay_sel on public.mac_olaylari for select using (true);
drop policy if exists p_olay_yaz on public.mac_olaylari;
create policy p_olay_yaz on public.mac_olaylari for all to authenticated
  using (exists(select 1 from public.maclar m where m.id = mac_olaylari.mac_id and public.lig_yoneticim(m.lig_id)))
  with check (exists(select 1 from public.maclar m where m.id = mac_olaylari.mac_id and public.lig_yoneticim(m.lig_id)));

drop policy if exists p_ilk11_sel on public.ilk11;
create policy p_ilk11_sel on public.ilk11 for select using (true);
drop policy if exists p_ilk11_yaz on public.ilk11;
create policy p_ilk11_yaz on public.ilk11 for all to authenticated
  using (exists(select 1 from public.maclar m where m.id = ilk11.mac_id and public.lig_yoneticim(m.lig_id)))
  with check (exists(select 1 from public.maclar m where m.id = ilk11.mac_id and public.lig_yoneticim(m.lig_id)));

drop policy if exists p_log_sel on public.mac_sonuc_log;
create policy p_log_sel on public.mac_sonuc_log for select using (true);  -- şeffaflık: herkes görür
-- log'a yazma tetikleyici ile olur (aşağıdaki 03 dosyası), doğrudan yazma admin:
drop policy if exists p_log_yaz on public.mac_sonuc_log;
create policy p_log_yaz on public.mac_sonuc_log for all using (public.admin_mi()) with check (public.admin_mi());

-- =====================================================================
-- KATILIM — herkes okur. Yazma: oyuncunun kendisi (sahiplenmiş) veya yönetici.
-- =====================================================================
drop policy if exists p_katilim_sel on public.katilim;
create policy p_katilim_sel on public.katilim for select using (true);
drop policy if exists p_katilim_yaz on public.katilim;
create policy p_katilim_yaz on public.katilim for all to authenticated
  using (
    public.admin_mi()
    or exists(select 1 from public.oyuncular o where o.player_id = katilim.player_id and o.sahip_user_id = auth.uid())
    or exists(select 1 from public.maclar m where m.id = katilim.mac_id and public.lig_yoneticim(m.lig_id))
  ) with check (true);

-- =====================================================================
-- GRANT'ler — anon (ziyaretçi) ve authenticated (üye) erişimi
-- =====================================================================
grant usage on schema public to anon, authenticated;

-- Ziyaretçi (anon): sadece OKUMA, herkese açık tablolar + KVKK view
grant select on public.ligler, public.takimlar, public.oyuncu_takim,
                 public.maclar, public.mac_olaylari, public.ilk11,
                 public.mac_sonuc_log, public.katilim,
                 public.oyuncular_acik
  to anon, authenticated;

-- Üye (authenticated): yazma yetkisi olan tablolar (RLS zaten sınırlıyor)
grant select, insert, update, delete on
  public.ligler, public.takimlar, public.oyuncular, public.oyuncu_takim,
  public.transferler, public.maclar, public.mac_olaylari, public.ilk11,
  public.katilim
  to authenticated;
grant select, insert, update on public.mac_sonuc_log to authenticated;
grant select on public.lig_haklari, public.adminler to authenticated;

-- oyuncular tablosunu anon GÖREMEZ (sadece view). Güvence:
revoke select on public.oyuncular from anon;
