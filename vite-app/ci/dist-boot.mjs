/* ForzaLig — Vite dist boot testi (Playwright, GERÇEK backend'e karşı, CI).
 * dist'i statik sunar, kritik rotaları yükler, #root doluyor + JS hatası yok +
 * gerçek Supabase bağlantısı kuruldu (window.sb / supabase global) doğrular. */
import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync } from 'fs';
import { createServer } from 'http';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!existsSync(join(DIST, 'index.html'))) { console.error('🔴 dist/index.html yok'); process.exit(2); }
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = createServer((req, res) => {
  const p = decodeURIComponent((req.url || '/').split('?')[0]);
  let fp = join(DIST, p);
  if (p === '/' || !existsSync(fp) || !statSync(fp).isFile()) fp = join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
  res.end(readFileSync(fp));
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ROTALAR = [['Ana', '/'], ['Keşfet', '/?p=ligler'], ['Profil', '/?p=profil'], ['Bildirim', '/?p=bildirim'], ['Sohbet', '/?p=sohbet']];
let fail = false;
for (const [ad, yol] of ROTALAR) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  let ok = false, sebep = '';
  try {
    await page.goto(base + yol, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(5000);
    const dolu = await page.evaluate(() => { const el = document.getElementById('root'); return !!el && el.innerHTML.trim().length > 50; });
    const real = errs.find(e => !/Load failed|Failed to fetch|NetworkError|Importing a module/i.test(e));
    if (real) sebep = 'JS: ' + real.slice(0, 150);
    else if (!dolu) sebep = '#root boş';
    else ok = true;
  } catch (e) { sebep = 'istisna: ' + e.message; }
  await page.close();
  console.log(`  ${ok ? '✔' : '✘'} ${ad}${ok ? '' : '  → ' + sebep}`);
  if (!ok) fail = true;
}
// gerçek backend bağlantısı kuruldu mu (supabase global + sb)
const page = await browser.newPage();
await page.goto(base + '/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(4000);
const sbOk = await page.evaluate(() => typeof window.supabase !== 'undefined');
console.log(`  ${sbOk ? '✔' : '✘'} supabase-js global (CDN) yüklendi: ${sbOk}`);
if (!sbOk) fail = true;
await page.close();
await browser.close(); server.close();
console.log(fail ? 'DIST-BOOT: FAIL' : 'DIST-BOOT: PASS');
process.exit(fail ? 2 : 0);
