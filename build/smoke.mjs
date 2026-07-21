// ForzaLig otomatik duman testi (smoke test)
// Derlenmiş compiled.html'i gerçek tarayıcıda açar, JS hatası var mı bakar.
// CI'da (GitHub Actions) internet olduğu için gerçek CDN + React yüklenir.
// Yerelde çalıştırmak için: node build/smoke.mjs [compiled.html yolu]
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML = process.argv[2] || join(__dirname, 'compiled.html');

if (!existsSync(HTML)) {
  console.error('HATA: compiled.html bulunamadı:', HTML, '(önce `node build/derle.js` çalıştır)');
  process.exit(1);
}

const html = readFileSync(HTML, 'utf8');

// Basit statik sunucu (file:// yerine http:// → service worker / fetch daha gerçekçi)
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/`;

const browser = await chromium.launch({ args: ['--no-sandbox'] });

// Ana ekranların her biri: yükle → #root doldu mu + JS hatası var mı (çıkış-yapmamış kullanıcı gözünden).
const ROTALAR = [
  { ad: 'Ana Sayfa',   yol: '/' },
  { ad: 'Keşfet',      yol: '/?p=ligler' },
  { ad: 'Profil',      yol: '/?p=profil' },
  { ad: 'Bildirim',    yol: '/?p=bildirim' },
  { ad: 'Takip',       yol: '/?p=takip' },
];

let cikis = 0;
const sonuclar = [];
for (const r of ROTALAR) {
  const page = await browser.newPage();
  const hatalar = [];
  page.on('pageerror', e => hatalar.push(e.message));
  let ok = false, sebep = '';
  try {
    await page.goto(url.replace(/\/$/, '') + r.yol, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(3500); // React boot + splash
    const rootDolu = await page.evaluate(() => {
      const el = document.getElementById('root');
      return !!el && el.innerHTML.trim().length > 50;
    });
    if (hatalar.length) sebep = 'JS hatası: ' + hatalar[0].substring(0, 120);
    else if (!rootDolu) sebep = '#root boş (render yok)';
    else ok = true;
  } catch (e) { sebep = 'istisna: ' + e.message; }
  await page.close();
  sonuclar.push({ ad: r.ad, ok, sebep });
  if (!ok) cikis = 1;
}

console.log('\n=== ForzaLig Duman Testi ===');
sonuclar.forEach(s => console.log(`  ${s.ok ? '✔' : '✘'} ${s.ad}${s.ok ? '' : '  → ' + s.sebep}`));
const gecti = sonuclar.filter(s => s.ok).length;
console.log(`\n${gecti}/${sonuclar.length} ekran geçti`);
console.log(cikis ? 'SMOKE: FAIL' : 'SMOKE: PASS');

await browser.close();
server.close();
process.exit(cikis);
