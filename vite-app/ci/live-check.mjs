/* ForzaLig — CANLI site kontrolü (deploy sonrası, GERÇEK forzalig.com).
 * Kritik rotaları yükler; #root doluyor + JS hatası yok + supabase bağlandı doğrular.
 * Başarısızsa exit 2 → workflow auto-rollback tetikler. */
import { chromium } from 'playwright';
const BASE = process.env.LIVE_URL || 'https://forzalig.com';
const ROTALAR = ['/', '/?p=ligler', '/?p=profil', '/?p=sohbet'];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
let fail = false;
for (const yol of ROTALAR) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  let ok = false, sebep = '';
  try {
    await page.goto(BASE + yol, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(6000);
    const dolu = await page.evaluate(() => { const el = document.getElementById('root'); return !!el && el.innerHTML.trim().length > 80; });
    const sbOk = await page.evaluate(() => typeof window.supabase !== 'undefined');
    const real = errs.find(e => !/Load failed|Failed to fetch|NetworkError|Importing a module/i.test(e));
    if (real) sebep = 'JS: ' + real.slice(0, 150);
    else if (!dolu) sebep = '#root boş';
    else if (!sbOk) sebep = 'supabase yüklenmedi';
    else ok = true;
  } catch (e) { sebep = 'istisna: ' + e.message; }
  await page.close();
  console.log(`  ${ok ? '✔' : '✘'} ${BASE}${yol}${ok ? '' : '  → ' + sebep}`);
  if (!ok) fail = true;
}
await browser.close();
console.log(fail ? 'LIVE-CHECK: FAIL' : 'LIVE-CHECK: PASS');
process.exit(fail ? 2 : 0);
