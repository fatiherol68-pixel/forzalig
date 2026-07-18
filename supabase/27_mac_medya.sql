-- 27 — Maç medyası (Canlı Yayın / Tam Maç / Röportaj) — platform-bağımsız
-- medya = { canli, tamMac, roportaj, canliAcik }
-- Platform (YouTube/Facebook/Instagram/TikTok/MP4) URL'den türetilir, saklanmaz.
-- Yeni platform eklendiğinde bu şema DEĞİŞMEZ (jsonb + istemci tarafı algılama).
alter table public.maclar add column if not exists medya jsonb;
