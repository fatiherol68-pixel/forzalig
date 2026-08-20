# ForzaLig — Faz 7: Cloudflare Free + Güvenlik Başlıkları Planı

GitHub Pages özel HTTP başlığı koyamaz → gerçek CSP/HSTS/rate-limit için site
Cloudflare Free arkasına alınır. Bu belge **hazır config**'i içerir; en sondaki
tıkla-tıkla adımlar kullanıcı içindir. Production'a ancak Report-Only test
sonrası tam CSP açılır (yanlış CSP siteyi bozabilir).

## 1) DNS koruma (ZORUNLU — nameserver değişmeden önce)
Mevcut sağlayıcıda şu kayıtların TAMAMI yedeklenip Cloudflare'de birebir olmalı:
- `A` / `AAAA` — GitHub Pages: `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153` (forzalig.com) → **Proxied (turuncu)**
- `CNAME` — varsa `www` → `<kullanıcı>.github.io` → Proxied
- `MX` — e-posta (varsa) → **DNS only (gri)**, birebir korunur
- `TXT` — `SPF` (v=spf1…), domain doğrulama → korunur
- `TXT` — `DKIM` (seçici._domainkey…) → korunur
- `TXT` — `DMARC` (_dmarc) → korunur
Kural: MX/TXT/SPF/DKIM/DMARC eksikse **e-posta durur** → nameserver değiştirme.

## 2) Güvenlik başlıkları (Cloudflare → Rules → Transform Rules → Response Headers)
Sitenin gerçek dış kaynaklarına göre türetildi (Vite build; runtime babel yok →
`unsafe-eval` yok). Önce **CSP'yi Report-Only** ver, 1-2 gün konsolu izle,
kırılma yoksa gerçek `Content-Security-Policy`'ye çevir.

**Content-Security-Policy (Report-Only ile başla):**
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://browser.sentry-cdn.com https://www.clarity.ms;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://*.sentry.io https://*.clarity.ms https://www.clarity.ms;
frame-src 'self' https://accounts.google.com;
worker-src 'self';
manifest-src 'self';
base-uri 'self';
form-action 'self';
object-src 'none';
frame-ancestors 'self';
upgrade-insecure-requests
```
Not: `script-src 'unsafe-inline'` — index.html'de SW-kayıt gibi satır-içi
script'ler var; harici enjeksiyonu yine engeller. İleride nonce/hash'e
sıkılaştırılabilir (build değişikliği ister).

**Diğer başlıklar (doğrudan gerçek olarak eklenebilir):**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: microphone=(self), camera=(self), autoplay=(self), fullscreen=(self), display-capture=(self)
X-Frame-Options: SAMEORIGIN
Cross-Origin-Opener-Policy: same-origin-allow-popups
```
HSTS `preload` EKLEME (tüm subdomain'ler kalıcı HTTPS olmadan risklidir).

## 3) Rate limit (Cloudflare Free — Security → WAF → Rate limiting rules)
Free planda 1 kural: aşırı istek/bot koruması.
- Eşleşme: `http.request.uri.path contains "/"` (tüm site)
- Kural: aynı IP'den **100 istek / 10 sn** üzeri → 10 sn blokla (challenge).
Sınır (dürüst): asıl API **Supabase** ayrı alan adında (supabase.co), Cloudflare
arkasında değil → onu Cloudflare rate-limit'i KAPSAMAZ. Supabase tarafı zaten
RLS + revoke ile korunuyor; app RPC'leri authenticated. Cloudflare rate-limit
yalnız statik siteyi/botları sınırlar.

## 4) SSL/TLS
Cloudflare → SSL/TLS → **Full** (GitHub Pages HTTPS sunar). "Flexible" KULLANMA.
Always Use HTTPS: **On**. Automatic HTTPS Rewrites: On.

## 5) Doğrulama
- Aktivasyon sonrası: https://securityheaders.com/?q=forzalig.com → A/A+ hedef.
- Konsol'da CSP ihlali (Report-Only) yoksa gerçek CSP'ye geç.
- E-posta testi: bir test maili gönder/al (MX korunmuş mu).
