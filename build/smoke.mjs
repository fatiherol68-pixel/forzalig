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
const page = await browser.newPage();
const hatalar = [];
const konsolHatalar = [];
page.on('pageerror', e => hatalar.push(e.message));
page.on('console', m => { if (m.type() === 'error') konsolHatalar.push(m.text()); });

let cikis = 0;
try {
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(4000); // React boot + splash

  // #root içi doldu mu? (uygulama render etti mi)
  const rootDolu = await page.evaluate(() => {
    const r = document.getElementById('root');
    return !!r && r.innerHTML.trim().length > 50;
  });

  console.log('Sayfa JS hataları:', hatalar.length);
  hatalar.forEach((e, i) => console.log(`  pageerror ${i + 1}: ${e.substring(0, 200)}`));
  console.log('#root render edildi:', rootDolu ? 'EVET' : 'HAYIR');
  // Konsol hatalarından ağ/CDN kaynaklı olanları bilgi amaçlı göster (fail sayma)
  if (konsolHatalar.length) console.log('Konsol error (bilgi):', konsolHatalar.length);

  if (hatalar.length > 0) { console.log('SMOKE: FAIL (JS hatası var)'); cikis = 1; }
  else if (!rootDolu) { console.log('SMOKE: FAIL (#root boş — uygulama render etmedi)'); cikis = 1; }
  else { console.log('SMOKE: PASS'); }
} catch (e) {
  console.error('SMOKE: FAIL (istisna):', e.message);
  cikis = 1;
} finally {
  await browser.close();
  server.close();
}
process.exit(cikis);
