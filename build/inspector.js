/* ForzaLig Inspector — statik denetim raporu (Review Tool · Katman A)
   Canlı DB'ye DOKUNMAZ. index.html + supabase/*.sql'i statik analiz eder.
   Çıktı: build/rapor/rapor.md (insan+AI okur) + rapor.json.
   Çalıştır: node build/inspector.js */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const KOK = path.join(__dirname, '..');
const OUT_DIR = path.join(__dirname, 'rapor');
fs.mkdirSync(OUT_DIR, { recursive: true });

const oku = (p) => { try { return fs.readFileSync(path.join(KOK, p), 'utf8'); } catch (e) { return ''; } };
const say = (re, s) => (s.match(re) || []).length;

const html = oku('index.html');
const rapor = { olusma_utc: new Date().toISOString(), bolumler: {} };

// --- 1) Build/commit bilgisi ---
let commit = '', tarih = '', dal = '';
try {
  commit = execSync('git -C "' + KOK + '" rev-parse --short HEAD').toString().trim();
  tarih = execSync('git -C "' + KOK + '" log -1 --format=%cI').toString().trim();
  dal = execSync('git -C "' + KOK + '" rev-parse --abbrev-ref HEAD').toString().trim();
} catch (e) {}
rapor.bolumler.build = {
  commit, tarih, dal,
  index_html_boyut_kb: Math.round(html.length / 1024),
};

// --- 2) Bileşen / sayfa envanteri ---
const bilesenler = [...html.matchAll(/function ([A-Z][A-Za-z0-9]+)\s*\(/g)].map(m => m[1]);
const rotalar = [...html.matchAll(/case\s*"([a-zçğıöşü_]+)"\s*:/gi)].map(m => m[1]);
rapor.bolumler.envanter = {
  bilesen_sayisi: bilesenler.length,
  bilesenler: [...new Set(bilesenler)].sort(),
  rota_sayisi: [...new Set(rotalar)].length,
  rotalar: [...new Set(rotalar)].sort(),
};

// --- 3) Supabase şema / RLS / RPC envanteri (SQL statik) ---
const sqlDir = path.join(KOK, 'supabase');
let sqlHepsi = '';
let sqlDosyalar = [];
try {
  sqlDosyalar = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();
  sqlDosyalar.forEach(f => { sqlHepsi += '\n' + fs.readFileSync(path.join(sqlDir, f), 'utf8'); });
} catch (e) {}
const tablolar = [...new Set([...sqlHepsi.matchAll(/create table if not exists public\.([a-z0-9_]+)/g)].map(m => m[1]))].sort();
const rpcler = [...new Set([...sqlHepsi.matchAll(/create or replace function public\.([a-z0-9_]+)/g)].map(m => m[1]))].sort();
const rlsPolitikalar = say(/create policy/g, sqlHepsi);
const rlsAcik = [...new Set([...sqlHepsi.matchAll(/alter table public\.([a-z0-9_]+)\s+enable row level security/g)].map(m => m[1]))].sort();
rapor.bolumler.supabase = {
  sql_dosya_sayisi: sqlDosyalar.length,
  sql_dosyalar: sqlDosyalar,
  tablo_sayisi: tablolar.length,
  tablolar,
  rpc_sayisi: rpcler.length,
  rpcler,
  rls_politika_sayisi: rlsPolitikalar,
  rls_acik_tablo: rlsAcik,
};

// --- 4) Güvenlik / KVKK sinyalleri ---
const uyari = [];
if (/service_role/i.test(html)) uyari.push('KRİTİK: index.html içinde "service_role" geçiyor — asla client\'ta olmamalı!');
const rlssizTablo = tablolar.filter(t => !rlsAcik.includes(t));
if (rlssizTablo.length) uyari.push('DİKKAT: RLS açılmamış olabilecek tablolar: ' + rlssizTablo.join(', '));
if (!/oyuncular_acik/.test(sqlHepsi)) uyari.push('DİKKAT: KVKK view (oyuncular_acik) bulunamadı.');
if (say(/alert\(/g, html) > 30) uyari.push('BİLGİ: alert() kullanımı yüksek (' + say(/alert\(/g, html) + ') — UX için modal tercih edilebilir.');
rapor.bolumler.guvenlik = { uyari_sayisi: uyari.length, uyarilar: uyari };

// --- 5) PWA / performans sinyalleri ---
rapor.bolumler.pwa = {
  manifest_var: fs.existsSync(path.join(KOK, 'manifest.json')),
  sw_var: fs.existsSync(path.join(KOK, 'sw.js')),
  ikon_var: fs.existsSync(path.join(KOK, 'icons', 'icon-512.png')),
  sentry_var: /__FL_SENTRY_DSN/.test(html),
  lazy_chart: /chartYukle/.test(html),
  defer_cdn: say(/<script defer/g, html),
};

// --- Skor (kaba, ölçülen sinyallerden) ---
let skor = 100;
uyari.forEach(u => { if (u.startsWith('KRİTİK')) skor -= 30; else if (u.startsWith('DİKKAT')) skor -= 8; });
if (!rapor.bolumler.pwa.manifest_var) skor -= 5;
if (!rapor.bolumler.pwa.sw_var) skor -= 5;
skor = Math.max(0, Math.min(100, skor));
rapor.skor = skor;

// --- Markdown yaz (AI'ya verilebilir tek dosya) ---
const B = rapor.bolumler;
let md = `# ForzaLig Inspector Raporu\n\n`;
md += `- Oluşma: ${rapor.olusma_utc}\n- Commit: \`${B.build.commit}\` (${B.build.dal})\n- index.html: ${B.build.index_html_boyut_kb} KB\n- **Statik Skor: ${skor}/100**\n\n`;
md += `## Envanter\n- Bileşen: ${B.envanter.bilesen_sayisi}\n- Rota/sayfa: ${B.envanter.rota_sayisi} → ${B.envanter.rotalar.join(', ')}\n\n`;
md += `## Supabase (statik)\n- SQL dosya: ${B.supabase.sql_dosya_sayisi}\n- Tablo (${B.supabase.tablo_sayisi}): ${B.supabase.tablolar.join(', ')}\n- RPC (${B.supabase.rpc_sayisi}): ${B.supabase.rpcler.join(', ')}\n- RLS politika: ${B.supabase.rls_politika_sayisi}\n- RLS açık tablo: ${B.supabase.rls_acik_tablo.join(', ')}\n\n`;
md += `## Güvenlik / KVKK\n`;
md += uyari.length ? uyari.map(u => `- ${u}`).join('\n') + '\n\n' : '- ✅ Statik kontrollerde uyarı yok\n\n';
md += `## PWA / Performans\n- manifest: ${B.pwa.manifest_var ? '✅' : '❌'} · sw: ${B.pwa.sw_var ? '✅' : '❌'} · ikon: ${B.pwa.ikon_var ? '✅' : '❌'}\n- Sentry: ${B.pwa.sentry_var ? '✅' : '—'} · Chart lazy-load: ${B.pwa.lazy_chart ? '✅' : '—'} · defer CDN: ${B.pwa.defer_cdn}\n\n`;
md += `---\n*Bu rapor statik analizdir (canlı DB'ye dokunmadan). Öznel kalite/UX değerlendirmesi için raporu bir yapay zekâ CTO'ya ver.*\n`;

fs.writeFileSync(path.join(OUT_DIR, 'rapor.md'), md);
fs.writeFileSync(path.join(OUT_DIR, 'rapor.json'), JSON.stringify(rapor, null, 2));
console.log('Rapor yazıldı:', path.join(OUT_DIR, 'rapor.md'), '| Skor:', skor + '/100', '| Uyarı:', uyari.length);
