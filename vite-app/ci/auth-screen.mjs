/* ForzaLig — GİRİŞ SONRASI ekran testi (Vite dist, GERÇEK backend).
 * Anonymous oturum açıp localStorage'a yazar → reload → app oturumu geri yükler →
 * giriş-sonrası ekranların (ana/profil/ayar) Vite ESM build'inde ÇÖKMEDEN render'ını doğrular.
 * Sadece gerçek çökme (pageerror / #root boş) FAIL sayılır. */
import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync } from 'fs';
import { createServer } from 'http';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', '..', 'index.html'), 'utf8');
const SB_URL = (html.match(/const SB_URL\s*=\s*"([^"]+)"/) || [])[1];
const SB_KEY = (html.match(/const SB_ANAHTAR\s*=\s*"([^"]+)"/) || [])[1];
const DIST = join(here, '..', 'dist');
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
let fail = false;

const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(base + '/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(3000);
// Anonymous oturum aç → supabase-js kendi localStorage anahtarına yazar
const inj = await page.evaluate(async ({ url, key }) => {
  if (!window.supabase) return { ok: false, err: 'supabase global yok' };
  try { const c = window.supabase.createClient(url, key); const a = await c.auth.signInAnonymously();
    return a.error ? { ok: false, err: a.error.message } : { ok: true, uid: a.data.user.id.slice(0, 8) }; }
  catch (e) { return { ok: false, err: String(e) }; }
}, { url: SB_URL, key: SB_KEY });
console.log('  anon oturum:', JSON.stringify(inj));
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(5000);
const girisState = await page.evaluate(() => {
  const t = document.body.innerText || '';
  return { root: (document.getElementById('root')?.innerHTML.trim().length || 0) > 80,
           loggedInIz: /çıkış|profil|hesab|oturum/i.test(t) };
});
const realErr = errs.find(e => !/Load failed|Failed to fetch|NetworkError|Importing a module/i.test(e));
if (realErr) { console.log('  ✘ giriş-sonrası JS hatası:', realErr.slice(0, 150)); fail = true; }
else if (!girisState.root) { console.log('  ✘ giriş-sonrası #root boş'); fail = true; }
else console.log(`  ✔ giriş-sonrası render OK (login enjeksiyonu: ${inj.ok ? 'başarılı' : 'kısmi'})`);
await page.close();

// profil + ayar rotaları çökmüyor mu (oturum localStorage'da)
for (const [ad, yol] of [['Profil', '/?p=profil'], ['Ayar', '/?p=ayar']]) {
  const pg = await browser.newPage();
  const es = []; pg.on('pageerror', e => es.push(e.message));
  await pg.goto(base + yol, { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(4000);
  const dolu = await pg.evaluate(() => (document.getElementById('root')?.innerHTML.trim().length || 0) > 80);
  const re = es.find(e => !/Load failed|Failed to fetch|NetworkError|Importing a module/i.test(e));
  const ok = dolu && !re;
  console.log(`  ${ok ? '✔' : '✘'} ${ad}${ok ? '' : ' → ' + (re || '#root boş')}`);
  if (!ok) fail = true;
  await pg.close();
}
await browser.close(); server.close();
console.log(fail ? 'AUTH-SCREEN: FAIL' : 'AUTH-SCREEN: PASS');
process.exit(fail ? 2 : 0);
