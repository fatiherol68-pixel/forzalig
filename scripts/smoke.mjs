// ForzaLig — Canlı site duman testi (smoke test). ÜCRETSIZ.
// forzalig.com ve /orbital/ sayfalarını gerçek tarayıcıyla açar.
// FAIL koşulları (gerçek kırılma): doküman HTTP>=400, sayfa boş,
//   yakalanmamış JS hatası (pageerror), önemli kaynakta 404/istek hatası.
// console.error yalnız UYARI olarak loglanır (uygulamalar sık üretir) → FAIL etmez.
// Production'a DOKUNMAZ; yalnız dışarıdan doğrular.
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'https://forzalig.com';
const YOLLAR = ['/', '/orbital/'];

// Gürültü/3.taraf kaynaklarını FAIL saymayan filtre
const YOKSAY = [/favicon/i, /manifest/i, /analytics/i, /gtag/i, /google/i];
const onemli = (url) => !YOKSAY.some((re) => re.test(url));

const browser = await chromium.launch();
let toplamHata = 0;

for (const yol of YOLLAR) {
  const url = BASE + yol;
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const fatal = [];   // FAIL sebebi
  const uyari = [];   // yalnız bilgi

  page.on('console', (m) => { if (m.type() === 'error') uyari.push('console: ' + m.text()); });
  page.on('pageerror', (e) => fatal.push('pageerror: ' + (e && e.message)));
  page.on('requestfailed', (r) => {
    const txt = r.failure()?.errorText || '';
    if (onemli(r.url()) && !/ERR_ABORTED/i.test(txt)) fatal.push('requestfailed: ' + r.url() + ' — ' + txt);
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && onemli(r.url())) {
      const doc = r.url().replace(/[#?].*$/, '') === url.replace(/[#?].*$/, '');
      (doc || /\.(js|css)$/i.test(r.url()) ? fatal : uyari).push('http ' + r.status() + ': ' + r.url());
    }
  });

  let status = 0;
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    status = resp ? resp.status() : 0;
  } catch (e) {
    fatal.push('goto: ' + (e && e.message));
  }
  if (status && status >= 400) fatal.push('doküman HTTP ' + status);

  const metinUz = await page.evaluate(() => document.body?.innerText?.length || 0).catch(() => 0);
  if (metinUz <= 20) fatal.push('sayfa boş görünüyor (içerik uzunluğu ' + metinUz + ')');

  const ok = fatal.length === 0;
  console.log(`\n== ${url} ==`);
  console.log(`  HTTP: ${status} | içerik: ${metinUz} | fatal: ${fatal.length} | uyarı: ${uyari.length}`);
  for (const h of fatal.slice(0, 20)) console.log('   ✗ ' + h);
  for (const w of uyari.slice(0, 8)) console.log('   · ' + w);
  if (!ok) toplamHata++;

  await ctx.close();
}

await browser.close();

if (toplamHata > 0) {
  console.log(`\n❌ DUMAN TESTİ: FAIL (${toplamHata} sayfa gerçek hata verdi)`);
  process.exit(1);
} else {
  console.log('\n✅ DUMAN TESTİ: PASS');
}
