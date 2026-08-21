/* Faz 5 — Vite/ESM entry ÜRETİCİ (production-faithful).
 * Kaynak gerçeği ../index.html. Bu betik ondan türetir:
 *   index.html        → GERÇEK kabuk (head/SEO/PWA/SW-kayıt/stiller/flkart-js) korunur;
 *                       global React + babel script'leri kaldırılır (React bundle'dan gelir),
 *                       babel bloğu yerine module entry konur.
 *   src/main.jsx       → app-body'yi dinamik import eder (lazy chunk).
 *   src/app-body.jsx   → React ESM + window.React + tüm uygulama kodu (babel bloğu, createRoot dahil).
 * Kullanım: node uret.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminKumesiCikar } from './bol.mjs';

const VITE = path.dirname(fileURLToPath(import.meta.url));
const KOK = path.join(VITE, '..');
const src = fs.readFileSync(path.join(KOK, 'index.html'), 'utf8');

// 1) babel bloğunu çıkar
const startTag = '<script type="text/babel">';
const i = src.indexOf(startTag);
const codeStart = i + startTag.length;
const j = src.indexOf('</script>', codeStart);
const appKod = src.slice(codeStart, j);

// 2) production-faithful kabuk: global React + babel kaldır, babel bloğunu module entry ile değiştir
let shell = src.slice(0, i) + '<script type="module" src="/src/main.jsx"></script>' + src.slice(j + '</script>'.length);
shell = shell
  .replace('<script defer src="/react.production.min.js"></script>\n', '')
  .replace('<script defer src="/react-dom.production.min.js"></script>\n', '')
  .replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"></script>\n', '');
fs.writeFileSync(path.join(VITE, 'index.html'), shell);

// 3) entry: minik (kabukta zaten #fz-onsplash splash var) → sadece lazy import
fs.mkdirSync(path.join(VITE, 'src'), { recursive: true });
fs.writeFileSync(path.join(VITE, 'src/main.jsx'),
`import('./app-body.jsx');   // dinamik import → ayrı async chunk (lazy)\n`);

// 4) Faz 5 — admin kümesini lazy chunk'a çıkar (AST kesin). Başarısızsa TÜM kodu
//    tek parçada bırak (güvenli geri düşüş → build asla kırılmaz).
let govde = appKod, chunkKod = null, cikarilan = 0, depAdet = 0;
try {
  const r = adminKumesiCikar(appKod);
  govde = r.govde; chunkKod = r.chunk; cikarilan = r.cikarilan; depAdet = r.depList.length;
} catch (e) {
  console.warn('⚠ admin lazy-split atlandı (tek parça devam):', e.message);
}

// 5) app gövdesi: React ESM (bundle) + global uyum + uygulama kodu (rarity/stiller kabukta)
fs.writeFileSync(path.join(VITE, 'src/app-body.jsx'),
`import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
const ReactDOM = ReactDOMClient;                       // kod ReactDOM.createRoot kullanıyor
if (typeof window !== 'undefined') { window.React = React; window.ReactDOM = ReactDOM; }

// ==================== ForzaLig uygulama kodu (index.html babel bloğu) ====================
${govde}
`);

if (chunkKod) fs.writeFileSync(path.join(VITE, 'src/admin-chunk.jsx'), chunkKod);

console.log('vite-app faithful üretildi · appKod:', appKod.length, '→ gövde:', govde.length,
  '· admin-chunk:', chunkKod ? (cikarilan + ' char, ' + depAdet + ' dep') : 'YOK',
  '· shell:', shell.length,
  '· react/babel script kaldırıldı:', !shell.includes('react.production.min.js') && !shell.includes('babel-standalone'));
