// ForzaLig — CANLI radyo teşhisi (Cloudflare arkasındaki gerçek site).
// Amaç: radyonun neden çalışmadığını KANITLA (tahmin değil).
// 1) Canlı CSP başlığını oku → media-src/default-src Supabase'e izin veriyor mu?
// 2) Sayfayı gerçek tarayıcıyla aç → radyo bar DOM'da var mı?
// 3) radyo_liste'yi sayfadan (Supabase anon) oku → parça/URL var mı?
// 4) İlk parçayı bir <audio>'ya ver + play() dene → CSP/media/network hatasını yakala.
// Production'a YAZMAZ; yalnız dışarıdan gözlemler.
import { chromium } from 'playwright';
const BASE = process.env.RADYO_BASE || 'https://forzalig.com';
const bulgu = [];
const b = await chromium.launch();
const ctx = await b.newContext();
const p = await ctx.newPage();
const cspIhlal = [];
p.on('console', m => { const t = m.text(); if (/content security policy|refused to (load|connect)|media/i.test(t)) cspIhlal.push(t.slice(0, 200)); });

let cspHeader = '';
p.on('response', r => { if (r.url().replace(/[#?].*$/, '') === BASE + '/' || r.url() === BASE) { try { cspHeader = r.headers()['content-security-policy'] || ''; } catch (e) {} } });

const r = await p.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
if (!cspHeader) { try { cspHeader = (r && r.headers()['content-security-policy']) || ''; } catch (e) {} }
await p.waitForTimeout(4000);

// 1) CSP media-src analizi
const dir = {};
cspHeader.split(';').forEach(s => { const parts = s.trim().split(/\s+/); if (parts[0]) dir[parts[0]] = parts.slice(1).join(' '); });
const mediaKaynak = dir['media-src'] || dir['default-src'] || '(yok)';
const supaIzin = /supabase\.co/.test(mediaKaynak) || mediaKaynak === '*';
console.log('TAM_CSP_BASLANGIC>>>' + cspHeader + '<<<TAM_CSP_BITIS');
console.log('CSP media-src (veya default-src fallback):', mediaKaynak);
console.log('  → Supabase depoya media izni:', supaIzin ? 'VAR' : 'YOK ❌');
if (!supaIzin) bulgu.push('CSP media-src Supabase depoya izin VERMİYOR → <audio> engellenir: ' + mediaKaynak);

// 2) radyo bar DOM'da mı?
const barVar = await p.evaluate(() => !!document.body && /ForzaLig Radyo|FORZALIG RADYO|Yayın/.test(document.body.innerText)).catch(() => false);
console.log('radyo bar/metin DOM\'da:', barVar);

// 3) radyo_liste'yi PUBLIC REST (anon key) ile oku — sayfa origin'inden (connect-src supabase'e izinli)
const SB = 'https://crkestykdsnmfcmamxav.supabase.co';
const KEY = 'sb_publishable_sjfSVp0CmfnB4g8GecB0eA_BCHZheFB';
const liste = await p.evaluate(async ([sb, key]) => {
  try {
    const res = await fetch(sb + "/rest/v1/sistem_ayar?anahtar=eq.radyo_liste&select=deger", { headers: { apikey: key, Authorization: 'Bearer ' + key } });
    const j = await res.json();
    return (Array.isArray(j) && j[0]) ? j[0].deger : ('(REST http ' + res.status + ')');
  } catch (e) { return 'HATA: ' + String(e); }
}, [SB, KEY]).catch(e => 'evaluate hata: ' + e);
console.log('radyo_liste (sayfadan):', String(liste).slice(0, 200));

// 4) İlk parçayı çalmayı dene (CSP/media hatasını yakala)
let ilkUrl = null;
try { const arr = JSON.parse(liste); if (Array.isArray(arr) && arr[0] && arr[0].url) ilkUrl = arr[0].url; } catch (e) {}
if (ilkUrl) {
  console.log('test parça URL:', ilkUrl.slice(0, 80));
  const sonuc = await p.evaluate(async (u) => {
    return await new Promise(res => {
      const a = new Audio();
      let bitti = false;
      const f = (tag) => { if (bitti) return; bitti = true; res(tag); };
      a.onerror = () => f('AUDIO_ERROR code=' + (a.error && a.error.code) + ' msg=' + (a.error && a.error.message || ''));
      a.oncanplay = () => f('CANPLAY_OK');
      a.src = u;
      a.play().then(() => f('PLAY_OK')).catch(e => f('PLAY_REJECT: ' + (e && e.name) + ' ' + (e && e.message)));
      setTimeout(() => f('TIMEOUT_10s'), 10000);
    });
  }, ilkUrl).catch(e => 'evaluate hata: ' + e);
  console.log('audio play sonucu:', sonuc);
  if (/AUDIO_ERROR|REJECT/.test(String(sonuc))) bulgu.push('audio play başarısız: ' + sonuc);
} else {
  console.log('radyo_liste\'den test URL çıkarılamadı');
}

console.log('\nCSP ihlalleri (konsol):');
for (const c of cspIhlal.slice(0, 10)) console.log('  · ' + c);
// 5) ORBITAL sayfası tema uygulaması (canlı) — ?tema= :root'a uygulanıyor mu?
try {
  const tt = encodeURIComponent(JSON.stringify({ bg0: '#FFFFFF', bg1: '#F2F4F8', bg2: '#E8ECF2', line: '#00000018', tx: '#0A0E14', soft: '#556', mut: '#889', acc: '#1E63FF', acc2: '#00B4D8', gold: '#E8A800' }));
  await p.goto(BASE + '/orbital/?embed=1&tema=' + tt, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForTimeout(800);
  const rv = await p.evaluate(() => { const s = getComputedStyle(document.documentElement); return { bg0: s.getPropertyValue('--bg0').trim(), acc: s.getPropertyValue('--acc').trim(), pnl: s.getPropertyValue('--pnl').trim() }; }).catch(() => ({}));
  const okTema = (rv.bg0 || '').toUpperCase() === '#FFFFFF' && (rv.acc || '').toUpperCase() === '#1E63FF';
  console.log('\n/orbital/ tema uygulaması:', JSON.stringify(rv), '→', okTema ? '✅ tema uygulanıyor' : '❌ uygulanmıyor');
  if (!okTema) bulgu.push('/orbital/ ?tema= :root\'a uygulanmadı: ' + JSON.stringify(rv));
} catch (e) { console.log('orbital tema testi hata:', String(e).slice(0, 100)); }

console.log('\n=== TEŞHİS ÖZET ===');
if (bulgu.length) { for (const x of bulgu) console.log('  ❌ ' + x); }
else console.log('  Belirgin engel bulunamadı (bar:' + barVar + ', mediaIzin:' + supaIzin + ')');
await b.close();
