-- =====================================================================
--  ForzaLig — GOOGLE PROFİL FOTOĞRAFI (kalıcı)
--  Google ile üye olan kullanıcının profil fotoğrafı (avatar_url/picture)
--  profiller.foto alanına otomatik gelsin. 05 ve 41'den SONRA çalıştır.
--  Kök neden: eski trigger yalnızca email+ad kopyalıyordu, foto boş kalıyordu.
-- =====================================================================

-- Güvenlik için foto kolonu yoksa ekle (41 çalışmadıysa da bozulmasın)
alter table public.profiller add column if not exists foto text;

-- Üye olunca: email + ad + foto (Google) kopyala. foto yalnızca boşsa güncellenir
-- (kullanıcının kendi yüklediği fotoğrafı ezmesin).
create or replace function public.trg_yeni_profil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiller(user_id, email, ad, foto)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (user_id) do update
    set email = excluded.email,
        foto  = coalesce(public.profiller.foto, excluded.foto);
  return new;
end $$;

-- Geçmişe dönük: fotosu boş olan tüm mevcut Google üyelerini doldur
update public.profiller p
set foto = coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
from auth.users u
where u.id = p.user_id
  and (p.foto is null or p.foto = '')
  and coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') is not null;
