-- Kaptan transfer isteği gönderebilsin ve görebilsin
-- Mevcut SELECT+UPDATE politikalarına takim_yoneticim ekleniyor

drop policy if exists p_transfer_sel on public.transferler;
create policy p_transfer_sel on public.transferler for select to authenticated
  using (
    public.admin_mi()
    or public.lig_yoneticim(lig_id)
    or exists(select 1 from public.takimlar tk where (tk.id = transferler.eski_takim_id or tk.id = transferler.yeni_takim_id) and tk.yonetici_id = auth.uid())
    or exists(select 1 from public.oyuncular o where o.player_id = transferler.player_id and o.sahip_user_id = auth.uid())
    or transferler.talep_eden = auth.uid()
  );

drop policy if exists p_transfer_upd on public.transferler;
create policy p_transfer_upd on public.transferler for update to authenticated
  using (
    public.admin_mi()
    or public.lig_yoneticim(lig_id)
  ) with check (true);
