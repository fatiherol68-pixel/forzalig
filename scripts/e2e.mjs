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
  // Opsiyonel login E2E
  if (EMAIL && PASS) {
    // giriş ekranı: e-posta ile devam → form doldur (uygulamaya göre selector esnek)
    const emailInput = await p.$('input[type=email], input[placeholder*="posta" i], input[name*=mail i]');
    if (emailInput) {
      await emailInput.fill(EMAIL);
      const pass = await p.$('input[type=password]');
      if (pass) { await pass.fill(PASS); await p.keyboard.press('Enter'); await p.waitForTimeout(4000); }
      const t2 = await p.evaluate(() => document.body?.innerText?.length || 0).catch(() => 0);
      console.log('login sonrası içerik:', t2);
      if (t2 < 20) fatal.push('login sonrası boş');
    } else { console.log('login inputu bulunamadı (anon akış)'); }
  }
} catch (e) { fatal.push('goto: ' + (e && e.message)); }
for (const f of fatal.slice(0, 15)) console.log('  ✗ ' + f);
await b.close();
if (fatal.length) { console.log('❌ E2E FAIL'); process.exit(1); } else console.log('✅ E2E PASS');
