// ForzaLig — E2E (Playwright). Staging build'e karşı: render + konsol/crash/404
// + (opsiyonel) login akışı. BASE ve giriş bilgileri env ile verilir.
import { chromium } from 'playwright';
const BASE = process.env.E2E_BASE || 'http://localhost:8080';
const EMAIL = process.env.E2E_EMAIL, PASS = process.env.E2E_PASS;
const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
const fatal = [];
p.on('pageerror', e => fatal.push('pageerror: ' + (e && e.message)));
p.on('response', r => { if (r.status() >= 500) fatal.push('http ' + r.status() + ' ' + r.url()); });
let ok = true;
try {
  const r = await p.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  if (!r || r.status() >= 400) fatal.push('doküman HTTP ' + (r && r.status()));
  const txt = await p.evaluate(() => document.body?.innerText?.length || 0).catch(() => 0);
  if (txt < 20) fatal.push('sayfa boş');
  console.log('render: HTTP', r && r.status(), '| içerik', txt, '| fatal', fatal.length);
  // Gerçek login E2E: staging auth ile signup → session'ı localStorage'a enjekte → reload
  const SB = process.env.STAGING_URL, KEY = process.env.STAGING_ANON_KEY;
  if (SB && KEY) {
    const email = `e2e_${Date.now()}@test.local`, sifre = 'E2eGuclu!2026';
    const reg = await fetch(`${SB}/auth/v1/signup`, { method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: sifre }) }).then(r => r.json()).catch(e => ({ error: String(e) }));
    const sess = reg.access_token ? reg : (reg.session || null);
    if (!sess || !sess.access_token) { fatal.push('signup/session alınamadı: ' + JSON.stringify(reg).slice(0,180)); }
    else {
      const ref = SB.replace('https://', '').split('.')[0];
      const token = JSON.stringify({ access_token: sess.access_token, refresh_token: sess.refresh_token,
        token_type: 'bearer', expires_in: sess.expires_in || 3600,
        expires_at: Math.floor(Date.now()/1000) + (sess.expires_in || 3600), user: sess.user });
      await p.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch(e){} }, [`sb-${ref}-auth-token`, token]);
      await p.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
      await p.waitForTimeout(4000);
      const t2 = await p.evaluate(() => document.body?.innerText?.length || 0).catch(() => 0);
      console.log('login sonrası içerik uzunluğu:', t2);
      // giriş yapılınca içerik login ekranından belirgin biçimde büyümeli
      if (t2 <= 200) fatal.push('login sonrası içerik login ekranı gibi (RLS/oturum başarısız?): ' + t2);
      else console.log('✅ login + RLS okuma: giriş-sonrası uygulama yüklendi (' + t2 + ' karakter)');
    }
  }
} catch (e) { fatal.push('goto: ' + (e && e.message)); }
for (const f of fatal.slice(0, 15)) console.log('  ✗ ' + f);
await b.close();
if (fatal.length) { console.log('❌ E2E FAIL'); process.exit(1); } else console.log('✅ E2E PASS');
